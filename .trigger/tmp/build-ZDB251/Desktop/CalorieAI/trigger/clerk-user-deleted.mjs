import {
  db,
  eq,
  users
} from "../../../chunk-IPPRG6ZZ.mjs";
import {
  AbortTaskRunError,
  logger,
  task
} from "../../../chunk-THI7QYEM.mjs";
import "../../../chunk-WZGQJWAS.mjs";
import {
  __name,
  init_esm
} from "../../../chunk-FUV6SSYK.mjs";

// trigger/clerk-user-deleted.ts
init_esm();
var clerkUserDeleted = task({
  id: "clerk-user-deleted",
  run: /* @__PURE__ */ __name(async (payload) => {
    const { data, eventId } = payload;
    if (!data.id) {
      throw new AbortTaskRunError(
        `Clerk user.deleted event ${eventId} arrived without an id`
      );
    }
    logger.info("Deleting Clerk user", { clerkUserId: data.id, eventId });
    const deleted = await db.delete(users).where(eq(users.clerkUserId, data.id)).returning({ id: users.id });
    if (deleted.length === 0) {
      logger.warn("No local row for deleted Clerk user — nothing to do", {
        clerkUserId: data.id
      });
      return { deleted: false, userId: null };
    }
    logger.info("Clerk user deleted", { userId: deleted[0].id });
    return { deleted: true, userId: deleted[0].id };
  }, "run")
});
export {
  clerkUserDeleted
};
//# sourceMappingURL=clerk-user-deleted.mjs.map
