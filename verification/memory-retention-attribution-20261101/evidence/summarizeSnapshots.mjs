import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { summarizeHeap, compareHeaps, heapClassName } from '../../boss2-forensics-20261028/heapObjects.mjs';
import { summarizeAttribution } from './attributionSummary.mjs';

// Offline synthetic files only. No browser is launched or contacted here.
const [directory, destination] = process.argv.slice(2);
assert.ok(directory && destination, 'Usage: node summarizeSnapshots.mjs CAPTURE_DIRECTORY OUTPUT_JSON');
const capture = JSON.parse(readFileSync(resolve(directory, 'attribution.json')));
summarizeAttribution(capture);
const selected = ['AudioContext', 'AudioBuffer', 'CSSAnimation', 'KeyframeEffect', 'HTMLTag_canvas',
  'CanvasRenderingContext2D', 'HTMLTag_img', 'EventListener', 'V8EventListener'];
const graphs = [], states = [];
for (const snapshot of capture.snapshots) {
  assert.ok(['paused.heapsnapshot.gz', 'home.heapsnapshot.gz'].includes(snapshot.file));
  const compressed = readFileSync(resolve(directory, snapshot.file));
  assert.equal(compressed.length, snapshot.compressedBytes);
  assert.equal(createHash('sha256').update(compressed).digest('hex'), snapshot.sha256);
  const bytes = gunzipSync(compressed, { maxOutputLength: 128 * 1024 * 1024 });
  assert.equal(bytes.length, snapshot.bytes);
  const data = JSON.parse(bytes), summary = summarizeHeap(data);
  for (const key of Object.keys(summary)) assert.deepEqual(snapshot[key], summary[key], 'Reparse ' + key);
  graphs.push(summary);
  const nativeCounts = Object.fromEntries(selected.map(name => [name,
    summary.comparisonClasses.find(row => row.type === 'native' && row.name === name)?.count ?? 0]));
  const meta = data.snapshot.meta, width = meta.node_fields.length;
  const typeAt = meta.node_fields.indexOf('type'), nameAt = meta.node_fields.indexOf('name');
  const dimensions = [];
  for (let index = 0; index < data.nodes.length; index += width) {
    if (meta.node_types[typeAt][data.nodes[index + typeAt]] !== 'native') continue;
    const name = data.strings[data.nodes[index + nameAt]];
    if (heapClassName(name, 'native') !== 'HTMLTag_canvas') continue;
    const dimension = field => {
      const match = name.match(new RegExp('\\b' + field + '=["\']?(\\d+)'));
      return match && Number(match[1]) <= 100000 ? Number(match[1]) : null;
    };
    dimensions.push({ width: dimension('width'), height: dimension('height') });
  }
  states.push({ label: snapshot.label, compressedSha256: snapshot.sha256, rawBytes: bytes.length,
    graphNodes: summary.nodes, graphSelfBytes: summary.selfBytes, nativeCounts, canvasDimensions: dimensions });
}
const result = { version: 1, sourceCommit: capture.sourceCommit, requestedSeconds: capture.requestedSeconds,
  originalDigestsSizesAndSummariesMatched: true, states, pausedToHome: compareHeaps(graphs[0], graphs[1]),
  scope: 'Counts/self sizes after inactive GC; no dominators, native allocation stacks, physical phone acceptance or leak proof. Constructor objects/prototypes are excluded from nativeCounts.',
  rawOwnerReportsIncluded: false, rawHeapSnapshotsIncluded: false, whiteScreenFixed: false };
writeFileSync(resolve(destination), JSON.stringify(result, null, 2) + '\n');
console.log('CRYPTOID_ATTRIBUTION_SNAPSHOTS ' + JSON.stringify({ seconds: capture.requestedSeconds,
  originalsReparsed: states.length, nodeDelta: result.pausedToHome.nodesDelta,
  selfBytesDelta: result.pausedToHome.selfBytesDelta }));
