import test from 'node:test';
import assert from 'node:assert/strict';
import { reflectionBlendCss, reflectionBlendSelector } from './reflectionBlendControl.mjs';
import { diagnosticSceneName, bossHullReflectionNormalBlend, flatVisualModule } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
test('normal blend affects only the original visible boss reflection without overriding masks, opacity or timing', () => {
  assert.equal(reflectionBlendSelector, '.diagnostic-flat-scene .sector-boss .hull-reflection');
  assert.equal(reflectionBlendCss(true), reflectionBlendSelector + ' { mix-blend-mode: normal !important; }\n');
  assert.ok(!reflectionBlendCss(false).includes('{'));
  for (const forbidden of ['mask-image:', 'opacity:', 'display:', 'background:', 'animation:', 'transform:', 'filter:', 'hull-heat-layer','hull-mini-explosion'])
    assert.ok(!reflectionBlendCss(true).includes(forbidden), forbidden);
});
test('normal blend is gated behind both visible original overlays and both removed image masks', () => {
  const env = { CRYPTOID_FLAT_SCENE: '1', CRYPTOID_FLAT_BACKGROUND: '1', CRYPTOID_ORIGINAL_BOSS: '1',
    CRYPTOID_BOSS_WEAPON_CANVAS_OFF: '1', CRYPTOID_BOSS_MASK_LAYERS_OFF: '0', CRYPTOID_BOSS_REFLECTION_CONTROL: '0',
    CRYPTOID_BOSS_HEAT_CONTROL: '1', CRYPTOID_BOSS_HEAT_ON: '1', CRYPTOID_BOSS_HEAT_UNMASKED: '1',
    CRYPTOID_UNMASKED_HEAT_REFLECTION: '1', CRYPTOID_REFLECTION_IMAGE_MASK_OFF: '1', CRYPTOID_REFLECTION_NORMAL_BLEND: '1' };
  const before = { ...process.env };
  try {
    Object.assign(process.env, env); assert.equal(bossHullReflectionNormalBlend(), true);
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-unmasked-hull-heat-unmasked-hull-reflection-normal-blend');
    for (const name of ['BossHullView.tsx','HullDamage.tsx','BossHealthView.tsx','FinishedEffect.tsx','sectorBoss.ts','gameAudio.ts','gameInput.ts','gameLoop.ts'])
      assert.equal(flatVisualModule('/repo/frontend/src/pages/' + name), null, name);
    for (const [key,value] of Object.entries(env)) {
      process.env[key] = value === '1' ? '0' : '1'; assert.equal(bossHullReflectionNormalBlend(), false, key); process.env[key] = value;
    }
    process.env.CRYPTOID_REFLECTION_NORMAL_BLEND = '0';
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-unmasked-hull-heat-unmasked-hull-reflection');
  } finally {
    for (const key of Object.keys(env)) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; }
  }
});
