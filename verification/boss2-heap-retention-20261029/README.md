# Private Boss 2 JavaScript retention comparison, 29 October 2026

The owner reports another White Screen after running with additional recording
off; exact time is unknown. This is observed device evidence, not an uploaded
new full recording. The extra owner recording is therefore not a necessary
condition for the reported failure. Core recovery/session safeguards and the
bounded private pause observer remain in that condition. Native memory, GPU and
temperature remain unmeasured. The previous c5veg4gp full report is a separate,
recording-on run, with 556 contiguous records across 251.750 seconds. Its current
document begins 151 ms after the last saved playing row; its last captured touch
is 159.405 seconds earlier. Do not substitute that file for the new off run.

This QA-only investigation compares fresh Chromium Linux jobs at 60 and 360
active seconds. The existing delivered c610e7c application runtime is pinned by
the unchanged duration scope verifier. No frontend, private runtime, asset,
builder, API, clock, input or account implementation changes. Existing private
guest, reactor and protection controls are used through native touch. Owner
recording is off. One-second external process samples and the existing fixture
inspection confirm same-document play/frame/volley progress. No screenshots,
forced garbage collection, heap snapshot or new collector runs during play.

After the uninterrupted active interval the original Home control opens its
paused confirmation. Only then does an external CDP session collect garbage and
capture a heap snapshot, DOM counters and isolate heap usage. The actual Home
confirmation then unmounts the game. The fixture's existing Window inspection
bridge closes over the last controller; only that QA bridge is deleted after
unmount before taking a second snapshot. That deletion is a harness cleanup,
not a deployed application fix. Both original snapshots are compressed as
synthetic-only CI artifacts. Their graph summaries and digests are retained.

Graph self sizes are not dominator/retained sizes or total browser/GPU memory.
CDP usage covers its isolate, not a physical iPhone. Snapshot collection itself
perturbs paused memory, so native-process comparisons use samples from before
profiling. Fresh independent jobs have unseeded original scene randomness; one
short and one long run cannot establish an unbounded leak or native crash cause.
No phone retest, new device URL, public rollout or White Screen fix is claimed.

Protocol references: https://chromedevtools.github.io/devtools-protocol/tot/HeapProfiler/
and https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-getHeapUsage.
Chrome's heap-snapshot guide explains reachability and automatic collection:
https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots.

Results will be recorded only after complete jobs and artifact verification.
