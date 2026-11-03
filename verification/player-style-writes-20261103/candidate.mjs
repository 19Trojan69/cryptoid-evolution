import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const sourceBlob = 'd73579b3f9abe575adacfa978259aec9bdb0e7fd';
export const properties = ['--flame-length', '--visual-bank', '--hull-light', '--muzzle-light'];

// Read the live inline declaration, so remounts, React writes and other owners
// cannot make a saved last-written value stale. Priority is part of the value:
// the original setProperty call also clears an existing !important flag.
export function setChangedPlayerProperty(style, name, value) {
  if (style.getPropertyValue(name) !== value || style.getPropertyPriority(name) !== '') {
    style.setProperty(name, value);
    return true;
  }
  return false;
}

const helper = `function setChangedPlayerProperty(style: CSSStyleDeclaration, name: string, value: string) {
  if (style.getPropertyValue(name) !== value || style.getPropertyPriority(name) !== '') style.setProperty(name, value);
}\n`;

export function transformPlayerStyles(source) {
  const bytes = Buffer.from(source);
  const blob = createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + bytes.length + '\0'), bytes])).digest('hex');
  assert.equal(blob, sourceBlob, 'Only the exact frozen controller is eligible');
  let changed = source;
  const pairs = [];
  for (const name of properties) {
    const before = 'playerShipRef.current?.style.setProperty("' + name + '", ';
    const after = 'playerShipRef.current && setChangedPlayerProperty(playerShipRef.current.style, "' + name + '", ';
    assert.equal(source.split(before).length, 2, 'One exact property call: ' + name);
    changed = changed.replace(before, after);
    pairs.push([before, after]);
  }
  changed = helper + changed;
  let restored = changed.slice(helper.length);
  for (const [before, after] of pairs) restored = restored.replace(after, before);
  assert.equal(restored, source, 'No formula, movement, input, time, audio, markup or other code changes');
  return changed;
}
