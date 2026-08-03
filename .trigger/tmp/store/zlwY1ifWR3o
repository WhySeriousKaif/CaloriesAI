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

// trigger/clerk-user-created.ts
init_esm();
var clerkUserCreated = task({
  id: "clerk-user-created",
  run: /* @__PURE__ */ __name(async (payload) => {
    const { data, eventId } = payload;
    const email = primaryEmailAddress(data);
    logger.info("Syncing created Clerk user", {
      clerkUserId: data.id,
      eventId,
      hasEmail: email !== null
    });
    const [row] = await db.insert(users).values({ clerkUserId: data.id, email }).onConflictDoUpdate({
      target: users.clerkUserId,
      // The row already existed (profile POST won the race). Only refresh what
      // Clerk owns — never clobber onboarding answers or the generated plan.
      set: { email, updatedAt: /* @__PURE__ */ new Date() }
    }).returning({ id: users.id, clerkUserId: users.clerkUserId });
    logger.info("Clerk user synced", { userId: row.id });
    return { userId: row.id, clerkUserId: row.clerkUserId };
  }, "run")
});
export {
  clerkUserCreated
};
//# sourceMappingURL=clerk-user-created.mjs.map
