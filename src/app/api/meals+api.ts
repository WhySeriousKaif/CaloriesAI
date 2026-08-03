import { verifyToken } from "@clerk/backend";
import { tasks } from "@trigger.dev/sdk";
import { desc, eq } from "drizzle-orm";
import OpenAI from "openai";

import { db } from "../../../db";
import { meals, users } from "../../../db/schema";
import { uploadToImageKit } from "@/lib/imagekit";

async function requireUserId(request: Request): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;

  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  try {
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch (error) {
    console.error("[meals] Token verification failed:", error);
    return null;
  }
}

/** Background async Vision analysis with OpenAI */
async function analyzeMealAsync(mealId: string, imageUrl: string, base64Data?: string) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPEN_AI_KEY;

  if (!apiKey) {
    console.error("[meals] No OpenAI API Key found in environment");
    await db
      .update(meals)
      .set({
        name: "Scanned Meal",
        status: "failed",
        errorReason: "no_api_key",
      })
      .where(eq(meals.id, mealId));
    return;
  }

  try {
    const openai = new OpenAI({ apiKey });
    let imagePayloadUrl = imageUrl;

    if (base64Data) {
      imagePayloadUrl = base64Data.startsWith("data:")
        ? base64Data
        : `data:image/jpeg;base64,${base64Data}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a clinical nutritionist AI estimating real food metrics from photos. Observe portion sizes, fried items (like Bhatura, Puri, Samosa), gravies, curries, rice, and meats. Estimate accurate calories, protein, carbs, and fat grams. Return ONLY valid JSON with keys: is_food (boolean), name (string, 2-4 words e.g. 'Chole Bhature'), calories (number), protein_g (number), carbs_g (number), fat_g (number).",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify this food dish and estimate its exact calories and macros:" },
            { type: "image_url", image_url: { url: imagePayloadUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    const parsed = JSON.parse(content);
    if (parsed.is_food === false) {
      await db
        .update(meals)
        .set({ status: "failed", name: "Not Food Item", errorReason: "not_food" })
        .where(eq(meals.id, mealId));
      return;
    }

    const name = parsed.name || "Scanned Meal";
    const proteinG = Math.max(0, Math.round(Number(parsed.protein_g ?? parsed.proteinG ?? parsed.protein ?? 0)));
    const carbsG = Math.max(0, Math.round(Number(parsed.carbs_g ?? parsed.carbsG ?? parsed.carbs ?? 0)));
    const fatG = Math.max(0, Math.round(Number(parsed.fat_g ?? parsed.fatG ?? parsed.fat ?? 0)));
    const calories = Math.max(
      10,
      Math.round(Number(parsed.calories || proteinG * 4 + carbsG * 4 + fatG * 9))
    );

    await db
      .update(meals)
      .set({
        name,
        calories,
        proteinG,
        carbsG,
        fatG,
        status: "completed",
      })
      .where(eq(meals.id, mealId));
  } catch (err) {
    console.error("[meals] OpenAI Vision analysis error:", err);
    await db
      .update(meals)
      .set({
        status: "failed",
        errorReason: "analysis_error",
      })
      .where(eq(meals.id, mealId));
  }
}

export async function GET(request: Request) {
  const clerkUserId = await requireUserId(request);
  if (!clerkUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [userRow] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!userRow) {
      return Response.json({ meals: [] });
    }

    let userMeals = await db
      .select()
      .from(meals)
      .where(eq(meals.userId, userRow.id))
      .orderBy(desc(meals.loggedAt));

    if (userMeals.length === 0) {
      const now = Date.now();
      const seedData = [
        {
          userId: userRow.id,
          name: "Greek Yogurt Parfait",
          calories: 420,
          proteinG: 28,
          carbsG: 52,
          fatG: 11,
          imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
          status: "completed",
          loggedAt: new Date(now - 3 * 3600 * 1000),
        },
        {
          userId: userRow.id,
          name: "Chicken Burrito Bowl",
          calories: 780,
          proteinG: 52,
          carbsG: 88,
          fatG: 22,
          imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
          status: "completed",
          loggedAt: new Date(now - 7 * 3600 * 1000),
        },
        {
          userId: userRow.id,
          name: "Salmon with Roasted Potatoes",
          calories: 690,
          proteinG: 45,
          carbsG: 55,
          fatG: 30,
          imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80",
          status: "completed",
          loggedAt: new Date(now - 24 * 3600 * 1000),
        },
        {
          userId: userRow.id,
          name: "Avocado Toast with Eggs",
          calories: 520,
          proteinG: 24,
          carbsG: 42,
          fatG: 29,
          imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=600&q=80",
          status: "completed",
          loggedAt: new Date(now - 28 * 3600 * 1000),
        },
        {
          userId: userRow.id,
          name: "Beef Pho Noodle Soup",
          calories: 610,
          proteinG: 38,
          carbsG: 72,
          fatG: 18,
          imageUrl: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=600&q=80",
          status: "completed",
          loggedAt: new Date(now - 48 * 3600 * 1000),
        },
      ];

      await db.insert(meals).values(seedData);

      userMeals = await db
        .select()
        .from(meals)
        .where(eq(meals.userId, userRow.id))
        .orderBy(desc(meals.loggedAt));
    }

    return Response.json({ meals: userMeals });
  } catch (error) {
    console.error("[meals] GET failed:", error);
    return Response.json({ error: "Failed to fetch meals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const clerkUserId = await requireUserId(request);
  if (!clerkUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [userRow] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!userRow) {
      return Response.json({ error: "User profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { image, name } = body;

    let imageUrl = body.imageUrl;

    if (image && !imageUrl) {
      try {
        const filename = `meal-${userRow.id}-${Date.now()}.jpg`;
        imageUrl = await uploadToImageKit(image, filename);
      } catch (uploadErr) {
        console.warn("[meals] ImageKit upload skipped or failed, using base64 image payload:", uploadErr);
        imageUrl = image;
      }
    }

    if (!imageUrl) {
      imageUrl = image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
    }

    const [inserted] = await db
      .insert(meals)
      .values({
        userId: userRow.id,
        imageUrl,
        status: "pending",
        name: name || "Analyzing Food...",
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        loggedAt: new Date(),
      })
      .returning();

    // Trigger.dev background task trigger (if configured)
    try {
      await tasks.trigger("analyze-meal", {
        mealId: inserted.id,
        imageUrl,
      });
    } catch {
      // Trigger.dev is optional in dev mode
    }

    // Await Vision analysis so client receives final calculated OpenAI results immediately
    await analyzeMealAsync(inserted.id, imageUrl, image);

    const [updated] = await db
      .select()
      .from(meals)
      .where(eq(meals.id, inserted.id))
      .limit(1);

    return Response.json({ meal: updated || inserted });
  } catch (error) {
    console.error("[meals] POST failed:", error);
    return Response.json({ error: "Failed to process meal photo" }, { status: 500 });
  }
}
