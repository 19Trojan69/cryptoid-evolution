# Silent continuation and retained audio sources

Prepared on the official Testnet source 4c25790a8b7173edda9f2ef9370f0251e716f668,
tree 88063f617e2321705b19af0dfb3dcb22b6bce491, plus its separate release receipt.
No new deployment is performed. The candidate branch has auto deployment off.

## Evidence from the owner

The report generated 2026-10-21T17:07:02.373Z describes continuation with neither
music nor effects, followed by another white screen and automatic return Home.
The owner additionally reports occasional hanging sound/music around Pause.
This is distinct from voluntarily leaving the game.

The continuation starts with zero registered voices at level 21. Counts grow
through 48, 85, 144, 237, 648, 1002, 1477, 2007 and 2060, then 2086 at the last
normal transition. The getter counts retained source records in actual Sets;
these are not a cumulative "sounds played" metric. Effects account for 2021
of the final 2086 records. PCM buffer bytes remain 7,660,648 and do not include
native source/graph memory. State is reported running throughout; neither
currentTime nor audio output was measured in those resource snapshots. Thus
retained voices are observed; a frozen rendering clock is a hypothesis.

The latest trace passes boss 30, its bonus and levels 31–35. Last transition:
normal level 36 at 19:06:45.128 Vienna; ring saved 45.146; next document origin
47.432. The unexpected-restart event referring to bonus 20 is from the previous
incident, retained separately. The final phase-complete-only ring can result
from phase flushing/write throttling and does not locate a synchronous throw.
There is no recorded JavaScript fault or normal exit. RAF intervals and React
timing do not measure displayed FPS or GPU/native memory. Long Tasks unsupported.

## Demonstrated fault and correction

Old GameAudio removes sources on ended. If native ended never arrives, effects
stay in the Set and graph. Retiring a weapon removes it from the active cap but
leaves its fading mix record until ended. Pausing formerly cleaned effects and
the active weapon list; already retiring weapons could remain. With a running
but stationary native clock, further sources can be scheduled at the same time
and never finish. This is a real failure path; its causal role in either
Whitescreen is not established.

Each source now keeps its original scheduled audio end time, including buffer
playback rate, delayed tones and the existing 18-ms weapon fade. Existing playback
attempts release it only after actual audio currentTime passes that deadline
plus one full second. Healthy ended events still release immediately. No sound
is shortened to enforce an arbitrary simultaneous-voice budget.

A small timer-free clock observer detects two seconds of stationary currentTime
across frequent foreground playback attempts. Long request gaps, hidden pages
and explicit pauses do not count as foreground clock evidence. On a detected
stall, stop/disconnect the queued sources and stop creating more. Attempt one
suspend/resume on the same graph. Pending, throwing or rejected native recovery
does not spawn repeated recovery work. Advancing native time permits new sounds;
failed hosts remain blocked until clock progress or lifecycle replacement.
This guard is not a diagnosis of every possible native audio failure.

Pause now stops/releases every registered weapon, including retired fades, and
zeros the existing music gain while a native play request is pending. Resume
restores the original volume only at playback, not during the countdown. The
explicit Resume gesture also cycles an already-running paused effects/music
graph before asynchronous account/countdown work. Initial suspended contexts
still resume immediately inside the gesture. Keep the same media element,
track/seek, graph and cached samples. Pending frozen music recovery is shared;
a later genuine gesture can still retry initially blocked autoplay. Stale
completion cannot revive closed audio or override a newer playback epoch.

The existing owner-only 10-second resource snapshots now include effects
audioClockMs, audioClockStalls, audioRecoveries (attempt count), audioBlockedSounds
and audioReapedVoices. These are bounded/sanitized on export. No new sampler,
network request, listener, RAF, UI, account or storage-access gate is introduced.
Music clocks remain available through the existing explicit owner audio audit.

## Verification and limits

The preceding GameAudio blob 9087ef938b7b1520357c11eaa34320c33c2eaef4 and candidate
run against the same controlled host. Under a frozen clock/missing-ended host,
2086 old sources are retained; the candidate's peak is <=21, then zero registered
sources. One pending native recovery is issued. Completion after close does not
resume the old graph. A running clock with missing ended is tested over 10,000
effect/weapon pairs with bounded registration and no live-source disconnection.
500 healthy groups (effect, enemy weapon, seven-note extra life) exactly match
preceding scheduled time, stop, buffer duration, playback rate and gain.

Tests additionally cover successful, rejected, throwing and indefinitely pending
recovery; same-element music; silent countdown; stale native completion; all
fading weapons on pause; delayed envelopes; background gaps; export sanitation;
and initial autoplay retry. Existing gains, samples, boss cap and overlap tests
remain. The whole-GamePage guard allows only the exact audio-resume plumbing and
five new owner fields; simulation, input, save/recovery, scene markup and gates
remain otherwise identical. No CSS/artwork, account, API or gameplay change.

One older ownerAudioAudit source comparison is excluded because its historical
Git object lacks GamePage in this checkout. It failed before reaching an
assertion and is not reported as passing. The newer complete source guard is
included. Initial new-fixture failures were fixed: the count-based pause checks
expected only active sources, and one recovery assertion included the first new
source. Tests now check release of all registered sources and distinguish new
post-recovery sources. One TypeScript diagnostic whitelist omission was corrected
in GameDiagnostic. No failed test or missing evidence is device proof.

Run: node --experimental-strip-types --test
--test-skip-pattern='the whole simulation matches approved runtime'
src/pages/{audioClockRecovery,gameAudio,musicPlayback,gameAudioResume,ownerAudioAudit,
ownerFlightRecorder,reloadDiagnostics,stabilityReport}.test.mjs from frontend.
Focused results: 81 pass. TypeScript, 12 locale tests/release gate and Vite build
pass; existing large-chunk warning remains. Audio module lint passes. Final
logs are kept alongside this report. These hosts do not render physical iPhone
audio, native/GPU memory, temperature or OS termination causes.

Primary sources checked for the hypothesis and clock semantics:

- https://bugs.webkit.org/show_bug.cgi?id=263627 (historical reports of running
  state with stationary time, with suspend/resume sometimes helping).
- https://bugs.webkit.org/show_bug.cgi?id=276016 (historical iOS interruption
  reports; does not establish the same bug on this device/version).
- https://webaudio.github.io/web-audio-api/#dom-baseaudiocontext-currenttime
  (audio scheduling uses the rendering clock, not wall time).

The candidate is prepared and preserved only. Official Testnet remains 4c25790a;
Mainnet, all release/rollback references and prior runtime-log/protection
permission denials are preserved. An actual device run is required to assess
the audible recovery and whether the white-screen problem still recurs.
