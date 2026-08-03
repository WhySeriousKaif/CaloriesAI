import { and, desc, eq, gte, sql } from 'drizzle-orm';
import OpenAI from 'openai';
import { z } from 'zod';

import { db, meals, users } from '../../../db';
import { uploadToImageKit } from '@/lib/imagekit';
import { getAuthUserId, unauthorized } from '@/lib/server-auth';

const SYSTEM_PROMPT = `You are a clinical nutritionist estimating what is on a plate from a single photo.

Rules:
- is_food is false for anything that is not edible food or drink. When it is false, the other fields are ignored — return zeros and an empty name.
- name: what a person would call this meal, 2-4 words, no brand names. e.g. "Grilled chicken salad", "Chole Bhature".
- Estimate the portion actually visible, using the plate, cutlery or hand for scale. Do not return a generic per-100g figure.
- Account for how the food was cooked: fried items (bhatura, puri, samosa), oil-heavy gravies and curries, and rich sauces carry far more fat than they look.
- protein_g * 4 + carbs_g * 4 + fat_g * 9 should land within 10% of calories.`;

async function analyzeDirectWithOpenAI(base64Image: string) {
  const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing in environment variables');

  const openai = new OpenAI({ apiKey, timeout: 40_000 });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this food photo. Return a JSON object with: is_food (boolean), name (string), calories (number), protein_g (number), carbs_g (number), fat_g (number).',
          },
          {
            type: 'image_url',
            image_url: { url: base64Image },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty response');

  const out = JSON.parse(content);
  if (!out || !out.is_food) {
    return {
      name: 'Not food',
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      status: 'failed' as const,
      errorReason: 'not_food',
    };
  }

  const clamp = (val: any) => Math.max(0, Math.round(Number(val) || 0));
  return {
    name: out.name || 'Scanned Meal',
    calories: clamp(out.calories),
    proteinG: clamp(out.protein_g),
    carbsG: clamp(out.carbs_g),
    fatG: clamp(out.fat_g),
    status: 'completed' as const,
    errorReason: null,
  };
}

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

const logMealSchema = z.object({
  image: z.string().min(100).max(12_000_000), // ~9MB of JPEG once decoded
});

export async function POST(request: Request) {
  try {
    const clerkUserId = await getAuthUserId(request);
    if (!clerkUserId) return unauthorized();

    const body = await request.json().catch(() => null);
    const parsed = logMealSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid photo payload', issues: parsed.error.issues }, { status: 400 });
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!user) return Response.json({ error: 'Finish onboarding first' }, { status: 409 });

    const base64Image = parsed.data.image;

    // 1. Direct OpenAI Vision Analysis using Base64
    const aiResult = await analyzeDirectWithOpenAI(base64Image);

    // 2. Upload image to ImageKit CDN for permanent storage
    let imageUrl = base64Image;
    try {
      imageUrl = await uploadToImageKit(base64Image, `meal-${user.id}-${Date.now()}.jpg`);
    } catch (err) {
      console.warn('[meals] ImageKit upload fallback to direct image:', err);
    }

    // 3. Save completed meal row directly to DB
    const [meal] = await db
      .insert(meals)
      .values({
        userId: user.id,
        imageUrl,
        name: aiResult.name,
        calories: aiResult.calories,
        proteinG: aiResult.proteinG,
        carbsG: aiResult.carbsG,
        fatG: aiResult.fatG,
        status: aiResult.status,
        errorReason: aiResult.errorReason,
        loggedAt: new Date(),
      })
      .returning();

    return Response.json({ meal });
  } catch (error: any) {
    console.error('[meals] POST /api/meals error:', error);
    return Response.json(
      { error: error?.message || 'Failed to analyze meal photo' },
      { status: 500 }
    );
  }
}
