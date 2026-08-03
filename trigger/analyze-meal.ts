import { logger, task } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

import { db } from "../db";
import { meals } from "../db/schema";

const SYSTEM_PROMPT = `You are a clinical nutritionist AI estimating real food metrics from photos. Observe portion sizes, fried items (like Bhatura, Puri, Samosa), gravies, curries, rice, and meats. Estimate accurate calories, protein, carbs, and fat grams.

Rules:
- is_food: boolean. Return false if the photo does NOT contain edible food or drink.
- name: string (2-4 words name of the meal, e.g. "Chole Bhature", "Grilled Chicken Bowl").
- calories: integer (estimated total calories).
- protein_g: integer (grams of protein).
- carbs_g: integer (grams of carbohydrates).
- fat_g: integer (grams of fat).

Return ONLY valid JSON with keys: is_food (boolean), name (string), calories (number), protein_g (number), carbs_g (number), fat_g (number).`;

export const analyzeMeal = task({
  id: "analyze-meal",
  run: async (payload: { mealId: string; imageUrl: string }) => {
    const { mealId, imageUrl } = payload;
    logger.info("Analyzing meal photo", { mealId, imageUrl });

    const apiKey = process.env.OPEN_AI_KEY ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is missing");
    }

    const openai = new OpenAI({ apiKey });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify this food dish and estimate its exact calories and macros:" },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No response from OpenAI Vision");

      const parsed = JSON.parse(content);

      if (parsed.is_food === false) {
        logger.warn("Photo is not food, marking meal failed", { mealId });
        await db
          .update(meals)
          .set({ status: "failed", name: "Not Food Item" })
          .where(eq(meals.id, mealId));
        return { status: "failed", reason: "not_food" };
      }

      const name = parsed.name || "Scanned Meal";
      const proteinG = Math.max(0, Math.round(Number(parsed.protein_g ?? parsed.proteinG ?? parsed.protein ?? 0)));
      const carbsG = Math.max(0, Math.round(Number(parsed.carbs_g ?? parsed.carbsG ?? parsed.carbs ?? 0)));
      const fatG = Math.max(0, Math.round(Number(parsed.fat_g ?? parsed.fatG ?? parsed.fat ?? 0)));
      const calories = Math.max(
        10,
        Math.round(Number(parsed.calories || proteinG * 4 + carbsG * 4 + fatG * 9))
      );

      const result = {
        name,
        calories,
        proteinG,
        carbsG,
        fatG,
        status: "completed",
      };

      await db.update(meals).set(result).where(eq(meals.id, mealId));

      return result;
    } catch (err) {
      logger.error("Vision analysis failed", { mealId, error: String(err) });
      await db
        .update(meals)
        .set({ status: "failed" })
        .where(eq(meals.id, mealId));
      throw err;
    }
  },
});
