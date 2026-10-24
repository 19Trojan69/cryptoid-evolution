import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { packagePreview } from './packagePreview.mjs';

assert.equal(process.env.VERCEL_ENV, 'preview', 'Private preview only');
const root = new URL('../', import.meta.url).pathname;
execFileSync(process.execPath, ['--test', 'private-preview/isolation.test.mjs'], { cwd: root, stdio: 'inherit' });
const output = resolve(process.env.CRYPTOID_PRIVATE_OUTPUT || resolve(root, 'frontend/dist'));
execFileSync('npm', ['run', 'build', '--', '--outDir', output, '--emptyOutDir'], {
  cwd: resolve(root, 'frontend'), stdio: 'inherit',
  env: { ...process.env, VITE_CRYPTOID_DIAGNOSTICS: '0', VITE_BACKEND_URL: '/api',
    CRYPTOID_TESTNET_BACKEND: 'local', CRYPTOID_PRIVATE_PREVIEW: '1' },
});
const git = ref => execFileSync('git', ['rev-parse', ref], { cwd: root, encoding: 'utf8' }).trim();
const identity = { sourceCommit: git('HEAD'), sourceTree: git('HEAD^{tree}'), appSourceTree: git('HEAD:frontend/src'),
  workingTreeDirty: execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: root, encoding: 'utf8' }).trim().length > 0 };
packagePreview(output, process.env.VERCEL_ENV, identity);
console.log('Private guest Preview packaged:', JSON.stringify(identity));
