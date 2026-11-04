import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { transform, proof } from './transform.mjs';
const source = readFileSync(new URL('../../frontend/src/pages/projectilePresentation.ts', import.meta.url), 'utf8');
test('the full pinned source reverses and the control is byte-identical', () => {
  assert.equal(transform(source, 'control'), source);
  assert.notEqual(transform(source, 'pool'), source);
  assert.equal(proof(source, 'pool').originalRestoredExactly, true);
});
test('changed source or an unknown treatment is rejected', () => {
  assert.throws(() => transform(source + '\n', 'pool'));
  assert.throws(() => transform(source, 'unknown'));
});
