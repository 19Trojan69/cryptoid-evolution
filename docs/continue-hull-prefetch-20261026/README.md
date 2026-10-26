# Reuse prepared game resources and share pending artwork loads

Start from common public source bd23bd4babe0a2a14ee7d8ac1ad7f749d843abd5,
tree abf375795cc76104c4ff5d201d353214b93cc50e (PR177). The owner requests
the Continue interruption investigation and a game-wide search for similar
redundant preparations. All existing visual, save, pause and audio corrections
are retained. No private session export or precise owner telemetry is published.

## Three concrete corrections

1. After completion cleanup, the raw-original LRU can be empty while the next
   formation's exact colored/staged hulls are still prepared and pinned. Source
   warming previously loaded all six originals again. Pass the existing exact
   prepared plan to the warmer and skip a URL only when every planned variant
   for that URL is already cached. Missing/different color or stage and boss
   originals keep their real load gate. The unique-first-seven limit, serial
   colored readiness queue, twelve preparation pins and acquire-before-release
   ordering stay intact. No new cache or campaign-wide preload is introduced.
2. The player's visual-center metadata already survives raw-original eviction.
   A remounted offset hook previously reloaded that original despite returning
   its known offset immediately. Reuse that URL's existing center. Unknown
   sources/stages still load, retry after errors and ignore unmounted callbacks.
3. Collection/ship previews and boss artwork/export share a card-image loader.
   Different colors/resolutions could load the same original concurrently even
   though individual final-artwork promises were already coalesced. Share only
   unfinished image loads by exact URL; remove the pending entry on success or
   failure and clear native callbacks. Do not retain another completed-image
   cache. Keep the existing twenty ship/eight boss artwork results and their
   pending-result ownership, original painting/cropping and temporary-surface
   cleanup. Each color/resolution still gets its own correct final artwork.

## Wider audit

Inspected explicit Image/Audio allocations, decode calls, media loads, source
warmers and caches across gameplay and the surrounding game UI:

| Path | Finding / retained behavior |
| --- | --- |
| Normal formations, bonus groups, next level | Exact prepared-variant reuse corrected; actual missing work remains bounded/serial. |
| Player remount and stage switch | Known-center duplicate corrected; cold-stage/error paths retained. |
| Ship collection, shop/weapon previews, boss map/cards and export | Pending original sharing corrected in the common loader; final result caches already share same-key work. |
| Boss weapon textures and mounted weapons | Existing pending map survives result eviction; two ready textures, per-destination base and current heat tile reuse already exist. No change. |
| Canvas impact hull/fire/smoke resources | Existing promise maps, generation guards, pins and entry/byte limits already prevent duplicate pending work and protect live surfaces. No change. |
| Bonus rock textures | Existing seven deterministic cached materials already avoid repeat surface generation. Warm-up callbacks are cache hits; no art/timeline change. |
| Effect samples, synthesized boss/enemy/rock buffers | Existing single sample request, three decoding workers and per-context buffer maps already reuse preparation. No change. |
| Music start, handoff, pause/Resume and track changes | Same unlocked element/context reused, same-source switch guarded. Explicit gesture recovery remains. No change. |
| Home combat preview, ship/boss portraits | Existing shared hull/artwork paths and lazy portrait mounting retained; separate displayed canvases are legitimate copies. |
| Avatar cropper | File-specific original load and object-URL cleanup are intentional; no account/upload change. |

This audit does not assert that all browser-internal decoding or every unrelated
runtime problem has been eliminated. Ordinary browser/CSS image-cache behavior
is not counted as an application Image allocation counterexample.

## Evidence and limits

- The normal release build passes 348 frontend cases, TypeScript and Vite. The
  twenty readiness/source-sharing cases include wrong/missing variants, sharing
  across a result-cache eviction, failed shared requests/retry, no new completed
  source cache and incoming-pin ownership. Five new assertions fail on the
  pre-correction implementation and pass afterwards; the six-image Continue
  counterexample was also verified separately before this wider audit.
- Native WPE/WebKit 26.5, pinned bd23bd4 control: thirteen checks; candidate: fifteen
  checks. Actual original PNGs and actual hooks/loaders show Continue raw Image
  starts 6 -> 0 (this fixture also removes two redundant center scans), player
  remount 1 -> 0, eight-color gallery 8 -> 1. All seven visible hulls stay ready;
  prepared retention remains thirteen keys/nineteen total consumers and nineteen
  cached painted variants. All eight gallery dimensions and pixel fingerprints
  match the published control exactly. Cached gallery reuse starts no new load.
  Simultaneous 256/800px boss artwork also shares its original (2 -> 1) while
  both composed dimensions, pixels and mounted-turret counts match the control.
- Actual controlled game flow passes 34 checks: bonus outro, confirmed manual
  Continue to the next stage, save failure/Retry and final campaign victory.
  Rewards/checkpoints remain exact. See results/flow/native.json.
- Changed-module lint comparison retains paintedShip's one existing hooks lint
  error; usePreparedGameHulls and bossArtwork have no errors. No new finding.
  GamePage remains byte-identical to bd23bd4, with its existing 62 errors/four
  warnings; do not call the entire game lint-clean.
- An exploratory legacy-resource suite is outside the release gate. Its old
  Blob-painting/old-controller/pinned-unavailable-commit comparisons are not
  compatible with the current published architecture (28 pass / 18 fail).
  Failures are recorded
  separately and not counted as successful current acceptance; audio/controller
  files and those tests are unchanged. Do not rewrite old behavior to satisfy
  obsolete comparisons.
- Early harness issues are retained in small JSON receipts: a wrong statistics
  field, a shared Vite optimizer-directory timeout and a remount control warming
  one of the following six sources. Final baselines/candidates use isolated Vite
  cache directories and separate completed/cleared source epochs. Center-scan
  instrumentation now matches the actual double-quoted creation statement.

These are local controlled browsers/hooks/SDK/API/combat setups, not a physical
iPhone/Pi long run or proof of a historical White Screen cause/fix. The private
report locates the interruption after explicit Continue and before visible next
combat; the redundant original loading is a reproduced issue at that boundary,
not proof that it caused native process loss. No repeat long owner campaign.

## Publication

The working branch codex/continue-hull-prefetch-20261026 has automatic deployment
disabled. Reviewed publication of the same code to both existing projects is
already authorized. Preserve bd23bd4 at backup/shared-before-resource-reuse-20261026
and READY Testnet Gm3kCBJRayrVDHjtddweCtENW5SH / production
FVTiAqEjQ7rnT12A64jpaQRqZY9n. Record actual source/tree, READY active aliases,
equal public JS/CSS and separate network/account/payment environments afterwards.

No GamePage, save/queue validation, combat, reward, HUD, boss indicator, original
asset, audio, backend, auth or account configuration change. Retain strict
>2500ms/500ms protection, genuine technical pauses and explicit Resume. No data
reset/migration, PR167/168, runtime-log/secret access or protection changes.
