# Cryptoid Evolution boss fleet

The campaign has 50 levels. Each level has nine ordinary sectors of three
rounds, followed by its boss as the tenth sector and then one bonus round.
The game tracks a global sector number: boss 01 is global sector 10, boss 02
is global sector 20, and boss 50 is global sector 500. After the bonus round,
the next campaign level starts at sector 1 of its ten-sector group.

The 50 independent, symmetric source designs are in `assets/boss-masters/`.
Each optimized transparent WebP is in `frontend/public/ships/bosses/`. The
original PNG masters remain available for future recoloring. Cyan energy
details are part of the image and should never be recolored by a whole-image
hue filter.

Rebuild the individual game files with `python frontend/scripts/optimize-boss-assets.py`.
The script keeps the PNG masters and removes tiny alpha noise in the clear
corners. Rebuild the manifest afterwards, since alpha masks depend on WebPs.

`frontend/src/pages/bossManifest.ts` assigns the art, engine mouths, muzzle
positions, damage sites, size, projectiles, and explosion settings for every
ship. `bossMasks.ts` contains compact alpha coverage for hit detection. Both
are generated from the individual WebPs with:

```sh
python frontend/scripts/build-boss-manifest.py
```

When replacing a boss image, inspect the resulting engine and weapon anchors
against that image. Dark engine openings for bosses 01, 05, 06 and a few
visually ambiguous groups are documented as overrides in the generator.
Damage and hit effects use the same alpha silhouette as the rendered WebP;
only the final destruction sequence extends beyond it.

The combat code is in `sectorBoss.ts`, `bossCombat.ts`, `enemyFire.ts` and
`GamePage.tsx`. The bonus and nine-block chain balance is in
`bonusChallenge.ts` and `networkChain.ts`. Normal enemy and player sprites
remain on their previous paths.
