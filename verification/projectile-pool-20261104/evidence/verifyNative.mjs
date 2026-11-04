import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { summarizeMemoryTrace } from '../../boss2-native-memory-20261029/nativeSummary.mjs';

const root = resolve(process.argv[2] || new URL('.', import.meta.url).pathname);
const manifest = JSON.parse(readFileSync(root + '/manifest.json', 'utf8'));
const hash = b => createHash('sha256').update(b).digest('hex');
function bytes(row, name) {
  const f = row.files.find(x => x.name === name); assert.ok(f, name);
  const packed = readFileSync(resolve(root, f.file)); assert.equal(hash(packed), f.archiveSha256);
  const raw = f.encoding === 'gzip' ? gunzipSync(packed) : packed;
  assert.equal(raw.length, f.bytes); assert.equal(hash(raw), f.sha256); return raw;
}
const result = [];
for (const row of manifest.memory) {
  if (!row.files.some(x => x.name === 'attribution.json')) continue;
  const capture = JSON.parse(bytes(row, 'attribution.json'));
  if (!capture.complete) continue;
  const allocation = capture.inactiveNativeAllocation; assert.ok(allocation);
  const packed = bytes(row, 'native-memory-infra.json.gz');
  assert.equal(hash(packed), allocation.trace.sha256); assert.equal(packed.length, allocation.trace.compressedBytes);
  const raw = gunzipSync(packed); assert.equal(raw.length, allocation.trace.bytes);
  const events = JSON.parse(raw).traceEvents; assert.equal(events.length, allocation.trace.events);
  assert.equal(allocation.trace.dataLossOccurred, false); assert.equal(allocation.trace.collectorFault, null);
  const parsed = summarizeMemoryTrace(events, allocation.requests, { exportedSnapshotIds: true });
  assert.equal(parsed.length, 4); assert.equal(allocation.checkpoints.length, 4);
  for (const [i, dump] of parsed.entries()) {
    const saved = allocation.checkpoints[i];
    for (const key of ['label', 'requestDumpGuid', 'traceDumpId', 'association']) assert.deepEqual(dump[key], saved[key]);
    assert.equal(dump.processes.length, saved.processes.length);
    for (const p of dump.processes) {
      const s = saved.processes.find(x => x.processId === p.processId && x.fragmentIndex === p.fragmentIndex);
      assert.ok(s); assert.equal(p.processName, s.processName); assert.equal(p.allocatorCount, s.allocatorCount);
      for (const [path, value] of Object.entries(s.categories)) assert.equal(p.allocators.find(x => x.path === path)?.bytes ?? null, value);
      assert.deepEqual(p.largestReportedSizes.slice(0, 20), s.largestReportedSizes);
      assert.deepEqual(p.allocators.filter(x => Object.keys(x.unrepresentableByteScalars).length)
        .map(x => ({ path: x.path, attributes: x.unrepresentableByteScalars })), s.outsideSafeIntegerRange);
    }
  }
  result.push({ condition: row.condition, replica: row.replica, nativeDumpsReparsed: 4, rawTraceDigestVerified: true });
}
console.log(JSON.stringify({ version: 1, checks: result, physicalDevice: false, whiteScreenFixed: false }, null, 2));
