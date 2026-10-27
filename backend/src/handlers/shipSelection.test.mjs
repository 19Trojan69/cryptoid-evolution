import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{createRequire}from'node:module';
const require=createRequire(import.meta.url),text=readFileSync(new URL('./progress.test.mjs',import.meta.url),'utf8');
const make=new Function('require',text.slice(text.indexOf('const get ='),text.indexOf('const snapshot ='))+'\nreturn harness;')(require);
const{standardShips,spriteForShip,shipForSprite,firstMissionSnapshot}=require('../../build/playerSave.js');
const{ownedShipStage,selectedShipStage}=require('../../build/shipLoadout.js');
const choose=(h,shipStage,extra={})=>h.call('progress','/inventory',{action:'select',version:h.profile().version,skin:'grey-scout',color:'grey',shipStage,...extra});
const prepared=async()=>{const h=make();await h.call('progress','/me',null,{method:'GET'});return h;};
const upgrades=(h,sprite=1,flag=true)=>{for(const stage of [2,3])h.orders.push({user:'pilot-a',paid:true,product_id:`ship_${String(sprite+1).padStart(2,'0')}_stage_${stage}`,owner_testnet_catalog:flag});};

test('all twenty hull identities share stage selection, prerequisite and legacy rules',()=>{
 for(const [index,skin]of standardShips.entries()){
  const sprite=spriteForShip(skin);assert.equal(shipForSprite(sprite),skin);assert.equal(sprite,index<2?1-index:index);
  const ids=[2,3].map(stage=>`ship_${String(sprite+1).padStart(2,'0')}_stage_${stage}`);
  assert.equal(ownedShipStage(sprite,[ids[1]]),1);assert.equal(selectedShipStage(sprite,ids),3);
  for(const stage of [1,2,3])assert.equal(selectedShipStage(sprite,ids,stage),stage);
  assert.equal(selectedShipStage(sprite,[],3),1);
 }
});

test('confirmed Standard purchases add ownership and deduct once without changing the selected loadout',async()=>{
 const h=await prepared();Object.assign(h.profile(),{balance:5000,legacyImported:true,shipStage:2});
 const before={skin:h.profile().skin,color:h.profile().color,shipStage:h.profile().shipStage};
 const response=await h.call('progress','/inventory',{action:'buy',version:h.profile().version,skin:'nova-wing',color:'gold'});
 assert.equal(response.code,200);assert.equal(response.body.save.fleet['nova-wing'].gold,1);assert.equal(response.body.save.balance,4850);
 assert.deepEqual({skin:h.profile().skin,color:h.profile().color,shipStage:h.profile().shipStage},before);
});

test('every owned stage can be explicitly selected and survives a new or resumed account start',async()=>{
 const h=await prepared();upgrades(h);Object.assign(h.profile(),{version:1,legacyImported:true});
 for(const stage of [3,1,2]){
  const selected=await choose(h,stage);assert.equal(selected.code,200);assert.equal(selected.body.save.shipStage,stage);
  const started=await h.call('hangar','/start',{action:'new',version:h.profile().version,startKey:`selected-stage-${stage}-run-key`,rulesVersion:2});
  assert.equal(started.code,200);assert.equal(started.body.shipStage,stage);assert.equal(started.body.profile.shipStage,stage);
  assert.equal(started.body.ownedShipUpgrades.length,2);
  h.profile().mission={sector:1,phase:'normal',rulesVersion:2,snapshot:{...firstMissionSnapshot(3),score:100,shards:7},savedAt:new Date().toISOString()};
  const resumed=await h.call('hangar','/start',{action:'resume',version:h.profile().version,startKey:`selected-stage-${stage}-resume-key`,rulesVersion:2});
  assert.equal(resumed.code,200);assert.equal(resumed.body.shipStage,stage);assert.equal(resumed.body.checkpoint.score,100);assert.equal(resumed.body.checkpoint.shards,7);
 }
});

test('selection rejects unpaid, orphan, foreign-hull and other-network upgrades without changing a save',async()=>{
 for(const kind of ['unpaid','orphan','foreign','mainnet']){
  const h=await prepared();if(kind==='unpaid')h.orders.push({user:'pilot-a',paid:false,product_id:'ship_02_stage_3'});
  if(kind==='orphan')h.orders.push({user:'pilot-a',paid:true,product_id:'ship_02_stage_3'});
  if(kind==='foreign')upgrades(h,0);
  if(kind==='mainnet'){upgrades(h);await h.call('progress','/me',null,{method:'GET',network:'mainnet'});}
  const before=structuredClone(h.docs[0]);
  const response=await h.call('progress','/inventory',{action:'select',version:kind==='mainnet'?0:h.profile().version,skin:'grey-scout',color:'grey',shipStage:3},{network:kind==='mainnet'?'mainnet':'testnet'});
  assert.equal(response.code,403,kind);assert.deepEqual(h.docs[0],before,kind);
 }
});

test('invalid stages, unowned paint and stale versions never change the confirmed selection',async()=>{
 const h=await prepared();upgrades(h);
 for(const stage of [0,4,1.5,'3',null])assert.equal((await choose(h,stage)).code,400);
 assert.equal((await choose(h,3,{color:'gold'})).code,403);
 assert.equal((await choose(h,3,{version:99})).code,409);
 assert.equal(h.profile().shipStage,1);
});

test('legacy accounts preserve highest-owned gameplay until an explicit stage is confirmed',async()=>{
 const h=await prepared();upgrades(h);delete h.profile().shipStage;
 const started=await h.call('hangar','/start',{action:'new',version:0,startKey:'legacy-stage-preserved-key',rulesVersion:2});
 assert.equal(started.code,200);assert.equal(started.body.shipStage,3);assert.equal(started.body.profile.shipStage,undefined);
 assert.equal((await choose(h,2)).code,200);assert.equal(h.profile().shipStage,2);
});
