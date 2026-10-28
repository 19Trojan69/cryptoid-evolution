import { cleanTimingCapture } from './timingReport.mjs';
import { technicalContext, reloadKinds } from './technicalReportContext.mjs';
import type { SessionSignal } from '../lib/sessionDiagnosticEvents';
import { HULL_DIAGNOSTIC_STEPS } from './hullPreparationDiagnostics.ts';
import { REQUEST_DIAGNOSTIC_CODES, providerRequestId } from '../lib/requestDiagnosticCodes.ts';
import { cleanInputDiagnostic } from './inputDiagnostics.ts';
import { cleanPauseDiagnostic } from './pauseDiagnostics.ts';

export const FULL_SESSION_DB = 'cryptoid_owner_full_session_v1';
export const FULL_SESSION_STATUS_KEY = 'cryptoid_owner_full_status_v1';
export const FULL_SESSION_STORAGE_FAILURE_CODES = ['quota-exceeded', 'storage-denied', 'connection-closed',
  'timeout', 'blocked', 'history-missing', 'sequence-conflict', 'storage-unavailable', 'write-failed', 'unknown'] as const;
export const FULL_SESSION_LIMITS = { bytes: 32 * 1024 * 1024, records: 60_000, durationMs: 8 * 60 * 60_000,
  queueRecords: 256, queueBytes: 256 * 1024, sessions: 2, chunkRecords: 64, timeoutMs: 5_000 } as const;
export const fullSessionLimitsText = 'Technical timeline from the start of an owner Testnet game, not video or deterministic replay. Aggregate frame/work windows normally every 2 seconds; heavy resource/audio counters at most every 10 seconds. Last two runs, at most 8 hours, 32 MiB and 60000 records per run; reaching a limit or storage failure stops capture explicitly, without overwriting its beginning. IndexedDB chunks and summary commit atomically; the last unsaved interval may be lost. Browser storage may be denied, cleared or evicted. Observed breadcrumb is separate from committed data. No native/GPU/process memory or OS termination-cause measurement. No identity, wallet, token, purchase/save payload, input coordinates, raw URL/message/stack or automatic transmission.';
export type FullRecordKind = 'sample' | 'event' | SessionSignal | 'start' | 'end';
export type FullRecord = { seq: number; at: number; clockMs: number; kind: FullRecordKind; data: Record<string, unknown> };
export type FullSessionSummary = { id: string; startedAt: number; lastAt: number; state: 'recording' | 'closed' | 'limited';
  count: number; bytes: number; chunks: number; lastSeq: number; build: Record<string, unknown>;
  device: Record<string, unknown>; stopReason?: string };
const numeric = (n: unknown, max = 1e15): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max;
const enumKeys: Record<string, readonly string[]> = {
  operation: ['transition-before', 'transition-reset-done', 'first-spawn-before', 'first-spawn-created', 'scene-committed',
    'hull-plan-start', 'hull-plan-settled', 'hull-plan-progress', 'boss-summary-open', 'boss-summary-save-before', 'boss-summary-save-after', 'boss-summary-cleanup-before', 'boss-summary-cleanup-after', 'boss-summary-failed', 'boss-summary-continue', 'start', 'response', 'failure', 'enqueue', 'drain', 'recover', 'archive',
    'manual-selection', 'automatic-reload', 'expired', 'online', 'offline', 'visibility-hidden', 'visibility-visible',
    'beforeunload', 'pagehide', 'pageshow', 'contextlost', 'contextrestored', 'finish', 'persist'],
  signal: [...reloadKinds],
  endpoint: ['loadout', 'weapon', 'checkpoint', 'recover', 'reward', 'score', 'session', 'boss-summary-prepare', 'boss-summary-continue', 'other'],
  method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OTHER'],
  outcome: ['http', 'network', 'timeout', 'cancelled', 'success'],
  errorCode: REQUEST_DIAGNOSTIC_CODES,
  weaponSource: ['standard', 'paid', 'pickup'],
  step: HULL_DIAGNOSTIC_STEPS,
};
export function cleanFullData(kind: FullRecordKind, input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  if (kind === 'input') return cleanInputDiagnostic(value);
  if (kind === 'pause') return cleanPauseDiagnostic(value);
  if (kind === 'sample' || kind === 'event') {
    const capture = cleanTimingCapture({ environment: 'owner-admin', metadata: { recordedAt: 0 },
      samples: kind === 'sample' ? [value] : [], events: kind === 'event' ? [value] : [] });
    return (kind === 'sample' ? capture?.samples[0] : capture?.events[0]) ?? null;
  }
  const result: Record<string, unknown> = { ...technicalContext(value) };
  const requestId = providerRequestId(value.providerRequestId);
  if (requestId) result.providerRequestId = requestId;
  const upstreamId = providerRequestId(value.upstreamRequestId);
  if (upstreamId) result.upstreamRequestId = upstreamId;
  for (const [key, allowed] of Object.entries(enumKeys)) if (typeof value[key] === 'string' && allowed.includes(value[key])) result[key] = value[key];
  for (const key of ['request', 'durationMs', 'httpStatus', 'depth', 'requested', 'prepared', 'level', 'weaponLevel',
    'paidWeaponMs', 'pickupWeaponMs', 'readinessFailures']) if (numeric(value[key], 1e9)) result[key] = value[key];
  for (const [key, min, max] of [['imageJob', 1, 1e9], ['sprite', 0, 19], ['hullStage', 1, 3], ['paintIndex', 0, 28]] as const)
    if (numeric(value[key], max) && Number.isSafeInteger(value[key]) && value[key] >= min) result[key] = value[key];
  for (const key of ['success', 'persisted', 'online']) if (typeof value[key] === 'boolean') result[key] = value[key];
  return result;
}
export function cleanFullRecord(value: unknown): FullRecord | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as FullRecord;
  if (!Number.isSafeInteger(v.seq) || v.seq < 1 || v.seq > FULL_SESSION_LIMITS.records || !numeric(v.at) || !numeric(v.clockMs)
    || !['sample','event','resource','boundary','request','weapon','queue','lifecycle','input','pause','start','end'].includes(v.kind)) return null;
  const data = cleanFullData(v.kind, v.data);
  return data ? { seq: v.seq, at: v.at, clockMs: v.clockMs, kind: v.kind, data } : null;
}
export function cleanFullSummary(value: unknown): FullSessionSummary | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as FullSessionSummary;
  if (typeof v.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(v.id) || !numeric(v.startedAt) || !numeric(v.lastAt)
    || !['recording','closed','limited'].includes(v.state)) return null;
  const device: Record<string, unknown> = {};
  for (const [key, allowed] of Object.entries({ platform: ['ios','android','other'], browser: ['pi-browser','chromium','safari','other'] }))
    if (allowed.includes(String(v.device?.[key]))) device[key] = v.device[key];
  for (const key of ['width','height','dpr']) if (numeric(v.device?.[key], 16384)) device[key] = v.device[key];
  const build = technicalContext(v.build) ?? {};
  const result: FullSessionSummary = { id: v.id, startedAt: v.startedAt, lastAt: v.lastAt, state: v.state,
    count: 0, bytes: 0, chunks: 0, lastSeq: 0, build, device };
  for (const key of ['count','bytes','chunks','lastSeq'] as const) {
    if (!numeric(v[key], key === 'bytes' ? FULL_SESSION_LIMITS.bytes : FULL_SESSION_LIMITS.records) || !Number.isSafeInteger(v[key])) return null;
    result[key] = v[key];
  }
  if (['duration-limit','byte-limit','record-limit','queue-limit','storage-error'].includes(String(v.stopReason))) result.stopReason = v.stopReason;
  return result;
}

