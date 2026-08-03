/**
 * Quick verification: who's actually in the Neon database right now.
 *
 * Run after signing up in the app to confirm the whole chain worked:
 *   Clerk → webhook → Trigger.dev → Neon, and app → /api/profile → Neon.
 *
 *   npm run db:check
 */
import { neon } from "@neondatabase/serverless";
import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trimStart().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [
        line.slice(0, i).trim(),
        line.slice(i + 1).trim().replace(/^["']|["']$/g, ""),
      ];
    })
);

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const sql = neon(env.DATABASE_URL);
const rows = await sql`
  select clerk_user_id, email, gender, height_cm, weight_kg, goal,
         daily_calories, protein_g, carbs_g, fat_g, timezone,
         onboarding_completed_at, created_at
  from users
  order by created_at desc
  limit 10`;

if (rows.length === 0) {
  console.log("\n  No users yet.\n");
  console.log("  If you just signed up, check in this order:");
  console.log("    1. Clerk Dashboard → Webhooks → your endpoint → Message Attempts");
  console.log("    2. Trigger.dev Dashboard → Runs");
  console.log("    3. The terminal running `npx expo start`\n");
  process.exit(0);
}

console.log(`\n  ${rows.length} user row(s), newest first:\n`);

for (const row of rows) {
  // `email` comes only from the Clerk webhook; the plan/body columns come only
  // from POST /api/profile. Which fields are null tells you which half failed.
  const webhook = row.email ? "✅ webhook synced email" : "❌ no email — webhook never landed";
  const profile = row.daily_calories
    ? "✅ profile synced plan"
    : "❌ no targets — POST /api/profile never landed";

  console.log(`  ${row.clerk_user_id}`);
  console.log(`     email      ${row.email ?? "(null)"}`);
  console.log(`     body       ${row.gender ?? "?"} · ${row.height_cm ?? "?"}cm · ${row.weight_kg ?? "?"}kg · goal=${row.goal ?? "?"}`);
  console.log(`     targets    ${row.daily_calories ?? "?"} kcal · P${row.protein_g ?? "?"} C${row.carbs_g ?? "?"} F${row.fat_g ?? "?"}`);
  console.log(`     timezone   ${row.timezone ?? "(null)"}`);
  console.log(`     created    ${row.created_at?.toISOString?.() ?? row.created_at}`);
  console.log(`     ${webhook}`);
  console.log(`     ${profile}\n`);
}
