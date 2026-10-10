import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tintShipPixels } from './shipTint.ts';
import { namedShipAccent, namedShipColor } from './shipIdentityColor.ts';
test('named defaults and identity accents remain while the metal hull changes', () => {
  assert.equal(namedShipColor(9), 'metallic-red'); assert.equal(namedShipColor(4), 'gold');
  for (const sprite of [4,9,7,17]) {
    const accent = namedShipAccent(sprite);
    const source = new Uint8ClampedArray([...accent,255, 130,130,130,255, 10,20,70,255]);
    tintShipPixels(source,[100,110,120],accent);
    const original = [...source.slice(0,3)];
    const another = new Uint8ClampedArray([...accent,255, 130,130,130,255, 10,20,70,255]);
    tintShipPixels(another,[190,195,200],accent);
    assert.deepEqual([...another.slice(0,3)],original);
    assert.notDeepEqual([...another.slice(4,7)],[...source.slice(4,7)]);
    assert.deepEqual([...source.slice(8,12)],[10,20,70,255]);
  }
});
