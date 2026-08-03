CREATE TYPE "public"."activity_level" AS ENUM('sedentary', 'light', 'moderate', 'very', 'extra');--> statement-breakpoint
CREATE TYPE "public"."diet_preference" AS ENUM('classic', 'keto', 'vegan', 'vegetarian');--> statement-breakpoint
CREATE TYPE "public"."goal" AS ENUM('lose', 'maintain', 'gain');--> statement-breakpoint
CREATE TYPE "public"."meal_status" AS ENUM('analyzing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."unit_preference" AS ENUM('metric', 'imperial');--> statement-breakpoint

-- These columns were plain `text` and the app wrote values the enums don't contain
-- ('pending' for meals.status, and whatever an older client sent for the user
-- columns). Normalise first: a bare `USING col::enum` would abort the whole
-- migration on the first offending row.
UPDATE "meals" SET "status" = 'analyzing' WHERE "status" NOT IN ('analyzing', 'completed', 'failed') OR "status" IS NULL;--> statement-breakpoint
UPDATE "users" SET "unit_preference" = NULL WHERE "unit_preference" NOT IN ('metric', 'imperial');--> statement-breakpoint
UPDATE "users" SET "goal" = NULL WHERE "goal" NOT IN ('lose', 'maintain', 'gain');--> statement-breakpoint
UPDATE "users" SET "activity_level" = NULL WHERE "activity_level" NOT IN ('sedentary', 'light', 'moderate', 'very', 'extra');--> statement-breakpoint
UPDATE "users" SET "diet_preference" = NULL WHERE "diet_preference" NOT IN ('classic', 'keto', 'vegan', 'vegetarian');--> statement-breakpoint

-- Drop the old text default before retyping, then restore it as the enum value.
ALTER TABLE "meals" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "meals" ALTER COLUMN "status" SET DATA TYPE "public"."meal_status" USING "status"::"public"."meal_status";--> statement-breakpoint
ALTER TABLE "meals" ALTER COLUMN "status" SET DEFAULT 'analyzing'::"public"."meal_status";--> statement-breakpoint
ALTER TABLE "meals" ALTER COLUMN "logged_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "unit_preference" SET DATA TYPE "public"."unit_preference" USING "unit_preference"::"public"."unit_preference";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "goal" SET DATA TYPE "public"."goal" USING "goal"::"public"."goal";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "activity_level" SET DATA TYPE "public"."activity_level" USING "activity_level"::"public"."activity_level";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "diet_preference" SET DATA TYPE "public"."diet_preference" USING "diet_preference"::"public"."diet_preference";
