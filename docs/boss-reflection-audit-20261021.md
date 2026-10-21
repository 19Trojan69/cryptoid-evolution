# Step 3 — boss reflection and alpha-mask inspection

Read-only audit of official runtime `171cb5c4507a1530a9bbb080d61805be0da545f7`
after the completed reactor-door release. No runtime files change in this audit.

## Observed code

`frontend/src/pages/BossHullView.tsx` renders one `i.hull-reflection` in the
live-boss branch, with the same hull image as maskImage and WebkitMaskImage and
the current `light` as inline opacity. It remains mounted at zero opacity. The
live-only branch removes that element during the defeated hull's fall; it is
not accumulated per hit, shot, frame or boss. The main hull image and weapon
canvas retain their earlier lifetime policy independently.

`frontend/src/index.css` gives this layer a fixed gradient, alpha-mask sizing,
no repeated mask, and screen blending. Its own rule defines no animation,
transition, filter, will-change or backing canvas. Both the OS reduced-motion
preference and the existing html data-motion setting hide it with display:none.
The boss hull's permanent drop shadows and engine animations are separate
elements/rules and were not changed.

`hullIllumination` in `frontend/src/pages/shipRealism.ts` calculates a short
linear muzzle contribution, reaching zero after 115 ms. Nearby explosion,
shatter, player-explosion and delayed boss-explosion contributions last at most
360 ms from their effective start and decrease with distance. GamePage updates
the boss light in its existing simulation pass; both turret events and core
shots update the shared muzzle timestamp. There is no dedicated reflection
timer, RAF chain or image-generation cache. No-source cases return exactly zero.

The persistent damage alpha mask belongs to HullDamage and is distinct from
the short hull illumination. Its boss embers are already static, and its layer
returns null when there are neither sites nor a hit. This inspection does not
justify removing damage masks or reducing visible heat, hit bursts or glints.

## Result and next evidence boundary

The zero-opacity reflection mask is a possible resource-lifetime investigation
point, not a proven rendering cost, GPU allocation, memory leak or crash cause.
Browser culling, image sharing, compositor surfaces and WebKit resource
retirement cannot be deduced from the DOM or opacity alone. One mounted node
does not establish a growing resource count.

Five existing shipRealism tests pass, including local light falloff, extinguished
light and delayed boss illumination. Their output is stored in
`reactor-door-reuse-release-20261021/reflection-tests.txt`. These are logic checks,
not browser paint/GPU measurements.

Before selecting a third optimisation, compare the actual native mask/surface
lifetime during zero-light intervals and the first lit frame after repeated
flash cycles. Any proposed change must preserve the original gradient, blend,
mask, spatial falloff and flash timing, and demonstrate a useful reduction.
Avoid mounting/unmounting the entire effect on every shot without checking
first-frame behaviour. This audit deliberately makes no speculative visual or
runtime change. Testnet stays on 171cb5c; Mainnet remains untouched.
