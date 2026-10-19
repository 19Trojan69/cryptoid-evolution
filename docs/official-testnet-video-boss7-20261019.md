# Supplied iPhone video: boss 7 interruption, 19 October 2026

The supplied `ScreenRecording_10-19-2026 20-09-24_1.mp4` is 66.6 seconds,
512 × 1108, 30 recorded frames/s (1,998 frames). The original video remains
the user's attachment; no copy or frames are published in the repository.
Its technical fingerprint and observations are in
[video-observation.json](official-testnet-video-boss7-20261019/video-observation.json).

The official Testnet alias was checked again and remains on deployment
`dpl_8h9mgxiRDUerhJr4PyCPTiaPQgR4`, source
`66eb357cc08a6b5f9b32a9242d6875ed475532fa`. The previously reviewed React
correction, source `0501e104d9cede00ee3ddc49c2c83f98e68108bc`, has not been
deployed. The video therefore does not test that correction. All investigation
and this follow-up continue directly from the verified official source tree;
no unofficial gameplay-preview changes are included.

## What the recording establishes

| Recording position | Visible state |
| --- | --- |
| Beginning | Already in the boss fight for displayed level 7, block 9/9; six hearts. The reported start at level 5 is outside this clip. |
| During the fight | Uneven projectile movement, including repeated positions across adjacent recorded frames. |
| Last approximately ten seconds | Turrets destroyed, reactor exposed, escort ships and hostile shots present; boss remains alive. |
| 57.300 s, frame 1719 | Last gameplay frame, still six hearts. |
| 57.333 s, frame 1720 | First white content frame; browser toolbar remains visible and shows loading. |
| Following seconds | Translation/application loading indicators. |
| 65.700 s, frame 1971 | Home content returns. |

The symptom occurs during an ongoing boss fight, without a boss defeat or
level/bonus transition immediately preceding the white page. It does not look
like the normal zero-hearts game-over flow. The checked JS fault paths pause
combat and display recovery controls; they do not automatically reload the
document. The ordinary combat path contains no automatic `location.reload`.
This narrows the observed sequence but does not prove a native WebKit crash or
exclude every host/navigation mechanism. The video is not a browser frame-rate,
CPU, GPU or process-memory measurement.

The source also caps each simulation delta at 34 ms. Late callbacks can
therefore slow game time instead of catching up. This is a confirmed mechanism
that can amplify a visible slowdown under load; the recording does not identify
which workload delayed those callbacks. Its timing and paint policy are
preserved in this correction.

## Matching actual-component comparisons

The real-React probe now has two additional official fixtures. Both use
`createSectorBoss(70)`, the original escort spawn/layout functions, six hearts
and the existing stage-2 player presentation. One retains active guns and two
escorts; the other has all guns destroyed, five reactor-phase escorts and
original core projectile generation. They are controlled presentation fixtures,
not complete simulation or physical-device replays.

| 600 scene updates | Official JSX constructions | Candidate | Reduction |
| --- | ---: | ---: | ---: |
| Boss 7, active guns | 114,600 | 94,300 | 17.71% |
| Boss 7, exposed reactor | 129,918 | 100,618 | 22.55% |

Both pass six exact moving host snapshots plus 106 state comparisons and the
complete GamePage source-preservation guard. Each still avoids the 600 unused
UUID calls and 600 unused local-best reads. These percentages count JSX
construction, not iPhone FPS or GPU work. The earlier 35.65% figure belongs to
the normal-fight fixture and is not substituted for the measured boss figures.

Reports: [active guns](official-testnet-video-boss7-20261019/boss7-turrets.json),
[exposed reactor](official-testnet-video-boss7-20261019/boss7-core.json).

## Additional isolated correction: unchanged destroyed-gun canvas

The official `BossWeaponsView` clears and redraws its canvas on every scene
commit, including after every turret has been destroyed. In that state the
renderer draws only fixed sockets and scars. Time, aim, recoil and firing no
longer affect this layer. Reactor motion, boss hull heat and escorts are separate.

The correction keeps those existing pixels on the same canvas after a successful
fully destroyed draw. It redraws when logical dimensions, backing dimensions,
config, atlas identity or turret count change; a live gun also restores the
ordinary rendering path. Both context loss and restoration invalidate the
retained result. Unmount removes the two listeners and releases the original
surface/cache. No extra canvas, texture, image or timer is introduced.

The renderer now reports whether drawing succeeded. A missing main or temporary
2D context leaves the retained marker invalid so the next scene update retries.
A failed temporary layer is explicitly shrunk before returning. The actual
successful drawing algorithm is otherwise byte-for-byte unchanged, checked
against the official source. This does not remove particles, alter visual
resolution, slow weapons, change combat or grant any access.

`verifyStaticBossWeapons.mjs` executes actual React effects with original atlases
and a native raster backend. Across all 50 bosses and DPR settings 1, 1.5, 2, 3
(preserving the existing DPR cap), **3,201 exact RGBA comparisons** pass.
Checks cover the loading fallback; live heat/recoil; partial/full destruction;
frozen/falling presentation; fractional geometry and DPR changes; both context
events; temporary/main context failures and retries; live/config/atlas changes;
and listener/surface cleanup. No extra surface is allocated by static reuse.

For boss 7 at DPR setting 3, the first destroyed frame plus 600 later scene
updates need **601 original redraws versus one candidate redraw**. Re-running
the test with the official component fails the redundant-redraw assertion.
There is no diagnostic bypass, and a success report is written only after all
assertions pass. The native host models HTML Canvas zero dimensions explicitly
because its backend otherwise substitutes default dimensions for zero; cleanup
asserts requested zero dimensions, not physical WebKit memory reclamation.

Report: [static weapon verification](official-testnet-video-boss7-20261019/static-weapons.json).

## Validation and release boundary

- 38 existing boss combat/core/escort/reward/turret/damage tests pass. Their
  unchanged CommonJS `playerSave`/`lifeRules` prerequisites were transpiled with
  the existing backend compiler settings; no backend source or dependency changed.
- Targeted lint for the new/extracted React modules and BossWeaponsView passes.
- Full frontend build, 12 i18n tests and localization release gate pass. The
  existing Vite large-chunk advisory remains.
- The original GamePage timing, full simulation, input, saving and audio remain
  protected by the complete official-source comparison. No CSS or assets change.
- Total runtime change from official source is now six files: the four initial
  React corrections plus BossWeaponsView and bossWeaponRenderer. Backend,
  authentication, owner-only Admin, purchases, rewards and saves are untouched.

From `frontend`, with the same isolated QA React/test-renderer installation as
the initial report and the native `@napi-rs/canvas` runtime:

```sh
CRYPTOID_SCENE_FIXTURE=boss7-turrets node --experimental-strip-types scripts/probeSceneReconciliation.mjs
CRYPTOID_SCENE_FIXTURE=boss7-core node --experimental-strip-types scripts/probeSceneReconciliation.mjs
node --experimental-strip-types scripts/verifyStaticBossWeapons.mjs
npm run build
git diff --check
```

The iPhone interruption remains unresolved as a native/device finding. This
patch eliminates two proven sources of redundant work in the affected scene;
it is not a demonstrated complete whitescreen fix. No additional full campaign
is requested to gather the same counters. Public Testnet/Mainnet aliases remain
unchanged, and the review branch still disables automatic Vercel deployment.
The current official `66eb357` remains the exact rollback source for a future
separately authorized release.
