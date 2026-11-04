import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const ORIGINAL_SHA256 = 'deb3c488892c3096b5086b35ab3141aa1e1c5f7cd34f2e8a1ae714ef9ebd96db';
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const edits = [
  ['  let revision = 0;', '  const pools: Entry[][] = [[], []];\n  let revision = 0;'],
  [`      const node = document.createElement('div');
      node.style.left = '0px'; node.style.top = '0px';
      entry = { node, position: '', appearance: null, seen: revision };
      cache.set(shot.id, entry); groups[group].appendChild(node);`,
   `      entry = pools[group].pop();
      if (!entry) {
        const node = document.createElement('div');
        node.style.left = '0px'; node.style.top = '0px';
        entry = { node, position: '', appearance: null, seen: revision };
      }
      cache.set(shot.id, entry); groups[group].appendChild(entry.node);`],
  [`      for (const shot of state.shots) place(0, shot);
      for (const shot of state.enemyShots) place(1, shot);
      for (const cache of entries) for (const [id, entry] of cache) if (entry.seen !== revision) {
        entry.node.remove(); cache.delete(id);
      }`,
   `      // Retire before placement so a completed shot can supply this same tick.
      // Mark surviving IDs without allocating a per-frame Set or changing state.
      for (const shot of state.shots) { const entry = entries[0].get(shot.id); if (entry) entry.seen = revision; }
      for (const shot of state.enemyShots) { const entry = entries[1].get(shot.id); if (entry) entry.seen = revision; }
      for (let group = 0; group < entries.length; group++) {
        const cache = entries[group];
        for (const [id, entry] of cache) if (entry.seen !== revision) {
          entry.node.remove(); cache.delete(id);
          if (pools[group].length < 32) pools[group].push(entry);
        }
      }
      for (const shot of state.shots) place(0, shot);
      for (const shot of state.enemyShots) place(1, shot);`],
  ['      for (const cache of entries) cache.clear();',
   '      for (const cache of entries) cache.clear();\n      for (const pool of pools) pool.length = 0;'],
];
export function transform(source, condition) {
  assert.equal(digest(source), ORIGINAL_SHA256, 'Only the pinned original projectile module is accepted');
  assert.ok(['control', 'pool'].includes(condition));
  if (condition === 'control') return source;
  let next = source;
  for (const [before, after] of edits) {
    assert.equal(next.split(before).length, 2, 'Exactly one original hunk');
    next = next.replace(before, after);
  }
  let restored = next;
  for (const [before, after] of [...edits].reverse()) restored = restored.replace(after, before);
  assert.equal(restored, source, 'Whole module restores exactly');
  return next;
}
export function proof(source, condition) {
  const next = transform(source, condition);
  return { condition, originalSha256: digest(source), transformedSha256: digest(next),
    poolLimitPerGroup: condition === 'pool' ? 32 : 0, groupCount: 2,
    originalRestoredExactly: true, simulationChanged: false, cssChanged: false,
    extraTimers: false, extraFrames: false, physicalDevice: false, whiteScreenFixed: false };
}
