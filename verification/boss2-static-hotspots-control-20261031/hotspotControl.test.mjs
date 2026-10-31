import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { omitStaticBossHotspots, restoreStaticBossHotspots } from './hotspotControl.mjs';
import { bossStaticHotspotsDisabled, diagnosticSceneName } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
test('only boss static children are omitted; non-boss heat, enclosing mask and complete mini-explosion fragment survive exact reversal', () => {
  const s = readFileSync(new URL('../../frontend/src/pages/HullDamage.tsx', import.meta.url), 'utf8');
  const changed = omitStaticBossHotspots(s);
  assert.equal(restoreStaticBossHotspots(changed), s);
  assert.equal(changed.replace('{!boss && sites.map(site =>', '{sites.map(site =>'), s);
  assert.equal(changed.slice(changed.indexOf('    {hit && burst &&')), s.slice(s.indexOf('    {hit && burst &&')));
  assert.ok(changed.includes('style={{ maskImage, WebkitMaskImage: maskImage }}'));
  assert.ok(changed.includes('if (!sites.length && !hit) return null;'));
  assert.throws(() => omitStaticBossHotspots(s.replace('const burst = hit', 'const burst = !hit')));
});
test('omission requires unmasked flat-fill heat and hidden reflection, with distinct scene identity; defaults preserve every old scene', () => {
  const env = { CRYPTOID_FLAT_SCENE:'1', CRYPTOID_FLAT_BACKGROUND:'1', CRYPTOID_ORIGINAL_BOSS:'1',
    CRYPTOID_BOSS_WEAPON_CANVAS_OFF:'1', CRYPTOID_BOSS_MASK_LAYERS_OFF:'0', CRYPTOID_BOSS_REFLECTION_CONTROL:'0',
    CRYPTOID_BOSS_HEAT_CONTROL:'1', CRYPTOID_BOSS_HEAT_ON:'1', CRYPTOID_BOSS_HEAT_UNMASKED:'1',
    CRYPTOID_UNMASKED_HEAT_REFLECTION:'0', CRYPTOID_BOSS_HEAT_FLAT_FILL:'1', CRYPTOID_BOSS_STATIC_HOTSPOTS_OFF:'1' };
  const old = {...process.env};
  try {
    Object.assign(process.env,env); assert.equal(bossStaticHotspotsDisabled(), true);
    assert.ok(diagnosticSceneName().endsWith('-flat-fill-no-static-hotspots'));
    for (const [k,v] of Object.entries(env)) { process.env[k]=v==='1'?'0':'1'; assert.equal(bossStaticHotspotsDisabled(),false,k); process.env[k]=v; }
    process.env.CRYPTOID_BOSS_STATIC_HOTSPOTS_OFF='0'; assert.equal(bossStaticHotspotsDisabled(),false);
    assert.ok(diagnosticSceneName().endsWith('-unmasked-hull-heat-flat-fill'));
  } finally { for (const k of Object.keys(env)) { if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k]; } }
});
