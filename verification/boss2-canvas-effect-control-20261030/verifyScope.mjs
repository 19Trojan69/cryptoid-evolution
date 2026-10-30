import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const root = new URL('../..', import.meta.url);
const pins = { frontend: '890df8a38e13ef1fe315a5c0eb109c1d72b80aab', backend: '6e93bfbac9e6cc70a1edfb8bd55d737f612ba261',
  api: 'ccac7cd576a079771d7d7fe4f0085492ebbe6813', assets: 'a9860b12db58a96dafde818d9a58a6ea0e03c5e5',
  'private-preview': 'b733d4dc70b4ac407391720eab131dbaf1d60e37' };
for (const [path, sha] of Object.entries(pins)) {
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD:' + path], { cwd: root, encoding: 'utf8' }).trim(), sha, path);
  assert.equal(execFileSync('git', ['diff', '--name-only', '--', path], { cwd: root, encoding: 'utf8' }).trim(), '', path);
}
const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
assert.equal(config.git.deploymentEnabled, false);
assert.equal(config.buildCommand, 'node verification/boss2-canvas-effect-control-20261030/buildCanvasPreview.mjs');
console.log('CRYPTOID_CANVAS_SCOPE ' + JSON.stringify({ passed: true, frontendSourceTreeUnchanged: true, inputAudioSimulationUnchanged: true }));
