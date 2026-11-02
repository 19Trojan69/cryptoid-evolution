import assert from 'node:assert/strict';

export function styleProbeConfig(env = process.env) {
  if (env.CRYPTOID_STYLE_WRITE_PROBE === undefined) return false;
  assert.ok(['0', '1'].includes(env.CRYPTOID_STYLE_WRITE_PROBE));
  if (env.CRYPTOID_STYLE_WRITE_PROBE === '0') return false;
  assert.equal(env.CRYPTOID_ATTRIBUTION_SECONDS, '60', 'Style API wrappers are short observation only');
  assert.equal(env.CRYPTOID_LIFETIME_ATTRIBUTION, '1'); assert.equal(env.CRYPTOID_SOAK_CONDITION, 'original');
  assert.notEqual(env.CRYPTOID_INACTIVE_NATIVE_TRACE, '1');
  assert.equal(env.CRYPTOID_THRUST_SCOPE, undefined);
  for (const key of Object.keys(env)) assert.ok(!/^CRYPTOID_(ISOLATED_|FLAT|BOSS_|CANVAS_|CSS_FILTER)/.test(key),
    'Style observation cannot inherit another treatment');
  return true;
}

export function assertStyleProof(proof) {
  for (const key of ['started', 'shortApiObservationOnly', 'priorArgumentOnly',
    'ownerClassReadOnFirstObservedStyleAccess', 'weakStyleKeysWithPrimitiveLabels',
    'setPropertyRestored', 'styleGettersRestored']) assert.equal(proof[key], true, key);
  for (const key of ['appliedOrComputedStyleValuesMeasured', 'extraStyleValueReads', 'extraDomScans',
    'newTimersOrFrames', 'elementListsRetained']) assert.equal(proof[key], false, key);
  for (const key of ['faults', 'overflow', 'failedCalls']) assert.equal(proof[key], 0, key);
  assert.ok(Array.isArray(proof.groups) && proof.groups.length > 0 && proof.groups.length <= 512);
  for (const row of proof.groups) {
    assert.match(row.property, /^--/); assert.equal(typeof row.owner, 'string');
    for (const key of ['calls', 'firstObservedArgument', 'matchingPreviousArgument',
      'differentPreviousArgument', 'unclassifiedArgument']) assert.ok(Number.isSafeInteger(row[key]) && row[key] >= 0);
    assert.equal(row.calls, row.firstObservedArgument + row.matchingPreviousArgument
      + row.differentPreviousArgument + row.unclassifiedArgument);
  }
  assert.ok(proof.groups.some(row => row.owner.includes('player-ship') && row.calls > 0), 'Positive original ship path');
  assert.ok(proof.groups.some(row => row.owner.includes('boss-special-weapon') && row.calls > 0), 'Positive original SVG path');
}
