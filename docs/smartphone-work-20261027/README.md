# Less redundant smartphone work

Base: common public f7197d61bca49b8b0fa5a10dcc3194efd0936c43 / PR179,
tree 1d4f398bbd10af97a3b2f7130cb565515239a529. The owner requests further
optimization to reduce smartphone heating. Actual temperature and energy use
are not measured by the local verification environment.

## Changes

- The guarded game loop can sleep while inactive, when no paused effect needs
  its original lifetime updates. Loading, empty-effect pauses, level completion,
  victory and game-over no longer keep requesting game frames. Active play still
  uses the existing shared sixty-Hz scheduler, original simulation timestamps,
  collision steps and compact-phone scene cadence. The destruction reveal and
  paused explosions retain their original callbacks and time compensation.
- UI status commits wake the same loop immediately. Its existing 500ms watcher
  can also notice a state change; it never changes paused state to playing.
  The strict greater-than-2500ms watchdog, generation cancellation, faults,
  background/focus protections and explicit technical Resume remain intact.
  No additional RAF, polling timer or request is introduced.
- Projectile appearance is a bounded per-live-node value snapshot. Moving a
  locked-direction shot no longer rebuilds classes, property lists, angle and
  style signature on every frame. All appearance fields are checked, including
  mutable/replaced shots, direction, radius, enemy class, boss/evolved weapon
  kind/color/width and player equipment. Position updates, removal, original
  CSS and collision data are unchanged; dispose still releases all entries.
- The Home flight preview measures its three ship widths using its existing
  ResizeObserver, instead of reading layout between frame-time style writes.
  Its already static reduced-motion pose now paints once and sleeps. Existing
  display/system motion changes, resize, visibility, dialogs and cleanup wake
  or stop it through discrete events. Ordinary flight paths, timing, original
  ships and effects are preserved. No new visual quality or frame-rate setting.

## Verification

- 381 frontend release tests, localization gate, TypeScript and Vite pass.
  Fourteen existing frame-scheduler tests and four projectile tests now join
  the ordinary gate; six additional loop cases cover dormant state, fifty
  pause/Resume cycles, stale callbacks, paused effects, exact watchdog threshold,
  existing-watcher fallback and a fault that cannot resume itself.
- 127 backend tests and TypeScript pass; all backend runtime files are unchanged.
- Native WPE/WebKit26.5: 14 pinned public-source controls, 16 candidate work/
  appearance checks, and 58 actual-game/real-handler checks pass.
  Synthetic SDK, isolated account data, test combat setup and controlled native
  clocks are explicit. No real account, game progress or payment is mutated.
- The two-second controlled comparison records 119 dormant loop callbacks
  becoming zero and 120 active callbacks remaining 120. Ten paused seconds
  change 600 callbacks to zero. Static reduced-motion Home callbacks change
  119 to zero; active preview ship-layout reads change six to zero in its sample.
  Six hundred supplied projectile frames with one real heading change calculate
  two angles instead of 600, with exact sampled DOM equality. These counts are
  specific local workloads, not percentages of total CPU, battery or temperature.
- Actual flow covers pending preparation, confirmed 45-second activation, armed
  1.5-second menu return, ordinary three-second Resume, five bonus pause cycles,
  pause during the last explosion, its full lifetime and quiet outro, finite
  completion entrance, five seconds of dormant completion, confirmed Continue,
  unchanged rewards/checkpoint, failed save/Retry and final campaign victory.
- Four-module lint comparison adds no findings. The three smaller runtime
  modules are clean. GamePage retains its existing 62 errors/four warnings.
  Four exact reviewed wiring changes restore before the existing strict source
  fingerprints; interruption-pause negative controls remain effective.
- An initial native fixture button was covered by the preview's decorative
  ship layer. The fixture button now has its own stacking position. Its failed
  attempt is retained separately and is not counted as a pass. A first cold
  build lacked the generated hull manifest; normal preparation regenerated the
  existing 1740 variants / revision 1b15fbaa3ceac2fbf7b7 before successful gates.
  No original asset or generator input changed.

The shared WebKit/native tests prove redundant work removed with the checked
behavior retained. They do not establish physical iPhone/Pi heat reduction,
whole-process memory, presented FPS, long-run stability or a White Screen cure.
WebKit's guidance similarly recommends returning idle content to idle and
avoiding unnecessary JavaScript: https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/.

## Release

The owner has already authorized the reviewed same-source release to the two
existing projects. Candidate codex/smartphone-idle-work-20261027 has automatic
deployments disabled. Preserve f7197d6 at backup/shared-before-smartphone-work-20261027
and READY Testnet GwYCnFbzgQQgaskq2Xf3TX9Eysgu / production
52LJsvsvfFMaCnZgN3g1D3j1fJqb before release. Record the actual published source,
tree, READY active aliases and public code/API checks separately afterwards.

Network/account/payment configurations remain separate. No backend, economy,
45-second charge/Auto behavior, HUD, art, sound, menu arrangement, reward/save
barrier, data migration/deletion, PR167/168, secret/protection or runtime-log
change is included. No repeat long owner campaign is requested.
