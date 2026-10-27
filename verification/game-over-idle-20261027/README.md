# Terminal-loop evidence

Run from the repository root with existing prepared original hulls and frontend /
backend dependencies. The native verifier uses the repository's local WPE26.5
runtime, official native support libraries and local original font mirror. These
machine-local dependencies and generated Vite/GStreamer caches are not shipped.

`node verification/game-over-idle-20261027/verify-native.mjs` tests the candidate's
actual GamePage and guarded loop with real isolated API handlers. `--control`
substitutes only GamePage from pinned public 09a6a40. SDK/session data, fatal
projectile, animation hold and clocks are local test scaffolding; no real account,
login, purchase, public game or database is used. Native CSS animations are
explicitly held at the boundary, resumed, then observed with real short waits.

- results/native.json: completed candidate, eleven checks, zero settled game
  callbacks over five seconds, original explosion completion, restart and Home.
- results/control-observation.json: valid eight-check pinned-control evidence,
  300 callbacks over five seconds; final hidden-header Home selector failed, so
  this is not a complete old-control UI pass. Full attempt remains local only.
- results/initial-animation-clock-assumption.json: excluded first attempt; virtual
  JS clock was incorrectly assumed to advance native CSS animation time.
- results/build.json: completed 397-case frontend gate, localization, types/Vite.
- results/lint-comparison.json: exact messages match pinned source under current
  tools; historical 62 errors/four warnings are retained, not claimed repaired.
- results/scope.json: exact runtime delta and unchanged protected source checks.
- before-public.json: read-only prior shared release snapshot from both aliases.

`python verification/game-over-idle-20261027/verify-public-release.py before|after
COMMIT TREE` checks delivered bundles, the exact terminal predicate, prior guards,
unchanged CSS and separate public API networks. The after-phase also compares
styles with before-public.json. It does not authenticate or start a public game.
Actual after-public/dashboard evidence belongs to a separate auto-deploy-disabled
receipt branch after both projects report READY.

These controlled checks do not measure physical heat, power, native memory or a
historical White Screen fix. Older 74-flow / 127-backend results remain baseline.
