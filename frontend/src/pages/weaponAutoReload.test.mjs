import {test} from 'node:test';
import assert from 'node:assert/strict';
import {autoReloadKey,parseAutoReload,shouldAutoReload} from './weaponAutoReload.ts';
test('reload is off by default and isolates account and network preferences',()=>{
 assert.equal(parseAutoReload(null)[2],false);
 assert.deepEqual(parseAutoReload('{broken'),{});
 assert.equal(parseAutoReload('{"2":"true","3":true}')[2],false);
 assert.equal(parseAutoReload('{"2":"true","3":true}')[3],true);
 assert.notEqual(autoReloadKey('testnet','a'),autoReloadKey('mainnet','a'));
 assert.notEqual(autoReloadKey('testnet','a'),autoReloadKey('testnet','b'));
});
test('only the selected expired paid weapon with its own stock reloads',()=>{
 const prefs={2:true,3:false},stock={weapon_twin:2,weapon_rapid_twin:5};
 const check=(level=2,source='paid',before=10,after=0,allowed=true,s=stock)=>shouldAutoReload(level,source,before,after,prefs,s,allowed);
 assert.equal(check(),true);
 assert.equal(check(3),false);
 assert.equal(check(2,'pickup'),false);
 assert.equal(check(2,'standard'),false);
 assert.equal(check(2,'paid',0),false);
 assert.equal(check(2,'paid',10,1),false);
 assert.equal(check(2,'paid',10,0,false),false);
 assert.equal(check(2,'paid',10,0,true,{weapon_twin:0,weapon_rapid_twin:5}),false);
});
