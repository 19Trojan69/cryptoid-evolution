# Pi explosion investigation — focused fragment bounds comparison

The user's v4 Pi report completed in 68124 ms. Original / will-change / original
delivered 26.06 / 26.83 / 26.07 FPS, with accepted time 70.39 / 70.83 / 70.65%.
Salvos were 43 / 44 / 44. This provides no material resolution of the slowdown.
All 36 sampled effect rectangles intersected the viewport, fire opacity was
positive, and animations were running with data-effects-paused=false. The
middle phase applied the hint correctly. Cache stayed 13 / 4804555 bytes and
diagnostic sample cost maxed at 2 ms. These are style/layout observations, not
proof of actual presented pixels. No separate visual observation accompanied
this run. Phase summaries are preserved in device-replay-v4-pi-phase-summary.json.

## v5 experiment

Each original scattered fragment occupies a full hull-sized element clipped to
one polygon cell, containing a full-resolution painted hull. v5 additionally
computes the cell-local polygon and bounds just that element to its cell. The
child remains the original full-sized hull, offset by the cell's position. The
new element's center is the original fragment's transform pivot; its unchanged
animation applies the same translation, rotation and scaling. Four-part fields
thus use quarter-area fragment boxes; eight-part fields use eighth-area boxes.
The CSS applies only in the middle private comparison phase, to normal
explosion/shatter fragments. Fire, smoke, images, fragments, sounds, simulation,
34 ms cap and mobile paint cadence remain the originals.

This is a geometry/resource-work experiment, not a demonstrated Pi fix. The
v4 result did not isolate clip-path rasterization from other effect work. Hull
illumination uses a masked screen-blend layer, audio and other destruction work
also remain possible contributors. They are not disabled by this comparison.

The original GamePage source is still byte-identical to commit 27d1747 with
SHA256 eb628a5d73247ea64ec5443d2ff4efdab071a97228634f16f2aa915cdc832607.
The build adds preview-only CSS variables to its bundled copy and exposes the
same debris renderer for a frozen side-by-side diagnostic. No production source
or stylesheet is changed. A post-build check verifies the original source hash.

## Verification

- Eleven startup/controller/sampling/geometry tests pass. The geometry test
  reconstructs all eight vertices in each of 4/8/16 cells, checks five rotation
  angles at three scales with translation, and verifies image and pivot
  coordinates within 1e-10 normalized units.
- Real simulation integration (presentation/audio stubbed) yields identical
  results in all three phases: 122 deaths / 62 salvos at 16 ms steps, and
  80 deaths / 42 salvos at 50 ms. This is fixture equivalence, not FPS evidence.
- Actual Chrome static comparison uses the same real debris renderer, painted
  hull, seeded fragments, and paused 0.35 / 0.9 / 1.6-second animation states.
  Original/cropped fields retain 4 / 8 / 4 parts. Hull children stay 72 px;
  fragment widths change from 72 to 36 / 18 / 36 px as intended.
- The captured comparison is device-replay-v5-geometry.jpg. Geometric shape and
  motion agree visually. The screenshot is not pixel-identical: mean absolute
  RGB channel differences per 340x225 stage pair are .1597 / .0800 / .0221
  out of 255. Pixels differing by over 10 in any channel are 381 / 149 / 29
  out of 76500. Rasterization/antialiasing differences remain a practical limit
  of the change; do not claim identical pixels or independently verified iOS
  appearance from this Chrome image.

## Private deployment

Preview dpl_HUDYbCueQFtoRmyygPNBbBvDatTA is READY, target null, aliases empty.
Host: cryptoid-evolution-testnet-j7j0g22eh-19-trojan69.vercel.app.
Its deployment-scoped share expires 2026-10-19T10:14:52Z. No share token is saved
here. Public Testnet and main aliases are not reassigned by this experiment.
The device comparison takes 68 seconds (8-second warmup, 20-second
original/cropped/original destruction phases). The same account/API isolation
as v4 applies. A real Pi result is still required before claiming improvement.

## Actual final Chrome run

Completed in 68049.8 ms, issues and blocked requests empty. Original / cropped /
original delivered 56.06 / 58.26 / 59.31 FPS, accepted time .9896 / .9919 / .9992,
and 61 / 61 / 62 salvos. Deaths were 120 / 120 / 122, max effects 18 throughout.
The middle phase alone computed 25 / 36 px fragment widths, compared with the
original 50 / 72 px. Sampling max costs were 2.5 / 3 / 2 ms. The temporary mode
attribute was removed after completion. Download matches the visible JSON;
copy reached “Bericht kopiert”. Raw report and final UI screenshot are retained.

The static geometry proof was visited before this run, so its extra prepared
hull may remain cached. All phases share that cache. Original-after is faster
than cropped; do not interpret this one Chrome run as a measured performance
win. The actual Pi result is pending.
