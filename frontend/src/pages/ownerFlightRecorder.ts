import { createPerformanceProbe, retainOwnerResourceTiming } from './performanceDiagnostics.ts';
import { createOwnerTimingCapture } from './ownerTimingCapture.ts';
import { createFullSessionRecorder } from './fullSessionRecorder.ts';
import { createCrashTail } from './crashTail.ts';
import { CRASH_WORK_STEPS, type CrashProgress } from './crashProgress.ts';
import { observeSessionDiagnostics } from '../lib/sessionDiagnosticEvents.ts';
import { cleanFlightRecorder, readFlightRecorders, FLIGHT_RECORDER_KEY,
  PREVIOUS_FLIGHT_RECORDER_KEY, FLIGHT_RECORDER_MAX_CHARS } from './flightRecorderReport.mjs';

type Host = { localStorage?: Pick<Storage, 'getItem' | 'setItem'>;
  sessionStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>; __cryptoidBootId?: string };
type Options = Parameters<typeof createOwnerTimingCapture>[2];

// Called only after server owner verification; reuse existing simulation and
// resource-timing hooks. The full-session store owns only pending-I/O watchdogs,
// never a game timer/RAF, additional request or gameplay UI.
export function createOwnerFlightRecorder(verifiedOwner: boolean, getHost: () => Host, options: Options) {
  if (!verifiedOwner) return null;
  const host = getHost(), wallNow = options.wallNow ?? Date.now;
  const full = createFullSessionRecorder(verifiedOwner, () => host, options);
  const optional = (operation: () => void) => { try { operation(); } catch { /* Diagnostics must never interrupt play. */ } };
  const progress: CrashProgress = { frame: 0, completedFrames: 0, sceneRequests: 0, sceneCommits: 0 };
  let tail: ReturnType<typeof createCrashTail> = null;
  optional(() => { tail = full ? createCrashTail(verifiedOwner, () => host, { ...options, id: full.id,
    now: options.now ?? (() => performance.now()), wallNow, progress: () => progress }) : null; });
  const releaseTail = tail ? observeSessionDiagnostics((kind, details) => optional(() => tail?.record(kind, details))) : () => {};
  let archived = false;
  let release = () => {};
  const write = (key: string, raw: string) => {
    for (const name of ['localStorage', 'sessionStorage'] as const) {
      try { host[name]?.setItem(key, raw); } catch { /* Never interrupt play. */ }
    }
  };
  const probe = createPerformanceProbe({ now: options.now, runtime: options.runtime,
    environment: 'owner-admin', publishGlobal: false, sampleLimit: 30,
    persistIntervalMs: 2_000, runtimeIntervalMs: 10_000,
    onStart: () => { release = retainOwnerResourceTiming(Infinity); full?.start(); },
    onFinish: () => { release(); full?.finish(); },
    onSample: sample => { optional(() => tail?.record('sample', sample)); full?.sample(sample); },
    onEvent: event => { optional(() => tail?.record('event', event)); full?.event(event); },
    metadata: { ...options.build, bootId: host.__cryptoidBootId, recordedAt: wallNow() },
    persist: raw => {
      const capture = cleanFlightRecorder({ ...JSON.parse(raw), mode: 'rolling-owner', savedAt: wallNow() });
      // StrictMode/loading setup must not overwrite the preceding real run.
      if (!capture || !capture.samples.length && !capture.events.some(event =>
        ['error', 'rejection', 'frame-error', 'loop-stall', 'input-error', 'javascript-error',
          'unhandled-rejection', 'render-error'].includes(String(event.kind)))) return;
      if (!archived) {
        const previous = readFlightRecorders(host)[0];
        if (previous) write(PREVIOUS_FLIGHT_RECORDER_KEY, JSON.stringify(previous));
        archived = true;
      }
      let serialized = JSON.stringify(capture);
      while (serialized.length > FLIGHT_RECORDER_MAX_CHARS && capture.samples.length > 1) {
        capture.samples.shift(); serialized = JSON.stringify(capture);
      }
      if (serialized.length <= FLIGHT_RECORDER_MAX_CHARS) write(FLIGHT_RECORDER_KEY, serialized);
    },
  });
  // These fixed scalar updates stay in memory. Only the existing paced tail
  // callback sanitizes/persists them; never write once per work section/shot.
  const updateProgress = (update: () => CrashProgress) => optional(() => { Object.assign(progress, update()); });
  return {
    ...probe,
    begin(at, context) {
      updateProgress(() => ({ frame: progress.frame! + 1, frameStartedAt: wallNow() }));
      optional(() => tail?.frame(context)); probe.begin(at, context);
    },
    mark(label) {
      if (CRASH_WORK_STEPS.some(step => step === label)) updateProgress(() => ({ completedWork: label, workCompletedAt: wallNow() }));
      probe.mark(label);
    },
    end(at) { probe.end(at); updateProgress(() => ({ completedFrames: progress.completedFrames! + 1, frameEndedAt: wallNow() })); },
    sceneRequested() { probe.sceneRequested(); updateProgress(() => ({ sceneRequests: progress.sceneRequests! + 1, sceneRequestedAt: wallNow() })); },
    sceneRenderBegin() { updateProgress(() => ({ renderStartedAt: wallNow() })); return probe.sceneRenderBegin(); },
    sceneCommitted(started) { probe.sceneCommitted(started); updateProgress(() => ({ sceneCommits: progress.sceneCommits! + 1, sceneCommittedAt: wallNow() })); },
    suspend(at) { probe.suspend(at); updateProgress(() => ({ suspendedAt: wallNow() })); },
    finish() {
      try { probe.finish(); }
      finally { optional(() => { tail?.record('end', { operation: 'finish' }); tail?.finish(); }); releaseTail(); }
    },
  } satisfies ReturnType<typeof createPerformanceProbe>;
}

// Keep an explicitly armed 90-second capture independent of the automatic ring.
// Its expiry must not stop the rolling recorder or discard its subscriptions.
export function createOwnerDiagnosticProbe(verifiedOwner: boolean, getHost: () => Host, options: Options) {
  const rolling = createOwnerFlightRecorder(verifiedOwner, getHost, options);
  if (!rolling) return null;
  const manual = createOwnerTimingCapture(verifiedOwner, getHost, options);
  if (!manual) return rolling;
  return {
    begin(at, context) { rolling.begin(at, context); manual.begin(at, context); },
    checkpoint(kind, details) { rolling.checkpoint(kind, details); manual.checkpoint(kind, details); },
    mark(label) { rolling.mark(label); manual.mark(label); },
    end(at) { rolling.end(at); manual.end(at); },
    volley(at, blocked) { rolling.volley(at, blocked); manual.volley(at, blocked); },
    longTask(duration) { rolling.longTask(duration); manual.longTask(duration); },
    sceneRequested() { rolling.sceneRequested(); manual.sceneRequested(); },
    sceneRenderBegin() { return rolling.sceneRenderBegin(); },
    sceneCommitted(started) { rolling.sceneCommitted(started); manual.sceneCommitted(started); },
    simulationStep(gap, delta) { rolling.simulationStep(gap, delta); manual.simulationStep(gap, delta); },
    pacing(value) { rolling.pacing(value); manual.pacing(value); },
    hit(source) { rolling.hit(source); manual.hit(source); },
    lifecycle(kind, error) { rolling.lifecycle(kind, error); manual.lifecycle(kind, error); },
    suspend(at) { rolling.suspend(at); manual.suspend(at); },
    finish() { rolling.finish(); manual.finish(); },
    export: rolling.export,
  } satisfies ReturnType<typeof createPerformanceProbe>;
}

