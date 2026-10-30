import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canvasEffectControl, canvasEffectControlEnabled } from './canvasControl.mjs';
const path = process.env.CRYPTOID_CANVAS_SOURCE || new URL('../../frontend/src/pages/CanvasEffects.tsx', import.meta.url);
test('only the original Canvas availability branch is changed; the complete source restores exactly', () => {
  const original = readFileSync(path, 'utf8'), changed = canvasEffectControl(original);
  assert.equal(changed.replace('\n  enabled=false; // Private diagnostic: use the existing original-effect fallback.', ''), original);
  assert.ok(changed.includes('return available?null:<>{original}</>;'));
  assert.ok(changed.includes('if(!enabled)return;'));
});
test('an unreviewed renderer is rejected rather than partially patched', () => {
  const original = readFileSync(path, 'utf8');
  assert.throws(() => canvasEffectControl(original.replace('if(!enabled)return;', 'if(!enabled)return null;')));
});
test('the graphics control is explicit and can be disabled for the CI comparison', () => {
  const previous = process.env.CRYPTOID_CANVAS_EFFECT_CONTROL;
  try {
    delete process.env.CRYPTOID_CANVAS_EFFECT_CONTROL; assert.equal(canvasEffectControlEnabled(), false);
    process.env.CRYPTOID_CANVAS_EFFECT_CONTROL = '0'; assert.equal(canvasEffectControlEnabled(), false);
    process.env.CRYPTOID_CANVAS_EFFECT_CONTROL = '1'; assert.equal(canvasEffectControlEnabled(), true);
  } finally { if (previous === undefined) delete process.env.CRYPTOID_CANVAS_EFFECT_CONTROL; else process.env.CRYPTOID_CANVAS_EFFECT_CONTROL = previous; }
});
