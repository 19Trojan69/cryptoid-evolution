# Normal raster resolution and unused-resource retirement

The owner explicitly approved targeted memory cleanup and lower resolution, then
clarified that this is not a high-end game and ordinary resolution is sufficient.
This supersedes the earlier full-resolution restriction for this scoped change.
Only the existing Testnet is in scope; Mainnet, gameplay, HUD, audio, accounts,
purchases and durable saves are excluded.

Baseline runtime: e7b49fed4c29baf021d9f0af56fead66ff7d02b7, READY deployment
dpl_6uZ96rZE714sudgnFuzsjYTSxtcF. Audit parent: 22a5f1d.

## Implementation

- Normal explosion/debris surfaces and their raster fire/smoke textures cap
  device scale at 1.5. Boss weapon surfaces use the same cap, previously 2.
  Ordinary 1x screens are unchanged. CSS dimensions, animation ages, drawing
  instructions, source artwork and hit geometry are unchanged. Bonus rocks
  already cap at 1.5 and require no change. Text, HUD and controls remain native.
- At device scale 3, the affected ordinary backing surfaces use 25% of their
  former pixel area (75% less). Boss surfaces use approximately 56.25% of their
  previous area (43.75% less). Ceil rounding changes exact byte ratios slightly.
  These are backing-store calculations, not a reduction of all process memory.
- The painted-hull cache now targets 24 entries / 12 MiB and at most six unused
  recent variants, previously 48 entries / 24 MiB. Mounted/preparing users stay
  pinned, even when pins alone exceed a soft budget. Releasing a consumer trims
  obsolete entries and revokes their Blob URLs. No painting/shader/source-size
  change is made: the current small hull sources are already 282 x 282.
- Canvas hull resources keep two unused recently used source images. Fire/smoke
  textures keep two recent pairs once no preparing/mounted effect or draw record
  can use them. Retired texture canvases are explicitly zero-sized. A short idle
  gap still reuses the drawing surface; the existing two-second shrink deadline
  remains to avoid a shrink/grow cycle on every impact. Release is idempotent;
  stale decoding, active users, context loss and fallback semantics are retained.

## Verification before publication

- 33 resource/readiness/projectile/simulation tests pass, including 60/30/20 Hz,
  88-ms stalls and jittered actual GamePage delivery; shot speed is unchanged.
- 14 real painting/encoding/decoding lifetime tests pass, including cancellation,
  failures/retry, 500-sector/50-boss preparation and original PNG pixel equality.
- Canvas lifecycle passes 2,000 warm impacts, 400 moving impacts, pause/cleanup,
  context loss and null-context fallback. Texture retirement protects active
  consumers and zeroes only retired backing stores.
- 275 native-raster effect comparisons and 500 boss comparisons on all 50 bosses
  match the original drawing at the new capped density. These do NOT claim pixel
  equality between old high-density and new normal-density rendering.
- Existing 60 Hz effect cadence and wall-clock geometry tests pass using a
  reference with only its density selector capped for fair comparison.
- Preview release build passes TypeScript, twelve locale tests and locale gate.
  The existing large-chunk warning remains. New helper/cache/BossWeapons lint
  passes. paintedShip retains the same pre-existing set-state-in-effect error;
  this is not a wholly clean repository lint claim.
- Protected-preview-only memory-work page compares actual boss/effect artwork at
  both densities. It is excluded from production, like the older QA fixtures.

## Device evidence and limits

The uploaded Analytics-2026-10-21-020010.000.ips.ca.synced file is a scheduled
daily aggregate: startTimestamp 2026-10-20T00:00:00Z; report timestamp
2026-10-21 02:00 +0200. Its MemoryLimitViolationFrequencyWithLimit_v1 entry
associates WebKit.WebContent with pi.browser, terminated=true, Count=5. A
JetsamAggregationV4 entry has WebContent/per-process-limit/Count=5. No individual
timestamps or Cryptoid URL identify those events. The aggregate precedes the
owner-confirmed spontaneous 04:25 interruption. Do not assign it to that exact
run, interpret bucketed_limit=202 as MB, infer a GPU leak, or upload the raw
private analytics file into the repository. It supports prioritizing memory
reduction, not a proven allocation-level crash cause.

Browser/native acceptance and release receipt follow in
normal-memory-release-20261021/. None of these tests measures physical iPhone
native/GPU/process memory, temperature, presented FPS or a complete Whitescreen
fix. Preserve every fixed release and rollback ref; do not deploy later
evidence-only commits.
