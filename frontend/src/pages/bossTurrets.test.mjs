import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSectorBoss, moveSectorBoss } from './sectorBoss.ts';
import { advanceBossTurrets } from './bossTurrets.ts';
import { bossWeapons } from './bossWeapons.ts';
import { generateBossSound } from './bossWeaponSound.ts';

test('all 392 stations and every barrel fire after alignment under the phone projectile cap',()=>{
 let total=0;
 for(let id=1;id<=50;id++){
  let boss=createSectorBoss(id*10,390,90,760),active=[],next=0;
  const fired=bossWeapons[id-1].map(()=>new Set());
  for(let t=0;t<180000;t+=20){
   boss=moveSectorBoss(boss,20,390,760);
   active=active.map(s=>({...s,x:s.x+s.vx*20,y:s.y+s.vy*20})).filter(s=>s.y<780&&s.y>0&&s.x>-30&&s.x<420);
   const out=advanceBossTurrets(boss,{x:.5,y:.88},390,760,20,3-active.length,next);next+=out.shots.length;active.push(...out.shots);
   assert.ok(active.length<=3);
   for(const e of out.events){assert.ok(e.error<.035);assert.ok(e.lock>=160);for(const b of boss.turrets[e.gunIndex].firedBarrels)fired[e.gunIndex].add(b);}
   for(const s of out.shots)assert.ok(Number.isFinite(s.x+s.y+s.vx+s.vy+s.radius));
  }
  fired.forEach((barrels,i)=>assert.equal(barrels.size,bossWeapons[id-1][i].barrels.length,`boss ${id} station ${i}`));total+=fired.length;
 }
 assert.equal(total,392);
});

test('entry, pause, death and loss of alignment prevent firing including queued salvos',()=>{
 const boss=createSectorBoss(500,390,90,760);
 assert.equal(advanceBossTurrets(boss,{x:.5,y:.88},390,760,80,8,0).shots.length,0);
 boss.elapsed=2000;boss.weaponClock=100000;
 for(const g of boss.turrets){g.a=0;g.lock=200;g.next=0;}
 assert.equal(advanceBossTurrets(boss,{x:.5,y:.88},390,760,0,8,0).shots.length,0);
 boss.health=0;assert.equal(advanceBossTurrets(boss,{x:.5,y:.88},390,760,80,8,0).shots.length,0);
 boss.health=100;for(const g of boss.turrets){g.pendingTotal=4;g.pendingIndex=1;g.pendingAt=0;}
 assert.equal(advanceBossTurrets(boss,{x:0,y:0},390,760,20,8,0).shots.length,0);
});

test('all eighteen caliber sound buffers are finite, bounded and distinct',()=>{
 const signatures=new Set();
 for(const kind of ['laser','pulse','plasma','heavy','siege','rocket'])for(let v=0;v<3;v++){
  const a=generateBossSound(kind,v,48000);let peak=0,hash=0;
  for(let i=0;i<a.length;i++){assert.ok(Number.isFinite(a[i]));peak=Math.max(peak,Math.abs(a[i]));hash+=a[i]*Math.sin(i*.71);}
  assert.ok(peak>.1&&peak<=.73);signatures.add(`${a.length}:${hash}`);
 }
 assert.equal(signatures.size,18);
});
