import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { summarizeMemoryTrace } from './nativeSummary.mjs';

const directory = fileURLToPath(new URL('.', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const bundleBytes = readFileSync(directory + 'evidence/synthetic-native-measurements.json.gz');
assert.equal(hash(bundleBytes), 'c778bd8db1897da1b660d3989d6fce39ef67c60d59ab23fd35736efbcdca9e85');
const bundle = JSON.parse(gunzipSync(bundleBytes));
assert.equal(bundle.syntheticOnly, true); assert.equal(bundle.physicalOwnerReportsIncluded, false);
assert.equal(bundle.captures.length, 6);
const median = values => {
  assert.ok(values.length); const sorted = [...values].sort((a, b) => a - b), mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const captures = bundle.captures.map(capture => {
  const v = capture.verification;
  assert.equal(v.physicalDevice, false); assert.equal(v.diagnostics, false); assert.equal(v.protection, true);
  assert.ok(v.observedActiveSeconds >= 90); assert.equal(v.additionalFullRecordingAbsent, true);
  assert.ok(v.volleyProgress.last > v.volleyProgress.first);
  const tail = v.points.filter(p => p.seconds >= v.observedActiveSeconds - 30);
  const result = { attempt: capture.attempt, case: capture.case, sourceCommit: v.sourceCommit,
    workflow: { runId: capture.runId, jobId: capture.jobId, originalRunConclusion: 'failure', originalJobConclusion: capture.jobConclusion,
      originalVerificationComplete: v.complete, originalFailure: v.failure ?? null,
      url: `https://github.com/19Trojan69/cryptoid-evolution/actions/runs/${capture.runId}/job/${capture.jobId}` },
    artifact: { id: capture.artifactId, bytes: capture.artifactBytes, sha256: capture.artifactSha256, zipIntegrityVerified: true },
    activeSeconds: v.observedActiveSeconds, volleys: v.volleyProgress, engineVersion: v.engineVersion,
    last30SecondsMedianProcessPssMiB: median(tail.map(p => p.process.summedPssKiB / 1024)),
    checkpoints: v.endpoints.map(e => ({ label: e.label, processPssMiB: e.process.summedPssKiB / 1024,
      jsHeap: e.jsHeap ?? null, dom: e.dom ?? null,
      categories: e.inspector?.latest?.categories ?? null,
      canvasBytes: e.inspector?.canvasBytes ?? null, canvasCount: e.inspector?.canvasCount ?? null })) };
  if (v.engine === 'webkit') {
    assert.equal(capture.jobConclusion, 'success'); assert.equal(v.complete, true);
    assert.deepEqual(v.unexpectedExternalRequests, []);
    const updates = [...new Map(tail.map(p => [p.inspector.latest.timestamp, p.inspector.latest])).values()];
    for (const p of v.points) assert.deepEqual(p.inspector.errors, []);
    result.uniqueNativeUpdates = v.uniqueNativeUpdates;
    result.last30SecondsMedianCategoryBytes = Object.fromEntries(
      ['javascript', 'images', 'layers', 'page', 'other'].map(type => [type,
        median(updates.map(u => { const c = u.categories.find(c => c.type === type); assert.ok(c); return c.size; }))]));
    result.maximumObservedCanvasBytes = Math.max(...v.points.map(p => p.inspector.canvasBytes));
    result.acceptedCompleteProfile = true;
  } else if (capture.attempt === 2) {
    // Recover only offline parsing. The original failed workflow and skipped
    // post-parser assertions remain failed/unverified and are not rewritten.
    assert.equal(v.complete, false); assert.equal(capture.jobConclusion, 'failure');
    assert.match(v.failure.message, /Number.isSafeInteger\(value\)/);
    assert.equal(v.trace.dataLossOccurred, false);
    assert.equal(v.qaInspectionBridgeRemovedAfterUnmount, true);
    assert.equal(v.extraUiResumeOutsideObservation, true);
    const compressed = readFileSync(directory + 'evidence/' + capture.durableTrace);
    assert.equal(hash(compressed), v.trace.sha256); assert.equal(compressed.length, v.trace.gzipBytes);
    const raw = gunzipSync(compressed); assert.equal(raw.length, v.trace.bytes);
    const events = JSON.parse(raw).traceEvents; assert.equal(events.length, v.trace.events);
    assert.deepEqual(v.dumpRequests.map(r => r.label), ['initial-paused', 'after-active-paused', 'unmounted']);
    const parsed = summarizeMemoryTrace(events, v.dumpRequests, { exportedSnapshotIds: true });
    assert.ok((parsed[1].timestampUs - parsed[0].timestampUs) / 1e6 >= v.observedActiveSeconds);
    const nativeCheckpoints = parsed.map(dump => {
      assert.ok(dump.matchedProcessDumps > 0);
      const fragments = ['Renderer', 'GPU Process'].map(name => {
        const matching = dump.processes.filter(p => p.processName === name && p.allocatorCount > 0);
        assert.equal(matching.length, 1, `one ${name} allocator fragment`);
        const p = matching[0], paths = name === 'Renderer'
          ? ['blink_gc', 'blink_objects', 'v8', 'malloc', 'partition_alloc', 'cc', 'cc/image_memory',
            'skia', 'discardable', 'canvas', 'media', 'web_cache', 'shared_memory']
          : ['gpu', 'gpu/shared_images', 'cc', 'malloc', 'shared_memory'];
        return { processId: p.processId, processName: name, allocatorCount: p.allocatorCount,
          categories: Object.fromEntries(paths.map(path => [path, p.allocators.find(r => r.path === path)?.bytes ?? null])),
          outsideSafeIntegerRange: p.allocators.filter(r => Object.keys(r.unrepresentableByteScalars).length)
            .map(r => ({ path: r.path, attributes: r.unrepresentableByteScalars })),
          sharedOwnershipEdges: p.sharedOwnershipEdges, reportedSizesMustNotBeSummed: true };
      });
      return { label: dump.label, timestampUs: dump.timestampUs, requestDumpGuid: dump.requestDumpGuid,
        exportedTraceDumpId: dump.traceDumpId, association: dump.association,
        matchedProcessDumps: dump.matchedProcessDumps, matchedDumpEvents: dump.matchedDumpEvents, fragments };
    });
    result.recovery = { offlinePostprocessingComplete: true, originalEndToEndJobPassed: false,
      originalPostParserAssertionsVerified: false, traceFile: 'evidence/' + capture.durableTrace,
      traceSha256: hash(compressed), traceEvents: events.length, traceDataLossOccurred: false, nativeCheckpoints };
  } else {
    assert.equal(v.complete, false); assert.equal(capture.jobConclusion, 'failure');
    result.nativeAttributionUsable = false;
    result.exclusionReason = 'Unrelated default trace events exhausted the collector bound; requested dumps were dropped.';
  }
  return result;
});
const report = { schemaVersion: 1, syntheticOnly: true, physicalDeviceMeasured: false,
  deliveredApplicationCommit: 'c610e7cb2bde2891dd04721c530c5b1bbead2215', applicationRuntimeChanged: false,
  deploymentChanged: false, smartphoneReducedEffectsPhysicalOutcome: null,
  nativeTerminationCauseMeasured: false, temperatureMeasured: false, whiteScreenFixed: false,
  evidence: { measurements: 'evidence/synthetic-native-measurements.json.gz', sha256: hash(bundleBytes),
    captures: captures.length, acceptedCompleteWebKitProfiles: 2, offlineRecoveredChromiumTraces: 2,
    originallyFailedChromiumJobs: 4, originalWorkflowFailuresPreserved: true },
  workflowSources: [
    { runId: 40892628729, commit: 'fbb0fe3295b7ce4614295bb6acd882bb381d8637', tree: '2924a5f064a7e2882ecb77f2d61df29cad6f9b8f' },
    { runId: 40893919633, commit: '3f6373200307e4dd7006273da7e5c22dc1814a49', tree: '5cb56abab5baca49c8412dbad012dc31b01b9c54' }
  ],
  constraints: [
    'Linux browser emulation and invasive profiling, not physical iOS/Android RAM or GPU limits.',
    'Only 90 active seconds, one unseeded run per condition and unequal WebKit simulated work.',
    'Native allocator rows overlap across parents and processes; do not sum them into RAM.',
    'WebKit other is unclassified; zero layers/page does not establish zero graphics memory.',
    'Three seconds after unmount without requested GC does not establish retained-object reachability.',
    'Reduced effects leaves some blur/shadows active and is not a graphics-off condition.'
  ], captures };
writeFileSync(directory + 'results.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ recoveredChromiumTraces: 2, acceptedWebKitProfiles: 2,
  originalWorkflowFailuresPreserved: true, rows: captures.map(c => ({ case: c.case, attempt: c.attempt,
    activeSeconds: c.activeSeconds, pssMiB: c.last30SecondsMedianProcessPssMiB,
    categories: c.last30SecondsMedianCategoryBytes ?? null })) }));
