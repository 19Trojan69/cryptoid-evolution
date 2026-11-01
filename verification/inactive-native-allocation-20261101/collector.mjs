import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { memoryTraceEvents, summarizeMemoryTrace } from '../boss2-native-memory-20261029/nativeSummary.mjs';

export const boundaries = [
  ['paused-settled-before-gc', 'paused'], ['paused-after-gc', 'paused'],
  ['home-after-gc', 'unmounted'], ['blank-after-gc', 'blank'],
];
const deadline = (promise, ms) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(Error('Inactive native trace deadline')), ms);
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});
const selected = ['blink_gc', 'blink_objects', 'v8', 'malloc', 'partition_alloc', 'cc', 'cc/image_memory',
  'skia', 'discardable', 'canvas', 'media', 'web_cache', 'shared_memory', 'gpu', 'gpu/shared_images'];
export async function startInactiveNativeCollector({ session, guard, save }) {
  await guard('paused');
  const events = [], requests = [];
  let finished = false, fault = null, tracing = false, traceWritten = false;
  const receive = event => {
    try {
      assert.ok(Array.isArray(event.value));
      const memory = memoryTraceEvents(event.value);
      if (events.length + memory.length > 256) { fault ||= 'native-trace-event-budget'; return; }
      events.push(...memory);
    } catch { fault ||= 'native-trace-malformed-event'; }
  };
  session.on('Tracing.dataCollected', receive);
  const write = completion => {
    const raw = Buffer.from(JSON.stringify({ traceEvents: events }));
    assert.ok(raw.length <= 128 * 1024 * 1024, 'Bounded native trace bytes');
    const compressed = gzipSync(raw, { level: 6 }); save(compressed); traceWritten = true;
    return { file: 'native-memory-infra.json.gz', events: events.length, bytes: raw.length,
      compressedBytes: compressed.length, sha256: createHash('sha256').update(compressed).digest('hex'),
      dataLossOccurred: completion?.dataLossOccurred ?? null, collectorFault: fault };
  };
  const stop = async () => {
    if (!tracing) return null;
    let complete;
    const completed = new Promise(resolve => { complete = resolve; session.once('Tracing.tracingComplete', complete); });
    try {
      const [, completion] = await deadline(Promise.all([session.send('Tracing.end'), completed]), 15000);
      return completion;
    } finally { tracing = false; session.off('Tracing.tracingComplete', complete); }
  };
  const retire = async () => {
    finished = true; session.off('Tracing.dataCollected', receive);
    try { await deadline(session.detach(), 5000); } catch { /* Browser close also retires this test-only session. */ }
  };
  try {
    await deadline(session.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: {
      recordMode: 'recordUntilFull', traceBufferSizeInKb: 65536,
      excludedCategories: ['*'], includedCategories: ['disabled-by-default-memory-infra'],
      memoryDumpConfig: { triggers: [] } } }), 30000);
    tracing = true;
  } catch (error) { await retire(); throw error; }
  return {
    get finished() { return finished; },
    wants: label => boundaries.some(row => row[0] === label),
    async request(label, phase) {
      assert.equal(finished, false); assert.equal(fault, null);
      assert.deepEqual([label, phase], boundaries[requests.length], 'Four explicit chronological dump boundaries');
      await guard(phase);
      const dump = await deadline(session.send('Tracing.requestMemoryDump', { deterministic: false, levelOfDetail: 'detailed' }), 30000);
      requests.push({ label, phase, ...dump }); assert.equal(dump.success, true);
      await guard(phase); return { deterministic: false, ...dump };
    },
    async finish() {
      let completion;
      try {
        completion = await stop();
        const trace = write(completion);
        assert.equal(fault, null); assert.equal(completion?.dataLossOccurred, false);
        assert.equal(requests.length, boundaries.length);
        const parsed = summarizeMemoryTrace(events, requests, { exportedSnapshotIds: true });
        for (const dump of parsed) assert.ok(dump.processes.some(p => /renderer/i.test(p.processName)
          && p.allocatorCount > 0 && p.allocators.some(row => selected.includes(row.path) && row.bytes !== null)),
          'Actual renderer allocator values required at every checkpoint');
        const checkpoints = parsed.map(dump => ({ ...dump,
          processes: dump.processes.map(process => ({ processId: process.processId,
            fragmentIndex: process.fragmentIndex, processName: process.processName, allocatorCount: process.allocatorCount,
            categories: Object.fromEntries(selected.map(name => [name, process.allocators.find(row => row.path === name)?.bytes ?? null])),
            largestReportedSizes: process.largestReportedSizes.slice(0, 20),
            outsideSafeIntegerRange: process.allocators.filter(row => Object.keys(row.unrepresentableByteScalars).length)
              .map(row => ({ path: row.path, attributes: row.unrepresentableByteScalars })),
            sharedOwnershipEdges: process.sharedOwnershipEdges, processTotals: process.processTotals,
            reportedSizesMustNotBeSummed: true })) }));
        return { attachedOnlyAfterActiveInterval: true, deterministic: false, automaticDumpTriggers: [],
          requests, trace, checkpoints, physicalDevice: false, nativeTerminationCauseMeasured: false,
          limits: 'Explicit inactive allocator dumps; overlapping categories must not be added into total RAM/GPU memory. The dump itself may influence memory and normal GC remains possible.' };
      } finally {
        if (!traceWritten) try { write(completion); } catch { /* Preserve the original collection failure. */ }
        await retire();
      }
    },
    async abort() {
      if (finished) return;
      try { const completion = await stop(); write(completion); } finally { await retire(); }
    },
  };
}
