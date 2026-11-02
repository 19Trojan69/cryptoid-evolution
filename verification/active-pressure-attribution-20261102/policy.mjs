import assert from 'node:assert/strict';
export function pressurePlan(env = process.env) {
  const mode = env.CRYPTOID_ACTIVE_PRESSURE_MODE;
  assert.ok(['calibration', 'pressure'].includes(mode), 'Explicit diagnostic mode');
  assert.equal(env.CRYPTOID_SOAK_CONDITION, 'original'); assert.equal(env.CRYPTOID_LIFETIME_ATTRIBUTION, '1');
  for (const key of Object.keys(env)) assert.ok(!/^CRYPTOID_(THRUST_|ISOLATED_|STYLE_WRITE|FLAT|BOSS_|CANVAS_|CSS_FILTER|INACTIVE_NATIVE_TRACE)/.test(key),
    'Pressure attribution retains the full original scene without other treatments');
  const replica = Number(env.CRYPTOID_PRESSURE_REPLICA || '1'); assert.ok([1, 2].includes(replica));
  return { mode, replica, metric: 'chromium-renderer-pss', thresholdKiB: mode === 'pressure' ? 768 * 1024 : 0,
    minActiveMs: 60000, maxActiveMs: mode === 'pressure' ? 1200000 : 60000 };
}
export function rendererPss(memory) {
  assert.equal(memory.available, true); assert.equal(memory.contentProcessObserved, true);
  const rows = memory.processes.filter(row => row.role === 'chromium-renderer'); assert.ok(rows.length);
  for (const row of rows) assert.ok(Number.isSafeInteger(row.pssKiB) && row.pssKiB >= 0);
  return rows.reduce((sum, row) => sum + row.pssKiB, 0);
}
export function requireActivePressureState(row, first, source) {
  assert.equal(row.timeOrigin, first.timeOrigin); assert.equal(row.hidden, false); assert.equal(row.mounted, true);
  assert.equal(row.scene?.status, 'playing'); assert.equal(row.scene.technicalPause, false);
  assert.equal(row.scene.encounter, 'boss-fight'); assert.equal(row.scene.sector, 20); assert.equal(row.scene.reactorOpen, true);
  assert.equal(row.scene.ownerDiagnostics, false);
  assert.deepEqual(row.scene.buildFlags, { development: false, production: true });
  assert.equal(row.clock.latest.id, first.clock.latest.id); assert.equal(row.clock.latest.source, source);
  assert.equal(row.clock.latest.mode, 'running'); assert.equal(row.clock.latest.unobservedGaps, 0);
  assert.ok(Number.isFinite(row.now) && Number.isFinite(row.scene.frameAt));
  assert.ok(row.now - row.scene.frameAt >= -50 && row.now - row.scene.frameAt <= 2500, 'Fresh real game frame');
}
export function requirePressureTrigger(trigger) {
  assert.ok(['calibration', 'pressure'].includes(trigger.mode));
  assert.equal(trigger.metric, 'chromium-renderer-pss');
  assert.equal(trigger.thresholdKiB, trigger.mode === 'pressure' ? 768 * 1024 : 0);
  assert.ok(trigger.activeMs >= 60000 && Number.isFinite(trigger.activeMs));
  assert.ok(rendererPss(trigger.memory) >= trigger.thresholdKiB, 'Observed renderer PSS must meet the declared threshold');
}
