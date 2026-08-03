import type { DeletedObjectJSON, UserJSON } from "@clerk/backend";

/**
 * Payloads sent from `POST /api/webhooks/clerk` to the three sync tasks.
 *
 * The route verifies the Svix signature and then hands the raw Clerk event
 * data straight through, so the mapping from Clerk's shape to our `users` row
 * lives in exactly one place: the tasks.
 */
export type ClerkUserEventPayload = {
  /** The `user.created` / `user.updated` payload from Clerk. */
  data: UserJSON;
  /** The `svix-id` header — stable across Svix retries, so it doubles as an idempotency key. */
  eventId: string;
};

export type ClerkUserDeletedPayload = {
  /** The `user.deleted` payload. Clerk marks `id` optional on deleted objects. */
  data: DeletedObjectJSON;
  eventId: string;
};

/**
 * Clerk sends every email address on the user, not just the primary one.
 * Prefer the primary; fall back to the first so a user who signed up with an
 * unverified-but-only address still gets an email stored.
 */
export function primaryEmailAddress(data: UserJSON): string | null {
  const primary = data.email_addresses?.find(
    (address) => address.id === data.primary_email_address_id
  );

  return (primary ?? data.email_addresses?.[0])?.email_address ?? null;
}
