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

## Completed result

QA source 3700421/tree 9c8f669 passed both jobs in run 40880149703:
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/40880149703.
Chromium 151.0.7922.34 observed 60.098 and 360.090 uninterrupted active seconds,
respectively, with reactor volleys 0→21 and 0→128. No unexpected document change,
technical pause, page error, crash or external request was observed. Both jobs
confirmed absent additional full recording. Complete frontend/private runtime
pins and transformed-controller type checks passed. Installation rewrote only
the already disclosed frontend/yarn.lock; no application change is included.
All three local parser cases passed. No new full frontend release-build claim.

| After explicit pause and collection | One-minute run | Six-minute run |
| --- | ---: | ---: |
| Used JavaScript isolate heap | 10,443,380 B | 10,438,548 B |
| DOM nodes | 722 | 710 |
| JavaScript event listeners | 288 | 286 |
| Snapshot detached nodes | 21 | 22 |
| Used heap after Home/unmount and QA-bridge removal | 9,834,176 B | 9,785,816 B |
| DOM nodes after Home/unmount | 234 | 234 |
| Event listeners after Home/unmount | 190 | 190 |

The paused JavaScript heap differs by -4,832 bytes (-0.0463%). This comparison
does not show a large accumulation of retained JavaScript or DOM objects. The
small detached count includes deliberately offscreen cached images/canvases and
is 16 after unmount in both jobs; detached status alone does not establish a leak.
The samples do not rule out growth over longer sessions, a device-specific JSC
issue, native image/media/GPU allocations, the embedding browser or heat.

Last-minute median pre-profiling browser descendant PSS was 468.65 MiB for the
one-minute case and 497.08 MiB for the six-minute case. The former is the entire
first minute, including warm-up. These process sizes are not the JavaScript heap
and are not an iPhone measurement. There was no active forced collection or
snapshot in either observation. Paused collection changes memory behavior and
must not be treated as an untouched-process measurement.

Both artifact ZIP digests match GitHub's reported SHA256 and pass ZIP integrity.
All four compressed snapshots match their stored digests, parse fully and were
re-summarized locally with identical graph counts/groups. The complete synthetic
summaries (all node-type/group totals and all 409 process samples) are preserved
in evidence/synthetic-heap-summaries.json.gz. The raw snapshot artifacts and
their independent digests are listed in results.json; no owner attachment is
included in either durable summary or this repository.

The owner now clarifies comparable aborts on Android smartphones as well as
iPhone, with tablet and PC stable in the owner's tests. Treat the shared
smartphone path as the primary investigation, without claiming every smartphone
fails or an exact code/native cause is established. The browser-only comparison
is deferred. In the original controller, field width <=700 uses scene requests
at 32ms (50ms under backpressure), while larger fields use 16ms. The simulation
and projectile clock remain separately capped at 60Hz. This branch is a verified
code difference, not a demonstrated crash location.

A separate QA-only native-touch comparison exercises four fresh conditions in
Chromium and WebKit: phone 430x825/DPR3, phone/DPR1, phone/DPR3 with the existing
Reduced effects setting, and wide 820x825/DPR3. Each observes only 30 active
seconds; it verifies the real setting, frame/volley progress, appearance and
private export gate, not six-minute physical stability. Profiling/collection
remain off during these runs. The Reduced effects control changes the existing
display preference, not combat clocks.

## Completed shared rendering comparison

Source 2bb9adc/tree 461cc94 passed both Chromium and WebKit jobs in run
40882780961. All eight conditions completed 30.073–30.642 active seconds with
same-document play, frame and volley progress, absent additional recording,
native manual Pause and no page error/crash/unexpected external request. Scope
pins and transformed-controller types passed. The existing setting was changed
through its actual paused Control Center / Display button in both engines;
aria-pressed, stored preference, applied dataset and hidden reflection matched.

| Short Linux condition | Chromium last-10-second median PSS | WebKit last-10-second median PSS |
| --- | ---: | ---: |
| Phone 430x825, DPR3, standard | 484.8 MiB | 1101.5 MiB |
| Same phone dimensions, DPR1, standard | 444.9 MiB | 743.8 MiB |
| Phone 430x825, DPR3, reduced effects | 420.7 MiB | 928.1 MiB |
| Wide 820x825, DPR3, standard | 706.6 MiB | 1260.6 MiB |

The reduced option lowers observed process PSS in both short runs. Pixel density
also matters, but these are one unseeded run per condition, not native-device
memory limits or an isolated allocation cause. Crucially the wide condition
uses more process memory externally, while the owner's tablet/PC runs are
stable. Do not infer that small width alone causes the physical failure.
Linux WebKit core volleys are 4/10/4/2 across these conditions, versus Chromium
10/10/10/10. The conditions do not establish equal simulated work or physical
phone FPS. They reveal emulator workload differences, not an iPhone slowdown fix.

Reduced effects is only a partial control: running animations and reflections
are reduced, but the native HUD backdrop blur(10px) and boss-hull drop shadows
remain. Therefore a failure with this setting cannot rule out all graphics,
native media or browser-container allocations. Both artifact ZIP hashes match
GitHub and pass integrity. The full eight synthetic records and all process
points are preserved in evidence/synthetic-render-evidence.json.gz, with digests
and case details in results.json. No raw owner device input is included.

The next phone control keeps the same smartphone and browser, existing private
URL, reactor scene, recording off and protection on. Use the existing paused
Control Center / Display button to select Reduced effects; manually Resume and
observe six minutes. This targets a shared graphics/resource condition rather
than only iOS or Pi Browser. No new full report is expected with recording off.
The physical outcome remains pending; none of these external runs establishes
that the White Screen is fixed.

The delivered device link, public main ce073547 and Testnet/Mainnet deployments
are unchanged. No runtime fix, deployment, payment or real-progress mutation.
