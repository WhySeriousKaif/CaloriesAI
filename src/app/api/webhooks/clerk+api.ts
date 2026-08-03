import { verifyWebhook } from "@clerk/backend/webhooks";
import { idempotencyKeys, tasks } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";

import { db } from "../../../../db";
import { users } from "../../../../db/schema";
import { deleteUserImages } from "@/lib/imagekit";
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
 * Handles Svix Clerk webhook events (user.created, user.updated, user.deleted).
 * Performs immediate DB and ImageKit purge when a user account is deleted.
 */
export async function POST(request: Request) {
  const signingSecret =
    process.env.CLERK_WEBHOOK_SIGNING_SECRET ?? process.env.CLERK_WEBHOOK_SECRET;

  if (!signingSecret) {
    console.error(
      "[clerk-webhook] No signing secret set (CLERK_WEBHOOK_SIGNING_SECRET)"
    );
    return Response.json({ error: "Not configured" }, { status: 500 });
  }

  let event;
  try {
    event = await verifyWebhook(request, { signingSecret });
  } catch (error) {
    console.error("[clerk-webhook] Verification failed:", error);
    return Response.json({ error: "Verification failed" }, { status: 400 });
  }

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
        if (event.data.id) {
          try {
            // 1. Delete all user meal photos from ImageKit CDN
            const [userRow] = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.clerkUserId, event.data.id))
              .limit(1);

            if (userRow) {
              await deleteUserImages(userRow.id);
            }
            await deleteUserImages(event.data.id);

            // 2. Delete user row in Neon DB (cascades to all meals in Postgres)
            await db.delete(users).where(eq(users.clerkUserId, event.data.id));
            console.log(`[clerk-webhook] Purged user DB row & ImageKit photos for ${event.data.id}`);
          } catch (dbErr) {
            console.error("[clerk-webhook] Direct DB delete error:", dbErr);
          }
        }

        const payload: ClerkUserDeletedPayload = { data: event.data, eventId };
        const handle = await tasks.trigger<typeof clerkUserDeleted>(
          "clerk-user-deleted",
          payload,
          { idempotencyKey }
        );
        return Response.json({ handled: event.type, runId: handle.id });
      }

      default:
        return Response.json({ ignored: event.type });
    }
  } catch (error) {
    console.error(`[clerk-webhook] Failed to trigger task for ${event.type}:`, error);
    return Response.json({ error: "Failed to enqueue task" }, { status: 500 });
  }
}
