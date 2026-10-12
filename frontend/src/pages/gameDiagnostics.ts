import type { GameInterruption } from './gameLoop.ts';
import { releaseVersion } from '../release.ts';

export const GAME_DIAGNOSTICS_KEY = 'cryptoid_game_diagnostics_v1';
export type GameLifecycle = 'visibility-hidden' | 'visibility-visible' | 'pagehide' | 'pageshow';
type Diagnostic = {
  reason: GameInterruption | 'performance' | 'unexpected-restart' | 'navigation' | 'lifecycle' | 'route-error'; errorName: string; sector: number; phase: string;
  encounter: string; status: string; width: number; height: number; browser: string;
  block?: number; enemies?: number; projectiles?: number; effects?: number;
  frameMs?: number; workMs?: number; performanceLevel?: number; lastSavedAt?: number;
  restartHint?: 'foreground-interrupted' | 'background-interrupted' | 'page-reload';
  buildId?: string; lifecycle?: GameLifecycle; navigationAction?: string; from?: string; to?: string;
  frames?: number; meanFrameMs?: number; p95FrameMs?: number; maxFrameMs?: number; maxWorkMs?: number; heapBytes?: number;
};
const text = (value: unknown, limit: number) => typeof value === 'string' ? value.slice(0, limit) : '';
const route = (value: unknown) => typeof value === 'string' && ['/', '/game', '/galaxy', '/admin', '/signin/callback', '/privacy', '/terms'].includes(value) ? value : 'other';
const errorNames = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'AggregateError', 'AbortError', 'SecurityError', 'QuotaExceededError', 'NotAllowedError', 'NotSupportedError', 'InvalidStateError', 'NetworkError']);
const reasons = new Set(['frame-error', 'loop-stall', 'input-error', 'javascript-error', 'unhandled-rejection', 'render-error', 'save-pressure', 'performance', 'unexpected-restart', 'navigation', 'lifecycle', 'route-error']);
function sanitize(diagnostic: Diagnostic, buildFallback = releaseVersion) {
  // Explicit allowlist: optional diagnostics cannot capture a caller's account,
  // URL query, token, exception message or stack through object spreading.
  const entry: Diagnostic = { reason: reasons.has(diagnostic.reason) ? diagnostic.reason : 'javascript-error', buildId: text(diagnostic.buildId || buildFallback, 80),
    errorName: diagnostic.errorName ? errorNames.has(diagnostic.errorName) ? diagnostic.errorName : 'UnknownError' : '',
    sector: Number.isFinite(diagnostic.sector) ? diagnostic.sector : 0,
    phase: text(diagnostic.phase, 40), encounter: text(diagnostic.encounter, 40), status: text(diagnostic.status, 30),
    width: Number.isFinite(diagnostic.width) ? diagnostic.width : 0, height: Number.isFinite(diagnostic.height) ? diagnostic.height : 0, browser: text(diagnostic.browser, 240) };
  for (const key of ['block', 'enemies', 'projectiles', 'effects', 'frameMs', 'workMs', 'performanceLevel', 'lastSavedAt', 'frames', 'meanFrameMs', 'p95FrameMs', 'maxFrameMs', 'maxWorkMs', 'heapBytes'] as const) {
    const value = diagnostic[key]; if (typeof value === 'number' && Number.isFinite(value) && value >= 0) entry[key] = value;
  }
  if (['foreground-interrupted', 'background-interrupted', 'page-reload'].includes(diagnostic.restartHint ?? '')) entry.restartHint = diagnostic.restartHint;
  if (['visibility-hidden', 'visibility-visible', 'pagehide', 'pageshow'].includes(diagnostic.lifecycle ?? '')) entry.lifecycle = diagnostic.lifecycle;
  if (['PUSH', 'POP', 'REPLACE'].includes(diagnostic.navigationAction ?? '')) entry.navigationAction = diagnostic.navigationAction;
  if (diagnostic.from !== undefined) entry.from = route(diagnostic.from);
  if (diagnostic.to !== undefined) entry.to = route(diagnostic.to);
  return entry;
}
// Local bounded technical records only: no account identifiers, raw exception
// text, credentials or automatic network transmission.
export function recordGameDiagnostic(diagnostic: Diagnostic, storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const entry = { ...sanitize(diagnostic), at: new Date().toISOString() };
  try {
    const target = storage ?? window.localStorage;
    let previous: unknown;
    try { previous = JSON.parse(target.getItem(GAME_DIAGNOSTICS_KEY) ?? '[]'); } catch { previous = []; }
    const history = Array.isArray(previous) ? previous.slice(-19).filter(value => value && typeof value === 'object').map(value => ({ ...sanitize(value, 'unknown'), at: text(value.at, 30) })) : [];
    target.setItem(GAME_DIAGNOSTICS_KEY, JSON.stringify([...history, entry]));
  } catch { /* Diagnostics must never interrupt play or recovery. */ }
  return entry;
}

const SESSION_KEY = 'cryptoid_game_session_v1';
type SessionMarker = { context: Diagnostic; active: boolean; hidden: boolean; pageHidden: boolean; at: number; restartReported?: boolean };
const sessionStorage = () => { try { return window.sessionStorage; } catch { return undefined; } };
export function readGameDiagnosticContext(storage = sessionStorage()): Diagnostic {
  try { const previous = JSON.parse(storage?.getItem(SESSION_KEY) ?? 'null') as SessionMarker | null;
    if (previous?.context) return sanitize(previous.context, 'unknown');
  } catch { /* Optional, possibly denied storage. */ }
  return sanitize({ reason: 'performance', errorName: '', sector: 0, phase: '', encounter: '', status: '', width: 0, height: 0, browser: '' });
}
export function exportGameDiagnostics(storage?: Pick<Storage, 'getItem'>) {
  const result = { buildId: releaseVersion, exportedAt: new Date().toISOString(), storageAvailable: true, entries: [] as Array<Diagnostic & { at: string }> };
  try {
    const previous = JSON.parse((storage ?? window.localStorage).getItem(GAME_DIAGNOSTICS_KEY) ?? '[]');
    if (Array.isArray(previous)) result.entries = previous.slice(-20).filter(value => value && typeof value === 'object').map(value => ({ ...sanitize(value, 'unknown'), at: text(value.at, 30) }));
  } catch { result.storageAvailable = false; }
  return result;
}
// Explicit opt-in through the test URL. No additional menu, upload, account
// access or automatic download during normal play.
export function downloadGameDiagnostics() {
  const data = exportGameDiagnostics();
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `cryptoid-diagnostics-${data.exportedAt.slice(0, 10)}.json`;
  try { link.click(); } finally { window.setTimeout(() => URL.revokeObjectURL(url), 30_000); }
}
export function inspectGameSessionRestart(storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = sessionStorage(),
  report: (entry: Diagnostic) => unknown = recordGameDiagnostic, now = Date.now, navigationType = '') {
  try {
    const previous = JSON.parse(storage?.getItem(SESSION_KEY) ?? 'null') as SessionMarker | null;
    if (previous?.active && !previous.restartReported && previous.context && now() >= previous.at && now() - previous.at < 24 * 60 * 60 * 1000) {
      report({ ...sanitize(previous.context, 'unknown'), reason: 'unexpected-restart', errorName: '',
        restartHint: navigationType === 'reload' ? 'page-reload' : previous.hidden || previous.pageHidden ? 'background-interrupted' : 'foreground-interrupted' });
      storage?.setItem(SESSION_KEY, JSON.stringify({ ...previous, context: sanitize(previous.context, 'unknown'), restartReported: true }));
    }
  } catch { /* A marker is a hint, never proof of a process kill. */ }
}

// The marker is per-tab session storage, avoiding false crashes from another
// open game tab. OS kills cannot be identified conclusively; absence of a
// pagehide callback is only a hint. No account, exception message or stack is saved.
export function createGameSessionDiagnostics(storage?: Pick<Storage, 'getItem' | 'setItem'>,
  report: (entry: Diagnostic) => unknown = recordGameDiagnostic, now = Date.now, navigationType = '') {
  // Web Storage access itself may throw in an embedded/private browser.
  // Keep optional diagnostics from failing the owner of the combat state.
  const target = storage ?? sessionStorage();
  let lastWrite = 0;
  let context: Diagnostic | null = null;
  let pageHidden = false;
  inspectGameSessionRestart(target, report, now, navigationType);
  return {
    due() { return now() - lastWrite >= 10_000; },
    update(next: Diagnostic, active: boolean, hidden: boolean, force = false) {
      context = sanitize(next);
      if (!force && now() - lastWrite < 10_000) return;
      lastWrite = now();
      try { target?.setItem(SESSION_KEY, JSON.stringify({ context, active, hidden, pageHidden, at: lastWrite })); } catch { /* Optional. */ }
    },
    pagehide() { pageHidden = true; },
    pageshow() { pageHidden = false; },
    finish() {
      if (context) this.update(context, false, false, true);
    },
  };
}

// Fixed rolling window. Work timing covers synchronous simulation only, not
// asynchronous React commits, decoded images, audio hardware or GPU memory.
export function createGameFrameDiagnostics() {
  const frames = new Float64Array(1024), work = new Float64Array(1024); let count = 0, next = 0;
  return {
    sample(frameMs: number, workMs: number) {
      if (!Number.isFinite(frameMs) || frameMs <= 0 || !Number.isFinite(workMs) || workMs < 0) return;
      frames[next] = frameMs; work[next] = workMs; next = (next + 1) % frames.length; count = Math.min(frames.length, count + 1);
    },
    summary() {
      const sorted = Array.from(frames.subarray(0, count)).sort((a, b) => a - b);
      const round = (value: number) => Math.round(value * 10) / 10;
      return { frames: count, meanFrameMs: round(sorted.reduce((a, b) => a + b, 0) / (count || 1)),
        p95FrameMs: round(sorted[Math.floor(count * .95)] || 0), maxFrameMs: round(sorted.at(-1) || 0), maxWorkMs: round(Math.max(0, ...work.subarray(0, count))) };
    },
  };
}

