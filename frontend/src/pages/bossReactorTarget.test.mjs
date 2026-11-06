import test from 'node:test';
import assert from 'node:assert/strict';
import {createSectorBoss, moveSectorBoss, BOSS_ENTRY_MS, damageSectorBoss} from './sectorBoss.ts';
import {bossReactorContact, recordBossHullImpact} from './bossReactorTarget.ts';
import {bossHitTarget} from './bossHitTarget.ts';
import {specialWeaponBox, reactorDoorOpen} from './bossSpecialWeapon.ts';
import {bossHullContains} from './bossCombat.ts';
import {bossWeapons} from './bossWeapons.ts';
import {gunPosition, damageBossTurret} from './bossTurrets.ts';
const views=[[320,568],[390,760],[1366,768]];
function bossFor(id,width=390,height=760,exposed=true){
 const boss=moveSectorBoss(createSectorBoss(id*10,width,90,height),BOSS_ENTRY_MS,width,height);
 if(exposed)boss.turrets.forEach(g=>g.health=0);
 return boss;
}
function point(boss,x,y){const b=specialWeaponBox(boss);return {x:boss.x-boss.width/2+b.left+x/100*b.width,y:boss.y-boss.height/2+b.top+y/160*b.height};}

test('all 50 reactors include the full assembly and both doors through closed, opening and reopened states',()=>{
 let checks=0;
 for(const [w,h] of views)for(let id=1;id<=50;id++){
  const boss=bossFor(id,w,h);
  for(const [elapsed,volley] of [[0,0],[450,0],[900,0],[0,1],[30,9]]){
   boss.core={elapsed,volley};const open=reactorDoorOpen(true,elapsed,volley);
   for(const [x,y] of [[1,1],[99,159],[50,80],[30-open*32,80-open*4],[70+open*32,80-open*4]]){
    const p=point(boss,x,y);assert.ok(bossReactorContact(boss,p,p),`reactor ${id},${w},${x},${y}`);
    assert.equal(bossHitTarget(boss,p,p)?.kind,'hull');checks++;
   }
   for(const [x,y] of [[-30,80],[130,80],[-20,0],[120,160],[50,165]]){
    const p=point(boss,x,y);assert.equal(bossReactorContact(boss,p,p),null);checks++;
   }
   const restored=JSON.parse(JSON.stringify(boss));
   const p=point(boss,30-open*32,80-open*4);
   assert.deepEqual(bossReactorContact(restored,p,p),bossReactorContact(boss,p,p));
  }
 }
 assert.equal(checks,7500);
});

test('swept shots cannot skip a reactor or opened door at high speed',()=>{
 for(let id=1;id<=50;id++){
  const boss=bossFor(id);boss.core={elapsed:0,volley:1};
  for(const x of [-2,50,102]){
   const a=point(boss,x,200),b=point(boss,x,-40),contact=bossReactorContact(boss,a,b);
   assert.ok(contact);assert.equal(bossHitTarget(boss,a,b)?.kind,'hull');
   assert.ok(contact.y<=a.y&&contact.y>=b.y);
  }
 }
});

test('all 392 gun targets retain their independent damage and reactor protection',()=>{
 let count=0;
 for(let id=1;id<=50;id++){
  const boss=bossFor(id,390,760,false),health=boss.health;
  for(let index=0;index<boss.turrets.length;index++){
   boss.turrets.forEach((g,i)=>g.health=i===index?1:0);
   const p=gunPosition(boss,bossWeapons[id-1][index]);
   const hit=bossHitTarget(boss,{x:p.x,y:boss.y+boss.height},p);
   assert.equal(hit?.kind,'turret');assert.equal(hit.index,index);
   damageBossTurret(boss,index,.25);assert.equal(boss.turrets[index].health,.75);assert.equal(boss.health,health);
   assert.equal(damageSectorBoss(boss,1,3000),false);count++;
  }
 }
 assert.equal(count,392);
});

test('hull-only entry leaves HP, heat patches and projectile data unchanged; marks remain bounded',()=>{
 for(const [w,h] of views)for(let id=1;id<=50;id++){
  const boss=bossFor(id,w,h);boss.core={elapsed:0,volley:1};const box=specialWeaponBox(boss);let p;
  for(let row=1;row<47&&!p;row++)for(let col=1;col<127;col++){
   const candidate={x:boss.x+(col/128-.5)*boss.width,y:boss.y+(row/48-.5)*boss.height};
   if(Math.abs(candidate.x-boss.x)>box.width*.86&&bossHullContains(boss,candidate.x,candidate.y)){p=candidate;break;}
  }
  assert.ok(p,`solid side hull ${id}`);
  const from={x:p.x,y:boss.y+boss.height},shot={...p,id:9000+id,damage:17},saved={...shot},health=boss.health;
  assert.equal(bossHitTarget(boss,from,shot),null);
  assert.equal(recordBossHullImpact(boss,from,shot),true);
  assert.equal(boss.hit.id,shot.id);assert.equal(boss.health,health);assert.equal(boss.hullFires,undefined);assert.deepEqual(shot,saved);
  for(let i=0;i<100;i++)assert.equal(recordBossHullImpact(boss,p,{...p,id:i}),false);
  assert.equal(boss.hit.id,shot.id);assert.equal(boss.health,health);
 }
});

test('ordinary flight through invulnerable body reaches the reactor and applies one unchanged damage event',()=>{
 for(const [w,h] of views)for(let id=1;id<=50;id++){
  const boss=bossFor(id,w,h),target=point(boss,50,80),health=boss.health;
  let from={x:target.x,y:boss.y+boss.height+20},connected=false;
  for(let frame=0;frame<500;frame++){
   const shot={id:1,damage:3,x:from.x,y:from.y-3};
   const hit=bossHitTarget(boss,from,shot);
   if(hit){assert.equal(hit.kind,'hull');assert.equal(damageSectorBoss(boss,shot.damage,3000),true);connected=true;break;}
   recordBossHullImpact(boss,from,shot);assert.equal(boss.health,health);from=shot;
  }
  assert.ok(connected,`reactor remains reachable ${id},${w}`);assert.equal(boss.health,health-6);
 }
});

test('invalid paths, detached misses and defeated bosses produce no new impact or damage',()=>{
 const boss=bossFor(1),outside={x:-2000,y:-2000};
 assert.equal(recordBossHullImpact(boss,outside,{...outside,id:1}),false);
 for(const value of [NaN,Infinity,-Infinity]){
  assert.equal(bossReactorContact(boss,{x:value,y:0},{x:0,y:0}),null);
  assert.equal(recordBossHullImpact(boss,{x:value,y:0},{x:0,y:0,id:1}),false);
 }
 boss.health=0;const p=point(boss,50,80);
 assert.equal(bossHitTarget(boss,p,p),null);assert.equal(recordBossHullImpact(boss,outside,{...p,id:1}),false);
});
