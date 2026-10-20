// Read-only schema shared by the owner capture writer and verified Admin export.
export const OWNER_TIMING_KEY = 'cryptoid_owner_timing_v1';
export const OWNER_TIMING_ARM_KEY = 'cryptoid_owner_timing_arm_v1';
export const OWNER_TIMING_DURATION_MS = 90_000;
export const OWNER_TIMING_ARM_TTL_MS = 10 * 60_000;
export const OWNER_TIMING_MAX_BYTES = 256 * 1024;
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1e15;
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const numbers = (value, keys) => Object.fromEntries(keys.filter(key => finite(value?.[key])).map(key => [key, value[key]]));
const sampleKeys = (`atMs width height sector flight enemies attackers returning playerShots enemyShots effects rocks rockEffects pickups
  bossHealth liveTurrets clearMs fps frameP50Ms frameP95Ms frameMaxMs simulationP95Ms simulationMaxMs frames volleys
  volleyGapP95Ms capBlocked longTasks longTaskMaxMs sampleDurationMs sceneRequests sceneCommits sceneCommitWaitP95Ms
  sceneRenderToCommitP95Ms runtimeAgeMs runtimeSampleMs heapBytes animations particles domNodes painted estimatedBytes sources
  pending audioVoices audioBufferBytes knownTimers knownListeners jobsStarted jobsFinished queueWaitMaxMs materialTotalMs
  materialMaxMs encodeTotalMs decodeTotalMs sourceWorkTotalMs sourceWorkMaxMs rockPaints rockPaintTotalMs rockPaintMaxMs
  blockchainRenders effectPaints effectPaintTotalMs effectPaintMaxMs bossPaints bossPaintTotalMs bossPaintMaxMs`).split(/\s+/);
const pacingKeys = 'frames decisionFrames wallMs simulatedMs discardedMs interval16 interval32 interval50 slowFramesMax skippedRequests forcedRequests'.split(' ');
const workKeys = ['setup-and-boosts','transitions','spawn-and-attack-selection','enemy-motion-and-fire','boss-motion-and-weapons',
  'hostile-shots-and-damage','powerups-and-rocks','player-shots-and-collisions','phase-save-and-paint'];
const text = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,60}$/.test(value) ? value : undefined;
const states = { phase: ['SECTOR_INTRO','ENTRY','FORMATION','ATTACK_CYCLE','REFORM','SECTOR_CLEAR'],
  encounter: ['normal','boss-intro','boss-fight','boss-clear','bonus'], status: ['loading','playing','paused','destroying','game-over','victory'] };
const kinds = new Set(['phase-start','phase-complete','status-change','damage-boss-hull','damage-enemy-hull','damage-projectile',
  'pagehide','pageshow','error','rejection','unmount','home-intent','saved-exit-intent','start-back-intent','frame-error',
  'loop-stall','input-error','javascript-error','unhandled-rejection','render-error','boss-defeat-start','boss-defeat-complete',
  'boss-final-blast','boss-victory-start','boss-model-start','boss-model-ready','boss-texture-start','boss-texture-ready',
  'boss-texture-error','boss-canvas-first-draw','boss-canvas-release']);
export function cleanTimingCapture(input) {
  if (!object(input) || input.environment !== 'owner-admin' || !object(input.metadata) || !finite(input.metadata.recordedAt)) return null;
  const metadata = numbers(input.metadata, ['recordedAt', 'durationLimitMs']);
  for (const key of ['sourceCommit','sourceTree']) if (/^[a-f0-9]{40}$/.test(input.metadata[key])) metadata[key] = input.metadata[key];
  if (typeof input.metadata.workingTreeDirty === 'boolean') metadata.workingTreeDirty = input.metadata.workingTreeDirty;
  if (text(input.metadata.bootId)) metadata.bootId = input.metadata.bootId;
  metadata.runtimeBaseline = numbers(input.metadata.runtimeBaseline, sampleKeys);
  const samples = (Array.isArray(input.samples) ? input.samples : []).slice(-90).filter(object).map(value => {
    const sample = numbers(value, sampleKeys);
    for (const key of ['phase','encounter','status']) if (states[key].includes(value[key])) sample[key] = value[key];
    if (typeof value.longTasksSupported === 'boolean') sample.longTasksSupported = value.longTasksSupported;
    sample.pacing = numbers(value.pacing, pacingKeys);
    sample.work = Object.fromEntries(workKeys.filter(key => object(value.work?.[key])).map(key => [key, numbers(value.work[key], ['count','totalMs','maxMs'])]));
    return sample;
  });
  const events = (Array.isArray(input.events) ? input.events : []).slice(-64).filter(value => object(value) && kinds.has(value.kind)).map(value => {
    const event = { ...numbers(value, ['atMs','durationMs','sector','flight','bossId','bossTextureWidth','bossTextureHeight','bossCanvasWidth','bossCanvasHeight']), kind: value.kind };
    for (const key of ['phase','encounter','status']) if (states[key].includes(value[key])) event[key] = value[key];
    return event;
  });
  return { version: 1, environment: 'owner-admin', metadata, finished: input.finished === true, samples, events,
    diagnosticWork: numbers(input.diagnosticWork, ['completedWrites','persistTotalMs','persistMaxMs']),
    limits: '90-second targeted owner capture. RAF cadence and React commits are not presented FPS. Simulation sections exclude browser layout/paint/GPU. Async encoding/decoding durations are elapsed waits, not CPU cost. Resource counters are cumulative; compare runtimeBaseline. No native/GPU/process memory measurement or crash-cause proof.' };
}
export function readTimingCapture(host) {
  const captures = [];
  for (const name of ['localStorage','sessionStorage']) {
    try {
      const raw = host[name]?.getItem(OWNER_TIMING_KEY);
      if (typeof raw !== 'string' || raw.length > OWNER_TIMING_MAX_BYTES) continue;
      const capture = cleanTimingCapture(JSON.parse(raw));
      if (capture) captures.push(capture);
    } catch { /* Unavailable storage is not a game failure. */ }
  }
  return captures.sort((a,b) => b.metadata.recordedAt - a.metadata.recordedAt)[0] ?? null;
}
