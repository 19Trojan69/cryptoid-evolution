# Audio graph initialization — 22 October 2026

Status: tested preparation only. No preview, Testnet or Mainnet deployment.

## Authorization and baseline

The owner accepted the proposed isolated correction and failure tests with
“Dann beginnen wir.” Publication is not part of this step.

- Candidate branch: `codex/audio-graph-initialization-20261022`; automatic deployment disabled.
- Official Testnet remains source `9b5f07c55a1f440ca925ee49b002bb223241793a`,
  tree `d92cd586d6257357de893c2357960e6c2cd116bc`.
- The local equivalent `759b63e853023a1c9bf44e91c69d6872cef9b029` has that exact tree.
- Starting receipt: local `e807bc8a9ec9519d66f143e2f138c233313bb47b`;
  remote equivalent `d37c195beebd4d1c4106480ad33422587eaa9b03`.
- Keep every fixed source/rollback reference unchanged. Do not deploy a receipt branch.

## Conditional defects and corrections

### Effects

The preceding implementation stored the context before constructing the gain/
compressor output path. A setup exception rejected the first start. A subsequent
start skipped setup because a context existed and could return true with no output
connection.

The candidate retains the same usable context but constructs the bus/limiter in
local variables. It publishes them only after the complete output path connects.
Failure disconnects partial nodes and returns false; a later start retries setup.
The running getter requires the completed bus as well as native running state.
A defensive null guard also satisfies TypeScript after the atomic setup.

The healthy path keeps the original effects gain, compressor parameters, sample
decoding, scheduling, buffers, pitch, envelopes, overlap and pause/close behavior.

### Music

The preceding implementation bound the media element before allocating its gain.
A later allocation/connection failure closed that context. The media element could
then claim playback while remaining routed through a closed graph. A new source
cannot simply rebind the same already-bound element.

The candidate allocates/configures the gain before media binding. It retains the
same context, gain and any successfully created media source on a setup failure,
disconnects incomplete links, pauses the element and reports false. A later
play/unlock reconnects those same handles instead of closing/replacing/rebinding
the unlocked element. A graph-ready flag prevents incomplete-path success.
Close retires partial graphs as well as complete graphs.

The original HTML audio fallback is retained when AudioContext is absent or its
constructor is unavailable before any binding. Pause/countdown silence, current
media position, source changes, gains and epoch protection remain.

This is output-path readiness, NOT an audible-output measurement. A connected
native graph may still have the previously observed frozen clock. The clock
recovery/allocation guards are unchanged.

## Verification

`frontend/src/pages/audioGraphInitialization.test.mjs` contains 22 tests:

- Exact published-tree identity and byte equality of GamePage, clock recovery,
  card sound and boss rewards.
- Four negative controls execute the actual preceding source under the same host.
  They reproduce effects false-success and closed/bound music output.
- Seven effects setup failure points: constructor, gain creation/value,
  compressor creation/configuration, gain connection and final connection.
- Five music failure points: gain creation/value, media creation, media connection
  and final connection.
- Failed play never starts native media or reports playing; a valid retry works.
- 1,000 repeated music connection failures retain one context, one media element,
  one source and one gain; final retry/close succeeds.
- 1,000 repeated effects failures reuse one context, disconnect temporary nodes
  and allocate no voices; final retry/close succeeds.
- Closing an incomplete music graph prevents revival.
- 100 healthy music pause/unlock/play/source-switch cycles use the same graph
  and preserve the original gain.

Before runtime correction: 6 tests pass and 16 fail. After correction: all 22 pass.
The failure host models injected native errors; these are not observations from
the owner's iPhone. Temporary disconnected effect nodes are left to native GC
after releasing application references, not claimed as measured native reclamation.

The final broader command passes **154 tests**:

```sh
node --experimental-strip-types --test \
  --test-skip-pattern='the whole simulation matches approved runtime|the official Admin start reproduces a suspended music/card graph after the server boundary' \
  src/pages/audioGraphInitialization.test.mjs src/pages/bossVictoryAudio.test.mjs \
  src/pages/bossReward.test.mjs src/pages/audioClockRecovery.test.mjs \
  src/pages/gameAudio.test.mjs src/pages/musicPlayback.test.mjs \
  src/pages/gameAudioResume.test.mjs src/pages/ownerAudioAudit.test.mjs \
  src/pages/ownerFlightRecorder.test.mjs src/pages/reloadDiagnostics.test.mjs \
  src/pages/adminGameAudioStart.test.mjs scripts/stabilityReport.test.mjs \
  scripts/ownerStabilityReport.test.mjs
```

Two historical comparisons remain explicitly excluded, not counted as passes,
because their old Git objects do not contain the required files. The current
whole-GamePage parity checks remain in the passing set.

`npm run build` passes: 12 locale tests, release-language gate, TypeScript and Vite.
The first build exposed a nullable-context type error introduced by the atomic
setup; it was fixed before the final passing build/tests. Its log is retained.
Targeted ESLint of both changed runtime modules passes with no output.

The workspace's node_modules symlink targeted a removed temporary directory.
Dependencies were restored there from the unchanged frontend manifest ranges.
No project manifest or lockfile was changed. This run used Node 24.19.0,
TypeScript 5.9.3, React/ReactDOM 19.3.1, Vite 7.3.7 and ESLint 9.39.5.
The initial missing-TypeScript attempt and no-lockfile npm-ci attempt were setup
failures, not test results. Existing proxy-config, backend module-type and large
bundle warnings remain; they are not described as a clean entire-project lint.

## Scope and remaining uncertainty

Only `gameAudio.ts` and `musicPlayback.ts` change runtime behavior.
GamePage, AudioClockRecovery, cardSound, audio preferences, owner instrumentation,
Admin, boss core/rewards, CSS, artwork/audio assets, backend and API are unchanged.
There is no new timer, RAF, listener, telemetry, audioSession workaround, healthy
context/media replacement, account/save/economy change or graphics downgrade.

No new browser/physical iPhone playback, native memory, Pi login or termination-cause
test was performed. No Vercel deployment, runtime-log scan, protection bypass,
Mainnet operation or account mutation was attempted.

The b92 report's zero effects clock and White Screen cause remain unresolved.
The latest report ended by saved exit; its unexpected-restart event belongs to
the preceding run. Do not claim these initialization fixes explain that incident,
or require another full campaign to re-establish the already observed counters.

## Evidence

- `audio-graph-initialization-20261022/before-tests.log`
- `audio-graph-initialization-20261022/tests.log`
- `audio-graph-initialization-20261022/first-build.log`
- `audio-graph-initialization-20261022/build.log`
- `audio-graph-initialization-20261022/lint.log`
