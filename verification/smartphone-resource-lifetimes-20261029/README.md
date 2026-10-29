# Smartphone resource lifetime audit, 29 October 2026

The owner requests continued investigation while the physical complete-CSS-filter-off
control is still pending. This is a new offline analysis of existing synthetic Linux
captures and a focused review of unchanged resource owners. It adds no application
collector, native profiler, browser run, preview, setting or production change.
The owner reports intermittent iPhone and Android smartphone aborts, with tablet
and PC stable in their tests. These observations are preserved; a universal
smartphone failure and an exact cause have not been established.

`summarizeEvidence.mjs` verifies four existing compressed archives by exact size
and SHA256, plus twelve reviewed source files. It selects fourteen completed
recording-off controls and preserves twelve exclusions explicitly: eight failed
CSS-probe preparations, two recording-on runs whose final report step failed,
and two successful recording-on report checks outside this analysis. Their
original evidence and overall status are not rewritten.

The selected observations are two six-minute recording-off duration runs,
one-minute and six-minute Chromium heap-capture runs, eight CSS comparisons,
and two built-in-filter-preview verifications. Heap collection occurred only
after the active observation. None is a new physical-device or six-minute
filter-preview acceptance result. Unseeded workload and simulated progress
differ between captures, especially across browser engines.

## Observed resource counters

The fourteen captures contain 1,941 approximately one-second resource samples.
The following maxima are sampled values, not continuous peaks or total RAM.

| Captured resource subset | Observed result |
| --- | ---: |
| Registered decoded effect/synthesized sound buffers | Exactly 46 throughout every selected run |
| Their bytes, Chromium | Constant 6,925,568 B (about 6.60 MiB) |
| Their bytes, Linux WebKit | Constant 7,083,800 B (about 6.76 MiB) |
| Concurrent registered effect/weapon voices | At most 6 |
| Ordinary-impact image plus fire/smoke texture cache estimate | At most 1,059,028 B (about 1.01 MiB) |
| Ordinary-impact destination Canvas backing estimate | At most 79,728 B (about 0.076 MiB) |
| Cached ordinary-impact hull sources | At most 3 |
| Cached ordinary-impact fire/smoke textures | At most 2 |
| Registered ordinary-impact effects / retained distinct hull users | At most 1 / 1 |
| Captured audio-clock stalls / blocked sounds | 0 / 0 |

The effect sound-buffer counts and estimated bytes do not grow at all in these
observations. The ordinary-impact cache repeatedly reuses/evicts resources within
the observed small range. `hullLoads`, `hullEvictions`, `draws` and `fragmentDraws`
are cumulative work counters; increasing values are not retained-object counts.
There is no sampled accumulation in these particular resource owners that
explains the much larger Linux process footprint.

These counters do not cover all game images, boss source layers, SVG/CSS surfaces,
music/media decoding, browser image caches, compositor/driver allocations or
total native phone memory. Some logical estimates overlap browser accounting.
Do not subtract them from PSS or call a residual GPU memory or a leak. The code's
audio-byte diagnostic also excludes its separate rock-sound cache; all selected
reactor captures report zero rock buffers. Temperature is not measured. Short
peaks and retention inside a browser implementation remain possible.

## Reviewed ownership and failure handling

- `gameAudio.ts` reuses its effect context, decodes at most three compressed
  samples concurrently, tracks voices and releases them on native end or a real
  pause. Fallback reaping uses the advancing audio-clock deadline plus a second
  of grace. A stalled clock blocks further scheduling and coalesces recovery.
  Closing aborts pending fetches, disconnects nodes, closes the context and clears
  its sample maps. The twenty-entry hostile voice queue is not a total cap on
  simultaneously fading voices; that distinction is retained in this audit.
- `musicPlayback.ts` keeps one media element and its graph through source switches.
  Close clears its metadata listener/source, disconnects nodes and closes its
  context. The surrounding GamePage listener groups have matching cleanup.
  This source inspection is not a native media-decoder memory measurement.
- `CanvasEffects.tsx` protects preparing/mounted consumers, retains two unused
  hull sources, retires excess idle textures and zero-sizes retired Canvas
  textures/destination surfaces on complete cleanup. Its ready-source and texture
  guards are separate from browser-owned decoded-image memory.
- `bossWeaponRenderer.ts` owns per-destination source layers through a WeakMap.
  A turret replaces its old heat tile, and destruction/unmount zero-sizes source
  layers. `BossWeaponsView.tsx` removes both context listeners and disposes its
  destination on unmount. No new retained reference was found in this review.
- `paintedShip.ts` uses static asset URLs with a 24-entry / 12-MiB soft budget and
  at most six unused variants. Preparing/mounted pins may exceed a soft budget;
  it is not a hard total-RAM ceiling. Pending source requests are shared until
  settlement and are distinct from the ready LRU. Boss weapon textures keep two
  completed cache entries, while pending requests likewise live until settlement.
- `Starfield.tsx` clears its flare timer and removes its visibility/media-query
  listeners and MutationObserver on cleanup. Global CSS animation pacing releases
  its tracked animations on finish/cancel and its own shutdown; its sampled
  easing cache has 64 entries. Native event delivery on physical phones remains
  outside the controlled lifecycle host's proof.

This audit finds existing bounded ownership and cleanup for the inspected paths,
not proof that every allocation is bounded or that no platform-specific leak exists.
No speculative runtime patch is made.

## Verification

Thirty-one existing focused cases pass for native animation lifecycle, actual
effect audio, cache pins/eviction, texture-loader subscriber cleanup and actual
Canvas idle cleanup. Six existing audio-clock cases pass, including the old
2,086-silent-source negative control, missing-ended callbacks, delayed live notes,
real-pause cleanup and same-context recovery. These are controlled-host/source
checks; they are not physical iPhone/Android or native compositor tests.

The original test outputs are retained in `lifecycle-checks.log` and
`audio-clock-checks.log`; commands, counts and digests are in `checks.json`.
An independent Python read of the original archives confirms capture/sample
counts, sound-buffer constancy and all principal sampled maxima. Complete
frontend inventory and all 24 private runtime input pins also pass the unchanged
duration scope verifier. No complete frontend release build or new end-to-end
browser acceptance is claimed for this documentation/analysis change.

Reproduce the offline results with:

```
node verification/smartphone-resource-lifetimes-20261029/summarizeEvidence.mjs
node verification/boss2-return-duration-20261029/verifyScope.mjs
```

The protected device control remains source417cc1b and the same URL:
https://cryptoid-evolution-testnet-eb5f8lafa-19-trojan69.vercel.app/.
Recording stays off, test protection on, and the existing instruction is six
observed active minutes on the same affected smartphone/browser. No new full
report is expected with recording off. Its physical outcome remains pending.
The filter control deliberately changes diagnostic appearance; a White Screen
cause, production fix, campaign stability or heat/cache explanation is not
established. Public main, Testnet/Mainnet aliases, original game/audio/clocks,
single-finger controls, accounts and owner progress remain untouched.
