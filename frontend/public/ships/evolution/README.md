# Cryptoid Evolution player fleet

This folder holds 20 ship families, each with three transparent 282 × 282 RGBA PNGs:
`ship_01_stage_1.png` through `ship_20_stage_3.png`. `fleet_overview.webp`
shows the families side by side. Indices 01–20 correspond directly to sprite
indices 0–19 in `frontend/src/pages/shipFleet.ts` and the 40 Pi upgrade offers
in `backend/src/hangarCatalog.ts`.

Stage 1 preserves the original playable ship pixels from the existing
`frontend/public/ships/cryptoid-fleet.png` atlas, with only unrelated fragments
from neighboring atlas cells removed. Some original hulls have painted accents;
they remain in the source file to honor the original artwork. The existing
runtime paint pass provides the silver display option. Advanced and Elite were
edited separately from each family's own source art and packaged at the same
visual size and orientation as the original.

The PNGs contain no long thrust animation. Flame placement still uses the
ship-specific nozzle anchors in `shipFleet.ts`. Weapon patterns, collision
rules, paid inventory, and hull/paint purchases are separate from these assets.
Stage 2 and Stage 3 are permanent Pi unlocks; Stage 3 requires Stage 2.
