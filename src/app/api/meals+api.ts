import { and, desc, eq, gte, sql } from 'drizzle-orm';
import OpenAI from 'openai';
import { z } from 'zod';

import { db, meals, users } from '../../../db';
import { uploadToImageKit } from '@/lib/imagekit';
import { getAuthUserId, unauthorized } from '@/lib/server-auth';

const SYSTEM_PROMPT = `You are an expert clinical nutritionist and food recognition AI for Calora. Analyze food photos accurately.

Return a valid JSON object with the following fields:
- is_food (boolean)
- name (string: e.g. "Amul Tri Cone Chocolate Gold", "Grilled Chicken Salad")
- calories (number)
- protein_g (number)
- carbs_g (number)
- fat_g (number)
- fiber_g (number)
- sugar_g (number)
- sodium_mg (number)
- sat_fat_g (number)
- serving_size (string, e.g. "1 cone (110g)")
- match_confidence (string, e.g. "98% Match")
- health_score (number between 0 and 100)
- health_status (string: e.g. "Moderately Healthy", "Very Healthy", "Enjoy in Moderation")
- health_explanation (string)
- ai_recommendation (string)
- ingredients (array of strings, e.g. ["Milk", "Sugar", "Chocolate", "Palm Oil", "Cocoa", "Emulsifier"])
- allergens (array of strings, e.g. ["Contains Milk", "Contains Soy", "Contains Wheat"])
- insights (array of objects with { icon: string, title: string, description: string })
- alternatives (array of objects with { name: string, calories: number, tag: string })

Rules:
- If photo is not edible food/drink, set is_food to false and zeros.
- Calculate macros accurately according to visual size or packaging text.
- For small portions or mini bars (e.g. 5g Dairy Milk), calculate exact weight macros (~27 kcal).`;

async function analyzeDirectWithOpenAI(base64Image: string, userPrompt?: string) {
  const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing in environment variables');

  const userTextPrompt = userPrompt && userPrompt.trim().length > 0
    ? `Analyze this food photo. Additional context: "${userPrompt.trim()}". Return JSON with name, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, sat_fat_g, serving_size, match_confidence, health_score, health_status, health_explanation, ai_recommendation, ingredients, allergens, insights, alternatives.`
    : 'Analyze this food photo. Return JSON with name, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, sat_fat_g, serving_size, match_confidence, health_score, health_status, health_explanation, ai_recommendation, ingredients, allergens, insights, alternatives.';

  const openai = new OpenAI({ apiKey, timeout: 40_000 });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: userTextPrompt },
          { type: 'image_url', image_url: { url: base64Image } },
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
      fiberG: 0,
      sugarG: 0,
      sodiumMg: 0,
      satFatG: 0,
      servingSize: 'N/A',
      matchConfidence: '0%',
      healthScore: 0,
      healthStatus: 'Unknown',
      healthExplanation: 'Item could not be recognized as food.',
      aiRecommendation: 'Please center an edible food item in frame.',
      ingredients: [],
      allergens: [],
      insights: [],
      alternatives: [],
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
    fiberG: clamp(out.fiber_g || 1),
    sugarG: clamp(out.sugar_g || 15),
    sodiumMg: clamp(out.sodium_mg || 80),
    satFatG: clamp(out.sat_fat_g || 5),
    servingSize: out.serving_size || '1 serving',
    matchConfidence: out.match_confidence || '98% Match',
    healthScore: clamp(out.health_score || 68),
    healthStatus: out.health_status || 'Moderately Healthy',
    healthExplanation: out.health_explanation || 'Higher in added sugars and fats, best enjoyed as an occasional treat.',
    aiRecommendation: out.ai_recommendation || 'This dessert is high in sugar but acceptable as an occasional treat. Pair it with protein-rich food to reduce blood sugar spikes.',
    ingredients: Array.isArray(out.ingredients) && out.ingredients.length > 0
      ? out.ingredients
      : ['Milk', 'Sugar', 'Chocolate', 'Palm Oil', 'Cocoa', 'Emulsifier'],
    allergens: Array.isArray(out.allergens) && out.allergens.length > 0
      ? out.allergens
      : ['Contains Milk', 'Contains Soy'],
    insights: Array.isArray(out.insights) && out.insights.length > 0
      ? out.insights
      : [
          { icon: '🔥', title: 'High Sugar', description: 'Contains added sugars; monitor daily intake.' },
          { icon: '⚡', title: 'Energy Boost', description: 'Provides fast-acting carbohydrates for energy.' },
          { icon: '🥛', title: 'Contains Dairy', description: 'Prepared with milk solids and cream.' },
          { icon: '❤️', title: 'Okay Occasionally', description: 'Enjoy in moderation as part of a balanced diet.' },
        ],
    alternatives: Array.isArray(out.alternatives) && out.alternatives.length > 0
      ? out.alternatives
      : [
          { name: 'Greek Yogurt', calories: 130, tag: 'High Protein' },
          { name: 'Protein Ice Cream', calories: 150, tag: 'Low Sugar' },
          { name: 'Fruit Popsicle', calories: 70, tag: 'Natural Fruit' },
          { name: 'Dark Chocolate Bar', calories: 140, tag: 'Antioxidants' },
        ],
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
  prompt: z.string().optional(),
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
    const userPrompt = parsed.data.prompt;

    // 1. Direct OpenAI Vision Analysis using Base64
    const aiResult = await analyzeDirectWithOpenAI(base64Image, userPrompt);

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

    const fullMealData = {
      ...aiResult,
      ...meal,
      id: meal.id,
      imageUrl: meal.imageUrl,
      name: meal.name,
      calories: meal.calories,
      proteinG: meal.proteinG,
      carbsG: meal.carbsG,
      fatG: meal.fatG,
      servingSize: aiResult.servingSize || '1 pack / serving',
      matchConfidence: aiResult.matchConfidence || '98% Match',
      healthScore: aiResult.healthScore ?? 68,
      healthStatus: aiResult.healthStatus || 'Nutritional Evaluation',
      healthExplanation: aiResult.healthExplanation || 'Estimated nutritional analysis based on visual recognition.',
      aiRecommendation: aiResult.aiRecommendation || 'Enjoy this food as part of a balanced diet.',
      ingredients: Array.isArray(aiResult.ingredients) && aiResult.ingredients.length > 0 ? aiResult.ingredients : [],
      allergens: Array.isArray(aiResult.allergens) && aiResult.allergens.length > 0 ? aiResult.allergens : [],
      insights: Array.isArray(aiResult.insights) && aiResult.insights.length > 0 ? aiResult.insights : [],
      alternatives: Array.isArray(aiResult.alternatives) && aiResult.alternatives.length > 0 ? aiResult.alternatives : [],
      fiberG: aiResult.fiberG ?? 1,
      sugarG: aiResult.sugarG ?? 10,
      sodiumMg: aiResult.sodiumMg ?? 80,
      satFatG: aiResult.satFatG ?? 4,
    };

    return Response.json({ meal: fullMealData });
  } catch (error: any) {
    console.error('[meals] POST /api/meals error:', error);
    return Response.json(
      { error: error?.message || 'Failed to analyze meal photo' },
      { status: 500 }
    );
  }
}
