import { logger, task } from "@trigger.dev/sdk";

import { db } from "../db";
import { users } from "../db/schema";
import { primaryEmailAddress, type ClerkUserEventPayload } from "./clerk-shared";

/**
 * `user.updated` — the user changed something Clerk owns (e.g. their email).
 *
 * Also an upsert. Svix does not guarantee ordering, and a `user.updated` can
 * arrive before its `user.created` (or after a failed `created` delivery), so
 * this must be able to create the row rather than silently updating zero rows.
 */
export const clerkUserUpdated = task({
  id: "clerk-user-updated",
  run: async (payload: ClerkUserEventPayload) => {
    const { data, eventId } = payload;
    const email = primaryEmailAddress(data);

    logger.info("Syncing updated Clerk user", {
      clerkUserId: data.id,
      eventId,
      hasEmail: email !== null,
    });

    const [row] = await db
      .insert(users)
      .values({ clerkUserId: data.id, email })
      .onConflictDoUpdate({
        target: users.clerkUserId,
        set: { email, updatedAt: new Date() },
      })
      .returning({ id: users.id, clerkUserId: users.clerkUserId });

    logger.info("Clerk user updated", { userId: row.id });

    return { userId: row.id, clerkUserId: row.clerkUserId };
  },
});
