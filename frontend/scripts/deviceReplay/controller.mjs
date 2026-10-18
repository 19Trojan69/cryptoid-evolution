export const REPLAY_PHASES = [
  { name: 'single-six-no-shield', label: 'Einzelschuss · sechs Gegner', enemies: 6, double: false, shield: false },
  { name: 'double-six-shield', label: 'Doppelschuss · sechs Gegner · Schild', enemies: 6, double: true, shield: true },
  { name: 'double-one-shield', label: 'Doppelschuss · ein Gegner · Schild', enemies: 1, double: true, shield: true },
  { name: 'single-six-recovery', label: 'Vergleich zum Anfang', enemies: 6, double: false, shield: false },
];
const append = (values, value, limit) => { if (values.length === limit) values.shift(); values.push(value); };
const q = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a,b) => a-b);
  return +sorted[Math.max(0,Math.ceil(sorted.length*p)-1)].toFixed(3);
};

export function createDeviceReplay({ now = () => performance.now(), phases = REPLAY_PHASES,
  warmupMs = 8000, phaseMs = 20000, onProgress = () => {}, onFinish = () => {} } = {}) {
  let api, started = now(), phaseStarted = 0, index = -1, active = false, finished = false, bucket, lastProgress = -Infinity;
  const results = [], issues = [];
  const fresh = () => ({ frames: 0, rawMs: 0, acceptedMs: 0, clippedMs: 0, over34: 0,
    gaps: [], work: [], volleyGaps: [], volleys: 0, lastVolley: null, fixtureResets: 0 });
  const emit = time => {
    const total = warmupMs + phaseMs*phases.length;
    onProgress({ label: index < 0 ? 'Grafiken werden vorbereitet' : phases[index].label,
      remainingSeconds: Math.max(0,Math.ceil((total-(time-started))/1000)), phase: index+1 });
    lastProgress = time;
  };
  const closePhase = time => {
    if (index < 0 || !bucket) return;
    const raw = bucket.rawMs;
    results.push({ ...phases[index], wallMs: +(time-phaseStarted).toFixed(3), frames: bucket.frames,
      measuredFrameMs: +raw.toFixed(3), acceptedSimulationMs: +bucket.acceptedMs.toFixed(3),
      clippedSimulationMs: +bucket.clippedMs.toFixed(3), over34Frames: bucket.over34,
      acceptedTimeRatio: raw ? +(bucket.acceptedMs/raw).toFixed(4) : null,
      meanDeliveredFps: raw ? +(bucket.frames*1000/raw).toFixed(2) : null,
      frameP50Ms: q(bucket.gaps,.5), frameP95Ms: q(bucket.gaps,.95), frameMaxMs: q(bucket.gaps,1),
      frameQuantileSamples: bucket.gaps.length, volleys: bucket.volleys,
      volleyGapP50Ms: q(bucket.volleyGaps,.5), volleyGapP95Ms: q(bucket.volleyGaps,.95),
      simulationWorkP95Ms: q(bucket.work,.95), fixtureResets: bucket.fixtureResets,
      end: api?.read() });
  };
  const finish = (reason, time = now()) => {
    if (finished) return;
    finished = true; active = false; closePhase(time);
    onFinish({ version: 1, mode: 'isolated real-renderer replay', completed: reason === 'completed', reason,
      elapsedWallMs: +(time-started).toFixed(3), warmupMs, phaseMs, phases: results, issues,
      coverage: { clock: 'Actual GamePage frameGap and delta; its 34 ms cap is unchanged',
        rendering: 'Real React/DOM/CSS/canvas, hull preparation and original assets',
        fixtures: 'Direct sector 12 entry, controlled enemy health and lives; not a normal scored run',
        samples: 'Frame and work quantiles retain at most 4096 values per phase',
        account: 'No Pi login or real account/API access; separate preview origin' } });
  };
  return {
    install(nextApi) {
      if (active || finished) throw new Error('Replay already started');
      api = nextApi; started = phaseStarted = now(); active = true;
      api.start(phases[0]); emit(started);
      return () => { api = null; };
    },
    clock(time, frameGap, delta) {
      if (!active || index < 0) return;
      if (![time,frameGap,delta].every(Number.isFinite) || frameGap < 0 || delta < 0 || delta > frameGap || delta > 34) {
        issues.push('Invalid measured frame clock'); finish('invalid-clock',time); return;
      }
      // First frame after a controlled fixture reset has zero elapsed time.
      if (frameGap === 0) return;
      bucket.frames++; bucket.rawMs += frameGap; bucket.acceptedMs += delta;
      bucket.clippedMs += frameGap-delta; bucket.over34 += Number(frameGap > 34);
      append(bucket.gaps,frameGap,4096);
    },
    volley(time) {
      if (!active || index < 0) return;
      bucket.volleys++;
      if (bucket.lastVolley !== null) append(bucket.volleyGaps,time-bucket.lastVolley,256);
      bucket.lastVolley = time;
    },
    afterFrame(time, simulationWorkMs) {
      if (!active || !api) return;
      if (api.read().status !== 'playing') { finish('game-interrupted',time); return; }
      if (index >= 0) append(bucket.work,simulationWorkMs,4096);
      if (index < 0 ? time-started >= warmupMs : time-phaseStarted >= phaseMs) {
        closePhase(time); bucket = null; index++;
        if (index === phases.length) { finish('completed',time); return; }
        phaseStarted = time; bucket = fresh(); api.start(phases[index]);
      }
      const mode = phases[Math.max(0,index)];
      if (api.sustain(mode)) { if (bucket) bucket.fixtureResets++; }
      if (time-lastProgress >= 1000) emit(time);
    },
    abort(reason = 'stopped') { if (!finished) finish(reason); },
    get active() { return active; },
  };
}
