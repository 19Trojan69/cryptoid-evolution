import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transformController, proof, ORIGINAL_CALL, LOCAL_CALL, HELPER } from './transform.mjs';
const source = readFileSync(new URL('../../frontend/src/pages/GamePage.tsx', import.meta.url), 'utf8');
test('exact original and diagnostic controller restore completely after one writer relocation', () => {
  assert.equal(transformController(source, source, 'control'), source);
  const diagnostic = '// QA-only prefix\n' + source;
  const changed = transformController(diagnostic, source, 'leaf');
  assert.equal(changed.slice(HELPER.length).replace(LOCAL_CALL, ORIGINAL_CALL), diagnostic);
  assert.equal(proof(diagnostic, source, 'leaf').newTimers, false);
});
test('changed source, missing writer and unknown condition are rejected', () => {
  assert.throws(() => transformController(source, source + '\n', 'leaf'));
  assert.throws(() => transformController(source.replace(ORIGINAL_CALL, ''), source, 'leaf'));
  assert.throws(() => transformController(source, source, 'other'));
});
