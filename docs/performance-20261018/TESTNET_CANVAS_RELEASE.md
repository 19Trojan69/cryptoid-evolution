# Ordinary-effect renderer release — 18 October 2026

The user authorized release to the official Testnet after the successful
isolated Pi v9/v10/v11 tests, with the condition that the game keep its
appearance. The previous deployment is `dpl_BX7ZeCr9Qr6anBa3AZnzLERubpQM` at
`27d174788327c3423f04ace32be61af67a2004cc`, preserved in the GitHub branch
`backup/testnet-before-canvas-20261018`. Mainnet is outside this release.

## Change

Normal explosion/shatter effects use the tested bounded DPR Canvas drawing,
original CSS fire/smoke definitions, full-resolution painted hulls, seeded
fragment polygons, pivots, counts, flight, spin and animation tracks. Special
boss/player/turret effects keep the original renderer. The original impact
component is retained for pending assets, unavailable Canvas and preparation
failures. The Canvas has no pointer events. Its lifecycle belongs to the
mounted game layer and releases decoded hulls, texture canvases and scheduled
draws on exit. Context availability gates replacement so unsupported Canvas
cannot suppress the original effect. Device pixel ratio changes prepare the
corresponding textures; no resolution or effect-count governor is introduced.

Only three integration points change in GamePage: import, ordinary impact
selection and a shared non-interactive surface around the existing effect
list. Simulation, collisions, enemy/player movement, difficulty, saves,
rewards, purchases, audio, fonts, HUD and existing styles remain unchanged.
There is no replay controller, autopilot, forced refill, health weakening,
account stub or fixture in the normal application.

The renderer preserves the design and assets; different CSS/Canvas rasterizers
are not asserted to be byte-identical. Frozen v9 comparisons and the user's
full-visibility confirmation are retained in the diagnosis branch. This
release does not claim to fix the earlier un-reproduced post-boss manual-input
freeze or establish all fifty bosses/long-session/account recovery coverage.

## Verification before hosted testing

- 41 input, game-loop, geometry, artwork and resource tests pass.
- Seven actual-module allocation/lifetime scenarios pass, including stale
  async decoding, release, 24 changing hulls within eight slots, active-hull
  retention and recovery from fully pinned capacity.
- 12 localization tests and the release localization gate pass.
- TypeScript project build passes.
- The first full local Vite build reaches the Rollup loader and stops because
  this workspace lacks the optional `@rollup/rollup-linux-x64-gnu` binary.
  No dependency/lockfile change is made for that environment deficiency.
- Hosted build, ordinary guest input, visual effects, pause/resume and return
  checks are required before assigning the official Testnet alias.
