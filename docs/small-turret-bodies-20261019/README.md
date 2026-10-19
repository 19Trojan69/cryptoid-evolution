# Small turret bodies — isolated preparation

User request: enlarge all small turret bodies so they are easier to hit; keep
the barrels/nozzles their existing size. No publication of this new change has
been performed or inferred from prior, already completed release approvals.

## Baseline and scope

- Official Testnet was freshly verified READY at
  `dpl_7CGcYyrnLNXwkU8ychnkxfjqR198`, source
  `f5be06d594f70f21fe9b6b6235015b819b57bb34`.
- Local parent `bf13968bf7b6bfcccc04799c975f9e355c5c6652` has the same runtime
  plus the preceding release documentation. No unofficial preview code imported.
- Preparation branch: `codex/testnet-small-turret-bodies-20261019`.
- 177 narrow bodies over 38 bosses gain a minimum source half-width of 24 and
  minimum back extent of 20. The other 215 guns remain unchanged.
- Body textures and sockets are pre-baked into the existing atlases. The barrel
  envelope remains the old envelope; collision adds only the larger body region.
- Original mount centers, barrel spacing/radius/length, muzzle coordinates,
  caliber, fire/tracking/recoil, damage, HP, points, sound and timings stay fixed.
  HUD, other art, login, owner-only Admin, backend, saves and Highscores stay fixed.

## Verification

`frontend/scripts/verifySmallTurretBodies.mjs` checks all 392 guns and all 50
atlases. It passes without any assertion bypass:

- 645 unchanged sprite/shadow/socket tiles match exact native RGBA.
- 23,083,344 exposed-barrel and barrel-shadow channels match exact native RGBA.
- 708 added-body hits pass at four rotations, with no widened phantom barrels.
- 1,436 muzzle comparisons are identical, including recoil and every barrel.
- 600 actual native renderer frames cover live, damaged and destroyed guns at
  DPR 1, 1.5, 2 and 3 (existing cap 2). All atlas tiles are in bounds/non-overlapping.
- Every atlas keeps its original dimensions. No new body circumcircle overlaps
  were introduced between previously non-overlapping mounts. Added hit width
  also holds for portrait layouts 320x600, 390x760, 430x825 and 768x1024.
- Existing actual React/static boss-weapons regression: 3,201 exact RGBA
  comparisons pass with the new artwork; static phase remains 601 draws to 1.
- Existing Canvas allocation/lifecycle regression passes. Renderer/component/
  texture-cache source is unchanged; no extra runtime draw layer or canvas.
- Broad boss/sector/special-power suite: 69 of 70 pass. The remaining pre-existing
  `bossExplosionBudget.test.mjs` GamePage extraction fails with
  `ReferenceError: ownerDiagnostics is not defined`; independently reproduced on
  the unchanged parent. No unrelated runtime or test-harness fix was included.
- Full frontend build passes, including 12 i18n tests and release gate. Existing
  Vite chunk-size warning remains. `git diff --check` passes.

## Resource trade-offs and limits

The 38 updated atlas surfaces total 276,971,520 decoded RGBA bytes both before
and after; dimensions, atlas count and existing two-entry cache limit are fixed.
The worst campaign-wide sum of simultaneously damaged-gun tiles per boss is
unchanged at 2,945,984 bytes. Individual bosses can need up to 61,456 extra bytes
for their larger damage tiles; this is a partial host estimate, not native/GPU
memory measurement. Heat tile count and release lifecycle are unchanged.

Lossless encoding is necessary to preserve the untouched pixels. Compressed
download size across the 38 changed atlases increases from 2,579,340 to
10,985,888 bytes (8,406,548 additional bytes across the campaign, not all loaded
at once). This trade-off is explicitly recorded, not described as a memory fix.
No physical iPhone/WebKit FPS, loading-time or memory-pressure verification exists.
This turret-usability change is not a proved Whitescreen correction.

## Reproduction and release boundary

Generate with `node --experimental-strip-types frontend/scripts/enlarge-small-turret-bodies.mjs`
from the repository root. It reads only the pinned Git baseline. Native Canvas
and Sharp are the installed QA dependencies; the native module root is selected
by `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. Generation stages all results in memory
and writes only after every atlas fits its old dimensions. Unchanged raw pixels
are copied before lossless WebP encoding to avoid alpha roundtrip degradation.

Verify with `node --experimental-strip-types frontend/scripts/verifySmallTurretBodies.mjs`
and optionally pass a PNG comparison output path. `comparison.png` shows original
and changed turret bodies at equal magnification; it is not an iPhone screenshot.

Automatic deployment is disabled for this preparation branch. Official Testnet
and Mainnet aliases were not moved. The existing official f5be06d release and its
fixed branch `codex/testnet-session-store-release-20261019` remain the exact return
point. Release requires a separate explicit instruction for this new change.
