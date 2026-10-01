# 50 mounted boss weapon integration

Approved on 1 October 2026. Boss 01 remains the level 10 encounter, through Boss 50 at level 500. Original boss_N.webp files remain unchanged. The evolved folder contains 50 clean coloured hulls, 50 weapon atlases and 50 debris textures. This is layered 2.5D artwork, not true 3D models.

The new-to-original sequence is:
25,11,3,34,9,16,23,1,27,8,45,22,46,5,10,30,37,2,15,12,21,39,17,13,6,35,19,40,42,38,32,4,18,48,20,47,7,26,36,33,50,43,29,44,31,14,28,24,41,49.

This ranking estimates preview firepower, not measured game difficulty. Health, rewards, one-heart projectile damage, progression and escort limits retain existing rules. Actual combat timing now uses independent stations, aim gating and caliber-sensitive projectile size. The shared enemy projectile cap applies to boss and escorts; round-robin admission allows all guns and all barrels to participate. Multi-row rocket racks are released in separate aligned rows. Some small deck weapons on original 49 were interpreted from the artwork.

Each of the 392 stations turns toward the current player position. A station needs an angular error below .035 radians for 160 ms before firing. Shots retain their direction after launch. EMP freezes weapons, pause suspends simulation and audio, and destruction freezes the final gun orientations for the falling hull. Clean hulls prevent fixed original barrels beneath moving copies. The temporary texture-loading fallback is removed when the dynamic atlas is ready.

Six original procedural sound families (laser, pulse, plasma, heavy, siege and rocket) provide three cached caliber variants each. They share the game's effects volume and limiter. At most twenty voices remain active; pause and boss destruction stop voices. Audio failure does not stop combat.

## Validation

Production TypeScript/Vite build passed. All 108 Node tests passed, including all 392 stations and every barrel under a three-projectile phone cap, alignment gates, queued salvos, eighteen finite distinct sound buffers, voice budgeting, mute and pause. These are simulations, not real-device results.

All fifty integrated hulls and gun overlays were rendered using native Canvas through verify-boss-render.mjs. The full contact sheet and enlarged final boss were visually inspected. Real browser interaction, Pi Browser, smartphone performance and listening on actual speakers remain unverified. No confirmed live gameplay balance is claimed.

Generate inspection images with:
`node --experimental-strip-types frontend/scripts/verify-boss-render.mjs /tmp/boss-renders`

Importing artwork again requires the separately maintained authorized review directory, including manifest.json, cleaned hulls/masks, original art and baseline-game-bossManifest.ts. The import script defaults absent salvo row counts to one. The committed textures and generated configuration are sufficient for normal builds and gameplay.
