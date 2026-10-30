import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { root } from '../boss2-forensics-20261028/fixture.mjs';
assert.equal(process.env.VERCEL_ENV, 'preview');
await import('../boss2-reactor-visual-control-20261029/buildReactorControl.mjs');
const path = root + '/verification/boss2-forensics-20261028/results/device-preview/site/device-preview-info.json';
const info = JSON.parse(readFileSync(path, 'utf8'));
info.briefReport = { version: 1, activeWithFullRecordingOff: true, savedStopwatchExported: true,
  uniqueExportFilename: true, maxSavedRuns: 2, maxEventsPerRun: 32, maxCharacters: 16384,
  ordinaryCheckpointMs: 1000, terminalEventGuaranteed: false, nativeTerminationCauseMeasured: false,
  fullRecordingDefault: false, sourceGameChanged: false, inputChanged: false, audioChanged: false,
  visualControlPreserved: true, whiteScreenFixed: false };
writeFileSync(path, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_BRIEF_PREVIEW_BUILD ' + JSON.stringify({ sourceCommit: info.sourceCommit, briefReport: info.briefReport }));
