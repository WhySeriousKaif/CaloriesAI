import { logger, schemaTask } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

// Relative, not "@/" — these tasks are bundled by Trigger.dev, not Metro.
import { db, meals } from "../db";
import { visionUrl } from "../src/lib/image-url";

const MODEL = "gpt-4o-mini"; // vision-capable, pinned here and nowhere else

const SYSTEM_PROMPT = `You are a clinical nutritionist estimating what is on a plate from a single photo.

Rules:
- is_food is false for anything that is not edible food or drink. When it is false, the other fields are ignored — return zeros and an empty name.
- name: what a person would call this meal, 2-4 words, no brand names. e.g. "Grilled chicken salad", "Chole Bhature".
- Estimate the portion actually visible, using the plate, cutlery or hand for scale. Do not return a generic per-100g figure.
- Account for how the food was cooked: fried items (bhatura, puri, samosa), oil-heavy gravies and curries, and rich sauces carry far more fat than they look.
- protein_g * 4 + carbs_g * 4 + fat_g * 9 should land within 10% of calories.`;

/** Snake_case because that is how the model is asked to name them. */
const visionSchema = z.object({
  is_food: z.boolean(),
  name: z.string(),
  calories: z.number().int(),
  protein_g: z.number().int(),
  carbs_g: z.number().int(),
  fat_g: z.number().int(),
});

const payloadSchema = z.object({
  mealId: z.string().uuid(),
  imageUrl: z.string().url(),
});

/**
 * Meal photo → macros, written back to the `meals` row.
 *
 * The row already exists as `analyzing` when this starts (POST /api/meals), so
 * every exit has to move it to `completed` or `failed` — a row left `analyzing`
 * is a spinner on Home forever.
 *
 * `onFailure` covers exhausted retries but not CRASHED / SYSTEM_FAILURE runs.
 * Sweep stale `analyzing` rows with a scheduled task if that ever shows up.
 */
export const analyzeMeal = schemaTask({
  id: "analyze-meal",
  schema: payloadSchema,
  retry: { maxAttempts: 2 }, // one transient/parse retry, then failed
  maxDuration: 120,
  run: async ({ mealId, imageUrl }) => {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPEN_AI_KEY;
    if (!apiKey) throw new Error("Add OPENAI_API_KEY to your .env file");

    // Constructed per call so a missing key fails inside the run, not at import.
    const openai = new OpenAI({ apiKey, timeout: 45_000, maxRetries: 0 });

    const response = await openai.responses.parse({
      model: MODEL,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            // The row keeps the full-size URL for the UI; the model gets a
            // downscaled copy, because it downsamples anyway and the extra
            // pixels are pure upload latency and tokens.
            { type: "input_image", image_url: visionUrl(imageUrl), detail: "auto" },
          ],
        },
      ],
      text: { format: zodTextFormat(visionSchema, "meal") },
    });

    const out = response.output_parsed;
    if (!out) throw new Error("OpenAI returned no structured output"); // retried once

    // A photo of a chair is not a meal that failed — it is not a meal. The row
    // is kept and flagged so the card can say exactly that, and the totals skip
    // it because only `completed` rows are summed.
    if (!out.is_food) {
      logger.warn("Photo is not food", { mealId });
      await db
        .update(meals)
        .set({ status: "failed", errorReason: "not_food", name: null })
        .where(eq(meals.id, mealId));

      return { status: "failed" as const, errorReason: "not_food" as const };
    }

    const clamp = (value: number) => Math.max(0, Math.round(value));
    const result = {
      name: out.name || "Scanned meal",
      calories: clamp(out.calories),
      proteinG: clamp(out.protein_g),
      carbsG: clamp(out.carbs_g),
      fatG: clamp(out.fat_g),
    };

    await db
      .update(meals)
      .set({ ...result, status: "completed", errorReason: null })
      .where(eq(meals.id, mealId));

    // Returned as well as written: the scan screen renders straight off the
    // Realtime run output, so it never re-fetches the row it just created.
    return { status: "completed" as const, ...result };
  },
  onFailure: async ({ payload, error }) => {
    logger.error("analyze-meal exhausted retries", {
      mealId: payload.mealId,
      error: String(error),
    });

    await db
      .update(meals)
      .set({ status: "failed", errorReason: "analysis_failed" })
      .where(eq(meals.id, payload.mealId));
  },
});
