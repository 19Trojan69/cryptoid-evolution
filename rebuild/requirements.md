# Cryptoid Evolution: rebuild contract

Reference: released runtime 20843b5501387dca8bb5616303934ece2ae6d581;
receipt 8c4f17164daf625a4c9610b5d2d88946010c8496. This is a parallel core
implementation. The current game remains the reference for every migrated rule.

The goal is to remove the White Screen and unsolicited restarts across devices.
A clean implementation is not itself proof that the original failure is fixed.
The full accepted feature set must survive sustained native-browser runs before
the replacement can be treated as ready. Missing features are tracked below.

## Features that must survive

| Area | Binding reference | Migration acceptance |
| --- | --- | --- |
| Campaign and labels | sectorManager, levelDifficulty, combatTiming, blockFlights | Same 500 internal sections, nine blocks then boss/bonus, 50 bosses; preserve visible level/block numbering and difficulty. |
| Enemy models | cryptoidRoster, combatCryptoid, shipFleet, shipDisplayScale | Same classes, identities, approved sizes, paint and released roster. |
| Formations and flight | entryPatterns, attackPatterns, attackPressure, sectorManager | Same entry, sway, attack, return, regroup and reinforcement patterns; no visible positioning markers. |
| Player and input | playerCombat, controlPreferences, gameInput, shipRealism | Same playable lower area, touch offset/sensitivity, keyboard motion, collision geometry and respawn feedback. |
| Weapons | shipAttributes, shipEvolution, weaponAutoReload, playerCombat | Same L1–L5 projectiles, cadence, damage, edition bonuses, charge timers, expiry and explicit auto-reload preference. |
| Hits and collisions | projectileCollision, bossHitTarget, bossContact, powerUps | Preserve swept projectile hits, collision consequences, shield/guard rules, temporary protection and scoring. |
| Bosses | bossManifest, bossWeapons, bossTurrets, bossCore, sectorBoss | Reuse all 50 original models and weapon configurations; turrets first, then exposed reactor/hull and core attacks. |
| Boss support and defeat | bossEscorts, bossCombat, bossExplosionBudget, bossReward | Same escorts, safe docking lane, fall/explosion sequence, heart or shard reward and bonus entry. |
| Boss stop | bossSummaryTiming, BossIntermission, backend bossIntermission | Confirm save/cleanup, at least ten visible prepared seconds, then explicit Continue; no automatic restart. |
| Bonus and rocks | bonusChallenge, bonusRocks, networkChain | Same targets, durations, chain rewards, rock events and authored break-up effects. |
| Pickups and powers | powerUps, collectedPower, pickupOrigin, specialPowers | Same drop origin, limits/no duplicates, falling persistence, activation, paused countdowns and effects. |
| Score and progression | shardEarnings, doubleKillCombo, rewardProgress, playerSave | Same score/shard accounting, combos, rank, durable progression and highscore semantics. |
| Fleet and inventory | shipFleet, hangarCatalog, playerSave | Same ownership IDs, editions, paint, prices, stock and released Testnet offers. |
| Accounts and saves | useAuth, accountSave, saveOutbox, combatCheckpoint | Existing identities and backend schemas; idempotent save/recovery, same run and confirmed durable state. |
| Payments | usePayments, paymentPolicy, API handlers | Existing Pi receipts and confirmation flow; kernel cannot charge or grant inventory. |
| Cards and rewards | collectionData, cardRevealRules, cardRevealMemory | Preserve acquisition rules, unlocks, stories, portraits, exports and seen receipts. |
| Sound | gameAudio, musicPlayback, cardSound | Original samples, music tracks, levels, overlap and gesture rules; no muting/truncation as a stability fix. |
| Appearance and menus | original CSS, original image/audio assets, Shop/Game HUD | Preserve the compact cockpit, visible controls, art quality, sizes and layout. Renderer migration requires visual comparison. |
| Language and display | i18n, locales, typography, displaySettings | Existing supported languages/device choice, manual preference, viewport/fullscreen behavior on phone/tablet/desktop. |
| Other existing pages | GalaxyMap, profile/community pages, AdminPage | Preserve their existing functions and account boundaries; no expansion is part of the core rebuild. |
| Owner diagnostics | ownerLifecycle, ownerFlightRecorder, whiteScreenReport | Fresh server-verified owner access, Admin-only reports, bounded sanitized evidence, no public diagnostics. |

## Ownership boundaries

| Layer | Owns | Must not own |
| --- | --- | --- |
| Simulation | Current run, phase, clock, entities, collision decisions, immutable-domain events | React lifecycle, DOM, navigation, account authority, HTTP, audio graphs or storage. |
| Frame driver | One scheduling lease and existing interruption semantics | Independent component RAFs, unbounded catch-up or automatic Resume. |
| Renderer | Explicit surfaces and texture leases for the current scene | Gameplay state, rewards, timers, saves or route changes. |
| Input adapter | One active gesture, keyboard state and geometry updates | Progression, loading, payment or simulation scheduling. |
| Audio adapter | Existing sound/music instances and finished-voice cleanup | Gameplay clock, navigation or charge decisions. |
| Persistence adapter | Existing backend schema, durable outbox and idempotent receipts | Simulation advancement while awaiting a response. |
| UI adapter | Existing HUD/menus, explicit player decisions and changed HUD values | Per-frame copying of the whole game into React. |

## Ordered migration gates

1. Pure lifecycle, campaign mapping, clock and resource ownership. Tests must
   demonstrate stale async completions cannot revive a closed run, and a pause
   cannot simulate elapsed background time.
2. Functional player/enemy/projectile loop with original rules and images.
   This is an internal core fixture, not a replacement public game.
3. Boss mechanics and all 50 configuration variants, followed by actual defeat,
   reward, saved statistics stop and bonus transitions.
4. Remaining powers, effects, sound, accounts, inventory and progression are
   integrated through the separate ports. Each addition has its own sustained
   test against the preceding accepted stage.
5. Complete campaign and real navigation/load paths in Chromium and WebKit,
   smartphone/tablet/desktop layouts and the actually affected devices. Measure
   native resource trends where available and distinguish a normal death,
   technical pause, renderer failure and document replacement.

## Current completion

| Item | Status |
| --- | --- |
| Existing-feature inventory and boundaries | Recorded from the released source. |
| Pure lifecycle/campaign/ownership foundation | 43 unit/contract cases and TypeScript pass; 41-module simulation boundary audit passes. |
| New playable core and renderer | Internal single-encounter fixture; functional native controls cover all 50 original boss models. Decoder/native-memory acceptance is blocked. |
| Pure boss-stop gate | Seven contracts pass; real backend/UI/bonus integration remains pending. |
| Native memory stage attribution | Eight matched 100-cycle controls complete: large Chromium retention begins in decode; WPE's additional retention is triggered by drawing/native heap allocation. Exact allocation lifetime and bounded memory remain unaccepted. |
| Dynamic scene/bonus/durable boss-stop handoff | Pending; the fixture stops at encounter completion. |
| Full feature migration | Pending. |
| Original White Screen reproduced/fixed | Open. |
| Replacement deployment | Not included. |

The first native gate covers original hull loading, live input/projectiles,
explicit Pause/Resume, a controlled renderer exception retaining the same run
and byte-identical last canvas, twelve actual normal/boss mount-close cycles per
engine, original boss 4 mounted weapons, desktop geometry and cancellation of
held asset loading. Managed resource entries/bytes/scopes and owned visible
canvas dimensions return to zero after closure, with a stable closed DOM count.
This accounting is not a measurement of full browser/GPU memory or a historical
White Screen reproduction. Effects, sound, full HUD, transparent-image centering
and visual parity are not yet accepted in this isolated renderer. The twelve-second
exposed-reactor contracts cover all 50 boss configurations but are not full fights
or a complete campaign pass. No game/account/backend production file is changed.

Earlier complete-GamePage local runs and their limitations remain recorded in
verification/core-white-screen-status.json. A ten-minute native Linux WebKit
boss fight ran without the reported failure. That does not supersede the owner's
cross-device observation. An automated Chromium campaign ended first by normal
death; a later controller trial clicked a side menu and stopped paused. Neither
is a White Screen reproduction or a passed full-campaign test.
