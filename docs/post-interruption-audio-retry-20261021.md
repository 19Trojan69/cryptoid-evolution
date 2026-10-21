# Explicit audio retry after an interrupted automatic recovery

The owner reports another White Screen and return to Home during the defeated
boss-70 jingle on published 25d80d4fea43bd18b9c3ce643a1766cde537114e / tree
36c1887d871364b8721c9db8a7c19cd940d67b83. Immediately choosing Resume afterwards
again produces complete silence. Starting again at level one is not required
for diagnosis and would replace the current run; no evidence links the failure
to corrupt saved progress. Reloading may recreate audio state, but is not an
established recovery on this device.

## What the boss report establishes

The previous recording remains active, visible and unfinished. No saved exit,
unmount or JavaScript fault is recorded. The sector-48 unexpected-restart event
belongs to the older b026a194 run, not this boss-70 interruption. The new boot
after the active session and the owner's observed White Screen are fresh evidence.
The terminal sequence on 21 October, Europe/Vienna:

| Event | Local time |
| --- | --- |
| Boss defeated | 20:34:46.724 |
| Final blast | about 20:34:51.745 |
| Boss canvas release | about 20:34:51.864 |
| Victory cue requested | 20:34:52.390 |
| Last resource sample | 20:34:52.815 |
| Last heartbeat | 20:34:54.073 |
| New document origin | 20:34:57.502 |

The heartbeat continues 1.683 seconds after the cue request. The last resource
sample has one active effect voice, advancing effects clock 603155 ms, zero
stalls/recoveries/blocked starts and about 15.98 MB of known resource estimates.
Painted entries are 19, pending work zero, effect canvases zero. The existing
flight recorder's runtime counters can be up to ten seconds old; its last two
second window is not a final frame. The music clock and native/GPU/process
memory are not measured in this report. A 55 ms frame and one 33 ms transition
are present; neither proves termination cause. Earlier boss-50 and boss-60
victory sequences pass in the same recording. The MP3 is 3.408 seconds, 82647
bytes, 48 kHz stereo and decodes through ffmpeg with -xerror and no error.
That does not test WebKit decoding or device audio. No jingle, animation or
bonus-transition fault is demonstrated, so none is changed.

## Reproduced continuation fault and correction

The actual preceding clock implementation is loaded from local commit
1dc329f210346eedfeea0f40ca80b66dc54b7601 (the published source's identical tree).
When automatic recovery has a pending native promise, explicit Resume returns
that same promise before making another native call. A completed failed
automatic attempt is also blocked by the one-attempt flag. A new user gesture
therefore cannot recover these cases. The controlled preceding-source test
keeps the clock at zero; the candidate issues a fresh resume in the gesture.

Explicit Resume now retires the old promise's generation and permits one new
attempt. A never-rendered clock requests resume directly; a previously rendered
paused clock queues suspend then resume synchronously. The existing known-stall
allocation guard remains until measured progress. Late old completion cannot
clear a newer operation, replay queued effects, or revive a closed context.
Automatic requests still share one pending attempt and do not grow a retry loop.

Only AudioClockRecovery.ts changes runtime behavior. Same context/media element,
seek, gains, samples, overlapping effects, automatic bounds and cleanup remain.
GamePage, MusicPlayer, effects implementation, saves/accounts, gameplay, debris,
artwork and Mainnet are unchanged. No new timer, RAF, listener or telemetry.
This is a demonstrated recovery bug, not proof of the exact post-White-Screen
device state. Audible recovery after that failure still needs device confirmation.

## Verification and publication scope

95 focused tests pass, including four new tests: preceding-source comparison,
actual effects/music retry with discarded queue, a failed settled automatic
attempt, and rendered pending recovery with late-completion/close protection.
TypeScript, 12 locale tests/release gate, Vite build and clock-module lint pass.
The existing large-chunk warning remains. Two unavailable historical comparisons
are explicitly excluded, as in the preceding release. The newer full GamePage
parity and current Admin callback guards pass. The first unfixed counterexample
fails as expected; an accompanying pending-promise test required stopping before
the fix. A subsequent assertion was corrected to require two observations after
native suspended state; final logs are in the sibling directory.

Continue the already authorized Testnet audio correction only. Fixed source and
rollback refs stay fixed, automatic branch deployment is disabled. Preserve
earlier runtime-log/protection-bypass denials. See the separate release receipt
for publication status. The White Screen remains unresolved.
