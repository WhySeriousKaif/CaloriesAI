CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"status" text NOT NULL,
	"name" text,
	"calories" integer,
	"protein_g" integer,
	"carbs_g" integer,
	"fat_g" integer,
	"error_reason" text,
	"trigger_run_id" text,
	"logged_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text,
	"timezone" text,
	"unit_preference" text,
	"gender" text,
	"date_of_birth" date,
	"height_cm" numeric,
	"weight_kg" numeric,
	"goal" text,
	"target_weight_kg" numeric,
	"activity_level" text,
	"pace_kg_per_week" numeric,
	"diet_preference" text,
	"daily_calories" integer,
	"protein_g" integer,
	"carbs_g" integer,
	"fat_g" integer,
	"plan_rationale" text,
	"plan_generated_at" timestamp with time zone,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meals_user_id_logged_at_idx" ON "meals" USING btree ("user_id","logged_at" DESC NULLS LAST);