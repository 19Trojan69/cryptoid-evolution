# Reuse fixed explosion outlines

Continue from common public 3588ff2d0d39779e54c3a9b31eba636e81559c93 / PR180,
tree 243322ba9ef2459af518017e2d008215c5fba46f. The owner asks to continue reducing
avoidable smartphone work. Preserve the previous idle-loop, projectile and
Home-preview fixes; do not reimplement them.

## Accepted change

Ordinary explosion/shatter fragments repeatedly built the same polygon in the
Canvas context on every visible frame. The existing mounted draw record now
owns one native Path2D per fragment, constructed from the same original local
vertices and size at registration. Drawing reuses that outline with the exact
existing frame translation, rotation, scale and clipping order. Fragment
counts, shapes, flight, easing, opacity, images, fire/smoke and lifetimes stay.

There is no global path cache, new image, texture, canvas, RAF, timer, observer,
request or resolution change. The extra native outline objects belong only to
existing live draw records; record replacement/removal/context loss/unmount
retire their references. Preparing or using the existing raster resources and
their memory limits is unchanged. No process-memory or garbage-collection
measurement is claimed.

Path2D is optional. If absent or construction fails, the complete original
per-frame polygon path remains available. Existing Canvas context-loss handling
still clears records/resources and restores the original DOM fallback. Actual
registration rather than a global constructor hook is the production boundary.
The four exact CanvasEffects changes are recorded in results/scope.json.

This use of retained paths follows the Canvas specification, including applying
the current transformation when clipping a supplied path:
https://html.spec.whatwg.org/multipage/canvas.html#path2d-objects.

## Evidence

- 386 normal frontend release cases, localization, TypeScript and Vite pass.
  Five new cases exercise exact vertices, unavailable/failed path preparation,
  the real mounted effect through drawing/pause/resize, original fallback and
  context-loss/unmount cleanup. Native Canvas integration is used where relevant.
- 275 exact native raster comparisons against 3588ff2 pass across five DPR inputs,
  animation ages, center/edge/fractional positions, concurrent impacts and idle
  reuse/release. Surface dimension writes are identical. These are CPU-raster
  comparisons, not physical Safari/GPU or thermal observations.
- Native WPE/WebKit26.5 passes nine focused checks, including 36 exact RGBA pairs
  at densities 1 and 1.5 with real original assets, four/eight fragments and all
  original clips retained. In that sample, repeated default-path commands fall
  from 1640 to 0 while 164 fragment clips still execute. One-time path preparation
  is outside those frame-time counters; this is not total CPU or energy saved.
- The real React Canvas layer keeps its paths through frames, preserves a
  five-second pause and explicit resume, restores DOM fallback after context
  loss, and releases records/raster caches on unmount. No page errors occur.
- Changed-module lint adds no findings. The helper is clean; CanvasEffects
  retains 21 existing errors. GamePage remains byte-identical to 3588ff2 with its
  existing 62 errors/four warnings. No whole-game lint-clean claim.
- Backend runtime is byte-identical to the public base. Its 127-case/TypeScript
  acceptance is retained baseline evidence, not a newly repeated backend suite.
  Game controller, guarded loop, saving, audio, HUD/CSS, fleet and boss rendering
  also stay byte-identical. The original catalogue remains 1740 PNGs / revision
  1b15fbaa3ceac2fbf7b7; no asset/generator input changes.

## Excluded work and local preparation

A separate attempt reused the fixed Earth-network cutout. Eleven of twelve
moving WebKit sample images matched; one did not. That attempt is rejected and
HomeEarthNetwork is restored exactly to 3588ff2. See the retained rejected-home-
comparison.json. No cause, acceptable visual delta or thermal benefit is inferred;
do not repeat this experiment as an accepted rendering correction.

The first native host logged a dependency-scan warning for its virtual baseline
module; explicit local pre-bundling fixes that fixture configuration. Earlier
isolated raster startup attempts could not resolve dependencies after old scratch
links disappeared. Dependencies were restored from the existing package manifest.
An npm-ci attempt had no npm lockfile; normal installation succeeded. Incidental
yarn-lock/generated-manifest changes are excluded. WebKit itself downloaded;
the auxiliary FFmpeg download/lock failed, so existing native WebKit/WPE was
used with locally restored signed Ubuntu libraries. Final checks complete and
do not rely on FFmpeg. None of these setup failures is a game failure or pass.

The narrow accepted result removes redundant work during original explosions.
Physical smartphone temperature/energy, long-run Pi/iPhone stability and the
historical White Screen remain unproved. No new owner test campaign is required.

## Release

Candidate codex/effect-path-reuse-20261027 has automatic deployments disabled.
The reviewed same-source publication to both existing projects remains authorized.
Preserve 3588ff2 at backup/shared-before-effect-paths-20261027 and prior READY
Testnet Esrjvchy43uW9hva84trp2B3BYXY / production CuaDcrdz9uuZJtuYKAtVSc8kNrzc.
Record actual source/tree, READY active aliases and public code/API checks after
publication. Network/account/payment settings stay separate. No reset/migration,
economy change, PR167/168, secret/protection change or runtime-log access.
