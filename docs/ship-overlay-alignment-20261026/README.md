# Ship indicators, engine outlets and manual completion

Start from common public source 4ec0683196177e5045f15ab1798b22ba21dfb8dd,
tree cebab6ff471a08eef4e3b16aa87af971a0a93a15. The owner asks for ordinary ship
integrity bars 50% smaller/shorter, closer to and centered on the associated
visible hull, better engine alignment with one plume appearance, and no ten-second
reading gate at unified completion. The later clarification explicitly preserves
all boss damage indicators. This overrides only the prior mandatory reading delay.

## Result

Ordinary enemy bars are exactly half the previous width and height: 34%/3px for
small/medium and 39%/4px for heavy/elite/large, with half border/glow dimensions.
Their center and upper attachment follow static visible alpha bounds of the
unchanged original hull, including the existing enemy rotation. A two-pixel gap
replaces the old offset above a much larger transparent image box. Boss hull and
turret indicators retain their component, positions, sizes, colors and CSS.

Static outlet measurements cover all 20 original models and all three evolution
stages. Both main drive outlets follow their model; the ring hull uses its single
central drive rather than two overlapping jets. The forked hull outlets were
visually calibrated to their drives rather than decorative fin tips. The angular
vanguard's outlets move inside its wings. Every live plume uses the same
white/cyan/blue gradient and silhouette. Existing thrust response and physical
outlet widths remain; the boss plume points upward through the same appearance.
There is no new game-time image scan, canvas, animation loop, timer or request.
Original images, sizes, actor positions, hitboxes and combat are unchanged.

Unified completion has no interval, visibility-reading accumulator, numeric
countdown or artificial reveal gate. The existing Continue button enables as soon
as preparation confirms the save/effect barrier. Its footer arrives immediately
with a brief finite animation instead of a delayed stagger. Save errors still
block it and expose Retry; readiness never automatically starts the next level.
Rewards and the controller are unchanged. The unused legacy standalone boss
component keeps its old helper for compatibility; it is not restored to the flow.

## Evidence

- 328 ordinary frontend release tests, TypeScript/Vite and changed leaf-module
  ESLint pass. The added build gate includes 37 hull/fleet/boss-layout cases,
  checking all 60 original image bounds/outlets, shared plume colors and exact
  published source hashes of GamePage and both boss indicator modules.
- Native WPE/WebKit 26.5 gallery: 70 checks, all 20 models at all three stages,
  consistent live plume appearance, exact half-size bars and closer placement
  against pinned 4ec0683. 38 native boss hull/turret bar geometries across four
  representative boss configurations match the release exactly; the unchanged
  layout tests cover all 50 bosses at three viewport sizes.
- Native actual-game flow: 53 checks, final-shot explosion and quiet outro,
  held successful weapon activation, save/effect barrier, immediate manual
  Continue, exact unchanged rewards, legacy bonus restore, failed save/Retry and
  final campaign victory. No ten-second clock advance is used to unlock Continue.
- The first flow fixture still assumed every freshly mounted completion must be
  disabled. A fast successful legacy save correctly enabled it immediately. The
  fixture now reads preparation and disabled state atomically; that failed
  assumption is retained separately, not counted as a runtime success.
- The early type check exposed the unused standalone boss component's dependency
  on its timing helper. Its legacy API stays intact and the unified view uses a
  separate readiness helper. The final full release build passes.

These are local controlled SDK/API/clock/combat setups and real compiled handlers
with isolated in-memory data and widened score time, not a physical Pi/iPhone
campaign, payment/account mutation or White Screen cure. Original hulls were
visually inspected in native renders. No repeat long owner campaign is required.
GamePage is byte-identical to 4ec0683, including strict >2500ms/500ms protection,
manual technical Resume, existing 62 ESLint errors/four warnings, save/reward
validation and the previous interrupted-audio/pending-activation corrections.
Backend, auth, audio code, economy and project network/payment settings are untouched.

A new private report describes a White Screen at manual Continue before visible
next-round combat. Its raw export remains private and is analyzed separately;
this UI release does not infer a native cause or claim to fix that interruption.

## Publication

Candidate codex/ship-overlay-alignment-20261026 has automatic deployment disabled.
Publish the reviewed same source to both existing projects under the owner's
continuing authorization, retaining separate account/network/payment environments.
Rollback is 4ec0683196177e5045f15ab1798b22ba21dfb8dd at
backup/shared-before-ship-overlay-20261026 and READY Testnet
DSpHhHrn6bjfmWarpHx88n2JzZde / production DchewrncL4vJzY4KwKz8ALWTzVdy.
Record delivered source/tree, identical public JS/CSS, API separation and READY
active aliases after release. Never read runtime logs/secrets or change protection.
