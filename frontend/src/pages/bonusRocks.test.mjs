import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceBonusRock, spawnBonusRock, rockInField, hitBonusRock, rockHitsShot, nextRockEventMs, rockPoints } from './bonusRocks.ts';
import { chooseCryptoid } from './cryptoidRoster.ts';
import { combatCryptoid, combatTiming, combatEntryStage, combatAttackPattern, createCombatVariety, readCombatVariety, safeEarlyPickup } from './combatVariety.ts';
import { blockFlights } from './blockFlights.ts';
import { TRANSITION_INTRO_MS, BLOCK_CLEAR_MS } from './transitionTiming.ts';

test('all 500 campaign stages retain finite groups, late combat profiles and existing hull radii', () => {
 for (let stage=1;stage<=500;stage++) {
  const plan=blockFlights(stage);
  if(stage%10===0){assert.equal(plan.length,0);continue;}
  assert.ok(plan.length>0&&plan.length<=3);
  const timing=combatTiming(stage);assert.equal(timing.introMs,TRANSITION_INTRO_MS);assert.equal(timing.clearMs,BLOCK_CLEAR_MS);
  plan.forEach((count,flight)=>{
   assert.equal(count,6);assert.ok(combatEntryStage(stage,flight)>=1&&combatEntryStage(stage,flight)<=9);
   const old=[],modern=[];
   for(let n=0;n<count;n++){const i=flight*6+n,p=combatCryptoid(stage,i);assert.equal(p.radius,chooseCryptoid(stage,Array.from({length:18},(_,v)=>v).find(v=>chooseCryptoid(stage,v).type===p.type)).radius);old.push(JSON.stringify(chooseCryptoid(stage,i)));modern.push(JSON.stringify(p));}
   if(stage>=31)assert.deepEqual(modern.sort(),old.sort());
  });
  for(let cycle=0;cycle<20;cycle++)assert.ok(['dive','curve','sCurve','loop','side','double','vDive'].includes(combatAttackPattern(stage,cycle,cycle*6000)));
 }
});
test('rock swept hits award once, miss stays a miss, every trajectory exits the field', () => {
 for(const [width,height] of [[320,568],[390,844],[768,1024],[1024,768]])for(let seed=0;seed<100;seed++){
  let rock=spawnBonusRock(seed+1,499,width,height,95,seed/100,seed);
  assert.ok(rock.points<=chooseCryptoid(499,4).points);assert.equal(rockPoints(1,false),8);assert.equal(rockPoints(1,true),15);
  assert.equal(rockHitsShot(rock,{x:rock.x,y:rock.y+80},{x:rock.x,y:rock.y-80}),true);
  assert.equal(rockHitsShot(rock,{x:rock.x+200,y:rock.y+80},{x:rock.x+200,y:rock.y-80}),false);
  const hit=hitBonusRock(rock,100);assert.equal(hit.points,rock.points);assert.equal(hitBonusRock(hit.rock,100).points,0);
  for(let ms=0;ms<30000&&rockInField(rock,width,height);ms+=34)rock=advanceBonusRock(rock,34);
  assert.equal(rockInField(rock,width,height),false);
 }
 assert.equal(nextRockEventMs(0),25000);assert.equal(nextRockEventMs(1),50000);
});
test('early drops respect the four-type ledger, active cap and useful equipped weapon', () => {
 const state={weaponLevel:1,rapidFireMs:0,overdriveMs:0,powerUpTypes:[],powerUps:[],asteroids:[],player:{x:.5,y:.85}};
 assert.equal(safeEarlyPickup(state,1,390,844,95).type,'weapon');
 assert.equal(safeEarlyPickup(state,2,390,844,95).type,'rapid','evolved hull baseline should receive a visible boost without changing weapon behavior');
 assert.equal(safeEarlyPickup({...state,weaponLevel:5},5,390,844,95).type,'rapid');
 assert.equal(safeEarlyPickup({...state,powerUps:[{x:1,y:1},{x:2,y:2},{x:3,y:3}]},1,390,844,95),null);
 assert.equal(safeEarlyPickup({...state,powerUpTypes:['weapon','rapid','overdrive']},1,390,844,95),null);
});
test('combat metadata preserves once-only grants, cooldowns, per-block cap and damaged live targets', () => {
 const data=createCombatVariety();data.weaponIssued=true;data.clock=31000;data.asteroidDue=70000;data.asteroidStageEvents=2;
 const rock=spawnBonusRock(10,1,390,844,95,.9,90);rock.health=1;data.rocks=[rock];
 assert.deepEqual(readCombatVariety(JSON.parse(JSON.stringify(data))),data);
 assert.equal(readCombatVariety({...data,rocks:[rock,rock,rock]}),null);
 assert.equal(readCombatVariety({...data,rocks:[{...rock,health:0}]}),null);
 assert.equal(createCombatVariety(true).weaponIssued,true);
});
