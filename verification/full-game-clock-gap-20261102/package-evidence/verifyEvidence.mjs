import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = name => readFileSync(new URL(name, import.meta.url));
const m = JSON.parse(read('manifest.json'));
const expected = JSON.parse(readFileSync(new URL('../../local-boss-style-20261102/evidence/expected-builds.json', import.meta.url)));
assert.equal(m.version, 1); assert.equal(m.rawOwnerReportsIncluded, false);
assert.equal(m.sourceCommit, '5acefc1aa3ea224b656a76c415da39ece0ed84f0');
assert.equal(m.sourceTree, 'e5d838eead213cf6c1d9e9d365c4de38ef7395b8'); assert.equal(m.runId, 41449159220);
assert.deepEqual(m.captures.map(c => c.engine), ['chromium', 'webkit']);
function checked(r) {
  assert.match(r.file, /^(chromium|webkit)-(verification\.json|build-info\.json|source-scope\.txt|cycle-[012]\.jsonl)$/);
  const bytes = read(r.file); assert.equal(bytes.length, r.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), r.sha256); return bytes;
}
for (const cell of m.captures) {
  assert.equal(cell.jobConclusion, 'success'); assert.equal(cell.artifact.workflow_run.id, m.runId);
  assert.equal(cell.artifact.workflow_run.head_sha, m.sourceCommit);
  assert.equal(cell.artifact.githubDigestMatched, true); assert.equal(cell.artifact.zipIntegrityPassed, true);
  assert.match(cell.artifact.digest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(checked(cell.scope).toString('utf8').trim(), 'CRYPTOID_DIRECT_STYLE_DEVICE_SCOPE {"passed":true,"originalRuntimeTreesUnchanged":true,"automaticDeployment":false}');
  const c = JSON.parse(checked(cell.observation)), build = JSON.parse(checked(cell.build));
  for (const obj of [c, build]) { assert.equal(obj.sourceCommit, m.sourceCommit); assert.equal(obj.sourceTree, m.sourceTree); }
  assert.equal(c.engine, cell.engine); assert.equal(c.condition, 'original'); assert.equal(c.run, 'smoke');
  assert.equal(c.complete, true); assert.equal(c.normalReportVerified, true); assert.equal(c.requestedActiveSeconds, 60);
  assert.equal(c.actualHostOS, 'linux'); assert.equal(c.builtScene, 'original-artwork'); assert.equal(c.cycles.length, 3);
  for (const key of ['physicalDevice', 'physicalPiBrowser', 'nativeTerminationCauseMeasured', 'whiteScreenFixed',
    'clocksAccelerated', 'automaticResume', 'additionalFullRecording', 'activeScreenshots', 'forcedGc', 'heapSnapshots', 'extraGameCollectors']) assert.equal(c[key], false);
  assert.equal(c.collisionProtection, true); assert.equal(c.productionRuntimeNotChanged, true);
  // The legacy single-package runner's flag is retained; it is not a paired memory comparison.
  assert.equal(c.comparedConditionsAreVisuallyDifferent, true);
  assert.deepEqual(build.qaLocalBossStyle, expected.leaves); assert.equal(build.qaClockGapProbe, undefined);
  assert.equal(build.guestOnly, true); assert.equal(build.diagnosticScene, 'original-artwork');
  for (const key of ['liveBackend', 'actualPiAuthentication', 'payments', 'automaticUpload', 'automaticResume']) assert.equal(build[key], false);
  const candidate = build.directStyleDeviceCandidate;
  for (const key of ['activeFrameProbeIncluded', 'activeClockTraceIncluded', 'sourceGameFilesEdited',
    'productionCandidate', 'physicalDeviceAccepted', 'whiteScreenFixed']) assert.equal(candidate[key], false);
  assert.equal(candidate.basisNativeFlowSource, 'a8e407a649431c719dfee64e0ec3cf63d73de3e0');
  assert.equal(candidate.basisNativeFlowRun, 41445407351);
  const state = readFileSync(new URL('../../boss2-stopwatch-20261029/stopwatchState.mjs', import.meta.url));
  assert.equal(build.diagnosticStopwatch.stateSha256, createHash('sha256').update(state).digest('hex'));
  assert.equal(candidate.diagnosticClockStateSha256, build.diagnosticStopwatch.stateSha256);
  for (const [i, cycle] of c.cycles.entries()) {
    assert.equal(cycle.cycle, i); assert.equal(cycle.complete, true);
    assert.equal(cycle.requestedMs, i ? 10000 : 60000); assert.ok(cycle.observedActiveMs >= cycle.requestedMs);
    assert.ok(cycle.volleysAdvanced > 0);
    for (const key of ['pauseFreezeVerified', 'weaponRoundtripVerified', 'qaInspectionBridgeReleased', 'normalExitVerified']) assert.equal(cycle[key], true);
  }
  assert.equal(cell.pointLogs.length, 3);
  for (const pointLog of cell.pointLogs) {
    const i = Number(pointLog.file.match(/cycle-([012])\.jsonl$/)[1]);
    assert.equal(checked(pointLog).toString('utf8'), c.cycles[i].points.map(p => JSON.stringify(p) + '\n').join(''));
  }
}
console.log('CRYPTOID_DEVICE_PACKAGE_EVIDENCE ' + JSON.stringify({ captures: 2, completeNativePackageFlows: 2,
  hostedBuildVerified: false, physicalDeviceAccepted: false, whiteScreenFixed: false, memoryComparisonEligible: false }));
