import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyHealthClearance} from './enemyHealthClearance.ts';
import {shipOverlayGeometry} from './shipOverlayGeometry.ts';
import {engineFlamePercent} from './shipRealism.ts';
import {PURCHASED_WEAPON_DURATION_MS,PICKUP_WEAPON_DURATION_MS} from './playerCombat.ts';
import {weaponResumeStepMs} from './weaponReloadTiming.ts';

test('every original model/stage reserves the longest existing exhaust independent of live thrust',()=>{
 for(let sprite=0;sprite<20;sprite++)for(const stage of [1,2,3]){
  const tip=parseFloat(enemyHealthClearance(sprite,stage)['--health-flame-tip']);
  for(const [,y] of shipOverlayGeometry(sprite,stage).nozzles)for(const phase of ['idle','launch','boost','return'])for(const thrust of [0,.5,1])
   assert.ok(tip<=100-y-engineFlamePercent(thrust,phase)+.00001);
  assert.strictEqual(enemyHealthClearance(sprite,stage),enemyHealthClearance(sprite,stage),'geometry is already prepared, not rebuilt during renders');
 }
});
test('only an armed weapon-menu return uses half-second steps; ordinary/technical Resume stays unchanged',()=>{
 for(const source of ['paid','pickup'])for(const remaining of [1,45000,-1])assert.equal(weaponResumeStepMs(true,source,remaining)*3,1500);
 for(const source of ['paid','pickup','standard'])for(const remaining of [0,45000,-1])assert.equal(weaponResumeStepMs(false,source,remaining)*3,3000);
 assert.equal(weaponResumeStepMs(true,'standard',45000),1000);
 assert.equal(weaponResumeStepMs(true,'paid',0),1000);
});
test('new purchased charges use forty-five seconds while collected weapons keep their existing duration',()=>{
 assert.equal(PURCHASED_WEAPON_DURATION_MS,45000);assert.equal(PICKUP_WEAPON_DURATION_MS,20000);
});
