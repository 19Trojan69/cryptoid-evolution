import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const expectedProofs = JSON.parse(readFileSync(new URL('../../local-boss-style-20261102/evidence/expected-builds.json', import.meta.url)));
const compilerTransforms = Object.fromEntries(Object.entries(expectedProofs).flatMap(([condition, p]) =>
  Object.entries(p.transformedBlobs).map(([name, sha]) => [condition + '/' + name, sha])));
export function summarizeDynamic(c, cell, expectedCssBlob) {
  assert.ok(['initial', 'height-diagnostic', 'cssom'].includes(cell.label));
  assert.ok(['chromium', 'webkit'].includes(cell.engine));
  assert.equal(c.kind, 'standalone-dynamic-react-component-fidelity'); assert.equal(c.version, 1);
  assert.equal(c.engine, cell.engine); assert.equal(c.sourceCommit, cell.sourceCommit); assert.equal(c.sourceTree, cell.sourceTree);
  assert.match(c.sourceCommit, /^[a-f0-9]{40}$/); assert.match(c.sourceTree, /^[a-f0-9]{40}$/);
  assert.equal(c.cssBlob, expectedCssBlob); assert.deepEqual(c.componentProofs, expectedProofs);
  assert.deepEqual(c.observedCompilerTransforms, compilerTransforms);
  for (const k of ['componentInputTestOnly', 'originalCssRetained', 'syntheticInputSequence']) assert.equal(c[k], true);
  for (const k of ['gameControllerStarted', 'gameClockStarted', 'liveBackend', 'authentication', 'payments',
    'physicalDevice', 'runtimeSourceFilesEdited', 'whiteScreenFixed', 'memoryBenefitMeasured',
    'wholeGameStartupVerified', 'physicalPhoneAcceptanceEstablished']) assert.equal(c[k], false);
  assert.equal(c.actualHostOS, 'linux'); assert.match(c.engineVersion, /^\d+\.\d+(?:\.\d+){0,2}$/);
  assert.match(c.playwrightVersion, /^\d+\.\d+\.\d+$/); assert.match(c.lockSha256, /^[a-f0-9]{64}$/);
  for (const n of ['react', 'react-dom', 'vite', 'typescript']) assert.match(c.actualInstalledPackages[n], /^\d+\.\d+\.\d+$/);
  assert.ok([1, 2].includes(cell.validationContract));
  if (cell.validationContract === 1) {
    assert.equal(c.validationContract, undefined); assert.equal(c.inlineHeightCheck, undefined); assert.equal(c.nativeHeightCheck, undefined);
  } else {
    assert.equal(c.validationContract, 2); assert.equal(c.inlineHeightCheck, 'exact-engine-cssom-serialization');
    assert.equal(c.nativeHeightCheck, 'exact-control-candidate-equality');
  }
  assert.equal(typeof c.complete, 'boolean'); assert.equal(cell.jobConclusion, c.complete ? 'success' : 'failure');
  assert.ok(Array.isArray(c.modelsCompleted) && c.modelsCompleted.length <= 50);
  assert.deepEqual(c.modelsCompleted, Array.from({ length: c.modelsCompleted.length }, (_, i) => i + 1));
  let checks = null;
  if (c.complete) {
    assert.equal(c.failure, undefined); assert.equal(c.modelsCompleted.length, 50);
    assert.equal(c.progress.dynamicCases, 1800); assert.equal(c.progress.fallingCases, 50); assert.equal(c.progress.absentCases, 50);
    assert.equal(c.progress.sameNodeChecks, 3500);
    const f = c.final; assert.equal(f.dynamicCases, 1801); assert.equal(f.fallingCases, 50); assert.equal(f.absentCases, 50);
    assert.equal(f.sameNodeChecks, 3500); assert.equal(f.rootsUnmounted, true);
    assert.equal(f.physicalDevice, false); assert.equal(f.whiteScreenFixed, false);
    for (const k of ['retainedNativeAnimationChecks', 'retainedStartedAnimationChecks', 'enginesChecked', 'lightsChecked'])
      assert.ok(Number.isSafeInteger(f[k]) && f[k] > 0);
    assert.ok(f.retainedNativeAnimationChecks >= f.retainedStartedAnimationChecks);
    assert.ok(c.animationContinuity.retainedStartedAnimationChecks > 0);
    assert.equal(c.animationContinuity.retainedStartedAnimationChecks, f.retainedStartedAnimationChecks);
    checks = { ...f };
  } else {
    assert.equal(c.final, undefined); assert.ok(c.failure?.code);
    assert.ok(typeof c.failure.message === 'string' && c.failure.message.length > 0 && c.failure.message.length <= 4096);
  }
  return { label: cell.label, engine: c.engine, sourceCommit: c.sourceCommit, sourceTree: c.sourceTree,
    validationContract: cell.validationContract, complete: c.complete, classification: c.complete ? 'component-fidelity-passed' : 'component-protocol-failed',
    completedModels: c.modelsCompleted.length, engineVersion: c.engineVersion, playwrightVersion: c.playwrightVersion,
    actualInstalledPackages: c.actualInstalledPackages, lockSha256: c.lockSha256,
    checks, failure: c.failure ?? null, rootsUnmounted: c.complete ? true : null,
    wholeGameStartupVerified: false, memoryBenefitMeasured: false, physicalPhoneAcceptanceEstablished: false,
    nativeTerminationCauseMeasured: false, whiteScreenFixed: false };
}
export function classifyDynamicSet(rows) {
  assert.ok(rows.length >= 2 && rows.length <= 6);
  assert.equal(new Set(rows.map(r => r.label + '/' + r.engine)).size, rows.length);
  for (const label of new Set(rows.map(r => r.label)))
    assert.deepEqual(rows.filter(r => r.label === label).map(r => r.engine).sort(), ['chromium', 'webkit']);
  const accepted = rows.filter(r => r.label === 'cssom');
  const passed = accepted.length === 2 && accepted.every(r => r.complete && r.validationContract === 2);
  if (passed) for (const k of ['sourceCommit', 'sourceTree', 'playwrightVersion', 'actualInstalledPackages', 'lockSha256'])
    assert.deepEqual(accepted[0][k], accepted[1][k]);
  return { archivedCaptures: rows.length, retainedProtocolFailures: rows.filter(r => !r.complete).length,
    componentFidelityEstablishedInBothEngines: passed,
    wholeGameStartupVerified: false, memoryBenefitMeasured: false, physicalPhoneAcceptanceEstablished: false,
    nativeTerminationCauseMeasured: false, whiteScreenFixed: false };
}
