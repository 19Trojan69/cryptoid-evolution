import test from 'node:test';
import assert from 'node:assert/strict';
import { bossWeaponCanvasDisabled, diagnosticSceneName, flatVisualModule } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
test('weapon component exclusion requires the original-boss condition and cannot alias simulation modules', () => {
  const keys = ['CRYPTOID_FLAT_SCENE', 'CRYPTOID_FLAT_BACKGROUND', 'CRYPTOID_ORIGINAL_BOSS', 'CRYPTOID_BOSS_WEAPON_CANVAS_OFF'];
  const before = keys.map(key => process.env[key]);
  const path = name => '/repo/frontend/src/pages/' + name;
  try {
    keys.forEach(key => { process.env[key] = '1'; });
    assert.equal(bossWeaponCanvasDisabled(), true);
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas');
    assert.match(flatVisualModule(path('BossWeaponsView.tsx')), /return null/);
    for (const file of ['BossHullView.tsx', 'BossHealthView.tsx', 'HullDamage.tsx', 'BossReactorView.tsx',
      'Starfield.tsx', 'SectorBackdrop.tsx', 'bossWeaponRenderer.ts', 'bossWeaponTextures.ts',
      'sectorBoss.ts', 'gameLoop.ts', 'gameInput.ts', 'gameAudio.ts', 'projectilePresentation.ts', 'GamePage.tsx'])
      assert.equal(flatVisualModule(path(file)), null, file);
    assert.equal(flatVisualModule('/repo/frontend/src/pages/other/BossWeaponsView.tsx'), null);
    assert.equal(flatVisualModule('/repo/backend/BossWeaponsView.tsx'), null);
    for (const key of keys) {
      process.env[key] = '0';
      assert.equal(bossWeaponCanvasDisabled(), false, key);
      assert.equal(flatVisualModule(path('BossWeaponsView.tsx')), null, key);
      process.env[key] = '1';
    }
    process.env.CRYPTOID_BOSS_WEAPON_CANVAS_OFF = '0';
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss');
  } finally {
    keys.forEach((key, i) => { if (before[i] === undefined) delete process.env[key]; else process.env[key] = before[i]; });
  }
});
