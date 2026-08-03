import { createClerkClient, verifyToken } from "@clerk/backend";
import { eq } from "drizzle-orm";

import { db } from "../../../db";
import { users } from "../../../db/schema";

/**
 * `POST /api/profile` — persist the onboarding answers + OpenAI generated plan.
 * `GET  /api/profile` — read the current user's profile and targets.
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

const asNumeric = (value: number | undefined) =>
  value === undefined ? undefined : String(value);

async function calculatePlanWithAI(body: ProfileBody): Promise<{
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  planRationale: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a clinical nutritionist AI. Calculate daily targets for calories, protein in grams, carbs in grams, and fat in grams based on user physical metrics. Return ONLY valid JSON with keys: dailyCalories (number), proteinG (number), carbsG (number), fatG (number), planRationale (short string).",
            },
            {
              role: "user",
              content: JSON.stringify({
                gender: body.gender || "male",
                heightCm: body.heightCm || 175,
                weightKg: body.weightKg || 75,
                targetWeightKg: body.targetWeightKg || 70,
                goal: body.goal || "lose",
                activityLevel: body.activityLevel || "moderate",
                dietPreference: body.dietPreference || "classic",
              }),
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const content = JSON.parse(json.choices[0].message.content);
        if (
          content.dailyCalories &&
          content.proteinG &&
          content.carbsG &&
          content.fatG
        ) {
          return {
            dailyCalories: Math.round(content.dailyCalories),
            proteinG: Math.round(content.proteinG),
            carbsG: Math.round(content.carbsG),
            fatG: Math.round(content.fatG),
            planRationale:
              content.planRationale ||
              "Calculated using AI personalized metabolic profiling.",
          };
        }
      }
    } catch (err) {
      console.warn("[profile] OpenAI plan calculation failed, using fallback formula:", err);
    }
  }

  // Fallback scientific formula (Mifflin-St Jeor)
  const weight = body.weightKg || 72;
  const height = body.heightCm || 175;
  const isFemale = body.gender === "female";
  const bmr = 10 * weight + 6.25 * height - 5 * 28 + (isFemale ? -161 : 5);

  const mults: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
    extra: 1.9,
  };
  const tdee = bmr * (mults[body.activityLevel || "moderate"] || 1.55);

  let targetCals = tdee;
  if (body.goal === "lose") targetCals -= 450;
  else if (body.goal === "gain") targetCals += 350;

  const calories = Math.round(Math.max(1200, Math.min(4500, targetCals)));
  const proteinG = Math.round(weight * 2.0);
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.round((calories - proteinG * 4 - fatG * 9) / 4);

  return {
    dailyCalories: calories,
    proteinG: Math.max(40, proteinG),
    carbsG: Math.max(50, carbsG),
    fatG: Math.max(25, fatG),
    planRationale: "Personalized targets based on Mifflin-St Jeor formula and metabolic activity.",
  };
}

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

  // Fetch verified email from Clerk SDK so email column is never null
  let userEmail: string | null = null;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (secretKey) {
    try {
      const clerk = createClerkClient({ secretKey });
      const clerkUser = await clerk.users.getUser(clerkUserId);
      userEmail =
        clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
          ?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        null;
    } catch (e) {
      console.warn("[profile] Could not fetch user from Clerk SDK:", e);
    }
  }

  const now = new Date();

  // If dailyCalories is not explicitly passed or client sent default values, run OpenAI / formula calculation
  let calculated = {
    dailyCalories: body.dailyCalories,
    proteinG: body.proteinG,
    carbsG: body.carbsG,
    fatG: body.fatG,
    planRationale: "Personalized targets calculated from your onboarding profile.",
  };

  if (!body.dailyCalories || !body.proteinG) {
    calculated = await calculatePlanWithAI(body);
  }

  const fields = {
    ...(userEmail ? { email: userEmail } : {}),
    gender: body.gender || "male",
    heightCm: asNumeric(body.heightCm || 175),
    weightKg: asNumeric(body.weightKg || 72),
    goal: body.goal || "lose",
    targetWeightKg: asNumeric(body.targetWeightKg || 65),
    activityLevel: body.activityLevel || "moderate",
    dietPreference: body.dietPreference || "classic",
    unitPreference: body.unitPreference || "metric",
    timezone: body.timezone || "UTC",
    dailyCalories: calculated.dailyCalories,
    proteinG: calculated.proteinG,
    carbsG: calculated.carbsG,
    fatG: calculated.fatG,
    planRationale: calculated.planRationale,
    planGeneratedAt: now,
    onboardingCompletedAt: now,
    updatedAt: now,
  };

  try {
    const [row] = await db
      .insert(users)
      .values({ clerkUserId, ...fields })
      .onConflictDoUpdate({
        target: users.clerkUserId,
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
