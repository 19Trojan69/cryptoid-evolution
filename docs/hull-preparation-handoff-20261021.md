# Prepared hull handoff: verified correction, not published

Base runtime: f85360ed464fb75944ada0c3f1d22776c4df31ca, tree
2aac1e929e8992b9d93b5de0ffaf8675effc6f00. This branch carries its completed
release receipt as well. Official Testnet and all fixed references remain there.

## New report

The owner report generated 2026-10-21T15:26:23.173Z contains the automatic
flight recorder. Last normal level-19 start: 15:26:09.359Z; persisted ring:
09.381Z; replacement document timeOrigin: 10.981Z. The separation is 1.622 seconds
from transition or 1.600 seconds from the saved ring. The previous session marker
still says sector 18, so it must not override the newer transition record.

Last active samples have ~60-Hz RAF cadence, simulation p95 ~1 ms and React
render-to-commit p95 ~1 ms, with zero discarded simulation time. These are not
displayed-FPS/GPU measurements. The normal clear window has occasional longer
frame intervals (max 61 ms). No recorded JavaScript fault/normal exit; finished
is false. Long Tasks is unsupported, so zero is not a negative finding. The
known resource estimate is partial. Persist completed 160 writes in ~202 ms,
max 5 ms; this excludes the current write and is not a browser-memory measure.

The ring ends at phase-complete for level 18 because createPerformanceProbe
flushes the preceding phase before assigning/recording the incoming phase.
The subsequent write is throttled. Thus the missing phase-start in that saved
string does not prove execution stopped between the two JavaScript statements.
The 30 variable-length samples cover about 36 seconds here, not a guaranteed
60-second wall-clock window. The complete interruption cause remains open.

## Demonstrated resource defect

The parent GamePage effect returned the previous preparation's release function.
React runs that cleanup before the replacement effect setup. A plan contains
six current and six incoming hulls. Once all old pins disappear, the cache's
six-unused-entry policy may discard the incoming six if current hull reads
have made those incoming entries older in the LRU. The next setup paints the
same incoming graphics again. This is an unnecessary resource release/rebuild,
not a proved permanent leak or an observed iPhone termination cause.

The level 18→19 control reproduces 12 new paintings (six duplicate incoming +
six genuinely new lookahead variants). The correction retains the new plan
before releasing the old plan and produces six new paintings. Incoming Blob
URLs stay exactly the same. When incoming entries were already newest, both
versions need six jobs: no universal 50% workload/FPS/memory claim is supported.
The report's 259→271→283 cumulative job increments are compatible with repeat
work but do not establish its exact LRU history or causal role in the exit.

usePreparedGameHulls owns one plan across dependency updates and explicitly
releases it on route unmount/StrictMode cleanup. The plans, source preloads,
cached pixels, raster resolution, shader, cache budgets and mounted-consumer
protection are unchanged. There are no new timers or RAF chains. The previous
plan survives only through acquiring its successor in the same effect call.

## Verification

- Seven actual React 19.2.4 tests: failing-before/passing-after handoff, unchanged
  render updates, ordinary LRU control, StrictMode/unmount, still-mounted hull,
  1,100 plan changes over 500 sectors/bosses/bonus/reinforcements, and exact
  GamePage source parity outside the hook substitution.
- Fourteen owner recorder and one cache-counter regression: 22 combined pass.
  The earlier source guard now normalizes this exact hook substitution only.
- Two native Canvas/Image/Blob preparation controls use real official PNGs and
  the unchanged actual painting/cache path. Old control revokes six prepared
  next-level URLs and paints 12; acquire-before-release revokes none of those
  six URLs and paints six. Both leave zero working Canvas bytes/pins on exit.
- Eleven existing native painting lifetime cases pass: delayed source, encode,
  image and decode cancellation, retry, shared current consumers, cache churn,
  unresolved-source deduplication, known-center reuse and 500-sector rapid plans.
- Actual GamePage simulation host: 30 normal sections/three bosses, pause/save/
  recovery and final zero RAF/timers/listeners. Presentation/audio/accounts stubbed.
- New hook lint, TypeScript and release build/12 locale tests pass. Existing
  Vite chunk warning remains. Native tests are not physical iPhone/WebKit proof.

Reproduction: set CRYPTOID_SCENE_QA to a directory containing matching installed
React/react-test-renderer 19.2.4, then run node --experimental-strip-types --test
frontend/scripts/verifyPreparedHullHandoff.mjs. Native tests use
CRYPTOID_NATIVE_CANVAS_MODULE and test-name-pattern 'level transition audit' in
frontend/scripts/verifyPaintedShipLifetime.mjs. No production dependency changes.

The initial native harness tried to reload already-revoked test images during a
second drain; fixed by retaining its test completion sets across drains. The
initial React fixture 19.3.1 mismatched the installed application 19.2.4; matching
temporary QA packages were installed with scripts disabled. These are harness
corrections, not app defects. No deployment or new device replay was requested.
