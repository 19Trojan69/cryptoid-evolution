# Private diagnostic backup

Only the isolated owner-private preview installs `window.__cryptoidTraceSink`.
The public game never installs this sink and has no diagnostic network endpoint.
The platform's existing private Site access applies to every route; do not widen
its audience. The service stores only allow-listed technical counters and event
types, an ephemeral random run ID, revision and server timestamp. No account,
wallet, input text, full error message, stack, URL or authorization token is stored.

The probe sends on its existing ten-second checkpoint cadence and immediately at
damage, boss-defeat/final-blast, lifecycle and error markers. Requests are bounded
and coalesced, with a five-second timeout, no polling and no blocking of the game.
A confirmed acknowledgement is necessary before showing a successful backup.
Reopening fetches the latest confirmed private record, independently of Web Storage.
An offline or terminated process may lose its last unsent/in-flight checkpoint.

The D1 table retains at most eight runs. GET/POST remove records older than seven
days on access; there is no scheduled background deletion. `server-qa` synthetic
records are excluded from the ordinary latest-record response.

## Reproduction

Use the official Sites Vinext starter and its package/install/build helpers. Open
the existing private Site before editing, preserve its ID and owner-only access.
From the frontend checkout:

```sh
node scripts/buildCrashPreview.mjs /tmp/Cryptoid_Absturzdiagnose_V5.html SITE_CHECKOUT/public
node scripts/prepareCrashPreviewServer.mjs SITE_CHECKOUT
```

The starter's root `app/page.tsx` must be absent when `app/route.ts` serves raw game
HTML. `public` carries the original game assets. Build/package/push the exact source
with official Sites helpers, then deploy only to the existing private preview.
The checked-in generated Drizzle migration runs before worker activation. Never
edit an already published migration or issue runtime DDL.

Tests: `node --experimental-strip-types --test src/pages/remoteTraceBackup.test.mjs
src/pages/diagnosticExport.test.mjs`. SQLite tests execute the actual service SQL,
including recovery after complete browser-storage loss, revision protection,
bounded retention, payload filtering and network failure. They do not prove that
a device crash is fixed or that its last unsent frame can be recovered.

V5 adds boss model/texture/first Canvas routine checkpoints and estimated retained effect PCM bytes. These are not GPU-memory or successful-presentation measurements. Critical boss phase starts are persisted immediately; ordinary frame checkpoints keep their previous cadence.
