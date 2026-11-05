import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {HeapSnapshotManager} from './tools/extracted/package/build/src/processors/HeapSnapshotManager.js';
import {TaskRunner} from './tools/extracted/package/build/src/utils/TaskRunner.js';

// Use the published, unchanged Chrome DevTools heap implementation. This file
// only chooses existing snapshots and serializes results; it implements no GC,
// edge-strength, dominator or retained-size algorithm.
const root = new URL('.', import.meta.url).pathname;
const manager = new HeapSnapshotManager(new TaskRunner());
const ids = ['13097191129', '13098035874', '13295227013'];
const cases = [
  ['canvas', '^(?:Detached )?(?:CanvasRenderingContext2D$|<canvas[ >])', 'native'],
  ['images', '^(?:Detached )?<img[ >]', 'native'],
  ['audio', '^(?:Detached )?(?:(?:AudioBuffer|AudioContext|AudioDestinationNode|AudioBufferSourceNode)$|<audio[ >])', 'native'],
  ['animation', '^(?:Detached )?(?:CSSAnimation|KeyframeEffect|DocumentTimeline|ScrollTimeline|ViewTimeline)$', 'native'],
  ['performance', '^(?:Performance|LayoutShift|LayoutShiftAttribution|DOMRectReadOnly)$', 'native'],
  ['collections', '^(?:Map|Set|Array)$', 'object'],
  ['style', '^(?:Detached )?blink::(?:ComputedStyle(?:$|Base::)|CachedMatchedProperties$|CSSVariableData$|HashTrieNode<)', 'native'],
  ['style_cache_backing', '^blink::HeapHashTableBacking.*CachedMatchedProperties', 'native'],
];
const output = [];
await fs.mkdir(root + 'results', {recursive: true});
for (const artifactId of ids) {
  const capture = JSON.parse(await fs.readFile(root + `inputs/${artifactId}/attribution.json`, 'utf8'));
  for (const phase of ['paused', 'home']) {
    const file = root + `inputs/${artifactId}/${phase}.heapsnapshot`;
    const digest = crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
    const snapshot = await manager.getSnapshot(file);
    try {
      const aggregates = await manager.getAggregates(file);
      const stats = await manager.getStats(file);
      const staticData = await manager.getStaticData(file);
      const topProvider = snapshot.proxy.queryObjects({sortBy: 'retainedSize'});
      const top = await topProvider.serializeItemsRange(0, 100);
      const detachedProvider = snapshot.proxy.queryObjects({isDetached: true, sortBy: 'retainedSize'});
      const detached = await detachedProvider.serializeItemsRange(0, Infinity);
      const groups = [];
      const selected = new Map();
      for (const [label, pattern, nodeType] of cases) {
        const provider = snapshot.proxy.queryObjects({className: pattern, nodeType, sortBy: 'retainedSize'});
        const nodes = await provider.serializeItemsRange(0, Infinity);
        groups.push({label, pattern, nodeType, ...nodes});
        // A bounded selection for path display, not a pass/fail threshold.
        for (const node of nodes.items.slice(0, ['canvas', 'images'].includes(label) ? 14 : 6)) selected.set(node.id, node);
      }
      for (const node of top.items.filter(x => x.type !== 'synthetic').slice(0, 14)) selected.set(node.id, node);
      for (const node of detached.items.slice(0, 12)) selected.set(node.id, node);
      const paths = [];
      for (const node of selected.values()) {
        paths.push({
          node,
          dominators: await manager.getDominatorsOf(file, node.id),
          retainers: await manager.getRetainers(file, node.id),
          retainingPaths: await manager.getRetainingPaths(file, node.id, 14, 120, 8),
        });
      }
      const result = {
        artifactId, phase, sha256: digest,
        sourceCommit: capture.sourceCommit, sourceTree: capture.sourceTree,
        condition: capture.condition, requestedSeconds: capture.requestedSeconds,
        observedActiveMs: capture.observedActiveMs, engineVersion: capture.engineVersion,
        afterExplicitInactiveGc: capture.snapshots.find(s => s.label === phase).afterExplicitInactiveGc,
        stats, staticData, aggregates, top, detached, groups, paths,
      };
      const outFile = root + `results/${artifactId}-${phase}.json`;
      await fs.writeFile(outFile, JSON.stringify(result, null, 2) + '\n');
      const summary = {
        artifactId, phase, totalSnapshotBytes: staticData.totalSize,
        detachedCount: detached.totalLength,
        top: top.items.filter(x => x.type !== 'synthetic').slice(0, 5).map(n => ({id:n.id, name:n.name.slice(0,110), retainedSize:n.retainedSize})),
        groups: groups.map(g => ({label: g.label, count: g.totalLength, first: g.items.slice(0, 4).map(n=>({id:n.id, name:n.name, selfSize:n.selfSize, retainedSize:n.retainedSize}))})),
      };
      output.push(summary);
      console.log(JSON.stringify(summary));
    } finally {
      await manager.disposeSnapshot(file);
    }
  }
}
await fs.writeFile(root + 'results/summary.json', JSON.stringify(output, null, 2) + '\n');
