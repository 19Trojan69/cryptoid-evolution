# Canvas backing-store bounds — 18 October 2026

Pi v8 restores 41.08 FPS / 96.53% accepted simulation time with complete
effects, versus 23.17 / 23.43 FPS and about 68% for the original DOM display.
Residual presentation cost remains. CPU draw p95 is 1 ms but does not measure
GPU completion. The DPR-3 full-field Canvas is 12,771,000 bytes.

v9 tests whether limiting transparent backing-store area improves this result.
It does not reduce DPR, textures, source resolution, effect count, fragment
count, trajectories, timing, audio or illumination. Game, audio and stylesheet
source files retain their v8 SHA256 values.

## Boundary and comparison

After eight seconds of warmup, the same sector-12 real collision/refill fixture
runs full-field Canvas / bounded Canvas / full-field Canvas for fifteen seconds
each. The first 1500 ms of each phase is excluded from measurements, as in v8.

Each effect receives conservative bounds for its complete display lifetime.
Fire/smoke bounds include every keyframe's transformed texture rectangle and
the prepared blur padding. Positive scales and shared monotone easing keep
intermediate edges inside the keyframe envelope. Fragment bounds include the
whole original polygon radius about its pivot, at maximum scale, across the
complete translation. Arbitrary rotation cannot leave that radius envelope.
Integer CSS bounds and a two-CSS-pixel antialias margin preserve the DPR-1/3
pixel grid. Only the existing game field clips off-field pixels.

The middle phase grows the shared backing store when a new effect needs more
space. It does not shrink while effects remain active. This avoids resizing
every frame or tracking only a fragment's current position. Canvas origin
translation retains world coordinates; a ResizeObserver handles field resize.
Every phase reports the actual bounds, field size, DPR, backing bytes, resize
count and maximum backing bytes. Old wrappers remain nonpainting proxies.

## Verification and exactness

- Nineteen unit/startup/controller/geometry tests pass. More than 80,000
  transformed texture corners and fragment vertices across complete lifetimes
  are checked against the bounds. Separate cases verify growing unions, field
  clipping and the pixel comparator's detection of cropping versus color error.
- Real GamePage simulation integration at 16 / 50 ms retains 42 / 29 measured
  salvos per phase and the unchanged .68 accepted ratio at 50 ms. Rendering and
  audio are stubbed in this integration; it is not a device performance result.
- The actual candidate's pending-preparation cancellation and complete resource
  release integration still passes.
- Frozen Chrome comparisons cover 180, 650 and 1600 ms, including four/eight
  pieces. Direct aligned Canvas readbacks contain no nontransparent full-image
  pixel outside the bounded store in all three frames. Strict byte equality
  does not pass: 1 / 2 / 0 pixels differ, maximum one RGBA channel level out of
  255. The boolean `passed:false` is retained in the raw proof; it is not
  relabeled as an exact pixel match. Visible comparison shows no clipping.
- An earlier asymmetric copy-then-readback comparator gave the same tiny
  differences. Direct readbacks remove that extra conversion but do not remove
  the differences. Therefore copy rounding alone is not claimed as the cause;
  a precise backend rasterization mechanism remains unproven.
- DPR 1 is the actual Chrome proof environment. DPR 3 bounds retain their
  original pixel grid by construction, but actual Pi presentation still needs
  the device run. No public release follows from this private experiment.

## Deployment

Final preview dpl_CH7ALSqryViZVxzSBZSiLtkT8QAT is READY, target null, aliases
empty. Host: cryptoid-evolution-testnet-9iodjzg1q-19-trojan69.vercel.app.
The share token is not stored in Git. Its expiry is 19 October 2026 at
11:49:07 UTC. The direct share opened without a GitHub or Vercel login.

## Completed Chrome run

The final deployed preview completed in 53,047.4 ms with visible Chrome 154,
a 1363 × 936 field, DPR 1 and sound enabled. The exported JSON exactly matched
the report shown by the application. Copy reported success, and the download
and final screenshot are retained alongside this document.

| Phase | Delivered FPS | Accepted time | Salvos | Backing bytes | Draw work p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Full field before | 59.64 | 100% | 42 | 5,103,072 | 0.5 ms |
| Bounded | 59.35 | 99.88% | 42 | 1,318,724 | 0.8 ms |
| Full field after | 59.72 | 100% | 42 | 5,103,072 | 0.6 ms |

The bounded store ended at (339, 130)–(1036, 603), or 697 × 473 pixels:
74.15% fewer backing bytes than the full field at the same DPR. It resized
22 times during the fifteen-second phase, growing as new effects required
more space. This is not a per-frame resize. The device run must establish
whether reduced backing area outweighs this allocation cost on Pi Browser;
the Chrome result does not establish a Pi speed improvement.

Every phase retained all four pieces per drawn explosion. Source images,
texture bytes and preparation counts stayed stable across phases. There
were two original-display fallback mounts in the first phase while assets
were being prepared, and none in the bounded or final phase. All twelve
periodic samples had active Canvas proxies and no original effect DOM.
Failures, issues, blocked requests and fixture resets were zero. Final cleanup
released the draw scheduler, registrations, source images, textures, cache
bytes and Canvas backing store completely. CPU draw timings do not measure
GPU completion or prove actual pixel presentation.

The public aliases were checked after deployment and remain unchanged:

- Testnet: `dpl_BX7ZeCr9Qr6anBa3AZnzLERubpQM`, commit
  `27d174788327c3423f04ace32be61af67a2004cc`.
- Main: `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe`, commit
  `907d2a7363345d00f0f90c54402bf04e887b64d9`.

This is an isolated renderer candidate. The next evidence needed is the same
completed report and visible-effect check from the original iPhone/Pi Browser.
