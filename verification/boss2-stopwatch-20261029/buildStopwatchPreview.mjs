import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { root } from '../boss2-forensics-20261028/fixture.mjs';

assert.equal(process.env.VERCEL_ENV, 'preview', 'Stopwatch is protected-preview only');
const config = JSON.parse(readFileSync(root + '/vercel.json', 'utf8'));
assert.equal(config.git.deploymentEnabled, false);
// Preserve the tested CSS-off control and all original private runtime inputs.
await import('../boss2-css-filter-attribution-20261029/buildFilterPreview.mjs');
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const infoPath = output + '/device-preview-info.json';
const info = JSON.parse(readFileSync(infoPath, 'utf8'));
assert.match(info.sourceCommit, /^[a-f0-9]{40}$/);
const state = readFileSync(new URL('stopwatchState.mjs', import.meta.url), 'utf8');
const browser = readFileSync(new URL('stopwatchBrowser.mjs', import.meta.url), 'utf8');
assert.equal(browser.split('__CRYPTOID_STOPWATCH_SOURCE__').length, 2);
assert.equal(browser.split("'./stopwatchState.mjs'").length, 2);
const js = browser.replace('__CRYPTOID_STOPWATCH_SOURCE__', info.sourceCommit)
  .replace("'./stopwatchState.mjs'", "'./diagnostic-stopwatch-state.js'");
const css = readFileSync(new URL('stopwatch.css', import.meta.url), 'utf8');
writeFileSync(output + '/diagnostic-stopwatch.js', js);
writeFileSync(output + '/diagnostic-stopwatch-state.js', state);
writeFileSync(output + '/diagnostic-stopwatch.css', css);
const htmlPath = output + '/index.html', original = readFileSync(htmlPath, 'utf8');
assert.equal(original.split('</head>').length, 2);
const extra = '<link rel="stylesheet" href="/diagnostic-stopwatch.css"><script type="module" src="/diagnostic-stopwatch.js"></script>';
const changed = original.replace('</head>', extra + '</head>');
assert.equal(changed.replace(extra, ''), original);
writeFileSync(htmlPath, changed);
info.diagnosticStopwatch = { version: 1, checkpointMs: 1000, savedRuns: 2,
  activeWallTime: true, pausesFreeze: true, restoresLastCheckpoint: true,
  storage: 'one bounded localStorage value; no automatic upload', fullRecordingRequired: false,
  hardCrashTimeIsExact: false, sourceGameChanged: false, simulationClocksChanged: false,
  stateSha256: createHash('sha256').update(state).digest('hex'),
  browserSha256: createHash('sha256').update(js).digest('hex'),
  cssSha256: createHash('sha256').update(css).digest('hex') };
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_STOPWATCH_PREVIEW_BUILD ' + JSON.stringify({ sourceCommit: info.sourceCommit,
  sourceTree: info.sourceTree, stopwatch: info.diagnosticStopwatch }));
