import { verifyToken } from "@clerk/backend";
import { eq } from "drizzle-orm";

import { db } from "../../../db";
import { users } from "../../../db/schema";

/**
 * `POST /api/profile` — persist the onboarding answers + computed plan.
 * `GET  /api/profile` — read the current user's profile and targets.
 *
 * Authenticated with the Clerk session token the app sends as a Bearer header.
 *
 * The write is an **upsert on `clerk_user_id`**, deliberately mirroring the
 * `clerk-user-created` task. The webhook is asynchronous, so this request can
 * land before Clerk's `user.created` webhook does — or after. Both paths upsert,
 * so either order converges on exactly one row. See PLAN.md §"Race condition".
 */

async function requireUserId(request: Request): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    console.error("[profile] CLERK_SECRET_KEY is not set");
    return null;
  }

  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return null;

  try {
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch (error) {
    console.error("[profile] Token verification failed:", error);
    return null;
  }
}

type ProfileBody = {
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  goal?: string;
  targetWeightKg?: number;
  activityLevel?: string;
  dietPreference?: string;
  unitPreference?: string;
  timezone?: string;
  dailyCalories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
};

/**
 * Reject implausible numbers rather than writing them. These come from the
 * client, and a bad value here is silent — it just shows up as wrong targets.
 */
function validate(body: ProfileBody): string | null {
  const inRange = (value: number | undefined, min: number, max: number) =>
    value === undefined || (Number.isFinite(value) && value >= min && value <= max);

  if (!inRange(body.heightCm, 50, 280)) return "heightCm out of range";
  if (!inRange(body.weightKg, 20, 500)) return "weightKg out of range";
  if (!inRange(body.targetWeightKg, 20, 500)) return "targetWeightKg out of range";
  if (!inRange(body.dailyCalories, 1000, 6000)) return "dailyCalories out of range";
  if (!inRange(body.proteinG, 0, 600)) return "proteinG out of range";
  if (!inRange(body.carbsG, 0, 1000)) return "carbsG out of range";
  if (!inRange(body.fatG, 0, 500)) return "fatG out of range";

  return null;
}

/** `numeric` columns round-trip as strings in Drizzle, to avoid float precision loss. */
const asNumeric = (value: number | undefined) =>
  value === undefined ? undefined : String(value);

export async function POST(request: Request) {
  const clerkUserId = await requireUserId(request);
  if (!clerkUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ProfileBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const invalid = validate(body);
  if (invalid) {
    return Response.json({ error: invalid }, { status: 400 });
  }

  const now = new Date();
  const hasPlan = body.dailyCalories !== undefined;

  const fields = {
    gender: body.gender,
    heightCm: asNumeric(body.heightCm),
    weightKg: asNumeric(body.weightKg),
    goal: body.goal,
    targetWeightKg: asNumeric(body.targetWeightKg),
    activityLevel: body.activityLevel,
    dietPreference: body.dietPreference,
    unitPreference: body.unitPreference,
    timezone: body.timezone,
    dailyCalories: body.dailyCalories,
    proteinG: body.proteinG,
    carbsG: body.carbsG,
    fatG: body.fatG,
    planGeneratedAt: hasPlan ? now : undefined,
    onboardingCompletedAt: now,
    updatedAt: now,
  };

  try {
    const [row] = await db
      .insert(users)
      .values({ clerkUserId, ...fields })
      .onConflictDoUpdate({
        target: users.clerkUserId,
        // `email` is deliberately absent — the Clerk webhook owns that column.
        set: fields,
      })
      .returning();

    return Response.json({ profile: row });
  } catch (error) {
    console.error("[profile] Upsert failed:", error);
    return Response.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const clerkUserId = await requireUserId(request);
  if (!clerkUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!row) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    return Response.json({ profile: row });
  } catch (error) {
    console.error("[profile] Read failed:", error);
    return Response.json({ error: "Failed to read profile" }, { status: 500 });
  }
}
