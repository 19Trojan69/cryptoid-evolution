import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSectorBoss } from './sectorBoss.ts';
import { advanceBossCore, CORE_WARNING_MS } from './bossCore.ts';
const player={x:.5,y:.88};
function disarmed(id){const b=createSectorBoss(id*10,390,90,760);b.elapsed=5000;for(const g of b.turrets)g.health=0;return b;}
function tick(b,ms,cap=5){let shots=[];for(let t=0;t<ms;t+=20)shots.push(...advanceBossCore(b,player,390,760,20,cap,shots.length));return shots;}
test('all 50 bosses warn before pulsing, keep destroyed guns and respect shared capacity',()=>{
 for(let id=1;id<=50;id++){
  const b=disarmed(id);
  assert.equal(tick(b,CORE_WARNING_MS-20).length,0);
  assert.equal(tick(b,20).length,1);
  assert.ok(b.turrets.every(g=>g.health===0));
  assert.equal(tick(b,4000,0).length,0);
  const next=tick(b,20,1);assert.equal(next.length,1);
  assert.ok(next.every(s=>Number.isFinite(s.vx+s.vy+s.x+s.y)&&s.vy>0));
 }
});
test('armed, entering, dead and paused bosses cannot advance the core',()=>{
 const b=disarmed(50);b.turrets[0].health=1;assert.equal(tick(b,4000).length,0);assert.equal(b.core,undefined);
 b.turrets[0].health=0;b.elapsed=0;assert.equal(tick(b,4000).length,0);
 b.elapsed=5000;advanceBossCore(b,player,390,760,0,5,0);assert.equal(b.core,undefined);
 b.health=0;assert.equal(tick(b,4000).length,0);
});
test('later fans have a central escape gap; restored warning produces identical next volley',()=>{
 for(const id of [1,20,50]){
  const b=disarmed(id);tick(b,1800);tick(b,900);
  const restored=JSON.parse(JSON.stringify(b));
  const a=tick(b,2500),c=tick(restored,2500);assert.deepEqual(a,c);
  assert.equal(a.length,id===1?1:id===20?2:4);
  if(id>1)assert.ok(a.every(s=>Math.abs(s.vx/s.vy)>.2));
 }
});
