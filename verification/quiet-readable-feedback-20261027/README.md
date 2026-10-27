# Acceptance and release evidence

The base is the actual shared public/main c7811d0 / treea21aa5c, verified again
through remote Git and before-public.json. The complete controller is pinned by
quietFeedbackReviewedChanges.mjs, called before the older exact restoration chain.

## Reproduce

From repository root, with frontend/backend dependencies and built backend:

```
npm run build --prefix frontend
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node verification/quiet-readable-feedback-20261027/verify-native.mjs
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright CRYPTOID_FEEDBACK_CONTROL=1 node verification/quiet-readable-feedback-20261027/verify-native.mjs
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node verification/quiet-readable-feedback-20261027/verify-regression-flow.mjs
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node verification/quiet-readable-feedback-20261027/verify-game-over.mjs
python verification/quiet-readable-feedback-20261027/verify-public-release.py after ACTUAL_MERGE_SHA ACTUAL_TREE_SHA
```

Native checks use the actual GamePage, guarded/shared loop and real local backend
handlers; SDK, account, stock, elapsed mission allowances and expiry/combat edges
are isolated fixtures. No live Pi account/payment or production data is used.
The late multi-flight fixture begins at a valid saved stage159 with its prior
reward ledger and a second real confirmed45-second charge to check clock
protection. Only the deliberate503 reload case may fail an API request. Browser
engine and exact unchanged source hash are recorded. JS time is controlled;
CSS is observed on its own real native clock. Pause retains/freezes the warning
node; the test does not assume advancing JS time moves CSS time. Reduced Motion
is tested separately. This is not a physical-device temperature/FPS experiment.

The pinned-public control is a focused counterexample, not an old full campaign
acceptance run. It shows the same red expiry repeating at a direct entry-clear /
next-flight boundary, and no visible reload-result component. Candidate checks
include that edge, two later flights, paid/pickup/Auto/fallback/evolved shots,
real shop marks,320–1363px widths, left/right controls, pause/manual technical
Resume, delayed/rejected/confirmed reloads, red passive binary-only geometry,
no overlap/buy action/extra charge, readable warning/goal lifetimes and charge
protection. Earlier exploratory runs made while refining view-state copies or
before the late-stage fixture's complete ledger are excluded from acceptance;
only the final unchanged-source result is cited. An initial late-flight assertion
compared equipment before the warning with equipment after later active combat;
it was corrected to compare within the protected phase and allow the normal
consumption after combat resumes.

The repeated full flow covers bosses60/500, direct simulation/DOM agreement,
projectiles, pause, final bonus explosion, quiet phase, confirmed manual Continue,
failed-save Retry, exact reward/heart stats and final victory. The separate
Game Over run covers original native explosion completion, zero controller steps
for five terminal seconds, no automatic resume, explicit healthy restart and
visible dialog Home/unmount.

Build/lint/scope results state their exact counts and limits. Backend source is
byte-identical; its old127-test suite remains prior evidence. Current GamePage
lint matches the pinned62 errors/four warnings; small changed modules are clean.
No full-project lint-clean or universal device/White Screen claim is made.

Before-public captures both old aliases. The public verifier checks both actual
entry/lazy GamePage/Shop/dependency bundles and CSS, matching source commit/tree,
all new feedback/readability markers and retained auth/save/equipment/resource/
terminal guards, separate API networks,45-second offers and denied anonymous
Admin. READY deployment/source/alias observations and final hashes go in a
separate auto-deploy-disabled receipt branch after the one shared main release.
No caches/browser profiles/original owner screenshots are part of the commit.

Accepted final results:416 release cases,8 separate combat-variety cases,209
native feedback checks across12 scenarios,14 focused pinned-public control
checks,74 repeated full-flow checks and11 repeated Game Over checks. All pass.
The final controller SHA256 is `51db299a50ee70835758c46bf8209a1ffa779dd88451db1fa026cb9d5c3b0bbb`.
