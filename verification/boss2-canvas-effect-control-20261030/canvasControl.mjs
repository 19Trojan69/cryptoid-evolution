import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const CANVAS_EFFECT_SOURCE_BLOB = '73e6239d7d6be8a886279bcd38d6cd230e9834af';
export const canvasEffectControlEnabled = () => process.env.CRYPTOID_CANVAS_EFFECT_CONTROL === '1';
export function canvasEffectControl(source) {
  const bytes = Buffer.from(source);
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),
    CANVAS_EFFECT_SOURCE_BLOB, 'Exact unchanged CanvasEffects source');
  const anchor = 'export function CanvasEffectLayer({children,enabled}:{children:React.ReactNode;enabled:boolean}){';
  assert.equal(source.split(anchor).length, 2);
  // Exercise the existing unavailable-Canvas branch. Provider, original child
  // effects and their lifetime remain intact. The original 2D setup does not run.
  const addition = '\n  enabled=false; // Private diagnostic: use the existing original-effect fallback.';
  const changed = source.replace(anchor, anchor + addition);
  assert.equal(changed.replace(addition, ''), source);
  return changed;
}
