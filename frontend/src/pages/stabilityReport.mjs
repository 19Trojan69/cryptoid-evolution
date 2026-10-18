// Read only the two existing bounded technical records. This module never
// imports the application, starts a game, writes storage or sends a request.
const EVENT_KEY = 'cryptoid_game_diagnostics_v1';
const SESSION_KEY = 'cryptoid_game_session_v1';
const MAX_INPUT = 64 * 1024;
const enums = {
  reason: ['frame-error', 'loop-stall', 'input-error', 'javascript-error', 'unhandled-rejection', 'render-error', 'performance', 'unexpected-restart'],
  phase: ['SECTOR_INTRO', 'ENTRY', 'FORMATION', 'ATTACK_CYCLE', 'REFORM', 'SECTOR_CLEAR'],
  encounter: ['normal', 'boss-intro', 'boss-fight', 'boss-clear', 'bonus'],
  status: ['loading', 'playing', 'paused', 'destroying', 'game-over', 'victory'],
  restartHint: ['foreground-interrupted', 'background-interrupted', 'page-reload'],
  errorName: ['', 'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'AggregateError', 'SecurityError', 'QuotaExceededError', 'NetworkError', 'AbortError', 'InvalidStateError', 'NotSupportedError', 'UnknownError'],
};
const numberLimits = { sector: 500, block: 10, width: 16384, height: 16384,
  enemies: 1000, projectiles: 10000, effects: 10000, frameMs: 3600000,
  workMs: 3600000, performanceLevel: 100, lastSavedAt: 1e15 };
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
  if (time(value.at)) result.at = value.at;
  return Object.keys(result).length ? result : null;
}
function read(host, storageName, key) {
  try {
    const storage = host[storageName];
    if (!storage) return { status: 'unavailable', value: null };
    const raw = storage.getItem(key);
    if (raw === null || raw === undefined) return { status: 'absent', value: null };
    if (typeof raw !== 'string' || raw.length > MAX_INPUT) return { status: 'oversized', value: null };
    return { status: 'read', value: JSON.parse(raw) };
  } catch { return { status: 'unavailable-or-invalid', value: null }; }
}
export function readStabilityReport(host, now = Date.now()) {
  const saved = read(host, 'localStorage', EVENT_KEY), session = read(host, 'sessionStorage', SESSION_KEY);
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
  return { version: 1, format: 'cryptoid-local-stability-report',
    generatedAt: finite(now) ? new Date(now).toISOString() : null,
    available: events.length > 0 || lastSession !== null,
    storage: { events: saved.status, session: session.status }, events, lastSession,
    limits: 'Vorhandene lokale Unterbrechungsdaten. Kein Beweis für einen Speicher- oder Browserprozess-Absturz. Keine Konto-, Kauf- oder Spielstanddaten.' };
}

// Always confirm the existing server-side owner binding before accessing local
// evidence. A stale/unmounted admin view must not read the browser records.
export async function readOwnerStabilityReport(verifyOwner, getHost, active = () => true, now = Date.now()) {
  const owner = await verifyOwner();
  if (owner?.canAdmin !== true) throw new Error('owner_access_required');
  if (!active()) return null;
  return readStabilityReport(getHost(), now);
}
