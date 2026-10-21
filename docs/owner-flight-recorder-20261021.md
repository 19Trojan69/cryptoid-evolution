# Owner flight recorder — preparation, 21 October 2026

Not published. Official Testnet remains cc5ef2276feb651edcf0681222865e8c957f8a4e,
tree 5d2a7002beedd357d17e68a4f46e33bc01204b64 / READY
dpl_8zBFheLX2x4hLUMTYUxChv4exrts. This candidate includes that exact runtime
and its completed release record; no pending visual patch is imported.

## Evidence gap and scope

The supplied interrupted boss-2 reports have timingCapture=null: the existing
detailed recorder needs manual arming and stops after 90 seconds. Sparse resource
counters cannot distinguish simulation, scene scheduling and raster-work timing.
The new recorder automatically reuses those existing hooks only for the
server-verified Testnet owner. No URL/local flag enables it. Nothing is transmitted.
No game/UI/art/audio/assets/account/save/API/recovery change; no new scheduler,
listener or overlay. There is extra bounded diagnostic work for the owner;
it is not claimed to be free or an iPhone stability fix.

Thirty aggregate windows (normally about 60 active seconds) and 64 technical
events form a rolling record, normally persisted every two seconds to independent
local/session stores. Expensive browser/resource enumerations run at most once
per ten seconds. Paused/background time is excluded from frame gaps. A new
substantive run archives the preceding record; loading/StrictMode cannot erase it.
Each stored string is capped at 65,536 characters. The read-only owner report
adds flightRecorders with at most two deduplicated records. This is additive to
the existing report version 5 and leaves the armed timing/audio captures intact.

The manual 90-second and automatic capture coexist. Independent timing leases
are released by identity; expiry of one cannot stop the other. The first fault
is saved immediately even inside the normal throttle and before a full sample;
subsequent fault storms remain throttled/bounded. Export now preserves only a
compiled asset basename and line/column, not raw exception text, stack or URL.
These coordinates can locate a JavaScript error, not an OS process termination.

## Verification

- Focused diagnostic suite, including 14 new rolling-recorder tests, covers
  owner/active-view gates, denied quota/storage, malformed/oversized records,
  privacy, early faults, repeated faults, pause exclusion, 20-minute synthetic
  run, archive/restart, independent manual expiry and full cleanup.
- Exact-source guard compares the whole GamePage against the verified official
  tree after substituting only the diagnostic import/factory setup. All actual
  simulation/input/scene/audio/recovery code remains byte identical.
- Actual GamePage simulation host passes 30 normal sections/three bosses,
  pause/recovery, with zero RAF/timers/listeners after cleanup. The host uses
  ordinary-player mode and presentation/audio/account stubs.
- Native Chromium QA: 72,000 synthetic hook frames (20 simulated minutes),
  30 bounded samples, 120 heavy snapshots, 1,194 storage writes. Final string
  29,741 characters. A real document reload without calling finish retains the
  prior unfinished record; the next run preserves it and releases timing.
  Host execution 449.2 ms, combined native storage writes 60.1 ms, maximum
  individual storage write 1.9 ms in this run. Synthetic clock/callbacks mean
  these are NOT real-time gameplay, iPhone cost, displayed FPS or GPU results.
  Reproduce: node frontend/scripts/verifyOwnerFlightRecorder.mjs with configured
  runtime Playwright and native Chromium paths (see script environment overrides).
- Targeted lint for new/changed diagnostic modules passes. Release build passes
  TypeScript/Vite and all 12 locale tests; existing large-chunk warning remains.
- An initial broad historical audio test run has 66 passes/one failure: its
  exact-source assertion cannot read the old 53640c0 Git file in this workspace.
  That is not presented as a passing test or a newly observed runtime defect.
  The separate current-official exact-source guard passes. Historical test is
  left unchanged. Runtime logs are not accessed after the earlier permission denial.

## Limits and next device evidence

Storage can fail or be cleared and the most recent unsaved window can be lost.
An unfinished record alone is not proof of an OS kill. Resource estimates omit
native/GPU/process memory; RAF cadence and React commits are not presented FPS.
Browser code cannot read actual iPhone display brightness or temperature, nor
obtain a reliable OS termination reason. Whole-display dimming plus a hot/charging
phone is consistent with thermal protection, not proof it caused this interruption.
The owner has already confirmed those observations and has no Mac; do not ask
again or require another full campaign merely to collect the same counters.
A matching iOS system termination/analytics record would still be needed to
attribute an OS memory/thermal kill. Do not assign the older unattributed Jetsam
log to a new run. This candidate needs a separate publication instruction.
