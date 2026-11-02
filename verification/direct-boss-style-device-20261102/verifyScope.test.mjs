import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const configPath = new URL('../../vercel.json', import.meta.url);
const scopePath = new URL('./verifyScope.mjs', import.meta.url);
const original = readFileSync(configPath), config = JSON.parse(original);
function check(text) {
  try {
    writeFileSync(configPath, text);
    const result = spawnSync(process.execPath, [scopePath.pathname], { encoding: 'utf8' });
    return result.status === 0;
  } finally { writeFileSync(configPath, original); }
}
const compact = value => JSON.stringify(value) + '\n';
test('the real guard accepts source JSON and the exact compact format observed in the hosted failure', () => {
  const restored = compact(config)
    .replace('node verification/direct-boss-style-device-20261102/buildDevicePreview.mjs', 'node verification/boss2-mini-start-control-20261101/buildMiniStartPreview.mjs')
    .replace('node verification/direct-boss-style-device-20261102/installDevicePreview.mjs', 'npm install --prefix frontend --include=optional --no-audit --no-fund');
  const bytes = Buffer.from(restored);
  assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), 'e50f042bfc5e09ece0b058a0d03013867849fda2');
  assert.equal(check(JSON.stringify(config, null, 2) + '\n'), true); assert.equal(check(compact(config)), true);
});
test('content changes fail the actual guard in both accepted whitespace formats', () => {
  for (const mutate of [c => c.git.deploymentEnabled = true,
    c => c.outputDirectory = 'frontend/dist', c => c.rewrites[0].destination = '/api/live',
    c => c.headers[0].headers[0].value = 'index, follow', c => c.framework = 'vite',
    c => c.installCommand += ' --unexpected', c => c.buildCommand += ' --clock-probe']) {
    const changed = structuredClone(config); mutate(changed);
    assert.equal(check(JSON.stringify(changed, null, 2) + '\n'), false);
    assert.equal(check(compact(changed)), false);
  }
});
test('the format exception does not allow a third arbitrary byte representation', () => {
  assert.equal(check(JSON.stringify(config)), false);
});
