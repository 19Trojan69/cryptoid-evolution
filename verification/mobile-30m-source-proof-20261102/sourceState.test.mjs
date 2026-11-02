import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { readSourceState } from './sourceState.mjs';

function fixture(run) {
  const root = mkdtempSync(resolve(tmpdir(), 'cryptoid-source-guard-'));
  const git = args => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  try {
    git(['init', '-q']);
    for (const path of ['frontend', 'verification/boss2-forensics-20261028']) {
      mkdirSync(resolve(root, path), { recursive: true });
      writeFileSync(resolve(root, path, 'package.json'), JSON.stringify({ name: path.split('/').at(-1) }));
    }
    writeFileSync(resolve(root, 'frontend/runtime.ts'), 'unchanged');
    git(['add', '.']); git(['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture']);
    for (const path of ['frontend', 'verification/boss2-forensics-20261028']) writeFileSync(resolve(root, path, 'package-lock.json'),
      JSON.stringify({ name: path.split('/').at(-1), lockfileVersion: 3, packages: { '': {} } }));
    run(root, git);
  } finally { rmSync(root, { recursive: true, force: true }); }
}
test('accepts and fingerprints exactly the two lockfiles observed in the failed CI', () => fixture(root => {
  const rows = readSourceState(root); assert.equal(rows.length, 2);
  assert.ok(rows.every(r => /^[a-f0-9]{64}$/.test(r.sha256)));
}));
test('rejects an unstaged runtime edit', () => fixture(root => {
  writeFileSync(resolve(root, 'frontend/runtime.ts'), 'changed'); assert.throws(() => readSourceState(root), /No tracked change/);
}));
test('rejects a staged runtime edit', () => fixture((root, git) => {
  writeFileSync(resolve(root, 'frontend/runtime.ts'), 'changed'); git(['add', 'frontend/runtime.ts']);
  assert.throws(() => readSourceState(root), /No tracked change/);
}));
test('rejects any extra untracked runtime file', () => fixture(root => {
  writeFileSync(resolve(root, 'frontend/injected.ts'), 'changed'); assert.throws(() => readSourceState(root), /Only the two/);
}));
test('rejects a missing lockfile rather than silently changing the declared build state', () => fixture(root => {
  rmSync(resolve(root, 'frontend/package-lock.json')); assert.throws(() => readSourceState(root), /Only the two/);
}));
test('rejects unrelated content at an accepted filename', () => fixture(root => {
  writeFileSync(resolve(root, 'frontend/package-lock.json'), JSON.stringify({ name: 'wrong', lockfileVersion: 3, packages: { '': {} } }));
  assert.throws(() => readSourceState(root));
}));
