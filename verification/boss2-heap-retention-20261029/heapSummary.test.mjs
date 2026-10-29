import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeHeap } from './heapSummary.mjs';

const fixture = () => ({ snapshot: { node_count: 4, edge_count: 3, meta: {
  node_fields: ['name', 'self_size', 'type', 'detachedness'],
  node_types: ['string', 'number', ['native', 'object', 'string'], 'number'],
} }, strings: ['HTMLDivElement', 'Object', 'secret compiled source', 'more source'],
nodes: [0, 80, 0, 2, 1, 32, 1, 0, 2, 100, 2, 0, 3, 60, 2, 0] });
test('reads field metadata, detached status and self sizes without leaking string contents', () => {
  const summary = summarizeHeap(fixture());
  assert.equal(summary.nodeCount, 4); assert.equal(summary.selfBytes, 272);
  assert.equal(summary.detachedNodes, 1); assert.equal(summary.detachedSelfBytes, 80);
  assert.deepEqual(summary.groups[0], { type: 'string', name: '(string contents omitted)', count: 2, selfBytes: 160, detachedNodes: 0 });
  assert.equal(JSON.stringify(summary).includes('secret compiled source'), false);
});
test('rejects incomplete and inconsistent snapshots', () => {
  const partial = fixture(); partial.nodes.pop(); assert.throws(() => summarizeHeap(partial), /complete/);
  const mismatch = fixture(); mismatch.snapshot.node_count = 8; assert.throws(() => summarizeHeap(mismatch));
});
test('older schemas explicitly report absent detachedness', () => {
  const old = fixture(); old.snapshot.meta.node_fields.pop(); old.snapshot.meta.node_types.pop();
  old.nodes = [0, 80, 0, 1, 32, 1, 2, 100, 2, 3, 60, 2];
  const summary = summarizeHeap(old); assert.equal(summary.detachednessAvailable, false);
  assert.equal(summary.detachedNodes, 0); assert.equal(summary.selfBytes, 272);
});
