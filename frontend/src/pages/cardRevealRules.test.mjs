import test from 'node:test';
import assert from 'node:assert/strict';
import {availableShipCards,unseenShipCards} from './cardRevealRules.ts';
const ships=[{id:'grey-scout',sprite:1},{id:'nova-wing',sprite:0}];
test('only owned starter hulls appear, in order, and confirmation suppresses repeats',()=>{
 const first=availableShipCards(ships,{'grey-scout':{grey:1}},[],[]);
 assert.deepEqual(first.map(c=>c.key),['grey-scout-1']);
 const both=availableShipCards(ships,{'grey-scout':{grey:1},'nova-wing':{gold:1}},[],[]);
 assert.deepEqual(both.map(c=>c.key),['grey-scout-1','nova-wing-1']);
 assert.deepEqual(unseenShipCards(both,['grey-scout-1']).map(c=>c.key),['nova-wing-1']);
 assert.equal(unseenShipCards(both,both.map(c=>c.key)).length,0);
});
test('unreleased upgrade cards stay hidden even with legacy purchases',()=>{
 assert.deepEqual(availableShipCards(ships,{},[],['ship_02_stage_3']),[]);
 assert.deepEqual(availableShipCards(ships,{'grey-scout':{grey:1}},[],['ship_02_stage_2','ship_02_stage_3']).map(c=>c.key),['grey-scout-1']);
});

import {bossCardAvailable,shipCardAvailable} from './cardAvailability.ts';
test('release limits keep prepared boss and ship cards locked',()=>{
 for(let id=1;id<=50;id++)assert.equal(bossCardAvailable(id),id<=3);
 for(let sprite=0;sprite<20;sprite++)for(const stage of [1,2,3])assert.equal(shipCardAvailable(sprite,stage),sprite<10&&stage===1);
 assert.equal(bossCardAvailable(0),false);
 assert.deepEqual(availableShipCards([{id:'twin-core',sprite:10}],{'twin-core':{grey:5}},['twin-core'],['ship_11_stage_2']),[]);
});
