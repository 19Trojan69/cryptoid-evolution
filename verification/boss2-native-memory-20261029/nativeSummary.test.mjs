import assert from 'node:assert/strict';
import test from 'node:test';
import { byteScalar, dumpGuid, summarizeMemoryTrace, memoryTraceEvents } from './nativeSummary.mjs';
const scalar = value => ({ type: 'scalar', units: 'bytes', value });
test('trace scalar bytes are hexadecimal, not decimal', () => {
  assert.equal(byteScalar(scalar('100')), 256); assert.equal(byteScalar(scalar('0x1F')), 31);
  assert.equal(byteScalar({ type: 'scalar', units: 'objects', value: '100' }), null);
  assert.throws(() => byteScalar(scalar('n/a'))); assert.throws(() => byteScalar(scalar('ffffffffffffffff')));
});
test('normalizes equivalent dump GUID spellings', () => {
  assert.equal(dumpGuid('0x0000AB'), 'ab'); assert.equal(dumpGuid('ab'), 'ab'); assert.throws(() => dumpGuid(null));
});
test('matches explicit dump IDs and preserves separate allocator sizes and ownership', () => {
  const events = [{ ph: 'M', name: 'process_name', pid: 2, args: { name: 'Renderer' } },
    { ph: 'v', id: '0x0a', pid: 2, args: { dumps: { allocators: {
      skia: { attrs: { size: scalar('100') } }, 'skia/cache': { attrs: { size: scalar('80') } },
    }, allocators_graph: [{ source: '1', target: '2' }] } } },
    { ph: 'v', id: 'b', pid: 2, args: { dumps: { allocators: { unrelated: { attrs: { size: scalar('fff') } } } } } }];
  const [summary] = summarizeMemoryTrace(events, [{ label: 'paused', dumpGuid: 'a', success: true }]);
  assert.equal(summary.matchedProcessDumps, 1); const p = summary.processes[0];
  assert.equal(p.processName, 'Renderer'); assert.equal(p.allocatorCount, 2);
  assert.equal(p.largestReportedSizes[0].bytes, 256); assert.equal(p.sharedOwnershipEdges, 1);
  assert.equal(p.reportedSizesMustNotBeSummed, true); assert.equal('totalBytes' in p, false);
});
test('explicitly records a missing dump rather than inventing zero memory', () => {
  assert.equal(summarizeMemoryTrace([], [{ label: 'missing', dumpGuid: '1', success: false }])[0].matchedProcessDumps, 0);
});
test('a large unrelated trace batch cannot discard a later memory dump', () => {
  const metadata = { ph: 'M', name: 'process_name', args: { name: 'Renderer' } };
  const dump = { ph: 'v', id: '1', args: { dumps: { allocators: {} } } };
  const unrelated = Array.from({ length: 300001 }, () => ({ ph: 'X', name: 'unrelated' }));
  assert.deepEqual(memoryTraceEvents([metadata, ...unrelated, dump]), [metadata, dump]);
});
