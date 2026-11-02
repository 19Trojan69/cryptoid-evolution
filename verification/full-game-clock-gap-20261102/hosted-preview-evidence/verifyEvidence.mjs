import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = name => readFileSync(new URL(name, import.meta.url));
const receipt = JSON.parse(read('receipt.json'));
const source = 'b042c8e50ad3f05a70418ae5ee6bb4412809035b', tree = '921fe9212ce0ccfeaa7dc46352d3d6385c7f3fb2';
assert.equal(receipt.version, 1); assert.equal(receipt.sourceCommit, source); assert.equal(receipt.sourceTree, tree);
assert.equal(receipt.deploymentId, 'dpl_HiEfjsJYS3HTuHs3A7JkQ4Jzg7Yu'); assert.equal(receipt.target, null);
assert.equal(receipt.readyState, 'READY'); assert.equal(receipt.nativePackageRun, 41489185104);
assert.deepEqual(receipt.nativePackageEnginesPassed, ['chromium', 'webkit']);
assert.equal(receipt.previewUrl, 'https://cryptoid-evolution-testnet-qj8gl2epe-19-trojan69.vercel.app/');
for (const key of ['preparedInitialPauseObserved', 'manualResumeObserved', 'normalExitConfirmationObserved', 'normalExitMenuObserved',
  'protectionEnabled', 'guestUserResponseVerified', 'adminDenialResponseVerified', 'clockMetadataComparedWithNativeBuild', 'browserAccessGrantedByUser']) assert.equal(receipt[key], true);
for (const key of ['fullRecordingEnabled', 'directClockFileReadSucceeded', 'sharingOrProtectionChanged', 'productionChanged',
  'physicalDevice', 'whiteScreenFixed', 'ownerReportsIncluded', 'credentialsOrShareTokensIncluded']) assert.equal(receipt[key], false);
assert.equal(receipt.directClockFileReadBlock, 'net::ERR_BLOCKED_BY_CLIENT');
assert.equal(receipt.activeTimerObserved, '00:38'); assert.equal(receipt.normalExitSavedTimer, '00:43');
function checked(name) {
  const r = receipt.files[name]; assert.equal(r.file, name);
  const bytes = read(name); assert.equal(bytes.length, r.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), r.sha256); return bytes;
}
const build = JSON.parse(checked('build-info.json'));
assert.equal(build.sourceCommit, source); assert.equal(build.sourceTree, tree); assert.equal(build.guestOnly, true);
assert.equal(build.diagnosticScene, 'original-artwork'); assert.equal(build.diagnosticCanvasEffects, 'original-canvas-renderer');
assert.equal(build.qaClockGapProbe, undefined); assert.equal(build.sourceGameEditedByBuilder, false);
for (const key of ['actualPiAuthentication', 'liveBackend', 'realAccounts', 'payments', 'automaticUpload', 'automaticResume', 'nativeDeviceAccepted', 'whiteScreenFixed']) assert.equal(build[key], false);
for (const engine of ['chromium', 'webkit']) {
  const native = JSON.parse(readFileSync(new URL('../environment-fix-evidence/b042c8e5-' + engine + '-build-info.json', import.meta.url)));
  for (const key of ['qaLocalBossStyle', 'diagnosticStopwatch', 'directStyleDeviceCandidate', 'controllerSha256', 'normalizedControllerSha256']) assert.deepEqual(build[key], native[key]);
}
assert.deepEqual(JSON.parse(checked('guest-user.json')), { user: null, canAdmin: false, adminMode: false });
assert.deepEqual(JSON.parse(checked('admin-denied.json')), { error: 'isolated_guest_test_denied' });
assert.ok(checked('ready-dashboard.jpg').length > 1000);
console.log('CRYPTOID_HOSTED_PREVIEW_EVIDENCE ' + JSON.stringify({ sourceCommit: source, ready: true,
  nativePackageFlowsPassed: 2, deployedBuildMatchesNativeProof: true, guestOnly: true, liveResumeAndExitObserved: true,
  phoneTestReady: true, physicalDeviceAccepted: false, whiteScreenFixed: false }));
