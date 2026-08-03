import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env (local) and to the Trigger.dev environment variables (deployed)."
  );
}

export const db = drizzle(neon(databaseUrl), { schema });

export * from "./schema";
