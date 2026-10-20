# iPhone / WebKit Whitescreen investigation, 20 October 2026

## What the evidence establishes

The latest owner report ends during boss 1, sector 10, not at a boss-defeat or
bonus transition. The final heartbeat is 17:27:28.407 UTC; the next document
starts 17:27:30.795 UTC (2.388 seconds later). Health is 132.9258/253.5658,
with one escort, three projectiles and no ordinary effects. No recorded Home
intent, normal exit or JavaScript error explains the new document. This is
consistent with an abrupt renderer/process interruption, but does not prove one.
The older session marker is not the final state: heartbeats continue after it.

The existing device Jetsam log is from **19 October**, not this incident. It
records active WebKit.WebContent terminated with `per-process-limit`,
131438 resident pages × 16384 bytes = 2153480192 bytes (about 2.01 GiB).
Its coalition matches SafariViewService; the separately listed Pi Browser is
suspended in another coalition. There is no site URL. Therefore it proves a
WebContent memory kill on this device, but cannot be attributed to Cryptoid or
to today's incident. No raw private identifiers or device log are copied here.

The game report's known resource estimate stabilizes near 38–45 MB after cache
warm-up. This does **not** bound browser process, decoded-image, compositor,
filter-surface or GPU memory. `frameMs` is one sampled callback interval, not a
presented-FPS measurement. The report contains no old-run build identity or
targeted timing/audio capture, so the exact client bundle is not established.

## Primary-source review and applicability

| Source | Finding | Application to this game |
| --- | --- | --- |
| [Apple: Jetsam reports](https://developer.apple.com/documentation/xcode/identifying-high-memory-use-with-jetsam-event-reports?language=objc) | iOS can terminate processes for memory pressure or per-process limits; a Jetsam report is different from a normal exception backtrace. | Strong reason to investigate total process/native memory. No browser-side exception handler can prevent an OS kill. |
| [Apple: device temperature](https://support.apple.com/en-gb/118431) | Heavy games can warm the phone; thermal protection can reduce frame rates and processing performance. | Warmth is an observation, not a diagnosis of the reload. No contemporaneous thermal termination record exists. |
| [Apple engineer discussion, 2026](https://developer.apple.com/forums/thread/823061) | iPhone limits can be stricter than iPad limits; Apple requests a reproducible case and device feedback after failure. | An iPad/desktop pass is insufficient iPhone evidence. Other developers' reports do not identify our fault. |
| [WebKit: power usage](https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/) | Reduce script/rendering work and prefer native declarative animation where suitable. | Our last global CSS cap added per-frame JavaScript seeking of every animation. This overhead is directly established in source. |
| [Web Animations specification](https://www.w3.org/TR/web-animations-1/) and [MDN timing API](https://developer.mozilla.org/en-US/docs/Web/API/AnimationEffect/updateTiming) | Effects expose native timing; transformed progress includes easing, while the native clock owns playback/completion. | A native stepped progress function can replace the JavaScript clock without replacing keyframes or playback controls. |
| [WebKit 250970](https://bugs.webkit.org/show_bug.cgi?id=250970) | Threaded animation resolution, including steps timing, was enabled upstream in 2026. | Supports the native direction; actual device acceleration/shipping-version performance remains unmeasured. |
| [WebKit 315118](https://bugs.webkit.org/show_bug.cgi?id=315118), duplicates [316769](https://bugs.webkit.org/show_bug.cgi?id=316769) / [319506](https://bugs.webkit.org/show_bug.cgi?id=319506) | Upstream-fixed pathological large-blur/page-snapshot issue. | Reported huge blur/back-navigation trigger differs from this mid-fight failure. Our mostly small filters do not establish a match. |
| [WebKit 295618](https://bugs.webkit.org/show_bug.cgi?id=295618) | Fixed ImageBitmap memory-cost regression; explicit close remains useful for unused bitmaps. | Current game image loaders use HTMLImageElement/canvas rather than this map's ImageBitmap/WebGL/WASM path. No matching live bitmap leak identified. |
| [WebKit 229668](https://bugs.webkit.org/show_bug.cgi?id=229668) | Detached 2D canvas/video backing retained data; fixed in 2021. | A historical explanation of hidden native costs, not proof of a current game defect. |
| [WebKit 218422](https://bugs.webkit.org/show_bug.cgi?id=218422) | Older SVG-filter memory amplification report, not reliably reproduced in every build. | Keep masks/filters in the device isolation plan. Do not remove approved artwork on the strength of an old report. |
| [WebKit 312563](https://bugs.webkit.org/show_bug.cgi?id=312563), [304810](https://bugs.webkit.org/show_bug.cgi?id=304810) | WebGPU resize and WASM compiler memory reports. | This client uses neither WebGPU nor WebAssembly in the combat renderer. Their fixes are not directly applicable. |

This is a focused review of relevant primary sources, not a claim to have read
every web page or journal. Similar symptoms alone are insufficient causal proof.

## Directly corrected application findings

1. **Unnecessary CSS animation clock work.** The d6419c5 controller sets native
   playback rate to zero, scans all retained animations every selected frame,
   reads timing and seeks each animation with `currentTime`. It continues scanning
   paused effects. The replacement configures a native stepped effect once at
   registration. Linear outer timing uses `steps`; nonlinear outer timing is
   sampled once using an elementless, timeline-free probe and compiled into a
   bounded native `linear()` staircase. Authored CSS keyframes and segment easing,
   duration, delays, direction, playback rate and native finish/pause semantics
   remain. There is no CSS-controller RAF, timer, visible-clock seek or rate write.
   The shared 60-Hz game/canvas scheduler remains. This removes measurable API
   work; it does not by itself prove an iPhone heat or memory-kill cure.
2. **Missing restart evidence after landing on Admin.** Verified report loading
   now installs the existing bounded boot/lifecycle diagnostics after both fresh
   owner approval and the active-panel check. No extra polling or navigation.
3. **Missing client identity.** New owner gameplay contexts store sanitized build
   hashes and pacing mode/counts. The report labels its current reporting runtime
   separately; it never assigns the current build to an older stored run.

Fallback retains normal native playback if timing APIs, easing syntax or a very
short effective duration cannot be supported safely; those effects are explicitly
not guaranteed capped. A physical display may still refresh above 60 Hz even
when this app's state changes are capped. Late starts and different animation
phases are not a global hardware refresh lock.

## Verification and remaining proof

- 155 targeted scheduler, CSS, gameplay, input, audio and owner-report checks,
  plus the 12 locale tests and production TypeScript/Vite build.
- Native HTTPS preview acceptance checks include pseudo-elements, transitions,
  CSS pause/resume, completion events/promises, reverse/alternate/overshooting
  curves, actual computed-style progress and cancellation reference release.
- Native browser and deployment outcomes are recorded separately after execution.
- Artwork, audio assets, simulation, collision rules, rewards, purchase/save/account
  flows and Mainnet are outside this change.

**Still open:** reproduce on the same physical iPhone with the exact new build,
start directly at boss 1 using existing Admin controls, and collect the existing
90-second timing capture. A contemporaneous Jetsam/termination record and a
Safari-versus-Pi-Browser comparison are needed to separate app rendering/memory,
WebKit/native-host failure and thermal slowdown. If native memory still grows,
isolate one renderer at a time in protected tests (reactor/masks, weapons canvas,
ordinary effects, audio), measure the effect, then correct the demonstrated path.
No claim that the Whitescreen is eliminated is justified by Node/Chrome tests.
