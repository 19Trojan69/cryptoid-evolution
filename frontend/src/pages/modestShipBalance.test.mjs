import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { transformSync } from 'esbuild';
import { playerSkins } from './shipFleet.ts';
import { makeShipVolley, shipBaseFirepower } from './shipAttributes.ts';
import { projectileGuardForStage } from './shipEvolution.ts';
import { createSectorBoss, BOSS_ENTRY_MS, damageSectorBoss } from './sectorBoss.ts';
import { damageBossTurret } from './bossTurrets.ts';
import { languages, hasExplicitTranslation, translate } from '../i18n.ts';
import { shipBalanceKeys } from '../locales/shipBalance.ts';
import { restoreBalanceReloadGameChanges, restoreBalanceAccountChanges, balanceReloadChanges } from '../../scripts/balanceReloadReviewedChanges.mjs';

const source = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const hash = text => createHash('sha256').update(text).digest('hex');
test('all twenty hulls have bounded 100/115/130 base firepower with their original cadence and twin geometry', () => {
  for (const skin of playerSkins) for (const stage of [1,2,3]) {
    const base = shipBaseFirepower(skin.id,1), expected = [1,1.15,1.3][stage-1];
    assert.ok(Math.abs(shipBaseFirepower(skin.id,stage)/base-expected)<1e-9, skin.id+':'+stage);
    const shots=makeShipVolley(skin.id,stage,1,100,200,false,()=>0);
    assert.deepEqual(shots.map(shot=>shot.x),stage===1?[100]:[92,108]);
    assert.ok(shots.every(shot=>shot.damage>0&&Number.isFinite(shot.damage)));
  }
});
test('moderate stage damage reaches both boss turrets and the exposed reactor, without a discarded twin barrel',()=>{
  for(const stage of [1,2,3]){
    const boss=createSectorBoss(10,390,90,760);boss.elapsed=BOSS_ENTRY_MS;
    const shots=makeShipVolley('grey-scout',stage,1,100,200,false,()=>0);
    const before=boss.turrets[0].health;
    shots.forEach(shot=>damageBossTurret(boss,0,shot.damage));
    assert.ok(Math.abs(before-boss.turrets[0].health-[1,1.15,1.3][stage-1])<1e-9);
    boss.turrets.forEach(t=>{t.health=0;});boss.health=10;
    shots.forEach(shot=>assert.equal(damageSectorBoss(boss,shot.damage,1000),true));
    assert.ok(Math.abs(10-boss.health-2*[1,1.15,1.3][stage-1])<1e-9);
  }
});
test('the actual heart-loss handler preserves remaining protection until terminal death',()=>{
  const start=source.indexOf('            // The stage pool belongs'),end=source.indexOf('            state.weaponCap',start);
  assert.ok(start>0&&end>start);
  const run=new Function('state','destroyed',source.slice(start,end));
  for(const stage of [1,2,3])for(const remaining of [0,projectileGuardForStage(stage)]){
    const state={projectileGuard:remaining};run(state,false);assert.equal(state.projectileGuard,remaining);
    run(state,true);assert.equal(state.projectileGuard,0);
  }
  assert.equal(source.match(/projectileGuard = projectileGuardForStage/g)?.length,1,'only a confirmed new loadout initializes the pool');
});
test('the real snapshot serializer preserves an explicit remaining pool without inventing legacy protection',()=>{
  const account=readFileSync(new URL('../lib/accountSave.ts',import.meta.url),'utf8');
  const start=account.indexOf('export const snapshotOf ='),end=account.indexOf('export async function retrySave',start);
  const code=transformSync(account.slice(start,end).replace('export const','const'),{loader:'ts'}).code;
  const serialize=new Function(code+';return snapshotOf;')();
  const state={score:0,shards:0,destroyed:0,hearts:3,paidWeaponLevel:1,paidWeaponMs:0,pickupWeaponLevel:1,pickupWeaponMs:0,shieldCharges:0,shieldMs:0,purchasedShieldMs:0,overdriveMs:0,overdriveTotalMs:20000,rapidFireMs:0,rapidFireTotalMs:20000,empMs:0,weaponSource:'standard',shieldActive:true,weaponTimers:[0,0,0,0,0,0]};
  assert.equal(Object.hasOwn(serialize(state),'projectileGuard'),false);
  for(const guard of [0,1,2])assert.equal(serialize({...state,projectileGuard:guard}).projectileGuard,guard);
  assert.equal(hash(restoreBalanceAccountChanges(account)),'287a90e3cd14efef53e81dd973c7d67b560080746a4965bf346c52e8b435206e');
});
test('all stage descriptions, collection labels and mission protection rules are translated in all nineteen languages',()=>{
  for(const locale of Object.keys(languages))for(const key of shipBalanceKeys){assert.equal(hasExplicitTranslation(locale,key),true);assert.ok(translate(locale,key).trim());if(locale!=='en')assert.notEqual(translate(locale,key),key);}
});
test('eight fixed reviewed hunks restore the entire public controller before all historical fingerprints',()=>{
  assert.equal(balanceReloadChanges.length,8);
  assert.equal(hash(restoreBalanceReloadGameChanges(source)),'83fad3d2d4e20d1f5c6b6777c5dc0f5fcfea3215eeda386014d6b1fed32f1c1e');
  assert.throws(()=>restoreBalanceReloadGameChanges(source.replace('if (destroyed) state.projectileGuard = 0;','state.projectileGuard = 2;')),/one exact/);
  assert.throws(()=>restoreBalanceReloadGameChanges(source.replace('remainingMs: 6000','remainingMs: 1')),/one exact/);
  assert.notEqual(hash(restoreBalanceReloadGameChanges(source.replace('watch: callback => window.setInterval(callback, 500)','watch: callback => window.setInterval(callback, 1000)'))),'83fad3d2d4e20d1f5c6b6777c5dc0f5fcfea3215eeda386014d6b1fed32f1c1e');
});

test('actual legacy section Resume never refills protection after a lost heart, progress or a saved zero',()=>{
 const a=source.indexOf('        // Legacy section-only saves'),b=source.indexOf('        setSaveNotice(data.combat',a);assert.ok(a>0&&b>a);
 const run=new Function('stateRef','shipStageRef','projectileGuardForStage','data',source.slice(a,b));
 for(const checkpoint of [{destroyed:1,hearts:3},{destroyed:0,hearts:2},{destroyed:0,hearts:3,damageCount:1},{destroyed:0,hearts:3,projectileGuard:0}]){
  const ref={current:{projectileGuard:checkpoint.projectileGuard??2,maxHearts:3}};run(ref,{current:3},projectileGuardForStage,{combat:null,checkpoint,startSector:1});assert.equal(ref.current.projectileGuard,0);
 }
 const ref={current:{projectileGuard:1,maxHearts:3}};run(ref,{current:3},projectileGuardForStage,{combat:{},checkpoint:{destroyed:0,hearts:2},startSector:1});assert.equal(ref.current.projectileGuard,1,'a proven old combat record keeps its remaining pool');
});
