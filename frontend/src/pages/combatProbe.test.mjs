import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createCombatProbe, recordGameDiagnostic, GAME_DIAGNOSTICS_KEY } from './gameDiagnostics.ts';
import { shipFireInterval, makeShipVolley } from './shipAttributes.ts';
import { MAX_PLAYER_SHOTS } from './playerCombat.ts';
import { stageWeaponLevel } from './shipEvolution.ts';

const context=()=>({reason:'performance',errorName:'',sector:30,block:9,phase:'ATTACK_CYCLE',encounter:'boss-fight',status:'playing',width:390,height:760,browser:'test',build:'test-build',lastSavedAt:1791940000000,uid:'must-not-export',token:'must-not-export'});
const resources=()=>({painted:12,estimatedBytes:1234,sources:8,pending:6,jobsStarted:12,jobsFinished:6,materialTotalMs:40,materialMaxMs:9});

function firingFixture(frameMs,atCap=false,enabled=true) {
  const source=fs.readFileSync('src/pages/GamePage.tsx','utf8');
  const start=source.indexOf('        if (transitionPaused) fireTimerRef.current = 0;');
  const end=source.indexOf('        const remainingShots:',start);assert.ok(start>0&&end>start);
  const script=new vm.Script('{'+source.slice(start,end)+'}');
  const reports=[];let volleys=0;
  const probe=createCombatProbe({context,resources,report:entry=>reports.push(entry),now:()=>0});
  const scope={transitionPaused:false,fireTimerRef:{current:0},state:{rapidFireMs:0,weaponLevel:1,shots:[],player:{x:.5,y:.85},overdriveMs:0},shipSelectionRef:{current:{skin:{id:'grey-scout'}}},shipStageRef:{current:1},shipFireInterval,stageWeaponLevel,MAX_PLAYER_SHOTS,makeShipVolley,nextIdRef:{current:1},width:390,height:760,playerMuzzleRef:{current:0},soundRef:{current:{play(){volleys++;}}},combatProbeRef:{current:enabled?probe:null},time:0,delta:0};
  vm.createContext(scope);
  for(let time=frameMs;time<=9600;time+=frameMs) {
    scope.time=time;scope.delta=Math.min(34,frameMs);scope.state.shots=atCap?Array(28).fill({}):[];
    script.runInContext(scope);
    if(enabled)probe.frame(time,frameMs,scope.delta,2,true,true,scope.state.shots.length,0,0,0);
  }
  probe.finish(9600);return {volleys,reports};
}

test('real GamePage firing block is unchanged with probe on/off and records discarded time',()=>{
  for(const [frameMs,count] of [[16,30],[50,20],[100,10]]) {
    const enabled=firingFixture(frameMs),disabled=firingFixture(frameMs,false,false);
    assert.equal(enabled.volleys,count);assert.equal(disabled.volleys,count);
    const sample=enabled.reports[0].shooting;assert.equal(sample.volleys,count);
    assert.equal(sample.capBlocks,0);assert.equal(sample.expectedIntervalMs,320);
    assert.equal(sample.discardedMs,frameMs>34?9600/frameMs*(frameMs-34):0);
    assert.equal(enabled.reports[0].lastSavedAt,1791940000000);
    assert.ok(!JSON.stringify(enabled.reports).includes('must-not-export'));
  }
});

test('projectile-cap blocking is distinguishable from timer/frame slowdown',()=>{
  const result=firingFixture(16,true);const sample=result.reports[0].shooting;
  assert.equal(result.volleys,0);assert.equal(sample.volleys,0);assert.equal(sample.attempts,30);
  assert.equal(sample.capBlocks,30);assert.equal(sample.ownShotsPeak,28);assert.equal(sample.discardedMs,0);
});

test('pause, transitions and weapon changes do not create false long shot gaps',()=>{
  const reports=[],probe=createCombatProbe({context,resources,report:entry=>reports.push(entry),now:()=>0});
  probe.frame(100,0,0,0,true,true,0,0,0,0);probe.attempt(320,false);probe.shot(320,1);
  probe.shot(640,1);probe.suspend(700);
  probe.frame(100000,0,0,0,true,true,0,0,0,0);probe.shot(100000,1);
  probe.attempt(220,false);probe.shot(100220,2);probe.shot(100440,2);
  probe.frame(100450,10,10,1,true,false,0,0,0,0);probe.shot(101000,1);probe.finish(101100);
  assert.equal(reports[0].shooting.gapMaxMs,320);assert.equal(reports[1].shooting.gapMaxMs,220);
  assert.equal(reports[1].shooting.intervalChanges,1);
});

test('samples reuse the twenty-record ring and keep only twelve recent gaps',()=>{
  const data=new Map();let writes=0;
  const storage={getItem:key=>data.get(key)||null,setItem(key,value){writes++;data.set(key,value);}};
  const probe=createCombatProbe({context,resources,report:entry=>recordGameDiagnostic(entry,storage),now:()=>0});
  for(let time=0;time<=300000;time+=16) {
    if(time%320===0){probe.attempt(320,false);probe.shot(time,1);}
    probe.frame(time,16,16,1,true,true,1,1,1,1);
  }
  probe.finish(300000);
  const entries=JSON.parse(data.get(GAME_DIAGNOSTICS_KEY));assert.equal(entries.length,20);
  assert.ok(writes<=31,'no per-frame localStorage writes');
  assert.ok(entries.every(entry=>entry.shooting.recentGapsMs.length<=12));
});

test('denied storage or failing optional providers cannot interrupt combat',()=>{
  const probe=createCombatProbe({context,resources:()=>{throw Error('optional');},report:()=>{throw Error('storage denied');},now:()=>0});
  assert.doesNotThrow(()=>{for(let time=0;time<=11000;time+=50)probe.frame(time,50,34,2,true,true,0,0,0,0);probe.finish(11000);});
});
