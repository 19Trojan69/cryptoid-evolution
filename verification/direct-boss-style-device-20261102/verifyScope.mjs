import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = new URL('../..', import.meta.url);
const pins = { frontend: '890df8a38e13ef1fe315a5c0eb109c1d72b80aab', backend: '6e93bfbac9e6cc70a1edfb8bd55d737f612ba261',
  api: 'ccac7cd576a079771d7d7fe4f0085492ebbe6813', assets: 'a9860b12db58a96dafde818d9a58a6ea0e03c5e5', 'private-preview': 'b733d4dc70b4ac407391720eab131dbaf1d60e37' };
for (const [path, sha] of Object.entries(pins)) {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD:' + path], { cwd: root, encoding: 'utf8' }).trim(), sha);
  assert.equal(execFileSync('git', ['diff', '--name-only', '--', path], { cwd: root, encoding: 'utf8' }).trim(), '');
}
const text = readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8');
const current = 'node verification/direct-boss-style-device-20261102/buildDevicePreview.mjs';
assert.equal(text.split(current).length, 2);
const install = 'node verification/direct-boss-style-device-20261102/installDevicePreview.mjs';
assert.equal(text.split(install).length, 2);
const restored = text.replace(current, 'node verification/boss2-mini-start-control-20261101/buildMiniStartPreview.mjs')
  .replace(install, 'npm install --prefix frontend --include=optional --no-audit --no-fund');
const sha = createHash('sha1').update('blob ' + Buffer.byteLength(restored) + '\0').update(restored).digest('hex');
assert.equal(sha, 'e94775c2f8a435f2dcb46b65fafd34e67abdc640', 'Only the two declared Preview install/build-command replacements');
assert.equal(JSON.parse(text).git.deploymentEnabled, false);
console.log('CRYPTOID_DIRECT_STYLE_DEVICE_SCOPE ' + JSON.stringify({ passed: true, originalRuntimeTreesUnchanged: true, automaticDeployment: false }));
