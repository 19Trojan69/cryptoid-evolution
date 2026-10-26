# Isolated Cryptoid core rebuild

The owner proposes rebuilding the game with its existing features to address the
White Screen across devices, and asks to continue without repeated interruptions.
Prepare the new core separately. The reference is released runtime
20843b5501387dca8bb5616303934ece2ae6d581 and release receipt 8c4f171.
No original White Screen cause or complete fix has yet been demonstrated.

Preserve approved art, HUD, sound, rules, campaign data, account/inventory/save
schemas, payment receipts and economy. Use requirements.md as the migration
ledger. Existing pure data/rule modules may be imported where explicitly listed;
do not import GamePage, React, routing, network clients or browser storage into
the simulation. Input, rendering, audio and persistence are separate ports.

Keep one clock owner, the strict >2500 ms / 500 ms interruption guard, bounded
simulation catch-up and explicit Resume. Rendering failure pauses the same run;
the core has no navigation/reload behavior. Resources have explicit ownership,
bounded admission and late-async disposal. A closed session cannot be revived.

Existing Testnet/Mainnet and fixed release/rollback references are the comparison
baseline. No partial replacement, database migration, automatic deployment, real
purchase or player-data mutation is included in this isolated preparation.
Do not call a reduced prototype feature-complete or a White Screen cure.

Later owner clarification: the successful PC run was Sandbox play without a
deliberate Pi login. Prioritize smartphone/tablet failure paths and investigate
auth/account ownership as a controlled variable; fullscreen is deferred. Read
`evidence/login-cache-followup-20261026/README.md` before repeating controls.
The latest WPE account suite includes an initial loop-stall failure, preserved
with same document/run and no White Screen. Subsequent paired passes do not erase
it. Closed-idle Chromium cache providers report zero locked bytes despite large
reported size; global dump and original-quality native-memory gates remain open.
