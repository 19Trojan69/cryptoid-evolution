# Preserve the officially approved game

The user confirmed IMG_5288.jpeg on 12 October 2026 as the original visual reference. This task authorizes stability fixes only.

Explicit movement correction requested on 12 October after testing: resting normal Testnet enemies should slowly sway back and forth, including restored formations; keep the existing sway amplitude/rhythm, and make normal formation arrivals 10% longer. This narrow authorization supersedes the frozen-motion rule below for these two corrections only. Boss escorts, attack paths, weapons, HUD, markers, sounds and Mainnet retain their prior behavior.

Later private-device feedback on 12 October explicitly authorizes these additional narrow corrections: new floating power-ups only after a ship is shot down; enemy arrivals at 75% of the speed of the previously tested (already 10%-extended) build; Boss escort graphics 25% larger, preserving physics radii. Prepare/decode the original full-quality resources before showing engines/hulls, protect game timers while loading, and optimize redundant work without changing the finished graphics, audio or combat. These latest instructions supersede the earlier fixed-arrival/escort-size rules only within that scope. Public Testnet/Mainnet release still requires separate explicit approval and verified database backup/restore.

- Do not change the appearance or layout of any game page, menu, header, ship, weapon, explosion, background, card or control.
- Keep the compact original HUD: Home, hearts, Level, Shards above Score in the center, Block, Pause, all in one row. Do not enlarge the occupied game area.
- Enemy positioning markers remain invisible. Preserve all existing entry, attack, regroup and sector formations.
- Keep the current official simulation timing, mobile paint behavior, damage, weapons, power-up timers, speed, difficulty, rewards, economy and recovery semantics.
- Do not change sounds, music, samples, pitch, volume or truncate simultaneous effects. Resource cleanup may release nodes after they finish or during the existing pause/close lifecycle.
- Limit changes to resource lifetime, redundant work, controlled error recovery and bounded diagnostics. No new visual quality governor or particle/texture/explosion reductions.
- The approved Testnet baseline is codex/testnet-campaign-variety-20261011 at 21eb4b2151b9e5cb5b1f32f3e78d666bb860fdb1, not main at 907d2a7. Preserve its compact hudDepth.css, hidden Testnet marker DOM, fast combatTiming, formations, retained falling pickups, class sounds and existing boss budget. Apply stability corrections to this baseline.
- Isolated previews must use the approved production styles without a separate HUD or marker override. Restore the original fonts. Account/API/purchase/durable-reward isolation is test scaffolding only.
- No main merge, Testnet or game production deployment without the user's explicit release instruction.
