import assert from 'node:assert/strict';
import test from 'node:test';
import { byteScalar, dumpGuid, summarizeMemoryTrace, memoryTraceEvents } from './nativeSummary.mjs';
const scalar = value => ({ type: 'scalar', units: 'bytes', value });
test('trace scalar bytes are hexadecimal, not decimal', () => {
  assert.equal(byteScalar(scalar('100')), 256); assert.equal(byteScalar(scalar('0x1F')), 31);
  assert.equal(byteScalar({ type: 'scalar', units: 'objects', value: '100' }), null);
  assert.throws(() => byteScalar(scalar('n/a')));
  assert.equal(byteScalar(scalar('1fffffffffffff')), Number.MAX_SAFE_INTEGER);
  assert.equal(byteScalar(scalar('20000000000000')), null);
  assert.equal(byteScalar(scalar('ffffffffffffffff')), null);
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
test('preserves oversized backend byte counters exactly without rounding or inventing zero', () => {
  const events = [{ ph: 'v', id: '1', pid: 3, args: { dumps: { allocators: {
    malloc: { attrs: { size: scalar('100'), max_committed_size: scalar('fffffffffffff000') } },
    reservation: { attrs: { size: scalar('ffffffffffffffff') } },
  } } } }];
  const p = summarizeMemoryTrace(events, [{ label: 'paused', dumpGuid: '1', success: true }])[0].processes[0];
  assert.equal(p.processId, 3); assert.equal(p.largestReportedSizes.length, 1);
  assert.equal(p.allocators[0].bytes, 256); assert.equal(p.allocators[0].attributes.max_committed_size, null);
  assert.deepEqual(p.allocators[0].unrepresentableByteScalars.max_committed_size,
    { rawHex: '0xfffffffffffff000', reason: 'outside-safe-integer-range' });
  assert.equal(p.allocators[1].bytes, null);
  assert.equal(p.allocators[1].unrepresentableByteScalars.size.rawHex, '0xffffffffffffffff');
});
test('a large unrelated trace batch cannot discard a later memory dump', () => {
  const metadata = { ph: 'M', name: 'process_name', args: { name: 'Renderer' } };
  const dump = { ph: 'v', id: '1', args: { dumps: { allocators: {} } } };
  const unrelated = Array.from({ length: 300001 }, () => ({ ph: 'X', name: 'unrelated' }));
  assert.deepEqual(memoryTraceEvents([metadata, ...unrelated, dump]), [metadata, dump]);
});
test('associates exported snapshot IDs chronologically rather than confusing them with request GUIDs', () => {
  const snapshot = (id, ts, bytes) => ({ ph: 'v', id, ts, pid: 4, args: { dumps: { allocators: { skia: { attrs: { size: scalar(bytes) } } } } } });
  const events = [snapshot('0x2', 300, '300'), snapshot('0x0', 100, '100'), snapshot('0x1', 200, '200'),
    { ph: 'v', id: '0x0', ts: 100, pid: 4, args: { dumps: { process_totals: {} } } }];
  const requests = ['initial', 'end', 'unmounted'].map((label, index) => ({ label, success: true, dumpGuid: '0x' + (index + 1) }));
  const parsed = summarizeMemoryTrace(events, requests, { exportedSnapshotIds: true });
  assert.deepEqual(parsed.map(d => d.traceDumpId), ['0', '1', '2']);
  assert.deepEqual(parsed.map(d => d.processes[0].allocators[0].bytes), [256, 512, 768]);
  assert.equal(parsed[0].requestDumpGuid, '0x1'); assert.equal(parsed[0].matchedProcessDumps, 1);
  assert.equal(parsed[0].matchedDumpEvents, 2);
  assert.throws(() => summarizeMemoryTrace(events, requests.slice(0, 2), { exportedSnapshotIds: true }));
  assert.throws(() => summarizeMemoryTrace([...events, snapshot('0x0', 101, '400')], requests, { exportedSnapshotIds: true }));
  assert.throws(() => summarizeMemoryTrace(events, requests.map(r => ({ ...r, success: false })), { exportedSnapshotIds: true }));
});
