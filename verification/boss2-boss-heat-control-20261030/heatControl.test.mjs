import test from 'node:test';
import assert from 'node:assert/strict';
import { bossHeatComparisonEnabled, bossHullHeatRestored, diagnosticSceneName, flatVisualModule } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
test('heat comparison adds no component alias and cannot override another masked-layer mode', () => {
  const keys = ['CRYPTOID_FLAT_SCENE', 'CRYPTOID_FLAT_BACKGROUND', 'CRYPTOID_ORIGINAL_BOSS', 'CRYPTOID_BOSS_WEAPON_CANVAS_OFF',
    'CRYPTOID_BOSS_HEAT_CONTROL', 'CRYPTOID_BOSS_HEAT_ON', 'CRYPTOID_BOSS_MASK_LAYERS_OFF', 'CRYPTOID_BOSS_REFLECTION_CONTROL'];
  const before = keys.map(key => process.env[key]);
  const path = name => '/repo/frontend/src/pages/' + name;
  try {
    keys.forEach(key => { process.env[key] = '1'; });
    process.env.CRYPTOID_BOSS_MASK_LAYERS_OFF = '0'; process.env.CRYPTOID_BOSS_REFLECTION_CONTROL = '0';
    assert.equal(bossHeatComparisonEnabled(), true); assert.equal(bossHullHeatRestored(), true);
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-reflection');
    for (const file of ['BossHullView.tsx', 'HullDamage.tsx', 'BossHealthView.tsx', 'FinishedEffect.tsx',
      'Starfield.tsx', 'SectorBackdrop.tsx', 'sectorBoss.ts', 'gameInput.ts', 'gameAudio.ts', 'gameLoop.ts', 'projectilePresentation.ts'])
      assert.equal(flatVisualModule(path(file)), null, file);
    const weaponAlias = flatVisualModule(path('BossWeaponsView.tsx'));
    process.env.CRYPTOID_BOSS_HEAT_ON = '0'; assert.equal(bossHullHeatRestored(), false);
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-masks');
    assert.equal(flatVisualModule(path('BossWeaponsView.tsx')), weaponAlias);
    process.env.CRYPTOID_BOSS_HEAT_ON = '1';
    for (const key of keys.slice(0, 5)) {
      process.env[key] = '0'; assert.equal(bossHeatComparisonEnabled(), false, key); process.env[key] = '1';
    }
    for (const key of keys.slice(6)) {
      process.env[key] = '1'; assert.equal(bossHeatComparisonEnabled(), false, key); process.env[key] = '0';
    }
  } finally {
    keys.forEach((key, i) => { if (before[i] === undefined) delete process.env[key]; else process.env[key] = before[i]; });
  }
});
