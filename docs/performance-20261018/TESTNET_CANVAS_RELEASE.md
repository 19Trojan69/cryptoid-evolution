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

## Hosted checks and release

The Git integration built preview `dpl_3LRYcGCzxpQvofXLRUGSy5WmUrRV` from
`b71d368d5bdd6735225771a101cbba8beefebed7` successfully (READY). The normal
application starts through its real guest GameEntry, with ordinary enemy
health, lives, controls and collisions. A run scores two kills before normal
game-over, then the original restart control starts another three-heart run.
Keyboard movement changes player left from 50% to 84.918%; after original
Pause/Resume and countdown it moves back from 84.918% to 49.1718%. A real
pointer drag then moves to 67.4982% left / 74.7863% top. Ordinary enemy kills
and a collected double-weapon pickup advance the HUD to 70 points. These are
manual UI actions, without a pilot or simulation mutation.

The original pause dialog, three-second countdown, Home confirmation and
return to the normal home screen work. The effect surface is absent after
exit. Source images and colors remain the original full-resolution assets;
the shared surface is present during ordinary play and shrinks to 1 × 1
when no normal effects remain. The existing v9/v10/v11 full-artwork/lifecycle
evidence remains in `codex/crash-diagnosis-20261015`.

Both the prior official application and candidate load these identical CSS
asset names: `index-CLY2nAhm.css`, `powerUps-Bp4oAZoc.css`,
`Shop-BkuKP0aD.css`, `GamePage-Doazl5ia.css`. Original source comparison also
confirms unchanged index.css, hudDepth.css, gameAudio.ts, gameInput.ts,
shipFleet.ts, combatVariety.ts, playerCombat.ts and sectorBoss.ts. GamePage
has exactly the three renderer integration regions; its 34 ms cap is intact.

The preview-to-production promotion endpoint returned 422. Redeploying that
exact existing deployment with `target: production` and
`withLatestCommit: false` succeeded. Production deployment
`dpl_DDru7oekVxdkxj4AgoBEUE2FSm5k` is READY at the exact source commit above,
and `cryptoid-evolution-testnet.vercel.app` resolves to it. The Mainnet alias
still identifies `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe` and commit
`907d2a7363345d00f0f90c54402bf04e887b64d9`.

The public alias was opened directly after release. Its application entry
bundle is `/assets/index-CDSCQ-fM.js`, exactly the same hash-named bundle as
the tested preview. Its ordinary guest GameEntry reaches `/game`, renders
the shared surface and completes a normal run with two kills, followed by a
successful original restart. `testnet-canvas-live.jpg` records the public
restart with the original three-heart HUD and unchanged first-level scene.

The connector's build-event endpoint returned 404 and runtime-log endpoint
returned 403; the local Vercel CLI is unavailable. These are observability
gaps, not clean-log results. Build completion is verified through deployment
READY state and the live normal application. Browser extension errors and
the existing Pi SDK host timeout in ordinary Chrome are not renderer errors;
the same baseline browser also reports them. Signed-in Pi account flows,
purchases, audible hardware output and post-boss manual recovery were not
retested by this browser session.
