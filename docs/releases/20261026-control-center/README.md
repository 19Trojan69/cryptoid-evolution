# Game overlay Control Center

Requested by the owner on 26 October 2026: remove tablet/PC fullscreen shortcuts,
bundle existing overlay options in a cockpit Control Center, and publish the same
reviewed source to both existing Testnet and production projects.

Baseline: main 2d020987897cc7af36a1dcab2aafee9326a85462. The previous auth release
is now independently confirmed READY on both projects: Testnet
C1yVAFUCwomDTzVKJaWmyfWejUWm; production CsYosPK58RTx9tnJJHvUkn9BLGC7.
Both official roots/seven JS bundles match, with delivered lifecycle guards,
API health 200, separate testnet/mainnet leaderboard networks and anonymous
Admin 401. See prior-auth-release.json. The first receipt probe incorrectly
looked for shared auth code only in the entry bundle; the corrected probe also
reads the actual dependency chunk. No runtime patch followed that probe failure.

SystemSettings now provides four navy/champagne tiles: audio, controls, display
and language, with current values, one detail group at a time, keyboard focus
and a return button. All existing setters/storage keys remain. Language defaults,
manual language/hand preferences, volume controls and inner scrolling remain.
The standalone field fullscreen button is removed (it was already phone-hidden).
The explicit settings fullscreen button remains phone-only, below 701 CSS px.
Play, Admin launch and the existing Home auto-fullscreen attempt stay unchanged;
unsupported or denying browsers can still reject fullscreen.

Only two exact GamePage source changes are authorized: removing that button and
its unused request import. Reconstructing them restores the exact preceding
GamePage before the established scope checks. All combat, saves, rewards, strict
>2500ms/500ms watchdog, explicit Resume, HUD, original art/sound and backend are
unchanged. PR167/168 are excluded. No account/payment/network/protection change.

Validation: 262 normal frontend release cases, TypeScript/Vite, changed-module
lint; GamePage retains exactly 62 existing lint errors and four warnings.
Native Linux WPE/WebKit 26.5 verifies four overview tiles, audio callback/summary,
saved hand, reduced effects, language, hidden controls, horizontal overflow,
inner scroll/fixed route and explicit Continue at 393x628, 768x1024 and 1280x800.
The actual original GamePage additionally verifies absent shortcut, no repeated
fullscreen on steering, wheel containment, true blur pause, Control Center and
explicit Resume. SDK/API are controlled local fixtures; no real Pi login,
purchase, account writes or physical iPhone acceptance. Historical White Screen
remains open. Initial local checks lacked generated hulls/font fixtures; restoring
those unchanged local resources corrected the host, without weakening runtime.

Preparation branch codex/overlay-control-center-20261026 has auto-deploy disabled.
Rollback: backup/shared-before-control-center-20261026 at exact 2d02098, with the
above READY deployments. Later publication receipts stay on a separate disabled
record branch; do not redeploy documentation commits.
