import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { root } from '../boss2-forensics-20261028/fixture.mjs';

assert.equal(process.env.VERCEL_ENV, 'preview', 'Isolated test output only');
const condition = process.env.CRYPTOID_SOAK_CONDITION;
assert.ok(['original', 'mini-start'].includes(condition));
if (condition === 'mini-start') {
  await import('../boss2-mini-start-control-20261101/buildMiniStartPreview.mjs');
} else {
  // Build the existing original-artwork guest condition. Reuse only the exact
  // existing diagnostic clock; do not inherit the CSS/filter/Canvas controls.
  for (const key of Object.keys(process.env)) assert.ok(!/^CRYPTOID_(FLAT|BOSS_|CANVAS_|CSS_FILTER)/.test(key),
    'Original condition must not inherit visual comparison flags');
  await import('../boss2-forensics-20261028/buildDevicePreview.mjs');
  const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
  const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
  const directory = new URL('../boss2-stopwatch-20261029/', import.meta.url);
  const state = readFileSync(new URL('stopwatchState.mjs', directory), 'utf8');
  const browser = readFileSync(new URL('stopwatchBrowser.mjs', directory), 'utf8');
  const css = readFileSync(new URL('stopwatch.css', directory), 'utf8');
  assert.equal(browser.split('__CRYPTOID_STOPWATCH_SOURCE__').length, 2);
  assert.equal(browser.split("'./stopwatchState.mjs'").length, 2);
  const js = browser.replace('__CRYPTOID_STOPWATCH_SOURCE__', info.sourceCommit)
    .replace("'./stopwatchState.mjs'", "'./diagnostic-stopwatch-state.js'");
  writeFileSync(output + '/diagnostic-stopwatch.js', js);
  writeFileSync(output + '/diagnostic-stopwatch-state.js', state);
  writeFileSync(output + '/diagnostic-stopwatch.css', css);
  const path = output + '/index.html', html = readFileSync(path, 'utf8');
  const extra = '<link rel="stylesheet" href="/diagnostic-stopwatch.css"><script type="module" src="/diagnostic-stopwatch.js"></script>';
  assert.equal(html.split('</head>').length, 2);
  assert.ok(!html.includes('/diagnostic-stopwatch.js'));
  const changed = html.replace('</head>', extra + '</head>');
  assert.equal(changed.replace(extra, ''), html); writeFileSync(path, changed);
  const digest = value => createHash('sha256').update(value).digest('hex');
  info.diagnosticStopwatch = { version: 1, checkpointMs: 1000, savedRuns: 2,
    stateSha256: digest(state), browserSha256: digest(js), cssSha256: digest(css),
    existingClockReused: true, simulationClocksChanged: false, hardCrashTimeIsExact: false,
    sourceGameChanged: false, fullRecordingRequired: false, diagnosticClockAddedOnlyForQa: true };
  writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
}
console.log('CRYPTOID_SOAK_BUILD ' + JSON.stringify({ condition, runtimeSourceEdited: false, deployed: false }));
