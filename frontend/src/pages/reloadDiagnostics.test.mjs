import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { RELOAD_TRACE_KEY, freezeGap, recordApplicationBoot, reloadErrorName } from './reloadDiagnostics.ts';

const store = () => {
  const values = new Map();
  return { getItem:key=>values.has(key)?values.get(key):null, setItem:(key,value)=>values.set(key,value), values };
};
const context = {reason:'performance',errorName:'',sector:20,block:10,phase:'ATTACK_CYCLE',encounter:'boss-fight',status:'playing',width:430,height:825,browser:'private-browser',enemies:0,projectiles:5,effects:0,bossId:2,bossHealth:300,bossMaxHealth:900,liveTurrets:1,totalTurrets:4,reactorOpen:false};
test('app boot records an active prior combat without retaining account or browser fields',()=>{
  const localStorage=store(), sessionStorage=store();
  sessionStorage.setItem('cryptoid_game_session_v1',JSON.stringify({context:{...context,username:'private-user'},active:true,hidden:false,pageHidden:false,at:1000}));
  const host={localStorage,sessionStorage,location:{pathname:'/'},performance:{getEntriesByType:()=>[{type:'reload'}]},crypto:{randomUUID:()=> 'boot-b'}};
  recordApplicationBoot(host,{now:()=>1500,bootId:'boot-b'});
  const events=JSON.parse(sessionStorage.getItem(RELOAD_TRACE_KEY));
  assert.deepEqual(events.map(event=>event.kind),['app-boot','boot-after-active-session']);
  assert.equal(events[1].source,'session-marker');assert.equal(events[1].context.sector,20);assert.equal(events[1].context.bossHealth,300);
  assert.ok(!JSON.stringify(events).includes('private-user'));assert.ok(!JSON.stringify(events).includes('private-browser'));
});
test('freeze detector reports only visible active gaps at or above threshold',()=>{
  assert.equal(freezeGap(1000,1499,true,true),0);
  assert.equal(freezeGap(1000,1500,true,true),500);
  assert.equal(freezeGap(1000,2400,true,true),1400);
  assert.equal(freezeGap(1000,2400,false,true),0);
  assert.equal(freezeGap(1000,2400,true,false),0);
});
test('error names are allowlisted and raw custom names are not retained',()=>{
  assert.equal(reloadErrorName(new TypeError('private message')),'TypeError');
  const error=new Error('private message');error.name='SecretAccountError';
  assert.equal(reloadErrorName(error),'UnknownError');
});

test('v2 runtime collection is wired only to the verified owner game entry',()=>{
  const main=fs.readFileSync(new URL('../main.tsx',import.meta.url),'utf8');
  const game=fs.readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
  assert.ok(!main.includes('installReloadDiagnostics'));
  assert.ok(game.includes('return <GamePage ownerDiagnostics={canAdmin} />'));
  assert.ok(game.includes('if (ownerDiagnostics) installReloadDiagnostics();'));
  assert.ok(game.includes('ownerDiagnostics ? createReloadGameMonitor(diagnosticContext) : null'));
  assert.ok(game.includes("if (ownerDiagnostics) recordReloadEvent(reason, error)"));
});
