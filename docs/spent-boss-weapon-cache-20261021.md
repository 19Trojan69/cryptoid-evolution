# Release copied boss weapon source after the last turret

Prepared against exact official Testnet runtime
`171cb5c4507a1530a9bbb080d61805be0da545f7`, tree
`490b444be6bb87e8a4438c06b3c4bc86114a486f`. The owner requested continuing the
stability search without reducing visible quality. This is a separate tested
candidate, not a deployment or proof of the physical iPhone interruption cause.

## Finding and change

`BossWeaponsView` already stops redrawing unchanged wrecked turret sockets after
all guns are destroyed. That existing optimization works; it is not a newly
found empty drawing loop. Its renderer nevertheless retains an offscreen socket
base after copying the final sockets/scars to the visible destination canvas.
The heated gun tiles are already explicitly cleared at destruction.

The candidate splits source disposal from destination disposal. Only after a
successful final all-destroyed draw does `BossWeaponsView` release the offscreen
base and any remaining heat sources, zeroing their backing dimensions and
deleting their cache entry. It retains the destination canvas, its dimensions,
pixel contents, DOM identity and existing static-draw guard.

The exact same `drawBossWeapons` function rebuilds sources when a later resize,
controlled context recovery or restored live turret requires a draw. A failed
final draw keeps sources for the existing retry path. Unmount still disposes all
sources and the destination. The original atlas loader and image ownership are
unchanged. No new timer, RAF, event listener, state or graphics resource is added.

For boss 2 at field width 430 and capped 1.5 backing scale, the retired source
is 818 by 511 pixels: 1,671,992 nominal RGBA bytes (about 1.67 MB decimal).
Across fifty bosses, three field widths and two input DPRs, source sizes range
from 412,496 to 3,236,472 nominal bytes. This is explicit backing-dimension
accounting, not measured reduction in GPU/WebKit/whole-process memory. The old
source is bounded to the mounted boss, not a proven growing leak.

## Verification

Evidence is under `spent-boss-weapon-cache-20261021/`.

* Actual old/new component and renderer: fifty bosses, field widths 320/430/820,
  input DPR 1/3 with the unchanged 1.5 cap; 300 cases and 3300 exact native CPU
  RGBA comparisons. The control retains one full socket source while the
  candidate retains zero offscreen source pixels after destruction.
* Active/partially destroyed weapons retain exactly the original source usage.
  A denied final destination context preserves the prior visible pixels and
  sources, then succeeds after retry. Repeated dead-gun updates neither draw nor
  allocate sources again. Falling pixels remain exact. Resize, controlled
  context invalidation/restoration, live-gun restoration and repeat destruction
  reconstruct/release resources correctly. Unmount zeros every owned canvas and
  removes component context listeners.
* Native Chromium 153 with GPU/accelerated 2D disabled: 120 exact destination
  RGBA comparisons over bosses 1/2/7/25/50 and three widths. Actual React commits,
  actual renderer/CSS/atlases, deterministic texture-loader fixture. The source
  canvases have zero native dimensions after final copy, with exact visible
  contents through idle/fall/resize/restored guns, no page errors and complete
  native unmount disposal. This does not test real GPU context loss/retirement.
* Eighteen focused boss/turret/resource tests pass. The initial focused run had
  twelve passes plus one test-file setup failure: missing
  `backend/build/playerSave.js`. The unchanged prerequisite and imports were
  compiled with TypeScript, after which all eighteen tests pass. Preserve the
  initial output as setup evidence, not a failed game assertion or a pass.
* Both changed production modules lint cleanly. Frontend production build,
  TypeScript, twelve locale tests and the translation release gate pass; existing
  chunk-size/npm warnings remain.
* Preservation hashes cover the entire GamePage simulation, original CSS,
  boss hull/reactor, atlas loader, heat and turret logic. The full renderer draw
  function is byte identical; only its source-disposal helper is extracted.

Native CPU and Linux browser results do not prove physical iPhone/WebKit memory,
temperature, presented FPS or resolution of the spontaneous interruption. The
owner's whole-display dimming on a hot, charging phone remains a thermal clue,
documented separately in audit `4d01d09e45c69cc6348e7ad7beedca23d15d5bfd` on
`codex/iphone-display-dimming-audit-20261021`. No thermal protection is overridden.

Reproduce the narrow checks from `frontend`, with the same installed native
Canvas and Playwright/Chromium QA dependencies:

```sh
node scripts/verifySpentBossWeaponCache.mjs
node scripts/verifySpentBossWeaponBrowser.cjs
node_modules/.bin/eslint src/pages/BossWeaponsView.tsx src/pages/bossWeaponRenderer.ts
```

## Release boundaries

This branch is `codex/spent-boss-weapon-cache-20261021`, automatic deployment
disabled. Official Testnet remains 171cb5c / READY
`dpl_729MdmJke7jMhhX28Ukh8EqbXo8T`, fixed source
`codex/reactor-door-reuse-20261021`; rollback remains
`backup/testnet-before-reactor-door-reuse-20261021` at 540d73e. Mainnet and every
fixed ref remain unchanged.

The independent tested finished-hit/debris cleanup remains
`5c6cc88bde5f4eaf48f28f5e5915c4b3b81ebbbc` on
`codex/finished-hit-debris-cleanup-20261021`, not published. It is deliberately
absent here so each step can be reviewed and released independently. Neither
candidate should be described as published or combined without the corresponding
source preparation and verification. No new publication instruction accompanied
this continuation; no deployment was performed.
