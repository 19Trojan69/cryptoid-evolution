import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const originalFinishedEffectBlob = '1f943eb9114756c4b26a66dd14f9c6883176a37c';
const normalizedSha256 = '6d4b445b25946c1888ecee055d9107607d1324f085c91da07496b07cfb91b486';
const original = '    const node = event.currentTarget;';
const guarded = original + "\n    if (node.classList.contains('hull-mini-explosion') && node.closest('.sector-boss')) return;";
export function useParentLifetimeForBossMini(source) {
  assert.equal(createHash('sha256').update(source.replace(/\r\n/g,'\n').trimEnd()).digest('hex'),normalizedSha256,
    'Exact original FinishedEffect text required (line endings/final newline normalized only)');
  assert.equal(source.split(original).length,2);
  const changed=source.replace(original,guarded);
  assert.equal(restoreBossMiniInspection(changed),source,'Only the boss mini early-completion inspection guard changes');
  return changed;
}
export function restoreBossMiniInspection(source) {
  assert.equal(source.split(guarded).length,2);
  return source.replace(guarded,original);
}
