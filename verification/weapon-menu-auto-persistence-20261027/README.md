# Acceptance: mission drawer scrolling and Auto persistence

Base363d9fd/tree9dbf462 was verified on GitHub and both public aliases in the prior release; the exact before receipt is preserved here. Runtime scope and compatibility are described in docs/weapon-menu-auto-persistence-20261027.

Run from repository root:

```
npm test --prefix backend
npm run build --prefix frontend
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node verification/weapon-menu-auto-persistence-20261027/verify-native.mjs
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node verification/weapon-menu-auto-persistence-20261027/verify-native.mjs control
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node verification/weapon-menu-auto-persistence-20261027/verify-selection.mjs
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node verification/weapon-menu-auto-persistence-20261027/verify-regression-flow.mjs
CRYPTOID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node verification/weapon-menu-auto-persistence-20261027/verify-game-over.mjs
python verification/weapon-menu-auto-persistence-20261027/verify-public-release.py after MERGED_SOURCE_SHA TESTED_TREE_SHA
```

The native UI flow uses actual GameEntry/GamePage/drawer/checkout components and real local account, payment, inventory, start, checkpoint and resume handlers. SDK identity/transactions, order history/stock, database, controlled expiry, safe hits and elapsed-run allowance are isolated fixtures. No live account, payment or selection is performed. Native Chromium touch drags scroll visible non-interactive offer text, not merely a programmatic scrollTop assignment. The quantity/repurchase control is visibly inside the scroll area above the fixed footer. Five real fixture checkout charges are credited once. Tests cover393x744,820x1180 and844x390, Reduced Motion, unchanged document scroll and a visible return button. No physical Pi Browser/font-pixel claim.

Nineteen full native assertions cover a saved Auto charge at confirmed start, protected paused time, actual offer scrolling and repurchase, delayed reload confirmation arriving during a manual pause, no automatic combat resume, explicit Auto off/on, stock use, confirmed Resume and all three viewport shapes. The seven-check pinned UI counterexample uses the exact restored363d9fd controller, original scroll markup and route CSS; it reproduces no Auto start, blocked native scrolling and a paid timer stranded behind Standard during pause. Programmatic click/scrollIntoView reaches the known blocked old Select solely to exercise the response race; this is not claimed as successful old native scrolling or a full old campaign.

New unit checks execute the actual bounded-run effect, explicit preference/inventory callbacks and actual asynchronous weapon handlers, test allowed/owned/empty/cached choices, pause and newer-pickup priority, manual overrides, receipt bounds and exact whole-controller restoration with mutation controls. Existing full release guards are retained. Repeated selection/full-flow/Game Over results are recorded alongside the new native receipt.

Excluded fixture attempts include seed orders missing their required payment IDs (correctly ignored), an initially overbroad mutation test targeting an older identical pause expression, and touch coordinates landing on/next to switch controls instead of visible offer text. A minimal independent native-input probe confirmed the driver under real and controlled JS clocks. Final acceptance uses actual visible headings/paragraphs and native touch events. The optional without-pause-css probe is diagnostic only, not acceptance. Only complete final receipts are counted. Generated painted-hull revision metadata is restored before publication; artwork and encoded image sizes are unchanged. No raw owner screenshot, browser/font/Vite cache or dependency data is committed.

Public checks verify delivered commit/tree, identical bundles/CSS, scroll-body/paused-pan/confirmation/bounded Auto markers and every retained auth/save/receipt/resource/transition/binary/Home/owner-catalog/terminal guard, health/catalog/leaderboard and separate networks. Actual READY/source/public alias observations are saved on an auto-deploy-disabled receipt ref that must not merge to main.

Final accepted results:437 frontend release cases/localization/types/Vite,141 backend cases,19 new native UI checks,7 pinned-old-UI counterexample checks,32 repeated selection/shop checks,74 repeated full-flow and11 Game Over checks. All complete with no unexpected page/API errors. Native terminal controller work is zero steps in five seconds. Lint findings match the pinned base.
