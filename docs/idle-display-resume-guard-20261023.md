# Empty rock display bounds and inactive-loop transitions

The prepared candidate corrects two independently demonstrated client defects:
an empty bonus-rock canvas retained full-field display bounds, and the loop
watchdog could count an observed loading, paused or hidden interval as an active
stall on the first callback after resuming. The scoped checks pass. Historical
White Screens and sustained campaign acceptance remain open.

Runtime commit: `494f7b7181befe42654f2d9e965a00f77e768c23`  
Runtime tree: `ce2ee28b9719b14161177c0493f660480eafc3b0`  
Parent: `9fd9c9d10216a9373ddfd8b22e579e8edbc29c95`  
Branch: `codex/idle-display-resume-guard-20261023`

The new branch disables automatic deployment in its first commit. Nine changed
runtime/config/test paths were independently read from the remote Git tree and
matched to the checked local blobs. The previous IDB callback guard is inherited.
No main merge, Testnet deployment or Mainnet change was performed. Existing fixed
release and rollback references remain the release boundaries.

## Empty display layer

`BonusRockLayer.tsx` previously reduced its raster backing to 1×1 after the
existing two-second empty grace period, while its CSS display stayed at 100% of
the game field. The candidate starts an empty canvas at 1×1 display pixels and
reduces both display dimensions after that same grace period on an existing
component update. The next active update restores the original 100% dimensions
before drawing. Stable active/empty updates perform no redundant style writes.

The original texture generation and active draw block match the pinned preceding
source byte for byte. The original DPR cap of 1.5, warm grace, seven prewarm timer
callbacks and cleanup are retained; there is no additional timer or animation
loop. Rock spawning, movement, hits, drops, points and effect durations are outside
this change. A paused scene with no updates still releases on its next update.

The pinned fixture is the original Git blob
`74ad7118985d768fb56020e69df669e5e64e516f`. Eight build-gated regressions execute
the actual compiled component callbacks with controlled hooks, an idle clock and
React-style prop commits. Original negative controls expose the initial and
post-grace display defect. The cases cover first drawing, exact 1999/2000ms
behavior, viewport regrowth, effect-only drawing, repeated updates, unavailable
contexts and unmount cleanup.

The native-browser helper renders three actual React roots: original, an
independent identical original control, and candidate. Each browser covers two
field sizes (430×825 and 820×900), DPR 1/1.5/3 and two activation/release cycles
per combination. Each cycle compares 13 active/effect/reuse frames.

| Browser | Cycles | Exact candidate RGBA comparisons | Valid original/twin controls | Errors |
| --- | ---: | ---: | ---: | ---: |
| Chromium 141.0.7390.37 | 12 | 156/156 | 156/156 | 0 |
| WPE-WebKit 26.5 | 12 | 156/156 | 156/156 | 0 |

All active raster dimensions, display dimensions and styles agree with the
original in those comparisons. Geometry and lifecycle assertions pass. The
component fixture controls the idle clock and stubs only diagnostic paint timing;
it uses original drawing code, actual React and native canvas pixels. These
312 native comparisons are separate from seven CPU-raster comparisons in the
existing failure-recovery helper. That helper also passes seven controlled
failure/lifecycle cases; its host now models the real canvas style/ref/clock.
The four existing bonus-rock gameplay tests pass, including 500-sector coverage.

WebKit LayerTree snapshots support the narrower display-bounds finding. At the
initial DPR-1 empty state, original/twin report 430×825 bounds and an estimated
1,419,000 bytes each, versus 1×1 and 4 bytes for the candidate. Three later DPR-1
released snapshots report zero estimated memory for both versions despite their
different bounds. Other released snapshots show smaller candidate estimates;
initial DPR-1.5/3 snapshots expose no layers. Estimates depend on snapshot state,
are not resident RAM, and do not establish persistent memory savings, higher game
FPS or an iPhone termination fix. Raw snapshots are preserved.

## Watchdog transition

`gameLoop.ts` now remembers whether active, visible play was observed. An observed
inactive callback resets the measurement; the first callback that observes
active play rearms it. Only a subsequent interval of active visible play can be
counted as a stall. This prevents a reproducible inactive gap from being reported
as a foreground freeze.

The watchdog still detects a genuine gap strictly greater than 2500ms. Both RAF
and watcher paths use that unchanged threshold. Pending-frame replacement,
generation invalidation, one RAF chain, explicit Resume and frame-error recovery
are retained. The existing GamePage watcher interval, simulation timing, player
state, lives, rewards, saves and paid-weapon timers are unchanged. Activity
transitions never observed by either callback cannot be inferred by this guard.

Running the expanded tests against unchanged original loop source gives ten
passes and seven failures. With the correction all 17 pass. The new cases cover
paused, hidden and initial-loading transitions through RAF and watcher, exact
2500/2501ms behavior, delayed active RAF detection and a first-resumed-frame
exception. Existing actual-GamePage recovery and bounded diagnostic tests remain
in the suite.

## Production bundle and limits

The full frontend build passes 119 tests (12 localization, 43 session/store,
15 canvas-URL, 24 weapon/purchase recovery, eight rock-display and 17 game-loop),
the localization release check, project TypeScript and Vite. Changed source,
tests and helper files pass targeted ESLint; `git diff --check` passes. The build
retains 1740 original-resolution painted hulls, 95,450,326 bytes, revision
`91a72bc0c36be9407915`. The existing large-chunk warning remains.

The final production bundle passes the actual Router flow
Home → Play → Pause → Resume → Home independently in Chromium and standalone
WPE-WebKit, with original fonts served locally. These are short checks, one per
engine at 430×825/DPR 3, using synthetic guest SDK/API boundaries and read-only
canvas/audio observations. There are no gameplay hooks, recovery bypasses,
unexpected external requests, JS/console errors, HTTP errors or missing assets.
Normal Home-music request cancellation is recorded separately. The rock canvas
is 1×1 when idle and removed on leaving play; the two game audio contexts close
on Home. The shared card context and new Home-music context remain active.

An earlier rock-only bundle passed Chromium but reached a technical pause after
Resume in WebKit, preventing Home. This failed run is preserved and was not
relabelled as passing. It prompted the deterministic watchdog investigation;
the exact cause of that native pause is not established. Passing the corrected
short flow does not establish the cause of older sustained active stalls.

The bundle was built while the worktree still identified parent `9fd9c9d` plus
the uncommitted candidate. Reports retain that provenance. SHA-256 fingerprints
of both changed application modules match runtime commit `494f7b7`; the build
was not rerun merely to change its Git label.

No physical iPhone/PiBrowser, real Pi authentication/payment, native process RAM,
long campaign or natural White-Screen reproduction is claimed. The earlier
sector-57/59 active-loop stalls and historical device White Screens are still
open. Rejected milky-band/cache/clip experiments are excluded. No further owner
campaign, repeated purchase, browser-data clearing or OS report is required for
reviewing these corrections.

## Repeating the scoped checks

From `frontend`, run `VITE_CRYPTOID_DIAGNOSTICS=0 npm run build`. The build includes
`npm run test:rock-display-bounds` and `npm run test:game-loop`.

`node scripts/verifyIdleRockDisplay.mjs` uses an installed Playwright package.
Set `CRYPTOID_PLAYWRIGHT_PACKAGE` to its importable package path (or provide
`CODEX_PRIMARY_RUNTIME_NODE_MODULES`), `CRYPTOID_ROCK_ENGINE` to `chromium` or
`webkit`, and `CRYPTOID_ROCK_DISPLAY_REPORT` to an output JSON path. An installed
custom browser may use `CRYPTOID_BROWSER_EXECUTABLE`; supply its required native
libraries/environment. The recorded Chromium run disables accelerated 2D canvas;
the WPE run uses Linux software rendering. These are local fixture conditions.

`node scripts/verifyRockFailureRecovery.mjs` additionally needs the historical
Git commit `b15306f2d22d2196275091c904d068829879efc7` and its CPU-canvas dependency;
set `CRYPTOID_ROCK_FIX_REPORT` for JSON output. The four logic tests run with
`node --experimental-strip-types --test src/pages/bonusRocks.test.mjs`.

The adjacent JSON records source fingerprints and result boundaries. The
`idle-display-resume-guard-20261023/` evidence directory retains native reports,
the failed earlier UI run, final UI reports, build/negative-control logs and the
exact production-route audit helper. That audit helper documents the original
scratch fixture layout; fonts, native browser installation and compatibility
package must be prepared before replaying it. It is verification scaffolding.
