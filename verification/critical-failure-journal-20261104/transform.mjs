import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const digest = value => createHash('sha256').update(value).digest('hex');
export const pins = {
  browser: 'fdc9e7267232143a4ecad916da42b159e8daa7492ce52db7853d993d1b9a8ecd',
  app: '342f11632178026d56525580a9fcfed45993763039a82a74b16bfe019a0e2bad',
};
function edit(original, expected, edits) {
  assert.equal(digest(original), expected, 'Exact original private diagnostic module required');
  let changed = original;
  for (const [before, after] of edits) {
    assert.equal(changed.split(before).length, 2, before);
    changed = changed.replace(before, after);
  }
  let restored = changed;
  for (const [before, after] of [...edits].reverse()) {
    assert.equal(restored.split(after).length, 2, after);
    restored = restored.replace(after, before);
  }
  assert.equal(restored, original, 'All original diagnostic code restored exactly');
  return changed;
}
const journalImport = '../critical-failure-journal-20261104/criticalState.mjs';
export function browserSource(original) {
  return edit(original, pins.browser, [
    ["import { createBrief } from './briefState.mjs';",
      `import { createBrief } from './briefState.mjs';
import { createCriticalJournal, CRITICAL_KINDS, safeErrorName, safeErrorSite } from '${journalImport}';`],
    ["  let live = false, currentRunId = null;",
      `  const journal = createCriticalJournal({ storage, source, now: () => Date.now(), documentStartedAt: host.performance.timeOrigin });
  const route = () => host.location.pathname === '/' ? 'home' : host.location.pathname === '/game' ? 'game' : host.location.pathname === '/admin' ? 'admin' : 'other';
  let live = false, currentRunId = null;`],
    ['brief.checkpoint(run, host.__deviceBossOptions, event.detail.resourceCheckpoint); currentRunId',
      'brief.checkpoint(run, host.__deviceBossOptions, event.detail.resourceCheckpoint); journal.checkpoint(run); currentRunId'],
    ['if (currentRunId && event.detail?.latest?.id === currentRunId) brief.checkpoint(event.detail.latest, host.__deviceBossOptions);',
      'if (currentRunId && event.detail?.latest?.id === currentRunId) { brief.checkpoint(event.detail.latest, host.__deviceBossOptions); journal.checkpoint(event.detail.latest); }'],
    ["    if (!live || !doc.querySelector('.game-shell')) return;",
      "    if (!live || !CRITICAL_KINDS.has(event.type) && !doc.querySelector('.game-shell')) return;"],
    ["    if (event.type === 'error') fields.errorName = event.error?.name || 'Error';",
      `    if (event.type === 'error' || event.type === 'unhandledrejection') {
      try { fields.errorName = event.type === 'error' ? safeErrorName(event.error || {}) : safeErrorName(event.reason); }
      catch { fields.errorName = 'UnknownError'; }
      if (event.type === 'error') Object.assign(fields, safeErrorSite(event, host));
    }
    if (event.type === 'pagehide') fields.persisted = event.persisted === true;
    if (CRITICAL_KINDS.has(event.type)) journal.record({ ...fields, route: route() });`],
    ["    if (doc.visibilityState === 'hidden') pointers.clear();",
      "    if (doc.visibilityState === 'hidden') { journal.record({ kind: 'hidden', target: 'document', trusted: event.isTrusted === true, route: route() }); pointers.clear(); }"],
    ['    brief.flush(true); pointers.clear();', '    journal.flush(true); brief.flush(true); pointers.clear();'],
  ]);
}
export function appSource(original) {
  return edit(original, pins.app, [
    ["import { installBriefDiagnostics } from '../boss2-brief-report-20261030/briefBrowser.mjs';",
      `import { installBriefDiagnostics } from '../boss2-brief-report-20261030/briefBrowser.mjs';
import { readCriticalJournal } from '${journalImport}';`],
    ['const stopwatch = readSavedStopwatch(store), briefDiagnostics = readBrief(store), identity = reportIdentity(window);',
      'const stopwatch = readSavedStopwatch(store), briefDiagnostics = readBrief(store), criticalDiagnostics = readCriticalJournal(store), identity = reportIdentity(window);'],
    ['        stopwatch, briefDiagnostics, stopwatchLinkedToSelectedFullSession: false,',
      '        stopwatch, briefDiagnostics, criticalDiagnostics, stopwatchLinkedToSelectedFullSession: false,'],
    ['        briefMatchesLatestStopwatch: !!stopwatch.latest && stopwatch.latest.id === briefDiagnostics.latest?.clock.id,',
      `        briefMatchesLatestStopwatch: !!stopwatch.latest && stopwatch.latest.id === briefDiagnostics.latest?.clock.id,
        criticalMatchesLatestStopwatch: !!stopwatch.latest && stopwatch.latest.id === criticalDiagnostics.latest?.clock.id
          && stopwatch.latest.source === criticalDiagnostics.latest?.clock.source,`],
  ]);
}
export function proof(browser, app) {
  return { version: 1, originalBrowserSha256: digest(browser), transformedBrowserSha256: digest(browserSource(browser)),
    originalAppSha256: digest(app), transformedAppSha256: digest(appSource(app)), exactReversalVerified: true,
    additionalEventListeners: 0, additionalTimers: 0, inputInterceptionAdded: false,
    sourceGameFilesEdited: false, physicalDevice: false, whiteScreenFixed: false };
}
