import assert from 'node:assert/strict';
export { rendererPss, requireActivePressureState } from '../active-pressure-attribution-20261102/policy.mjs';
import { rendererPss } from '../active-pressure-attribution-20261102/policy.mjs';

export const limits = Object.freeze({ events: 128, rawBytes: 32 * 1024 * 1024, traceBufferKiB: 16384, globalTypes: 4096 });
export function detailPlan(env = process.env) {
  const mode = env.CRYPTOID_ACTIVE_BLINK_DETAIL_MODE;
  assert.ok(['calibration', 'pressure'].includes(mode), 'Explicit active detail mode');
  assert.equal(env.CRYPTOID_SOAK_CONDITION, 'original'); assert.equal(env.CRYPTOID_LIFETIME_ATTRIBUTION, '1');
  const allowed = new Set(['CRYPTOID_ACTIVE_BLINK_DETAIL_MODE', 'CRYPTOID_BLINK_DETAIL_REPLICA',
    'CRYPTOID_SOAK_CONDITION', 'CRYPTOID_LIFETIME_ATTRIBUTION']);
  for (const key of Object.keys(env)) if (key.startsWith('CRYPTOID_'))
    assert.ok(allowed.has(key), 'Do not combine this detail diagnostic with other treatments');
  const replica = Number(env.CRYPTOID_BLINK_DETAIL_REPLICA || '1'); assert.ok([1, 2].includes(replica));
  return { mode, replica, metric: 'chromium-renderer-pss', levelOfDetail: 'detailed', deterministic: false,
    triggerKiB: mode === 'pressure' ? 832 * 1024 : 0,
    qualificationKiB: mode === 'pressure' ? 768 * 1024 : 0,
    minActiveMs: 60000, maxActiveMs: mode === 'pressure' ? 1200000 : 60000 };
}
export function requireDetailTrigger(trigger) {
  assert.ok(['calibration', 'pressure'].includes(trigger.mode)); assert.equal(trigger.metric, 'chromium-renderer-pss');
  assert.equal(trigger.triggerKiB, trigger.mode === 'pressure' ? 832 * 1024 : 0);
  assert.equal(trigger.qualificationKiB, trigger.mode === 'pressure' ? 768 * 1024 : 0);
  assert.ok(Number.isFinite(trigger.activeMs) && trigger.activeMs >= 60000
    && trigger.activeMs <= (trigger.mode === 'pressure' ? 1200000 : 60000) + 5000);
  assert.ok(rendererPss(trigger.memory) >= trigger.triggerKiB, 'Observed trigger includes the declared pressure reserve');
}
