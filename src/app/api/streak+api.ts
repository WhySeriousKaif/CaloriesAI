import { eq, sql } from 'drizzle-orm';

import { db, users } from '../../../db';
import { getAuthUserId, unauthorized } from '@/lib/server-auth';

/**
 * `GET /api/streak` — consecutive local days, ending today or yesterday, on
 * which the user logged at least one analysed meal.
 *
 * Yesterday counts as the anchor so the streak doesn't visibly reset the moment
 * midnight passes — it only breaks once a whole day goes by unlogged.
 *
 * The gaps-and-islands trick: number the distinct logged days, subtract the row
 * number from the date, and every unbroken run collapses to the same value. The
 * run containing today (or yesterday) is the current streak.
 */
export async function GET(request: Request) {
  const clerkUserId = await getAuthUserId(request);
  if (!clerkUserId) return unauthorized();

  try {
    const [user] = await db
      .select({ id: users.id, timezone: users.timezone })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!user) return Response.json({ streak: 0, lastLoggedDate: null });

    const tz = user.timezone ?? 'UTC';

    const rows = await db.execute<{ streak: number; last_logged: string | null }>(sql`
      with logged as (
        select distinct (logged_at at time zone ${tz})::date as day
        from meals
        where user_id = ${user.id} and status = 'completed'
      ),
      runs as (
        select day, day - (row_number() over (order by day))::int as grp
        from logged
      ),
      today as (select (now() at time zone ${tz})::date as d)
      select
        coalesce(count(*), 0)::int as streak,
        max(day)::text as last_logged
      from runs
      where grp = (
        select grp from runs
        where day in ((select d from today), (select d - 1 from today))
        order by day desc
        limit 1
      )
    `);

    const row = rows.rows[0];

    return Response.json({
      streak: row?.streak ?? 0,
      lastLoggedDate: row?.last_logged ?? null,
    });
  } catch (error) {
    console.error('[streak] GET failed:', error);
    // A broken streak query must not take a screen down with it.
    return Response.json({ streak: 0, lastLoggedDate: null });
  }
}
