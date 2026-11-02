import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { root } from '../boss2-forensics-20261028/fixture.mjs';
import { instrumentClockSamples } from './transforms.mjs';
assert.ok(process.argv.includes('--clock-probe'), 'Explicit isolated clock probe only');
await import('../systematic-stability-20261101/prepareSoakBuild.mjs');
const directory = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const path = directory + '/diagnostic-stopwatch.js', original = readFileSync(path, 'utf8'), changed = instrumentClockSamples(original);
const infoPath = directory + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
const official = readFileSync(root + '/verification/boss2-stopwatch-20261029/stopwatchBrowser.mjs', 'utf8')
  .replace('__CRYPTOID_STOPWATCH_SOURCE__', info.sourceCommit).replace("'./stopwatchState.mjs'", "'./diagnostic-stopwatch-state.js'");
assert.equal(original, official, 'Unchanged existing stopwatch before explicit observer insertion');
const digest = value => createHash('sha256').update(value).digest('hex');
info.qaClockGapProbe = { version: 2, frameHook: 'existing native GamePage step, before simulation substeps',
  clockStartPolicy: 'wait for a fresh advancing frame on initial start and resume',
  nativeFrameGapsRead: true, existingClockSamplesReused: true, maxClockRows: 96, maxFrameGapRows: 16,
  diagnosticStopwatchBeforeSha256: digest(original), diagnosticStopwatchObservedSha256: digest(changed),
  newTimers: false, newAnimationFrames: false, appClocksWritten: false, automaticResume: false,
  stateObjectsOrDomRetained: false, sourceGameFilesEdited: false, physicalDevice: false, whiteScreenFixed: false };
writeFileSync(path, changed);
info.diagnosticStopwatch.baseBrowserSha256 = digest(original);
info.diagnosticStopwatch.browserSha256 = digest(changed);
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_CLOCK_GAP_BUILD ' + JSON.stringify(info.qaClockGapProbe));
