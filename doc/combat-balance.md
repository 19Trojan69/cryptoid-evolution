# Combat balance — 11 October 2026

The campaign now scales enemy durability by class and uses bounded boss health
budgets. Shard hull bonuses and permanent Advanced/Elite advantages retain
their existing values. Connected twin/triple shots now deal their full damage
to an exposed boss reactor instead of losing the additional hits to a shared
180 ms damage gate.

## Normal enemies

The distributed 0/1/2 progression credits remain level-dependent. Each credit
now adds 25% of the enemy type's base durability. Previously it added two HP
to every type, disproportionately strengthening light enemies.

| Class | Base HP | Former maximum HP | New maximum HP |
|---|---:|---:|---:|
| Light (SolFlare, Meme Swarm) | 4 | 8 | 6 |
| Medium (Ether Crystal, Stable Core) | 8 | 12 | 12 |
| Heavy (BitRock) | 12 | 16 | 18 |
| Elite (Ghost Coin) | 10 | 14 | 15 |

Ghost Coin retains its formation-only cloak. Movement, warning time, attack
patterns, simultaneous attacker limits and projectile limits are unchanged.
The heavy class remains tougher than Ghost Coin; Elite's distinction includes
the cloak and higher points rather than an implicit claim of the most armor.

## Bosses

- Total turret HP follows `36 + 72p + 108p²`, where `p` is boss progression
  from 0 to 1. It increases from 36 to 216 across all 50 bosses. Each mounted
  gun receives a share weighted by `4 + caliber / 4`, rounded to six decimals.
  More guns no longer cause a discontinuous jump in the boss's total armor.
- Reactor HP follows `252 + 108q + 36q²`, where `q` is the existing campaign
  difficulty progression. Its cap is 396 rather than 1080. The first boss has
  approximately 254 HP rather than 259; its starter-weapon challenge is close
  to the previous version.
- All actual connected player projectiles deal damage. The protected reactor
  still cannot be damaged until every mounted gun is destroyed. Projectiles
  are consumed by the existing GamePage collision loop, so one projectile
  cannot hit repeatedly. The exposed reactor's existing 2x damage multiplier
  remains in force.
- Each bomb is limited by both its existing nominal damage and a fraction of
  a station's original max HP. The fraction decreases from 100% to 25% across
  the boss roster. A full first battery takes one blast; the last takes four.
  A bomb can damage an exposed reactor but cannot deliver its killing blow.
- All 392 guns, their caliber, alignment, projectile speed, firing cadence,
  escorts and reactor warnings retain their existing combat behavior. Later
  bosses increase pressure through their mounted weapons and patterns rather
  than requiring many minutes of continuous base-weapon hits.

Difficulty remains tied to the campaign stage, not the player's hull. Existing
owners keep their benefits. Pi/Shard prices, availability locks, color rules,
rewards, inventory and projectile guards are unchanged. Strong temporary
weapons can shorten a fight substantially; purchases are not assumed by the
base-weapon durability targets.

## Reproducible damage audit

Run `node --experimental-strip-types frontend/scripts/combat-balance-audit.mjs`
from the repository root. The script calls the production volley, cadence,
boss creation and damage functions for 60,000 combinations: 20 hulls × 3
stages × 5 weapons × 2 Rapid states × 2 Overdrive states × 50 bosses.

The baseline formulas are pinned to commit e633594 (#156). Detailed numbers
are in `combat-balance-audit.json`.

| Boss | Grey Scout Standard before | Standard after | Advanced after | Elite after |
|---|---:|---:|---:|---:|
| 1 | 53.12 s | 52.16 s | 26.24 s | 13.12 s |
| 10 | 85.44 s | 61.44 s | 30.72 s | 15.68 s |
| 25 | 167.36 s | 82.56 s | 41.28 s | 21.44 s |
| 50 | 480.00 s | 136.32 s | 68.16 s | 34.88 s |

These are ideal connected-shot estimates for the whole battery and reactor,
with the ground weapon and no temporary boosts. Sequential targets are
assumed. They exclude projectile travel, aim, movement, incoming damage,
escorts, entry and reward transitions. They are not measured playtime or win
rates. Weapon-5 rows in the JSON assume sustained fire; separate scenarios
expire a free Twin pickup after 20 seconds. That pickup reduces the final
starter fight estimate to 116.48 seconds, rather than being treated as an
unlimited weapon upgrade.

## Verification and compatibility

Regression checks cover stage benefits, power-up composition, independent
turret damage, bombs/EMP, all mounted barrels, collision reachability, escape
gaps, projectile budgets, rewards, account checkpoints, and translation/build
gates. Matrix tests verify proportional enemy HP over all 500 stages, increasing
battery budgets, all connected volley damage, finite completion, and timer
expiry. They establish numerical consistency, not a perfect human difficulty.

Saved live enemies and bosses retain their recorded HP/maxHP and timers.
Newly spawned encounters use the new budgets. Fractional HP remains compatible
with the deployed checkpoint validator; no save or inventory migration is
needed. Existing high scores are retained. Cross-release high scores therefore
reflect different balance versions and are not strictly comparable.

A physical iPhone/Xiaomi/Pi Browser playtest and human win-rate evaluation
remain follow-up evidence. The balance can be refined with that feedback.
