# CRYPTOID gameplay roadmap

This tracks implementation against the CRYPTOID Master Game Design supplied by the project owner. The full design remains the reference for mechanics, visual identity, fairness, difficulty and acceptance criteria.

## Required development order

| Step | System | Status |
| --- | --- | --- |
| 1 | Slow wave timing | Done |
| 2 | Visible entry flights | Done |
| 3 | Stable formation slots | Done: initial V formation |
| 4 | First single attack run | Done |
| 5 | Return to original slot | Done |
| 6 | Attack patterns: Dive, Curve, S-Curve, Loop, Side, Double, V | Implemented; full dodging and long-run group play-testing remain open |
| 7 | Visible sectors and internal attack cycles | Pending |
| 8 | Cryptoid classes, types and fictional markings | Pending |
| 9 | Power-ups | Pending |
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

The current browser game uses tap-to-fire asteroids and an Earth defense area; it does not yet have a steerable player ship. Movement, dodging and ship hitbox criteria cannot be marked as passed until that feature exists. The visible Wave counter remains until step 7.

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
