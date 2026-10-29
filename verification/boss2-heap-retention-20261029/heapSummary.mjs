import assert from 'node:assert/strict';

// Snapshot self sizes describe nodes in this graph. They are not dominator /
// retained sizes and are not total browser, GPU or physical-device memory.
export function summarizeHeap(snapshot) {
  const { node_fields: fields, node_types: types } = snapshot.snapshot.meta;
  const field = name => { const index = fields.indexOf(name); assert.ok(index >= 0, name); return index; };
  const typeAt = field('type'), nameAt = field('name'), sizeAt = field('self_size');
  const detachedAt = fields.indexOf('detachedness'), width = fields.length;
  const nodeTypes = types[typeAt];
  assert.equal(snapshot.nodes.length % width, 0, 'complete node rows');
  const groups = new Map(), byType = new Map();
  let selfBytes = 0, detachedNodes = 0, detachedSelfBytes = 0;
  for (let at = 0; at < snapshot.nodes.length; at += width) {
    const type = nodeTypes[snapshot.nodes[at + typeAt]], size = snapshot.nodes[at + sizeAt];
    assert.equal(typeof type, 'string'); assert.ok(Number.isFinite(size) && size >= 0);
    let name = snapshot.strings[snapshot.nodes[at + nameAt]];
    assert.equal(typeof name, 'string');
    // String contents may contain the complete compiled application. Aggregate
    // them by type instead of copying content into the analysis summary.
    if (type.includes('string')) name = '(string contents omitted)';
    else if (name.length > 160) name = name.slice(0, 160) + '…';
    const key = type + '\u0000' + name;
    const group = groups.get(key) || { type, name, count: 0, selfBytes: 0, detachedNodes: 0 };
    group.count++; group.selfBytes += size;
    if (detachedAt >= 0 && snapshot.nodes[at + detachedAt] === 2) {
      detachedNodes++; detachedSelfBytes += size; group.detachedNodes++;
    }
    groups.set(key, group);
    const total = byType.get(type) || { type, count: 0, selfBytes: 0 };
    total.count++; total.selfBytes += size; byType.set(type, total); selfBytes += size;
  }
  const count = snapshot.nodes.length / width;
  assert.equal(count, snapshot.snapshot.node_count);
  return { nodeCount: count, edgeCount: snapshot.snapshot.edge_count, selfBytes,
    detachednessAvailable: detachedAt >= 0, detachedNodes, detachedSelfBytes,
    sizesAreSelfNotRetained: true, totalProcessMemoryMeasured: false,
    byType: [...byType.values()].sort((a, b) => b.selfBytes - a.selfBytes),
    groups: [...groups.values()].sort((a, b) => b.selfBytes - a.selfBytes || b.count - a.count) };
}
