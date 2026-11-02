import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = name => readFileSync(new URL(name, import.meta.url));
const m = JSON.parse(read('manifest.json'));
const expected = JSON.parse(readFileSync(new URL('../../local-boss-style-20261102/evidence/expected-builds.json', import.meta.url)));
const sources = {
  '3d4cb0c17d1b3d91de9a9b87eb9a2761832f2efe': { tree: 'b70e43a631a3bd32a14ef73d122b81462eed876d', run: 41484913176 },
  'ce8cc4ab6630e502b796adfde082d75238c5095b': { tree: '5cf24892e16ffbf4f3ba0ed5d939e0dd646c675e', run: 41485674562 },
};
assert.equal(m.version, 1); assert.equal(m.rawOwnerReportsIncluded, false);
assert.equal(m.finalCandidateSource, 'ce8cc4ab6630e502b796adfde082d75238c5095b'); assert.equal(m.captures.length, 4);
const keys = new Set();
function checked(r) {
  assert.match(r.file, /^(3d4cb0c1|ce8cc4ab)-(chromium|webkit)-(verification\.json|build-info\.json|source-scope\.txt|cycle-[012]\.jsonl)$/);
  const b = read(r.file); assert.equal(b.length, r.bytes); assert.equal(createHash('sha256').update(b).digest('hex'), r.sha256); return b;
}
const summaries = [];
for (const cell of m.captures) {
  assert.ok(sources[cell.sourceCommit]); assert.equal(cell.sourceTree, sources[cell.sourceCommit].tree);
  assert.equal(cell.runId, sources[cell.sourceCommit].run); assert.ok(['chromium', 'webkit'].includes(cell.engine));
  const key = cell.sourceCommit + '/' + cell.engine; assert.equal(keys.has(key), false); keys.add(key);
  assert.equal(cell.jobConclusion, 'success'); assert.equal(cell.artifact.workflow_run.id, cell.runId);
  assert.equal(cell.artifact.workflow_run.head_sha, cell.sourceCommit); assert.equal(cell.artifact.githubDigestMatched, true);
  assert.equal(cell.artifact.zipIntegrityPassed, true); assert.match(cell.artifact.digest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(checked(cell.scope).toString('utf8').trim(), 'CRYPTOID_DIRECT_STYLE_DEVICE_SCOPE {"passed":true,"originalRuntimeTreesUnchanged":true,"automaticDeployment":false}');
  const c = JSON.parse(checked(cell.observation)), build = JSON.parse(checked(cell.build));
  for (const obj of [c, build]) { assert.equal(obj.sourceCommit, cell.sourceCommit); assert.equal(obj.sourceTree, cell.sourceTree); }
  assert.equal(c.engine, cell.engine); assert.equal(c.complete, true); assert.equal(c.normalReportVerified, true);
  assert.equal(c.run, 'smoke'); assert.equal(c.condition, 'original'); assert.equal(c.requestedActiveSeconds, 60);
  assert.equal(c.actualHostOS, 'linux'); assert.equal(c.productionRuntimeNotChanged, true); assert.equal(c.cycles.length, 3);
  for (const key of ['physicalDevice', 'physicalPiBrowser', 'nativeTerminationCauseMeasured', 'whiteScreenFixed',
    'clocksAccelerated', 'automaticResume', 'additionalFullRecording', 'activeScreenshots', 'forcedGc', 'heapSnapshots', 'extraGameCollectors']) assert.equal(c[key], false);
  assert.equal(c.collisionProtection, true); assert.equal(c.comparedConditionsAreVisuallyDifferent, true);
  assert.deepEqual(build.qaLocalBossStyle, expected.leaves); assert.equal(build.qaClockGapProbe, undefined);
  assert.equal(build.guestOnly, true); assert.equal(build.diagnosticScene, 'original-artwork');
  for (const key of ['liveBackend', 'actualPiAuthentication', 'payments', 'automaticUpload', 'automaticResume']) assert.equal(build[key], false);
  const candidate = build.directStyleDeviceCandidate;
  assert.equal(candidate.inheritedProjectBuildControlsExcluded, true);
  assert.equal(candidate.basisNativeFlowSource, 'a8e407a649431c719dfee64e0ec3cf63d73de3e0'); assert.equal(candidate.basisNativeFlowRun, 41445407351);
  for (const key of ['activeFrameProbeIncluded', 'activeClockTraceIncluded', 'sourceGameFilesEdited', 'productionCandidate', 'physicalDeviceAccepted', 'whiteScreenFixed']) assert.equal(candidate[key], false);
  const state = readFileSync(new URL('../../boss2-stopwatch-20261029/stopwatchState.mjs', import.meta.url));
  assert.equal(build.diagnosticStopwatch.stateSha256, createHash('sha256').update(state).digest('hex'));
  for (const [i, cycle] of c.cycles.entries()) {
    assert.equal(cycle.cycle, i); assert.equal(cycle.complete, true); assert.equal(cycle.requestedMs, i ? 10000 : 60000);
    assert.ok(cycle.observedActiveMs >= cycle.requestedMs); assert.ok(cycle.volleysAdvanced > 0);
    for (const key of ['pauseFreezeVerified', 'weaponRoundtripVerified', 'qaInspectionBridgeReleased', 'normalExitVerified']) assert.equal(cycle[key], true);
  }
  assert.equal(cell.pointLogs.length, 3);
  for (const pointLog of cell.pointLogs) {
    const i = Number(pointLog.file.match(/cycle-([012])\.jsonl$/)[1]);
    assert.equal(checked(pointLog).toString('utf8'), c.cycles[i].points.map(p => JSON.stringify(p) + '\n').join(''));
  }
  summaries.push({ source: cell.sourceCommit, engine: cell.engine, activeMs: c.cycles.map(r => r.observedActiveMs) });
}
console.log('CRYPTOID_DEVICE_ENVIRONMENT_EVIDENCE ' + JSON.stringify({ captures: summaries, hostedPlayableCandidateVerified: false,
  physicalDeviceAccepted: false, whiteScreenFixed: false, memoryComparisonEligible: false }));
