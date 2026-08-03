import { logger, schemaTask } from "@trigger.dev/sdk";
import OpenAI from "openai";
import { z } from "zod";

import {
  ageFrom,
  formulaPlan,
  isPlausible,
  planInputSchema,
  type Plan,
  type PlanInput,
} from "../src/lib/plan";

const aiPlanSchema = z.object({
  calories: z.number().int(),
  protein_g: z.number().int(),
  carbs_g: z.number().int(),
  fat_g: z.number().int(),
  rationale: z.string(),
});

async function askOpenAI(input: PlanInput): Promise<Plan> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPEN_AI_KEY;
  if (!apiKey) throw new Error("No OpenAI API key found");

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a registered dietitian building a daily nutrition target. Return ONLY valid JSON with keys: calories (number), protein_g (number), carbs_g (number), fat_g (number), rationale (string).",
      },
      {
        role: "user",
        content: JSON.stringify({ ...input, age: ageFrom(input.dateOfBirth) }),
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no response");

  const out = aiPlanSchema.parse(JSON.parse(content));

  return {
    calories: out.calories,
    protein: out.protein_g,
    carbs: out.carbs_g,
    fat: out.fat_g,
    rationale: out.rationale,
  };
}

export const generatePlan = schemaTask({
  id: "generate-plan",
  schema: planInputSchema,
  maxDuration: 120,
  run: async (input) => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const plan = await askOpenAI(input);
        if (isPlausible(plan)) return { ...plan, source: "ai" as const };
        logger.warn("Implausible plan, discarding", { attempt, plan });
      } catch (error) {
        logger.error("OpenAI plan generation failed", { attempt, error: String(error) });
      }
    }

    return { ...formulaPlan(input), source: "formula" as const };
  },
});
