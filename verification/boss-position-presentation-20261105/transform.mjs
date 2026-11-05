import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const originalBlob = '68dd74e598caa060ae8825d3c56b199ba0d08449';
const prefix = 'import { positionStyle as bossPositionStyle } from ' +
  JSON.stringify(pathToFileURL(new URL('./position.mjs', import.meta.url).pathname).href) + ';\n';
const hunks = [
  ['        left: fall.x,\n        top: fall.y,', '        ...bossPositionStyle(fall.x, fall.y),'],
  ['        left: model.x,\n        top: model.y,', '        ...bossPositionStyle(model.x, model.y),'],
];
export function transform(source) {
  const bytes = Buffer.from(source);
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), originalBlob);
  let changed = source;
  for (const [before, after] of hunks) {
    assert.equal(changed.split(before).length, 2);
    changed = changed.replace(before, after);
  }
  changed = prefix + changed;
  assert.equal(restore(changed), source);
  return changed;
}
export function restore(source) {
  assert.ok(source.startsWith(prefix));
  let restored = source.slice(prefix.length);
  for (const [before, after] of hunks) {
    assert.equal(restored.split(after).length, 2);
    restored = restored.replace(after, before);
  }
  return restored;
}
