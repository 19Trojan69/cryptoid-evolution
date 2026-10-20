# Remaining official Testnet iPhone slowdown: isolated investigation

20 October 2026. **Preparation only; nothing deployed.**

## Fresh reference check

The existing Vercel alias and project were read through the connector at the
start of this continuation. Official Testnet remains READY production deployment
`dpl_BvFoZifj5ZFqEqCTEBixwfoUPpcH`, runtime commit
`51e59c3373a8dd4ba4985d5a9559acdcf2d6755a`. A fresh Git fetch verifies its tree is
`9a614fc69e88f6c8a55954c72131bb6df16a5798`. The fixed release branch points there.
The remote audit head was `3785bba59436aab89d97436d6a43f07b437bd721`, tree
`e762713ae79208b741f32e0557814a042bd8fe74`: its runtime matches the release;
only the approved release/owner-feedback documentation differs.

The older local head `b604677252900e4e1c1799db754ece1579181185` had that same
audit tree and is preserved by `backup/local-lifetime-audit-before-timing-20261020`.
The local audit branch was aligned with its actual remote parent before edits.
No unofficial test-game source or old preview was imported.

Rollback commit `a889d22cc9c1142f51773e073c41b0a7c8aa13d8` remains on
`backup/testnet-before-image-lifetime-20261020`; its deployment
`dpl_DssUzk9j8fruG7HY7BNPUMfYZjmW` was freshly confirmed READY. A first request
with the explicit recorded team returned 404; the deployment ID in the existing
connector context succeeded. That 404 is not evidence of a lost backup.
Mainnet remains READY `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe`, source
`907d2a7363345d00f0f90c54402bf04e887b64d9`.

Automatic Vercel deployment remains disabled for the audit branch in the
unchanged `vercel.json`. Both fixed remote reference branches are preserved.

## What is established

The latest supplied iPhone run was voluntarily exited by the owner. Its
`home-intent`, same boot ID and completed boss fights must not be relabeled
as an unexpected restart. The weaker subjective slowdown is encouraging;
neither permanent stability nor the original Whitescreen cause is proven.

The official GamePage uses an existing compact-screen request threshold of
32 ms, raised to 50 ms when its slow-frame score reaches six. Every simulation
delta is capped at 34 ms. The firing timer accumulates this capped delta, as do
projectile advances. Consequently a sustained long RAF gap can slow actual
simulated firing/motion relative to wall time, in addition to reducing scene
requests. These mechanisms predate the image-lifetime release.

`verifyOfficialTiming.mjs` extracts the timing expressions from exact official
source and replays controlled input gaps. It also compares the **whole simulation
AST** with the candidate after removing only optional performance-hook statements,
and separately confirms the GameEntry authorization gate is unchanged.

| Synthetic input, 430 px field | Scene requests/s | Frames selecting 50-ms threshold | Simulated progress / wall time |
| --- | ---: | ---: | ---: |
| 600 callbacks at 16.67 ms | 30 | 0/600 | 100% |
| 300 callbacks at 33.33 ms | 30 | 0/300 | 100% |
| 250 callbacks at 40 ms | 25 | 0/250 | 85% |
| 200 callbacks at 50 ms | 20 | 198/200 | 68% |
| 300 callbacks alternating 16.67/50 ms | 15 | 290/300 | 76% |

Each row covers ten seconds of synthetic input. Forced damage requests bypass
the threshold as before. An 800-px field requests all 600 updates in the 60-Hz
case. See [machine-readable replay](iphone-timing-investigation-20261020/timing-replay.json).
These are **request decisions and simulated deltas**, not displayed FPS,
measured iPhone behavior, a workload benchmark, or a campaign simulation.
The mixed-gap case demonstrates possible request quantization/amplification;
the V4 report cannot show whether it occurred in that actual run. Do not remove
the thresholds or change combat time on this evidence alone.

## Confirmed redundant work and limited correction

`paintedShip.shipImage` allocated a 240x240 canvas every time an evicted source
was reloaded, even when its URL's visual center was already retained. The actual
centering draw/readback was already skipped for a known center, so the second
surface did no useful work. The candidate checks the existing center first.
Unknown centers, optional tainted-image fallback, source sharing, materials,
original resolution, full decoded-byte accounting and all output pixels remain.

The native controlled-host test loads nine different real sources to evict the
first from the eight-source cache, then loads the first again. Official `51e59c3`
allocates ten centering surfaces; the candidate allocates nine. The negative
control fails the new assertion exactly as expected. One avoided surface is
230,400 logical RGBA bytes for that reload, not measured process/GPU memory or
a demonstrated frame-time improvement. This is transient redundant allocation,
not an established persistent leak or explanation for the Whitescreen.

## Prepared finite owner capture

The existing Admin Technical Report gains one button: prepare a 90-second
measurement. It rechecks `/admin/status` before obtaining browser storage.
The one-shot request is confined to that tab's session storage, expires after
ten minutes, and is consumed only after GameEntry's existing server-derived
`canAdmin` check. Ordinary players never read the request, create a probe,
sample runtime resources, or receive a new overlay/listener/timer/RAF.

The existing disabled developer probe supplies the already-placed section and
commit hooks. Its owner mode has no developer export global or external sink.
The RAF capture begins with the first playing frame and stops at the first
callback after 90 seconds of elapsed time, or earlier on unmount. At the limit
the GamePage probe reference and boss observer are removed. Background/pause
gaps are excluded from interval samples. StrictMode cleanup before a playing
frame restores the unused request. There is no new scheduler or game behavior.
Resource timing can also observe preparation from the armed game mount; work
already started before activation may not be fully timed.

The V5 owner-only report keeps the V4 resource/reload evidence and adds a
separate bounded `timingCapture`:

- RAF interval percentiles, section costs, actual volley gaps and shot-cap blocks;
- 16/32/50-ms decision counts, slow-score maximum, suppressed/forced requests;
- actual capped simulation milliseconds versus discarded wall milliseconds,
  including transition frames that return before a scene decision;
- scene requests, commits, request-to-commit and render-to-layout-effect times;
- synchronous source/material preparation, effect Canvas and boss-weapon drawing
  costs, and asynchronous encode/decode elapsed waits;
- cumulative resource counters with an explicit start baseline;
- exact source commit/tree and dirty-working-tree flag, plus document boot ID;
- persistence cost through completed earlier writes, so diagnostic storage work
  is visible. The write of the currently stored snapshot is not included.

The record is schema-filtered, <=90 aggregate samples and <=64 technical events,
with a 256-KiB input/output bound. Normal persistence is no more than once per
ten seconds; owner forced-event writes are limited to once per two seconds,
except the final completed snapshot. Account identities, tokens, purchases,
scores, shards, saves, raw exception messages/stacks and URLs are excluded.
Reading and copying recheck the existing server owner authorization. Nothing
is transmitted automatically. No backend/schema/account/security code changes.

Interpretation limits matter: section costs exclude much browser style/layout/
paint and GPU work. Boss drawing can overlap the render-to-commit measurement;
do not add those values as independent CPU totals. Async encoder/decoder waits
are not CPU duration. Cumulative maxima are not per-window maxima. Long-task
observation is not enabled for the owner capture; zero is not evidence of none.
Resource enumeration and storage add some overhead. Timer resolution can limit
small timings. No metric here measures whole browser/native/GPU memory or
proves OS termination, thermal throttling or compositor cost.

## Verification and review boundaries

- Fourteen native/controlled painted-image tests pass, including exact PNG/RGBA
  equality against current official `51e59c3`, failure/cancellation/shared loads,
  the new eviction/reload check and 1,100 real preparation-plan changes.
- New capture tests exercise permission denial/revocation, expiry, one-shot use,
  90-second stop, StrictMode, sanitized bounded export, denied storage, pauses
  and completion. The actual Admin component's arm/read/copy handlers are tested.
- 114 targeted capture, export, guarded-loop, input, audio, readiness, cache,
  boss and reload tests pass. No recovery or scheduling assertion is
  removed; its extracted-effect host now supplies the real owner factory.
- Native actual-component Canvas lifecycle tests pass 2,000 warm and 400 moving
  impacts, idle expiry, context loss, fallback and cleanup.
- 275 exact native explosion RGBA comparisons pass against official `51e59c3`
  across DPR 1, 1.5, 2, 2.625 and 3. Surface dimension writes remain exactly equal
  to the already-corrected official baseline.
- 500 exact native boss RGBA comparisons pass for all 50 current bosses at DPR
  1 and 3, live/heat/recoil, partial/full destruction and retained static output.
  Timing is enabled for this candidate check. The existing weapon renderer is
  byte-for-byte equal to current official source; all owned surfaces release.
- Frontend TypeScript/build and the complete-language release gate pass. The
  existing large-bundle warning remains. Dependency manifests/locks are unchanged.
- Local browser verification could not run: Playwright's Chromium executable
  is absent and react-test-renderer is unavailable. The native raster/hook hosts
  do not substitute for React/browser scheduling or a physical iPhone test.

The final read of both public aliases again returned the unchanged deployments
above. See [verification receipt](iphone-timing-investigation-20261020/verification.json).
The local production build embeds the full parent commit/tree and explicitly
marks its then-uncommitted candidate changes as dirty, rather than labeling that
bundle as a clean `3785bba` build. A later deployed build will identify its actual
source through the same compile-time fields.

Reproduce from `frontend`:

```sh
node scripts/verifyOfficialTiming.mjs
node --experimental-strip-types --test src/pages/ownerTimingCapture.test.mjs src/pages/performanceDiagnostics.test.mjs scripts/stabilityReport.test.mjs scripts/ownerStabilityReport.test.mjs src/pages/gameLoop.test.mjs src/pages/gameInput.test.mjs src/pages/gameAudio.test.mjs src/pages/gameAudioResume.test.mjs src/pages/musicPlayback.test.mjs src/pages/hullReadiness.test.mjs src/pages/resourceCacheDiagnostics.test.mjs src/pages/bossResourceDiagnostics.test.mjs src/pages/reloadDiagnostics.test.mjs
node --experimental-strip-types --test scripts/verifyPaintedShipLifetime.mjs
node scripts/verifyCanvasLifecycle.mjs
CRYPTOID_CANVAS_PIXEL_BASE=51e59c3373a8dd4ba4985d5a9559acdcf2d6755a node scripts/verifyCanvasSurfacePixels.mjs
node scripts/verifyTimingBossPixels.mjs
npm run build
```

Expected failing negative control (the assertion is deliberately not relaxed):

```sh
CRYPTOID_PAINTED_SOURCE_REF=51e59c3373a8dd4ba4985d5a9559acdcf2d6755a node --experimental-strip-types --test --test-name-pattern='reloaded sources with known' scripts/verifyPaintedShipLifetime.mjs
```

Primary WebKit guidance separates JavaScript, layout, paint and other frame work:
[Timelines Tab](https://webkit.org/web-inspector/timelines-tab/).
[Power usage guidance](https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/)
also distinguishes CPU/GPU and rendering activity. These sources support the
measurement boundaries, not a device-specific diagnosis. A Mac is not required
for the prepared in-app capture.

## Bounded next device question, only after a separately approved release

No new device replay is required against the currently published V4 counters.
The prepared capture is not yet on official Testnet. If later released with
separate authorization, use the existing owner Admin direct-start control for
one short normal-block capture and a separately armed boss-2 capture around
last turret/reactor opening. Stop after at most 90 seconds each; success does
not require completing a campaign or even defeating the boss. Export from the
same Pi Browser tab. Separate captures can distinguish cold/preparation work,
ordinary combat, effects and reactor work with the existing visuals intact.

The next decision should follow those costs: optimize demonstrated redundant
work first; assess cadence changes only with measured simulation/scene costs
and an explicit gameplay-preservation check. Original Whitescreen cause and
permanent iPhone stability remain open. No deployment, database write/reset,
account/save/highscore/payment mutation, or Mainnet change occurred here.
