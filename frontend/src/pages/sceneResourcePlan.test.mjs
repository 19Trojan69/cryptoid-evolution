import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneResourcePlan } from './sceneResourcePlan.ts';
import { blockFlights } from './blockFlights.ts';
import { enemyAppearance } from './shipFleet.ts';
import { bossEscortRosterIndex, reactorEscortCount } from './bossEscorts.ts';
const key=ship=>`${ship.sprite}:${ship.stage}:${ship.color}`;
const contains=(ships,required)=>required.every(ship=>ships.some(item=>key(item)===key(ship)));
test('all 450 normal stages retain every formation of the block, including Meme Nebula 5/9',()=>{
 for(const rules of [1,2])for(let sector=1;sector<=500;sector++) {
  if(sector%10===0)continue;
  const plan=sceneResourcePlan(sector,'normal',0,rules);
  const count=blockFlights(sector,rules).reduce((a,b)=>a+b,0);
  assert.equal(plan.ships.length,count);
  for(let i=0;i<count;i++)assert.ok(contains(plan.ships,[{...enemyAppearance(sector,i),stage:1}]));
  const next=sceneResourcePlan(sector+1,sector%10===9?'boss-intro':'normal',0,rules);
  assert.ok(contains(plan.upcoming,next.ships),`stage ${sector} prepares the next encounter`);
  assert.ok(new Set([...plan.ships,...plan.upcoming].map(key)).size<=42);
 }
});
test('all 50 bosses forecast their next escort wave, bonus and following normal block',()=>{
 for(let sector=10;sector<=500;sector+=10)for(let wave=0;wave<20;wave++) {
  const plan=sceneResourcePlan(sector,'boss-fight',wave,2);
  const nextWave=sceneResourcePlan(sector,'boss-fight',wave+1,2);
  assert.ok(contains(plan.upcoming,nextWave.ships));
  assert.ok(contains(plan.upcoming,sceneResourcePlan(sector,'bonus',0,2).ships));
  if(sector<500)assert.ok(contains(plan.upcoming,sceneResourcePlan(sector+1,'normal',0,2).ships));
  for(let index=0;index<reactorEscortCount(sector);index++)assert.ok(contains(plan.ships,[{...enemyAppearance(sector,bossEscortRosterIndex(index,wave)),stage:1}]));
  assert.ok(new Set([...plan.ships,...plan.upcoming].map(key)).size<=42);
 }
 assert.equal(sceneResourcePlan(500,'bonus',0,2).upcoming.length,0);
});
