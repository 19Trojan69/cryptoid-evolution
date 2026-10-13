# Preserve the officially approved game

## Latest scope reset: 13 October 2026

Follow-up feedback at 22:59 Vienna: raw-source warming alone still lets ships
appear late. Prepare complete colored/decoded hulls before their consumers mount,
using only the existing serial paint queue and cache. Pin at most twelve unique
current/imminent variants per game owner; release preparation pins on transitions
and unmount, preserving active consumer pins. No simulation waiting or hiding.

Additional explicit request at 22:43 Vienna: hull and engine flames must arrive
together; flames must not be visible before their associated hull source loads.
Bounded source preparation using the existing cache and a source-readiness flame
guard are authorized. No simulation wait, preparation overlay, field hiding,
slower arrivals/shooting or full-campaign resource preloading.

Additional explicit request after private testing at 22:35 Vienna: fix player
explosion at a boundary without a real collision. A width-based circular boss
contact extending below its rendered height is confirmed; correcting that false
boss contact is authorized. Do not remove legitimate projectile/enemy damage.

The user withdrew the earlier experimental corrections. Start from the verified
official Testnet commit 1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220.
Preserve its sizes, formations, player area, entry timing, HUD, graphics, sound,
combat timing and economy. Do not import the withdrawn PR 160/161 packages.
Only stability/resource-lifetime corrections are authorized, plus the explicitly
reaffirmed requirement that floating combat power-ups originate from defeated
enemy ships rather than elapsed time. Keep existing drop probabilities and timers.
Do not slow shooting, simulation, visual updates or normal arrivals. Do not add
preparation overlays or a new quality/particle reduction system.
Public release remains blocked until verified database backup and isolated restore
evidence, a dated source rollback point, and explicit user release approval exist.

The user confirmed IMG_5288.jpeg on 12 October 2026 as the original visual reference. This task authorizes stability fixes only.

Explicit movement correction requested on 12 October after testing: resting normal Testnet enemies should slowly sway back and forth, including restored formations; keep the existing sway amplitude/rhythm, and make normal formation arrivals 10% longer. This narrow authorization supersedes the frozen-motion rule below for these two corrections only. Boss escorts, attack paths, weapons, HUD, markers, sounds and Mainnet retain their prior behavior.

- Do not change the appearance or layout of any game page, menu, header, ship, weapon, explosion, background, card or control.
- Keep the compact original HUD: Home, hearts, Level, Shards above Score in the center, Block, Pause, all in one row. Do not enlarge the occupied game area.
- Enemy positioning markers remain invisible. Preserve all existing entry, attack, regroup and sector formations.
- Keep the current official simulation timing, mobile paint behavior, damage, weapons, power-up timers, speed, difficulty, rewards, economy and recovery semantics.
- Do not change sounds, music, samples, pitch, volume or truncate simultaneous effects. Resource cleanup may release nodes after they finish or during the existing pause/close lifecycle.
- Limit changes to resource lifetime, redundant work, controlled error recovery and bounded diagnostics. No new visual quality governor or particle/texture/explosion reductions.
- The approved Testnet baseline is codex/testnet-campaign-variety-20261011 at 21eb4b2151b9e5cb5b1f32f3e78d666bb860fdb1, not main at 907d2a7. Preserve its compact hudDepth.css, hidden Testnet marker DOM, fast combatTiming, formations, retained falling pickups, class sounds and existing boss budget. Apply stability corrections to this baseline.
- Isolated previews must use the approved production styles without a separate HUD or marker override. Restore the original fonts. Account/API/purchase/durable-reward isolation is test scaffolding only.
- No main merge, Testnet or game production deployment without the user's explicit release instruction.
