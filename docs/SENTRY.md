# Sentry setup for Calora

Everything in the codebase is already wired. This document is the list of
things **only you can do** (they need your Sentry account), in order, plus how
to prove each one worked.

Time needed: about 15 minutes.

---

## What's already done (no action needed)

| Piece | Where |
|---|---|
| SDK installed | `@sentry/react-native@7.11.0` in `package.json` |
| Native build integration | `@sentry/react-native/expo` plugin in `app.json` |
| `Sentry.init(...)` | `src/app/_layout.tsx` — only runs if a DSN is present |
| Error boundary | `export default Sentry.wrap(RootLayout)` |
| Navigation tracing | `Sentry.reactNavigationIntegration` registered against the router |
| Session replay | `Sentry.mobileReplayIntegration`, text/images masked in release builds |
| Logged-in user attached | `<SentryUser/>` mirrors the Clerk user id |
| DSN for cloud builds | `eas.json` → `preview.env` and `production.env` |
| QA screen | `src/app/debug-sentry.tsx` (Profile → Sentry test bench → *Open full QA bench*) |

---

## Step 0 — Make sure the SDK is actually installed

`@sentry/react-native` being listed in `package.json` is not the same as it
being on disk. If `node_modules/@sentry` is missing, the bundler fails with
`Unable to resolve module @sentry/react-native` and nothing below will work.

```bash
ls node_modules/@sentry/react-native >/dev/null && echo installed || npm install
```

---

## Step 1 — Fill in your org slug

`app.json` currently has your organisation **ID**. The Sentry CLI needs the
**slug**.

1. Open your Sentry dashboard.
2. Look at the URL: `https://<SLUG>.sentry.io/...` or
   `https://sentry.io/organizations/<SLUG>/`.
3. That `<SLUG>` — something like `kaif-ab` — is what you need.

Put it in `app.json`, replacing the org **ID** that's there now:

```json
[
  "@sentry/react-native/expo",
  {
    "organization": "calai",
    "project": "react-native"
  }
]
```

**`.env`** (used by the CLI for local builds):

```
SENTRY_ORG=calai
SENTRY_PROJECT=react-native
```

That's the only place it's needed. At build time the plugin turns those two
values into `defaults.org` / `defaults.project` in a generated
`sentry.properties`. An org slug isn't secret, so committing it is fine.

> The `SENTRY_ORG` / `SENTRY_PROJECT` entries in `.env` are a **fallback** the
> plugin uses only when `app.json` omits them. You don't need both — if you set
> `app.json`, you can leave the `.env` pair blank. (Setting them anyway does no
> harm; `app.json` wins.)

> Confirm the project name too — in Sentry, **Settings → Projects**. If the
> project isn't literally called `calorie-ai`, use its real slug.

**Why it matters:** wrong slug → source maps silently fail to upload → every
production stack trace looks like `index.android.bundle:1:428193` instead of
`camera.tsx:142`. The app still reports errors; they're just unreadable.

---

## Step 2 — Create an auth token

This is what lets the build upload source maps. It is a **build-time secret**
and never ships inside the app.

1. Sentry → **Settings → Developer Settings → Auth Tokens** → *Create New Token*.
2. Name it `calora-eas-build`.
3. Scopes: tick **`project:releases`** and **`org:read`**.
4. Copy the token (shown once).

Paste it into `.env`:

```
SENTRY_AUTH_TOKEN=sntrys_...
```

`.env` is gitignored — verified. Never commit this token.

---

## Step 3 — Give EAS the same token

`.env` is local only, so cloud builds need the token as an EAS secret:

```bash
npx eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "sntrys_..."
```

Verify it landed:

```bash
npx eas secret:list
```

You should see `SENTRY_AUTH_TOKEN`. The DSN is already in `eas.json`, so nothing
else is needed there.

---

## Step 4 — Build a dev client

**Sentry cannot be fully tested in Expo Go.** Native crashes, session replay and
profiling all need custom native code, which Expo Go doesn't have. JS errors
*do* get through, so Expo Go will look half-working and mislead you.

Pick one:

```bash
# Fastest — builds locally, needs Xcode (iOS) or Android Studio
npx expo run:ios
npx expo run:android

# Or in the cloud
npx eas build --profile development --platform ios
```

Then start the bundler. The `--clear` matters: the DSN is inlined into the
bundle at build time, so a stale cache keeps the old (empty) value.

```bash
npx expo start --clear
```

---

## Step 5 — Prove it works

Open the app → **Profile → About → Sentry test bench**.

### 5a. Check the connection

Tap **Check Sentry Connection Status**. You should see a real readout:

```
SDK: initialised
Environment: development
Host: o4511834665189376.ingest.us.sentry.io
Project: 4511846419005440
Traces sample rate: 1
Logs: on
User: user_2abc...
```

If it says **"Sentry not initialised"**, the DSN didn't reach the bundle — go
back to Step 4 and restart with `--clear`.

### 5b. Send a real event

Tap **Trigger Test Exception Event**. The toast shows an event id
(`Event sent to Sentry — id a1b2c3d4`). Within ~30 seconds it appears in
Sentry → **Issues** as `Profile test event — triggered from the Sentry test bench`.

### 5c. Exercise the rest

Tap **Open full QA bench (dev only)** for the complete set:

- **Crashes** — render error, handler error, unhandled rejection, native crash
- **Handled errors** — tagged exceptions with custom context and fingerprints
- **Logs** — the five `Sentry.logger` levels (these need `enableLogs: true`,
  which is now set; they were silently no-ops before)
- **Performance** — a nested transaction with child spans

The **native crash** button closes the app. That's expected — the report uploads
when you relaunch, so open the app again and check Sentry.

### 5d. Confirm source maps

This is the step people skip, and it's the one that decides whether Sentry is
actually useful.

1. Build a **release** bundle: `npx eas build --profile preview --platform android`.
2. Watch the build log for `Uploading source maps` / `Analyzing 2 sources`.
   If you see `error: An organization slug is required`, Step 1 is wrong.
   If you see `error: authentication credentials not provided`, Step 3 is wrong.
3. Install that build, trigger a crash from the test bench.
4. In Sentry the stack trace should name **`profile.tsx` and a line number**.
   Minified junk means the upload didn't work.

---

## Turning it off

Blank the DSN:

```
EXPO_PUBLIC_SENTRY_DSN=
```

`Sentry.init` is guarded on it, so the SDK never starts and the app boots
normally. Useful for local work when you don't want to pollute Issues.

---

## Configuration notes

Set in `src/app/_layout.tsx`:

| Option | Dev | Release | Why |
|---|---|---|---|
| `tracesSampleRate` | 1.0 | 0.2 | 100% in production burns the quota fast |
| `profilesSampleRate` | 1.0 | 0.2 | same |
| `replaysSessionSampleRate` | 1.0 | 0.05 | replays are heavy; 5% is plenty for trends |
| `replaysOnErrorSampleRate` | 1.0 | 1.0 | always keep the replay that preceded a crash |
| `maskAllText` / `maskAllImages` | off | **on** | replays would otherwise record meal photos, weight and body-fat figures |
| `sendDefaultPii` | false | false | we attach the Clerk user id deliberately; no need for IPs |
| `enableLogs` | true | true | required for `Sentry.logger.*` |

If you'd rather see unmasked replays in production, flip `maskAllText` /
`maskAllImages` to `false` — but that is health data, so update your privacy
policy in `legal/privacy.html` to match.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Sentry not initialised" in the status alert | DSN not in the bundle | `npx expo start --clear` |
| Events arrive, stack traces are minified | source maps not uploaded | Steps 1–3, then check the build log |
| `An organization slug is required` | `organization` is the org ID, not the slug | Step 1 |
| `authentication credentials not provided` | no `SENTRY_AUTH_TOKEN` at build time | Steps 2–3 |
| Native crash button does nothing | running in Expo Go | Step 4, build a dev client |
| Log buttons do nothing | `enableLogs: false` | already fixed; rebuild the bundle |
| Nothing at all in Issues | wrong project, or an inbound filter | check the project id in the status alert matches the URL in Sentry |

---

## Not covered

Server-side errors are **not** in Sentry. The API routes under
`src/app/api/*` and the Trigger.dev tasks in `trigger/` report to the terminal
and the Trigger.dev dashboard only. Ask if you want those instrumented too.
