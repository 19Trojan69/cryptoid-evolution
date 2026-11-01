import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { summarizeNative, summarizePair } from './summary.mjs';
const trace = readFileSync(new URL('./short-native-memory.json.gz', import.meta.url));
const capture = () => JSON.parse(gunzipSync(readFileSync(new URL('./short-capture.json.gz', import.meta.url))));

test('the actual short trace reproduces four inactive dumps, missing categories stay null, no phone claim', () => {
  const result = summarizeNative(capture(), trace);
  assert.equal(result.completedTwentyMinuteLinuxObservation, false);
  assert.equal(result.nativeCheckpoints.length, 4);
  assert.ok(result.nativeCheckpoints.at(-1).rendererFragments.some(row => row.categories.canvas === null));
  assert.equal(result.physicalPhoneAcceptanceEstablished, false);
  assert.equal(result.whiteScreenFixed, false);
});
test('active traces, forced-GC dump options, missing dumps and loss cannot pass', () => {
  for (const change of [row => row.activeNativeTracing = true,
    row => row.inactiveNativeAllocation.deterministic = true,
    row => row.inactiveNativeAllocation.automaticDumpTriggers = [{ type: 'periodic_interval' }],
    row => row.inactiveNativeAllocation.requests.pop(),
    row => row.inactiveNativeAllocation.trace.dataLossOccurred = true,
    row => row.inactiveNativeAllocation.trace.collectorFault = 'budget',
    row => row.checkpoints.find(row => row.nativeDump).nativeDump.deterministic = true]) {
    const row = capture(); change(row); assert.throws(() => summarizeNative(row, trace));
  }
});
test('wrong source, an unobserved long interval and mismatched raw trace cannot be relabeled as evidence', () => {
  for (const change of [row => row.sourceCommit = '0'.repeat(40), row => row.sourceTree = '0'.repeat(40),
    row => row.requestedSeconds = 1200, row => row.inactiveNativeAllocation.trace.sha256 = '0'.repeat(64)]) {
    const row = capture(); change(row); assert.throws(() => summarizeNative(row, trace));
  }
  const corrupted = Buffer.from(trace); corrupted[30] ^= 1;
  assert.throws(() => summarizeNative(capture(), corrupted));
});
test('allocator tampering, zero for a missing value and altered unsigned values fail raw reparse', () => {
  for (const change of [row => row.inactiveNativeAllocation.checkpoints[0].processes.find(p => /renderer/i.test(p.processName) && p.allocatorCount).categories.blink_gc++,
    row => row.inactiveNativeAllocation.checkpoints.at(-1).processes.find(p => /renderer/i.test(p.processName) && p.allocatorCount).categories.canvas = 0,
    row => row.inactiveNativeAllocation.checkpoints[0].processes.find(p => p.outsideSafeIntegerRange.length).outsideSafeIntegerRange[0].attributes = {}]) {
    const row = capture(); change(row); assert.throws(() => summarizeNative(row, trace));
  }
});
test('a short-only duplicate cannot be promoted to a complete pair', () => {
  const result = summarizeNative(capture(), trace);
  assert.throws(() => summarizePair([result]));
  assert.throws(() => summarizePair([result, result]));
});
test('both actual captures reproduce the unseeded comparison and require present matching engine/package/lock evidence', () => {
  const short = summarizeNative(capture(), trace);
  const long = summarizeNative(JSON.parse(gunzipSync(readFileSync(new URL('./long-capture.json.gz', import.meta.url)))),
    readFileSync(new URL('./long-native-memory.json.gz', import.meta.url)));
  const result = summarizePair([long, short]);
  assert.equal(result.captures[1].completedTwentyMinuteLinuxObservation, true);
  assert.equal(result.captures[1].volleysAdvanced, 428);
  assert.equal(result.rendererCategoryComparison[0].categories.find(row => row.path === 'blink_gc').longBytes, 417923392);
  assert.equal(result.repeatedOrSeededComparison, false); assert.equal(result.whiteScreenFixed, false);
  for (const key of ['engineVersion', 'actualInstalledPackages', 'lockSha256']) {
    const absent = [structuredClone(short), structuredClone(long)]; for (const item of absent) delete item[key];
    assert.throws(() => summarizePair(absent));
  }
  const mixed = structuredClone(long); mixed.actualInstalledPackages.react = '0.0.0';
  assert.throws(() => summarizePair([short, mixed]));
});
