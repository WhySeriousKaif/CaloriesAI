/**
 * Sends a correctly-signed fake Clerk webhook to the local route.
 *
 * This exercises the real chain — signature verification → Trigger.dev task →
 * Neon write — without needing a tunnel or the Clerk Dashboard. It signs with
 * the same Svix scheme Clerk uses, so the route cannot tell it apart.
 *
 *   node ./scripts/test-webhook.mjs [created|updated|deleted]
 */
import crypto from "node:crypto";
import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trimStart().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [
        line.slice(0, i).trim(),
        line.slice(i + 1).trim().replace(/^["']|["']$/g, ""),
      ];
    })
);

const secret = env.CLERK_WEBHOOK_SIGNING_SECRET ?? env.CLERK_WEBHOOK_SECRET;
if (!secret) {
  console.error("No CLERK_WEBHOOK_SECRET in .env");
  process.exit(1);
}

const kind = process.argv[2] ?? "created";
const TEST_USER_ID = "user_localtest000000000000000";

const bodies = {
  created: {
    type: "user.created",
    object: "event",
    data: {
      id: TEST_USER_ID,
      email_addresses: [
        { id: "idn_1", email_address: "localtest@example.com" },
      ],
      primary_email_address_id: "idn_1",
    },
  },
  updated: {
    type: "user.updated",
    object: "event",
    data: {
      id: TEST_USER_ID,
      email_addresses: [
        { id: "idn_1", email_address: "localtest+updated@example.com" },
      ],
      primary_email_address_id: "idn_1",
    },
  },
  deleted: {
    type: "user.deleted",
    object: "event",
    data: { id: TEST_USER_ID, object: "user", deleted: true },
  },
};

const body = JSON.stringify(bodies[kind]);
// Unique per invocation, so the route's idempotency key doesn't dedupe reruns.
const svixId = `msg_local_${kind}_${process.pid}`;
const timestamp = Math.floor(Date.now() / 1000);

// Svix: sign `${id}.${timestamp}.${body}` with the base64-decoded secret.
const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
const signature = crypto
  .createHmac("sha256", key)
  .update(`${svixId}.${timestamp}.${body}`)
  .digest("base64");

const response = await fetch("http://localhost:8081/api/webhooks/clerk", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "svix-id": svixId,
    "svix-timestamp": String(timestamp),
    "svix-signature": `v1,${signature}`,
  },
  body,
});

console.log(`\n  ${kind} → HTTP ${response.status}`);
console.log(`  ${await response.text()}\n`);
process.exit(response.ok ? 0 : 1);
