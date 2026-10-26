# Elapsed time with one original actor scene

The historical White Screen remains unresolved. The owner's clarification is
that faster firing permits more progress before the interruption. It does not
establish a fixed crash time, shot-rate cause or memory leak. This checkpoint
adds a continuous-time control to the previously completed source/scene-cycle
matrices; it does not rerun those matrices or change the gameplay renderer.

## Completed observation

A fresh WPE WebKit 26.5 browser uses one original boss-4 hull/gun pair
and the original full-resolution player image for 780.012 real seconds.
One scene is prepared once. The boss, player and turret transforms continue
changing with real native frame timestamps, while texture identities, dimensions,
heat stages, source count and ownership stay fixed. No battle progression or
account authority is simulated. The same drawing code as the isolated rebuild
is imported without changes. Each image is checked against the pinned blob
manifest, including the separately labelled generated release-catalog PNG.

The control completes 47,290 native callbacks and 47,291 presentations,
with exactly three original-image requests and 17,154,696 managed bytes
throughout. The same document survives, with no browser crash, page error or
reported context loss. Closing leaves zero managed entries/bytes/jobs/scopes,
zero failed disposals and a zero-size owned visible canvas. No GC is forced.

After minute five, native browser PSS ranges from
350.3 to 372.2 MiB. The first/last
two-minute means are 353.9/362.8 MiB;
the last active sample is 362.1 MiB, and twenty seconds after closing
it is 372.1 MiB. These observations do not show the large
sustained climb seen when the earlier fixture repeatedly introduces sources.
They do not prove a permanent leak, a global bound or phone/GPU behavior.

Short controls also verify that `held` draws exactly once, `static` redraws each
callback, and `motion` uses an advancing native callback stream. The held/static
smokes ran in parallel only after the primary browser closed; do not compare
their PSS as matched memory measurements.

## Existing recordings and source audit

`recording-comparison.json` contains only sanitized counters and input hashes
from the two existing recordings. Their captured intervals are 645.256 and
696.602 seconds, from different builds and stages. These are not two matched
crash timings. In particular, recording end does not independently classify
a crash, capture start is not original game start, and simulation elapsed time
can already include a resumed saved run. The separately confirmed latest
interruption still has no recorded exit intent or JavaScript fault.

The reviewed running-game paths have a ten-second combat checkpoint,
thirty-second score checkpoint, the strict >2500ms/500ms interruption guard,
a bounded eight-hour recording limit and optional ten-minute diagnostic-arm
expiry. Authentication restoration has no periodic re-login loop. The checked
expiry paths stop diagnostics or pause/retry; they do not schedule Home.
Five-minute attack/shot-cap rules are bounded gameplay changes, not navigation.
This limited source audit is not an exclusion of all host/SDK/storage behavior.

## Remaining gates

This is the incomplete actor renderer: no original full HUD, CSS background,
explosions, audio, persistence, account or real Pi bridge is included. There
is no pixel readback or screenshot in the memory control, so a silent display
corruption is not formally excluded. The original cross-device interruption
and any time dependency in the complete game remain open. No decoder default
is accepted and no feature integration/release follows from this result.

The new Chromium launch is blocked before loading a page: sandboxed Chromium
cannot run as root and `runuser` fails to set groups in this environment. No
sandbox is disabled. Its failed receipt is preserved and is not a pass.

43 existing contracts, TypeScript, verifier syntax and the 41-module simulation
boundary audit pass. These checks do not supply missing native Chromium/device
acceptance. Original artwork/renderer/loader/clock, gameplay, sound, accounts,
saves and payments remain unchanged. PR167 stays a draft with auto-deploy off.

Reproduce from `rebuild`, with matching browser tools and original assets:

```sh
CRYPTOID_TEST_ENGINE=webkit CRYPTOID_TIME_MODE=motion CRYPTOID_TIME_SECONDS=780 CRYPTOID_NATIVE_OUTPUT_TAG=unique-time node verify-scene-time.mjs
```

Tags are exclusive. The hashed archive preserves all four completed WPE
receipts, the blocked Chromium receipt, console logs, the exact new verifier/
fixture, unchanged renderer/loader and contract output. Do not overwrite or
reinterpret earlier failures. Next isolate a complete-game time/resource path
from the changing-source path; the fixed-scene result alone does not identify
the historical cause.
