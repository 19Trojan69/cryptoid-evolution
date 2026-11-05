import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adaptJournalBuild, adaptDirectEntry } from './transform.mjs';

const originalJournal = readFileSync(new URL('../critical-failure-journal-20261104/build.mjs', import.meta.url), 'utf8');
const originalEntry = readFileSync(new URL('../direct-boss-style-device-20261102/buildDevicePreview.mjs', import.meta.url), 'utf8')
  .replace("await import('../player-muzzle-webkit-device-20261105/build.mjs');", "await import('../critical-failure-journal-20261104/build.mjs');");

test('existing journal build selects only the previously verified local write target', () => {
  const adapted = adaptJournalBuild(originalJournal);
  assert.ok(adapted.includes("const condition = 'leaf';"));
  assert.ok(adapted.includes('originalClockRetained: true'));
  assert.ok(adapted.includes('onlyMuzzleWriterTargetChanged: true'));
  assert.ok(adapted.includes('assert.deepEqual(browserCompiled,'));
  assert.ok(adapted.includes('assert.deepEqual(appCompiled,'));
});
test('a changed journal source is refused before building', () => {
  assert.throws(() => adaptJournalBuild(originalJournal + '\n// changed source\n'), /Exact previously tested source/);
});
test('the deployment hook changes only one import and preserves its full original body', () => {
  const adapted = adaptDirectEntry(originalEntry);
  assert.equal(adapted.replace("await import('../player-muzzle-webkit-device-20261105/build.mjs');", "await import('../critical-failure-journal-20261104/build.mjs');"), originalEntry);
});
test('an unreviewed deployment entry is refused', () => {
  assert.throws(() => adaptDirectEntry(originalEntry + '\n'), /Exact previously tested source/);
});
