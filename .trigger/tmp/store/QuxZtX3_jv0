import {
  primaryEmailAddress
} from "../../../chunk-V2W36AKK.mjs";
import {
  db,
  users
} from "../../../chunk-IPPRG6ZZ.mjs";
import {
  logger,
  task
} from "../../../chunk-THI7QYEM.mjs";
import "../../../chunk-WZGQJWAS.mjs";
import {
  __name,
  init_esm
} from "../../../chunk-FUV6SSYK.mjs";

// trigger/clerk-user-updated.ts
init_esm();
var clerkUserUpdated = task({
  id: "clerk-user-updated",
  run: /* @__PURE__ */ __name(async (payload) => {
    const { data, eventId } = payload;
    const email = primaryEmailAddress(data);
    logger.info("Syncing updated Clerk user", {
      clerkUserId: data.id,
      eventId,
      hasEmail: email !== null
    });
    const [row] = await db.insert(users).values({ clerkUserId: data.id, email }).onConflictDoUpdate({
      target: users.clerkUserId,
      set: { email, updatedAt: /* @__PURE__ */ new Date() }
    }).returning({ id: users.id, clerkUserId: users.clerkUserId });
    logger.info("Clerk user updated", { userId: row.id });
    return { userId: row.id, clerkUserId: row.clerkUserId };
  }, "run")
});
export {
  clerkUserUpdated
};
//# sourceMappingURL=clerk-user-updated.mjs.map
