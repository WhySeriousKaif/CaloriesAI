import { logger, task } from "@trigger.dev/sdk";

import { db } from "../db";
import { users } from "../db/schema";
import { primaryEmailAddress, type ClerkUserEventPayload } from "./clerk-shared";

/**
 * `user.created` — create the local row for a brand new Clerk user.
 *
 * This is an **upsert**, not an insert. `POST /api/profile` writes the same row
 * from the app the moment onboarding finishes, and the webhook is asynchronous,
 * so either one can land first. Both paths upsert on `clerk_user_id`, so either
 * order produces the same single row. Do not simplify this to a plain insert.
 */
export const clerkUserCreated = task({
  id: "clerk-user-created",
  run: async (payload: ClerkUserEventPayload) => {
    const { data, eventId } = payload;
    const email = primaryEmailAddress(data);

    logger.info("Syncing created Clerk user", {
      clerkUserId: data.id,
      eventId,
      hasEmail: email !== null,
    });

    const [row] = await db
      .insert(users)
      .values({ clerkUserId: data.id, email })
      .onConflictDoUpdate({
        target: users.clerkUserId,
        // The row already existed (profile POST won the race). Only refresh what
        // Clerk owns — never clobber onboarding answers or the generated plan.
        set: { email, updatedAt: new Date() },
      })
      .returning({ id: users.id, clerkUserId: users.clerkUserId });

    logger.info("Clerk user synced", { userId: row.id });

    return { userId: row.id, clerkUserId: row.clerkUserId };
  },
});
