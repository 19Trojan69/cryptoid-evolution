# Full-effects Canvas candidate — 18 October 2026

Pi v7 reproduces 23.77 / 38.22 / 36.22 / 55.32 / 22.55 FPS for full,
fire/smoke-only, debris-only, empty wrapper and full again. Both original visual
subtrees contribute. This motivates a preserving renderer candidate rather than
a visual/audio omission or a change to the simulation clock.

## Candidate boundary

The private v8 builder substitutes only normal colored explosion/shatter
presentation. Original game, audio and stylesheet files remain byte-for-byte
unchanged. Other effect types, hull illumination, shot collisions, rewards,
simulation effects/lifetime, haptics, all original audio, mobile game paint
cadence and the 34 ms cap remain in the existing implementation. No API,
account, inventory or scored run is accessible in this preview.

One DPR-sized Canvas is placed at the original effect layer inside the existing
clipped game field. Normal effects register their original positions and use
the exact seeded JSX fragment polygons, pivots, delay, trajectory and spin.
Full-resolution original prepared hull images are drawn with the original child
rotation and polygon clipping. Four/eight pieces remain four/eight pieces;
source images are not downsampled or repainted with a new material.

The builder extracts the original fire/smoke gradients, insets, rounded corners
and blur values from the existing stylesheet. Static SVGs flatten these into
reusable textures before the comparison phase. Textures are prepared at 1.5×
DPR to cover their maximum animated scale. SVG straight-alpha gradients use
dense premultiplied-sRGBA stops to approximate the original CSS interpolation.
Color/edge rasterization is not asserted pixel-identical across renderers.

The CSS fire/smoke keyframes and fragment property tracks are evaluated with
the original easing functions and durations. Display animation uses wall time
from mount, like CSS animation, rather than the capped simulation clock.
The shared draw scheduler pauses with the existing effects-paused attribute.
No React state is set per display frame. Pending preparation retains the
original DOM fallback; failures and fallback mounts are recorded.

## Resources and cleanup

Hull decode requests deduplicate in an eight-entry cache, with a 32 MiB decoded
byte guard. Static textures deduplicate in a sixteen-entry / 16 MiB cache,
including reserved pending allocations. These limits cause the original
display fallback, not a visual omission. They are sufficient for this fixed
sector-12 experiment; later campaign variants are not claimed covered.

One draw frame serves the active registered effects. Work samples retain at
most 512 durations; four DOM samples per phase verify the selected path.
At finish/abort the scheduler stops, registrations and decoded references are
cleared, texture backing stores and the display backing store become zero.
Generation guards prevent late async decode completion from refilling cleared
caches. The report includes the immediate cleanup state.

## Verification

- Sixteen unit/startup/controller/geometry tests pass. Real GamePage simulation
  integration at 16/50 ms steps retains 42/29 measured salvos per phase and the
  original .68 accepted ratio at 50 ms. Presentation/audio are stubbed there.
- The actual candidate module, with mocked browser allocation/decoding,
  verifies abort during pending preparation, rejection of stale completions,
  release of completed texture backing stores, and zero scheduler/cache state.
- Frozen Chrome comparisons at 180, 650 and 1600 ms cover four/eight fragments.
  Canvas and original positions, silhouettes and timing appear close. Compared
  with the original computed CSS, maximum alpha error is below 0.0000005 and
  maximum matrix entry error below 0.000072, including fragment transforms.
- The retained JPEG screenshot is not a lossless image test. Full-stage mean
  absolute RGB-channel differences are .307 / .281 / .044 out of 255; .523 /
  .305 / .073% of stage pixels differ by more than 15 in any channel. This is
  evidence of close correspondence, not exact pixel equality or a Pi result.
- Actual final Chrome completes in 53049.4 ms with no issues, blocked requests,
  emergency resets, renderer failures or fallback mounts. Original/Canvas/
  original FPS is 58.98 / 59.79 / 56.68; accepted time .9953 / .9988 / .9917.
  All phases deliver 42 measured salvos and 90 real deaths. Desktop Chrome is
  not the Pi reproduction, so this does not establish a device improvement.
- Canvas phase records 11,204 complete effect draws and 44,816 original-piece
  draws, four pieces per normal fixture effect. All four middle samples have
  active Canvas records/proxies and zero original normal-effect DOM fallbacks.
  The separate frozen proof covers the eight-piece heavy case.
- Shared Canvas draw work p95 is .5 ms. Four static texture preparations remain
  four throughout all phases. Eight image references use 2,544,768 estimated
  decoded bytes, textures 515,052 bytes and the desktop surface 5,103,072 bytes.
  The final cleanup report has no active draw frame or registrations and zero
  image/texture entries, cache bytes and surface bytes.
- Downloaded JSON exactly matches the visible report. Compact copy is 9,891
  characters and the control reaches “Bericht kopiert”; cloud clipboard payload
  equality is not claimed. Raw final browser report and screenshot are retained.

## Limits and next decision

This remains a private renderer candidate. Pi performance and user-visible
correspondence need the device comparison; desktop Chrome does not reproduce
the original severe Pi slowdown. No production release or complete campaign
claim follows from the fixed-sector test. Interleaving with boss/player effects,
campaign-wide cache coverage and normal pause/recovery still need verification
before this could be considered for a game release.

Technical references used for the translation:
- https://www.w3.org/TR/css-images-3/
- https://www.w3.org/TR/css-backgrounds-3/
- https://www.w3.org/TR/SVG/latest/pservers.html
- https://www.w3.org/TR/css-animations/

## Deployment

Final preview dpl_6pU6GafDWLN5zPjN4D6GUz7Hp5Hj is READY, target null, aliases
empty. Host: cryptoid-evolution-testnet-by0h25b03-19-trojan69.vercel.app.
The scoped share expires 2026-10-19T11:32:52Z. Its token is not stored in Git.

Read-only checks retain public Testnet dpl_BX7ZeCr9Qr6anBa3AZnzLERubpQM
(27d1747) and main dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe (907d2a7).
