# CRYPTOID gameplay roadmap

This tracks implementation against the owner's current **Galaga-inspired CRYPTOID upgrade**. Its ordered rows, finite kill-to-clear sections, auto-firing movable ship, every-third-section bonus and sector-ending boss **supersede conflicting rules below** from the earlier master design. Keep original CRYPTOID art and progression; make and test one contained gameplay change at a time.

## Galaga-inspired upgrade — active sequence

| Slice | Acceptance target | Status |
| --- | --- | --- |
| A | Violet/gold π ship moves horizontally and within lower vertical band; auto-fires finite projectile pool; projectile hits require contact, enemy collisions require contact; drops are picked up by ship | Implemented in current change; browser acceptance pending |
| B | Replace timed spawning/V with bounded entry groups and stable rows/columns; section clears only when every enemy is defeated | Pending |
| C | Dive/curve/group runs return to their own slot; add legible enemy fire, budgets and dodge play-testing | Pending |
| D | Each sector contains several sections, every third a non-attacking shooting bonus; 4–6 minute sector pacing and end boss | Pending |
| E | Five weapon levels, drop duration HUD, companion ship/tractor rescue, combos, shards and permanent progression | Pending |

The initial ship slice preserves the old timed sectors and attack paths temporarily; do not label these compliant with kill-to-clear, ordered rows, enemy fire, bonus challenge or boss mechanics yet. The new ship has no real-world crypto logo and ammunition does not spend the legacy Coins counter.

## Required development order

| Step | System | Status |
| --- | --- | --- |
| 1 | Slow wave timing | Done |
| 2 | Visible entry flights | Done |
| 3 | Stable formation slots | Done: initial V formation |
| 4 | First single attack run | Done |
| 5 | Return to original slot | Done |
| 6 | Attack patterns: Dive, Curve, S-Curve, Loop, Side, Double, V | Implemented; full dodging and long-run group play-testing remain open |
| 7 | Visible sectors and internal attack cycles | Implemented: five-minute named sectors, intro, entry, formation, attack/reform, final attack and clear; long-run play-testing remains open |
| 8 | Cryptoid classes, types and fictional markings | Implemented: six distinct silhouettes, four classes, fictional codes, durability and attack pacing; subtype powers still open |
| 9 | Power-ups | First playable stage: safe falling Shield, Repair Core and Overdrive pickups; weapon and shard upgrades pending player ship / weapon and shard systems |
| 10 | Combos and score bonuses | Pending |
| 11 | Legendary Cryptoids | Pending |
| 12 | Mini-bosses | Pending |
| 13 | Bonus phases | Pending |
| 14 | Boss sectors | Pending |
| 15 | Crypto Shards and long-term progression | Pending |

## Design rules to preserve

- Keep the existing playable core; build and play-test each step before advancing.
- Sector pacing should target 4–6 minutes. Progression should add patterns and combinations more than raw speed; the game has no final sector.
- Attackers begin in a visible formation, telegraph their departure, stay on-screen, return to their own reserved slot if they survive, and never duplicate or trap other enemies.
- Early play uses one attacker. Two attackers start no earlier than five minutes; later difficulty may allow three or four within attack and projectile budgets.
- Preserve fair escape space, the bottom player safety zone, bounded effects and mobile performance.
- Use original Crypto/Space/Neon art and fictional faction symbols; no real cryptocurrency logos or copied ships.
- Test start, shooting, hits, kills, pause, game over, restart, paths and return slots after each change. Report any missing acceptance criterion honestly.

## Known gap in the current prototype

The older implementation used tap-to-fire targets and an Earth defense area. The current slice replaces these with a steerable ship, auto-fire, a compact collision radius and proximity pickups. Full keyboard/touch and survival acceptance must be checked in-browser. Sector visuals and special events remain for later steps.

The step 8 roster gives SolFlare a quicker entry/attack, BitRock heavier armor, Ether Crystal a distinct shatter effect, and Ghost Coin a formation-only cloak that stops before any attack. Stable Core's protective field, Ether Crystal's dangerous split fragments, and full multi-enemy Meme Swarm behavior are not yet active and require separate gameplay and fairness tests before being claimed as complete.

Step 9 initially offers tap-to-collect pickups because the current prototype has no movable player ship. Shield absorbs one impact per charge, Repair Core restores one heart up to three, and Overdrive doubles damage per tap for 12 seconds. Drops are rare except for a first safe pickup after three kills; they only appear near a defeated enemy when the position and immediate path are clear. Rapid Fire, Twin Shot, Triple Shot and Crypto Magnet require the later player weapon and Crypto Shard systems. Pickup collision and weapon behavior must be reviewed again after the ship is added.

The Double and V attack paths unlock only after five minutes. Their selection and on-screen geometry are tested; a full long-run play-test with a moving ship is still required.

## Master design reference for later steps

- A normal sector lasts about 4–6 minutes. The intended phase order is INTRO → ENTRY → FORMATION → ATTACK_CYCLE → REFORM → repeated attacks → FINAL_ATTACK → CLEAR → optional special event → next sector. Internal attack cycles must not be shown as Waves.
- The first named sectors are Genesis Belt, Crystal Chain, Meme Nebula, Dark Ledger, Mainnet Core and Quantum Vault. Further sectors recombine existing backgrounds, enemies, formations and patterns indefinitely.
- Entry flights take roughly 5–15 seconds. Formations use the upper 35–45% of the playfield, remain shootable and may drift, pulse, expand, rotate or reform. The planned library includes V, Diamond, Double Line, X, Ring, Split Group, Wave, Spiral, Rotating Core and Shield Wall.
- Attack patterns expand from Dive, Curve, S-Curve, Loop and Side to Double and V. Later patterns include Cross, Tracking Dive, Fake Attack, Rear Return, Spiral and Double Strike. Tracking must lock a direction after a brief correction rather than follow the player perfectly.
- The player ship is a distinctive flat violet and gold craft with two engines and a gold mathematical π at its center. Its collision box should be about 60–75% of its visible size. Keep it original and clearly separate from enemy colors.
- Enemies combine class (Light, Medium, Heavy, Elite), type (BitRock, Ether Crystal, SolFlare, Stable Core, Meme Swarm, Ghost Coin), and fictional faction marking (such as X, Z, R, K, V, Q, XR, VX, ZX or Q7). No real coin branding, official symbols or copied ships.
- Future drops include Rapid Fire, Twin Shot, Triple Shot, Shield, Crypto Magnet, Overdrive and rare Repair Core. Weapon levels run Single → Twin → Rapid Twin → Triple → Plasma. Crypto Shards are game-only resources for persistent upgrades and have no real monetary value.
- Later scoring adds combos x2/x3/x5/x10 and formation, group and bonus-phase rewards. Legendary targets become possible around 8–15 minutes with chance and cooldown; mini-bosses around 5–8 minutes where they fit; the first multi-phase boss around 15–20 minutes. The game continues after every boss.
- A future Difficulty Director uses elapsed play, sector, active enemies, attackers, projectiles and boss cooldowns. Attack and projectile budgets prevent simultaneous unfair patterns. Add complexity through combinations, cap raw speed, and preserve a visible escape route.
- Spawns never surprise the player in the bottom 20–25% safety zone. Attacks need a brief warning; drops must avoid unavoidable hazards. Limit active enemies, projectiles, particles and effects for long smartphone sessions.
