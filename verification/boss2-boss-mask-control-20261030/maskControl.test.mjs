import test from 'node:test';
import assert from 'node:assert/strict';
import { bossMaskedLayersHidden, diagnosticSceneName, flatVisualModule } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
test('masked-layer identity requires every preceding visual control and adds no component alias', () => {
  const keys = ['CRYPTOID_FLAT_SCENE', 'CRYPTOID_FLAT_BACKGROUND', 'CRYPTOID_ORIGINAL_BOSS', 'CRYPTOID_BOSS_WEAPON_CANVAS_OFF', 'CRYPTOID_BOSS_MASK_LAYERS_OFF'];
  const before = keys.map(key => process.env[key]);
  const path = name => '/repo/frontend/src/pages/' + name;
  try {
    keys.forEach(key => { process.env[key] = '1'; });
    assert.equal(bossMaskedLayersHidden(), true);
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-masks');
    for (const file of ['BossHullView.tsx', 'HullDamage.tsx', 'BossHealthView.tsx', 'FinishedEffect.tsx',
      'Starfield.tsx', 'SectorBackdrop.tsx', 'sectorBoss.ts', 'gameInput.ts', 'gameAudio.ts', 'gameLoop.ts', 'projectilePresentation.ts'])
      assert.equal(flatVisualModule(path(file)), null, file);
    const precedingWeaponAlias = flatVisualModule(path('BossWeaponsView.tsx'));
    process.env.CRYPTOID_BOSS_MASK_LAYERS_OFF = '0';
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas');
    assert.equal(flatVisualModule(path('BossWeaponsView.tsx')), precedingWeaponAlias);
    process.env.CRYPTOID_BOSS_MASK_LAYERS_OFF = '1';
    for (const key of keys) {
      process.env[key] = '0'; assert.equal(bossMaskedLayersHidden(), false, key); process.env[key] = '1';
    }
  } finally {
    keys.forEach((key, i) => { if (before[i] === undefined) delete process.env[key]; else process.env[key] = before[i]; });
  }
});
