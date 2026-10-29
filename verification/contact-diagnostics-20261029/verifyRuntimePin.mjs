import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../..', import.meta.url));
// Immutable Git objects of the already deployed 68c33d1 application. This
// continuation adds verification only; shallow CI does not need that ancestor.
const pins = {
  frontend: 'e5d3ed85862fac8cea354b572939d622ce7be13c',
  api: 'ccac7cd576a079771d7d7fe4f0085492ebbe6813',
  'private-preview': 'b733d4dc70b4ac407391720eab131dbaf1d60e37',
  'verification/boss2-forensics-20261028/buildDevicePreview.mjs': '2e3b15025fc9dd721f13399bbdfbb1edd70a5efa',
};
for (const [path, sha] of Object.entries(pins)) {
  assert.equal(execFileSync('git', ['rev-parse', `HEAD:${path}`], { cwd: root, encoding: 'utf8' }).trim(), sha, path);
}
const changed = execFileSync('git', ['diff', '--name-only', '--', ...Object.keys(pins)],
  { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
// npm rewrites this repository's tracked Yarn lock while installing. Its
// committed Git object is still pinned above; disclose only this exact generated
// installation rewrite and reject any changed runtime/config/source file.
assert.deepEqual(changed.filter(path => path !== 'frontend/yarn.lock'), [], 'runtime worktree changes');
console.log('CRYPTOID_NEUTRAL_CONTACT_SCOPE ' + JSON.stringify({ passed: true,
  applicationUnchangedFrom: '68c33d15f6f591477508cc9e0497d6c8a4c100c0', pins,
  installationRewrites: changed, runtimeSourceWorktreeUnchanged: true }));
