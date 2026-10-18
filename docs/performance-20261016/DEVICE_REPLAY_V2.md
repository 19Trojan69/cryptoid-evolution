# Device replay startup correction — 18 October 2026

## Browser finding

The user manually created a share link for v1. Opening it in the cloud browser
showed the correct ready screen without Vercel login. Pressing Test starten
instead displayed Anmeldung läuft …, with the counter stuck at 88 s. Browser
console contained extension metadata errors, not an application stack trace.

The first broken boundary was GameEntry mounting GamePage: the isolated auth
stub incorrectly returned authReady=false. GameEntry correctly waits for a
settled auth state. The ordinary application's gate is not defective.

## Corrections limited to the diagnostic

- A tested, settled **guest** auth fixture now returns authReady=true,
  isLoading=false, empty authError, and no authenticated user. Its exact source
  is injected by the builder. Pi login and account APIs remain excluded.
- A 5-second mount watchdog produces a partial fixture-not-started report;
  Beenden can also stop a test that never mounted. A stuck entry no longer
  silently leaves an unresponsive 88-second counter.
- Static fetches retain this preview origin's Vercel protection cookie using
  same-origin credentials. Cross-origin requests, non-static paths and non-GET
  methods remain denied. No game account credentials are added.
- Controlled fixture contact cooldown prevents ordinary collisions from
  removing enemies during fixed-count comparison phases. This only initializes
  the test fixture; the production simulation and collision rules are unchanged.

No frontend/src application file changed. The builder still verifies GamePage
SHA-256 eb628a5d73247ea64ec5443d2ff4efdab071a97228634f16f2aa915cdc832607,
the source from published Testnet commit 27d174788327c3423f04ace32be61af67a2004cc.
The original 34 ms delta cap, weapons, styles and renderer remain intact.

## Verification

- `node --test scripts/deviceReplay/*.test.mjs`: 8/8 pass, including exact
  injected auth readiness, no account identity, and timeout before mounting.
- `node scripts/verifyDeviceReplay.cjs` with 390×844 viewport and synthetic frame
  steps 16 ms and 50 ms: both complete all four phases in 88 seconds of injected
  wall time, with enemy counts 6/6/1/6, weapon levels 1/2/2/1 and zero fixture
  resets. Volleys per phase are respectively 62 and 42, accepted time ratios
  respectively 1 and 0.68. Reports are adjacent to this document.
- These integration reports execute real GamePage simulation but stub rendering,
  audio and account APIs. They are NOT browser performance/device measurements.
- The first mobile-fixture integration run exposed collision removal (5 rather
  than 6 surviving enemies). This led to the test-only cooldown correction, not
  a weakened assertion. Both fixed fixture runs then passed.
- v2 static build passes source-hash/module-exclusion assertions. Package
  versions come from the existing frozen yarn.lock. Optional package fetching
  stalled; installation used the existing package cache with optional packages
  omitted, and esbuild used its cached matching 0.27.4 Linux binary. No dependency
  manifest or lockfile changed. Build proof is retained alongside this note.

## Deployment and remaining boundary

- Build ID: device-replay-20261018-v2
- Existing Testnet project: prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF
- Deployment: dpl_BE8XtQxPZ4znyRekdt1URgxFL5Dk
- Preview: https://cryptoid-evolution-testnet-ochp5xi48-19-trojan69.vercel.app
- Independent deployment read: READY, target null, aliases empty, aliasError null.
- The native share-link operation returned 403 at read_protection_bypass. It was
  not retried unchanged, and project protection was not altered. The user then
  supplied a share link for this specific v2 preview on 18 October; it opened
  the ready screen without a Vercel login. The share token is not retained here.
- The v1 share link must not be described as serving v2. Deployments are separate.
- The v2 real-renderer Chrome run and report download are now verified below.
  The slowdown in the actual Pi Browser remains unresolved.
- Fixed Testnet/main aliases are checked independently; neither is promoted or
  reassigned as part of this diagnostic work.

## Actual browser verification — 18 October 2026

Story: open the user-shared isolated preview, start without an account, render
the real game through all four comparison phases, and export its report.
This static diagnostic intentionally has no application API/data boundary.

- Browser: Linux Chrome 154, viewport 1363×936, device pixel ratio 1. This is
  not the user's iPhone or Pi Browser, and is not mobile emulation.
- Test starten mounted the real game immediately rather than remaining at
  Anmeldung läuft. Visual inspection showed prepared hulls, projectiles, the
  original field/HUD and shield; the test advanced through all four phases.
- Completed after 88063.6 ms, with no issues, blocked requests or fixture resets.
  Enemy counts were 6/6/1/6, weapon levels 1/2/2/1; all phases ended playing.
- Delivered FPS by phase: 59.31 / 59.36 / 59.91 / 59.86. Accepted simulation
  time ratios: 0.9984 / 0.9968 / 0.9992 / 1. Each phase produced 62 volleys.
  This run did not reproduce sustained slowdown. It does not rule it out on
  the actual device or during a longer ordinary campaign.
- Sound was enabled and the report recorded one active audio voice at each
  phase end. Audible output was not independently assessed by this browser tool.
- The final UI displayed Messung beendet and fully completed. Bericht ansehen
  exposed its report. Bericht herunterladen produced a valid JSON file exactly
  matching the displayed report. Its SHA-256 is
  bc730a0e161145add5e54fb161a073c214ce73160cddf216ca73cb238d879bed.
- Bericht kopieren displayed Bericht kopiert, but the cloud clipboard reader
  returned an empty string twice. Actual clipboard contents are not verified;
  use the tested JSON download or visible report if paste is empty on a device.
  This observation alone does not establish a Pi Browser clipboard defect.
- Console errors were browser-extension metadata failures only; no application
  error was observed during this run. No server/function logs are expected for
  the static client-only diagnostic.
- Raw report: device-replay-v2-browser-chrome.json. Final screenshot:
  device-replay-v2-browser-finished.jpg. Neither contains the share token.
- The public Testnet alias still points to dpl_BX7ZeCr9Qr6anBa3AZnzLERubpQM
  (27d1747); the main app alias still points to dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe
  (907d2a7). No normal application source or deployment was changed.

Next evidence: one foreground ~90-second run of this same v2 preview in the
user's actual Pi Browser, with its resulting report. No campaign playthrough
is required. A successful diagnostic run is not a fix for the reported slowdown.
