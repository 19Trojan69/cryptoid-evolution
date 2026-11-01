import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { summarizeNative } from './nativeSummary.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const directory = new URL('./', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('native-evidence-manifest.json', directory), 'utf8'));
assert.equal(manifest.syntheticEvidenceOnly, true);
assert.equal(manifest.rawOwnerReportsIncluded, false);
assert.match(manifest.measuredSource, /^[a-f0-9]{40}$/);
const compressed = readFileSync(new URL(manifest.captureFile, directory));
assert.equal(compressed.length, manifest.captureBytes);
assert.equal(digest(compressed), manifest.captureSha256, 'Exact persisted capture bytes');
const bundle = JSON.parse(gunzipSync(compressed).toString('utf8'));
assert.equal(bundle.workflowRun, manifest.workflowRun);
assert.equal(bundle.sourceCommit, manifest.measuredSource);
assert.equal(bundle.records.length, manifest.records);
const summaries = [];
const identities = new Set();
for (const entry of bundle.records) {
  assert.equal(digest(Buffer.from(entry.jsonText)), entry.jsonSha256, 'Exact original synthetic JSON');
  const metadata = manifest.artifacts.find(artifact => artifact.id === entry.artifactId);
  assert.ok(metadata && metadata.zipSha256 === entry.artifactZipSha256, 'Known hash-verified artifact');
  const record = JSON.parse(entry.jsonText);
  const identity = `${record.engine}/${record.condition}/${record.run}`;
  assert.ok(!identities.has(identity), 'No duplicate observations'); identities.add(identity);
  assert.equal(record.sourceTree, manifest.measuredTree);
  summaries.push({ artifactId: entry.artifactId, ...summarizeNative(record, manifest.measuredSource) });
}
for (const engine of ['chromium', 'webkit']) for (const condition of ['original', 'mini-start'])
  assert.ok(summaries.some(row => row.engine === engine && row.condition === condition), 'All four conditions preserved');
const result = { version: 1, workflowRun: manifest.workflowRun, measuredSource: manifest.measuredSource,
  measuredTree: manifest.measuredTree, originalWorkflowConclusion: manifest.workflowConclusion,
  sourceGatesPassed: manifest.sourceGatesPassed, syntheticEvidenceOnly: true,
  completedTwentyMinuteLinuxObservations: summaries.filter(row => row.twentyMinuteLinuxObservationCompleted).length,
  physicalPhoneAcceptanceEstablished: false, whiteScreenFixed: false, observations: summaries };
const text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--write')) writeFileSync(new URL('native-results.json', directory), text);
else assert.equal(readFileSync(new URL('native-results.json', directory), 'utf8'), text, 'Published summary reproduces exactly');
console.log('CRYPTOID_NATIVE_EVIDENCE ' + JSON.stringify({ passed: true, records: summaries.length,
  completedTwentyMinuteLinuxObservations: result.completedTwentyMinuteLinuxObservations,
  originalWorkflowConclusion: result.originalWorkflowConclusion, whiteScreenFixed: false }));
