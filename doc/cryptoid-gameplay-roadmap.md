# CRYPTOID gameplay roadmap

This tracks implementation against the owner's current **Galaga-inspired CRYPTOID upgrade**. Its ordered rows, finite kill-to-clear sections, auto-firing movable ship, every-third-section bonus and sector-ending boss **supersede conflicting rules below** from the earlier master design. Keep original CRYPTOID art and progression; make and test one contained gameplay change at a time.

## Galaga-inspired upgrade — active sequence

| Slice | Acceptance target | Status |
| --- | --- | --- |
| A | Violet/gold π ship moves horizontally and within lower vertical band; auto-fires finite projectile pool; projectile hits require contact, enemy collisions require contact; drops are picked up by ship | Implemented; build, lint, logic and desktop drag/playback verified |
| B | Replace timed spawning/V with bounded entry groups and stable rows/columns; section clears only when every enemy is defeated | Implemented; section transitions tested in logic, initial browser entry and kills verified; complete run still open |
| C | Dive/curve/group runs return to their own slot; add legible enemy fire, budgets and dodge play-testing | Existing return/attack paths retained; bounded, telegraphed aimed shots and actual player impact added in current change; long-run dodge test pending |
| Visual identity | Distinct ship silhouettes by strength, fictional letter coins mounted on enemy hulls, gold mathematical π coin on player ship | Twenty supplied top-down designs prepared as transparent atlas; one grey starter plus nineteen purchasable hulls and four free paint previews integrated |
| Sector depth | Distinct dominant planet per named sector, realistic Earth cutout in Genesis Belt, three smaller planets and restrained parallax behind gameplay | Implemented in current change; browser/mobile visual review pending |
| D | Each sector contains several sections, every third a non-attacking shooting bonus; 4–6 minute sector pacing and end boss | Bonus and first Core Warden boss implemented; complete browser run, pacing, distinct bosses and advanced boss phases pending |
| E | Five weapon levels, drop duration HUD, companion ship/tractor rescue, combos, shards and permanent progression | Cosmetic-only Shard earning and persistent ship purchases integrated; other items pending |

Normal sections now spawn a finite grid: six ships on narrow screens, fifteen on wider screens. New sections begin after every planned enemy has entered and all survivors have been shot down. Three sections share a named sector; the third is a bonus challenge with twelve crossing targets, no enemy fire or collision damage, and a tiered score reward. Missed targets exit the field so the challenge always ends. A first Core Warden follows that bonus. The 4–6 minute target is a tuning goal, not a forced timer. Enemy fire is limited and aimed only once per attack with locked trajectory. The ship has no real-world crypto logo and ammunition does not spend the legacy Coins counter.

Visual backgrounds are decorative only. They never consume enemy slots or affect hit detection, and their contrast must be checked against laser and pickup colors. The Earth in Genesis Belt uses an original generated texture in `frontend/public/planets/earth.png`; other worlds currently use palette-specific CSS surfaces. Four fixed planets per sector prevent accumulation during long runs; their diversity and color are scheduled for redesign below.

The supplied 20-ship reference is preserved at `doc/assets/reference-fleet.jpeg`; a transparent derivative is used at `frontend/public/ships/cryptoid-fleet.png`. Enemy classes choose distinct silhouettes from the sheet and mount a smaller fictional letter coin. The former detached health bar is now a ring on that coin. A grey Grey Scout is issued for free. All 19 other hulls can be previewed in any of four paints before purchase with game-only Shards. Paint changes cost nothing after unlocking; every hull retains the gold π coin. One Shard per destroyed Cryptoid is banked when a run ends or the player returns home; ownership, balance and equipped look persist locally. Existing selections of formerly free skins do not grant ownership. The Pi Shop payment products remain separate, and hull purchases have no gameplay advantage. Future progression can extend the Shard system beyond cosmetics.

## Required development order

| Step | System | Status |
| --- | --- | --- |
| 1 | Slow wave timing | Done |
| 2 | Visible entry flights | Done |
| 3 | Stable formation slots | Done: ordered rows with unique slots |
| 4 | First single attack run | Done |
| 5 | Return to original slot | Done |
| 6 | Attack patterns: Dive, Curve, S-Curve, Loop, Side, Double, V | Implemented; full dodging and long-run group play-testing remain open |
| 7 | Visible sectors and internal attack cycles | Implemented: finite kill-to-clear sections inside named sectors; long-run pacing and transitions still need play-testing |
| 8 | Cryptoid classes, types and fictional markings | Implemented: six distinct silhouettes, four classes, fictional codes, durability and attack pacing; subtype powers still open |
| 9 | Power-ups | First playable stage: safe falling Shield, Repair Core and Overdrive pickups; weapon and shard upgrades pending player ship / weapon and shard systems |
| 10 | Combos and score bonuses | Pending |
| 11 | Legendary Cryptoids | Pending |
| 12 | Mini-bosses | Pending |
| 13 | Bonus phases | Implemented first version: every third section, fly-through targets, no enemy attacks, scoring; browser play-test pending |
| 14 | Boss sectors | First end-of-sector boss implemented after bonus: visible entry, aimed capped shots, stronger half-health phase, health bar and kill-to-clear; full play-test and later unique bosses pending |
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

The older implementation used tap-to-fire targets and an Earth defense area. The current game replaces these with a steerable ship, auto-fire, a compact collision radius and proximity pickups. Full keyboard/touch and survival acceptance, the bonus-to-boss transition and sector pacing still need a complete browser run. Richer visuals and audio are planned below.

The step 8 roster gives SolFlare a quicker entry/attack, BitRock heavier armor, Ether Crystal a distinct shatter effect, and Ghost Coin a formation-only cloak that stops before any attack. Stable Core's protective field, Ether Crystal's dangerous split fragments, and full multi-enemy Meme Swarm behavior are not yet active and require separate gameplay and fairness tests before being claimed as complete.

Step 9 pickups are now collected by the player's ship. Shield absorbs one impact per charge, Repair Core restores one heart up to three, and Overdrive doubles shot damage for 12 seconds. Drops are rare except for a first safe pickup after three kills; they only appear near a defeated enemy when the position and immediate path are clear. Rapid Fire, Twin Shot, Triple Shot and Crypto Magnet require later weapon and Crypto Shard systems.

The Double and V attack paths unlock only after five minutes. Their selection and on-screen geometry are tested; a full long-run play-test with a moving ship is still required.

The first Core Warden appears after each third-section bonus. It enters from above, moves horizontally in the upper field, fires single locked shots under the existing projectile budget and fires somewhat more frequently below half health. It has capped health, gives a score reward and must be defeated before the next sector starts. No tractor beam, multi-part boss, dedicated boss art, or 1–3 minute balance tuning is claimed yet.

## Visual, audio and collision redesign — owner requirements (24 September 2026)

Implement in separate slices after the outstanding bonus-to-boss gameplay and mobile run test. Do not bundle planetary assets, ship art, audio and collision changes into one untestable rewrite.

1. **Contact fairness audit.** An attacker's physical contact is now consumed once per attack run, even if the player is briefly invulnerable; its contact flag resets only when the enemy starts a later attack. The existing 1.5-second cooldown also covers enemy projectiles. Shield absorption displays a cyan ring, while an unshielded hit flashes the ship red and costs a heart. Near misses, inactive formations and non-attacking bonus targets cause no ship collision. Logic tests cover these rules; a full live run through Game Over, bonus and boss plus touch play-testing still remains.
2. **Ship and coin art.** Redraw existing player and six enemy types as recognizable, more colorful spacecraft: hull depth, cockpit, wings/side modules, engines and distinct light/medium/heavy/elite silhouettes. Retain the player's violet/gold mathematical π coin and fictional enemy letter coins mounted on hulls. Replace the separate enemy and boss health bar with an attached circular damage rim around each coin (for example an SVG progress stroke). One-hit craft need only a clear impact flash. The rim must stay legible on mobile, follow the ship in flight, update on every hit and disappear on destruction. Preserve collision boxes and performance.
3. **Living starfield.** The tiled CSS stars and field grid are replaced by 215 fixed-seed stars of varied brightness and size in two slowly drifting SVG layers. A subdued Milky Way band changes strength by sector; two rare, brief shooting-star trails pause with gameplay. Reduced-motion mode disables drift and shooting stars. Desktop and narrow-screen visual checks remain before final acceptance.
4. **Planet library and rotation.** Create original, colorful, shaded backgrounds for Earth, Mars, Venus, Jupiter, Saturn and its rings, Neptune and Pluto (a dwarf planet), plus original fictional network worlds. Vary one prominent planet and several smaller bodies per sector and section; avoid using the same single planet repeatedly. Add very slow, plausible axial rotation of a planet's surface/clouds under a steady day/night shading, without spinning the whole spherical illustration like a wheel. Saturn's rings and silhouettes remain stable. Planets stay behind readable hazards with restrained parallax, atmospheric rims and size/depth variation. Cap displayed objects, texture size and animation cost for phones; respect pause and reduced-motion settings. If external NASA imagery is considered, check each asset and NASA's current media/credit guidance rather than assuming every image is available for the intended game use.
5. **Sound effects.** Define a compact event map: player laser (rate limited), enemy fire, projectile impact on armor, enemy damage/armor break, player laser striking an enemy, ship-to-ship collision, player projectile hit/heart loss, shield absorption, pickup/boost/repair, formation arrival, bonus start/perfect, boss warning/hit/defeat, pause and Game Over. Collisions and both kinds of ammunition need distinct, immediate audio feedback; short variants prevent repeated laser shots from sounding identical. Start with a cohesive original sound palette or individually verified CC0 effects (Kenney's Digital Audio/Impact Sounds packs are candidates). Keep a provenance/license manifest alongside every external file. Expose separate sound/music volume and mute controls; start audio only after a user interaction, respect saved settings and bound overlapping sounds on phones. Test on desktop and touch devices.
6. **Music.** Introduce one original or individually licensed loop for normal play, then distinct sector, bonus and boss variations. Ensure clean looping, smooth transitions and quieter mixing under essential hit/warning sounds. Check track-specific commercial/game rights before importing; do not assume a collection-wide label covers third-party music.

Order: finish full playable bonus-to-boss test → collision fairness and coin damage ring → spacecraft visual pass → living starfield → varied rotating planet library → sound events/controls → music. Continue the separate weapon, combo, Network Chain and Shard roadmap afterward. Each slice receives an explicit build, lint, play and mobile check.

## Planned Network Chain ecosystem layer

- Defeated Cryptoids may drop fictional data fragments. Collecting fragments and sustaining a kill combo fills an in-game Chain Meter.
- A full meter builds a block and offers one short-run choice: shield charge, weapon energy, or shard magnet. Three blocks form a Network Link for a sector score reward; this never gates the kill-to-clear section flow.
- Fictional letter coins on the enemy hulls signal fragment families. Later Crypto Shards pay for permanent unlocks outside runs.
- Keep this gameplay system separate from the existing Pi wallet/payment interface. Fragments, blocks and shards have no real-world monetary value or transferable token functionality. Implement after weapon levels, combo and the basic shard inventory are stable.

## Master design reference for later steps

- A normal sector targets about 4–6 minutes across multiple kill-to-clear sections. The current phase order is INTRO → ENTRY → FORMATION → ATTACK_CYCLE → REFORM → repeated attacks → CLEAR → next section. Internal attack cycles must not be shown as Waves.
- The first named sectors are Genesis Belt, Crystal Chain, Meme Nebula, Dark Ledger, Mainnet Core and Quantum Vault. Further sectors recombine existing backgrounds, enemies, formations and patterns indefinitely.
- Entry flights take roughly 5–15 seconds. Default formations use ordered rows and columns in the upper 35–45% of the field. Future variety comes from occupancy, entry paths and enemy mix; unusual formations may occur only as special events.
- Attack patterns expand from Dive, Curve, S-Curve, Loop and Side to Double and V. Later patterns include Cross, Tracking Dive, Fake Attack, Rear Return, Spiral and Double Strike. Tracking must lock a direction after a brief correction rather than follow the player perfectly.
- The player ship is a distinctive flat violet and gold craft with two engines and a gold mathematical π at its center. Its collision box should be about 60–75% of its visible size. Keep it original and clearly separate from enemy colors.
- Enemies combine class (Light, Medium, Heavy, Elite), type (BitRock, Ether Crystal, SolFlare, Stable Core, Meme Swarm, Ghost Coin), and fictional faction marking (such as X, Z, R, K, V, Q, XR, VX, ZX or Q7). No real coin branding, official symbols or copied ships.
- Future drops include Rapid Fire, Twin Shot, Triple Shot, Shield, Crypto Magnet, Overdrive and rare Repair Core. Weapon levels run Single → Twin → Rapid Twin → Triple → Plasma. Crypto Shards are game-only resources for persistent upgrades and have no real monetary value.
- Later scoring adds combos x2/x3/x5/x10 and formation, group and bonus-phase rewards. Legendary targets become possible around 8–15 minutes with chance and cooldown; mini-bosses around 5–8 minutes where they fit; the first multi-phase boss around 15–20 minutes. The game continues after every boss.
- A future Difficulty Director uses elapsed play, sector, active enemies, attackers, projectiles and boss cooldowns. Attack and projectile budgets prevent simultaneous unfair patterns. Add complexity through combinations, cap raw speed, and preserve a visible escape route.
- Spawns never surprise the player in the bottom 20–25% safety zone. Attacks need a brief warning; drops must avoid unavoidable hazards. Limit active enemies, projectiles, particles and effects for long smartphone sessions.
