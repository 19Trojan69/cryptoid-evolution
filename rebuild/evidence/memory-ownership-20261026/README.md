# Replay, native ownership and source-pixel checkpoint

The historical cross-device White Screen remains unresolved. These local
controls identify native allocation paths in the incomplete rebuild; no loader,
renderer replacement or full-game deployment is accepted by this checkpoint.
Original assets, gameplay renderer, clock/watchdog and production sources are
unchanged. No forced GC, allocator trim or quality reduction is used.

## Repeated sources

Four primary fresh-browser controls repeat boss 4 or visit all 50 original boss
models ten times. Each has 500 cycles, the same 393 × 744 / DPR 3 viewport, five
frames per cycle and 20 seconds natural idle. Chromium isolates decoding;
WPE isolates drawing. Every closed receipt has zero managed ownership.

| Path | Source sequence | Baseline PSS | Released cycle 100 | Released cycle 500 | Idle PSS |
| --- | --- | ---: | ---: | ---: | ---: |
| Chromium decode | Boss 4 only | 166.7 MiB | 705.8 MiB | 804.4 MiB | 792.8 MiB |
| Chromium decode | All 50, repeated | 166.7 MiB | 748.8 MiB | 928.8 MiB | 888.9 MiB |
| WPE draw | Boss 4 only | 291.8 MiB | 431.5 MiB | 451.0 MiB | 439.9 MiB |
| WPE draw | All 50, repeated | 292.9 MiB | 778.1 MiB | 793.3 MiB | 770.7 MiB |

Chromium's shared-file region approaches a roughly 500 MiB band while anonymous
memory continues growing. WPE's growth slows strongly with repeated sources,
but this is not a proof of bounded complete-game or device memory.

Two additional 500-cycle controls use the existing original image-element
loader with stable file URLs: Chromium decode ends at 882.6 MiB idle PSS; WPE
draw at 814.3 MiB. Stable URLs alone are not an accepted correction.

The stage controls explicitly call HTMLImageElement.decode() to separate actual
decode from lazy loading. The new renderer itself uses onload. A further matched
500-cycle draw pair removes the extra decode() call and exercises that actual
renderer path: Chromium ends at 892.0 MiB idle PSS and WPE at 809.5 MiB. Thus
the extra decode-only control operation is not the sole cause of the retention.
The eight principal runs cover 4000 closed cycles; the new harness operation
has not been copied into gameplay.

## Chromium allocation provider

Available renderer provider records identify `cc/image_memory`: about 437.0 MiB
after 50 cycles and 495.7 MiB after 100 and after idle. Browser Blob-storage
records return to zero after idle. This is more specific than shared-file PSS.

Every requested **global** memory dump returned `success=false`. Two initial
diagnostics stop at that failure. A third explicitly partial diagnostic completes
100 functional cycles and preserves available per-provider records, then fails
allocator acceptance. None is counted as a complete allocation-profile pass.
Provider records are paired by monotonic capture timestamps, not an assumed
request-GUID mapping. Missing global data is not interpreted as zero.

The pinned protocol and Chromium implementation describe deterministic requests
as forcing GC; these controls always pass `deterministic:false`:
https://chromium.googlesource.com/chromium/src/+/refs/heads/main/content/browser/devtools/protocol/tracing_handler.cc

## WPE native allocation ownership

A local read-only glibc mallinfo2 observer distinguishes allocated arena bytes
from known free arena bytes. In the 150-model-cycle instrumented control,
WPEWebProcess changes from approximately 95.8 MiB allocated / 4.8 MiB free to
378.0 MiB allocated / 112.3 MiB free after disposal and 20 seconds idle. This
excludes treating the whole large heap region as already-free allocator pages.
It does not classify bmalloc, GPU or all browser memory, and thread-cache bytes
must not be assumed to represent live game objects.

Heaptrack 1.5.0 then instruments only the native WPEWebProcess. Profiling is
stopped explicitly after scene disposal and five idle seconds, while the browser
is alive. This preserves allocations still held at that checkpoint instead of
letting browser teardown erase them. The tool's term "leaks" in its report means
not freed at that profiling stop; it is not proof of a permanent leak.

| Observed live malloc bytes at stop | Encoded-fetch baseline | 50-model drawing |
| --- | ---: | ---: |
| Total | 137,644,319 | 428,937,527 |
| Call chains entering Mesa/Gallium | 135,727,022 | 426,740,011 |

About 277.5 MiB of additional observed live malloc bytes are associated with
Mesa/Gallium call chains. A single reported allocation site accounts for about
328.56 million bytes in the drawing report. The module is the local Linux
`libgallium-25.2.8-0ubuntu0.24.04.2.so`. This narrows much of WPE's previous broad
`other` observation to the local graphics-driver path. It does not identify
the exact driver cache policy or prove an app leak, driver leak, phone/GPU
residency or the cause of the owner's historical crash.

The observer itself never trims, collects or changes allocator settings.
Heaptrack separately intercepts native allocation calls and adds overhead;
these instrumented PSS values are not performance-acceptance numbers. Tools and
dependencies are extracted into the task directory from SHA-verified official
Ubuntu packages. No package installation or production mutation is performed.

## Source pixels and scaling

The original generated player PNG and boss-4 hull/gun WebPs are compared at
full size, half size and quarter size. Independent original-image controls and
Blob/image-element controls match exactly. At full size, ImageBitmap also
matches the decoded source RGBA in both engines. The Chromium differences occur
when scaling these sources, rather than in their full-resolution decoded pixels.
WPE matches the plain bitmap in these nine cases.

Full-resolution bitmap-to-canvas copying and constructor resize hints are
controlled sampling probes only. No option matches every source/scale across
both engines, so none is adopted. Original artwork and the original renderer
are unchanged. This is not all-50-model or all-viewport visual acceptance.

## Continuation and reproduction

Continue with Chromium's scaling/decode-cache interaction for explicitly
disposable sources. Treat WPE's local Mesa/Gallium allocations separately and
require a bounded driver/scene baseline. Do not repeat the completed stage or
replay matrix, lower original quality, force GC or integrate further gameplay
functions before the loader gate is accepted.

`verify:memory-stages` now accepts `CRYPTOID_BOSS_SEQUENCE=single|all`, optional
`CRYPTOID_SINGLE_BOSS_ID=4`, up to 1000 bounded cycles and a native PSS stop limit.
The stop limit fails a control; it is not an optimization. Unique output tags
are required. `CRYPTOID_EXPLICIT_IMAGE_DECODE=0` is allowed only for actual drawing
and cannot be mislabelled as decode-only. Optional allocation profiles are
`chromium`, `glibc` or WPE-only `heaptrack`; partial Chromium records explicitly
fail profile acceptance. Compile the local observer with:

```sh
cc -shared -fPIC -O2 -pthread -Wall -Wextra -Werror \
  fixture/mallinfoObserver.c -ldl -o ../verification/rebuild/mallinfoObserver.so
```

`verify:texture-pixels` uses a unique tag and `CRYPTOID_TEST_ENGINE`. Optional
`CRYPTOID_PIXEL_CANDIDATES=1` enables only the explicitly rejected sampling probes.
The source-pixel probe performs readback and cannot be used as memory evidence.
Task-local copies of the matching browsers are reused with
`CRYPTOID_BROWSER_CACHE=/absolute/project/verification/native-browsers` if the
ephemeral root cache is unavailable. Both copied engines pass a local smoke.

`summary.json` records exact controls and limits. `raw-controls.tar.xz` retains
raw receipts, failed/partial diagnostics, native allocation traces, reports,
package provenance and exact primary replay sources. `archive-manifest.json`
pins every member and the archive. The 43 contracts, TypeScript and 41-module
boundary audit pass. No live accounts, saves, inventory, payments or deployments
are involved; draft PR 167 remains the only work branch.
