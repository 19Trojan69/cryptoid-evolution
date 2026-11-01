import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { summarizeAttribution, processPss } from '../../memory-retention-attribution-20261101/evidence/attributionSummary.mjs';
import { summarizeMemoryTrace, memoryTraceEvents } from '../../boss2-native-memory-20261029/nativeSummary.mjs';
import { boundaries } from '../collector.mjs';

export const measured = { source: 'ff01956a1726c43813180431d65a630c7ceda673', tree: '2803d77cdbd059c25a443c775b7bb9996aa41e4b' };
const categories = ['blink_gc', 'blink_objects', 'v8', 'malloc', 'partition_alloc', 'cc', 'cc/image_memory',
  'skia', 'discardable', 'canvas', 'media', 'web_cache', 'shared_memory', 'gpu', 'gpu/shared_images'];
const focusedTypes = ['blink::HashTrieNode<blink::CSSVariableData>', 'blink::ComputedStyleBase::StyleSurroundData',
  'blink::ComputedStyle', 'blink::CachedMatchedProperties', 'blink::ComputedStyleBase::StyleMiscData',
  'blink::ComputedStyleBase::StyleSVGData'];
const sha256 = data => createHash('sha256').update(data).digest('hex');

// Reparse the saved trace independently of the capture's compact allocator rows.
// Every process fragment remains separate. Parent/child/alias rows are not sums.
export function summarizeNative(capture, compressed, expected = measured) {
  const base = summarizeAttribution(capture, expected);
  assert.equal(capture.inactiveNativeAllocationRequested, true);
  assert.equal(capture.activeNativeTracing, false);
  assert.equal(capture.isolatedMiniPacing, undefined);
  assert.equal(capture.isolatedMiniNativeProof, undefined);
  const native = capture.inactiveNativeAllocation;
  assert.equal(native.attachedOnlyAfterActiveInterval, true);
  assert.equal(native.deterministic, false);
  assert.deepEqual(native.automaticDumpTriggers, []);
  assert.equal(native.physicalDevice, false);
  assert.equal(native.nativeTerminationCauseMeasured, false);
  assert.deepEqual(native.requests.map(row => [row.label, row.phase]), boundaries);
  assert.ok(native.requests.every(row => row.success === true));
  assert.equal(native.trace.file, 'native-memory-infra.json.gz');
  assert.equal(native.trace.dataLossOccurred, false);
  assert.equal(native.trace.collectorFault, null);
  assert.equal(compressed.length, native.trace.compressedBytes);
  assert.equal(sha256(compressed), native.trace.sha256);
  const raw = gunzipSync(compressed, { maxOutputLength: 128 * 1024 * 1024 });
  assert.equal(raw.length, native.trace.bytes);
  const trace = JSON.parse(raw);
  assert.equal(trace.traceEvents.length, native.trace.events);
  assert.deepEqual(memoryTraceEvents(trace.traceEvents), trace.traceEvents);
  const parsed = summarizeMemoryTrace(trace.traceEvents, native.requests, { exportedSnapshotIds: true });
  assert.equal(native.checkpoints.length, boundaries.length);
  const checkpoints = parsed.map((dump, index) => {
    const compact = native.checkpoints[index];
    const { processes, ...header } = dump;
    const { processes: savedProcesses, ...savedHeader } = compact;
    assert.deepEqual(savedHeader, header);
    assert.equal(savedProcesses.length, processes.length);
    for (const [fragment, process] of processes.entries()) {
      const saved = savedProcesses[fragment];
      for (const key of ['processId', 'fragmentIndex', 'processName', 'allocatorCount',
        'sharedOwnershipEdges', 'processTotals', 'reportedSizesMustNotBeSummed']) assert.deepEqual(saved[key], process[key]);
      assert.deepEqual(saved.categories, Object.fromEntries(categories.map(name =>
        [name, process.allocators.find(row => row.path === name)?.bytes ?? null])));
      assert.deepEqual(saved.largestReportedSizes, process.largestReportedSizes.slice(0, 20));
      assert.deepEqual(saved.outsideSafeIntegerRange, process.allocators.filter(row => Object.keys(row.unrepresentableByteScalars).length)
        .map(row => ({ path: row.path, attributes: row.unrepresentableByteScalars })));
    }
    const row = capture.checkpoints.find(row => row.label === dump.label);
    assert.ok(row); assert.equal(row.phase, boundaries[index][1]);
    assert.deepEqual(row.nativeDump, { deterministic: false, dumpGuid: native.requests[index].dumpGuid, success: true });
    assert.ok(processes.some(process => /renderer/i.test(process.processName)
      && process.allocators.some(row => row.path === 'blink_gc' && row.bytes !== null)));
    return { label: dump.label, pssBeforeDump: processPss(row.memory), pssAfterDump: processPss(row.afterNativeDumpMemory),
      uniqueProcesses: dump.matchedProcessDumps, fragments: dump.matchedDumpEvents,
      rendererFragments: savedProcesses.filter(row => /renderer/i.test(row.processName) && row.allocatorCount),
      gpuProcessFragments: savedProcesses.filter(row => /gpu/i.test(row.processName) && row.allocatorCount),
      // Distinguish the allocated object payload from Blink's heap-page size.
      // These rows overlap the categories above and must never be added to them.
      blinkObjectAndHeapDetails: processes.filter(process => /renderer/i.test(process.processName) && process.allocatorCount)
        .map(process => ({ processId: process.processId, fragmentIndex: process.fragmentIndex,
          rows: process.allocators.filter(row => ['blink_gc/main/allocated_objects', 'blink_gc/main/heap',
            'blink_gc/main/heap/NormalPageSpace3', 'blink_gc/main/heap/CustomSpace0'].includes(row.path)),
          // The provider already aggregates each type over its pages here.
          // Keep its unique type ID; do not add duplicate per-page records.
          largestGlobalObjectTypes: process.allocators.filter(row =>
            /^blink_objects\/blink_gc\/main\/.+ \(0x[0-9a-f]+\)$/i.test(row.path) && row.bytes !== null)
            .sort((a, b) => b.bytes - a.bytes).slice(0, 20),
          focusedGlobalObjectTypes: focusedTypes.map(type => ({ type,
            rows: process.allocators.filter(row => row.path.replace(/^blink_objects\/blink_gc\/main\//, '')
              .replace(/ \(0x[0-9a-f]+\)$/i, '') === type) })) })) };
  });
  assert.deepEqual(capture.checkpoints.filter(row => row.nativeDump).map(row => row.label), boundaries.map(row => row[0]));
  const attachment = capture.inactiveNativeTraceAttachment;
  assert.match(capture.lockSha256, /^[a-f0-9]{64}$/);
  return { ...base, lockSha256: capture.lockSha256, trace: native.trace,
    traceAttachmentPss: { before: processPss(attachment.before), after: processPss(attachment.after) },
    nativeCheckpoints: checkpoints,
    limits: 'Inactive Linux allocator dumps only. Categories and fragments overlap; do not sum. Attachment, dumps and explicit GC influence memory. No physical phone or native termination proof.' };
}

export function summarizePair(items) {
  assert.deepEqual(items.map(row => row.requestedSeconds).sort((a, b) => a - b), [60, 1200]);
  for (const key of ['engineVersion', 'actualInstalledPackages', 'lockSha256']) {
    assert.ok(items[0][key] && items[1][key], key);
    assert.deepEqual(items[0][key], items[1][key]);
  }
  assert.match(items[0].engineVersion, /^\d+\.\d+\.\d+\.\d+$/);
  assert.match(items[0].lockSha256, /^[a-f0-9]{64}$/);
  for (const name of ['react', 'react-dom', 'react-router-dom', 'vite', 'typescript'])
    assert.match(items[0].actualInstalledPackages[name], /^\d+\.\d+\.\d+/);
  const captures = [...items].sort((a, b) => a.requestedSeconds - b.requestedSeconds);
  const renderer = (capture, label) => {
    const rows = capture.nativeCheckpoints.find(row => row.label === label).rendererFragments;
    assert.equal(rows.length, 1, 'A category comparison needs one identified renderer allocator fragment');
    return rows[0].categories;
  };
  const categoryComparison = boundaries.map(([label]) => {
    const short = renderer(captures[0], label), long = renderer(captures[1], label);
    return { label, overlappingRowsMustNotBeSummed: true, categories: categories.map(path =>
      ({ path, shortBytes: short[path], longBytes: long[path],
        differenceBytes: short[path] !== null && long[path] !== null ? long[path] - short[path] : null })) };
  });
  return { captures, rendererCategoryComparison: categoryComparison,
    repeatedOrSeededComparison: false, physicalPhoneAcceptanceEstablished: false,
    nativeTerminationCauseMeasured: false, whiteScreenFixed: false };
}
