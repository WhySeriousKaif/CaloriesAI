import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * One row per Clerk user, keyed by `clerk_user_id`.
 *
 * Clerk is the source of truth for identity. This table follows it via the
 * `/api/webhooks/clerk` route, and carries the onboarding answers + the
 * AI-generated plan alongside.
 *
 * Storage is metric + UTC. Conversion happens at the display edge only.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email"),
  timezone: text("timezone"),
  unitPreference: text("unit_preference"), // metric | imperial (display only)

  // Onboarding answers
  gender: text("gender"),
  dateOfBirth: date("date_of_birth"),
  heightCm: numeric("height_cm"),
  weightKg: numeric("weight_kg"),
  goal: text("goal"), // lose | maintain | gain
  targetWeightKg: numeric("target_weight_kg"),
  activityLevel: text("activity_level"), // sedentary | light | moderate | very
  paceKgPerWeek: numeric("pace_kg_per_week"),
  dietPreference: text("diet_preference"), // classic | keto | vegan | vegetarian

  // AI-generated targets
  dailyCalories: integer("daily_calories"),
  proteinG: integer("protein_g"),
  carbsG: integer("carbs_g"),
  fatG: integer("fat_g"),
  planRationale: text("plan_rationale"),
  planGeneratedAt: timestamp("plan_generated_at", { withTimezone: true }),

  onboardingCompletedAt: timestamp("onboarding_completed_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const meals = pgTable(
  "meals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    status: text("status").notNull(), // analyzing | completed | failed
    name: text("name"),
    calories: integer("calories"),
    proteinG: integer("protein_g"),
    carbsG: integer("carbs_g"),
    fatG: integer("fat_g"),
    errorReason: text("error_reason"), // not_food | parse_failed | …
    triggerRunId: text("trigger_run_id"),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("meals_user_id_logged_at_idx").on(table.userId, table.loggedAt.desc()),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
