# Shared smartphone native-memory attribution, 29 October 2026

The owner reports White Screen/abort on iPhone and Android smartphones, with
tablet and PC stable. Recording off still failed on the phone. The reduced-
effects physical test has no outcome yet. Previous external JavaScript heap
and short rendering comparisons are complete; do not repeat them as new data.

This QA-only continuation adds native subsystem attribution to the unchanged
delivered c610e7c guest application. Existing strict frontend/private runtime
pins apply. No app, asset, API, builder, game clock, input or deployment changes.
Four fresh Ubuntu/Playwright jobs compare standard/reduced effects in Chromium
and WebKit, 430x825/DPR3, original protected reactor scene, recording off and
native touch preparation/Resume/Pause/Home. Only 90 active seconds are observed,
not six-minute stability or a physical device. Random scene work is unseeded.

Chromium records memory-infra with explicit detailed dumps only at paused
initial/end/unmount checkpoints and deterministic=false (no requested GC).
Allocator byte scalars are hexadecimal. Parent/child and cross-process shared
allocations are kept separate and must not be summed into total RAM or GPU
usage. The trace, attribution and Linux process samples include profiler costs.
This does not identify the exact game call that created a native allocation.

WebKit reuses the existing save-retry Node-only Inspector bridge. It observes
Memory tracking updates and Canvas allocation counters, without editing app or
browser files. Actual category events, advancing timestamps and error absence
are required. Unsupported attribution is a profiling failure, not a game crash.
Native categories need not account for all process PSS or physical GPU memory.
There is no active screenshot, forced collection or heap snapshot. The profiling
agents are active during play; these are not untouched performance benchmarks.

After active observation the real menu unmounts through Resume/Home/confirmation.
The additional short UI Resume interval is outside the 90-second observation.
The synthetic Window inspection bridge is removed only after unmount. The
three-second unmount checkpoint is not a guarantee that all browser caches must
already be released. All evidence is synthetic; owner raw reports stay private.

References: Chromium DevTools Tracing.requestMemoryDump, Chromium MemoryInfra
GPU documentation, and WebKit's Memory protocol/Memory Debugging documentation.
## First attempt and profiler correction

Source fbb0fe3/tree 2924a5f ran workflow 40892628729. WebKit standard/reduced
completed 90.369/91.095 active seconds and 80/83 unique native tracking updates.
Their attribution is complete. Both Chromium active observations also completed
(90.122/90.914 seconds, 31/32 core volleys), but overall jobs failed in trace
finalization. The initial category configuration allowed unrelated default
events; the fixed event limit then dropped batches containing the requested
dumps. This is a profiler configuration/collection failure, not an observed game
crash, and zero matched dumps must not be presented as zero native memory.

The corrected tracing excludes default categories, retains only memory-dump and
process-name events, uses a 32MiB trace buffer, validates the trace's data-loss
flag, and bounds finalization. A regression case includes a batch exceeding the
old event limit with a memory dump at its end. Only Chromium standard/reduced
are repeated. Completed WebKit runs are preserved separately. No application
runtime, game setting, public deployment or physical-device result is changed.

## Recovered Chromium attribution and preserved workflow failures

The Chromium-only follow-up, source 3f63732/tree 5cb56ab, ran workflow
40893919633. Both active observations completed, 90.465 seconds standard and
90.566 reduced, with 32 core volleys each. All three explicit dumps succeeded;
both traces contain 45 retained events, including 39 memory fragments, and
report dataLossOccurred=false. The overall jobs nevertheless failed while
parsing byte counters outside JavaScript's exact integer range. The original
complete=false and failed workflow conclusions remain preserved. The final
post-parser screenshot/external-request assertions were not reached, so this
offline recovery is not presented as a successful end-to-end CI run.

The parser now preserves oversized counters as exact unsigned hexadecimal
strings with a null numeric value and an explicit range reason. In each trace,
12 such attributes occur under malloc/partitions/allocator: max_committed_size,
virtual_committed_size and wasted. None is the primary size field. No sentinel,
signed-wraparound or resident-RAM interpretation is assigned to these values.
Malformed hexadecimal data still fails validation; no value is rounded or
converted to an invented zero.

The actual export also revealed a distinct association problem: CDP returns
request GUIDs 1/2/3, while Perfetto's legacy JSON export emits snapshot-table IDs
0/1/2. Literal GUID matching would mislabel two checkpoints and miss the last.
The corrected parser explicitly associates the three chronological snapshots
with the three successful sequential requests, with automatic dump triggers
disabled. It rejects missing/extra snapshots, failed requests, duplicate request
GUIDs and conflicting timestamps; it assumes no constant identifier offset.
Each checkpoint has six unique process IDs across 13 fragments. OS totals and
allocator/shared fragments stay separate, including repeated process IDs.

This behavior is supported by the primary implementation:
[Perfetto ExportMemorySnapshots](https://github.com/google/perfetto/blob/main/src/trace_processor/export_json.cc)
uses snapshot-table row IDs, whereas
[Chromium OnMemoryDumpFinished](https://github.com/chromium/chromium/blob/main/content/browser/devtools/protocol/tracing_handler.cc)
returns the request's dump ID. The three snapshot timestamps and original
requests are retained, together with the full trace bytes and SHA256 digests.

Offline parsing of both original traces now passes all capture-integrity and
checkpoint-association checks. No third game run was needed. Seven focused
parser regression cases and the existing complete frontend/private runtime
scope pins pass locally. The corrected live finalization path itself has not
been rerun and is not claimed as green CI.

## Measured result

These are individual, overlapping reported allocator sizes in MiB, not values
to add into total RAM. Chromium's GPU process GPU category is also not the
physical graphics memory of the owner's smartphone.

| Chromium checkpoint | Standard | Reduced effects |
| --- | ---: | ---: |
| Initial GPU-process `gpu` | 32.078 | 26.609 |
| After active play GPU-process `gpu` | 28.648 | 25.258 |
| After Home/unmount GPU-process `gpu` | 22.953 | 13.906 |
| After active play renderer `cc` | 52.723 | 46.434 |
| After active play renderer `cc/image_memory` | 27.066 | 27.074 |
| After active play renderer `skia` | 16.045 | 16.072 |
| After active play renderer `canvas` | 1.793 | 1.793 |

The reported GPU category does not grow between these initial/end checkpoints.
The renderer image cache grows during scene warm-up and remains at about 27MiB
after unmount. That alone does not establish a leak. Blink GC and DOM counters
remain higher after unmount in the standard run; the reduced run releases more.
No collection was requested, and a three-second checkpoint cannot distinguish
reachable retained objects from garbage awaiting collection. The earlier
one-minute/six-minute post-collection heap comparison remains separate evidence.

Last-30-second median Linux descendant PSS is 459.055MiB standard and 432.334MiB
reduced. The earlier invalid Chromium tracing configuration incurred much more
collector work; do not mix its process samples into the corrected comparison.
These individual unseeded jobs do not establish a causal effect size.

| WebKit last 30 active seconds | Standard | Reduced effects |
| --- | ---: | ---: |
| Median Linux descendant PSS | 1116.817 MiB | 1081.705 MiB |
| Median JavaScript category | 28.963 MiB | 30.083 MiB |
| Median images category | 15.098 MiB | 15.098 MiB |
| Median unclassified `other` category | 748.357 MiB | 736.575 MiB |

Native categories use unique timestamp updates within the last 30 active
seconds. The WebKit backend reports layers/page as zero; this is an attribution
limit and does not demonstrate zero layer/graphics memory. `other` remains
unclassified and must not be relabeled GPU memory, heat, a leak or a game cache.
Canvas observations peak at 1,947,368 bytes in both runs. After unmount, images
fall from about 15.4/15.7MiB to 4.1/4.4MiB, but much of `other` remains.
Initial paused baselines have different warm-up times; compare them cautiously.
WebKit also advances 9 versus 11 volleys, unlike 32/32 in Chromium, so these are
not matched-work or physical-phone FPS benchmarks.

The new attribution does not identify a single runaway graphics allocation or
the cause of the physical White Screen. It does not refute the owner's shared
smartphone failures. There is no temperature measurement, iOS/Android memory
limit measurement, engine-specific termination proof or White Screen fix.
The previously requested physical reduced-effects outcome is still pending;
the existing setting leaves some blur/shadows active, so it is a partial control.

## Durable synthetic evidence

All six original verification records, including all process/native updates and
failed conclusions, are preserved in evidence/synthetic-native-measurements.json.gz.
Both corrected Chromium raw traces are retained separately. All six original
artifact ZIPs matched GitHub's digests and passed ZIP integrity before ingestion.
No owner device attachment is included. Run:

```
node --test verification/boss2-native-memory-20261029/nativeSummary.test.mjs
node verification/boss2-native-memory-20261029/summarizeEvidence.mjs
node verification/boss2-return-duration-20261029/verifyScope.mjs
```

The summarizer checks the compressed evidence hash, raw trace sizes/digests,
loss flags, snapshot ordering and renderer/GPU attribution, then reconstructs
results.json without rewriting the original CI records. The delivered c610e7c
device application, public main ce073547, controls, art, audio, game clocks,
Testnet/Mainnet deployments and existing protected device URL are unchanged.
