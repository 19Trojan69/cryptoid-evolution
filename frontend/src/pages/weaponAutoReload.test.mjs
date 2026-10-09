import {test} from 'node:test';
import assert from 'node:assert/strict';
import {autoReloadKey,parseAutoReload,shouldAutoReload,nextActiveWeapon} from './weaponAutoReload.ts';
test('reload is off by default and isolates account and network preferences',()=>{
 assert.equal(parseAutoReload(null)[2],false);
 assert.deepEqual(parseAutoReload('{broken'),{});
 assert.equal(parseAutoReload('{"2":"true","3":true}')[2],false);
 assert.equal(parseAutoReload('{"2":"true","3":true}')[3],true);
 assert.notEqual(autoReloadKey('testnet','a'),autoReloadKey('mainnet','a'));
 assert.notEqual(autoReloadKey('testnet','a'),autoReloadKey('testnet','b'));
});
test('an expiring weapon switches to the strongest enabled live timer or the standard shot',()=>{
 const timers=[0,0,20_000,33_000,12_000,0];
 assert.deepEqual(nextActiveWeapon(timers,{2:true,3:false,4:true},1,0),{source:'paid',level:4});
 assert.deepEqual(nextActiveWeapon(timers,{2:true,3:false,4:false},1,0),{source:'paid',level:2});
 assert.deepEqual(nextActiveWeapon(timers,{2:false,3:false,4:false},1,0),{source:'standard',level:1});
 assert.deepEqual(nextActiveWeapon(timers,{2:true},3,7000),{source:'pickup',level:3});
 assert.deepEqual(nextActiveWeapon(timers,{2:true,4:true},3,7000),{source:'paid',level:4});
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
