# Whole-display dimming during the boss interruption investigation

Evidence-only inspection, 21 October 2026. Runtime base is the reported official
Testnet `171cb5c4507a1530a9bbb080d61805be0da545f7`, tree
`490b444be6bb87e8a4438c06b3c4bc86114a486f`. No game source, CSS, artwork,
timing, audio, brightness setting, API or account behavior is changed here.

## New owner observations

The owner explicitly confirmed in this conversation:

* The entire display became darker, including system/browser UI, rather than
  only the playfield.
* The iPhone felt noticeably warm/hot.
* The iPhone was charging during that play attempt.

Do not ask those same questions again for this attempt. The observations increase
the relevance of thermal display regulation; they do not establish the cause of
the later document replacement. Charging method, ambient conditions, exact
temperature, brightness setting and precise dimming time remain unknown.

## Primary-source verification

Apple Support, [If your iPhone or iPad gets too hot or too cold](https://support.apple.com/de-de/118431),
published 19 May 2026, checked 21 October 2026: excessive internal temperature
can cause display dimming/shutoff and lower frame rates or longer processing
times. Graphics-intensive games and wireless charging are listed as situations
in which devices can become warm. Do not infer wireless charging in this case;
the owner confirmed charging without identifying its method.

Apple's [brightness guidance](https://support.apple.com/de-de/guide/iphone/iph60ba71065/ios)
also identifies ambient-light-driven automatic brightness. Whole-display dimming
alone cannot distinguish it from thermal regulation. The additional hot-device
observation supports the thermal hypothesis, without measuring it.

The [W3C Screen Wake Lock draft](https://www.w3.org/TR/2026/WD-screen-wake-lock-20260929/),
sections 1 and 11.1, permits the user agent to deny/release screen locks for
system/power conditions. A screen lock is not a brightness setting or a promise
that the OS cannot dim the device. Do not try to override the OS protection or
introduce aggressive reacquisition polling.

## Code findings

`GamePage` already calls `keepScreenAwake(navigator, document)` only while the
game status is playing and disposes it when that status changes. The exact
official `screenWakeLock.ts` requests a screen wake lock, releases it while
hidden/on cleanup and retries on visibility return or pointerdown. Pending
requests are released if play ended before resolution. Missing API or denial
is caught; it does not navigate, reload, pause or darken the page. The helper's
release callback clears its current sentinel without scheduling a retry loop.

There is no code setting the device's brightness or reading thermal status in
this inspected web-game path. CSS brightness filters affect individual rendered
artwork. The dark `.game-overlay` layers are inside the game; loading, pause,
menus, game-over and the scene error fallback control them. They cannot explain
system/browser UI dimming. The last captured status is playing; no overlay
transition is established by the supplied report. Fullscreen requests change
fullscreen presentation, not hardware brightness.

Wake-lock availability, acceptance and system release are not recorded in this
v5 report. The absence of a visibility-hidden event does not rule out a still-
visible dimmed display. Sparse frame samples and targetHz=60 do not measure
temperature, power draw or sustained presented FPS.

Twelve unchanged wake-lock/reload/resource-monitor tests pass; output is in
`iphone-display-dimming-20261021/logic-tests.txt`. They verify application control
flow and mocked API lifecycle only, not physical iPhone behavior. No new runtime
fix is justified solely by these passing tests.

## Supplied v5 run

Selected values transcribed from the owner's pasted report (not a full raw
report archive) are in `iphone-display-dimming-20261021/run-observations.json`.
The build identity includes static boss glow, idle rock surface release and
reactor-door reuse. The pending finished-hit/debris cleanup is absent.

* Boss 2 reactor-open observation: 12:15:17.756 UTC.
* First core shot creation/audio return: 12:15:19.501 UTC; scene committed four
  milliseconds later. The later run survives this initial operation.
* Last resource sample: 12:15:36.892 UTC, twelve native running animations,
  thirteen pacing entries, zero registered Canvas impacts, a 16-byte effect
  surface and 15,918,707 bytes of known/estimated resources.
* The session marker at 12:15:36.938 UTC is older than the latest heartbeat.
* Latest heartbeat: 12:15:39.191 UTC, still playing with open reactor, boss
  health 116.41355065620988 / 255.77355065621063 (45.51%), one escort, four
  projectiles, zero counted transient effects and twelve pacing entries.
* New document timeOrigin: 12:15:43.749 UTC, 4.558 seconds later. The lazy Admin
  boot diagnostic is recorded at 12:15:56.008 UTC; that additional delay is not
  the game-to-document interval. No regular exit appears in the available
  trace; navigationType=navigate does not prove an OS kill or a human action.

The final resource sample is not whole-process memory. In particular, native
graphics surfaces, GPU/WebKit memory and physical thermal state can be absent.
The counted effects field excludes several separately rendered hit/engine/heat
paths. No debris, shader, audio or reactor component is identified as culprit by
these counts. timingCapture is null, so this run adds no detailed work breakdown.
Keep thermal dimming, rendering pressure and the document replacement as related
questions to test, rather than treating one as proof of the others.

## Next bounded comparison

Keep the exact same released build, browser, brightness setting and comparable
boss/play path. Compare after the phone has cooled, with charging disconnected;
note whether whole-display dimming and the spontaneous interruption recur.
Do not change visual quality, disable thermal protection or simultaneously ship
another speculative optimization for that comparison. A different result would
support a thermal/charging contribution, not isolate which renderer or establish
a full fix. Avoid requiring another long campaign solely to reproduce dimming;
use the existing direct-boss controls where appropriate and label a direct-boss
run separately from an accumulated campaign.

If interruption persists, the missing decisive boundary remains native device
evidence at that time (WebKit/host memory/termination and timing), with the
existing owner timing capture where useful. A new instrumentation proposal may
record bounded wake-lock lifecycle and current overlay state, but must not label
those fields as temperature or brightness measurements.

Official Testnet remains 171cb5c / READY dpl_729MdmJke7jMhhX28Ukh8EqbXo8T.
The separate tested finished-hit/debris candidate remains
`5c6cc88bde5f4eaf48f28f5e5915c4b3b81ebbbc` on
`codex/finished-hit-debris-cleanup-20261021`, not published. Preserve it and all
fixed release/rollback refs. This audit branch has automatic deployment disabled;
no deployment or Mainnet contact is authorized/performed by this inspection.
