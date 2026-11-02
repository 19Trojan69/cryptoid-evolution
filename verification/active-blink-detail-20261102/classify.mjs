import assert from 'node:assert/strict';
import { summarizeMemoryTrace } from '../boss2-native-memory-20261029/nativeSummary.mjs';
import { limits } from './policy.mjs';
const prefix = 'blink_objects/blink_gc/main/';
const globalType = /^blink_objects\/blink_gc\/main\/.+ \(0x[0-9a-f]+\)$/i;
const categories = ['blink_gc', 'blink_gc/main/heap', 'blink_gc/main/allocated_objects', 'blink_objects',
  'v8', 'malloc', 'partition_alloc', 'cc', 'cc/image_memory', 'skia', 'discardable', 'canvas', 'media',
  'web_cache', 'shared_memory', 'gpu', 'gpu/shared_images'];
const focusedTypes = ['blink::HashTrieNode<blink::CSSVariableData>', 'blink::ComputedStyleBase::StyleSurroundData',
  'blink::ComputedStyle', 'blink::CachedMatchedProperties', 'blink::ComputedStyleBase::StyleMiscData',
  'blink::ComputedStyleBase::StyleSVGData'];

// Native trace scalars are hexadecimal, including object counts. Preserve an
// unsafe unsigned value exactly. A missing scalar is never an observed zero.
export function unsignedScalar(attribute, units) {
  if (!attribute) return { value: null, reason: 'not-reported' };
  assert.equal(attribute.type, 'scalar'); assert.equal(attribute.units, units);
  assert.match(attribute.value, /^(?:0x)?[0-9a-f]+$/i);
  const rawHex = '0x' + attribute.value.replace(/^0x/i, '').toLowerCase(), exact = BigInt(rawHex);
  return exact > BigInt(Number.MAX_SAFE_INTEGER)
    ? { value: null, rawHex, reason: 'outside-safe-integer-range' } : { value: Number(exact) };
}
function fragmentationScalar(attribute) {
  if (!attribute) return { value: null, reportedUnits: null, reason: 'not-reported' };
  // The legacy exporter can label the provider's percent scalar as objects.
  // Keep the actual exported unit. Do not present it as an object count or
  // silently replace its unit; report the heap-byte-derived fraction separately.
  assert.ok(['percent', 'objects'].includes(attribute.units));
  return { ...unsignedScalar(attribute, attribute.units), reportedUnits: attribute.units };
}
export function classifyDetailed(events, requests) {
  assert.equal(requests.length, 1); assert.equal(requests[0].success, true);
  const rawDumps = events.filter(e => e.ph === 'v' && e.args?.dumps);
  assert.ok(rawDumps.length); for (const e of rawDumps) assert.equal(e.args.dumps.level_of_detail, 'detailed');
  const [parsed] = summarizeMemoryTrace(events, requests, { exportedSnapshotIds: true });
  const processes = parsed.processes.map(p => {
    const raw = rawDumps[p.fragmentIndex]; assert.equal(raw.pid, p.processId);
    const allocators = raw.args.dumps.allocators || {};
    const types = p.allocators.filter(row => globalType.test(row.path)).map(row => {
      const match = row.path.match(/ \((0x[0-9a-f]+)\)$/i);
      return { ...row, typeName: row.path.slice(prefix.length).replace(/ \(0x[0-9a-f]+\)$/i, ''), typeId: match[1],
        objectCount: unsignedScalar(allocators[row.path]?.attrs?.object_count, 'objects') };
    });
    assert.ok(types.length <= limits.globalTypes);
    const heap = p.allocators.find(row => row.path === 'blink_gc/main/heap') ?? null;
    return { processId: p.processId, fragmentIndex: p.fragmentIndex, processName: p.processName,
      allocatorCount: p.allocatorCount, categories: Object.fromEntries(categories.map(path =>
        [path, p.allocators.find(row => row.path === path)?.bytes ?? null])),
      blinkHeap: heap, reportedHeapFragmentation: fragmentationScalar(allocators['blink_gc/main/heap']?.attrs?.fragmentation),
      heapUnusedFractionPercentDerived: heap?.bytes > 0 && heap.attributes.allocated_objects_size !== null
        && heap.attributes.allocated_objects_size !== undefined
        ? 100 * (heap.bytes - heap.attributes.allocated_objects_size) / heap.bytes : null,
      heapSpaces: p.allocators.filter(row => /^blink_gc\/main\/heap\/[^/]+$/.test(row.path)),
      globalObjectTypes: types,
      largestGlobalObjectTypes: types.filter(row => row.bytes !== null && row.bytes > 0).sort((a, b) => b.bytes - a.bytes).slice(0, 30),
      focusedGlobalObjectTypes: focusedTypes.map(type => ({ type, rows: types.filter(row => row.typeName === type) })),
      largestReportedSizes: p.largestReportedSizes.slice(0, 20),
      outsideSafeIntegerRange: p.allocators.filter(row => Object.keys(row.unrepresentableByteScalars).length)
        .map(row => ({ path: row.path, attributes: row.unrepresentableByteScalars })),
      sharedOwnershipEdges: p.sharedOwnershipEdges, processTotals: p.processTotals,
      globalTypeRowsAlreadyAggregateTheirPages: true, aliasesParentsAndFragmentsMustNotBeSummed: true,
      typeNamesAreNotAllocationStacksOrRetainerPaths: true };
  });
  assert.ok(processes.some(p => /renderer/i.test(p.processName) && p.blinkHeap && p.blinkHeap.bytes !== null
    && p.globalObjectTypes.some(t => /^blink::/.test(t.typeName) && t.bytes > 0 && t.objectCount.value > 0)),
  'Actual named renderer object classes and counts, not only heap totals');
  return { ...parsed, processes, classSizesAreNotPostGcRetainedBytes: true };
}
