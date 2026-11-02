import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const expected = ['frontend/package-lock.json', 'verification/boss2-forensics-20261028/package-lock.json'];
export function readSourceState(root) {
  // Compare against HEAD, including staged edits. Never normalize runtime edits.
  assert.equal(execFileSync('git', ['diff', '--name-only', 'HEAD', '--'], { cwd: root, encoding: 'utf8' }).trim(), '', 'No tracked change anywhere');
  const status = execFileSync('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'], { cwd: root, encoding: 'utf8' });
  const rows = status.split('\0').filter(Boolean);
  assert.ok(rows.every(r => r.startsWith('?? ')), 'Only newly generated files are allowed');
  assert.deepEqual(rows.map(r => r.slice(3)).sort(), [...expected].sort(), 'Only the two observed npm lockfiles are allowed');
  return expected.map(path => {
    const bytes = readFileSync(resolve(root, path));
    const lock = JSON.parse(bytes), pkg = JSON.parse(readFileSync(resolve(root, dirname(path), 'package.json')));
    assert.equal(lock.name, pkg.name); assert.equal(lock.lockfileVersion, 3); assert.ok(lock.packages?.['']);
    return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  });
}
