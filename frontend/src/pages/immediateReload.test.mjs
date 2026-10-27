import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectionHost} from '../../scripts/weaponReloadRecoveryHost.mjs';
import {componentHost} from '../../scripts/componentTestHost.mjs';
import {languages,translate} from '../i18n.ts';
import {weaponSymbols} from './weaponSymbols.ts';

test('a real automatic response confirms immediately during active combat without any binary notice',async()=>{
 const f=selectionHost();let release;f.env.beforePost=()=>new Promise(resolve=>{release=resolve;});
 const pending=f.selectWeaponLevel(2,true);await f.flush();assert.equal(f.env.confirmedReload,undefined);assert.equal(f.env.weaponSpentRef.current,null);
 release();await pending;assert.equal(f.env.confirmedReload,2);assert.deepEqual(f.env.confirmedReloadRef.current,{level:2,remainingMs:6000});assert.equal(f.state.weaponSource,'paid');assert.equal(f.state.status,'playing');assert.equal(f.requests.length,1);
});
test('a manual confirmed charge gets immediate feedback inside the pause and cannot resume combat',async()=>{
 const f=selectionHost();f.openWeaponSelection();await f.selectWeaponLevel(2);
 assert.equal(f.env.confirmedReload,2);assert.equal(f.state.status,'paused');
 const menu=f.env.weaponMenuOpen;assert.equal(menu,true);
});
test('cached selections, failed/zero/invalid confirmations and replaced runs never announce a new loaded charge',async()=>{
 const cached=selectionHost();cached.openWeaponSelection();cached.state.weaponTimers[2]=1234;await cached.selectWeaponLevel(2);assert.equal(cached.env.confirmedReload,undefined);assert.equal(cached.requests.length,0);
 for(const remaining of [0,NaN]){const f=selectionHost();f.env.confirmedMs=remaining;await f.selectWeaponLevel(2,true);assert.equal(f.env.confirmedReload,undefined);}
 const failed=selectionHost();failed.env.beforePost=()=>{throw Error('isolated rejection');};await failed.selectWeaponLevel(2,true);assert.equal(failed.env.confirmedReload,undefined);
 const replaced=selectionHost();replaced.env.beforePost=()=>{replaced.env.scoreRunRef.current='next-run';};await replaced.selectWeaponLevel(2,true);assert.equal(replaced.env.confirmedReload,undefined);
});
test('the actual status clock uses existing playing frames and freezes through manual/technical pauses',()=>{
 const source=readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
 const a=source.indexOf('      if (state.status === "playing") {\n        simulatedMs += delta;'),b=source.indexOf('        // Keep the final bonus explosion',a);
 assert.ok(a>0&&b>a);const run=new Function('env','with(env){'+source.slice(a,b)+'}}');
 const env={state:{status:'paused'},simulatedMs:0,delta:5000,confirmedReloadRef:{current:{level:2,remainingMs:6000}},setConfirmedReload:level=>{env.level=level;}};
 run(env);assert.equal(env.confirmedReloadRef.current.remainingMs,6000);env.state.status='playing';run(env);assert.equal(env.confirmedReloadRef.current.remainingMs,1000);env.delta=1000;run(env);assert.equal(env.level,null);assert.equal(env.confirmedReloadRef.current,null);
});
test('the passive confirmation has translated readable text and original shop symbols, without actions or animations',()=>{
 for(const locale of Object.keys(languages))for(const level of [2,3,4,5]){
  const h=componentHost('src/pages/ReloadConfirmation.tsx','ReloadConfirmation',{level},{useLocale:()=>({t:key=>translate(locale,key)}),weaponSymbols});
  assert.equal(h.nodes()[0].props.role,'status');assert.equal(h.nodes().find(n=>n.type==='span').props.children.join(''),translate(locale,'Weapon reloaded'));
  assert.equal(h.nodes().find(n=>n.type==='i').props.children[0],weaponSymbols[level]);assert.equal(h.nodes().some(n=>['button','a'].includes(n.type)),false);h.unmount();
 }
});
