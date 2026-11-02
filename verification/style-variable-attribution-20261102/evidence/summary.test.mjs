import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { summarizeStyle } from './summary.mjs';
const capture = () => JSON.parse(gunzipSync(readFileSync(new URL('./capture.json.gz', import.meta.url))));
test('actual short native API observation reproduces its counts without becoming a memory improvement', () => {
  const result = summarizeStyle(capture());
  assert.equal(result.totals.calls, 24929); assert.equal(result.unclassifiedOwnerCalls, 0);
  assert.equal(result.byProperty.find(row => row.property === '--boss-thrust').differentPreviousArgument, 1796);
  assert.equal(result.memoryComparisonEligible, false); assert.equal(result.whiteScreenFixed, false);
});
test('wrong source, relabeled duration and combined treatments cannot enter the observation', () => {
  for (const mutate of [row => row.sourceCommit = '0'.repeat(40), row => row.sourceTree = '0'.repeat(40),
    row => row.requestedSeconds = 1200, row => row.inactiveNativeAllocationRequested = true,
    row => row.isolatedMiniPacing = { condition: 'bypass' }]) {
    const row = capture(); mutate(row); assert.throws(() => summarizeStyle(row));
  }
});
test('an unretired or partial observation cannot be passed to heavy inspection or described as restored', () => {
  for (const mutate of [row => row.styleProbeRemovedBeforeInactiveInspection = false,
    row => row.styleWriteObservation.setPropertyRestored = false,
    row => row.styleWriteObservation.styleGettersRestored = false,
    row => row.styleWriteObservation.overflow = 1,
    row => row.styleWriteObservation.extraStyleValueReads = true]) {
    const row = capture(); mutate(row); assert.throws(() => summarizeStyle(row));
  }
});
test('inconsistent or duplicate groups and missing positive original owners cannot support attribution', () => {
  for (const mutate of [row => row.styleWriteObservation.groups[0].calls++,
    row => row.styleWriteObservation.groups.push(structuredClone(row.styleWriteObservation.groups[0])),
    row => row.styleWriteObservation.groups = row.styleWriteObservation.groups.filter(group => !group.owner.includes('boss-special-weapon'))]) {
    const row = capture(); mutate(row); assert.throws(() => summarizeStyle(row));
  }
});
