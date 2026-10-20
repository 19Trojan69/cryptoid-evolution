# Boss heat-canvas failure cleanup

20 October 2026, continuing the authorized iPhone abort investigation. Preparation
only on `codex/iphone-lifetime-audit-20261020`, starting at
`f34456a11b7faa64365fadd57dbbcd569f4eca28` (tested Admin audio-start correction).
Official Testnet runtime remains the approved `613b3c7` release; neither new
correction has been deployed.

## Newly demonstrated defect

`drawBossWeapons` builds a separate temporary Canvas for a turret's current heat
stage. If `hot.getContext('2d')` returned null, the old code did not cache or
explicitly release that Canvas. It proceeded to draw from the unpainted surface
and returned true. Each subsequent draw could allocate another failed tile.
The previous release/disposal map could not retire those failed tiles because
they had never entered the map. A throw while acquiring or painting that context
also left the temporary surface to browser garbage collection and could leave
the main Canvas save stack unbalanced.

This is a concrete failure-path bug in the real renderer. It is not an observed
null context on Marcus's iPhone and not proof of the Whitescreen cause. A real
browser may reclaim the old unreferenced surfaces; the controlled allocation
host deliberately retains references to inspect whether explicit release ran.

## Correction

- Only successful heat tiles enter the existing cache.
- Failed/null-context or throwing preparation always sets the temporary tile's
  dimensions to zero before returning/propagating the original exception.
- Null context returns false, matching the renderer's existing failure contract;
  the component therefore does not mark the draw as successfully retained.
- `finally` balances the main Canvas save/restore even on that failed draw.
- The following healthy frame can retry. Existing disposal closes all successful
  layers/tiles on unmount, as before.

The successful draw commands, artwork, dimensions, heat palette, geometry,
recoil, muzzles, static destroyed-gun handling, timing and combat remain the same.
No new cache, diagnostic sampler, timer, listener or quality reduction is added.

## Verification

The new `frontend/scripts/verifyBossHeatLifetime.mjs` bundles the actual renderer
before and after the change, using the actual boss definitions.

| Check | Result |
| --- | --- |
| 2,000 null-context attempts, old renderer, boss 7 | 8,000 failed tiles lacking explicit release; old draw reports success |
| 2,000 null-context attempts, corrected renderer | 0 failed tiles lacking explicit release; false draw result |
| Context acquisition throws | failed tile released, main save stack balanced, original exception preserved |
| Heat painting throws | same cleanup and original exception behavior |
| Healthy retry after null, then unmount | succeeds and all owned surfaces released |
| Original atlases, all 50 bosses | exact native RGBA equality |
| Backing ratios | 1, 1.5 and 2, matching the component's existing DPR cap |
| States | all nine heat stages, recoil/rotation/muzzle, destruction, frozen output |
| Exact pixel comparisons | 1,650 passed |

62 targeted frontend checks pass across actual Admin launch, owner audio gates,
game-loop recovery, sector/boss flow, all boss boundary models, core combat and
all 392 turret HP/reward/collision rules. The initial turret test loader needed
its existing ignored `backend/build/playerSave.js` and `lifeRules.js`; those two
unchanged sources were transpiled with the installed frontend TypeScript and
the six turret checks then passed. No backend source or dependency changed;
this is not a claim of a full backend build (backend-local tsc is not installed).

`npm run build` passes the 12 locale tests, release locale completeness gate,
TypeScript and Vite. The existing large-chunk warning remains. `git diff --check`
passes. The older exact-source timing/static-boss scripts are historical
release guards and intentionally accept only their original renderer revisions;
the new renderer comparison above is the relevant current pixel/failure check.

Reproduction:

```sh
cd frontend
node scripts/verifyBossHeatLifetime.mjs
```

The script uses the runtime-owned `@napi-rs/canvas` for CPU raster comparisons;
it adds no application dependency. Controlled null/exception injection cannot
measure iPhone native/GPU/process memory, prove that WebKit took this path, or
reproduce an OS/browser process termination.

## Abort investigation status

Two demonstrated corrections are now prepared: Admin music/card activation
before asynchronous launch, and failed boss heat-surface cleanup. They should
be reviewed/released together to the existing Testnet only after the owner's
explicit release instruction, preserving 613b3c7 as the immediate rollback.
Mainnet and all fixed release/backup refs stay unchanged. Audit-branch automatic
deployment remains disabled.

The last user-confirmed automatic Whitescreen remains unexplained. The inspected
application error handlers pause the mission, rather than automatically sending
it Home. The previous new-document boundary plus lack of exit intent still needs
the matching iPhone Analytics/WebKit/Jetsam/crash report to distinguish a memory
termination, native crash, watchdog or another host-driven reload. The fact that
an allocation can fail in a controlled host does not fill this evidence gap.
