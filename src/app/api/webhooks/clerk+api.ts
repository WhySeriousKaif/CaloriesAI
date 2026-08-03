import { verifyWebhook } from '@clerk/backend/webhooks';
import { idempotencyKeys, tasks } from '@trigger.dev/sdk';

// Type-only: importing the task instances would bundle them into the server.
import type {
  ClerkUserDeletedPayload,
  ClerkUserEventPayload,
} from '../../../../trigger/clerk-shared';
import type { clerkUserCreated } from '../../../../trigger/clerk-user-created';
import type { clerkUserDeleted } from '../../../../trigger/clerk-user-deleted';
import type { clerkUserUpdated } from '../../../../trigger/clerk-user-updated';

/**
 * `POST /api/webhooks/clerk`
 *
 * Verifies the Svix signature and hands the event straight to a Trigger.dev
 * task. The route itself touches neither the database nor ImageKit — the tasks
 * own that, so the work is retried and observable rather than dying with the
 * request.
 */
export async function POST(request: Request) {
  const signingSecret =
    process.env.CLERK_WEBHOOK_SIGNING_SECRET ?? process.env.CLERK_WEBHOOK_SECRET;

  if (!signingSecret) {
    console.error('[clerk-webhook] No CLERK_WEBHOOK_SIGNING_SECRET set');
    return new Response('Not configured', { status: 500 });
  }

  let event;
  try {
    // Throws on a bad or replayed signature.
    event = await verifyWebhook(request, { signingSecret });
  } catch (error) {
    console.error('[clerk-webhook] Verification failed:', error);
    return new Response('Invalid signature', { status: 400 });
  }

  // Svix retries with the same svix-id. Global scope = one event, one run, ever.
  const svixId = request.headers.get('svix-id');
  const idempotencyKey = svixId
    ? await idempotencyKeys.create(`clerk-webhook-${svixId}`, { scope: 'global' })
    : undefined;
  const eventId = svixId ?? event.data.id ?? 'unknown';

  try {
    switch (event.type) {
      case 'user.created': {
        const payload: ClerkUserEventPayload = { data: event.data, eventId };
        await tasks.trigger<typeof clerkUserCreated>('clerk-user-created', payload, {
          idempotencyKey,
        });
        break;
      }

      case 'user.updated': {
        const payload: ClerkUserEventPayload = { data: event.data, eventId };
        await tasks.trigger<typeof clerkUserUpdated>('clerk-user-updated', payload, {
          idempotencyKey,
        });
        break;
      }

      case 'user.deleted': {
        // `id` is optional on a deleted object — nothing to do without it.
        if (!event.data.id) break;
        const payload: ClerkUserDeletedPayload = { data: event.data, eventId };
        await tasks.trigger<typeof clerkUserDeleted>('clerk-user-deleted', payload, {
          idempotencyKey,
        });
        break;
      }
    }
  } catch (error) {
    // Trigger.dev is unreachable. 500 is correct here — this is the one case
    // where a Svix retry can actually fix things.
    console.error(`[clerk-webhook] Failed to enqueue ${event.type}:`, error);
    return new Response('Failed to enqueue task', { status: 500 });
  }

  // 200 on everything we verified, including events we don't handle — a non-2xx
  // makes Svix retry on a schedule, forever, for an event we ignore on purpose.
  return new Response('OK', { status: 200 });
}
