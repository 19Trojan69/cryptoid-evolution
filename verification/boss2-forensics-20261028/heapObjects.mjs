// Aggregate synthetic-lab snapshots without exporting strings, URLs or values.
import assert from 'node:assert/strict';
export function heapClassName(raw, type) {
  if (typeof raw !== 'string') return 'unclassified';
  if (/^[A-Za-z_$][A-Za-z0-9_$]{0,79}$/.test(raw)) return raw;
  if (type === 'native' && raw.length <= 160 && /^(?:[A-Za-z_][A-Za-z0-9_]*::){1,4}[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) return raw;
  const tag = type === 'native' && raw.match(/^<([a-z]+)(?:\s|>)/)?.[1];
  return ['div','span','img','canvas','svg','path','i','button','p','section','input','label'].includes(tag) ? 'HTMLTag_' + tag : 'unclassified';
}
export function summarizeHeap(snapshot) {
  const fields = snapshot?.snapshot?.meta?.node_fields;
  assert.ok(Array.isArray(fields) && fields.length > 0, 'Heap node metadata required');
  const at = name => { const index = fields.indexOf(name); assert.ok(index >= 0, 'Missing node field ' + name); return index; };
  const typeAt = at('type'), nameAt = at('name'), sizeAt = at('self_size');
  const detachedAt = fields.indexOf('detachedness');
  const types = snapshot.snapshot.meta.node_types[typeAt];
  assert.ok(Array.isArray(types) && Array.isArray(snapshot.nodes) && snapshot.nodes.length % fields.length === 0);
  const byType = {}, byClass = new Map(); let selfBytes = 0;
  for (let offset = 0; offset < snapshot.nodes.length; offset += fields.length) {
    const type = types[snapshot.nodes[offset + typeAt]];
    assert.ok(typeof type === 'string' && /^[a-z_ ]{1,40}$/.test(type));
    const bytes = snapshot.nodes[offset + sizeAt];
    assert.ok(Number.isSafeInteger(bytes) && bytes >= 0);
    selfBytes += bytes;
    const group = byType[type] ??= { count: 0, selfBytes: 0 };
    group.count++; group.selfBytes += bytes;
    if (type !== 'native' && type !== 'object') continue;
    const raw = snapshot.strings[snapshot.nodes[offset + nameAt]];
    // Constructor identifiers only. Never export string nodes, DOM markup,
    // attributes, element text, script bodies, private values or graph edges.
    const name = heapClassName(raw, type);
    const key = type + ':' + name;
    const entry = byClass.get(key) ?? { type, name, count: 0, selfBytes: 0, detachednessFlags: {} };
    entry.count++; entry.selfBytes += bytes;
    if (type === 'native' && detachedAt >= 0) {
      const flag = snapshot.nodes[offset + detachedAt];
      if ([0, 1, 2].includes(flag)) entry.detachednessFlags[flag] = (entry.detachednessFlags[flag] || 0) + 1;
    }
    byClass.set(key, entry);
  }
  const allClasses=[...byClass.values()].sort((a,b)=>b.selfBytes-a.selfBytes);
  const summary={ nodes: snapshot.nodes.length / fields.length, selfBytes, byType,
    classes: allClasses.slice(0,150), totalClasses:allClasses.length, classExportLimit:150,
    scope: 'Snapshot node self sizes and constructor counts only; not dominator retained size, total browser RAM or GPU memory. Detachedness flags are retained as raw numeric flags.' };
  Object.defineProperty(summary,'comparisonClasses',{value:allClasses,enumerable:false});
  return summary;
}
export function compareHeaps(before, after) {
  const groups = new Map();
  for (const [sign, summary] of [[-1, before], [1, after]]) for (const row of summary.comparisonClasses??summary.classes) {
    const key = row.type + ':' + row.name;
    const value = groups.get(key) ?? { type: row.type, name: row.name, countDelta: 0, selfBytesDelta: 0 };
    value.countDelta += sign * row.count; value.selfBytesDelta += sign * row.selfBytes; groups.set(key, value);
  }
  return { nodesDelta: after.nodes - before.nodes, selfBytesDelta: after.selfBytes - before.selfBytes,
    classComparisonCoverage:before.comparisonClasses&&after.comparisonClasses?'all-in-memory-classes':'exported-subsets-only',
    classes: [...groups.values()].filter(row => row.countDelta || row.selfBytesDelta)
      .sort((a, b) => Math.abs(b.selfBytesDelta) - Math.abs(a.selfBytesDelta)).slice(0, 100),
    interpretation: 'Changes between two paused, explicitly garbage-collected synthetic scenes. Counts/self sizes do not identify the retaining reference or prove a leak.' };
}
