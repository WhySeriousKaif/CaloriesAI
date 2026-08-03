import { AbortTaskRunError, logger, task } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { users } from "../db/schema";
import { deleteUserImages } from "../src/lib/imagekit";
import type { ClerkUserDeletedPayload } from "./clerk-shared";

/**
 * `user.deleted` — the user was deleted in Clerk, so drop the local row and all ImageKit photos.
 *
 * `meals.user_id` is `on delete cascade`, so their logged meals in Postgres go with them.
 */
export const clerkUserDeleted = task({
  id: "clerk-user-deleted",
  run: async (payload: ClerkUserDeletedPayload) => {
    const { data, eventId } = payload;

    if (!data.id) {
      throw new AbortTaskRunError(
        `Clerk user.deleted event ${eventId} arrived without an id`
      );
    }

    logger.info("Deleting Clerk user and ImageKit media", { clerkUserId: data.id, eventId });

    // 1. Clean up ImageKit photos
    try {
      const [userRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkUserId, data.id))
        .limit(1);

      if (userRow) {
        await deleteUserImages(userRow.id);
      }
      await deleteUserImages(data.id);
    } catch (err) {
      logger.warn("ImageKit deletion warning:", { error: String(err) });
    }

    // 2. Delete user row in Neon DB (cascades all meal rows)
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

    logger.info("Clerk user deleted successfully", { userId: deleted[0].id });

    return { deleted: true, userId: deleted[0].id };
  },
});
