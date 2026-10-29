# Unchanged private Boss 2 duration comparison, 29 October 2026

This investigation tests the already delivered c610e7c application runtime for
six active minutes in separate Chromium and WebKit Linux runners. It does not
publish a new app. Complete frontend and private-runtime pins protect the
existing controller, input, menu, auth/transport, assets and builder. Only QA and
evidence files are added. Build metadata naturally identifies the QA commit.

Both engines use a 430x825 viewport and DPR3. These are emulated dimensions, not
physical iPhone/Pi Browser acceptance. Start/preparation/Resume/final Pause are
native single touchscreen taps. There is no steering, screenshot, forced GC,
heap snapshot or injected clock during the six active minutes. The existing
test protection and owner diagnostics stay enabled. Existing frame callbacks,
reactor volleys and same-document identity must advance without a technical
pause. Original music, audio, effects, art and clocks remain in place.

The existing out-of-page Linux sampler records descendant process PSS/RSS once
per second. PSS is available only if every classified process supplies it; RSS
can double-count shared pages. GPU-resident memory, iPhone total process memory
and heat are not measured. A normal JIT/cache warm-up is not automatically a
leak. First/last-minute medians and the complete bounded trace are retained.

After the duration, a manual pause, committed-report check and explicit paused
reload verify the saved full report and separate new-document evidence. The
deliberate final reload is not an unexpected crash. Failed attempts are retained
and excluded from success claims. No owner attachment or raw device report is
included in this repository.

Static inspection of the private entry/transform, startup recovery, original
controller, route recovery, history guard, guest auth and wake-lock module found
no automatic document reload in the tested route. The two explicit reload calls
are manual recovery buttons; the startup timer only offers those controls.
The real OAuth redirect is replaced by the private guest hook. Original Home
actions use client-side navigation. This source review does not prove a native
termination cause and cannot exclude behavior in the embedding browser.

The existing protected device test link and public Testnet/Mainnet remain as
before. Verification results are recorded only after the external jobs finish.

The first external attempt observed 360.738 active seconds in Chromium and
360.754 in WebKit without an unexpected document change or technical pause.
Both overall jobs then failed at the report step: the native-tap helper did not
scroll a below-viewport menu button into view. A visible DOM element need not
lie inside the touchscreen viewport. This is a verifier failure, not evidence
of the owner's White Screen. Its six-minute process samples remain valid
observations; neither job is counted as complete end-to-end acceptance.

The helper now scrolls through the normal browser action and checks the tap
center against the viewport before sending the native touch. The follow-up
workflow first runs only 30 active seconds to validate this repaired report
path. It is not a second six-minute observation. The original six-minute traces
and failed overall statuses are retained separately; no application runtime
change, new device deployment or native crash fix is claimed.

A fresh browser context then runs another 360 active seconds with the existing
menu's additional-recording checkbox off. The controller must report
`ownerDiagnostics:false`, and its additional full-session marker must remain
absent. The graphics, audio, native clocks, scene, protection, viewport and DPR
are retained. The existing core recovery/session safeguards and bounded test
pause observer are not removed, so this is additional owner recording off, not
all diagnostic code removed. Existing UI exports the limited report afterward;
no full recording is expected for that condition. Results are separated by
engine, recording condition and requested duration. This is a Linux process
comparison, not a measured iPhone thermal or native memory result.

## Completed comparison

Application runtime remains the delivered c610e7c. The first QA source was
6a966d1/tree c192cf0, run 40865230360. Its overall result is failed as documented
above, while both six-minute active observations and process traces completed.
The repaired source faec552/tree bcfb6d8 passed run 40867284745 in both engines:
the 30-second full-report check and the separate 360-second recording-off check.
All four ZIP digests and ZIP integrity were independently verified. Full
synthetic traces are retained as CI artifacts; curated results and artifact
IDs/digests are in `results.json`. All 26 local isolation/tool/export cases and
the transformed controller type check passed. Strict runtime pins passed in
both external runs. No additional frontend release-build claim is made.

| Linux engine | Recording on, last-minute median PSS | Recording off, last-minute median PSS | Difference |
| --- | ---: | ---: | ---: |
| Chromium 151.0.7922.34 | 752.0 MiB | 494.1 MiB | 257.9 MiB |
| WebKit 26.5 | 1137.8 MiB | 1077.3 MiB | 60.4 MiB |

These are browser descendant process measurements, not the game's small tracked
cache subset and not an iPhone/GPU memory measurement. Core-volley progression
was 128 versus 128 in Chromium and 56 versus 55 in WebKit. WebKit's Linux simulation
progresses much more slowly, so its wall interval does not establish equivalent
iPhone performance or cumulative simulation work. The first recording-on
Chromium curve rises most strongly before minute 4 and then flattens. No
unbounded leak or physical memory-pressure termination is established.

The existing additional owner recording contributes measurable memory in these
single-run comparisons. The next physical control is the unchanged private link
with its existing additional-recording checkbox off and test protection on.
The outcome must be assessed from the owner's observation; an additional full
recording is intentionally absent for that condition. This does not remove the
original recovery/session safeguards or the bounded private test pause observer.

No unexpected White Screen was reproduced externally. The corrected driver,
bounded synthetic evidence and failed first overall results are all preserved.
The device link and public Testnet/Mainnet are unchanged, with main still
ce073547cf573375d141bf846f70e294138dbd73. No owner attachment, account operation,
payment or real progress mutation was included.

All six synthetic verification records, including every sampled process point,
are also preserved in `evidence/synthetic-duration-evidence.json.gz` beyond the
short CI artifact retention. The archive contains no owner device attachment.
Its hash, size, case count and process-sample count are in `results.json`.
