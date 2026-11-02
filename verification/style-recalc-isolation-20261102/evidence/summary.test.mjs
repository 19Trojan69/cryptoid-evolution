import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { summarizeStyleRun, compareReplicas } from './summary.mjs';
const read = name => readFileSync(new URL(name, import.meta.url));
function failed(name) {
  const c = JSON.parse(gunzipSync(read(name + '-failed-r1.json.gz')));
  return { c, traces: { root: read(name + '-failed-r1-root-timeline.json.gz') },
    expected: { source: c.sourceCommit, tree: c.sourceTree, replica: 1, complete: false } };
}
function accepted(replica = 1) {
  const c = JSON.parse(gunzipSync(read('accepted-r' + replica + '.json.gz')));
  return { c, traces: Object.fromEntries(c.order.map(n => [n, read('accepted-r' + replica + '-' + n + '-timeline.json.gz')])),
    expected: { source: '37e51af5b74a3f2e6a623d6b440f181174e32cf2', tree: 'a9c03ae78b66dc9077138bf75da92a14744c7f05', replica, complete: true } };
}
test('all three archived restoration failures remain failures with absent accepted work counts', () => {
  for (const name of ['initial', 'diagnostic', 'restoration-order']) {
    const { c, traces, expected } = failed(name), s = summarizeStyleRun(c, traces, expected);
    assert.equal(s.complete, false); assert.equal(s.nativeWork, null);
    assert.equal(s.memoryBenefitEstablished, false); assert.equal(s.physicalPhoneAcceptanceEstablished, false);
    assert.equal(s.whiteScreenFixed, false);
  }
});
test('a partial native trace cannot be promoted by changing a completion flag, identity, guard or trace receipt', () => {
  for (const change of [c => c.complete = true, c => c.whiteScreenFixed = true,
    c => c.sourceTree = '0'.repeat(40), c => c.cases[0].before.elapsedMs++,
    c => c.cases[0].trace.sha256 = '0'.repeat(64), c => c.physicalDevice = true]) {
    const { c, traces, expected } = failed('diagnostic'); change(c);
    assert.throws(() => summarizeStyleRun(c, traces, expected));
  }
});
test('the accepted first browser capture reparses all four raw timelines and records empty attributes without claiming memory or phone benefit', () => {
  const { c, traces, expected } = accepted(), s = summarizeStyleRun(c, traces, expected);
  assert.deepEqual(s.nativeWork.map(c => c.totalElementStyleCalculations), [1520, 1520, 1200, 80]);
  assert.equal(s.nativeWork[0].rawStyleAttributePresenceIdentical, false);
  assert.deepEqual(s.nativeWork[0].emptySvgStyleAttributeIndices, [4, 5, 6]);
  assert.equal(s.memoryBenefitEstablished, false); assert.equal(s.whiteScreenFixed, false);
});
test('an accepted browser capture loses acceptance if rendering, restoration, animation identity or tracing cleanup differs', () => {
  for (const change of [c => c.cases[1].proof.outputs[3].heights[0] = '999px',
    c => c.cases[0].proof.originalInlineDeclarationsRestored = false,
    c => c.cases[0].proof.emptySvgStyleAttributeIndices = [0],
    c => c.cases[0].proof.originalInlineAttributePresenceRestored = true,
    c => c.cases[0].proof.sameNativeAnimationsStartsAndRates = false,
    c => c.cases[1].sessionDetached = false, c => c.cases[1].trace.dataLossOccurred = true,
    c => c.normalExitVerified = false, c => c.frameId = 'wrong-frame',
    c => c.cases[2].native.totalElementStyleCalculations = 0]) {
    const { c, traces, expected } = accepted(); change(c);
    assert.throws(() => summarizeStyleRun(c, traces, expected));
  }
});
test('a fresh reversed-order replica repeats the measured work reduction, with neither runtime memory nor physical acceptance inferred', () => {
  const summaries = [1, 2].map(i => { const { c, traces, expected } = accepted(i); return summarizeStyleRun(c, traces, expected); });
  const comparison = compareReplicas(summaries);
  assert.deepEqual(comparison.rows.map(c => c.totalElementStyleCalculations), [[1520, 1520], [1520, 1520], [1200, 1200], [80, 80]]);
  assert.equal(comparison.bothLocalStyleWorkReductionRepeated, true);
  assert.equal(comparison.activeRuntimeMemoryBenefitEstablished, false); assert.equal(comparison.whiteScreenFixed, false);
});
test('one capture, a reused replica, or a different engine cannot be relabelled a repeated controlled comparison', () => {
  const summaries = [1, 2].map(i => { const { c, traces, expected } = accepted(i); return summarizeStyleRun(c, traces, expected); });
  assert.throws(() => compareReplicas(summaries.slice(0, 1))); assert.throws(() => compareReplicas([summaries[0], summaries[0]]));
  const changed = structuredClone(summaries); changed[1].engineVersion = 'other'; assert.throws(() => compareReplicas(changed));
  changed[1].engineVersion = summaries[0].engineVersion; changed[1].complete = false; assert.throws(() => compareReplicas(changed));
});
