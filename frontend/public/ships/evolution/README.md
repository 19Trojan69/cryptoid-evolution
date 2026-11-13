# Cryptoid Evolution player fleet

This folder holds the Standard sprites and the Advanced and Elite sprites in
`liveries/`. Each of the 20 families uses transparent 282 × 282 RGBA PNGs.
`fleet_overview.webp`
shows the families side by side. Indices 01–20 correspond directly to sprite
indices 0–19 in `frontend/src/pages/shipFleet.ts` and the 40 Pi upgrade offers
in `backend/src/hangarCatalog.ts`.

Stage 1 preserves the original playable ship pixels from the existing
`frontend/public/ships/cryptoid-fleet.png` atlas, with only unrelated fragments
from neighboring atlas cells removed. Its original livery supplies the armor
and marking colors for Advanced and Elite. The higher stages retain their own
geometry, glass and equipment lights. The Shop, Hangar, player fleet and ship NFT cards all show these fixed liveries.
The Pi Vanguard Metallic Edition uses the three separate `ship_19_stage_*_metallic.png`
sprites, extracted from the approved gold and violet comparison art. The game
uses their painted colors directly and aligns engine effects to their outlets.

The PNGs contain no long thrust animation. Flame placement still uses the
ship-specific nozzle anchors in `shipFleet.ts`. Weapon patterns, collision
rules, paid inventory, and hull/paint purchases are separate from these assets.
Stage 2 and Stage 3 are permanent Pi unlocks; Stage 3 requires Stage 2.
