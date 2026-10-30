import test from 'node:test';
import assert from 'node:assert/strict';
import { bossHullHeatUnmasked, diagnosticSceneName, flatVisualModule } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
test('unmasked identity requires every original heat-only gate and leaves all presentation modules intact', () => {
  const env = {
    CRYPTOID_FLAT_SCENE: '1', CRYPTOID_FLAT_BACKGROUND: '1', CRYPTOID_ORIGINAL_BOSS: '1',
    CRYPTOID_BOSS_WEAPON_CANVAS_OFF: '1', CRYPTOID_BOSS_MASK_LAYERS_OFF: '0',
    CRYPTOID_BOSS_REFLECTION_CONTROL: '0', CRYPTOID_BOSS_HEAT_CONTROL: '1',
    CRYPTOID_BOSS_HEAT_ON: '1', CRYPTOID_BOSS_HEAT_UNMASKED: '1',
  };
  const before = { ...process.env };
  try {
    Object.assign(process.env, env);
    assert.equal(bossHullHeatUnmasked(), true);
    assert.ok(diagnosticSceneName().endsWith('-hidden-hull-reflection-unmasked-hull-heat'));
    for (const name of ['HullDamage.tsx', 'BossHullView.tsx', 'BossHealthView.tsx', 'FinishedEffect.tsx',
      'hullFires.ts', 'sectorBoss.ts', 'gameInput.ts', 'gameAudio.ts', 'gameLoop.ts'])
      assert.equal(flatVisualModule('/repo/frontend/src/pages/' + name), null, name);
    for (const [key, value] of Object.entries(env)) {
      process.env[key] = value === '1' ? '0' : '1';
      assert.equal(bossHullHeatUnmasked(), false, key);
      process.env[key] = value;
    }
    process.env.CRYPTOID_BOSS_HEAT_UNMASKED = '0';
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-reflection');
  } finally {
    for (const key of Object.keys(env)) {
      if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key];
    }
  }
});
