import {test} from 'node:test';import assert from 'node:assert/strict';
import {InsectoidsEngine} from './insectoidsEngine.ts';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {insectoidRoster,insectoidAsset} from './insectoidRoster.ts';
import {gunPosition} from './bossTurrets.ts';

test('twenty distinct transparent raster assets remain bounded and individually named',()=>{
 assert.equal(insectoidRoster.length,20);assert.equal(new Set(insectoidRoster.map(x=>x.name)).size,20);
 const sprites=insectoidRoster.map(x=>readFileSync(new URL('../../public'+insectoidAsset(x.id),import.meta.url)));
 assert.equal(new Set(sprites.map(s=>createHash('sha256').update(s).digest('hex'))).size,20);
 for(const sprite of sprites){assert.equal(sprite.toString('ascii',0,4),'RIFF');assert.equal(sprite.toString('ascii',8,12),'WEBP');assert.ok(sprite.length<50000);}
 assert.ok(sprites.reduce((sum,s)=>sum+s.length,0)<800000);
});

test('actual pooled mission clears all nine rounds, every enemy type, turrets, reactor, heart and bonus without a menu reset',()=>{
 for(const [w,h] of [[320,568],[390,760],[768,920]]){
  const e=new InsectoidsEngine(w,h,5),rounds=new Set(),phases=new Set();
  const shotIds=e.shots.map(x=>x.shot),particleIds=[...e.sparks],enemyIds=[...e.enemies];
  let bossPeak=0,coreSeen=false;
  for(let i=0;i<100000;i++){
   phases.add(e.phase);e.hearts=99;
   if(e.phase==='round'){
    rounds.add(e.round);const enemy=e.enemies.find(x=>x.active);if(enemy)e.point(enemy.x,e.height*.78);
   }else if(e.phase==='boss'&&e.boss){
    const b=e.boss,index=b.turrets.findIndex(g=>g.health>0);if(index<0)coreSeen=true;
    e.point(index>=0?gunPosition(b,b.weaponSlots[index]).x:b.x,e.height*.78);
   }else if(e.phase==='heart')e.point(e.width*.5,e.height*.66);
   e.step(16.6667);
   if(e.phase==='boss')bossPeak=Math.max(bossPeak,e.shots.filter(x=>x.active&&x.hostile).length);
   if(e.phase==='victory')break;
  }
  assert.equal(e.phase,'victory',`${w}x${h}: ${e.phase} round ${e.round}, boss ${e.boss?.health}`);
  assert.equal(rounds.size,9);assert.equal(e.destroyedTypes.size,20);assert.ok(coreSeen);assert.ok(e.collectedHeart);
  for(const p of ['boss-warning','boss','boss-explosion','heart','bonus'])assert.ok(phases.has(p));
  assert.ok(e.virusShots>0);assert.ok(e.bossShots>0);assert.ok(bossPeak<=3);assert.ok(e.peak.hostile<=4);
  e.shots.forEach((x,i)=>assert.strictEqual(x.shot,shotIds[i]));e.sparks.forEach((x,i)=>assert.strictEqual(x,particleIds[i]));e.enemies.forEach((x,i)=>assert.strictEqual(x,enemyIds[i]));
  assert.equal(e.shots.length,36);assert.equal(e.sparks.length,96);assert.equal(e.enemies.length,6);
  const phase=e.phase,time=e.time;e.step(30000);assert.equal(e.phase,phase);assert.equal(e.time,time);
  e.dispose();assert.equal(e.shots.filter(x=>x.active).length,0);assert.equal(e.sparks.filter(x=>x.active).length,0);assert.equal(e.audio,undefined);
 }
});

test('pause preserves every timer and object; resizing preserves the run; defeat never returns to menu',()=>{
 const e=new InsectoidsEngine(390,760,1);for(let i=0;i<100;i++)e.step(16);
 const before={time:e.time,phase:e.phase,round:e.round,hearts:e.hearts,positions:e.enemies.map(x=>[x.x,x.y])};e.pause('test');for(let i=0;i<100;i++)e.step(34);
 assert.deepEqual({time:e.time,phase:e.phase,round:e.round,hearts:e.hearts,positions:e.enemies.map(x=>[x.x,x.y])},before);
 e.resize(768,920);assert.equal(e.round,before.round);assert.equal(e.hearts,before.hearts);e.resume();e.step(16);assert.ok(e.time>before.time);
 e.phase='defeat';const t=e.time;e.step(1000);assert.equal(e.phase,'defeat');assert.equal(e.time,t);
});
