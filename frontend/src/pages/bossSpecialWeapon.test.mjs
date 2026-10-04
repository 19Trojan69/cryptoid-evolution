import test from 'node:test';
import assert from 'node:assert/strict';
import {createSectorBoss,moveSectorBoss,damageSectorBoss,BOSS_ENTRY_MS} from './sectorBoss.ts';
import {bossHullContains} from './bossCombat.ts';
import {advanceBossCore,CORE_WARNING_MS} from './bossCore.ts';
import {bossSpecialWeapons,specialWeaponBox,specialWeaponMount,specialWeaponMuzzle} from './bossSpecialWeapon.ts';
import {turretHeatStep} from './bossTurretHeat.ts';
import {advanceEscortReserve,reactorEscortCount,reactorEscortDelay,bossEscortSlots} from './bossEscorts.ts';
const exposed=(id,width=390,height=760)=>{const b=moveSectorBoss(createSectorBoss(id*10,width,90,height),BOSS_ENTRY_MS,width,height);b.turrets.forEach(g=>g.health=0);return b;};
test('all 50 special weapons sit on the centreline and solid hull',()=>{
 assert.equal(bossSpecialWeapons.length,50);
 for(const [width,height] of [[320,568],[390,760],[1366,768]])for(let id=1;id<=50;id++){
  const b=exposed(id,width,height),box=specialWeaponBox(b),m=specialWeaponMount(b);
  assert.ok(Math.abs(box.left+box.width/2-b.width/2)<.001);
  assert.ok(box.top>=0&&box.top+box.height<=b.height);
  assert.ok(bossHullContains(b,b.x,b.y+(m.y-.5)*b.height),`boss ${id} weapon floats in a hole`);
  assert.ok(bossHullContains(b,b.x,b.y+(m.y-m.height*.32-.5)*b.height),`boss ${id} mount lacks rear attachment`);
 }
});
test('shots emerge from the actual muzzle and match weapon illumination',()=>{
 for(let id=1;id<=50;id++){
  const b=exposed(id);b.core={elapsed:CORE_WARNING_MS-20,volley:0};
  const shots=advanceBossCore(b,{x:.5,y:.9},390,760,20,8,100);
  assert.equal(shots.length,1);assert.deepEqual({x:shots[0].x,y:shots[0].y},specialWeaponMuzzle(b));
  assert.equal(shots[0].weaponColor,specialWeaponMount(b).energy);
 }
});
test('turret damage steadily heats living weapons and preserves heat on resume',()=>{
 let previous=0;
 for(let health=20;health>0;health--){const gun={health,maxHealth:20},step=turretHeatStep(gun);assert.ok(step>=previous&&step<=8);previous=step;assert.equal(step,turretHeatStep(JSON.parse(JSON.stringify(gun))));}
 assert.equal(turretHeatStep({health:20,maxHealth:20}),0);assert.equal(turretHeatStep({health:0,maxHealth:20}),0);assert.equal(turretHeatStep({health:1,maxHealth:20}),8);
});
test('all exposed bosses need half the previous hits including resumed hulls',()=>{
 for(let id=1;id<=50;id++)for(const remaining of [1,.63]){
  const b=exposed(id);b.health=Math.ceil(b.maxHealth*remaining);const restored=JSON.parse(JSON.stringify(b,(_k,v)=>typeof v==='number'&&!Number.isFinite(v)?-1e9:v)),expected=Math.ceil(b.health/2);let hits=0;
  while(restored.health>0){assert.equal(damageSectorBoss(restored,1,hits*200),true);hits++;}assert.equal(hits,expected);
 }
});
test('escort pauses reach zero at displayed level 50; live escorts, pause, protection and death block respawning',()=>{
 assert.deepEqual([10,20,30,40,50,500].map(reactorEscortDelay),[4000,3000,2000,1000,0,0]);
 for(let level=10;level<=500;level+=10){
  const b=exposed(level/10);let elapsed=0,ready=false;
  for(let time=0;time<reactorEscortDelay(level);time+=20){({elapsed,ready}=advanceEscortReserve(b,level,0,elapsed,20));if(time+20<reactorEscortDelay(level))assert.equal(ready,false);}
  assert.equal(advanceEscortReserve(b,level,0,elapsed,20).ready,true);assert.deepEqual(advanceEscortReserve(b,level,1,elapsed,20),{elapsed:0,ready:false});
  assert.equal(advanceEscortReserve(b,level,0,elapsed,0).ready,false);b.turrets[0].health=1;assert.equal(advanceEscortReserve(b,level,0,elapsed,20).ready,false);
  b.turrets[0].health=0;b.health=0;assert.equal(advanceEscortReserve(b,level,0,elapsed,20).ready,false);
 }
});
test('a saved partially elapsed wave delay resumes without restart or skipped warning',()=>{
 const b=exposed(1),saved=JSON.parse(JSON.stringify({boss:b,timer:2180,wave:3,spawned:2}));let live=2180,restored=saved.timer;
 for(let i=0;i<100;i++){const a=advanceEscortReserve(b,10,0,live,20),c=advanceEscortReserve(saved.boss,10,0,restored,20);assert.deepEqual(a,c);live=a.elapsed;restored=c.elapsed;}
});
test('recurring escorts fit below all bosses even near defeat on phone and desktop',()=>{
 for(const [width,height] of [[320,568],[390,760],[1366,768]])for(let id=1;id<=50;id++){
  let b=exposed(id,width,height);b.health=b.maxHealth*.05;for(let i=0;i<240;i++)b=moveSectorBoss(b,16,width,height);
  const count=reactorEscortCount(id*10),slots=bossEscortSlots(id*10,width,height,b,count);
  assert.ok(count>=2&&count<=6);assert.equal(slots.length,count,`boss ${id}, ${width}`);
  for(const slot of slots){assert.ok(slot.y-18>b.y+b.height/2);assert.ok(slot.y+18+31<=height*.5+.01);}
 }
});
