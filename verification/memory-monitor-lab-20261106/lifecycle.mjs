import {appendReloadEvent, recordApplicationBoot, RELOAD_TRACE_LIMIT} from '../../frontend/src/pages/reloadDiagnostics.ts';
import {readReport} from './model.mjs';

// Capture the browser's entry route before the lab restores its overview.
const documentId = recordApplicationBoot();
const events = () => window.__cryptoidReloadState?.events ?? [];
const boot = events().find(event => event.kind === 'app-boot' && event.bootId === documentId);
const tabKey = 'cryptoid_memory_lab_tab_run_v1';
let tabRun = null;
try {
  const value = sessionStorage.getItem(tabKey);
  if (value && value.length <= 2048) tabRun = JSON.parse(value);
} catch { /* The report can still be used without a tab marker. */ }

function sameRun(report) {
  return !!report?.documentId && tabRun?.documentId === report.documentId && tabRun.startedAt === report.startedAt;
}

function saveTabMarker() {
  try { sessionStorage.setItem(tabKey, JSON.stringify(tabRun)); }
  catch { /* A later document may be unable to correlate the run. */ }
}

try {
  const previous = readReport(localStorage);
  if (sameRun(previous) && previous.state === 'running' && previous.documentId !== documentId && !tabRun.followingDocument) {
    // A matching per-tab marker avoids treating an unrelated tab as a restart.
    tabRun.followingDocument = boot;
    saveTabMarker();
  }
} catch { /* Optional storage must not block the lab. */ }

export function beginRunTrace(report) {
  report.documentId = documentId;
  tabRun = {documentId, startedAt: report.startedAt, followingDocument: null};
  saveTabMarker();
}

export function followingDocument(report) {
  return sameRun(report) ? tabRun.followingDocument : null;
}

export function withLifecycle(report) {
  if (!report.documentId) return report;
  const following = followingDocument(report);
  const trace = events().filter(event =>
    (event.bootId === report.documentId && event.at >= report.startedAt) ||
    (following && event.bootId === following.bootId && event.kind === 'boot-after-active-session'),
  );
  return {...report, lifecycle: {
    openedInDocument: boot,
    followingDocumentInSameTab: following,
    events: trace.slice(-RELOAD_TRACE_LIMIT),
    maxEvents: RELOAD_TRACE_LIMIT,
  }};
}

export function noteLifecycle(kind, details = {}, error) {
  const report = window.__cryptoidLabRun;
  if (report?.documentId !== documentId || report.state !== 'running') return;
  try { appendReloadEvent(window, kind, null, details, error); }
  catch { /* Recording an interruption must never cause another one. */ }
}

const lastFault = new Map();
export function noteFault(kind, error, details = {}) {
  const now = performance.now();
  const key = `${kind}:${details.surface ?? ''}`;
  if (now - (lastFault.get(key) ?? -Infinity) < 1000) return;
  lastFault.set(key, now);
  noteLifecycle(kind, details, error);
}

window.__cryptoidLabFault = (kind, error) => {
  if (kind !== 'javascript-error' && kind !== 'unhandled-rejection') {
    noteFault(kind, error, {surface: 'game'});
  }
};
window.addEventListener('error', event => {
  if (!(event instanceof ErrorEvent)) return;
  const file = typeof event.filename === 'string' && event.filename.startsWith(location.origin + '/')
    ? event.filename.slice(location.origin.length).match(/^\/assets\/([\w.-]+\.js)$/)?.[1]
    : undefined;
  const source = file ? {file, line: event.lineno, column: event.colno} : {};
  noteFault('javascript-error', event.error, {surface: 'window', ...source});
});
window.addEventListener('unhandledrejection', event => {
  noteFault('unhandled-rejection', event.reason, {surface: 'window'});
});
document.addEventListener('visibilitychange', () => {
  noteLifecycle(document.hidden ? 'visibility-hidden' : 'visibility-visible');
});
window.addEventListener('pagehide', event => noteLifecycle('pagehide', {persisted: event.persisted}));
window.addEventListener('pageshow', event => noteLifecycle('pageshow', {persisted: event.persisted}));
window.addEventListener('popstate', () => {
  const route = location.pathname === '/game' ? 'game' : location.pathname === '/' ? 'home' : 'other';
  noteLifecycle('lab-history-pop', {route});
}, true);
