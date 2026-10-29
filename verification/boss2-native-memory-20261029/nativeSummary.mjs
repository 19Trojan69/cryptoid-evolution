import assert from 'node:assert/strict';

export function dumpGuid(value) {
  const text = String(value ?? '').toLowerCase().replace(/^0x/, '').replace(/^0+(?=.)/, '');
  assert.match(text, /^[0-9a-f]+$/); return text;
}
export function byteScalar(attribute) {
  if (!attribute || attribute.type !== 'scalar' || attribute.units !== 'bytes') return null;
  assert.match(attribute.value, /^(?:0x)?[0-9a-f]+$/i);
  const value = Number.parseInt(attribute.value.replace(/^0x/i, ''), 16);
  assert.ok(Number.isSafeInteger(value) && value >= 0); return value;
}
// Explicit allocator sizes are kept separate. Parent/child and cross-process
// aliasing make a sum of these rows an invalid total RAM/GPU measurement.
export function summarizeMemoryTrace(events, requests) {
  const names = new Map(events.filter(e => e.ph === 'M' && e.name === 'process_name').map(e => [e.pid, e.args?.name]));
  return requests.map(request => {
    const id = dumpGuid(request.dumpGuid);
    const dumps = events.filter(e => e.ph === 'v' && e.args?.dumps && dumpGuid(e.id ?? e.id2?.global) === id);
    const processes = dumps.map(event => {
      const rows = Object.entries(event.args.dumps.allocators || {}).map(([path, data]) => ({ path,
        bytes: byteScalar(data.attrs?.size), attributes: Object.fromEntries(Object.entries(data.attrs || {})
          .filter(([, value]) => value.type === 'scalar' && value.units === 'bytes').map(([key, value]) => [key, byteScalar(value)])) }));
      const selected = rows.filter(row => row.bytes !== null).sort((a, b) => b.bytes - a.bytes);
      return { processName: names.get(event.pid) ?? 'unknown', allocatorCount: rows.length,
        largestReportedSizes: selected.slice(0, 80), allocators: rows,
        reportedSizesMustNotBeSummed: true, sharedOwnershipEdges: (event.args.dumps.allocators_graph || []).length,
        processTotals: event.args.dumps.process_totals ?? null };
    });
    return { label: request.label, success: request.success, matchedProcessDumps: processes.length,
      processes, physicalDevice: false, nativeTerminationCauseMeasured: false };
  });
}
