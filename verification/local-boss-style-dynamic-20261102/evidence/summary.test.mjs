import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { summarizeDynamic, classifyDynamicSet } from './summary.mjs';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url)));
const manifest = read('manifest.json');
function actual(engine) {
  const cell = manifest.captures.find(c => c.label === 'initial' && c.engine === engine);
  return { cell, capture: read(cell.observation.file) };
}
test('the actual initial WebKit capture establishes only component fidelity, retaining full update/animation/unmount requirements', () => {
  const { cell, capture } = actual('webkit'), s = summarizeDynamic(capture, cell, manifest.expectedCssBlob);
  assert.equal(s.complete, true); assert.equal(s.checks.dynamicCases, 1801); assert.equal(s.checks.sameNodeChecks, 3500);
  assert.equal(s.checks.retainedStartedAnimationChecks, 66); assert.equal(s.memoryBenefitMeasured, false); assert.equal(s.whiteScreenFixed, false);
  for (const change of [c => c.final.rootsUnmounted = false, c => c.final.dynamicCases--,
    c => c.modelsCompleted.pop(), c => c.final.retainedStartedAnimationChecks = 0,
    c => c.gameControllerStarted = true, c => c.componentProofs.leaves.newDomNodes = true,
    c => c.observedCompilerTransforms['leaves/BossReactorView'] = '0'.repeat(40), c => c.sourceTree = '0'.repeat(40)]) {
    const c = structuredClone(capture); change(c); assert.throws(() => summarizeDynamic(c, cell, manifest.expectedCssBlob));
  }
});
test('the initial failed Chromium observation cannot become a success or satisfy a two-engine gate', () => {
  const { cell, capture } = actual('chromium'), s = summarizeDynamic(capture, cell, manifest.expectedCssBlob);
  assert.equal(s.complete, false); assert.equal(s.completedModels, 7); assert.equal(s.checks, null); assert.equal(s.rootsUnmounted, null);
  const w = actual('webkit'); const cohort = classifyDynamicSet([s, summarizeDynamic(w.capture, w.cell, manifest.expectedCssBlob)]);
  assert.equal(cohort.retainedProtocolFailures, 1); assert.equal(cohort.componentFidelityEstablishedInBothEngines, false);
  capture.complete = true; assert.throws(() => summarizeDynamic(capture, cell, manifest.expectedCssBlob));
});
test('the complete archive keeps earlier failures even when both exact-CSSOM native comparisons pass', () => {
  const rows = manifest.captures.map(cell => summarizeDynamic(read(cell.observation.file), cell, manifest.expectedCssBlob));
  const cohort = classifyDynamicSet(rows);
  assert.equal(cohort.retainedProtocolFailures, rows.filter(r => !r.complete).length);
  assert.equal(cohort.componentFidelityEstablishedInBothEngines,
    rows.filter(r => r.label === 'cssom').length === 2 && rows.filter(r => r.label === 'cssom').every(r => r.complete));
  assert.equal(cohort.wholeGameStartupVerified, false); assert.equal(cohort.memoryBenefitMeasured, false); assert.equal(cohort.whiteScreenFixed, false);
  assert.throws(() => classifyDynamicSet([...rows.slice(0, 1), rows[0]]));
  const latest = rows.filter(r => r.label === 'cssom');
  if (latest.length === 2 && latest.every(r => r.complete)) {
    const changed = structuredClone(rows); changed.find(r => r.label === 'cssom').sourceCommit = '0'.repeat(40);
    assert.throws(() => classifyDynamicSet(changed));
  }
});
