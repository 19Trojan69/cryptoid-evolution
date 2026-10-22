import { GAME_SESSION_KEY, type GameDiagnostic } from './gameDiagnostics.ts';
import type { BossBoundaryKind } from './bossBoundaryDiagnostics.ts';
import type { BonusBoundaryKind } from './bonusBoundaryDiagnostics.ts';

export const RELOAD_TRACE_KEY = 'cryptoid_reload_trace_v2';
export const RELOAD_TRACE_LIMIT = 96;
export const RELOAD_WINDOW_MS = 60_000;
export const RELOAD_HEARTBEAT_MS = 5_000;
export const RELOAD_FREEZE_MS = 500;
export const RESOURCE_TREND_KEY = 'cryptoid_resource_trend_v4';
export const RESOURCE_TREND_LIMIT = 90;
export const RESOURCE_TREND_WINDOW_MS = 15 * 60_000;
export const RESOURCE_TREND_INTERVAL_MS = 10_000;
const MAX_RAW_BYTES = 128 * 1024;
const MAX_RESOURCE_RAW_BYTES = 256 * 1024;

export type ReloadDiagnosticKind =
  | BossBoundaryKind
  | BonusBoundaryKind
  | 'app-boot'
  | 'app-load'
  | 'boot-after-active-session'
  | 'game-monitor-start'
  | 'game-monitor-stop'
  | 'heartbeat'
  | 'main-thread-gap'
  | 'beforeunload'
  | 'pagehide'
  | 'pageshow'
  | 'visibility-hidden'
  | 'visibility-visible'
  | 'webgl-context-lost'
  | 'webgl-context-restored'
  | 'canvas-context-lost'
  | 'canvas-context-restored'
  | 'frame-error'
  | 'loop-stall'
  | 'input-error'
  | 'javascript-error'
  | 'unhandled-rejection'
  | 'render-error'
  | 'home-intent'
  | 'saved-exit-intent'
  | 'boss-defeat-start'
  | 'boss-defeat-complete'
  | 'boss-victory-start'
  | 'resource-boss-clear'
  | 'resource-boss-clear-ready'
  | 'resource-bonus-start'
  | 'resource-bonus-first-spawn'
  | 'resource-bonus-clear'
  | 'resource-normal-start'
  | 'resource-normal-first-spawn'
  | 'resource-formation-ready';

type TechnicalContext = {
  sector?: number; block?: number; phase?: string; encounter?: string; status?: string;
  width?: number; height?: number; enemies?: number; projectiles?: number; effects?: number;
  frameMs?: number; lastSavedAt?: number; bossId?: number; bossHealth?: number; bossMaxHealth?: number;
  liveTurrets?: number; totalTurrets?: number; reactorOpen?: boolean; bossElapsedMs?: number;
  coreElapsedMs?: number; bossVolley?: number; coreVolley?: number; bossEscortWave?: number;
  bossEscortSpawned?: number; bossEscortTimerMs?: number; attackCooldownMs?: number;
  spawnTimerMs?: number; clearTimerMs?: number; elapsedMs?: number;
  jsHeapBytes?: number; domNodes?: number; runningAnimations?: number; canvasNodes?: number; imageNodes?: number;
  paintedEntries?: number; paintedBytes?: number; paintedSources?: number; paintedPending?: number;
  paintedRetained?: number; paintedRetainCount?: number; paintedSourceRetained?: number; paintedSourceRetainCount?: number;
  canvasRegisteredEffects?: number; canvasSourceImages?: number; canvasTextureEntries?: number;
  canvasCacheBytes?: number; canvasSurfaceBytes?: number; canvasRetainedHullUsers?: number; canvasFailureCount?: number;
  audioVoices?: number; audioWeaponVoices?: number; audioBossVoices?: number; audioEffectVoices?: number;
  audioSampleBuffers?: number; audioRockBuffers?: number; audioBufferBytes?: number; estimatedResourceBytes?: number;
  audioState?: string;
  audioClockMs?: number; audioClockStalls?: number; audioRecoveries?: number; audioBlockedSounds?: number; audioReapedVoices?: number;
  musicState?: string; musicClockMs?: number; musicMediaMs?: number; musicPaused?: boolean; musicEnded?: boolean;
  musicTrack?: string; bossHeartCollected?: boolean;
  sourceCommit?: string; sourceTree?: string; workingTreeDirty?: boolean;
  targetHz?: number; cssPacingMode?: string; cssPacedActive?: number; cssPacingFallbacks?: number;
};

export type ReloadTraceEvent = {
  kind: ReloadDiagnosticKind;
  at: number;
  bootId: string;
  context?: TechnicalContext;
  gapMs?: number;
  errorName?: string;
  navigationType?: string;
  route?: 'home' | 'game' | 'admin' | 'other';
  source?: 'session-marker' | 'reload-trace';
  persisted?: boolean;
};

export type ResourceTrendSample = {
  at: number;
  bootId: string;
  context: TechnicalContext;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
type ReloadHost = Window & {
  __cryptoidBootId?: string;
  __cryptoidReloadInstalled?: boolean;
  __cryptoidReloadContext?: () => GameDiagnostic;
  __cryptoidReloadState?: { events: ReloadTraceEvent[] };
  __cryptoidResourceTrendState?: { samples: ResourceTrendSample[] };
};

const finite = (value: unknown, max = 1e15): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;

const numericContextKeys = [
  'sector', 'block', 'width', 'height', 'enemies', 'projectiles', 'effects', 'frameMs', 'lastSavedAt',
  'bossId', 'bossHealth', 'bossMaxHealth', 'liveTurrets', 'totalTurrets', 'bossElapsedMs', 'coreElapsedMs',
  'bossVolley', 'coreVolley', 'bossEscortWave', 'bossEscortSpawned', 'bossEscortTimerMs',
  'attackCooldownMs', 'spawnTimerMs', 'clearTimerMs', 'elapsedMs',
  'jsHeapBytes', 'domNodes', 'runningAnimations', 'canvasNodes', 'imageNodes',
  'paintedEntries', 'paintedBytes', 'paintedSources', 'paintedPending', 'paintedRetained', 'paintedRetainCount',
  'paintedSourceRetained', 'paintedSourceRetainCount', 'canvasRegisteredEffects', 'canvasSourceImages',
  'canvasTextureEntries', 'canvasCacheBytes', 'canvasSurfaceBytes', 'canvasRetainedHullUsers', 'canvasFailureCount',
  'audioVoices', 'audioWeaponVoices', 'audioBossVoices', 'audioEffectVoices', 'audioSampleBuffers',
  'audioRockBuffers', 'audioBufferBytes', 'estimatedResourceBytes',
  'audioClockMs', 'audioClockStalls', 'audioRecoveries', 'audioBlockedSounds', 'audioReapedVoices',
  'musicClockMs', 'musicMediaMs',
  'targetHz', 'cssPacedActive', 'cssPacingFallbacks',
] as const;

export function reloadTechnicalContext(input: GameDiagnostic | null | undefined): TechnicalContext | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const result: TechnicalContext = {};
  for (const key of ['phase', 'encounter', 'status'] as const) {
    const value = input[key];
    if (typeof value === 'string') result[key] = value.slice(0, 40);
  }
  for (const key of numericContextKeys) {
    const value = input[key];
    if (finite(value)) result[key] = value;
  }
  if (typeof input.reactorOpen === 'boolean') result.reactorOpen = input.reactorOpen;
  for (const key of ['sourceCommit', 'sourceTree'] as const)
    if (typeof input[key] === 'string' && /^[a-f0-9]{40}$/.test(input[key])) result[key] = input[key];
  if (typeof input.workingTreeDirty === 'boolean') result.workingTreeDirty = input.workingTreeDirty;
  if (['native-easing', 'native-unavailable', 'native-stopped'].includes(input.cssPacingMode ?? '')) result.cssPacingMode = input.cssPacingMode;
  if (typeof input.audioState === 'string' && ['none', 'suspended', 'running', 'closed', 'interrupted'].includes(input.audioState))
    result.audioState = input.audioState;
  if (typeof input.musicState === 'string' && ['none', 'suspended', 'running', 'closed', 'interrupted'].includes(input.musicState))
    result.musicState = input.musicState;
  if (typeof input.musicTrack === 'string' && ['normal', 'boss', 'victory', 'other'].includes(input.musicTrack)) result.musicTrack = input.musicTrack;
  for (const key of ['musicPaused', 'musicEnded', 'bossHeartCollected'] as const)
    if (typeof input[key] === 'boolean') result[key] = input[key];
  return Object.keys(result).length ? result : undefined;
}

const allowedErrors = new Set([
  '', 'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'AggregateError',
  'SecurityError', 'QuotaExceededError', 'NetworkError', 'AbortError', 'InvalidStateError',
  'NotSupportedError', 'UnknownError',
]);

export function reloadErrorName(error: unknown) {
  const raw = error instanceof Error ? error.name : '';
  return allowedErrors.has(raw) ? raw : raw ? 'UnknownError' : '';
}

function storage(host: ReloadHost, name: 'localStorage' | 'sessionStorage'): StorageLike | undefined {
  try { return host[name] as StorageLike; } catch { return undefined; }
}
function parseEvents(value: string | null | undefined): ReloadTraceEvent[] {
  if (!value || typeof value !== 'string' || value.length > MAX_RAW_BYTES) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.slice(-RELOAD_TRACE_LIMIT) : [];
  } catch { return []; }
}
function storedEvents(target?: StorageLike) {
  try { return parseEvents(target?.getItem(RELOAD_TRACE_KEY)); } catch { return []; }
}
function parseResourceSamples(value: string | null | undefined): ResourceTrendSample[] {
  if (!value || typeof value !== 'string' || value.length > MAX_RESOURCE_RAW_BYTES) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.slice(-RESOURCE_TREND_LIMIT) : [];
  } catch { return []; }
}
function storedResourceSamples(target?: StorageLike) {
  try { return parseResourceSamples(target?.getItem(RESOURCE_TREND_KEY)); } catch { return []; }
}
function eventKey(event: ReloadTraceEvent) {
  return `${event.bootId}|${event.at}|${event.kind}`;
}
function mergeEvents(...sets: ReloadTraceEvent[][]) {
  const merged = new Map<string, ReloadTraceEvent>();
  for (const event of sets.flat()) {
    if (!event || typeof event !== 'object' || !finite(event.at) || typeof event.kind !== 'string' || typeof event.bootId !== 'string') continue;
    merged.set(eventKey(event), event);
  }
  return [...merged.values()].sort((a, b) => a.at - b.at).slice(-RELOAD_TRACE_LIMIT);
}
function stateFor(host: ReloadHost) {
  if (!host.__cryptoidReloadState) {
    host.__cryptoidReloadState = {
      events: mergeEvents(storedEvents(storage(host, 'localStorage')), storedEvents(storage(host, 'sessionStorage'))),
    };
  }
  return host.__cryptoidReloadState;
}
function persist(host: ReloadHost) {
  const raw = JSON.stringify(stateFor(host).events.slice(-RELOAD_TRACE_LIMIT));
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try { storage(host, name)?.setItem(RELOAD_TRACE_KEY, raw); } catch { /* Optional local diagnostics. */ }
  }
}

function mergeResourceSamples(...sets: ResourceTrendSample[][]) {
  const merged = new Map<string, ResourceTrendSample>();
  for (const sample of sets.flat()) {
    if (!sample || typeof sample !== 'object' || !finite(sample.at) || typeof sample.bootId !== 'string') continue;
    const context = reloadTechnicalContext(sample.context as GameDiagnostic);
    if (!context) continue;
    merged.set(`${sample.bootId}|${sample.at}`, { at: sample.at, bootId: sample.bootId, context });
  }
  return [...merged.values()].sort((a, b) => a.at - b.at).slice(-RESOURCE_TREND_LIMIT);
}
function resourceStateFor(host: ReloadHost) {
  if (!host.__cryptoidResourceTrendState) {
    host.__cryptoidResourceTrendState = {
      samples: mergeResourceSamples(
        storedResourceSamples(storage(host, 'localStorage')),
        storedResourceSamples(storage(host, 'sessionStorage')),
      ),
    };
  }
  return host.__cryptoidResourceTrendState;
}
function persistResourceTrend(host: ReloadHost) {
  const raw = JSON.stringify(resourceStateFor(host).samples.slice(-RESOURCE_TREND_LIMIT));
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try { storage(host, name)?.setItem(RESOURCE_TREND_KEY, raw); } catch { /* Optional local diagnostics. */ }
  }
}

function routeKind(host: ReloadHost): ReloadTraceEvent['route'] {
  let path = '';
  try { path = host.location?.pathname ?? ''; } catch { /* Embedded browser may deny location metadata. */ }
  if (path === '/' || path === '') return 'home';
  if (path.startsWith('/game')) return 'game';
  if (path.startsWith('/admin')) return 'admin';
  return 'other';
}
function navigationType(host: ReloadHost) {
  try {
    const entry = host.performance?.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined;
    return typeof entry?.type === 'string' ? entry.type : '';
  } catch { return ''; }
}
function currentContext(host: ReloadHost) {
  try { return reloadTechnicalContext(host.__cryptoidReloadContext?.()); } catch { return undefined; }
}
function newBootId(host: ReloadHost, at: number) {
  try {
    const id = host.crypto?.randomUUID?.();
    if (id) return id;
  } catch { /* Fallback below. */ }
  return `boot-${at}-${Math.random().toString(36).slice(2, 10)}`;
}

export function appendReloadEvent(
  host: ReloadHost,
  kind: ReloadDiagnosticKind,
  context?: GameDiagnostic | TechnicalContext | null,
  extra: Partial<Omit<ReloadTraceEvent, 'kind' | 'at' | 'bootId' | 'context'>> = {},
  error?: unknown,
  now = Date.now,
) {
  const at = now();
  const bootId = host.__cryptoidBootId ??= newBootId(host, at);
  const rawContext = context ?? currentContext(host);
  const safeContext = rawContext && 'reason' in rawContext
    ? reloadTechnicalContext(rawContext as GameDiagnostic)
    : rawContext as TechnicalContext | undefined;
  const entry: ReloadTraceEvent = {
    kind, at, bootId,
    ...(safeContext ? { context: safeContext } : {}),
    ...extra,
  };
  const errorName = reloadErrorName(error);
  if (errorName) entry.errorName = errorName;
  const state = stateFor(host);
  state.events = mergeEvents(state.events, [entry]);
  persist(host);
  return entry;
}

function previousSessionContext(host: ReloadHost, now: number) {
  try {
    const raw = storage(host, 'sessionStorage')?.getItem(GAME_SESSION_KEY);
    if (!raw || raw.length > MAX_RAW_BYTES) return undefined;
    const marker = JSON.parse(raw);
    if (marker?.active !== true || !finite(marker?.at) || now - marker.at > 24 * 60 * 60 * 1000) return undefined;
    return reloadTechnicalContext(marker.context as GameDiagnostic);
  } catch { return undefined; }
}
function previousTraceContext(host: ReloadHost, now: number) {
  const events = storedEvents(storage(host, 'sessionStorage'));
  let lastIntentAt = -Infinity;
  for (const event of events) {
    if (event.kind === 'home-intent' || event.kind === 'saved-exit-intent') lastIntentAt = Math.max(lastIntentAt, event.at);
  }
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (!finite(event.at) || now - event.at > 30_000 || event.at <= lastIntentAt) continue;
    if (event.context?.status === 'playing') return event.context;
  }
  return undefined;
}

export function recordApplicationBoot(host: ReloadHost = window as ReloadHost, options: { now?: () => number; bootId?: string } = {}) {
  if (host.__cryptoidBootId) return host.__cryptoidBootId;
  const now = options.now ?? Date.now;
  const at = now();
  const markerContext = previousSessionContext(host, at);
  const traceContext = markerContext ? undefined : previousTraceContext(host, at);
  host.__cryptoidBootId = options.bootId ?? newBootId(host, at);
  appendReloadEvent(host, 'app-boot', null, { navigationType: navigationType(host), route: routeKind(host) }, undefined, now);
  const previous = markerContext ?? traceContext;
  if (previous) appendReloadEvent(host, 'boot-after-active-session', previous, {
    navigationType: navigationType(host), route: routeKind(host), source: markerContext ? 'session-marker' : 'reload-trace',
  }, undefined, now);
  return host.__cryptoidBootId;
}

export function recordReloadEvent(kind: ReloadDiagnosticKind, error?: unknown) {
  if (typeof window === 'undefined') return null;
  return appendReloadEvent(window as ReloadHost, kind, undefined, {}, error);
}

export function recordReloadSnapshot(kind: ReloadDiagnosticKind, context: GameDiagnostic) {
  if (typeof window === 'undefined') return null;
  return appendReloadEvent(window as ReloadHost, kind, context);
}

export function appendResourceTrendSample(
  host: ReloadHost,
  context: GameDiagnostic,
  now = Date.now,
) {
  const safeContext = reloadTechnicalContext(context);
  if (!safeContext) return null;
  const at = now();
  const bootId = host.__cryptoidBootId ??= newBootId(host, at);
  const sample: ResourceTrendSample = { at, bootId, context: safeContext };
  const state = resourceStateFor(host);
  state.samples = mergeResourceSamples(state.samples, [sample]);
  persistResourceTrend(host);
  return sample;
}

export function createResourceTrendMonitor(
  context: () => GameDiagnostic,
  host: ReloadHost = window as ReloadHost,
  options: {
    now?: () => number;
    setInterval?: typeof window.setInterval;
    clearInterval?: typeof window.clearInterval;
  } = {},
) {
  recordApplicationBoot(host);
  const now = options.now ?? Date.now;
  const setTimer = options.setInterval ?? host.setInterval.bind(host);
  const clearTimer = options.clearInterval ?? host.clearInterval.bind(host);
  let finished = false;
  const sample = () => {
    let current: GameDiagnostic;
    try { current = context(); } catch { return; }
    const visible = (() => { try { return !host.document?.hidden; } catch { return true; } })();
    if (current.status === 'playing' && visible) appendResourceTrendSample(host, current, now);
  };
  sample();
  const timer = setTimer(sample, RESOURCE_TREND_INTERVAL_MS);
  return {
    finish() {
      if (finished) return;
      finished = true;
      clearTimer(timer);
    },
  };
}

export function freezeGap(previous: number, current: number, active: boolean, visible: boolean) {
  if (!active || !visible || !Number.isFinite(previous) || !Number.isFinite(current)) return 0;
  const gap = current - previous;
  return gap >= RELOAD_FREEZE_MS ? gap : 0;
}

export function createReloadGameMonitor(
  context: () => GameDiagnostic,
  host: ReloadHost = window as ReloadHost,
  options: {
    now?: () => number;
    monotonic?: () => number;
    setInterval?: typeof window.setInterval;
    clearInterval?: typeof window.clearInterval;
  } = {},
) {
  recordApplicationBoot(host);
  const previousContext = host.__cryptoidReloadContext;
  host.__cryptoidReloadContext = context;
  const now = options.now ?? Date.now;
  const monotonic = options.monotonic ?? (() => host.performance?.now?.() ?? now());
  const setTimer = options.setInterval ?? host.setInterval.bind(host);
  const clearTimer = options.clearInterval ?? host.clearInterval.bind(host);
  let lastTick = monotonic();
  let lastHeartbeat = now();
  let finished = false;
  appendReloadEvent(host, 'game-monitor-start', context(), {}, undefined, now);
  const timer = setTimer(() => {
    const current = context();
    const tick = monotonic();
    const visible = (() => { try { return !host.document?.hidden; } catch { return true; } })();
    const gap = freezeGap(lastTick, tick, current.status === 'playing', visible);
    lastTick = tick;
    if (gap) appendReloadEvent(host, 'main-thread-gap', current, { gapMs: Math.round(gap) }, undefined, now);
    const at = now();
    if (current.status === 'playing' && visible && at - lastHeartbeat >= RELOAD_HEARTBEAT_MS) {
      lastHeartbeat = at;
      appendReloadEvent(host, 'heartbeat', current, {}, undefined, now);
    } else if (!visible || current.status !== 'playing') lastHeartbeat = at;
  }, 250);
  return {
    finish() {
      if (finished) return;
      finished = true;
      clearTimer(timer);
      appendReloadEvent(host, 'game-monitor-stop', context(), {}, undefined, now);
      if (host.__cryptoidReloadContext === context) host.__cryptoidReloadContext = previousContext;
    },
  };
}

export function installReloadDiagnostics(host: ReloadHost = window as ReloadHost) {
  if (host.__cryptoidReloadInstalled) return;
  host.__cryptoidReloadInstalled = true;
  recordApplicationBoot(host);
  const add = (target: EventTarget | undefined, type: string, listener: EventListener, capture = false) => {
    try { target?.addEventListener(type, listener, capture); } catch { /* Optional diagnostics only. */ }
  };
  const onError: EventListener = event => { appendReloadEvent(host, 'javascript-error', undefined, {}, (event as ErrorEvent).error); };
  const onRejection: EventListener = event => { appendReloadEvent(host, 'unhandled-rejection', undefined, {}, (event as PromiseRejectionEvent).reason); };
  const onBeforeUnload: EventListener = () => { appendReloadEvent(host, 'beforeunload'); };
  const onPageHide: EventListener = event => { appendReloadEvent(host, 'pagehide', undefined, { persisted: !!(event as PageTransitionEvent).persisted }); };
  const onPageShow: EventListener = event => { appendReloadEvent(host, 'pageshow', undefined, { persisted: !!(event as PageTransitionEvent).persisted }); };
  const onVisibility: EventListener = () => { appendReloadEvent(host, host.document?.hidden ? 'visibility-hidden' : 'visibility-visible'); };
  const onWebglLost: EventListener = () => { appendReloadEvent(host, 'webgl-context-lost'); };
  const onWebglRestored: EventListener = () => { appendReloadEvent(host, 'webgl-context-restored'); };
  const onCanvasLost: EventListener = () => { appendReloadEvent(host, 'canvas-context-lost'); };
  const onCanvasRestored: EventListener = () => { appendReloadEvent(host, 'canvas-context-restored'); };
  const onLoad: EventListener = () => { appendReloadEvent(host, 'app-load', null, { navigationType: navigationType(host), route: routeKind(host) }); };
  add(host, 'error', onError);
  add(host, 'unhandledrejection', onRejection);
  add(host, 'beforeunload', onBeforeUnload);
  add(host, 'pagehide', onPageHide);
  add(host, 'pageshow', onPageShow);
  add(host.document, 'visibilitychange', onVisibility);
  add(host.document, 'webglcontextlost', onWebglLost, true);
  add(host.document, 'webglcontextrestored', onWebglRestored, true);
  add(host.document, 'contextlost', onCanvasLost, true);
  add(host.document, 'contextrestored', onCanvasRestored, true);
  add(host, 'load', onLoad);
}
