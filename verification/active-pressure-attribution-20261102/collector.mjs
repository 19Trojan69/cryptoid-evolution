import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { memoryTraceEvents, summarizeMemoryTrace } from '../boss2-native-memory-20261029/nativeSummary.mjs';
import { requirePressureTrigger, rendererPss } from './policy.mjs';
const within = (promise, ms) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(Error('Active light-dump deadline')), ms);
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});
const paths = ['blink_gc', 'blink_gc/main/heap', 'blink_objects', 'v8', 'malloc', 'partition_alloc',
  'cc', 'cc/image_memory', 'skia', 'discardable', 'canvas', 'media', 'web_cache', 'shared_memory', 'gpu', 'gpu/shared_images'];

// A separate, explicitly instrumented active diagnostic. It does not reuse or
// relax the existing inactive collector. Exactly one light dump, no automatic
// triggers, no deterministic/forced GC, no heap profiler or animation scan.
export async function captureActiveLight({ session, guard, trigger, sample, save }) {
  try { requirePressureTrigger(trigger); await guard(); }
  catch (error) { try { await within(session.detach(), 5000); } catch { /* Caller also closes the browser. */ } throw error; }
  const events = [], requests = [];
  let tracing = false, ended = false, fault = null, completion = null;
  const result = { complete: false, trigger, activeInstrumentation: true, lightDumpOnly: true,
    deterministic: false, automaticDumpTriggers: [], maximumExplicitDumps: 1,
    memoryComparisonEligible: false, physicalDevice: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false };
  const receive = event => {
    try {
      assert.ok(Array.isArray(event.value)); const filtered = memoryTraceEvents(event.value);
      if (events.length + filtered.length > 128) { fault ||= 'event-budget'; return; }
      events.push(...filtered);
    } catch { fault ||= 'malformed-native-events'; }
  };
  session.on('Tracing.dataCollected', receive);
  const stop = async () => {
    if (!tracing) return;
    let callback;
    const completed = new Promise(resolve => { callback = resolve; session.once('Tracing.tracingComplete', callback); });
    try {
      const [, done] = await within(Promise.all([session.send('Tracing.end'), completed]), 15000);
      completion = done; ended = true;
    } finally { tracing = false; session.off('Tracing.tracingComplete', callback); }
  };
  const write = () => {
    const raw = Buffer.from(JSON.stringify({ traceEvents: events })); assert.ok(raw.length <= 8 * 1024 * 1024);
    const compressed = gzipSync(raw, { level: 6 }); save(compressed);
    return { file: 'active-light-memory.json.gz', bytes: raw.length, compressedBytes: compressed.length,
      sha256: createHash('sha256').update(compressed).digest('hex'), events: events.length,
      dataLossOccurred: completion?.dataLossOccurred ?? null, collectorFault: fault };
  };
  const started = Date.now();
  try {
    await within(session.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: {
      recordMode: 'recordUntilFull', traceBufferSizeInKb: 16384,
      excludedCategories: ['*'], includedCategories: ['disabled-by-default-memory-infra'],
      memoryDumpConfig: { triggers: [] } } }), 30000); tracing = true; result.tracingStarted = true;
    result.beforeDumpMemory = sample(); rendererPss(result.beforeDumpMemory);
    result.stateBeforeDump = await guard();
    const requested = Date.now();
    const dump = await within(session.send('Tracing.requestMemoryDump', { deterministic: false, levelOfDetail: 'light' }), 30000);
    result.requestWallMs = Date.now() - requested;
    requests.push({ label: 'active-light-trigger', ...dump }); result.requests = requests;
    result.afterDumpMemory = sample(); rendererPss(result.afterDumpMemory);
    result.stateAfterDump = await guard(); assert.equal(dump.success, true);
    await stop(); result.afterTraceMemory = sample(); rendererPss(result.afterTraceMemory);
    result.trace = write(); assert.equal(fault, null); assert.equal(completion?.dataLossOccurred, false);
    const parsed = summarizeMemoryTrace(events, requests, { exportedSnapshotIds: true });
    assert.equal(parsed.length, 1);
    assert.ok(parsed[0].processes.some(p => /renderer/i.test(p.processName)
      && p.allocators.some(row => row.path === 'blink_gc/main/heap' && row.bytes !== null)), 'Actual light Blink heap counters');
    result.dump = { ...parsed[0], processes: parsed[0].processes.map(p => ({ processId: p.processId,
      processName: p.processName, fragmentIndex: p.fragmentIndex, allocatorCount: p.allocatorCount,
      categories: Object.fromEntries(paths.map(path => [path, p.allocators.find(row => row.path === path)?.bytes ?? null])),
      blinkHeap: p.allocators.find(row => row.path === 'blink_gc/main/heap') ?? null,
      largestReportedSizes: p.largestReportedSizes.slice(0, 20),
      outsideSafeIntegerRange: p.allocators.filter(row => Object.keys(row.unrepresentableByteScalars).length)
        .map(row => ({ path: row.path, attributes: row.unrepresentableByteScalars })),
      sharedOwnershipEdges: p.sharedOwnershipEdges, processTotals: p.processTotals, reportedSizesMustNotBeSummed: true })) };
    result.rendererPssKiB = { trigger: rendererPss(trigger.memory), beforeDump: rendererPss(result.beforeDumpMemory),
      afterDump: rendererPss(result.afterDumpMemory), afterTrace: rendererPss(result.afterTraceMemory) };
    result.pressureMaintainedAcrossProbe = trigger.mode === 'pressure'
      && Object.values(result.rendererPssKiB).every(value => value >= trigger.thresholdKiB);
    result.complete = true;
  } catch (error) {
    result.failure = { code: 'active-light-collection-failed', message: error.message };
  } finally {
    if (tracing) try { await stop(); } catch (error) { result.stopFailure = error.message; }
    if (!result.trace) try { result.trace = write(); } catch (error) { result.traceSaveFailure = error.message; }
    session.off('Tracing.dataCollected', receive);
    try { await within(session.detach(), 5000); result.sessionDetached = true; }
    catch { result.sessionDetached = false; }
    result.tracingStopped = ended; result.captureWallMs = Date.now() - started;
  }
  return result;
}
