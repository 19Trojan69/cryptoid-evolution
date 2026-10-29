import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../..', import.meta.url));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const digest = text => createHash('sha256').update(text).digest('hex');
const allowed = {
  'frontend/src/pages/contactDiagnostics.ts': 'f8f281e50ba7d271f5a0de4533e6080ef11992da',
  'frontend/src/pages/contactDiagnostics.test.mjs': '51c963a6feb063724cde21157c99a4af56bb32f5',
};
const source = readFileSync(new URL('../../frontend/src/pages/contactDiagnostics.ts', import.meta.url), 'utf8');
const hunk = "      // Captured element blur is not a Window focus loss.\n      if (type === 'blur' && event.target !== win) return;\n";
assert.equal(source.split(hunk).length, 2, 'one exact diagnostic target filter');
assert.equal(digest(source.replace(hunk, '')), '1a7cca2fae66d8167e82b6414dcf14d31d6315e558fa99e115c495cb7e9ea490');
const seen = new Set();
const normalized = git(['ls-tree', '-r', 'HEAD', 'frontend']).split('\n').map(line => {
  const [entry, path] = line.split('\t');
  if (!(path in allowed)) return line;
  seen.add(path); return entry.replace(/[a-f0-9]{40}$/, allowed[path]) + '\t' + path;
}).join('\n') + '\n';
assert.equal(seen.size, 2);
assert.equal(digest(normalized), '23bafdfdab49a378ea7764887a8fcd7455d7632e32a8b010c94feab11b6dac25', 'complete reviewed frontend inventory');
const pins = {
  api: 'ccac7cd576a079771d7d7fe4f0085492ebbe6813',
  'private-preview': 'b733d4dc70b4ac407391720eab131dbaf1d60e37',
  'verification/boss2-forensics-20261028/buildDevicePreview.mjs': '2e3b15025fc9dd721f13399bbdfbb1edd70a5efa',
};
for (const [path, sha] of Object.entries(pins)) assert.equal(git(['rev-parse', `HEAD:${path}`]), sha, path);
const dirty = git(['diff', '--name-only', '--', 'frontend', ...Object.keys(pins)]).split('\n').filter(Boolean);
assert.deepEqual(dirty.filter(path => path !== 'frontend/yarn.lock'), [], 'tracked runtime worktree');
console.log('CRYPTOID_WINDOW_FOCUS_SCOPE ' + JSON.stringify({ passed: true, exactDiagnosticHunks: 1,
  gameControllerAndSingleFingerControlsUnchanged: true, installationRewrites: dirty, frontendInventoryChecked: true }));
