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
test('purchased upgrades preserve prerequisites and never unlock another hull',()=>{
 assert.deepEqual(availableShipCards(ships,{},[],['ship_02_stage_3']),[]);
 assert.deepEqual(availableShipCards(ships,{'grey-scout':{grey:1}},[],['ship_02_stage_2','ship_02_stage_3']).map(c=>c.key),['grey-scout-1','grey-scout-2','grey-scout-3']);
});
