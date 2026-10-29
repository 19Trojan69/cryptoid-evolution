import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const directory = fileURLToPath(new URL('.', import.meta.url));
const receipt = JSON.parse(readFileSync(directory + 'artifacts.json'));
const bytes = readFileSync(directory + receipt.evidence.file);
assert.equal(createHash('sha256').update(bytes).digest('hex'), receipt.evidence.sha256);
const evidence = JSON.parse(gunzipSync(bytes));
assert.equal(evidence.syntheticOnly, true); assert.equal(evidence.physicalOwnerReportsIncluded, false);
const excluded = evidence.captures.filter(c => c.attempt === 1);
assert.equal(excluded.length, 8);
for (const c of excluded) {
  assert.equal(c.verification.complete, false); assert.equal(c.verification.points.length, 0);
  assert.equal(c.jobConclusion, 'failure');
  assert.match(c.verification.failure.message, /getBoundingClientRect/);
}
const captures = evidence.captures.filter(c => c.attempt === 2);
const conditions = ['standard', 'hud-backdrop-off', 'boss-hull-filter-off', 'all-css-filters-off'];
const expected = ['chromium', 'webkit'].flatMap(engine => conditions.map(condition => engine + '-' + condition));
assert.deepEqual(captures.map(c => c.case).sort(), expected.sort());
const median = numbers => {
  assert.ok(numbers.length); const values = [...numbers].sort((a, b) => a - b), mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
};
const rows = captures.map(c => {
  const v = c.verification;
  assert.equal(v.sourceCommit, receipt.sourceCommit); assert.equal(v.physicalDevice, false);
  assert.equal(v.diagnostics, false); assert.equal(v.protection, true); assert.equal(v.reducedEffects, false);
  assert.equal(v.activeProfiler, false); assert.equal(v.activeScreenshots, false); assert.equal(v.forcedGc, false);
  assert.equal(v.preparationResumeOutsideObservation, true);
  const accepted = v.complete === true && c.jobConclusion === 'success';
  const row = { case: c.case, engine: v.engine, condition: v.condition,
    acceptedCompleteObservation: accepted, originalVerificationComplete: v.complete,
    originalJobConclusion: c.jobConclusion, originalFailure: v.failure ?? null,
    jobId: c.jobId, artifactId: c.artifactId, activeSeconds: v.observedActiveSeconds ?? null,
    volleys: v.volleyProgress ?? null, initialAppearance: v.originalPausedAppearance ?? null,
    preparedAppearance: v.preparedAppearance ?? null, finalAppearance: v.finalPausedAppearance ?? null };
  if (!accepted) return row;
  assert.ok(v.observedActiveSeconds >= 90); assert.ok(v.volleyProgress.last > v.volleyProgress.first);
  assert.equal(v.additionalFullRecordingAbsent, true); assert.deepEqual(v.unexpectedExternalRequests, []);
  assert.ok(v.points.length >= 60);
  for (const point of v.points) {
    assert.equal(point.process.contentProcessObserved, true); assert.ok(point.process.summedPssKiB > 0);
    assert.equal(point.audio.audioSampleBuffers, 46);
  }
  const before = v.originalPausedAppearance, prepared = v.preparedAppearance, end = v.finalPausedAppearance;
  assert.equal(before.hud.backdropFilter, 'blur(10px)'); assert.match(before.bossHull.filter, /drop-shadow\(/);
  for (const key of ['width', 'height', 'dpr', 'motion', 'nodeCount']) assert.equal(before[key], prepared[key]);
  for (const a of [prepared, end]) {
    assert.equal(a.motion, 'standard'); assert.equal(a.width, 430); assert.equal(a.dpr, 3);
    assert.equal(a.hud.backdropFilter, ['hud-backdrop-off', 'all-css-filters-off'].includes(v.condition) ? 'none' : 'blur(10px)');
    if (['boss-hull-filter-off', 'all-css-filters-off'].includes(v.condition)) assert.equal(a.bossHull.filter, 'none');
    else assert.match(a.bossHull.filter, /drop-shadow\(/);
    if (v.condition === 'all-css-filters-off') { assert.equal(a.filterCount, 0); assert.equal(a.backdropCount, 0); }
  }
  const tail = v.points.filter(p => p.seconds >= v.observedActiveSeconds - 30);
  row.last30SecondMedianPssMiB = median(tail.map(p => p.process.summedPssKiB / 1024));
  row.last30SecondPssRangeMiB = [Math.min(...tail.map(p => p.process.summedPssKiB / 1024)),
    Math.max(...tail.map(p => p.process.summedPssKiB / 1024))];
  const role = v.engine === 'webkit' ? 'webkit-content' : 'chromium-renderer';
  row.last30SecondMedianContentPssMiB = median(tail.map(p => p.process.processes
    .filter(process => process.role === role).reduce((sum, process) => sum + process.pssKiB, 0) / 1024));
  row.sampleCount = v.points.length;
  row.audioSampleBufferCount = 46;
  row.audioBufferByteRange = [Math.min(...v.points.map(p => p.audio.audioBufferBytes)), Math.max(...v.points.map(p => p.audio.audioBufferBytes))];
  row.maxTrackedCanvasCacheBytes = Math.max(...v.points.map(p => p.canvas.cacheBytes));
  row.observedCanvasFailures = [...new Set(v.points.flatMap(p => p.canvas.failures))];
  return row;
}).sort((a, b) => a.engine.localeCompare(b.engine) || conditions.indexOf(a.condition) - conditions.indexOf(b.condition));
for (const row of rows.filter(r => r.acceptedCompleteObservation)) {
  const baseline = rows.find(r => r.engine === row.engine && r.condition === 'standard' && r.acceptedCompleteObservation);
  if (baseline) row.singleRunDifferenceFromBaselineMiB = row.last30SecondMedianPssMiB - baseline.last30SecondMedianPssMiB;
}
const report = { schemaVersion: 1, sourceCommit: receipt.sourceCommit, sourceTree: receipt.sourceTree,
  workflowRunId: receipt.runId, workflowConclusion: receipt.runConclusion,
  syntheticOnly: true, applicationSourceChanged: false, deploymentChanged: false,
  physicalDeviceMeasured: false, physicalReducedEffectsResult: 'pending', nativeTerminationCauseMeasured: false,
  temperatureMeasured: false, whiteScreenFixed: false, evidence: receipt.evidence,
  acceptedObservations: rows.filter(r => r.acceptedCompleteObservation).length,
  excludedPreparationAttempt: { runId: receipt.preparationAttempt.runId,
    sourceCommit: receipt.preparationAttempt.sourceCommit, originalConclusion: 'failure', activeSamples: 0,
    cases: excluded.map(c => ({ case: c.case, jobId: c.jobId, artifactId: c.artifactId,
      originalFailure: c.verification.failure, originalVerificationComplete: false })) },
  expectedObservations: 8, scope: 'Original protected reactor fixture; CSS overrides only in automated browser; 90 active seconds.',
  limits: ['Single unseeded run per condition; compare volley progress and do not infer equal simulated work.',
    'Linux process PSS is not physical iOS/Android RAM or graphics residency.',
    'Paused computed-style probes establish applied CSS, not a GPU allocation stack.',
    'No CSS-filter setting is deployed; all-off deliberately alters appearance and retains non-filter graphics.'], rows };
writeFileSync(directory + 'results.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ accepted: report.acceptedObservations, expected: 8, rows: rows.map(r => ({ case: r.case,
  accepted: r.acceptedCompleteObservation, seconds: r.activeSeconds, volleys: r.volleys,
  pssMiB: r.last30SecondMedianPssMiB, differenceMiB: r.singleRunDifferenceFromBaselineMiB, failure: r.originalFailure })) }));
