import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { adaptJournalBuild, BASE_DEVICE_COMMIT, digest } from './transform.mjs';
import { CONTROLLER_SHA256 } from '../player-muzzle-local-20261104/transform.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname);
assert.equal(process.env.VERCEL_ENV, 'preview');
const journalFolder = root + '/verification/critical-failure-journal-20261104';
const buildPath = journalFolder + '/build.mjs';
const source = readFileSync(buildPath, 'utf8');
const protectedModules = [
  '/verification/boss2-brief-report-20261030/briefBrowser.mjs',
  '/verification/boss2-forensics-20261028/devicePreviewApp.jsx',
  '/verification/critical-failure-journal-20261104/criticalState.mjs',
  '/verification/critical-failure-journal-20261104/transform.mjs',
];
const before = protectedModules.map(path => ({path, sha256: digest(readFileSync(root + path))}));
const temporary = buildPath.replace(/\.mjs$/, `.muzzle-webkit-${process.pid}.mjs`);
try {
  const adapted = adaptJournalBuild(source);
  writeFileSync(temporary, adapted);
  await import(pathToFileURL(temporary).href);
  const infoPath = root + '/verification/boss2-forensics-20261028/results/device-preview/site/device-preview-info.json';
  const info = JSON.parse(readFileSync(infoPath, 'utf8'));
  const muzzle = info.playerMuzzleLocalCandidate;
  assert.equal(muzzle.condition, 'leaf');
  assert.equal(muzzle.originalControllerSha256, CONTROLLER_SHA256);
  assert.equal(muzzle.sourceGameFilesEdited, false);
  assert.equal(muzzle.gameOrAnimationClocksChanged, false);
  assert.equal(info.criticalFailureJournal.originalClockRetained, true);
  assert.equal(info.criticalFailureJournal.onlyMuzzleWriterTargetChanged, true);
  assert.equal(info.qaLocalBossStyle.condition, 'leaves');
  assert.equal(info.mobileHudBackdropCandidate.value, 'none');
  assert.deepEqual(protectedModules.map(path => ({path, sha256: digest(readFileSync(root + path))})), before);
  info.muzzleWebKitScopeCandidate = {
    version: 1, baseDeviceCommit: BASE_DEVICE_COMMIT,
    label: 'Lokaler Mündungslichtwert – gezielte Stabilitätsprüfung',
    originalJournalBuilderSha256: digest(source), adaptedJournalBuilderSha256: digest(adapted),
    controllerSha256: CONTROLLER_SHA256, compiledControllerSha256: muzzle.compiledVirtualControllerSha256,
    reusedPreviouslyVerifiedLeafHelper: true, unchangedJournalSources: before,
    nativeStyleCacheEntriesMeasured: false, nativeMemoryBenefitMeasured: false,
    earlierChromiumResourceDecisionStillFailed: true, physicalDeviceAccepted: false, whiteScreenFixed: false,
  };
  writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
  execFileSync(process.execPath, ['verification/direct-boss-style-device-20261102/verifyScope.mjs'], {cwd: root, stdio: 'inherit'});
  console.log('WEBKIT_MUZZLE_BUILD ' + JSON.stringify(info.muzzleWebKitScopeCandidate));
} finally {
  unlinkSync(temporary);
  assert.equal(readFileSync(buildPath, 'utf8'), source);
}
