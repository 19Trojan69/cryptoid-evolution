import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { digest } from './transform.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname), engine = process.argv[2];
assert.ok(['chromium', 'webkit'].includes(engine));
const folder = root+'/verification/critical-failure-journal-20261104';
const output = folder+'/results/'+engine+'-flow'; mkdirSync(output, { recursive: true });
const infoPath = root+'/verification/boss2-forensics-20261028/results/device-preview/site/device-preview-info.json';
const info = JSON.parse(readFileSync(infoPath, 'utf8')); assert.ok(info.criticalFailureJournal);
copyFileSync(infoPath, output+'/build-info.json');
const path = root+'/verification/systematic-stability-20261101/verifyBrowserSoak.mjs';
const original = readFileSync(path, 'utf8'), edits = [];
let code = original;
function change(before, after) { assert.equal(code.split(before).length, 2, before); code = code.replace(before, after); edits.push([before, after]); }
change('const output = clockProbe ?', 'const legacyOutput = clockProbe ?');
change('mkdirSync(output, { recursive: true });', `const output=${JSON.stringify(output)};\nmkdirSync(output, { recursive: true });`);
change('assert.equal(info.sourceCommit, result.sourceCommit);', `assert.ok(info.criticalFailureJournal);
  result.criticalFailureJournal=info.criticalFailureJournal;
  assert.equal(info.sourceCommit, result.sourceCommit);`);
change('comparedConditionsAreVisuallyDifferent: true,', 'comparedConditionsAreVisuallyDifferent: false,');
change('  result.normalReportVerified = true;', `  assert.equal(report.criticalMatchesLatestStopwatch, true);
  const critical=report.criticalDiagnostics;
  assert.equal(critical.storage,'read');
  assert.equal(critical.latest.clock.mode,'ended');
  assert.equal(critical.latest.clock.id,report.stopwatch.latest.id);
  assert.equal(critical.latest.clock.source,report.stopwatch.latest.source);
  assert.equal(critical.latest.clock.elapsedMs,report.stopwatch.latest.elapsedMs);
  assert.equal(critical.previous.clock.mode,'ended');
  assert.notEqual(critical.previous.clock.id,critical.latest.clock.id);
  for(const run of [critical.latest,critical.previous]) {
    assert.equal(run.events.error,undefined);
    assert.equal(run.events.unhandledrejection,undefined);
    assert.ok(Object.keys(run.events).length<=7);
  }
  assert.equal(critical.limits.nativeTerminationCauseMeasured,false);
  assert.equal(critical.limits.absenceProvesNoError,false);
  result.criticalReportVerified=true;
  result.criticalReportSummary={latestMode:critical.latest.clock.mode,previousMode:critical.previous.clock.mode,
    latestKinds:Object.keys(critical.latest.events),previousKinds:Object.keys(critical.previous.events),
    matchedByIdAndSource:true,clockIsNotPeriodic:true,noNormalFlowErrors:true};
  result.normalReportVerified = true;`);
let restored = code;
for (const [before, after] of [...edits].reverse()) restored = restored.replace(after, before);
assert.equal(restored, original, 'Original active timing, pause/menu/home/report flow and failure gates retained exactly');
const temporary = path.replace(/\.mjs$/, `.critical-${engine}-${process.pid}.mjs`);
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('CRYPTOID_')));
Object.assign(env, { CRYPTOID_SOAK_ENGINE: engine, CRYPTOID_SOAK_CONDITION: 'original', CRYPTOID_SOAK_SECONDS: '60', CRYPTOID_SOAK_RUN: 'smoke' });
let exit;
try {
  writeFileSync(temporary, code);
  const child = spawn(process.execPath, [temporary], { cwd: root, env, stdio: 'inherit' });
  exit = await new Promise(done => { child.once('error', error => done({ code: null, error: error.message })); child.once('exit', (code, signal) => done({ code, signal })); });
} finally { unlinkSync(temporary); }
const capture = JSON.parse(readFileSync(output+'/verification.json', 'utf8'));
const receipt = { version: 1, engine, childExit: exit, complete: exit?.code === 0 && capture.complete === true,
  sourceCollectorSha256: digest(original), adaptedCollectorSha256: digest(code), originalCollectorRestoredExactly: true,
  sourceGameFilesEdited: false, extraGameTimers: false, additionalActiveObservers: false,
  physicalDevice: false, whiteScreenFixed: false };
writeFileSync(output+'/receipt.json', JSON.stringify(receipt, null, 2)+'\n');
execFileSync(process.execPath, ['verification/direct-boss-style-device-20261102/verifyScope.mjs'], { cwd: root, stdio: 'inherit' });
console.log('CRITICAL_JOURNAL_FLOW '+JSON.stringify({ receipt, cycles: capture.cycles, criticalReportSummary: capture.criticalReportSummary,
  normalReportVerified: capture.normalReportVerified, diagnosticResourceCheckpointVerified: capture.diagnosticResourceCheckpointVerified }));
assert.equal(receipt.complete, true, 'Failures stay failures; no automatic Resume or retry');
