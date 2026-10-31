import test from 'node:test';
import assert from 'node:assert/strict';
import { reflectionMaskCss, reflectionMaskSelector } from './reflectionMaskControl.mjs';
import { diagnosticSceneName, bossHullReflectionUnmasked, flatVisualModule } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
test('only both active image-mask properties on the original boss reflection are overridden', () => {
  assert.equal(reflectionMaskSelector, '.diagnostic-flat-scene .sector-boss .hull-reflection');
  assert.equal(reflectionMaskCss(true), reflectionMaskSelector + ' { mask-image: none !important; -webkit-mask-image: none !important; }\n');
  assert.ok(!reflectionMaskCss(false).includes('{'));
  for (const forbidden of ['display:', 'opacity:', 'mix-blend-mode:', 'background:', 'animation:', 'transform:', 'filter:', 'hull-heat-layer', 'hull-mini-explosion'])
    assert.ok(!reflectionMaskCss(true).includes(forbidden), forbidden);
});
test('reflection mask candidate requires the existing visible-reflection and unmasked-heat scene gates', () => {
  const env = { CRYPTOID_FLAT_SCENE: '1', CRYPTOID_FLAT_BACKGROUND: '1', CRYPTOID_ORIGINAL_BOSS: '1',
    CRYPTOID_BOSS_WEAPON_CANVAS_OFF: '1', CRYPTOID_BOSS_MASK_LAYERS_OFF: '0', CRYPTOID_BOSS_REFLECTION_CONTROL: '0',
    CRYPTOID_BOSS_HEAT_CONTROL: '1', CRYPTOID_BOSS_HEAT_ON: '1', CRYPTOID_BOSS_HEAT_UNMASKED: '1',
    CRYPTOID_UNMASKED_HEAT_REFLECTION: '1', CRYPTOID_REFLECTION_IMAGE_MASK_OFF: '1' };
  const before = { ...process.env };
  try {
    Object.assign(process.env, env); assert.equal(bossHullReflectionUnmasked(), true);
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-unmasked-hull-heat-unmasked-hull-reflection');
    for (const name of ['BossHullView.tsx','HullDamage.tsx','BossHealthView.tsx','FinishedEffect.tsx','sectorBoss.ts','gameAudio.ts','gameInput.ts','gameLoop.ts'])
      assert.equal(flatVisualModule('/repo/frontend/src/pages/' + name), null, name);
    for (const [key,value] of Object.entries(env)) {
      process.env[key] = value === '1' ? '0' : '1'; assert.equal(bossHullReflectionUnmasked(), false, key); process.env[key] = value;
    }
    process.env.CRYPTOID_REFLECTION_IMAGE_MASK_OFF = '0';
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-unmasked-hull-heat-restored-hull-reflection');
  } finally {
    for (const key of Object.keys(env)) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; }
  }
});
