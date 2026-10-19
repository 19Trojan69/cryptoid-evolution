# Isolated reactor rendering correction — 19 October 2026

Public Testnet remains Canvas source 66eb357; Mainnet is unchanged. This change
is a preview candidate, not a demonstrated fix for the iPhone whitescreen.

## Confirmed redundant work

After all turrets are destroyed, `drawBossWeapons` paints only the fixed socket
layer and static wreck marks. Aim, heat, recoil, muzzle flash, weapon clock and
hull position cannot change those local pixels. Nevertheless the old component
clears and repaints the whole weapon surface on every scene commit.

The component now retains that final drawing, invalidating it on config/image
identity, logical/pixel size or context changes. Live guns always use the original
renderer. A restored context triggers a repaint even while props are unchanged;
a missing context is never recorded as a successful drawing. Existing surface
and heat-tile disposal remains intact. No artwork, combat, audio or timing changes.

## Verification

`node --expose-gc --experimental-strip-types scripts/verifyBossWeaponStaticPixels.mjs`
passed 3,000 strict RGBA comparisons against f5e8a47: all 50 bosses, DPR
1/1.5/2/2.625/3, live/heat/recoil/flash, last turret, reactor, movement, frozen
falling hull, fractional/pixel resize, restored live turret, context loss/restore,
null-context retry and new config identity. There is no tolerance or assertion
bypass. At boss 2, 2,000 subsequent reactor frames cause zero additional clears,
draws or dimension assignments (old component: 2,000 clears).

The same test against f5e8a47 as the candidate fails its no-redraw assertion.
All visible/base/heat canvases receive zero-dimension release assignments and
context listeners are removed on unmount. The native raster library substitutes
its default size for zero; the host records release assignments, not physical
native memory reclamation.

## Limits and other findings

Native raster tests are not Safari, Pi Browser, iPhone GPU or process-memory
measurements. No physical-device crash reproduction or verified complete fix.
Music uses one media element/context and does not change tracks when the final
turret dies. This does not exclude an audio-related native failure.

Starfield has one shooting star and at most one flare plus one scheduled timer.
The flare is unmounted on pause and cleans timer/listeners/observer. No growing
collection is evident there. Full-view star SVGs, large blurred background layers,
reactor hull images/clips and boss weapon surfaces are not fully represented by
the existing CanvasEffects resource byte estimates. Those estimates cannot
establish total WebKit/GPU/process memory or rule out native resource pressure.
