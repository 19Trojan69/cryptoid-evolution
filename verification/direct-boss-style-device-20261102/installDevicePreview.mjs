import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Isolated guest Preview installation only');
const options = process.argv.slice(2);
assert.ok(options.every(option => ['--offline', '--ignore-scripts'].includes(option)));
const root = resolve(new URL('../..', import.meta.url).pathname);
const scope = root + '/verification/direct-boss-style-device-20261102/verifyScope.mjs';
const verify = () => execFileSync(process.execPath, [scope], { cwd: root, stdio: 'inherit' });
// Reject modified runtime sources before installation; never hide pre-existing edits.
verify();
const lockPath = root + '/frontend/yarn.lock', originalLock = readFileSync(lockPath);
let result;
try {
  result = spawnSync('npm', ['install', '--prefix', 'frontend', '--include=optional',
    '--no-audit', '--no-fund', ...options], { cwd: root, stdio: 'inherit' });
} finally {
  // npm also rewrites Yarn metadata with --no-save. Restore only the one
  // verified, snapshotted file; every other tracked change still fails scope.
  writeFileSync(lockPath, originalLock);
}
verify();
assert.equal(result.status, 0, 'Preview dependency installation must succeed');
console.log('CRYPTOID_DIRECT_STYLE_DEVICE_INSTALL ' + JSON.stringify({ originalRuntimeTreesUnchanged: true,
  originalYarnLockRestored: true, projectEnvironmentChanged: false }));
