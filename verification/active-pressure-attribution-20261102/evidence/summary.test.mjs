import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { summarizePressure } from './summary.mjs';
import { pressurePlan, rendererPss } from '../policy.mjs';
const read = file => readFileSync(new URL(file, import.meta.url));
const source = () => JSON.parse(gunzipSync(read('calibration-r1.json.gz')));
const native = () => read('calibration-r1-native.json.gz');
const cell = { mode: 'calibration', replica: 1 };

test('the archived real active calibration reparses light counters and never becomes high-pressure or phone acceptance', () => {
  const c = source(), s = summarizePressure(c, native(), cell);
  assert.equal(s.runtimeComplete, true); assert.equal(s.observedActiveMs, 60000);
  assert.equal(s.pressureEvidenceQualified, false); assert.equal(s.physicalPhoneAcceptanceEstablished, false);
  assert.equal(s.whiteScreenFixed, false); assert.equal(s.native.requestWallMs, 52);
  assert.equal(s.native.captureWallMs, 291); assert.equal(s.native.categoriesAndFragmentsOverlapMustNotBeSummed, true);
  const p = s.native.rendererFragments.find(p => p.blinkHeap);
  assert.equal(p.blinkHeap.bytes, 62324816); assert.equal(p.blinkHeap.attributes.allocated_objects_size, 15659968);
  assert.equal(p.categories.canvas, 1880312); assert.equal(p.categories.blink_objects, null);
  assert.ok(c.points.some(p => !Number.isInteger(p.activeMs)), 'Real fractional stopwatch values are preserved');
});
test('calibration cannot be promoted to pressure by changing a success label or flag', () => {
  for (const mutate of [c => c.pressureEvidenceQualified = true,
    c => c.nativeProbe.pressureMaintainedAcrossProbe = true, c => c.outcome = 'active-pressure-collected']) {
    const c = source(); mutate(c); assert.throws(() => summarizePressure(c, native(), cell));
  }
  assert.throws(() => summarizePressure(source(), native(), { mode: 'pressure', replica: 1 }));
});
test('wrong source, source drift, accelerated clocks, missing dependency provenance and a technical pause invalidate an asserted successful capture', () => {
  for (const mutate of [c => c.sourceTree = '0'.repeat(40), c => c.changedTrackedPaths.push('frontend/src/pages/GamePage.tsx'),
    c => c.clocksAccelerated = true, c => delete c.engineVersion, c => delete c.actualInstalledPackages,
    c => c.nativeProbe.stateAfterDump.technicalPause = true, c => c.nativeProbe.stateAfterDump.unobservedGaps = 1,
    c => c.nativeProbe.stateAfterDump.frameAt = -1, c => c.nativeProbe.tracingStopped = false]) {
    const c = source(); mutate(c); assert.throws(() => summarizePressure(c, native(), cell));
  }
});
test('raw digest, light level and reported missing values are checked independently of the stored native summary', () => {
  const c = source(), corrupt = Buffer.from(native()); corrupt[40] ^= 1;
  assert.throws(() => summarizePressure(c, corrupt, cell));
  const changed = source(), events = JSON.parse(gunzipSync(native()));
  for (const event of events.traceEvents.filter(e => e.ph === 'v')) event.args.dumps.level_of_detail = 'detailed';
  const raw = Buffer.from(JSON.stringify(events)), gzip = gzipSync(raw);
  Object.assign(changed.nativeProbe.trace, { bytes: raw.length, compressedBytes: gzip.length,
    sha256: createHash('sha256').update(gzip).digest('hex') });
  assert.throws(() => summarizePressure(changed, gzip, cell));
  const inventedZero = source();
  inventedZero.nativeProbe.dump.processes.find(p => p.blinkHeap).categories.blink_objects = 0;
  assert.throws(() => summarizePressure(inventedZero, native(), cell));
});
test('a retained partial collection is readable as a failure without attributing its incomplete allocator sizes', () => {
  // Deliberately altered calibration models a collector failure; it is not a
  // second observed browser result and is never added to the evidence cohort.
  const c = source(); c.complete = false; delete c.outcome;
  c.failure = { code: 'active-pressure-observation-failed', message: 'Synthetic post-dump fault' };
  c.nativeProbe.complete = false; c.nativeProbe.failure = { code: 'active-light-collection-failed', message: 'Synthetic fault' };
  c.nativeProbe.trace.dataLossOccurred = true;
  const s = summarizePressure(c, native(), cell);
  assert.equal(s.runtimeComplete, false); assert.equal(s.pressureEvidenceQualified, false);
  assert.equal(s.native.allocationSizesAttributed, false); assert.equal(s.native.traceDataLoss, true);
  assert.equal(s.native.rendererFragments, undefined);
});

// These mutations exercise failure classification, not measured browser RAM.
// Only the unmodified archived captures belong to the actual evidence cohort.
function modelPressure() {
  const c = source();
  c.plan = pressurePlan({ CRYPTOID_ACTIVE_PRESSURE_MODE: 'pressure', CRYPTOID_SOAK_CONDITION: 'original', CRYPTOID_LIFETIME_ATTRIBUTION: '1' });
  c.calibrationOnly = false; c.outcome = 'active-pressure-collected'; c.pressureEvidenceQualified = true;
  c.trigger.mode = 'pressure'; c.trigger.thresholdKiB = c.plan.thresholdKiB;
  const setRenderer = (memory, kib) => {
    const row = memory.processes.find(p => p.role === 'chromium-renderer');
    memory.summedPssKiB += kib - row.pssKiB; row.pssKiB = kib;
  };
  for (const m of [c.trigger.memory, c.nativeProbe.beforeDumpMemory, c.nativeProbe.afterDumpMemory, c.nativeProbe.afterTraceMemory])
    setRenderer(m, 900 * 1024);
  c.points.at(-1).memory = structuredClone(c.trigger.memory); c.nativeProbe.trigger = structuredClone(c.trigger);
  c.nativeProbe.rendererPssKiB = { trigger: rendererPss(c.trigger.memory), beforeDump: rendererPss(c.nativeProbe.beforeDumpMemory),
    afterDump: rendererPss(c.nativeProbe.afterDumpMemory), afterTrace: rendererPss(c.nativeProbe.afterTraceMemory) };
  c.nativeProbe.pressureMaintainedAcrossProbe = true; return { c, setRenderer };
}
test('a synthetic threshold crossing followed by a real-sized post-dump drop is an unmet diagnostic target, and cannot keep a pressure pass', () => {
  const { c, setRenderer } = modelPressure(), pressureCell = { mode: 'pressure', replica: 1 };
  assert.equal(summarizePressure(c, native(), pressureCell).pressureEvidenceQualified, true);
  setRenderer(c.nativeProbe.afterDumpMemory, 400 * 1024); c.nativeProbe.rendererPssKiB.afterDump = 400 * 1024;
  assert.throws(() => summarizePressure(c, native(), pressureCell));
  c.complete = false; c.outcome = 'pressure-changed-during-probe'; c.pressureEvidenceQualified = false;
  c.nativeProbe.pressureMaintainedAcrossProbe = false;
  c.failure = { code: c.outcome, message: 'Synthetic pressure drop' };
  const s = summarizePressure(c, native(), pressureCell);
  assert.equal(s.classification, 'diagnostic-objective-unmet'); assert.equal(s.runtimeComplete, false);
  assert.equal(s.pressureEvidenceQualified, false); assert.ok(s.native.rendererFragments.length);
});
test('an absent pressure trigger requires the full fixed budget and cannot be relabeled as a game crash or successful low-memory fix', () => {
  const c = source();
  c.plan = pressurePlan({ CRYPTOID_ACTIVE_PRESSURE_MODE: 'pressure', CRYPTOID_SOAK_CONDITION: 'original', CRYPTOID_LIFETIME_ATTRIBUTION: '1' });
  c.calibrationOnly = false; c.complete = false; c.outcome = 'pressure-threshold-not-observed';
  c.failure = { code: c.outcome, message: 'Synthetic unmet threshold' }; delete c.nativeProbe; delete c.trigger;
  const pressureCell = { mode: 'pressure', replica: 1 };
  assert.throws(() => summarizePressure(c, null, pressureCell), 'A one-minute nontrigger cannot count as the twenty-minute target');
  c.observedActiveMs = 1200000; c.points.at(-1).activeMs = 1200000;
  const s = summarizePressure(c, null, pressureCell);
  assert.equal(s.classification, 'diagnostic-objective-unmet'); assert.equal(s.native, null);
  assert.equal(s.pressureEvidenceQualified, false); assert.equal(s.nativeTerminationCauseMeasured, false);
  assert.equal(s.whiteScreenFixed, false);
});

test('the two actual pressure captures preserve one qualified native heap and one narrowly unmet fixed boundary', () => {
  const rows = [1, 2].map(replica => {
    const c = JSON.parse(gunzipSync(read(`pressure-r${replica}.json.gz`)));
    return summarizePressure(c, read(`pressure-r${replica}-native.json.gz`), { mode: 'pressure', replica });
  });
  assert.equal(rows[0].classification, 'active-pressure-captured'); assert.equal(rows[0].pressureEvidenceQualified, true);
  assert.ok(Object.values(rows[0].native.pssKiB).every(kib => kib >= 768 * 1024));
  assert.equal(rows[0].native.rendererFragments.find(p => p.blinkHeap).blinkHeap.bytes, 479134096);
  assert.equal(rows[1].classification, 'diagnostic-objective-unmet'); assert.equal(rows[1].runtimeComplete, false);
  assert.ok(rows[1].native.pssKiB.trigger >= 768 * 1024); assert.ok(rows[1].native.pssKiB.afterDump >= 768 * 1024);
  assert.ok(rows[1].native.pssKiB.beforeDump < 768 * 1024); assert.ok(rows[1].native.pssKiB.afterTrace < 768 * 1024);
  assert.equal(rows[1].native.rendererFragments.find(p => p.blinkHeap).blinkHeap.bytes, 462684640);
  const changed = JSON.parse(gunzipSync(read('pressure-r2.json.gz')));
  changed.complete = true; changed.pressureEvidenceQualified = true; changed.nativeProbe.pressureMaintainedAcrossProbe = true;
  assert.throws(() => summarizePressure(changed, read('pressure-r2-native.json.gz'), { mode: 'pressure', replica: 2 }));
});
test('zero application ownership counters after both real exits cannot be substituted for equal native process cleanup', () => {
  const rows = [1, 2].map(replica => {
    const c = JSON.parse(gunzipSync(read(`pressure-r${replica}.json.gz`)));
    assert.equal(c.requestedGc, false); assert.equal(c.normalExitVerified, true);
    const s = summarizePressure(c, read(`pressure-r${replica}-native.json.gz`), { mode: 'pressure', replica });
    assert.equal(s.homeStats.css.active, 0); assert.equal(s.homeStats.painted.retained, 0);
    assert.equal(s.homeStats.canvas.cacheBytes, 0); assert.equal(s.homeStats.canvas.registeredEffects, 0); return s;
  });
  assert.equal(rows[0].lifecyclePssKiB.at(-1).renderer, 209548);
  assert.equal(rows[1].lifecyclePssKiB.at(-1).renderer, 766692);
  assert.equal(rows[0].nativeTerminationCauseMeasured, false); assert.equal(rows[1].whiteScreenFixed, false);
});
