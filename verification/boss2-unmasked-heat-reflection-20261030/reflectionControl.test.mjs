import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reflectionCss, reflectionHide } from './reflectionControl.mjs';
import { diagnosticSceneName, bossUnmaskedHeatReflectionRestored, flatVisualModule } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
test('the optional reflection restore removes only its hide rule while leaving the exact unmasked heat CSS', () => {
  const heat = readFileSync(new URL('../boss2-boss-heat-unmasked-20261030/heatMask.css', import.meta.url), 'utf8');
  const source = reflectionHide + heat;
  assert.equal(reflectionCss(source, false), source);
  assert.equal(reflectionCss(source, true), heat);
  assert.throws(() => reflectionCss(heat, true));
  assert.throws(() => reflectionCss(reflectionHide + reflectionHide + heat, true));
  assert.throws(() => reflectionCss(reflectionHide, true));
});
test('reflection with unmasked heat requires every existing safe scene gate and keeps original visual components', () => {
  const env = {
    CRYPTOID_FLAT_SCENE: '1', CRYPTOID_FLAT_BACKGROUND: '1', CRYPTOID_ORIGINAL_BOSS: '1',
    CRYPTOID_BOSS_WEAPON_CANVAS_OFF: '1', CRYPTOID_BOSS_MASK_LAYERS_OFF: '0',
    CRYPTOID_BOSS_REFLECTION_CONTROL: '0', CRYPTOID_BOSS_HEAT_CONTROL: '1',
    CRYPTOID_BOSS_HEAT_ON: '1', CRYPTOID_BOSS_HEAT_UNMASKED: '1', CRYPTOID_UNMASKED_HEAT_REFLECTION: '1',
  };
  const before = { ...process.env };
  try {
    Object.assign(process.env, env);
    assert.equal(bossUnmaskedHeatReflectionRestored(), true);
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-unmasked-hull-heat-restored-hull-reflection');
    for (const file of ['BossHullView.tsx','HullDamage.tsx','BossHealthView.tsx','FinishedEffect.tsx','sectorBoss.ts','gameAudio.ts','gameInput.ts','gameLoop.ts'])
      assert.equal(flatVisualModule('/repo/frontend/src/pages/' + file), null, file);
    for (const [key,value] of Object.entries(env)) {
      process.env[key] = value === '1' ? '0' : '1'; assert.equal(bossUnmaskedHeatReflectionRestored(), false, key); process.env[key] = value;
    }
    process.env.CRYPTOID_UNMASKED_HEAT_REFLECTION = '0';
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-reflection-unmasked-hull-heat');
  } finally {
    for (const key of Object.keys(env)) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; }
  }
});
