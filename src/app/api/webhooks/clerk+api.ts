import { verifyWebhook } from "@clerk/backend/webhooks";
import { idempotencyKeys, tasks } from "@trigger.dev/sdk";

import type {
  ClerkUserDeletedPayload,
  ClerkUserEventPayload,
} from "../../../../trigger/clerk-shared";
import type { clerkUserCreated } from "../../../../trigger/clerk-user-created";
import type { clerkUserDeleted } from "../../../../trigger/clerk-user-deleted";
import type { clerkUserUpdated } from "../../../../trigger/clerk-user-updated";

/**
 * `POST /api/webhooks/clerk`
 *
 * Verifies the Svix signature, then hands the event to a Trigger.dev task and
 * returns immediately. The DB write happens in the background: Svix expects a
 * fast 2xx, and Trigger.dev gives us retries, logs, and a run history for free.
 *
 * This route is intentionally unauthenticated — the signature *is* the auth.
 */
export async function POST(request: Request) {
  // Clerk's own docs name this CLERK_WEBHOOK_SIGNING_SECRET; accept the shorter
  // name too so whichever one is in .env works.
  const signingSecret =
    process.env.CLERK_WEBHOOK_SIGNING_SECRET ?? process.env.CLERK_WEBHOOK_SECRET;

  if (!signingSecret) {
    console.error(
      "[clerk-webhook] No signing secret set (CLERK_WEBHOOK_SIGNING_SECRET)"
    );
    return Response.json({ error: "Not configured" }, { status: 500 });
  }

  // ALWAYS verify. Without this the endpoint accepts spoofed events from anyone.
  let event;
  try {
    event = await verifyWebhook(request, { signingSecret });
  } catch (error) {
    console.error("[clerk-webhook] Verification failed:", error);
    return Response.json({ error: "Verification failed" }, { status: 400 });
  }

  // Stable across Svix's retry schedule, so it deduplicates a redelivered event.
  const eventId = request.headers.get("svix-id") ?? event.data.id ?? "unknown";
  const idempotencyKey = await idempotencyKeys.create(
    `clerk-webhook-${eventId}`,
    { scope: "global" }
  );

  try {
    switch (event.type) {
      case "user.created": {
        const payload: ClerkUserEventPayload = { data: event.data, eventId };
        const handle = await tasks.trigger<typeof clerkUserCreated>(
          "clerk-user-created",
          payload,
          { idempotencyKey }
        );
        return Response.json({ handled: event.type, runId: handle.id });
      }

      case "user.updated": {
        const payload: ClerkUserEventPayload = { data: event.data, eventId };
        const handle = await tasks.trigger<typeof clerkUserUpdated>(
          "clerk-user-updated",
          payload,
          { idempotencyKey }
        );
        return Response.json({ handled: event.type, runId: handle.id });
      }

      case "user.deleted": {
        const payload: ClerkUserDeletedPayload = { data: event.data, eventId };
        const handle = await tasks.trigger<typeof clerkUserDeleted>(
          "clerk-user-deleted",
          payload,
          { idempotencyKey }
        );
        return Response.json({ handled: event.type, runId: handle.id });
      }

      default:
        // 2xx on purpose — an event we don't subscribe to isn't a failure, and
        // a non-2xx would put it on the Svix retry schedule forever.
        return Response.json({ ignored: event.type });
    }
  } catch (error) {
    // 5xx so Svix retries the delivery.
    console.error(`[clerk-webhook] Failed to trigger task for ${event.type}:`, error);
    return Response.json({ error: "Failed to enqueue task" }, { status: 500 });
  }
}
