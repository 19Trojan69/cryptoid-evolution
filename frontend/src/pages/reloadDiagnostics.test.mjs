import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { RELOAD_TRACE_KEY, RESOURCE_TREND_KEY, RESOURCE_TREND_INTERVAL_MS, appendReloadEvent, appendResourceTrendSample, createResourceTrendMonitor, freezeGap, recordApplicationBoot, reloadErrorName } from './reloadDiagnostics.ts';

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

test('runtime collection is wired only to a verified diagnostic-capable game entry',()=>{
  const main=fs.readFileSync(new URL('../main.tsx',import.meta.url),'utf8');
  const game=fs.readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
  assert.ok(!main.includes('installReloadDiagnostics'));
  assert.ok(game.includes('return <GamePage ownerDiagnostics={canAdmin || canDiagnostics} />'));
  assert.ok(game.includes('if (ownerDiagnostics) installReloadDiagnostics();'));
  assert.ok(game.includes('ownerDiagnostics ? createReloadGameMonitor(diagnosticContext) : null'));
  assert.ok(game.includes('ownerDiagnostics ? createResourceTrendMonitor(ownerResourceContext) : null'));
  assert.ok(game.includes("if (ownerDiagnostics) recordReloadEvent(reason, error)"));
});

test('resource snapshots retain only typed technical counters in the local trace',()=>{
  const localStorage=store(),sessionStorage=store();
  const host={localStorage,sessionStorage,crypto:{randomUUID:()=> 'boot-v3'}};
  appendReloadEvent(host,'resource-bonus-start',{...context,phase:'SECTOR_INTRO',encounter:'bonus',
    jsHeapBytes:1000000,domNodes:800,paintedEntries:12,paintedBytes:4000000,canvasCacheBytes:2000000,
    audioState:'running',audioVoices:4,audioBufferBytes:3000000,estimatedResourceBytes:9000000,
    username:'private-user',stack:'private-stack'});
  const event=JSON.parse(localStorage.getItem(RELOAD_TRACE_KEY))[0];
  assert.equal(event.kind,'resource-bonus-start');assert.equal(event.context.paintedEntries,12);
  assert.equal(event.context.audioState,'running');assert.equal(event.context.estimatedResourceBytes,9000000);
  assert.ok(!JSON.stringify(event).includes('private-user'));assert.ok(!JSON.stringify(event).includes('private-stack'));
});

test('v3 transition snapshots remain wired only inside verified owner gameplay',()=>{
  const game=fs.readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
  assert.ok(game.includes("recordOwnerResourceSnapshot('resource-boss-clear')"));
  assert.ok(game.includes("recordOwnerResourceSnapshot('resource-bonus-start')"));
  assert.ok(game.includes("recordOwnerResourceSnapshot('resource-normal-start')"));
  assert.ok(game.includes("recordOwnerResourceSnapshot('resource-formation-ready')"));
  assert.ok(game.includes('if (ownerDiagnostics) recordReloadSnapshot(kind, ownerResourceContext())'));
});

test('v4 resource trend stores only sanitized authorized diagnostic context and stays bounded',()=>{
  const localStorage=store(),sessionStorage=store();
  const host={localStorage,sessionStorage,crypto:{randomUUID:()=> 'boot-v4'}};
  for(let i=0;i<100;i++) appendResourceTrendSample(host,{...context,sector:Math.min(500,i+1),
    jsHeapBytes:1000000+i,paintedBytes:4000000,canvasCacheBytes:2000000,audioBufferBytes:3000000,
    estimatedResourceBytes:9000000,username:'private-user',stack:'private-stack'},()=>1000+i*10000);
  const samples=JSON.parse(localStorage.getItem(RESOURCE_TREND_KEY));
  assert.equal(samples.length,90);assert.equal(samples.at(-1).context.sector,100);
  assert.equal(samples.at(-1).context.estimatedResourceBytes,9000000);
  assert.ok(!JSON.stringify(samples).includes('private-user'));assert.ok(!JSON.stringify(samples).includes('private-stack'));
});

test('v4 resource trend monitor samples active visible play every ten seconds and stops cleanly',()=>{
  const localStorage=store(),sessionStorage=store();let timer,interval,cleared=false,now=1000;
  const host={localStorage,sessionStorage,crypto:{randomUUID:()=> 'boot-v4-monitor'},document:{hidden:false},
    location:{pathname:'/game'},performance:{getEntriesByType:()=>[{type:'navigate'}]},
    setInterval:(fn,ms)=>{timer=fn;interval=ms;return 7;},clearInterval:id=>{assert.equal(id,7);cleared=true;}};
  let status='playing';
  const monitor=createResourceTrendMonitor(()=>({...context,status,jsHeapBytes:1200000,estimatedResourceBytes:7000000}),host,{now:()=>now,setInterval:host.setInterval,clearInterval:host.clearInterval});
  assert.equal(interval,RESOURCE_TREND_INTERVAL_MS);
  assert.equal(JSON.parse(localStorage.getItem(RESOURCE_TREND_KEY)).length,1);
  now+=10000;timer();assert.equal(JSON.parse(localStorage.getItem(RESOURCE_TREND_KEY)).length,2);
  status='paused';now+=10000;timer();assert.equal(JSON.parse(localStorage.getItem(RESOURCE_TREND_KEY)).length,2);
  monitor.finish();assert.equal(cleared,true);
});
