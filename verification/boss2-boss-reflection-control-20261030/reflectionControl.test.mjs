import test from 'node:test';
import assert from 'node:assert/strict';
import { bossReflectionComparisonEnabled, bossReflectionRestored, diagnosticSceneName, flatVisualModule } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
test('reflection comparison retains original presentation components and requires the preceding isolated scene', () => {
  const keys = ['CRYPTOID_FLAT_SCENE', 'CRYPTOID_FLAT_BACKGROUND', 'CRYPTOID_ORIGINAL_BOSS', 'CRYPTOID_BOSS_WEAPON_CANVAS_OFF',
    'CRYPTOID_BOSS_REFLECTION_CONTROL', 'CRYPTOID_BOSS_REFLECTION_ON', 'CRYPTOID_BOSS_MASK_LAYERS_OFF'];
  const before = keys.map(key => process.env[key]);
  const path = name => '/repo/frontend/src/pages/' + name;
  try {
    keys.forEach(key => { process.env[key] = '1'; }); process.env.CRYPTOID_BOSS_MASK_LAYERS_OFF = '0';
    assert.equal(bossReflectionComparisonEnabled(), true); assert.equal(bossReflectionRestored(), true);
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-heat');
    for (const file of ['BossHullView.tsx', 'HullDamage.tsx', 'BossHealthView.tsx', 'FinishedEffect.tsx',
      'Starfield.tsx', 'SectorBackdrop.tsx', 'sectorBoss.ts', 'gameInput.ts', 'gameAudio.ts', 'gameLoop.ts', 'projectilePresentation.ts'])
      assert.equal(flatVisualModule(path(file)), null, file);
    const previousWeaponAlias = flatVisualModule(path('BossWeaponsView.tsx'));
    process.env.CRYPTOID_BOSS_REFLECTION_ON = '0';
    assert.equal(bossReflectionRestored(), false);
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-masks');
    assert.equal(flatVisualModule(path('BossWeaponsView.tsx')), previousWeaponAlias);
    process.env.CRYPTOID_BOSS_REFLECTION_ON = '1';
    for (const key of keys.slice(0, 5)) {
      process.env[key] = '0'; assert.equal(bossReflectionComparisonEnabled(), false, key); process.env[key] = '1';
    }
    process.env.CRYPTOID_BOSS_MASK_LAYERS_OFF = '1';
    assert.equal(bossReflectionComparisonEnabled(), false, 'legacy both-mask mode cannot be silently overridden');
  } finally {
    keys.forEach((key, i) => { if (before[i] === undefined) delete process.env[key]; else process.env[key] = before[i]; });
  }
});
