# Shared-resource follow-up — 19 October 2026

## New device evidence and boundary

The user confirms another interruption in the latest playable preview
(`dpl_EKgUuVpRJV5bTXZmvvDp26tQabiD`, GitHub 0cb51abb, local 6a559c3), outside a
boss, exact block unknown. That preview is therefore not a complete fix. Actual
comparison-toggle settings at interruption are unknown. No native crash cause
is established. No further full campaign or repeat collection of the same
partial byte counters is required for this investigation.

This follow-up remains a separate preview. Public Testnet source 66eb357 and
Mainnet source 907d2a7 are unchanged. The preceding preview and GitHub backup at
0cb51abb remain rollback references. No account/backend/Admin changes or sampler
for unverified preview guests. The existing larger turret bodies and Next Mission
summary remain intact.

## Confirmed code defects

1. **Raw hull loading escaped the LRU bound.** The eight-entry cache could evict
   a still-pending Promise. A later request created another Image for that same
   address while the old request still existed outside the cache. Under a
   deliberately stalled-load fixture over 500 internal normal-block source
   plans, the original component attempted 7,806 Image allocations for 20 unique
   addresses while reporting eight cache entries. This is an artificial pressure
   reproduction, not an observation of the user's network or native memory.
2. **The separate boss atlas cache had the same pending-eviction class of error.**
   Its two-entry Map bounded stored references, not actual pending loads.
3. **The rock layer allocated a full-field backing even while empty**, kept it
   through idle blocks and had no explicit backing release on unmount. At the
   reported 430×825 field / DPR 3 (rock renderer caps DPR at 1.5), that backing
   alone estimates 3,194,040 RGBA bytes. It was outside the CanvasEffects surface
   counter. These are bitmap estimates, not measured GPU/process memory.

## Corrections and invariant scope

Raw sources now have at most three active Image loads; warming uses at most two
and reserves a slot for a newly needed hull. Warming active+queued requests are
capped at eight. Pending requests are pinned in the existing cache until settled,
so pending eviction cannot create duplicate loads. Foreground requests are
prioritized and are never discarded at the warming cap. Speculative paint jobs
defer at capacity, remove their cancelled pending entry before rejection and can
be requested afresh by a mounted consumer. Both material warming and direct raw
warming follow the same priority rules. Failure releases pins/slots and permits
retry. Completed unused raw entries still trim to eight.

The boss atlas cache now pins pending promises and limits active loads to two;
warming uses one, reserving the second for the visible boss. Completed unused
entries still trim to two. Pending queue entries hold promise/config metadata,
not an allocated image. Cache entry count can exceed the ready limit while jobs
are pinned/queued; it must not be interpreted as the native image count.

Rock rendering starts with a transparent 1×1 backing. Active frames retain the
same full-field geometry, DPR, material, random seeds and drawing loops. An empty
layer clears its complete old bitmap once, keeps the transparent store reusable
for two seconds, then shrinks to 1×1. No idle RAF, repeated clearing or repeated
dimension assignment. A new burst cancels release; unmount cancels timers and
explicitly zeroes the owned surface. Seven reusable rock material textures remain.

The raw-source loader still performs the same optional 240px visual-centre read.
The full-resolution material shader, pixel read/write, Blob encoding/decoding and
painted-cache admission are byte-for-byte unchanged. GamePage differs only in
marking its speculative boss-atlas preload as background work. Audio, simulation,
projectiles, difficulty, rewards, summary gating and account code are unchanged.

## Completed verification

| Check | Coverage/result |
| --- | --- |
| Raw-source stalled pressure | All 500 internal normal stage IDs: old 7,806 allocation attempts versus new two warming loads + six metadata jobs; max three with foreground work. Old implementation fails the new bound assertion. |
| Raw-source completion cycles | All 500 internal stages, normal/boss-intro/boss-fight/boss-clear/bonus plans as applicable; every cycle settles, zero active/queued jobs or source pins, ready LRU ≤8. |
| Deduplication and priority | 19 simultaneously pending hull addresses plus 3,000 repeated requests; one request per pending URL, max three active; foreground promotion succeeds while warming is stalled. |
| Failure/deferred retry | Source error frees slot/pin and retries; a paint job deferred at full warming capacity is removed, then successfully recreated as a mounted painted variant. No lost consumer. |
| Boss atlases | All 50 atlases + 2,000 repeated requests; one pending Promise per URL, max two active, completed cache ≤2, zero pending pins; reserved foreground slot and error retry tested. |
| Rock native raster | 680 strict RGBA comparisons at 320×568, 390×844, 430×825, 768×1024 and five DPRs; all seven materials, hit flash, dust, fragments, score, idle/restart and active/empty viewport resize. Original material and drawing loops also compared byte-for-byte. No tolerance/assertion bypass. |
| Rock lifecycle | 40,000 empty scene commits: zero extra clears/draws/dimension writes, one timer, zero idle RAF; cancellation before timeout, exact 2,000ms release, null-context retry and unmount timer/backing release. Old component fails cold-empty allocation assertion. |
| Shared regression suite | 50 tests pass: the above loading cases, existing raw/painted cache readiness, all-stage rock/combat limits, audio finish/pause/close/resume, guarded loop, resource/outbox/lifecycle bounds. |
| Build | Full frontend build passes, including 12 i18n tests and release gate; isolated playable build passes. |

500 internal stage IDs correspond to 50 displayed campaign levels, each with its
blocks/boss/bonus. These tests cover resource invariants and selected rendering
states, not every possible gameplay state or physical iPhone frame.

Commands from frontend:

```
node --expose-gc --experimental-strip-types scripts/verifyRockSurfacePixels.mjs
node scripts/probeHullSourceLoads.mjs --stages=500
node --experimental-strip-types --test src/pages/resourceStability.test.mjs src/pages/resourceCacheDiagnostics.test.mjs src/pages/hullReadiness.test.mjs src/pages/hullSourceQueue.test.mjs src/pages/bossWeaponTextures.test.mjs src/pages/gameAudio.test.mjs src/pages/gameAudioResume.test.mjs src/pages/gameLoop.test.mjs src/pages/bonusRocks.test.mjs
npm run build
node scripts/buildPlayablePreview.mjs /tmp/cryptoid-shared-resource-preview
```

## Remaining uncertainties and reviewed paths

- A native WebKit/GPU/process exit has not been reproduced or measured here.
  Stable known cache bytes never proved total-process stability. No complete
  whitescreen fix or universal error-free claim follows from these checks.
- Existing CanvasEffects holds pending entries under its explicit count/byte
  admission limits and does not use the pending-LRU eviction pattern. Its
  dedicated resource lifecycle/pixel checks exist; its artwork is unchanged here.
- Existing effect/audio buffers/voice cleanup and guarded-loop tests pass; this
  does not rule out browser-specific native audio/GPU failures.
- Static inspection finds the early mobile `.game-hud {backdrop-filter:none}`
  rule precedes a later same-specificity blur declaration. This remains a
  compositing review item; no stylesheet or approved visual quality was changed
  as a speculative crash correction.
- Navigation search finds manual Reload/Home actions and Pi sign-in navigation,
  not an automatic normal-combat reload in the isolated preview. Pi auth and
  account API are disabled there. This narrows the search; it does not prove why
  iOS replaced the document.

The latest device failure remains an open finding until evidence supports a
physical-device resolution. All fixes remain individually reviewable and
regression-tested; no public aliases were moved for this follow-up.
