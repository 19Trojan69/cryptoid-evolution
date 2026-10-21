# Step 3 — boss reflection and alpha-mask inspection

Audit of official runtime `171cb5c4507a1530a9bbb080d61805be0da545f7`
after the completed reactor-door release. No game runtime files change; the
additional script is an isolated local diagnostic, not a production fixture.
Completed release receipt: `65e05fd340febf8d04cb4e9d95cfc4571abd10b5` on
`codex/reactor-door-reuse-release-record-20261021`.

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
`boss-reflection-audit-20261021/logic-tests.txt`. These are logic checks,
not browser paint/GPU measurements.

The additional native diagnostic bundles the actual BossHullView and production
CSS; unrelated weapon/reactor/health/damage children are stubbed and engine
animation is disabled only inside the isolated fixture. It compares zero-light,
display:none prototype and .65-lit states for bosses 1, 2 and 50 at widths
320/430/820, with 30 actual moving-parent React updates per state (27 cases).
The display:none alternative is a hypothesis under test, never shipped code.

The first LayerTree attempt returned no events/layers even for visible content.
That stream cannot establish zero extra paints or zero allocated graphics
memory. The later capture explicitly adds a visible image positive control and
reports capability availability separately. The initial strict prototype PNG
comparison also failed; preserve that failed output rather than calling it a
visual pass. Exact decoded RGBA and capability findings from the completed
capture are recorded in `native.json` and `native-summary.txt`. No pixel
tolerance is used. The native diagnostic exits nonzero if no useful resource
measurement is available or the prototype pixels differ. This is a deliberately
inconclusive resource audit, not a failed production game test.

Completed capture: all 27 structural/state cases and 810 moving updates finish
without page errors; unmount leaves zero reflection nodes. All nine lit-image
positive controls visibly differ from zero-light images. The LayerTree event
count is still zero, so resource measurement is unavailable. None of the nine
zero-vs-hidden decoded RGBA pairs is exact: 1,513–36,066 pixels differ, with
per-channel maxima of 1–3 RGB levels and identical alpha. The precise source of
those small-channel differences is not established; do not infer that the
production image is wrong. The prototype does not meet the unchanged-image
criterion, and no resource reduction is demonstrated. It is therefore rejected
for implementation/publication. The audit's status is explicitly inconclusive,
with exit code 2; no apparent zero counter is counted as a saving.

Before selecting a third optimisation, obtain an available native mask/surface
lifetime during zero-light intervals and the first lit frame after repeated
flash cycles. Any proposed change must preserve the original gradient, blend,
mask, spatial falloff and flash timing, and demonstrate a useful reduction.
Avoid mounting/unmounting the entire effect on every shot without checking
first-frame behaviour. This audit deliberately makes no speculative visual or
runtime change. Testnet stays on 171cb5c; Mainnet remains untouched. Automatic
deployment is disabled for `codex/boss-reflection-audit-20261021`.
