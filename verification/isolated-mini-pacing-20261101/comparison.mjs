import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { keepBossMiniAuthoredNativePlayback, restoreBossMiniPacing } from '../boss2-mini-start-control-20261101/miniStartControl.mjs';

const blob = text => createHash('sha1').update('blob ' + Buffer.byteLength(text) + '\0').update(text).digest('hex');
export function comparisonConfig(env = process.env) {
  const condition = env.CRYPTOID_ISOLATED_MINI_PACING;
  if (condition === undefined) return null;
  assert.ok(['control', 'bypass'].includes(condition));
  assert.equal(env.CRYPTOID_LIFETIME_ATTRIBUTION, '1');
  assert.equal(env.CRYPTOID_SOAK_CONDITION, 'original');
  for (const key of Object.keys(env)) assert.ok(!/^CRYPTOID_(FLAT|BOSS_|CANVAS_|CSS_FILTER)/.test(key),
    'Isolated comparison cannot inherit earlier visual controls');
  const replica = Number(env.CRYPTOID_ISOLATED_REPLICA || 1);
  assert.ok([1, 2].includes(replica));
  const pathProof = env.CRYPTOID_ISOLATED_PATH_PROOF === '1';
  if (env.CRYPTOID_ISOLATED_PATH_PROOF !== undefined) assert.ok(['0', '1'].includes(env.CRYPTOID_ISOLATED_PATH_PROOF));
  return { condition, replica, pathProof };
}
export function comparisonCss(source, condition) {
  assert.ok(['control', 'bypass'].includes(condition));
  assert.equal(blob(source), '5d9cc3e5b40792277d9813b2953196affbc0eaf3', 'Exact original CSS pacing module');
  if (condition === 'control') return source;
  const changed = keepBossMiniAuthoredNativePlayback(source);
  assert.equal(restoreBossMiniPacing(changed), source);
  return changed;
}
export function comparisonProof(source, condition) {
  const changed = comparisonCss(source, condition);
  return { version: 1, condition, originalCssBlob: blob(source), transformedCssBlob: blob(changed),
    exactlyReversible: true, originalArtworkRetained: true,
    originalMiniMarkupAndCompletionRetained: true, allEarlierVisualControlsOff: true,
    optionalMiniStartDiscoveryTimingListenersBypassed: condition === 'bypass',
    extraMiniProgressQuantizationBypassed: condition === 'bypass',
    gameClocksChanged: false, cleanupPolicyChanged: false, nativeDeviceAccepted: false, whiteScreenFixed: false };
}
export function assertPathProof(proof, condition) {
  assert.ok(['control', 'bypass'].includes(condition));
  for (const key of ['miniStartEvents', 'miniEndEvents', 'otherTimingUpdates', 'miniQueriesTotal', 'miniQueriesAtStart', 'miniTimingUpdates'])
    assert.ok(Number.isSafeInteger(proof[key]) && proof[key] >= 0, key);
  for (const key of ['miniStartEvents', 'miniEndEvents', 'otherTimingUpdates']) assert.ok(proof[key] > 0, key);
  for (const key of ['miniQueriesAtStart', 'miniTimingUpdates'])
    condition === 'bypass' ? assert.equal(proof[key], 0, key) : assert.ok(proof[key] > 0, key);
  assert.ok(proof.miniQueriesTotal >= proof.miniQueriesAtStart);
}
