# Mobile cockpit and one level-completion scene

Baseline: published d0a0b81e175bbf955dfe06d9e693b08566aabfbb in both official projects.
The owner requests these changes in production and continued Testnet alignment.

The game route now owns document scrolling from its authentication gate until
route exit. Fixed body geometry and a bounded touchmove handler stop page pulls;
inner settings still scroll and their edges cannot hand the gesture to the page.
Cleanup restores owned classes, listeners and the prior scroll position. Ordinary
steering no longer repeatedly requests native fullscreen. Play and the explicit
fullscreen controls keep their original request. Genuine blur, hidden-document
and >2500 ms / 500 ms watchdog pauses still require explicit Resume.

Authentication reuses one original hull in a launch composition. Menus, buttons,
settings and mission overlays regain the navy/champagne instrument styling.
There is no new canvas or perpetual launch animation. Original HUD geometry,
ships, simulation, audio and all combat rules remain intact.

The statistics stop moves from after the boss to the end of the bonus round.
The original level-complete heading and blockchain illustration share one scene
with the existing mission statistics, actual bonus/chain/Shards/score rewards,
an extra heart only when the bonus actually awarded it, and Continue game.
Rewards are credited through the original event once, before the scene opens;
Continue itself grants nothing. Ten visible prepared seconds and explicit
Continue remain. Save failures leave it disabled with Retry. Before enabling,
the client drains the durable outbox and confirms the next checkpoint and its
score, Shards and hearts; unused-resource cleanup remains at the summary stop.
The final campaign checkpoint may be null, as before.

New boss reward events carry only summaryPlacement=level-end, so the server does
not create the legacy boss UI marker for those clients. All original reward
order, score bounds, snapshot validation and idempotency stay active. Old clients
still use the previous marker/ten-second stop. A new client can move its restored
legacy marker to the level end through the existing authenticated, run/network/
stage-bound confirmation route; this removes only that UI marker. It does not
change the snapshot, balance or any reward.

First use follows the browser-exposed device language and right-handed controls.
Explicit manual choices persist. Auto language also resynchronizes on focus and
pageshow, and the settings overview identifies automatic mode. Hand selection
still works within the tab when storage is denied. There is no browser-data reset.

Validation: 251 frontend release-gate cases, TypeScript and Vite; 126 backend cases
and TypeScript; changed leaf-module ESLint; 39 native WPE/WebKit checks.
GamePage retains the same 62 existing ESLint errors and 4 warnings as the
published baseline, with no added rule/message findings. Native checks
cover 393x744, 393x628 and 768x1024, every displayed chain block, complete statistics
and Continue fit, actual extra-heart visibility, manual/automatic language and
hand persistence, settings scroll, original guest-game page motion, repeated
fullscreen requests, genuine blur and explicit Resume. The native SDK/API are
local fixtures, with no live account, reward, purchase or database writes.

The exact reviewed GamePage changes are pinned in mobileCockpitReviewedChanges.mjs;
normalizing only those hunks reconstructs the published source byte for byte.
The established fullSessionScope semantic fingerprints and negative controls stay
active. accountSave.ts, its bounded invalid_save retries and the backend score
rules are unchanged. Original pre-baked hulls were reused; the local build ran
the complete build command with npm lifecycle hooks disabled to avoid needlessly
regenerating those unchanged assets. Deployment uses the normal build process.

This is Linux WPE testing with controlled inputs, not a physical iPhone/Pi Browser
or native-touch certification. It does not establish that the historical White
Screen is fixed. Initial verifier host/locator/early-read failures are retained
separately; no game guard was weakened to pass them.

Rollback: restore both projects to d0a0b81 and their existing READY deployments
Testnet dpl_65SLqpFEVhBWaSaArrmNgBM5vb8A and main dpl_94e3az5zdn1969RBi71bxf9jAEmK.
No environment, project protection, account schema migration or data reset.
