/**
 * ⚠️ PLACEHOLDER DATA — replace with `GET /api/meals?date=` (PLAN.md Phase 5).
 *
 * The camera pipeline and the meals API don't exist yet, so Home has nothing
 * real to list. These rows are shaped like the `meals` table in `db/schema.ts`
 * and cover all three `status` values, so the completed / analyzing / failed
 * card designs are all exercised.
 *
 * Everything else on Home — the ring, the macro bars, the targets — reads live
 * data from Neon. This module is the single seam to cut when the API lands.
 */
import type { MacroKey } from '@/constants/design';

export type DemoMeal = {
  id: string;
  /** Mirrors `meals.status`. */
  status: 'completed' | 'analyzing' | 'failed';
  /** Meal slot, e.g. "Breakfast". */
  slot: string;
  name: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  loggedAt: string | null;
  errorReason: string | null;
  /** Drives the placeholder thumbnail tint until real ImageKit URLs exist. */
  accent: MacroKey;
};

export const DEMO_MEALS: DemoMeal[] = [
  {
    id: 'demo-1',
    status: 'completed',
    slot: 'Breakfast',
    name: 'Greek Yogurt Bowl',
    calories: 420,
    proteinG: 28,
    carbsG: 42,
    fatG: 12,
    loggedAt: '8:15 AM',
    errorReason: null,
    accent: 'protein',
  },
  {
    id: 'demo-2',
    status: 'completed',
    slot: 'Lunch',
    name: 'Chicken Quinoa Salad',
    calories: 580,
    proteinG: 42,
    carbsG: 55,
    fatG: 18,
    loggedAt: '12:45 PM',
    errorReason: null,
    accent: 'carbs',
  },
  {
    id: 'demo-3',
    status: 'analyzing',
    slot: 'Snack',
    name: null,
    calories: null,
    proteinG: null,
    carbsG: null,
    fatG: null,
    loggedAt: null,
    errorReason: null,
    accent: 'fat',
  },
  {
    id: 'demo-4',
    status: 'failed',
    slot: 'Dinner',
    name: null,
    calories: null,
    proteinG: null,
    carbsG: null,
    fatG: null,
    loggedAt: null,
    errorReason: 'not_food',
    accent: 'fat',
  },
];

/** Totals for the ring and macro bars. Only `completed` meals count. */
export function sumCompleted(meals: DemoMeal[]) {
  return meals
    .filter((meal) => meal.status === 'completed')
    .reduce(
      (total, meal) => ({
        calories: total.calories + (meal.calories ?? 0),
        proteinG: total.proteinG + (meal.proteinG ?? 0),
        carbsG: total.carbsG + (meal.carbsG ?? 0),
        fatG: total.fatG + (meal.fatG ?? 0),
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );
}
