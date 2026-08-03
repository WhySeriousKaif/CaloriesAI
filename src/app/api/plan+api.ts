import OpenAI from "openai";

import { formulaPlan, isPlausible, planInputSchema } from "../../lib/plan";

/**
 * Onboarding answers -> daily target plan.
 * Unauthenticated: runs during onboarding before the user signs up.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = planInputSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid onboarding answers", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPEN_AI_KEY;

  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a clinical nutritionist building daily nutrition targets. Calculate daily calories, protein_g, carbs_g, fat_g, and a short rationale sentence based on user metrics and goal. Return ONLY valid JSON with keys: calories (number), protein (number), carbs (number), fat (number), rationale (string).",
          },
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const out = JSON.parse(content);
        const plan = {
          calories: Math.round(Number(out.calories)),
          protein: Math.round(Number(out.protein ?? out.protein_g)),
          carbs: Math.round(Number(out.carbs ?? out.carbs_g)),
          fat: Math.round(Number(out.fat ?? out.fat_g)),
          rationale: out.rationale || "Calculated using AI personalized metabolic profiling.",
        };

        if (isPlausible(plan)) {
          return Response.json({ ...plan, source: "ai" });
        }
      }
    } catch (err) {
      console.warn("[plan] OpenAI plan calculation failed, using formula fallback:", err);
    }
  }

  // Formula fallback (Mifflin-St Jeor)
  const plan = formulaPlan(input);
  return Response.json({ ...plan, source: "formula" });
}
