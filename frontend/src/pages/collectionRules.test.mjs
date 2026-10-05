import test from 'node:test';
import assert from 'node:assert/strict';
import {playerCardUnlocked} from './collectionRules.ts';
import {shipStories,playerShipStory} from './shipLore.ts';
import {shipCaptureLore} from './shipCaptureLore.ts';
test('ownership unlocks its Standard card; upgrades also require their hull',()=>{
 assert.equal(playerCardUnlocked('grey-scout',1,1,[],[]),false);
 assert.equal(playerCardUnlocked('grey-scout',1,1,['grey-scout'],[]),true);
 assert.equal(playerCardUnlocked('nova-wing',0,1,['grey-scout'],[]),false);
 assert.equal(playerCardUnlocked('grey-scout',1,2,['grey-scout'],[]),false);
 assert.equal(playerCardUnlocked('grey-scout',1,2,[],['ship_02_stage_2']),false);
 assert.equal(playerCardUnlocked('grey-scout',1,3,[],['ship_02_stage_3']),false);
 assert.equal(playerCardUnlocked('grey-scout',1,3,['grey-scout'],['ship_02_stage_2','ship_02_stage_3']),true);
 assert.equal(playerCardUnlocked('nova-wing',0,2,[],['ship_02_stage_2']),false);
});
test('20 distinct origins and captures; upgrades do not repeat base histories',()=>{
 const ids=Object.keys(shipStories);assert.equal(ids.length,20);assert.deepEqual(Object.keys(shipCaptureLore).sort(),[...ids].sort());
 for(const de of [true,false]){
  const origins=ids.map(id=>playerShipStory(id,1,de)[0]);
  const captures=ids.map(id=>playerShipStory(id,1,de)[1]);
  assert.equal(new Set(origins).size,20);assert.equal(new Set(captures).size,20);
  for(const stage of [2,3]){const stories=ids.map(id=>playerShipStory(id,stage,de));assert.equal(new Set(stories.map(s=>s[0])).size,20);for(const story of stories){assert(!origins.includes(story[0]));assert.equal(story.length,3);}}
 }
});
