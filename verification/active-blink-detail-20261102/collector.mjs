import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { memoryTraceEvents } from '../boss2-native-memory-20261029/nativeSummary.mjs';
import { requireDetailTrigger, rendererPss, limits } from './policy.mjs';
import { classifyDetailed } from './classify.mjs';
const within = (promise, ms) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(Error('Active detailed-dump deadline')), ms);
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});

// This separate active protocol never changes the prior light or inactive
// collectors. One explicit detailed dump, no automatic triggers or requested GC.
export async function captureActiveDetail({ session, guard, trigger, sample, save }) {
  let initial;
  try { requireDetailTrigger(trigger); initial = await guard(); }
  catch (error) { try { await within(session.detach(), 5000); } catch { /* Caller closes browser as well. */ } throw error; }
  const events = [], requests = []; let eventBytes = 0, tracing = false, ended = false, fault = null, completion = null;
  const result = { complete: false, trigger, stateBeforeTrace: initial, activeInstrumentation: true,
    levelOfDetail: 'detailed', deterministic: false, automaticDumpTriggers: [], maximumExplicitDumps: 1,
    memoryComparisonEligible: false, physicalDevice: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false };
  const receive = event => {
    try {
      assert.ok(Array.isArray(event.value)); const filtered = memoryTraceEvents(event.value);
      const bytes = Buffer.byteLength(JSON.stringify(filtered));
      if (events.length + filtered.length > limits.events || eventBytes + bytes > limits.rawBytes - 1024) {
        fault ||= 'native-event-or-byte-budget'; return;
      }
      eventBytes += bytes; events.push(...filtered);
    } catch { fault ||= 'malformed-native-events'; }
  };
  session.on('Tracing.dataCollected', receive);
  const stop = async () => {
    if (!tracing) return;
    let callback; const completed = new Promise(resolve => { callback = resolve; session.once('Tracing.tracingComplete', callback); });
    try {
      const [, done] = await within(Promise.all([session.send('Tracing.end'), completed]), 15000);
      completion = done; ended = true;
    } finally { tracing = false; session.off('Tracing.tracingComplete', callback); }
  };
  const write = () => {
    const raw = Buffer.from(JSON.stringify({ traceEvents: events })); assert.ok(raw.length <= limits.rawBytes);
    const compressed = gzipSync(raw, { level: 6 }); save(compressed);
    return { file: 'active-detailed-memory.json.gz', bytes: raw.length, compressedBytes: compressed.length,
      sha256: createHash('sha256').update(compressed).digest('hex'), events: events.length,
      dataLossOccurred: completion?.dataLossOccurred ?? null, collectorFault: fault };
  };
  const started = Date.now();
  try {
    await within(session.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: {
      recordMode: 'recordUntilFull', traceBufferSizeInKb: limits.traceBufferKiB,
      excludedCategories: ['*'], includedCategories: ['disabled-by-default-memory-infra'],
      memoryDumpConfig: { triggers: [] } } }), 30000); tracing = true; result.tracingStarted = true;
    result.beforeDumpMemory = sample(); rendererPss(result.beforeDumpMemory); result.stateBeforeDump = await guard();
    const requested = Date.now();
    const dump = await within(session.send('Tracing.requestMemoryDump', { deterministic: false, levelOfDetail: 'detailed' }), 30000);
    result.requestWallMs = Date.now() - requested; requests.push({ label: 'active-detailed-trigger', ...dump }); result.requests = requests;
    result.afterDumpMemory = sample(); rendererPss(result.afterDumpMemory); result.stateAfterDump = await guard();
    assert.equal(dump.success, true); await stop();
    result.afterTraceMemory = sample(); rendererPss(result.afterTraceMemory); result.stateAfterTrace = await guard();
    result.trace = write(); assert.equal(fault, null); assert.equal(completion?.dataLossOccurred, false);
    assert.ok(result.stateAfterTrace.frameAt > initial.frameAt, 'Actual game frames advance across collection');
    result.dump = classifyDetailed(events, requests);
    result.rendererPssKiB = { trigger: rendererPss(trigger.memory), beforeDump: rendererPss(result.beforeDumpMemory),
      afterDump: rendererPss(result.afterDumpMemory), afterTrace: rendererPss(result.afterTraceMemory) };
    result.pressureMaintainedAtSampledBoundaries = trigger.mode === 'pressure'
      && Object.values(result.rendererPssKiB).every(value => value >= trigger.qualificationKiB);
    result.complete = true;
  } catch (error) { result.failure = { code: 'active-detailed-collection-failed', message: error.message }; }
  finally {
    if (tracing) try { await stop(); } catch (error) { result.stopFailure = error.message; }
    if (!result.trace) try { result.trace = write(); } catch (error) { result.traceSaveFailure = error.message; }
    session.off('Tracing.dataCollected', receive);
    try { await within(session.detach(), 5000); result.sessionDetached = true; } catch { result.sessionDetached = false; }
    result.tracingStopped = ended; result.captureWallMs = Date.now() - started;
    if (!ended || !result.sessionDetached) {
      result.complete = false; result.failure ||= { code: 'active-detailed-cleanup-failed', message: 'Tracing or session cleanup not confirmed' };
    }
  }
  return result;
}
