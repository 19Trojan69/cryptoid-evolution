import test from 'node:test';
import assert from 'node:assert/strict';
import { heatFillCss, heatFillSelector } from './heatFillControl.mjs';
import { diagnosticSceneName, bossHeatFlatFillEnabled, flatVisualModule } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
test('only the inner static boss heat paint changes; masks, shape, opacity and mini-explosions are outside the override', () => {
  assert.equal(heatFillSelector, '.diagnostic-flat-scene .sector-boss .boss-static-heat .hull-hotspot > b');
  assert.equal(heatFillCss(true), heatFillSelector + ' { background-image: none !important; background-color: #ff7928 !important; }\n');
  assert.ok(!heatFillCss(false).includes('{'));
  for (const forbidden of ['mask-image:', 'opacity:', 'border-radius:', 'display:', 'animation:', 'transform:', 'filter:', 'hull-mini-explosion', 'hull-reflection'])
    assert.ok(!heatFillCss(true).includes(forbidden), forbidden);
});
test('flat heat paint requires all original heat gates, removed heat mask and hidden reflection; no component alias is introduced', () => {
  const env = { CRYPTOID_FLAT_SCENE: '1', CRYPTOID_FLAT_BACKGROUND: '1', CRYPTOID_ORIGINAL_BOSS: '1',
    CRYPTOID_BOSS_WEAPON_CANVAS_OFF: '1', CRYPTOID_BOSS_MASK_LAYERS_OFF: '0', CRYPTOID_BOSS_REFLECTION_CONTROL: '0',
    CRYPTOID_BOSS_HEAT_CONTROL: '1', CRYPTOID_BOSS_HEAT_ON: '1', CRYPTOID_BOSS_HEAT_UNMASKED: '1',
    CRYPTOID_UNMASKED_HEAT_REFLECTION: '0', CRYPTOID_BOSS_HEAT_FLAT_FILL: '1' };
  const before = { ...process.env };
  try {
    Object.assign(process.env, env); assert.equal(bossHeatFlatFillEnabled(), true);
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-reflection-unmasked-hull-heat-flat-fill');
    for (const name of ['BossHullView.tsx','HullDamage.tsx','BossHealthView.tsx','FinishedEffect.tsx','sectorBoss.ts','gameAudio.ts','gameInput.ts','gameLoop.ts'])
      assert.equal(flatVisualModule('/repo/frontend/src/pages/' + name), null, name);
    for (const [key,value] of Object.entries(env)) {
      process.env[key] = value === '1' ? '0' : '1'; assert.equal(bossHeatFlatFillEnabled(), false, key); process.env[key] = value;
    }
    process.env.CRYPTOID_BOSS_HEAT_FLAT_FILL = '0';
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-reflection-unmasked-hull-heat');
  } finally {
    for (const key of Object.keys(env)) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; }
  }
});
