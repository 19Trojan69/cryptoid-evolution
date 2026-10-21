// Read only bounded local technical records. This module never imports the
// application, starts a game, writes storage or sends a request.
import { readTimingCapture } from './timingReport.mjs';
import { readAudioAudits } from './audioAuditReport.mjs';
import { readFlightRecorders } from './flightRecorderReport.mjs';
const EVENT_KEY = 'cryptoid_game_diagnostics_v1';
const SESSION_KEY = 'cryptoid_game_session_v1';
const RELOAD_KEY = 'cryptoid_reload_trace_v2';
const RESOURCE_KEY = 'cryptoid_resource_trend_v4';
const MAX_INPUT = 128 * 1024;
const MAX_RESOURCE_INPUT = 256 * 1024;
const RELOAD_WINDOW_MS = 60_000;
const RESOURCE_WINDOW_MS = 15 * 60_000;
const RESOURCE_SAMPLE_INTERVAL_MS = 10_000;
const RESOURCE_LIMIT = 90;
const enums = {
  reason: ['frame-error', 'loop-stall', 'input-error', 'javascript-error', 'unhandled-rejection', 'render-error', 'performance', 'unexpected-restart'],
  phase: ['SECTOR_INTRO', 'ENTRY', 'FORMATION', 'ATTACK_CYCLE', 'REFORM', 'SECTOR_CLEAR'],
  encounter: ['normal', 'boss-intro', 'boss-fight', 'boss-clear', 'bonus'],
  status: ['loading', 'playing', 'paused', 'destroying', 'game-over', 'victory'],
  restartHint: ['foreground-interrupted', 'background-interrupted', 'page-reload'],
  errorName: ['', 'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'AggregateError', 'SecurityError', 'QuotaExceededError', 'NetworkError', 'AbortError', 'InvalidStateError', 'NotSupportedError', 'UnknownError'],
};
const reloadKinds = new Set([
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
  for (const [key, allowed] of Object.entries(enums)) {
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
function read(host, storageName, key, maxInput = MAX_INPUT) {
  try {
    const storage = host[storageName];
    if (!storage) return { status: 'unavailable', value: null };
    const raw = storage.getItem(key);
    if (raw === null || raw === undefined) return { status: 'absent', value: null };
    if (typeof raw !== 'string' || raw.length > maxInput) return { status: 'oversized', value: null };
    return { status: 'read', value: JSON.parse(raw) };
  } catch { return { status: 'unavailable-or-invalid', value: null }; }
}
function reloadEvent(value) {
  if (!object(value) || !reloadKinds.has(value.kind) || !finite(value.at)) return null;
  const result = { kind: value.kind, at: value.at };
  if (typeof value.bootId === 'string' && /^[A-Za-z0-9-]{1,80}$/.test(value.bootId)) result.bootId = value.bootId;
  if (['navigate','reload','back_forward','prerender'].includes(value.navigationType)) result.navigationType = value.navigationType;
  if (['home','game','admin','other'].includes(value.route)) result.route = value.route;
  if (['session-marker','reload-trace'].includes(value.source)) result.source = value.source;
  if (typeof value.persisted === 'boolean') result.persisted = value.persisted;
  if (finite(value.gapMs, 3600000)) result.gapMs = value.gapMs;
  if (enums.errorName.includes(value.errorName)) result.errorName = value.errorName;
  const context = technicalContext(value.context);
  if (context) result.context = context;
  return result;
}
function mergeReload(localValue, sessionValue) {
  const map = new Map();
  for (const list of [localValue, sessionValue]) {
    if (!Array.isArray(list)) continue;
    for (const raw of list.slice(-96)) {
      const event = reloadEvent(raw);
      if (!event) continue;
      map.set(`${event.bootId ?? ''}|${event.at}|${event.kind}`, event);
    }
  }
  const all = [...map.values()].sort((a, b) => a.at - b.at);
  if (!all.length) return null;
  const latestAt = all[all.length - 1].at;
  return { windowMs: RELOAD_WINDOW_MS, latestAt, events: all.filter(event => event.at >= latestAt - RELOAD_WINDOW_MS).slice(-64) };
}

function resourceSample(value) {
  if (!object(value) || !finite(value.at) || typeof value.bootId !== 'string' || !/^[A-Za-z0-9-]{1,80}$/.test(value.bootId)) return null;
  const context = technicalContext(value.context);
  if (!context) return null;
  return { at: value.at, bootId: value.bootId, context };
}
function mergeResourceTrend(localValue, sessionValue) {
  const map = new Map();
  for (const list of [localValue, sessionValue]) {
    if (!Array.isArray(list)) continue;
    for (const raw of list.slice(-RESOURCE_LIMIT)) {
      const sample = resourceSample(raw);
      if (!sample) continue;
      map.set(`${sample.bootId}|${sample.at}`, sample);
    }
  }
  const all = [...map.values()].sort((a, b) => a.at - b.at);
  if (!all.length) return null;
  const latestAt = all[all.length - 1].at;
  return {
    windowMs: RESOURCE_WINDOW_MS,
    sampleIntervalMs: RESOURCE_SAMPLE_INTERVAL_MS,
    latestAt,
    samples: all.filter(sample => sample.at >= latestAt - RESOURCE_WINDOW_MS).slice(-RESOURCE_LIMIT),
  };
}
function activeDocument(host, now) {
  const result = {};
  try {
    const startedAt = host.performance?.timeOrigin;
    if (finite(startedAt) && startedAt > 0 && finite(now) && startedAt <= now) {
      result.startedAt = startedAt;
      result.ageMs = now - startedAt;
    }
    const type = host.performance?.getEntriesByType?.('navigation')?.[0]?.type;
    if (['navigate','reload','back_forward','prerender'].includes(type)) result.navigationType = type;
  } catch { /* Metadata may be unavailable in an embedded browser. */ }
  try {
    const path = host.location?.pathname;
    if (typeof path === 'string') result.route = path === '/' ? 'home' : /^\/game(?:\/|$)/.test(path) ? 'game' : /^\/admin(?:\/|$)/.test(path) ? 'admin' : 'other';
  } catch { /* Never include a URL, query string or account identifier. */ }
  return Object.keys(result).length ? result : null;
}
export function readStabilityReport(host, now = Date.now()) {
  const saved = read(host, 'localStorage', EVENT_KEY);
  const session = read(host, 'sessionStorage', SESSION_KEY);
  const reloadLocal = read(host, 'localStorage', RELOAD_KEY);
  const reloadSession = read(host, 'sessionStorage', RELOAD_KEY);
  const resourceLocal = read(host, 'localStorage', RESOURCE_KEY, MAX_RESOURCE_INPUT);
  const resourceSession = read(host, 'sessionStorage', RESOURCE_KEY, MAX_RESOURCE_INPUT);
  const events = Array.isArray(saved.value) ? saved.value.slice(-20).map(technicalContext).filter(Boolean) : [];
  const marker = session.value;
  let lastSession = null;
  if (object(marker)) {
    const context = technicalContext(marker.context);
    if (context) {
      lastSession = { context };
      for (const key of ['active', 'hidden', 'pageHidden']) if (typeof marker[key] === 'boolean') lastSession[key] = marker[key];
      if (finite(marker.at)) {
        lastSession.at = marker.at;
        if (finite(now)) lastSession.ageMs = Math.max(0, now - marker.at);
      }
    }
  }
  const reloadTrace = mergeReload(reloadLocal.value, reloadSession.value);
  const resourceTrend = mergeResourceTrend(resourceLocal.value, resourceSession.value);
  const timingCapture = readTimingCapture(host);
  const audioCaptures = readAudioAudits(host);
  const flightRecorders = readFlightRecorders(host);
  return {
    version: 5,
    format: 'cryptoid-local-stability-report',
    generatedAt: finite(now) ? new Date(now).toISOString() : null,
    activeDocument: activeDocument(host, now),
    available: events.length > 0 || lastSession !== null || reloadTrace !== null || resourceTrend !== null || timingCapture !== null || audioCaptures.length > 0 || flightRecorders.length > 0,
    storage: {
      events: saved.status, session: session.status,
      reloadLocal: reloadLocal.status, reloadSession: reloadSession.status,
      resourceLocal: resourceLocal.status, resourceSession: resourceSession.status,
    },
    events,
    lastSession,
    reloadTrace,
    resourceTrend,
    timingCapture,
    audioCaptures,
    flightRecorders,
    limits: 'Lokale Unterbrechungs-, Reload-, Lifecycle-, Freeze-, Übergangs- und periodische Ressourcenhinweise. Ressourcen werden für den verifizierten Owner während aktivem sichtbarem Spiel ungefähr alle 10 Sekunden lokal erfasst und auf etwa 15 Minuten begrenzt. Speicherwerte sind nur bekannte/geschätzte Teilmengen; GPU/WebKit-Speicher kann fehlen. Kein Beweis für einen Speicher-, Browserprozess- oder Betriebssystem-Absturz. Keine Konto-, Kauf- oder Spielstanddaten.',
  };
}

// Always confirm the existing server-side owner binding before accessing local
// evidence. A stale/unmounted admin view must not read the browser records.
export async function readOwnerStabilityReport(verifyOwner, getHost, active = () => true, now = Date.now()) {
  const owner = await verifyOwner();
  if (owner?.canAdmin !== true) throw new Error('owner_access_required');
  if (!active()) return null;
  return readStabilityReport(getHost(), now);
}
