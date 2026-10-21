# Boss completion when native audio reports playback without progress

The owner's v5 report generated 2026-10-21T19:29:39.007Z now records actual
gameplay on published b92ab45bc1e493fb86c36da4f01bd88d15a5f498 / tree
9f68861ff277ef7a4b92da7392d82611333c6a29. The preceding report's 25d80d4f
unexpected-restart marker is detected when this game monitor starts; its stored
sector-50 context is historical. The current run ends with pause, saved-exit-intent,
unmount and finished=true, not a newly recorded unexpected restart.

## Measured sequence (Europe/Vienna, 21 October)

| Event | Local time |
| --- | --- |
| Current game monitor begins / prior interruption is detected | 21:28:14.225–226 |
| Resumed boss reactor observed open | 21:28:27.473 |
| First reactor projectile created / audio call returns | 21:28:29.302–303 |
| First reactor projectile's React scene commits | 21:28:29.309 |
| Boss defeated | 21:28:45.648 |
| Victory cue requested | 21:28:51.311 |
| Last playing heartbeat, clear timer 16048 ms | 21:29:01.701 |
| Saved exit requested, paused clear timer 16367 ms | 21:29:04.679 |

The effects clock remains exactly zero despite state=running. One detected
stall and one attempted recovery are recorded; blocked effect starts rise
24→156→416→462. These are rejected starts, not 462 retained voices. Current
resource samples have zero effect voices after the guard drains them. Repeated
28-voice flight samples reuse a heavy snapshot for up to ten seconds; they do
not establish fresh repeated allocation. Known resource estimates finish near
15.55 MB, DOM 413, two canvases, no pending painted work. This does not measure
native/GPU/process memory or identify an OS/browser termination cause.

The resumed fight passes six core volleys, defeats the boss and keeps running
through the defeat scene at roughly 57–60 RAF frames/s. Combat windows are slower,
roughly 41–54 RAF frames/s, with simulation p95 around 1 ms. Long Tasks is not
supported. No new document boot occurs during this continuation. The current
document is the same post-interruption document as before, now about 17 minutes
old. The audio correction did not produce an advancing effects clock in this case.

## Demonstrated conditional defect

The current GamePage waits beyond its normal 9350 ms boss-clear duration while
the victory media claims playing and has not emitted ended. Native media can
hold paused=false with a frozen playback position (including a never-settling
play promise), leaving this condition true indefinitely. The real previous
GamePage expressions fail three controlled cases: frozen media, media frozen
while the Web Audio clock advances, and a stall following initial progress.

The report does not include music media/clock counters or physical-heart state.
It cannot distinguish this media gate from waiting for the player to collect
the heart. The conditional defect is reproduced in the real code; attribution
of this particular 16.367-second wait remains unproven. The existing physical
pickup requirement is retained, with no automatic life/reward/bonus grant.

## Correction and limits

MusicPlayer.waitingForEnd observes actual media-position progress using the
existing active simulation time. Two active seconds without media progress no
longer hold completion open after the existing normal clear duration. Measured
progress continues waiting for ended, including playback extending beyond the
nominal duration. Pause, source change and close reset the observation. The
small observation object is reused during frames. No timer, RAF, listener,
replacement AudioContext/media element, audio graph node, gain/seek change or
new audio file is added. AudioClockRecovery and GameAudio stay identical.

Seven owner-only fields join the existing bounded resource snapshots and both
sanitizers: music state, clock, media position, paused/ended flags, track enum,
and bossHeartCollected. Ordinary-player collection remains disabled. There is
no new transmission, interval or raw URL/account field. This closes the missing
distinction in future evidence without requiring a full campaign.

This patch prevents one demonstrated indefinite audio wait. It does not claim
to restore native audible output, explain the preceding White Screen, or prove
the browser's native media behavior has been reproduced on the owner's iPhone.
The existing 9350 ms clear duration, full healthy jingle, life collection,
rewards/cards, saves, graphics/debris, combat and Mainnet are preserved.

## Validation

132 focused tests pass, including seven new actual-gate/progress/sanitizer/source
parity cases and the existing 50-boss physical-heart rules. Whole GamePage
matches published b92 after exactly normalizing the single wait substitution
and owner-counter additions. The older owner-recorder parity guard recognizes
those exact changes. The owner report fixture's stale ten-read expectation is
corrected to fourteen, accounting for the already existing v5 current/previous
flight recorders in both stores. No Admin runtime/UI is changed.

Two historical source comparisons remain explicitly excluded because their old
Git objects lack the required files, as in the preceding releases; they are not
counted as passing. Final build/types/12 locales/release language gate and lint
for the three edited TypeScript utility modules pass. Existing npm proxy,
backend module-type and large-bundle warnings remain. An initial build caught
the missing GameDiagnostic type extension; that is corrected before final QA.
The original controlled failure is observed before the runtime patch. Final
logs are in the sibling directory.

Continue the authorized Testnet audio/stability correction only. The candidate
branch codex/boss-victory-audio-progress-20261021 has auto-deployment disabled.
Preserve fixed source/receipt/rollback refs, Mainnet and earlier runtime-log and
protection-bypass denials. Previous fixed b92 source/deployment remains the
immediate rollback. Publication details belong in the separate release receipt.
