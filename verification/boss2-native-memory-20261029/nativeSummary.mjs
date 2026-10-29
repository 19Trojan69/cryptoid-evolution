import assert from 'node:assert/strict';

export function dumpGuid(value) {
  const text = String(value ?? '').toLowerCase().replace(/^0x/, '').replace(/^0+(?=.)/, '');
  assert.match(text, /^[0-9a-f]+$/); return text;
}
function byteScalarDetails(attribute) {
  if (!attribute || attribute.type !== 'scalar' || attribute.units !== 'bytes') return null;
  assert.match(attribute.value, /^(?:0x)?[0-9a-f]+$/i);
  const rawHex = '0x' + attribute.value.replace(/^0x/i, '').toLowerCase();
  const exact = BigInt(rawHex);
  // Some backend counters exceed JavaScript's exact integer range. Preserve
  // their exact unsigned representation without interpreting a sentinel,
  // signed wraparound or virtual reservation as measured resident memory.
  return exact > BigInt(Number.MAX_SAFE_INTEGER)
    ? { bytes: null, rawHex, reason: 'outside-safe-integer-range' }
    : { bytes: Number(exact) };
}
export const byteScalar = attribute => byteScalarDetails(attribute)?.bytes ?? null;
export const memoryTraceEvents = events => events.filter(event =>
  event.ph === 'M' && event.name === 'process_name' || event.ph === 'v' && event.args?.dumps);
// Explicit allocator sizes are kept separate. Parent/child and cross-process
// aliasing make a sum of these rows an invalid total RAM/GPU measurement.
export function summarizeMemoryTrace(events, requests, { exportedSnapshotIds = false } = {}) {
  const names = new Map(events.filter(e => e.ph === 'M' && e.name === 'process_name').map(e => [e.pid, e.args?.name]));
  const memory = events.filter(e => e.ph === 'v' && e.args?.dumps);
  let ordered;
  if (exportedSnapshotIds) {
    // Perfetto's legacy JSON exporter uses its snapshot table row ID, not
    // Tracing.requestMemoryDump's GUID. This option is valid only for a trace
    // containing exactly these successful, sequential explicit requests with
    // automatic dump triggers disabled. Never assume a constant ID offset.
    const groups = new Map();
    for (const event of memory) {
      const id = dumpGuid(event.id ?? event.id2?.global);
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(event);
    }
    assert.equal(groups.size, requests.length, 'one exported snapshot per explicit request');
    assert.ok(requests.every(r => r.success === true), 'all explicit requests succeeded');
    assert.equal(new Set(requests.map(r => dumpGuid(r.dumpGuid))).size, requests.length);
    ordered = [...groups].map(([id, dumps]) => {
      const timestamps = new Set(dumps.map(e => e.ts));
      assert.equal(timestamps.size, 1, 'all fragments of a snapshot share a timestamp');
      const timestampUs = dumps[0].ts; assert.ok(Number.isSafeInteger(timestampUs));
      return { id, dumps, timestampUs };
    }).sort((a, b) => a.timestampUs - b.timestampUs);
    for (let i = 1; i < ordered.length; i++) assert.ok(ordered[i].timestampUs > ordered[i - 1].timestampUs);
  }
  return requests.map((request, index) => {
    const id = ordered ? ordered[index].id : dumpGuid(request.dumpGuid);
    const dumps = ordered ? ordered[index].dumps : memory.filter(e => dumpGuid(e.id ?? e.id2?.global) === id);
    const processes = dumps.map((event, fragmentIndex) => {
      const rows = Object.entries(event.args.dumps.allocators || {}).map(([path, data]) => {
        const attributes = Object.entries(data.attrs || {}).map(([key, value]) => [key, byteScalarDetails(value)])
          .filter(([, value]) => value !== null);
        return { path, bytes: byteScalar(data.attrs?.size),
          attributes: Object.fromEntries(attributes.map(([key, value]) => [key, value.bytes])),
          unrepresentableByteScalars: Object.fromEntries(attributes.filter(([, value]) => value.reason)
            .map(([key, value]) => [key, { rawHex: value.rawHex, reason: value.reason }])) };
      });
      const selected = rows.filter(row => row.bytes !== null).sort((a, b) => b.bytes - a.bytes);
      return { processId: event.pid, fragmentIndex, processName: names.get(event.pid) ?? 'unknown', allocatorCount: rows.length,
        largestReportedSizes: selected.slice(0, 80), allocators: rows,
        reportedSizesMustNotBeSummed: true, sharedOwnershipEdges: (event.args.dumps.allocators_graph || []).length,
        processTotals: event.args.dumps.process_totals ?? null };
    });
    return { label: request.label, success: request.success, requestDumpGuid: request.dumpGuid, traceDumpId: id,
      association: ordered ? 'chronological-explicit-requests-exported-snapshot-ids' : 'request-guid',
      timestampUs: ordered?.[index].timestampUs ?? null,
      matchedProcessDumps: new Set(dumps.map(e => e.pid)).size, matchedDumpEvents: dumps.length,
      processes, physicalDevice: false, nativeTerminationCauseMeasured: false };
  });
}
