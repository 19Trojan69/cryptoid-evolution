# Ammunition-notice verification

Run from repository root after the normal frontend hull preparation and backend
compile, using project dependencies and a native browser. Scripts use Playwright
from `CRYPTOID_PLAYWRIGHT_MODULE` or the primary runtime. The completed native
checks use official Playwright1.56.1/Chromium141, not the prior machine-local WPE.
Original Google-font mirrors live under the untracked white-screen-fonts path.
Browser binaries, npm installations, generated hull manifests and Vite caches
are machine-local and excluded from the commit.

- `verify-native.mjs`: actual GamePage plus real isolated local handlers, seven
  UI scenarios. Only SDK/accounts/orders, clocks, expiry boundaries, nonlethal
  protection and one competing-text scene are controlled test data. It starts
  no live account, payment or public game. Screenshots retain original graphics.
- `verify-regression-flow.mjs`: the prior actual-game/handler boss, bonus, final
  explosion, quiet beat, manual completion, save-failure/Retry and final-campaign
  verifier on the same native engine; former evidence is not counted again.
- `verify-game-over.mjs`: the original terminal-idle native check, redirected to
  this scope and the available native engine. No baseline/control run is claimed.
- `results/build.json`, `lint-comparison.json`, `scope.json` and
  `excluded-attempts.json`: normal gate, unchanged baseline findings, exact
  controller scope and excluded fixture/lint-view attempts.
- `before-public.json`: fresh read-only prior shared publication from both aliases.
- `verify-public-release.py after COMMIT TREE`: read-only delivered source/tree,
  identical application bundles/styles, new eight-second record and explicit
  action/red contrast, six-second reload feedback, prior title/idle/resource/
  save/auth guards, public API health, network separation and Admin denial.

Results concern the checked local behavior and delivered public code. They do
not measure physical-device heat, power, native memory or solve the historical
White Screen. Full backend127 is prior acceptance, not rerun. Receipt files are
kept separately after both projects are READY; do not deploy evidence-only refs.
