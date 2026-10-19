# Official Testnet frame audit, 19 October 2026

The user requires the current official Testnet as the only source. Verified
deployment: `dpl_8h9mgxiRDUerhJr4PyCPTiaPQgR4`, source
`66eb357cc08a6b5f9b32a9242d6875ed475532fa`, complete tree
`cec8743f06146e3b2e1d292219917e9ff24dae8d`. Local transfer
`92f392e2efe5608a7d589e2d14c2593a2626c5bb` has exactly that tree.
Branch: `codex/official-testnet-frame-audit-20261019`.
The candidate starts from that complete official source tree; no unofficial
preview features or test-game scaffolds are included. Automatic Vercel deployment is disabled for this branch only.

## Finding and isolated correction

The official `GamePage` evaluates several `useRef` initial values on every
render even though React keeps the original values. In the actual-component
React host, 600 moving-scene updates generate 600 unused mission UUIDs and read
the local best 600 times. Combat-variety state, an input Set and idle motion
objects are also constructed and discarded. Lazy ref initialization now creates
each value once per mounted game instance. Explicit mission restart and
account-conflict identifier resets remain unchanged.

The original four HUD stat cells and inner enemy/bonus/player ship markup move
into memoized components. Their DOM structure, classes, styles, accessibility
attributes and content are preserved. Their moving outer owners keep updating
position, bank, thrust, lighting, hit flashes and live health. Changes to
sprite, color, stage, hull-fire array, hit, hearts, score, shards, block or locale
still update the corresponding presentation. The existing hull-fire helper
replaces arrays/hit objects on damage, including reheated sites.

Only four application source files change: `GamePage.tsx`, `GameHudStats.tsx`,
`GameShipVisual.tsx`, and `useInitialRef.ts`. No CSS, artwork, sounds, timers,
render cadence, collision/damage logic, account/authentication/Admin checks,
API, backend, economy, saves or dependency files change. No Next Mission gate,
turret resizing or other unofficial preview features enter this branch.

## Verification

`frontend/scripts/probeSceneReconciliation.mjs` uses real React 19.3.1 and the
actual official GamePage/presentation. Effects, account services, native audio
and browser rendering are unavailable in this controlled host. A test-only
source transform seeds ordinary enemies/shots and applies changing scene data;
it is never included in an application build.

For 600 updates with six enemies and eight player shots:

| Count | Official source | Candidate |
| --- | ---: | ---: |
| JSX element construction calls | 90,600 | 58,300 |
| Unused mission UUID calls | 600 | 0 |
| Repeated local-best reads | 600 | 0 |
| All storage reads during updates | 1,200 | 600 |

This is 35.65% fewer JSX construction calls in that fixture, not 35.65% faster
gameplay or a measured iPhone frame-rate improvement. The remaining storage
read is the existing control-hand preference path, outside this correction.
Timing values in the JSON are host CPU observations and are not release gates.

- Six exact complete host-tree snapshots during movement and 106 additional
  exact state comparisons pass: six locales and compact-number thresholds;
  all 20 sprites at three player stages with changing colors; persistent damage,
  reheating and clearing; player hit feedback; bosses 1, 2, 4 and 50 with exposed
  turrets/core; sector/bonus transitions, pause, destruction and mission end.
- 32 existing ship, hull, exhaust and HUD host instances survive all 600 moving
  updates. No extra host wrappers or per-frame remounts are introduced.
- Each full scene runs in a fresh Node process so actual React SVG IDs start
  from the same counter. IDs and their references remain in exact equality;
  none are normalized out. Render errors cannot be swallowed by the boundary.
- The complete GamePage source matches the official source after expanding only
  the extracted presentation and canonicalizing the five lazy ref initializers.
  This protects simulation, event handlers, scheduler, audio, saving and pacing,
  which host JSON snapshots cannot check.
- The lazy reference keeps assigned null/undefined values, initializes once per
  mounted instance and gets fresh state on remount. Targeted lint for all three
  new application modules passes.
- Negative control: running the same assertions with the unmodified official
  component fails on the 600 unwanted UUID calls. No measure-only bypass exists;
  the success JSON is written only after all assertions pass.
- 52 existing input/loop/hull-fire/reload/boss-boundary tests pass. The actual
  Canvas component lifetime regression passes, including 2,000 warm impacts,
  idle release, no idle drawing, context-loss fallback and unmount cleanup.
- Full frontend build passes, including 12 i18n tests and the release gate.
  Vite still reports the pre-existing large-chunk advisory. No dependencies
  were changed to run the QA host.

Full counts and state hashes: [scene-reconciliation.json](official-testnet-frame-audit-20261019/scene-reconciliation.json).

From `frontend`, with `react-test-renderer` matching the installed React in an
isolated QA directory (default `/tmp/cryptoid-scene-qa`):

```sh
npm install --prefix /tmp/cryptoid-scene-qa --ignore-scripts --no-audit --no-fund --no-package-lock react@19.3.1 react-test-renderer@19.3.1
node --experimental-strip-types scripts/probeSceneReconciliation.mjs
node --experimental-strip-types --test src/pages/hullFires.test.mjs src/pages/gameInput.test.mjs src/pages/gameLoop.test.mjs src/pages/reloadDiagnostics.test.mjs src/pages/bossBoundaryDiagnostics.test.mjs
node --experimental-strip-types scripts/verifyCanvasLifecycle.mjs
node_modules/.bin/eslint src/pages/useInitialRef.ts src/pages/GameShipVisual.tsx src/pages/GameHudStats.tsx
npm run build
git diff --check
```

The probe prefers the pinned official commit and accepts the same-tree local
transfer only when that official Git object is unavailable. Set
`CRYPTOID_SCENE_CANDIDATE_REF` to the official commit to run the expected-failing
negative control. `CRYPTOID_SCENE_QA` selects a different QA dependency folder.

## Device finding and release boundary

The user reports immediate slowdown and subsequent whitescreen/Home exits in
Pi Browser and Safari, including outside boss fights. They saw no improvement
with the unofficial HUD-blur A/B, so blur removal is not promoted as a solution.
Existing device counters omit native/GPU/total WebKit process memory. No supplied
matching October 19 Jetsam report establishes the native reason for the restart.

This candidate removes proven redundant work from the official source. It does
not establish the cause of the iPhone interruption, pixel equality in WebKit,
physical-device memory behavior, FPS, or a complete whitescreen fix. A readable
summary pause alone would not establish cleanup of native resources, and is
excluded from this performance correction.

Neither public alias nor access rights were changed. The official Testnet
remains on `66eb357`; Mainnet remains on `907d2a7`. Source rollback for a future
authorized release is the exact official `66eb357` baseline. Existing earlier
f24 rollback references remain intact. Publishing requires the separate release
instruction in `frontend/AGENTS.md`; no new campaign replay is requested here.
