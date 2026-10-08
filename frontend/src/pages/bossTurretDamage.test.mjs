import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSectorBoss, damageSectorBoss, bossHullExposed } from './sectorBoss.ts';
import { bossWeapons } from './bossWeapons.ts';
import { advanceBossTurrets, damageBossTurret, gunPosition, turretPoints } from './bossTurrets.ts';
import { bossHitTarget } from './bossHitTarget.ts';
import { drawBossWeapons } from './bossWeaponRenderer.ts';
import { firstMissionSnapshot, readSnapshot, missionAfter } from '../../../backend/src/playerSave.ts';
import { validRunScore } from '../../../backend/src/leaderboardRules.ts';
import { levelDifficulty } from './levelDifficulty.ts';

test('every boss hull has triple legacy HP and later turret batteries gain armor',()=>{
 for(let id=1;id<=50;id++){
  const boss=createSectorBoss(id*10,390,90,760);
  const p=levelDifficulty(id*10).progress;
  const oldHull=(28+p*52+p*p*40)*3;
  assert.ok(Math.abs(boss.maxHealth-oldHull*3)<1e-9);
  boss.turrets.forEach((turret,index)=>{
   const oldTurret=Math.ceil(4+bossWeapons[id-1][index].caliber/4+(id-1)*.15);
   assert.equal(turret.health,oldTurret*2+2*Math.floor((id-1)/5));
   assert.equal(turret.maxHealth,turret.health);
  });
 }
});

test('all 392 turrets have independent HP, award once, cancel queued fire and leave hull HP unchanged',()=>{
 let count=0;
 for(let id=1;id<=50;id++){
  const boss=createSectorBoss(id*10,390,90,760);boss.elapsed=2000;
  const hull=boss.health;let score=0;
  boss.turrets.forEach((turret,index)=>{
   count++;assert(turret.health>=6);assert.equal(turret.health,turret.maxHealth);
   assert.equal(damageBossTurret(boss,index,1),0);assert.equal(turret.health,turret.maxHealth-1);
   turret.pendingTotal=4;turret.pendingIndex=1;
   const bonus=damageBossTurret(boss,index,1000);score+=bonus;
   assert.equal(bonus,turretPoints(id,bossWeapons[id-1][index]));assert.equal(turret.health,0);assert.equal(turret.pendingTotal,0);
   assert.equal(damageBossTurret(boss,index,1000),0);assert.equal(boss.health,hull);
  });
  assert.equal(advanceBossTurrets(boss,{x:.5,y:.8},390,760,34,99,0).shots.length,0);
  const saved=readSnapshot({...firstMissionSnapshot(3),score});
  assert.equal(missionAfter({kind:'boss',stage:id*10},saved).snapshot.score,score);
  assert(validRunScore(score,0,120000));
 }
 assert.equal(count,392);
});

test('all bosses block hull shots and bombs until every turret is destroyed, including after resume',()=>{
 for(let id=1;id<=50;id++){
  let boss=createSectorBoss(id*10,390,90,760);boss.elapsed=2000;
  const hull=boss.health;
  for(let i=0;i<boss.turrets.length;i++){
   assert.equal(bossHullExposed(boss),false);
   assert.equal(damageSectorBoss(boss,10000,1000),false);
   assert.equal(damageSectorBoss(boss,10000,1000,true),false);
   assert.equal(boss.health,hull);
   assert.ok(damageBossTurret(boss,i,boss.turrets[i].health)>0);
   boss=JSON.parse(JSON.stringify(boss));boss.lastDamageAt=-1e9;
  }
  assert.equal(bossHullExposed(boss),true);
  assert.equal(boss.health,hull);
  assert.equal(damageSectorBoss(boss,1,2000),true);
  assert.equal(damageSectorBoss(boss,18,2000,true),true);
  assert.equal(boss.health,hull-38);
  assert.equal(damageSectorBoss(boss,10000,2400),true);
  assert.equal(boss.health,0);
  boss.turrets.forEach((_,i)=>assert.equal(damageBossTurret(boss,i,1000),0));
 }
});

test('every remaining rear or front turret is reachable from below the protected hull',()=>{
 for(let id=1;id<=50;id++)for(let index=0;index<bossWeapons[id-1].length;index++){
  const boss=createSectorBoss(id*10,390,90,760);boss.elapsed=2000;
  boss.turrets.forEach((g,i)=>{if(i!==index)g.health=0;});
  const p=gunPosition(boss,bossWeapons[id-1][index]);
  const hit=bossHitTarget(boss,{x:p.x,y:boss.y+boss.height},{x:p.x,y:p.y});
  assert.equal(hit?.kind,'turret',`boss ${id} turret ${index}`);
  assert.equal(hit?.index,index);
 }
});

test('rotated barrels outside the hull intercept a swept shot; destroyed barrels no longer block it',()=>{
 const boss=createSectorBoss(10,390,90,760);boss.elapsed=2000;
 const gun=bossWeapons[0][0],turret=boss.turrets[0],p=gunPosition(boss,gun),scale=boss.width/boss.config.sourceWidth;
 const point=distance=>({x:p.x-Math.sin(turret.a)*distance*scale,y:p.y+Math.cos(turret.a)*distance*scale});
 const from=point(gun.muzzle+30),to=point(gun.muzzle-15);
 const hit=bossHitTarget(boss,from,to);assert.equal(hit?.kind,'turret');assert.equal(hit?.index,0);
 damageBossTurret(boss,0,1000);
 assert.notEqual(bossHitTarget(boss,from,to)?.kind,'turret');
 assert.equal(bossHitTarget(boss,{x:-200,y:700},{x:-200,y:680}),null);
});

test('renderer omits destroyed gun sprite and flash, leaving the socket and wreck mark',()=>{
 const boss=createSectorBoss(10,390,90,760);boss.elapsed=2000;const calls=[];
 const c=new Proxy({drawImage:(...args)=>calls.push(args)}, {get:(o,k)=>k in o?o[k]:()=>{}});
 const make=()=>({width:600,height:500,getContext:()=>c});const canvas=make();
 drawBossWeapons(canvas,boss,{},false,make);const live=calls.length;calls.length=0;
 damageBossTurret(boss,0,1000);drawBossWeapons(canvas,boss,{},false,make);
 // Cached base layer plus the surviving gun's shadow and sprite only.
 assert.equal(calls.length,3);assert(live>calls.length);
});
