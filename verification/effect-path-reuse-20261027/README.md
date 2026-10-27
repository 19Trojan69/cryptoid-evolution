# Local path reuse verification

See docs/effect-path-reuse-20261027 for scope and limitations. None of these
fixtures, globals or baseline exports is an application route or production hook.

With normal frontend dependencies, the unchanged generated hull catalogue,
native WebKit2336/WPE and its local Ubuntu libraries available:

```
npm --prefix frontend run test:effect-paths
node --experimental-strip-types verification/effect-path-reuse-20261027/verify-raster.mjs
node verification/effect-path-reuse-20261027/verify-native.mjs
```

The raster verifier pins 3588ff2 and compares actual before/after React components
with native raster drawing. The WPE verifier pins only the original CanvasEffects
module, compares exact native RGBA and actual frame-time path/clip counts, then
exercises the real mounted layer through pause/resume/context loss/unmount.

The node host supplies controlled resource loading/clock/hooks. Browser time and
resources are locally controlled. There are no live account, API, payment or
save mutations and no physical-device measurements. Cache/ownership counters
do not prove native RSS/GPU memory release. Do not count the rejected Home
experiment or dependency/setup failures as acceptance passes.

Only sanitized text sources and result JSON should be committed. Generated
browsers, libraries, fonts, registries, caches and PNGs remain local.
