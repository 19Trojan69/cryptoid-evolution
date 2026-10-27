# Readable-transition evidence

Run from repository root using the existing prepared original hulls, frontend
dependencies and the local WPE/WebKit 26.5 runtime. Machine-local libraries,
browser binaries, generated manifests/caches and unrelated untracked files are
excluded from this release.

- `verify-native.mjs`: actual GamePage and real isolated local handlers. Seven
  scenarios cover Level 1, the owner's Level 6/Block 5 title, late block clear,
  boss warning, bonus, system Reduced Motion and saved reduced-motion Tablet.
  Verify actual phase retention/deadline, native finite duration, static children,
  bounds, protected equipment clocks, retained native pause/explicit Resume and
  no automatic technical Resume. Synthetic charges are confirmed by the real
  handler before pause/checkpoint checks. JavaScript and native CSS clocks are
  explicitly distinct; a test-only seek samples the native readable plateau.
- `verify-flow.mjs`: the prior actual GamePage/handler completion verifier,
  redirected into this scope. Test combat completion, SDK, accounts and clocks
  are local fixtures. Boss/bonus/final explosion/quiet/manual completion,
  repeated pauses, save failure/Retry, exact rewards/checkpoint and campaign end.
- `results/game-over-retained.json`: the original 11-check native verifier run
  against the extended candidate; zero controller callbacks in five settled
  Game Over seconds, independent explosion completion, explicit restart/Home.
- `results/build.json`, `results/lint-comparison.json`, `results/scope.json` and
  `results/excluded-attempts.json` record exact gate/scope and test-host limits.
- `before-public.json`: fresh read-only checks of both shared public aliases.
- `verify-public-release.py after COMMIT TREE`: delivered bundle hashes and
  identities, actual title/phase code and CSS, prior guards, API health,
  separate networks, catalogue descriptions and anonymous Admin denial. It
  starts no public game, authenticates no account and makes no purchase.

Full attempt caches and excluded fixture runs stay local; the concise exclusion
record does not count them as passes. No physical iPhone/Pi long-run acceptance,
temperature measurement or historical White Screen fix is implied. Publication
evidence belongs on a separate auto-deploy-disabled receipt branch once both
projects are actually READY.

Final acceptance: 406 frontend release tests, localization/types/Vite; 68 targeted
native title checks, 74 actual-flow checks and 11 retained Game Over checks pass.
Current GamePage lint findings match the pinned candidate (0 errors/4 warnings).
