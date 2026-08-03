import { verifyToken } from "@clerk/backend";
import { desc, eq } from "drizzle-orm";

import { db } from "../../../db";
import { meals, users } from "../../../db/schema";

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

    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");

    const userMeals = await db
      .select()
      .from(meals)
      .where(eq(meals.userId, userRow.id))
      .orderBy(desc(meals.loggedAt));

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
    const { name, imageUrl, calories, proteinG, carbsG, fatG, status } = body;

    const [inserted] = await db
      .insert(meals)
      .values({
        userId: userRow.id,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        status: status || "completed",
        name: name || "Logged Meal",
        calories: calories ?? 0,
        proteinG: proteinG ?? 0,
        carbsG: carbsG ?? 0,
        fatG: fatG ?? 0,
        loggedAt: new Date(),
      })
      .returning();

    return Response.json({ meal: inserted });
  } catch (error) {
    console.error("[meals] POST failed:", error);
    return Response.json({ error: "Failed to log meal" }, { status: 500 });
  }
}
