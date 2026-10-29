import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const read = name => readFileSync(new URL(name, import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
const summary = JSON.parse(read('results.json'));
const bytes = read(summary.evidence.file);
assert.equal(bytes.length, summary.evidence.bytes); assert.equal(hash(bytes), summary.evidence.sha256);
const evidence = JSON.parse(gunzipSync(bytes));
assert.equal(evidence.syntheticOnly, true); assert.equal(evidence.ownerRawReportsIncluded, false);
assert.equal(evidence.records.length, 4);
const failed = evidence.records.filter(record => !record.complete), accepted = evidence.records.filter(record => record.complete);
assert.equal(failed.length, 2); assert.equal(accepted.length, 2);
assert.deepEqual(accepted.map(record => record.engine).sort(), ['chromium', 'webkit']);
for (const record of failed) {
  assert.equal(record.build.sourceCommit, summary.firstAttempt.source);
  assert.equal(record.activeObservation, undefined);
  assert.ok(record.failure.message.includes('reactorDisplay'));
}
for (const record of accepted) {
  assert.equal(record.build.sourceCommit, summary.accepted.source);
  assert.equal(record.build.sourceTree, summary.accepted.tree);
  assert.equal(record.physicalDevice, false); assert.equal(record.whiteScreenFixed, false);
  assert.equal(record.build.diagnosticCssControl.kind, 'all-css-filters-off');
  assert.equal(record.build.diagnosticReactorControl.kind, 'svg-reactor-display-none');
  assert.equal(record.build.diagnosticReactorControl.stylesheetSha256, hash(read('reactorControl.css')));
  const { original, hidden } = record.pausedSameBuildComparison;
  assert.equal(hidden.reactorCount, 1); assert.equal(hidden.reactorDisplay, 'none'); assert.equal(hidden.reactorRects, 0);
  assert.notEqual(original.reactorDisplay, 'none'); assert.equal(original.reactorRects, 1);
  assert.deepEqual(original.boxes, hidden.boxes);
  assert.ok(record.activeObservation.durationMs >= 20000);
  assert.ok(record.activeObservation.finalCoreVolley >= record.activeObservation.initialCoreVolley + 2);
  assert.ok(record.activeObservation.finalFrameAt > record.activeObservation.initialFrameAt);
  assert.equal(record.activeObservation.sameDocument, true);
  assert.equal(record.realPauseFreezes, true); assert.equal(record.explicitReloadRestoresTime, true);
  assert.equal(record.limitedTextExportAfterDeliberateReload, true);
}
console.log('CRYPTOID_REACTOR_EVIDENCE ' + JSON.stringify({ passed: true, preservedFailures: failed.length,
  acceptedSyntheticCases: accepted.length, source: summary.accepted.source, physicalDeviceAccepted: false }));
