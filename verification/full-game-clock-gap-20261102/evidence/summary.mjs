import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyClockTrace } from '../clockTrace.mjs';
const builds = JSON.parse(readFileSync(new URL('../../local-boss-style-20261102/evidence/expected-builds.json', import.meta.url)));
export function prematureClockEdges(trace) {
  return (trace?.rows ?? []).flatMap((r, i, rows) => {
    const p = rows[i - 1];
    return p && p.clockId && p.clockId === r.clockId && p.mode === 'running' && p.frames === 0 && p.frameAt === 0
      && r.frames === 0 && r.frameAt === 0 && r.unobservedGaps > p.unobservedGaps
      ? [{ clockId: r.clockId, beforeAt: p.at, afterAt: r.at, sampleGapMs: r.at - p.at,
        previousFrames: p.frames, currentFrames: r.frames, unobservedGaps: r.unobservedGaps }] : [];
  });
}
function frame(r) {
  assert.ok(r); for (const k of ['generation', 'frames', 'playingFrames']) assert.ok(Number.isSafeInteger(r[k]) && r[k] > 0);
  assert.ok(Number.isFinite(r.maxPlayingGapMs) && r.maxPlayingGapMs >= 0); assert.ok(r.gaps.length <= 16);
  for (const g of r.gaps) { assert.ok(Number.isFinite(g.time)); assert.ok(Number.isFinite(g.gap) && g.gap > 250); }
}
export function summarizeFlow(c, cell) {
  assert.ok(['initial', 'fresh-frame'].includes(cell.label));
  assert.ok(['chromium', 'webkit'].includes(cell.engine)); assert.ok(['control', 'leaves'].includes(cell.condition));
  assert.ok([1, 2].includes(cell.replica)); assert.ok(['short', 'long'].includes(cell.phase));
  const seconds = cell.phase === 'short' ? 60 : 1200;
  if (cell.phase === 'long') assert.equal(cell.replica, 1);
  assert.equal(c.sourceCommit, cell.sourceCommit); assert.equal(c.sourceTree, cell.sourceTree); assert.equal(c.engine, cell.engine);
  assert.equal(c.condition, 'original'); assert.equal(c.requestedActiveSeconds, seconds);
  assert.equal(c.run, cell.phase === 'short' ? 'smoke' : 'soak');
  assert.deepEqual(c.clockGapComparison, { version: 1, engine: cell.engine, condition: cell.condition, replica: cell.replica, phase: cell.phase, seconds });
  assert.deepEqual(c.localStyleBuildProof, builds[cell.condition]); assert.equal(c.actualHostOS, 'linux');
  assert.match(c.engineVersion, /^\d+\.\d+(?:\.\d+){0,2}$/);
  for (const k of ['physicalDevice', 'physicalPiBrowser', 'nativeTerminationCauseMeasured', 'whiteScreenFixed', 'clocksAccelerated',
    'automaticResume', 'additionalFullRecording', 'activeScreenshots', 'forcedGc', 'heapSnapshots', 'memoryComparisonEligible',
    'comparedConditionsAreVisuallyDifferent']) assert.equal(c[k], false);
  for (const k of ['collisionProtection', 'productionRuntimeNotChanged', 'activeFrameScalarObserver', 'existingClockSampleObserver',
    'noNewTimerOrAnimationFrame', 'extraGameCollectors']) assert.equal(c[k], true);
  assert.equal(c.clockGapBuildProof.version, cell.observerVersion);
  for (const k of ['newTimers', 'newAnimationFrames', 'appClocksWritten', 'automaticResume', 'stateObjectsOrDomRetained',
    'sourceGameFilesEdited', 'physicalDevice', 'whiteScreenFixed']) assert.equal(c.clockGapBuildProof[k], false);
  assert.equal(c.clockGapBuildProof.maxClockRows, 96); assert.equal(c.clockGapBuildProof.maxFrameGapRows, 16);
  if (cell.observerVersion === 1) {
    assert.equal(c.actualInstalledPackages, undefined); assert.equal(c.lockSha256, undefined);
  } else {
    assert.equal(cell.observerVersion, 2);
    assert.equal(c.clockGapBuildProof.clockStartPolicy, 'wait for a fresh advancing frame on initial start and resume');
    assert.match(c.lockSha256, /^[a-f0-9]{64}$/); assert.match(c.playwrightVersion, /^\d+\.\d+\.\d+$/);
    for (const n of ['react', 'react-dom', 'react-router-dom', 'vite', 'typescript']) assert.match(c.actualInstalledPackages[n], /^\d+\.\d+\.\d+$/);
  }
  assert.equal(typeof c.complete, 'boolean'); assert.equal(cell.jobConclusion, c.complete ? 'success' : 'failure');
  assert.ok(c.cycles.length > 0 && c.cycles.length <= 3);
  for (const [i, r] of c.cycles.entries()) {
    assert.equal(r.cycle, i); assert.equal(r.requestedMs, (i === 0 ? seconds : 10) * 1000);
    for (const p of r.points) assert.ok(Number.isFinite(p.linuxBrowserDescendantPssKiB) && p.linuxBrowserDescendantPssKiB >= 0);
    if (!r.complete) continue;
    assert.ok(r.observedActiveMs >= r.requestedMs); assert.ok(r.volleysAdvanced > 0);
    for (const k of ['pauseFreezeVerified', 'weaponRoundtripVerified', 'qaInspectionBridgeReleased', 'normalExitVerified', 'frameProbeReleased']) assert.equal(r[k], true);
    frame(r.frameProbe);
  }
  if (c.complete) {
    assert.equal(c.cycles.length, 3); assert.ok(c.cycles.every(r => r.complete));
    assert.equal(c.normalReportVerified, true); assert.equal(c.failure, undefined);
  } else {
    assert.ok(c.failure?.code && c.failure.message.length <= 4096);
    assert.ok(c.failureObservation); if (c.frameProbeAtFailure) frame(c.frameProbeAtFailure);
    if (c.frameProbeAfterFailure) frame(c.frameProbeAfterFailure);
    if (c.clockGapDiagnosis) assert.deepEqual(c.clockGapDiagnosis, classifyClockTrace(c.clockTrace, c.failureObservation));
  }
  if (c.clockTrace) { assert.equal(c.clockTrace.version, 1); assert.ok(c.clockTrace.rows.length <= 96); }
  const premature = prematureClockEdges(c.clockTrace);
  return { cell: { label: cell.label, engine: cell.engine, condition: cell.condition, replica: cell.replica, phase: cell.phase },
    sourceCommit: c.sourceCommit, sourceTree: c.sourceTree, engineVersion: c.engineVersion, complete: c.complete,
    observerVersion: cell.observerVersion, packagesRecorded: !!c.actualInstalledPackages,
    actualInstalledPackages: c.actualInstalledPackages ?? null, lockSha256: c.lockSha256 ?? null,
    completedUiCycles: c.cycles.filter(r => r.complete).length,
    measuredActiveMs: c.cycles.map(r => r.complete ? r.observedActiveMs : null),
    prematureClockStartEdges: premature,
    observedFrameMaxAtFailureMs: c.frameProbeAtFailure?.maxPlayingGapMs ?? null,
    observedFrameMaxAfterFailureMs: c.frameProbeAfterFailure?.maxPlayingGapMs ?? null,
    diagnosis: c.clockGapDiagnosis ?? null, failure: c.failure ?? null,
    normalReportVerified: c.normalReportVerified === true,
    nativeTerminationCauseMeasured: false, whiteScreenFixed: false, physicalPhoneAcceptanceEstablished: false,
    memoryComparisonEligible: false };
}
export function classifyFlows(rows) {
  assert.equal(new Set(rows.map(r => r.sourceCommit + '/' + Object.values(r.cell).join('/'))).size, rows.length);
  const sources = [...new Set(rows.map(r => r.sourceCommit))];
  return { archivedCaptures: rows.length, retainedFailures: rows.filter(r => !r.complete).length,
    cohorts: sources.map(source => {
      const all = rows.filter(r => r.sourceCommit === source), short = all.filter(r => r.cell.phase === 'short'), long = all.filter(r => r.cell.phase === 'long');
      const key = r => [r.cell.engine, r.cell.condition, r.cell.replica].join('/');
      const expectedShort = ['chromium', 'webkit'].flatMap(e => ['control', 'leaves'].flatMap(c => [1, 2].map(r => [e, c, r].join('/'))));
      const expectedLong = ['chromium', 'webkit'].flatMap(e => ['control', 'leaves'].map(c => [e, c, 1].join('/')));
      const shortPassed = short.length === 8 && short.every(r => r.complete) && expectedShort.every(k => short.some(r => key(r) === k));
      if (shortPassed && short[0].packagesRecorded) for (const r of all) for (const k of ['actualInstalledPackages', 'lockSha256']) assert.deepEqual(r[k], short[0][k]);
      return { sourceCommit: source, completeShortFlows: short.filter(r => r.complete).length, failedShortFlows: short.filter(r => !r.complete).length,
        allEightShortFlowsPassed: shortPassed, completedLongFlows: long.filter(r => r.complete).length,
        failedLongFlows: long.filter(r => !r.complete).length,
        completeFourConditionLongStage: shortPassed && long.length === 4 && long.every(r => r.complete) && expectedLong.every(k => long.some(r => key(r) === k)),
        prematureClockStartFailures: all.filter(r => !r.complete && r.prematureClockStartEdges.length > 0).length };
    }), nativeTerminationCauseMeasured: false, whiteScreenFixed: false, physicalPhoneAcceptanceEstablished: false, memoryComparisonEligible: false };
}
