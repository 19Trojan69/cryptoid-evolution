# Owner report: second-boss interruption, 21 October 2026

Evidence-only continuation of the iPhone investigation. No new runtime release,
graphics change, account/save operation or Mainnet operation is made here.

Owner clarification after this review: **"wieder von allein"**. The owner
confirms that this run returned by itself, not through a chosen menu exit. Treat
this as a reported spontaneous interruption correlated with the unclosed
session/new document, while retaining the distinction from a proven native
process termination and its cause. A targeted search of the uploaded diagnostic
filenames found the existing 19 October Jetsam file, but no matching 21 October
Jetsam/WebContent file. A matching device record is still needed; do not ask
again whether the owner intentionally left this run.

## Report identity and scope

The owner supplied a v5 `cryptoid-local-stability-report`, generated at
`2026-10-21T02:26:06.872Z`. The previous run and reporting runtime identify
`e7b49fed4c29baf021d9f0af56fead66ff7d02b7`, source tree
`2106d405572faf19a8ced7606f13dca31be65910`, native CSS easing and a 60 Hz target.
`workingTreeDirty: true` alone is not evidence of a different delivered release.

This report has `timingCapture: null`. It contains the ordinary ten-second
resource history, not a fresh targeted timing capture. The earlier 20 October
targeted capture remains valid evidence for its own run. Do not require the
owner to repeat it merely because the latest report has a different scope.

## Observed chronology

All times below are UTC; Vienna is UTC+2 on this date.

| Evidence | Time | Meaning |
| --- | --- | --- |
| Reactor observed open | 02:25:34.140 | Boss 2, sector 20, all three turrets destroyed |
| First core shot before creation | 02:25:35.920 | Core volley zero |
| Shot created / audio returned | 02:25:35.921 | Core volley one |
| First shot scene committed | 02:25:35.924 | The synchronous boundary completed within 4 ms |
| Last saved session marker | 02:25:42.570 | Active, visible, playing; one escort, core volley three |
| Last old-document heartbeat | 02:25:43.372 | Still playing; boss health 201.694/255.774, one escort |
| New document time origin | 02:25:48.326 | 4.954 seconds after the final available heartbeat |
| New app-boot recorded | 02:26:07.417 | Lazy owner diagnostics installation, not document creation |

The available trace changes boot ID without a recorded `home-intent`, normal
monitor stop, hidden/pagehide event, error or freeze marker. Together with the
still-active session marker, this is an unclosed-session/document-replacement
signal. It does not identify whether the browser process died, the user
navigated, or another unobserved lifecycle action occurred.

The game continued for at least 9.232 seconds after reactor opening and 7.452
seconds after the first core shot began. Do not attribute the interruption to a
synchronous failure of that first shot or its audio call.

`AdminPage.tsx` installs reload diagnostics only after owner verification.
`stabilityReport.mjs` reads `performance.timeOrigin` for the document start, but
captures its default `now` before awaiting verification. These explain both the
19.091-second delay before the recorded app-boot and its 545-ms timestamp after
`generatedAt`. They do not prove malformed/spliced data. The `admin` route is the
route when diagnostics/reporting execute, not a proven failure destination.

## Resource evidence and its limits

The last resource sample is at 02:25:42.543, before the final heartbeat:

| Counter | Value |
| --- | ---: |
| Painted hull entries / estimated bytes | 48 / 17,672,384 |
| Canvas source images / cached textures | 8 / 8 |
| Canvas cache / live surface bytes | 13,548,860 / 546,480 |
| Audio sample buffers / buffer bytes | 46 / 7,660,648 |
| Known estimated resource bytes | 39,428,372 (37.60 MiB) |
| DOM nodes / running animations | 509 / 23 |
| Canvas failures / CSS pacing fallbacks | 0 / 0 |

Painted entries plateau at 48 by sector 7. Canvas textures plateau at eight
after the first boss; audio buffers remain at 46. Later campaign estimates
fluctuate with live surfaces, with a recorded peak of 46,167,485 bytes at the
sector-19 intro, then fall again. DOM and animation counts fluctuate rather
than showing unbounded retained growth in these samples.

Source review confirms bounded painted-variant, raw-source and Canvas image /
texture caches, temporary painting-canvas release and Blob-URL revocation on
variant eviction. The raw-source cache has an eight-entry count bound, not a
decoded-byte budget. Reported estimates are incomplete: raw decoded resources,
native WebKit/GPU caches, layers and process memory are not fully represented.
Neither the stable counts nor the relatively small estimate rules out a native
memory failure. Sparse `frameMs` values do not establish sustained presented FPS
or absence of time loss. The new document's cumulative CSS configured count is
not comparable with a previous document's lifetime total.

## Verification and next boundary

Source inspection covered BossHullView, BossReactorView, HullDamage, related
CSS, paintedShip, ResourceCache, CanvasEffects, reloadDiagnostics,
stabilityReport and the owner report entry point. No concrete new unbounded
application-resource lifetime was demonstrated. Existing report/lifecycle/cache
diagnostic tests pass: 25/25, using
`node --experimental-strip-types --test scripts/stabilityReport.test.mjs src/pages/reloadDiagnostics.test.mjs src/pages/resourceCacheDiagnostics.test.mjs`.
These are diagnostic tests, not a physical-iPhone crash reproduction.

The decisive missing evidence is a matching iOS Jetsam/WebContent termination
record for the reported spontaneous interruption at approximately
04:25:43–04:25:48 Vienna on 21 October. An older Jetsam record from another date without URL attribution cannot
be assigned to this interruption. Do not publish speculative visual/audio cuts,
repeat the earlier timing test by default, or call this a proven crash fix.

Official Testnet remains the previously verified e7b49fe release. This document
must not trigger a new runtime deployment. Preserve all release/rollback refs.
