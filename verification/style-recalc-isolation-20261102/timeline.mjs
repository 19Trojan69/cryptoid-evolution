import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
export const maxEvents = 512, maxBytes = 2 * 1024 * 1024;
const within = (promise, ms) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(Error('Style timeline deadline')), ms);
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});
export function summarizeTimeline(events, { prefix, steps, frameId }) {
  assert.ok(Number.isSafeInteger(steps) && steps === 16); assert.equal(typeof frameId, 'string'); assert.ok(frameId);
  const recalc = events.filter(e => e.name === 'UpdateLayoutTree');
  assert.ok(recalc.length); for (const e of recalc) {
    assert.equal(e.ph, 'X', 'Complete native style spans required'); assert.ok(Number.isFinite(e.ts) && Number.isFinite(e.dur) && e.dur >= 0);
    assert.ok(Number.isSafeInteger(e.args?.elementCount) && e.args.elementCount >= 0, 'Actual native elementCount, not guessed zero');
  }
  const result = [], used = new Set(); let previousEnd = -Infinity;
  for (let i = 0; i < steps; i++) {
    const starts = events.filter(e => e.name === prefix + i + ':start'), ends = events.filter(e => e.name === prefix + i + ':end');
    assert.equal(starts.length, 1); assert.equal(ends.length, 1); const start = starts[0], end = ends[0];
    assert.equal(start.pid, end.pid); assert.ok(Number.isFinite(start.ts) && start.ts >= previousEnd && end.ts >= start.ts); previousEnd = end.ts;
    const rows = recalc.filter(e => e.pid === start.pid && e.ts >= start.ts && e.ts + e.dur <= end.ts + 1
      && e.args?.beginData?.frame === frameId);
    assert.ok(rows.length, 'Each marked style step must contain a real native span for this frame');
    for (const e of rows) { assert.ok(!used.has(e)); used.add(e); }
    result.push({ step: i, nativeEvents: rows.length, elementStyleCalculations: rows.reduce((n, e) => n + e.args.elementCount, 0),
      reportedNativeDurationUs: rows.reduce((n, e) => n + e.dur, 0) });
  }
  return { steps: result, totalElementStyleCalculations: result.reduce((n, r) => n + r.elementStyleCalculations, 0),
    unassignedSetupRestoreOrOtherStyleEvents: recalc.length - used.size,
    repeatedCalculationsAreWorkCountsNotUniqueDomNodes: true, instrumentedSyntheticWorkNotFrameRateOrMemoryBenefit: true };
}
export async function captureStyleTimeline({ session, guard, run, prefix, frameId, save }) {
  const events = []; let fault = null, tracing = false, stopped = false, completeEvent;
  const result = { complete: false, prefix, activeGameProfile: false, syntheticPausedStyleSweep: true,
    requestedGc: false, memoryDumpRequests: 0, heapProfiler: false, appOrAnimationClocksWritten: false };
  const receive = e => {
    try {
      assert.ok(Array.isArray(e.value)); const rows = e.value.filter(e => e.name === 'UpdateLayoutTree' || e.name?.startsWith(prefix)
        || e.ph === 'M' && e.name === 'process_name');
      if (events.length + rows.length > maxEvents) { fault ||= 'event-budget'; return; } events.push(...rows);
    } catch { fault ||= 'invalid-native-events'; }
  };
  const stop = async () => {
    let callback; const done = new Promise(resolve => { callback = resolve; session.once('Tracing.tracingComplete', callback); });
    try { const [, value] = await within(Promise.all([session.send('Tracing.end'), done]), 15000); completeEvent = value; stopped = true; }
    finally { tracing = false; session.off('Tracing.tracingComplete', callback); }
  };
  const write = () => {
    const raw = Buffer.from(JSON.stringify({ traceEvents: events })); assert.ok(raw.length <= maxBytes);
    const gzip = gzipSync(raw); save(gzip);
    return { bytes: raw.length, compressedBytes: gzip.length, sha256: createHash('sha256').update(gzip).digest('hex'),
      events: events.length, dataLossOccurred: completeEvent?.dataLossOccurred ?? null, collectorFault: fault };
  };
  session.on('Tracing.dataCollected', receive);
  try {
    result.before = await guard();
    await within(session.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { recordMode: 'recordUntilFull',
      traceBufferSizeInKb: 4096, excludedCategories: ['*'], includedCategories: ['devtools.timeline', 'blink.user_timing'], memoryDumpConfig: { triggers: [] } } }), 15000); tracing = true;
    result.proof = await run(); result.after = await guard(); await stop(); result.trace = write();
    assert.equal(fault, null); assert.equal(completeEvent?.dataLossOccurred, false);
    result.native = summarizeTimeline(events, { prefix, steps: result.proof.steps, frameId }); result.complete = true;
  } catch (e) { result.failure = e.message; }
  finally {
    if (tracing) try { await stop(); } catch (e) { result.stopFailure = e.message; }
    if (!result.trace) try { result.trace = write(); } catch (e) { result.saveFailure = e.message; }
    session.off('Tracing.dataCollected', receive);
    try { await within(session.detach(), 5000); result.sessionDetached = true; } catch { result.sessionDetached = false; }
    result.tracingStopped = stopped; if (!stopped || !result.sessionDetached) result.complete = false;
  }
  return result;
}
