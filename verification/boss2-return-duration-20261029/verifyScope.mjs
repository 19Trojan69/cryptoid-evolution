import '../device-return-evidence-20261029/verifyScope.mjs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../..', import.meta.url));
const paths = ['api', 'private-preview', ...['buildDevicePreview.mjs', 'devicePreviewApp.jsx',
  'deviceReturnEvidence.mjs', 'devicePreviewAuth.mjs', 'devicePreviewTransform.mjs',
  'devicePreviewTransport.mjs', 'devicePreviewWarmup.mjs', 'devicePreview.css', 'fixture.mjs']
  .map(name => 'verification/boss2-forensics-20261028/' + name)];
const entries = execFileSync('git', ['ls-tree', '-r', 'HEAD', ...paths], { cwd: root });
assert.equal(createHash('sha256').update(entries).digest('hex'),
  '47d4ae20cdca984b121a3fe31aecb55bfe26ee06c2abee7ca6218df923cb0d5b', 'complete unchanged private runtime inputs');
assert.equal(execFileSync('git', ['diff', '--name-only', '--', ...paths], { cwd: root, encoding: 'utf8' }).trim(), '');
console.log('CRYPTOID_DURATION_SCOPE ' + JSON.stringify({ passed: true, privateRuntimeEntries: 24,
  gameplayAndInputUnchanged: true, deployedApplicationRuntimePreserved: true, noDeployment: true }));
