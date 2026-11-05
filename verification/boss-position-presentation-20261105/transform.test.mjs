import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transform, restore } from './transform.mjs';
const source = readFileSync(new URL('../../frontend/src/pages/BossHullView.tsx', import.meta.url), 'utf8');
test('only the two position declarations change and restore byte for byte', () => {
  const changed = transform(source);
  assert.equal(restore(changed), source);
  assert.equal((changed.match(/\.\.\.bossPositionStyle\(/g) || []).length, 2);
});
test('a different boss implementation is rejected before transformation', () => {
  assert.throws(() => transform(source + '\n'));
});
