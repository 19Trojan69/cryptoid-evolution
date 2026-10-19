# V4 iPhone follow-up: first reactor volley

The owner supplied a complete V4 local report generated on 19 October 2026.
It contains 52 resource samples spanning approximately 8 minutes 30 seconds,
covering levels 1–20. The original report remains private and is not copied here.

The known resources warm up, then plateau: 48 painted variants, eight hull
sources, eight Canvas texture entries and 46 audio sample buffers. In the second
boss fight the known byte estimate remains 38.85 MB, Canvas failures stay zero,
and DOM/animation counts do not grow monotonically. These estimates omit some
browser/GPU resources and are not a total process-memory measurement.

The final sample is in boss 2's exposed-reactor phase, not a level transition or
defeat. All three turrets are destroyed; core elapsed is 1669 ms and core volley
is zero. Existing code allows the first core shot at 1800 ms when a projectile
slot is available. Level 20's first reactor escort is eligible after 3000 ms.
The recorded state therefore precedes the first potential reactor shot by
131 ms of simulation time, and escort eligibility by 1331 ms. The last saved
sample is about 12 seconds before export; the exact crash instant is unknown.

No JS exception, foreground gap of at least 500 ms, context-loss notification,
page-hide event or new document boot is present in the final trace window.
This does not establish a WebKit/process kill or implicate the core shot. The
session marker being about 9.6 seconds older is expected with its 10-second
write interval. It is not evidence that the loop stopped at that older marker.

The existing boot collector starts in verified-owner gameplay. Exporting from
Admin after returning Home does not start it. Missing boot records therefore
cannot rule out a document restart. The read-only export now additionally
includes the current document's time origin, age, navigation type and coarse
route. No full URL or query string is included; it performs no new writes.

The optional owner-only observer records at most five reactor boundary events
per encounter: open observed, before first shot, shot created, audio call
returned and first React scene layout committed. A layout commit is not proof
that the browser/GPU painted the scene. The observer does not mute, skip, delay
or modify any core/escort attack and adds no timers or listeners. Resumed prior
volleys are not mislabeled as first shots. Diagnostic failures remain optional.

This is a diagnostic candidate based on V4 release `f600735`, not a crash fix.
The official Testnet/Mainnet aliases must not move without an explicit release
instruction. Validate on the actual affected iPhone before drawing a cause.

Validation: 50 actual boss models compared with/without the observer over
22,500 simulation steps; identical states and projectile outputs. Targeted
core, escort, recovery, privacy and export tests; full frontend build including
the localization release gate; complete GamePage preservation comparison.
No physical iPhone/browser paint verification is claimed.
