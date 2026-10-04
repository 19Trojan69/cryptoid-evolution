# Boss weapon and balance update — 2026-10-04

All 50 bosses keep the two-phase fight. Live turrets protect the hull, including against bombs. Each turret still awards its points exactly once.

- Turret damage is visible on the gun's own metal: dark red, orange, then white heat. The tint uses source-atop compositing of the original gun sprite, preserving the exact alpha mask. It adds no halo. Turret health bars, connector lines, counts and permanent phase messages are removed from combat.
- After the last turret explodes, a concealed weapon opens on the hull centreline. Each of the 50 hulls has a reviewed mount height, size, weapon shape and matching metal/energy finish. Shutters use the original hull texture. Five physical weapon constructions are used: rail lance, siege cannon, twin barrel, trident and fork emitter.
- Opening takes 900 ms of game time; the first shot retains the 1800 ms warning. Muzzles and simulation share mount geometry. Existing saved core timers still work.
- The exposed hull takes twice the damage per accepted hit, including bombs. It therefore needs half the previous effective hits. This also applies to remaining HP in existing saved fights without resetting them. Turret HP is unchanged.
- During the exposed phase, small escorts return after each completed wave. The wait after the last kill is 4000/3000/2000/1000/0 ms at displayed game levels 10/20/30/40/50. Level 50 means boss 5, not boss 50. Every subsequent level retains zero idle delay.
- Reserve wave size starts at two, becomes three at level 30 and four at 50, and caps at six from level 90. Ships enter in 360 ms steps, using existing entry, attack, projectile and enemy limits. No reserve wave overlaps living or pending escorts. EMP and pause stop progression; destroying the boss ends it.
- Existing saved escort timers, wave counters, spawned count and slots are reused. No save-format migration or player-progress reset is required.
- The guide shows both phases and lets players inspect all 50 bosses. All new explanatory copy is translated into the 17 supported languages.

Verification: 154 game tests; 22 localization checks; TypeScript and Vite production build. Tests cover all 50 mounts, projectile origins, half-duration hull damage, wave timing and save/resume, escort clearances at 320×568 / 390×760 / 1366×768. Raster compositing check confirms heat never changes sprite alpha.
