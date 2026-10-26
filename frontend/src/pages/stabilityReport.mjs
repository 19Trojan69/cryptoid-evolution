import { ownerLifecycleEvidence } from '../lib/ownerLifecycleEvidence.mjs';
import { readCrashTails } from './crashTail.ts';
import { crashRecoveryBoundary } from './crashRecoveryBoundary.mjs';
import { technicalContext, contextEnums, reloadKinds } from './technicalReportContext.mjs';
export { technicalContext } from './technicalReportContext.mjs';
// Read only bounded local technical records. This module never imports the
// application, starts a game, writes storage or sends a request.
import { readTimingCapture } from './timingReport.mjs';
import { readAudioAudits } from './audioAuditReport.mjs';
import { readFlightRecorders } from './flightRecorderReport.mjs';
import { readFullSessionSummaries, settleFullSessionWrites, exportFullSession } from './fullSessionStore.ts';
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
const enums = contextEnums;
const time = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value, max = 1e15) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
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
export async function readOwnerStabilityReport(verifyOwner, getHost, active = () => true, now = Date.now(), includeFullSession = true) {
  const owner = await verifyOwner();
  if (owner?.canAdmin !== true) throw new Error('owner_access_required');
  if (!active()) return null;
  const host = getHost();
  const report = readStabilityReport(host, now);
  if (includeFullSession) {
    report.ownerLifecycle = ownerLifecycleEvidence.report(host);
    report.crashTail = readCrashTails(host);
    report.available ||= report.ownerLifecycle.events.length > 0;
    report.available ||= report.crashTail.sessions.length > 0;
  }
  if (!includeFullSession) return report;
  await settleFullSessionWrites();
  if (!active()) return null;
  const fullSessionRecording = await readFullSessionSummaries(host);
  if (!active()) return null;
  return { ...report, version: 7, available: report.available || fullSessionRecording.sessions.length > 0,
    storage: { ...report.storage, fullSessions: fullSessionRecording.storage }, fullSessionRecording };
}

export async function exportOwnerFullSession(verifyOwner, getHost, id, active = () => true) {
  const owner = await verifyOwner();
  if (owner?.canAdmin !== true) throw new Error('owner_access_required');
  if (!active()) return null;
  const host = getHost();
  // Read the independent synchronous evidence before awaiting the database.
  // Keep observed tail data separate: never fabricate committed session rows.
  const technical = readStabilityReport(host);
  const lifecycle = ownerLifecycleEvidence.report(host);
  const tails = readCrashTails(host);
  const matching = tails.sessions.find(session => session.id === id) ?? null;
  let full;
  try { full = JSON.parse(await (await exportFullSession(host, id)).text()); }
  catch (error) {
    if (!matching) throw error;
    full = { version: 1, format: 'cryptoid-crash-report', fullSessionUnavailable: true,
      summary: { id }, records: null };
  }
  if (!active()) return null;
  return new Blob([JSON.stringify({ ...full, supplementaryEvidenceVersion: 2, crashEvidence: {
    technical, lifecycle, tail: matching, tailStorage: tails.storage,
    latestCommittedAt: full.summary?.lastAt ?? null,
    latestObservedAt: matching?.lastObservedAt ?? null,
    observedTailIsNotCommittedHistory: true,
    recoveryBoundary: crashRecoveryBoundary(full.summary, matching, lifecycle),
    limits: ['Synchronous browser observations; not video or native-process/GPU tracing.',
      'The final interval before any successful browser-storage write can be lost.',
      'A last operation or a new document alone does not prove the cause of a White Screen.'],
  } })], { type: 'application/json' });
}

