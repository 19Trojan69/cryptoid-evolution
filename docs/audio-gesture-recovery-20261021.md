# Native audio Resume gesture correction

The owner tested published b026a194cdb596349b041c910d22b115eeb1560b / tree
4257adb659718cce79af3558bcef4b9d2f4c74bd, left to paste a report, returned and
pressed Resume. Music and effects were silent again. The report generated
2026-10-21T17:56:42.908Z now directly measures the effects clock staying at zero
across first spawn, formation and subsequent active combat while state=running.
audioClockStalls becomes 1; blocked requests grow 25→135; registered voices stay
zero. One recovery attempt is recorded. This confirms a stopped effects clock
and successful allocation blocking, not successful audible recovery. Music's
clock is not included in this report, so its exact native state is unmeasured.

Continuation boot 22734c27-1f3f-4ea4-a91b-05438e712a90 matches the preceding
report's active document; no further document boot is shown during this short
continuation. It ends with Pause, saved-exit-intent, unmount and finished=true.
The unexpected-restart sector-48 record at 19:55:50.334 Vienna is recorded when
the new game monitor starts and refers to the prior active-session marker. It
must not be counted as a new automatic crash in this continuation. The owner's
earlier white-screen reports remain separate unresolved evidence.

## Demonstrated code path

The previous AudioClockRecovery (actual Git blob adb330660a6dbee5fd5e08d06ed65ebfcf976923)
forces suspend on a fresh running graph during Resume. Native resume is invoked
only in suspend's promise continuation. With a gesture-gated host this occurs
after the click ends, leaving currentTime=0; with a never-settling suspend,
resume is never issued at all. State=running alone cannot establish rendering.

The shared observer now makes the first native resume request directly even
when the host already claims running, and retries directly within explicit
Resume for a never-rendered graph. A previously rendered paused graph queues
suspend and resume synchronously, in that order, before waiting for either
promise. Both native calls retain the actual Resume gesture. A genuine clock
advance clears a stale pending-operation gate; an identity guard prevents an
old completion from clearing a later recovery. Music checks an already-blocked
clock before coalescing its pending play, allowing measured recovery to proceed.

The change preserves the same contexts/media element, decoded samples, seek,
sound parameters, overlap, cleanup deadlines and frozen queue guard. No new
timer, RAF, listener, context or ordinary-player diagnostic is added. GamePage,
GameAudio, combat, saving, account calls, debris and artwork remain byte-identical
to the published source. The two runtime changes are the shared observer and
one blocked-clock observation in MusicPlayer.

## Verification

91 focused tests pass, including five new cases: old versus new zero-clock
gesture, actual effects/music with a delayed account/countdown boundary,
previously rendered interrupted graphs, a previously primed but never-rendered
graph, and rendering progress despite an unresolved native promise. The earlier
2086-source negative control, 10,000 missing-ended pairs and 500 healthy sound
parameter groups still pass. Current Admin callbacks and whole-GamePage parity
guard pass. TypeScript, 12 locales/release gate, Vite build and audio lint pass.
The existing large-chunk warning remains. Final logs are in the sibling folder.

Two historical comparisons are explicitly excluded, not reported as passing:
ownerAudioAudit's old GamePage source (53640c01...) and Admin's old source
(613b3c7e...) are absent from their historical Git objects in this checkout.
The first broad run also exposed a lifecycle fixture missing native resume;
that API is now supplied. A count assertion now includes up to four genuinely
new sounds admitted before promise completion. The new pending-native case
caught a coalescing-order issue; observing only already-blocked music fixes it.
All were resolved before the final passing run; no failed run is device proof.

Command from frontend: node --experimental-strip-types --test
--test-skip-pattern='the whole simulation matches approved runtime|the official
Admin start reproduces a suspended music/card graph after the server boundary'
src/pages/{audioClockRecovery,gameAudio,musicPlayback,gameAudioResume,ownerAudioAudit,
ownerFlightRecorder,reloadDiagnostics,stabilityReport,adminGameAudioStart}.test.mjs

The Web Audio specification's resume/suspend algorithms queue native control
messages before returning their promises:
https://webaudio.github.io/web-audio-api/#dom-audiocontext-resume
This supports the call ordering; it does not establish the exact internal cause
of the owner's WebKit failure. The conditional gesture failure is reproduced,
but actual iPhone audible recovery, native memory and white-screen causation
remain unproven. The owner must test the delivered change on the device.

This continues the authorized Testnet audio correction only. Preserve Mainnet,
all fixed refs, and earlier runtime-log/protection-bypass denials. The candidate
branch codex/audio-gesture-recovery-20261021 has automatic deployment disabled.
See audio-gesture-release-20261021.md for final publication status.
