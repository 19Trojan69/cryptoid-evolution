# Binary-pause weapon feedback verification

Run from repository root after normal frontend hull preparation and backend
compile. Native scripts use Playwright from `CRYPTOID_PLAYWRIGHT_MODULE` or the
primary runtime; final runs use official Playwright1.56.1/Chromium141. Local font
mirrors, browser installations, generated hull manifests and Vite caches are
excluded. Controlled SDK/account/orders/clocks/expiry/boundary fixtures never
become public hooks and do not mutate a live account or buy anything.

- `verify-native.mjs`: actual GamePage and isolated real handlers; eight scenarios
  cover paid/pickup expiry, a different active paid fallback, successful Auto,
  evolved free weapon, compact phone/tablet/wide screens, both hands, German/
  English/Thai and Reduced Motion. Checks prove no combat popup, the shared
  binary lifetime, red expiry/current names, no CTA/control/text overlap, native
  binary animation behind the static label, retained equipment time, manual and
  technical pauses, explicit Resume and no repeated stale feedback. The first
  case uses the actual next-block clear/intro flow after controlled fleet removal;
  the others seed the equivalent formation preparation boundary locally.
- `verify-regression-flow.mjs`: real controller/handlers, boss60 and500, projectiles,
  final effects, quiet completion, save Retry, manual Continue and final victory.
- `verify-game-over.mjs`: terminal idle, finite native explosion, zero controller
  steps for five settled terminal seconds, explicit restart and modal Home.
- `results/build.json`, `lint-comparison.json`, `scope.json`,
  `excluded-attempts.json`: exact checked scope and limitations. Historical 62
  GamePage lint errors/four warnings are compared, never described as repaired.
- `before-public.json`: fresh successful read-only check of both prior aliases.
- `verify-public-release.py after COMMIT TREE`: actual delivered commit/tree,
  identical bundles/styles, new binary/red/expiry/current-name wiring, absent
  purchase action/combat popups, prior timing/resource/save/auth guards, health,
  separate networks, catalogue and denied anonymous Admin access.

The new owner instructions supersede the old eight-second combat popup,
six-second display timeout, buy-action/geometry tests and purchase wording. Their
replacements exercise the actual final JSX/controller/component instead of
weakening unrelated protections. Physical iPhone/Pi heat/power/FPS/native memory
and the historical White Screen are not acceptance claims. Backend127 remains
prior evidence, not rerun. Publication receipts belong on a separate disabled
ref so they do not start duplicate builds.
