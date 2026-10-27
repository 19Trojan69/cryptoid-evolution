# Acceptance: purchased ship selection and account starts

Base1d80051/tree20919d5 is verified from GitHub and both actual public aliases.
Source/runtime changes and legacy behavior are described in the matching docs.

Run from repository root with normal dependencies and backend compilation:

```
npm test --prefix backend
npm run build --prefix frontend
node --experimental-strip-types --test frontend/src/pages/shipEvolution.test.mjs frontend/src/pages/guestShipPurchase.test.mjs frontend/src/pages/shipAttributes.test.mjs
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node verification/ship-stage-selection-20261027/verify-native.mjs
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node verification/ship-stage-selection-20261027/verify-control.mjs
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node verification/ship-stage-selection-20261027/verify-regression-flow.mjs
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node verification/ship-stage-selection-20261027/verify-game-over.mjs
python verification/ship-stage-selection-20261027/verify-public-release.py after MERGED_SOURCE_SHA TESTED_TREE_SHA
```

Accepted:141 backend and430 frontend release cases, eight separate evolution/
guest-purchase/attribute cases,32 native selection assertions, two focused
pinned-UI control scenarios,74 full-flow and11 Game Over assertions. Native
acceptance records the exact unchanged controller digest and Chromium version.
The optional CRYPTOID_LEGACY_ONLY fixture diagnostic is not the full acceptance
result; only the complete normal invocation is counted.

Five additional assertions exercise direct Shop category navigation,44px
controls within the phone viewport, all four weapons/five purchasable owner
Testnet powers, reset content scroll and no purchase/loadout mutation; desktop
weapons navigation preserves the explicitly selected Elite. The matching static
shop CSS introduces no animation or active-game work.

The native flow uses actual React/router/GamePage, Pi checkout handlers, account
selection/start/checkpoint handlers and local database fixtures. SDK payments,
UIDs/tokens, balances, account history, elapsed-run allowance and controlled guard
consumption are synthetic. No actual wallet/account or payment is used. Source
image identities, real strengthened live projectiles, permanent-weapon absence
of a timer, actual selected stage, versioned API responses and spent guard values
are checked. Old control pins UI/controller files to the base and uses compatible
real local handlers; it demonstrates a verified-token-only guest misclassification
and the independently incorrect old Equipped label, not a full old backend run.

Manual selection is checked after actual isolated Advanced/Elite approval and
completion, and for guest Standard acquisition. Resume and explicit lower/higher
stage selection preserve the saved mission and never refill protection. Backend
cases cover all20 identities, exact paid prerequisites, unowned paint, invalid
stage/version, separate networks and old-save compatibility. No free grants,
extra charge use, prices, combat damage rules or progression reset are introduced.

Earlier fixture attempts are excluded: missing local .env under Vite's default
NODE_ENV, changed NODE_ENV causing two React Router contexts, missing mock Pi
SDK method, a mismatched synthetic transaction ID correctly rejected by the
backend, an obsolete Play selector, and a transient deadline during concurrent
browser runs. Final fixtures warm backend modules before starting Vite, retain
one environment, use matching synthetic receipt IDs and actual selectors. Desktop
Select content is checked independent of CSS uppercase presentation. The copied PR190 public verifier initially expected owner-catalog features absent
in its before phase; this release correctly requires those already-published
features in both phases. Original font mirrors were pruned; empty external font CSS is used, with no font-pixel or
physical Pi Browser/temperature/FPS claim. No failed attempt is counted as passed.

Existing exact scope fingerprints are extended only by fixed reviewed controller
hunks and one complete account-save type line. Watchdog/save/payment negative
controls remain. Lint compares actual baseline/candidate messages; GamePage62+4
and Shop5 remain existing findings, not fixed or whole-project lint-clean.
Original images, all1740 painted-variant encoded byte sizes and the HUD/CSS remain.

Before-public and final public verifier check delivered entry/Shop/GamePage/
dependency bundles and CSS, exact source commit/tree, explicit selected-stage/
verified-account markers, all retained receipt/save/auth/resource/transition/
terminal/Home/owner-catalog guards, APIs and separated networks. Actual READY,
source and public alias observations go in a separate auto-deploy-disabled release
receipt branch, not another main commit. Raw live owner/order data, owner images,
font/browser/dependency caches and generated local HTML are excluded.
