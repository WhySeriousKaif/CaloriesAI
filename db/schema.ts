import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Storage is metric + UTC. Conversion happens at the display edge only.

export const unitPreferenceEnum = pgEnum("unit_preference", ["metric", "imperial"]);
export const goalEnum = pgEnum("goal", ["lose", "maintain", "gain"]);
export const activityLevelEnum = pgEnum("activity_level", [
  "sedentary",
  "light",
  "moderate",
  "very",
  "extra",
]);
export const dietPreferenceEnum = pgEnum("diet_preference", [
  "classic",
  "keto",
  "vegan",
  "vegetarian",
]);
export const mealStatusEnum = pgEnum("meal_status", ["analyzing", "completed", "failed"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/**
 * One row per Clerk user, keyed by `clerk_user_id`.
 *
 * Clerk is the source of truth for identity. This table follows it via the
 * `/api/webhooks/clerk` route, and carries the onboarding answers + the
 * AI-generated plan alongside.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email"),
  /** IANA zone, e.g. "America/New_York". Resolves the user's local day. */
  timezone: text("timezone"),
  /** Display only — every stored measurement is metric. */
  unitPreference: unitPreferenceEnum("unit_preference"),

  // Onboarding answers
  gender: text("gender"),
  /** String, not Date — a date of birth has no timezone. */
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  heightCm: numeric("height_cm", { mode: "number" }),
  weightKg: numeric("weight_kg", { mode: "number" }),
  goal: goalEnum("goal"),
  targetWeightKg: numeric("target_weight_kg", { mode: "number" }),
  activityLevel: activityLevelEnum("activity_level"),
  paceKgPerWeek: numeric("pace_kg_per_week", { mode: "number" }),
  dietPreference: dietPreferenceEnum("diet_preference"),

  // AI-generated targets
  dailyCalories: integer("daily_calories"),
  proteinG: integer("protein_g"),
  carbsG: integer("carbs_g"),
  fatG: integer("fat_g"),
  planRationale: text("plan_rationale"),
  planGeneratedAt: timestamp("plan_generated_at", { withTimezone: true }),

  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  ...timestamps,
});

export const meals = pgTable(
  "meals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** ImageKit URL. Transforms are appended at the read edge, never stored. */
    imageUrl: text("image_url").notNull(),
    status: mealStatusEnum("status").notNull().default("analyzing"),

    name: text("name"),
    calories: integer("calories"),
    proteinG: integer("protein_g"),
    carbsG: integer("carbs_g"),
    fatG: integer("fat_g"),

    /** "not_food" | "analysis_failed" | … — only set when status is "failed". */
    errorReason: text("error_reason"),
    /** For Realtime subscribe and debugging. */
    triggerRunId: text("trigger_run_id"),

    /** The UTC instant the meal was logged. */
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [index("meals_user_id_logged_at_idx").on(table.userId, table.loggedAt.desc())]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
