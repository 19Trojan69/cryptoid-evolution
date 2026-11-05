import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const BASE_DEVICE_COMMIT = 'b092f6462a623c3ad2c12e634963028d462c5fcf';
export const digest = value => createHash('sha256').update(value).digest('hex');
export const gitBlob = value => createHash('sha1').update('blob ' + Buffer.byteLength(value) + '\0').update(value).digest('hex');
function adapt(original, pin, pairs) {
  assert.equal(gitBlob(original), pin, 'Exact previously tested source required');
  let changed = original;
  for (const [before, after] of pairs) {
    assert.equal(changed.split(before).length, 2, 'One declared adaptation: ' + before);
    changed = changed.replace(before, after);
  }
  let restored = changed;
  for (const [before, after] of [...pairs].reverse()) {
    assert.equal(restored.split(after).length, 2);
    restored = restored.replace(after, before);
  }
  assert.equal(restored, original, 'Complete original source restores exactly');
  return changed;
}

export function adaptJournalBuild(original) {
  return adapt(original, 'abd1f9c221d9ce3cc68c04cfe8d44815631258a5', [
    ["const condition = 'control';", "const condition = 'leaf';"],
    ["assert.equal(info.playerMuzzleLocalCandidate.condition, 'control');", "assert.equal(info.playerMuzzleLocalCandidate.condition, 'leaf');"],
    ['originalGameControllerAndClockRetained: true,',
      'originalGameControllerAndClockRetained: false, originalClockRetained: true, onlyMuzzleWriterTargetChanged: true,'],
  ]);
}

export function adaptDirectEntry(original) {
  return adapt(original, '60db114eb8cf414fec0fe0986030b03045634ee5', [[
    "await import('../critical-failure-journal-20261104/build.mjs');",
    "await import('../player-muzzle-webkit-device-20261105/build.mjs');",
  ]]);
}
