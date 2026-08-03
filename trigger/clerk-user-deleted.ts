import { AbortTaskRunError, logger, task } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { users } from "../db/schema";
import type { ClerkUserDeletedPayload } from "./clerk-shared";

/**
 * `user.deleted` — the user was deleted in Clerk, so drop the local row.
 *
 * `meals.user_id` is `on delete cascade`, so their logged meals go with them.
 * Deleting a row that isn't there is a no-op, not an error: Svix retries mean
 * we can legitimately see the same delete twice.
 */
export const clerkUserDeleted = task({
  id: "clerk-user-deleted",
  run: async (payload: ClerkUserDeletedPayload) => {
    const { data, eventId } = payload;

    // Clerk types `id` as optional on deleted objects. Without it there is
    // nothing to key on, and retrying will never produce one.
    if (!data.id) {
      throw new AbortTaskRunError(
        `Clerk user.deleted event ${eventId} arrived without an id`
      );
    }

    logger.info("Deleting Clerk user", { clerkUserId: data.id, eventId });

    const deleted = await db
      .delete(users)
      .where(eq(users.clerkUserId, data.id))
      .returning({ id: users.id });

    if (deleted.length === 0) {
      logger.warn("No local row for deleted Clerk user — nothing to do", {
        clerkUserId: data.id,
      });

      return { deleted: false, userId: null };
    }

    logger.info("Clerk user deleted", { userId: deleted[0].id });

    return { deleted: true, userId: deleted[0].id };
  },
});
