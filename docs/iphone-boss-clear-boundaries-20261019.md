# iPhone follow-up: boss clear, victory music and reward readiness

Public Testnet remains source `66eb357cc08a6b5f9b32a9242d6875ed475532fa`.
The isolated local baseline `92f392e2efe5608a7d589e2d14c2593a2626c5bb`
has the same source tree. Branch: `codex/iphone-boss-clear-boundaries-20261019`.
No additional public release is authorized or performed by this preparation.

## New device evidence

The user supplied a V4 report generated at 2026-10-19T14:24:05.411Z and
reported noticeably smoother normal blocks, followed by another problem.
The raw owner report is not copied into the repository.

This run ends in the second boss's clear phase: internal sector 20, bossId 2.
The first reactor shot was created, its audio call returned, its scene committed,
and the reactor subsequently reached volley 13. Boss defeat started at
1792419824773; defeat completion and the boss-clear resource snapshot followed.
The last trace event is `boss-victory-start` at 1792419830477 with clearTimerMs
5652. The current document began at 1792419834836: 4.359 seconds after that event
and 10.063 seconds after defeat. Its navigation type is `navigate`, route Admin.
This confirms a later document, not the cause or exact instant of interruption.

No boss-clear-ready or bonus-start event follows. The victory-start marker is
before the track lookup/source switch/play call; it does not establish that
music was enabled, playback began, or the audio ended. The FX audioState field
is not the music player's AudioContext state. Do not identify victory audio as
a proved cause from this report.

Known counters warm up then remain bounded: painted variants 48, hull sources
eight, Canvas texture entries eight, sample buffers 46. Near boss clear, known
estimated resources are about 38.9–39.5 MB. These omit native/GPU/total process
memory. No context failure or JavaScript fault is recorded. Missing fault
records do not prove that no process/native fault occurred. The export does
not contain an explicit build SHA, so timing and behavior are consistent with
the released candidate but are not an independent per-document source attestation.

## Owner-only candidate

Extend the existing verified-owner boundary observer, with no new global debug
API, listener, scheduler, audio object or periodic sampler. Mark each of these
boundaries at most once per fresh boss-clear encounter:

- No music track available, or victory source assignment completed.
- Victory play call returned, then its Promise settled.
- Victory ended callback entered after its existing source/encounter guard.
- Normal music source assignment completed, play returned, and Promise settled.
- Existing clear timer and music gate became ready.
- Physical heart/shard pickup succeeded and extra-life audio call returned.

The no-track branch and normal sequence are mutually exclusive. A normal
sequence produces at most ten new marks; a no-track sequence produces at most
four. Promise settlement includes false/rejection and is not proof of playback
or audible output. It neither awaits nor retries the original operation.

Duplicate marks are suppressed even if the ready condition remains true for
thousands of frames. Old pending settlements cannot log after bonus transition,
a later encounter or observer cleanup. Cleanup also drops the recorder reference
so an unresolved native playback Promise does not retain the GamePage recorder.
Existing sanitized owner-only export accepts the fixed technical event kinds.
Ordinary players do not construct this observer or attach Promise observers.
Admin permissions, login, API and backend code are unchanged.

## Validation

- Complete GamePage source equals the released baseline after removing only the
  explicitly enumerated observation lines/blocks. JSX, thresholds, simulation,
  source/volume/play calls, rewards, saves and exception behavior are preserved.
- Actual extracted victory-start and music-ended callback bodies produce the
  same audio calls, state and exceptions for owner/non-owner, disabled music,
  paused play, source failure and play failure scenarios.
- 44 focused reactor, clear-boundary, music playback, privacy and export tests
  pass, including all 50 real reactor models over 22,500 simulation steps.
- Additional game-loop, boss destruction, pickup and audio-resume regressions
  pass. The old destruction VM fixture now explicitly selects non-owner mode;
  its missing ownerDiagnostics variable was a fixture error, not a game change.
- Full frontend release build passes with VITE_CRYPTOID_DIAGNOSTICS=0, including
  12 localization tests and the existing localization release gate.
- No physical iPhone reproduction or native/GPU memory measurement is claimed.

## About a cleanup pause

The user proposed finishing each block cleanly and possibly pausing briefly
before the next block or after bosses. No new pause or gameplay reset has been
implemented as part of this diagnostic candidate.

The current boss clear already waits at least 9,350 ms of simulation time
(5,000 ms descent + 650 ms before victory + 3,700 ms), then additionally waits
for the victory playback gate and physical reward handling. Shots are already
removed during clear; normal transition resets enemy, projectile and finished
presentation arrays. Surviving pickups intentionally carry over.

A useful cleanup must release a specific expired resource, cancel an obsolete
callback or detach a stale reference. Waiting alone does not force JavaScript
garbage collection. Repeatedly dropping all reusable hull/audio/texture caches
would undo useful reuse and could add decoding/allocation work. Preserve the
new Canvas reuse while checking the remaining boss-clear boundary. No evidence
yet proves residual resources cause this reload.

Keep public Testnet on 66eb357 and Mainnet unchanged until a separate explicit
release instruction. If a focused owner test is approved later, use the existing
Admin boss-start facility around the second boss where possible; do not require
another entire campaign solely to recollect the same bounded counters.
