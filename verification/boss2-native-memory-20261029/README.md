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

Final corrected results are pending. No native cause, heat result or White
Screen fix is claimed.
