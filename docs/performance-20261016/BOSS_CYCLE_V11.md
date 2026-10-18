# Original boss cycle and controlled pause verification — 18 October 2026

The user authorized continuation after the completed Pi v10 block test.
This experiment keeps the candidate private and retains the original special
boss artwork, fall/blast budget, turret/core projectiles, timing and audio.
Only ordinary explosion/shatter effects use the already tested bounded Canvas.
No public alias or original GamePage/gameAudio/index.css source is changed.

## Test story and boundaries

The story is private test start → original GameEntry → last normal block at
sector 19 → ordinary boss warning/entry at sector 20 → turret and reactor
combat → original fall/final blast/victory/heart → ordinary bonus round →
normal play at sector 21 and beyond → renderer cleanup and report export.
Sector 20 is boss configuration 2 (the HUD's second campaign level).

After eight seconds of warmup, the phase durations are eight seconds of refill
stress, one hundred seconds for the complete boss cycle, then eight seconds of
refill stress. First 1500 ms per phase are excluded from measurement. The test
does not jump over a boss defeat, heart collection, bonus wave or return.
Ordinary shot emission and real turret/hull collision paths cause the defeat.
Existing lives are maintained and the pilot aims/collects the heart. Normal
enemies are one-hit fixtures; after eight seconds of original boss firing,
remaining turret health is lowered to at most one, while original maximum
health and firing logic stay intact. The exposed hull is weakened only after
the original reactor has fired. These controls verify lifecycle and renderer
behavior, not normal difficulty, player skill or a scored/account campaign.

Two pauses use application-scaffold clicks on the **original** Pause and
Resume controls: one during the boss fight and one after returning to normal
play with active Canvas effects. Each has a 1500 ms hold followed by the
original three-second countdown. The first pause may have no normal Canvas
effect active; the second explicitly requires an active registration. The
fingerprint checks player/shot positions, phase, weapon/shield timers, boss
elapsed time, health and turret health. The Canvas draw count is compared
after the pause has reached the paused frame. A pause must resume within
eight seconds; unexpected pauses still abort the test.

Paused frames do not enter frame/work samples, and the volley-gap anchor is
cleared during the expected pause. Phase wall time still includes both pauses.
The controller checks explicit boss milestones before claiming completion:
all boss/bonus encounters, real turret-burst/fall/explosion effects, turret and
reactor fire, heart collection, normal post-boss frames and both browser pause
checks. Missing milestones produce `coverage-incomplete`, not a successful
completed report. All diagnostic traces and effect-kind counts are bounded.

This does not reproduce or establish a fix for the user's earlier loss of
manual input after a boss: the diagnostic pilot owns movement. It also does
not test all fifty bosses, long account sessions, background return, purchases
or durable rewards. Visual and audible confirmation remain separate from
simulation/resource counters. Boss-specific display stays on its original
renderer rather than being silently replaced by the ordinary Canvas effect.

## Local verification

Sixteen startup/controller/artwork/geometry tests pass, including expected
pause accounting, abort on unexpected pause and rejection of missing boss
coverage. The real GamePage simulation integration passes at 16 and 50 ms
steps with rendering, audio and APIs stubbed. Both integrations observe all
ordinary boss and bonus transitions, three real turret bursts, one boss fall,
one final boss explosion, twelve turret shots, one reactor volley and heart
collection. At 16 ms it returns to sector 21 and continues to sector 26;
at 50 ms it returns to sector 21. Emergency fixture resets and issues are zero.
Reference phases retain 20 / 20 salvos at 16 ms and 14 / 14 at 50 ms; the
unchanged 34 ms cap yields 100% / 68% accepted time respectively.

The Node VM lacked the browser's `atob` function at the first real hull-mask
collision. The harness now supplies Node's equivalent `atob`/`btoa`; this was
a test-host deficiency, not an observed game/browser fault. DOM controls are
absent from that VM, explicitly recorded as pause unsupported there. Only the
actual browser run can establish the two original-control pause checks.

Build proof and simulation integration exports are retained alongside this
document. The completed browser report and deployment checks are recorded below.

## Private deployment

Build `device-replay-20261018-v11-boss` uses deployment
`dpl_7G8RN8GeUFA2GMjj1pVnFYCMAbX4`, host
`cryptoid-evolution-testnet-ebswhk6c0-19-trojan69.vercel.app`.
It is READY with target null and no aliases in the existing Testnet project.
The deployment-scoped share token is not stored in Git.
Its expiry is 19 October 2026 at 12:36:02 UTC (14:36:02 Vienna).

## Completed Chrome run

The final deployed preview completes in 124,046.4 ms on visible Chrome 154,
1363 × 936, DPR 1, with sound enabled. Completion, reason and required
milestones are checked from the exported report; issues, blocked requests,
emergency fixture resets and renderer failures are all zero.

| Phase | Delivered FPS | Accepted time | Frame p95 / max | Salvos |
| --- | ---: | ---: | ---: | ---: |
| Refills before | 59.55 | 99.76% | 16.7 / 49.9 ms | 20 |
| Complete boss/bonus/return cycle | 59.34 | 99.28% | 16.8 / 183.3 ms | 136 |
| Refills after | 59.71 | 100% | 16.8 / 33.3 ms | 20 |

The middle FPS is an aggregate across the full hundred-second cycle,
including normal combat, boss phases and bonus play. It does not establish
that the boss's final explosion itself renders at that FPS. The 183.3 ms
maximum is retained as a real observed long frame; this report does not
attribute it to a specific scene or claim all stalls are gone.

The trace observes normal sector 19, boss warning/entry and fight at sector 20,
boss clear, bonus and normal sector 21. The run continues to normal sector 23,
with 1278 post-boss playing frames. All three turrets are destroyed through
real collision effects, followed by one original fall and one final explosion.
Nine turret shots and one reactor volley are observed before defeat. Heart
collection is true. The bonus round is not cleared by an injected shortcut.

| Original-control pause | Total hold + countdown | Timers/positions frozen | Canvas draw counter frozen | Active Canvas effects |
| --- | ---: | --- | --- | ---: |
| During boss combat | 4529.3 ms | yes | yes | 0 |
| After normal play returns | 4523.2 ms | yes | yes | 1 |

The first counter freeze alone is an idle-Canvas observation. The second
observes an active normal effect registration with a frozen draw counter;
both pause paths then resume through the original countdown. The synthetic
application-scaffold control clicks do not prove manual pointer recovery or
an audible hardware output. Those limitations are not converted into fixes
for the earlier un-reproduced input freeze.

Retained decoded hull entries are four/eight/eight; cumulative loads are
4 / 39 / 43 and unused evictions 0 / 31 / 35. The cache ends at 2,544,768 bytes.
Textures grow from four to six original-size entries and remain at
1,121,068 bytes in the latter phases. Full original-display preparation
fallback mounts are 0 / 35 / 4, with no renderer failure. This is expected
cold-asset display fallback, not omission or zero fallback duration.

Final candidate scheduler, registrations, source images, texture entries,
cache bytes and backing-store bytes are zero. The downloaded JSON exactly
matches the application's report textarea; the copy control shows success.
The raw report and final completion screenshot are preserved in this
directory. No equivalent Pi v11 run is available yet.

Final public aliases still identify their initial deployments:

- Testnet: `dpl_BX7ZeCr9Qr6anBa3AZnzLERubpQM`, commit
  `27d174788327c3423f04ace32be61af67a2004cc`.
- Main: `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe`, commit
  `907d2a7363345d00f0f90c54402bf04e887b64d9`.

Only the isolated diagnostic preview is deployed. The tested original game,
audio and stylesheet source hashes are unchanged.
