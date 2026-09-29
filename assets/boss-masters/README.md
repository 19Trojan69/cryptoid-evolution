# Cryptoid Evolution boss masters

This directory contains **50 separate, transparent PNG master assets**. `boss_01.png` belongs to level 10, `boss_02.png` to level 20, and so on through `boss_50.png` at level 500. The assets are deliberately outside `frontend/public`: they are prepared source art and are **not loaded by the game or copied into its current production build**.

## Art direction

- Direct overhead view; bow points toward the bottom of the file, engine stern toward the top.
- Every construction has a distinct architecture and a left-right mirror-symmetric layout. The ships are substantially wider than their front-to-back depth.
- Master palette: pale silver and royal-purple armor, restrained gold edges, dark gunmetal machinery. Cyan/blue reactors, conduits, technical lights and nozzle interiors stay cyan/blue in future color skins.
- Empty transparent background. Barrels and engine openings are part of the hull; firing, exhaust flames, shields and explosions are separate future effects.
- No text, numbers, Pi/coin imagery or logos on the hulls.

The individual architecture, intended weapon layout and intended main-engine count are recorded in [`../../doc/boss-fleet-design.json`](../../doc/boss-fleet-design.json). [`manifest.json`](manifest.json) records each file's exact pixel dimensions, visible alpha bounds and SHA-256 checksum. A labeled contact sheet is at [`../../doc/assets/boss-fleet-overview.jpg`](../../doc/assets/boss-fleet-overview.jpg); it does not replace the 50 masters.

## Future integration

Review each sprite at its intended in-game scale before setting position, hitbox, HP, weapon and flame anchors, attack patterns, shield and explosion geometry. None of those gameplay values are assigned here. Future skin work must preserve cyan/blue energy pixels instead of applying a whole-image hue shift. Keep every boss as its own asset rather than composing a runtime sprite sheet.

All artwork in this directory was generated as individual transparent-image requests. The shared production prompt required photorealistic hard-surface CGI, a panoramic shallow top-down hull, strict bilateral symmetry, visible unmuzzled weapons and two to six separate rear nozzle openings, the fixed silver/purple/gold/cyan palette, and no background, markings, projectiles or flames. Each request additionally specified the independent geometry and armament in the design plan; corrective requests targeted framing, silhouette and nozzle count where necessary.
