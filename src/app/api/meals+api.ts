import { tasks } from '@trigger.dev/sdk';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db, meals, users } from '../../../db';
import { uploadToImageKit } from '@/lib/imagekit';
import { getAuthUserId, unauthorized } from '@/lib/server-auth';
// Type-only: importing the task instance would bundle it into the server.
import type { analyzeMeal } from '../../../trigger/analyze-meal';

/** What a screen is allowed to see. `userId` and `triggerRunId` are internal. */
const MEAL_COLUMNS = {
  id: meals.id,
  imageUrl: meals.imageUrl,
  status: meals.status,
  name: meals.name,
  calories: meals.calories,
  proteinG: meals.proteinG,
  carbsG: meals.carbsG,
  fatG: meals.fatG,
  errorReason: meals.errorReason,
  loggedAt: meals.loggedAt,
};

/**
 * `GET /api/meals` — the signed-in user's meals, newest first, as a bare array.
 *
 * Three modes, because Home wants one day and History/Analytics want a window:
 *   ?date=YYYY-MM-DD  one local calendar day
 *   ?days=N           the last N local days, today inclusive
 *   (neither)         everything
 *
 * "Local" means the user's stored IANA zone. Postgres does the conversion
 * because it knows the DST history for that zone — the same arithmetic in JS
 * with a fixed offset is wrong twice a year.
 */
export async function GET(request: Request) {
  const clerkUserId = await getAuthUserId(request);
  if (!clerkUserId) return unauthorized();

  const params = new URL(request.url).searchParams;
  const date = params.get('date');
  const days = params.get('days');

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: 'Expected ?date=YYYY-MM-DD' }, { status: 400 });
  }

  const windowDays = days ? Number(days) : null;
  if (windowDays !== null && (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 400)) {
    return Response.json({ error: 'Expected ?days=1..400' }, { status: 400 });
  }

  try {
    const [user] = await db
      .select({ id: users.id, timezone: users.timezone })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    // No row yet (webhook still in flight, onboarding unfinished) is not an
    // error — they simply have no meals.
    if (!user) return Response.json([]);

    const tz = user.timezone ?? 'UTC';
    const filters = [eq(meals.userId, user.id)];

    if (date) {
      filters.push(sql`(${meals.loggedAt} AT TIME ZONE ${tz})::date = ${date}::date`);
    } else if (windowDays !== null) {
      filters.push(
        gte(
          meals.loggedAt,
          sql`(date_trunc('day', now() AT TIME ZONE ${tz}) - make_interval(days => ${windowDays - 1})) AT TIME ZONE ${tz}`
        )
      );
    }

    const rows = await db
      .select(MEAL_COLUMNS)
      .from(meals)
      .where(and(...filters))
      .orderBy(desc(meals.loggedAt));

    return Response.json(rows);
  } catch (error) {
    console.error('[meals] GET failed:', error);
    return Response.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }
}

/**
 * The photo arrives as base64 rather than multipart. Expo SDK 57 installs
 * `expo/fetch` as the global fetch on native, and that implementation cannot
 * read `{ uri }` FormData parts off disk — so a file upload from the app has to
 * be a string either way.
 */
const logMealSchema = z.object({
  image: z.string().min(100).max(12_000_000), // ~9MB of JPEG once decoded
});

/**
 * `POST /api/meals` — photo → an `analyzing` meal the client can watch.
 *
 * Three writes in one round trip: the image lands in ImageKit, the row lands in
 * the DB as `analyzing`, and `analyze-meal` starts. The handle's own
 * `publicAccessToken` is what the scan screen subscribes with, so there is no
 * separate `auth.createPublicToken` call.
 *
 * The route does not wait for the analysis — that is the task's job, and the
 * client watches the run over Realtime.
 */
export async function POST(request: Request) {
  const clerkUserId = await getAuthUserId(request);
  if (!clerkUserId) return unauthorized();

  const parsed = logMealSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid photo', issues: parsed.error.issues }, { status: 400 });
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  // The tabs' gate means an onboarded user always has a row; a missing one is a
  // bug, not a race, and inventing a user here would hide it.
  if (!user) return Response.json({ error: 'Finish onboarding first' }, { status: 409 });

  // No fallback: a meal whose photo never reached the CDN has nothing for the
  // model to read, and stuffing the base64 into a text column would bloat the
  // row by megabytes for a picture the UI still couldn't transform.
  let imageUrl: string;
  try {
    imageUrl = await uploadToImageKit(parsed.data.image, `meal-${user.id}-${Date.now()}.jpg`);
  } catch (error) {
    console.error('[meals] ImageKit upload failed:', error);
    return Response.json({ error: 'Could not upload your photo' }, { status: 502 });
  }

  const [meal] = await db.insert(meals).values({ userId: user.id, imageUrl }).returning();

  try {
    const handle = await tasks.trigger<typeof analyzeMeal>('analyze-meal', {
      mealId: meal.id,
      imageUrl,
    });

    await db.update(meals).set({ triggerRunId: handle.id }).where(eq(meals.id, meal.id));

    return Response.json({
      meal,
      runId: handle.id,
      publicAccessToken: handle.publicAccessToken,
    });
  } catch (error) {
    // A row left `analyzing` with nothing running is a spinner forever, so mark
    // it failed on the way out.
    console.error('[meals] Could not start analyze-meal:', error);
    await db
      .update(meals)
      .set({ status: 'failed', errorReason: 'trigger_unavailable' })
      .where(eq(meals.id, meal.id));

    return Response.json({ error: 'Could not start the analysis' }, { status: 502 });
  }
}
