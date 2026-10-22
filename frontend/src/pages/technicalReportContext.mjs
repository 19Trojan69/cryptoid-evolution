// Shared allowlist; never retains URLs, identities, payloads or raw exceptions.
export const contextEnums = {
  reason: ['frame-error', 'loop-stall', 'input-error', 'javascript-error', 'unhandled-rejection', 'render-error', 'performance', 'unexpected-restart'],
  phase: ['SECTOR_INTRO', 'ENTRY', 'FORMATION', 'ATTACK_CYCLE', 'REFORM', 'SECTOR_CLEAR'],
  encounter: ['normal', 'boss-intro', 'boss-fight', 'boss-clear', 'bonus'],
  status: ['loading', 'playing', 'paused', 'destroying', 'game-over', 'victory'],
  restartHint: ['foreground-interrupted', 'background-interrupted', 'page-reload'],
  errorName: ['', 'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'AggregateError', 'SecurityError', 'QuotaExceededError', 'NetworkError', 'AbortError', 'InvalidStateError', 'NotSupportedError', 'UnknownError'],
};
export const reloadKinds = new Set([
  'app-boot','app-load','boot-after-active-session','game-monitor-start','game-monitor-stop','heartbeat','main-thread-gap',
  'beforeunload','pagehide','pageshow','visibility-hidden','visibility-visible','webgl-context-lost','webgl-context-restored',
  'canvas-context-lost','canvas-context-restored','frame-error','loop-stall','input-error','javascript-error',
  'unhandled-rejection','render-error','home-intent','saved-exit-intent','boss-defeat-start','boss-defeat-complete','boss-victory-start',
  'resource-boss-clear','resource-boss-clear-ready','resource-bonus-start','resource-bonus-first-spawn','resource-bonus-clear',
  'resource-normal-start','resource-normal-first-spawn','resource-formation-ready',
  'reactor-open-observed','reactor-first-shot-before','reactor-first-shot-created',
  'reactor-first-shot-audio-returned','reactor-first-shot-scene-committed',
]);
const numberLimits = {
  sector: 500, block: 10, width: 16384, height: 16384, enemies: 1000, projectiles: 10000, effects: 10000,
  frameMs: 3600000, workMs: 3600000, performanceLevel: 100, lastSavedAt: 1e15,
  bossId: 1000, bossHealth: 1e9, bossMaxHealth: 1e9, liveTurrets: 100, totalTurrets: 100,
  bossElapsedMs: 3600000, coreElapsedMs: 3600000, bossVolley: 100000, coreVolley: 100000,
  bossEscortWave: 100000, bossEscortSpawned: 100000, bossEscortTimerMs: 3600000,
  attackCooldownMs: 3600000, spawnTimerMs: 3600000, clearTimerMs: 3600000, elapsedMs: 24 * 60 * 60 * 1000,
  jsHeapBytes: 16e9, domNodes: 200000, runningAnimations: 100000, canvasNodes: 10000, imageNodes: 100000,
  paintedEntries: 1000, paintedBytes: 2e9, paintedSources: 1000, paintedPending: 1000,
  paintedRetained: 1000, paintedRetainCount: 10000, paintedSourceRetained: 1000, paintedSourceRetainCount: 10000,
  canvasRegisteredEffects: 10000, canvasSourceImages: 1000, canvasTextureEntries: 1000,
  canvasCacheBytes: 2e9, canvasSurfaceBytes: 2e9, canvasRetainedHullUsers: 1000, canvasFailureCount: 1000,
  audioVoices: 10000, audioWeaponVoices: 10000, audioBossVoices: 10000, audioEffectVoices: 10000,
  audioSampleBuffers: 10000, audioRockBuffers: 10000, audioBufferBytes: 2e9, estimatedResourceBytes: 8e9,
  audioClockMs: 1e12, audioClockStalls: 1e9, audioRecoveries: 1e9, audioBlockedSounds: 1e12, audioReapedVoices: 1e12,
  musicClockMs: 1e12, musicMediaMs: 1e12,
  targetHz: 1000, cssPacedActive: 100000, cssPacingFallbacks: 1e9,
};
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value, max = 1e15) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
const time = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
export function technicalContext(value) {
  if (!object(value)) return null;
  const result = {};
  for (const [key, allowed] of Object.entries(contextEnums)) {
    if (allowed.includes(value[key])) result[key] = value[key];
  }
  for (const [key, max] of Object.entries(numberLimits)) if (finite(value[key], max)) result[key] = value[key];
  if (typeof value.reactorOpen === 'boolean') result.reactorOpen = value.reactorOpen;
  for (const key of ['sourceCommit', 'sourceTree']) if (typeof value[key] === 'string' && /^[a-f0-9]{40}$/.test(value[key])) result[key] = value[key];
  if (typeof value.workingTreeDirty === 'boolean') result.workingTreeDirty = value.workingTreeDirty;
  if (['native-easing', 'native-unavailable', 'native-stopped'].includes(value.cssPacingMode)) result.cssPacingMode = value.cssPacingMode;
  if (typeof value.audioState === 'string' && ['none','suspended','running','closed','interrupted'].includes(value.audioState)) result.audioState = value.audioState;
  if (typeof value.musicState === 'string' && ['none','suspended','running','closed','interrupted'].includes(value.musicState)) result.musicState = value.musicState;
  if (typeof value.musicTrack === 'string' && ['normal','boss','victory','other'].includes(value.musicTrack)) result.musicTrack = value.musicTrack;
  for (const key of ['musicPaused', 'musicEnded', 'bossHeartCollected']) if (typeof value[key] === 'boolean') result[key] = value[key];
  if (time(value.at)) result.at = value.at;
  return Object.keys(result).length ? result : null;
}
