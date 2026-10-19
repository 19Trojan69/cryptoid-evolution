import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createLevelSummaryGate} from './levelSummaryGate.ts';
import {advanceAfterClear} from './sectorBoss.ts';
const source=fs.readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
const file=ts.createSourceFile('GamePage.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let simulate;
function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(file)==='simulate')simulate=node.initializer;ts.forEachChild(node,visit);}
visit(file);assert.ok(simulate);
const clearNode=simulate.body.statements.find(n=>ts.isIfStatement(n)&&n.expression.getText(file)==='state.status === "playing"').thenStatement.statements.find(n=>ts.isIfStatement(n)&&n.expression.getText(file)==='state.phase === "SECTOR_CLEAR"');
assert.ok(clearNode);
const compile=body=>new vm.Script(ts.transpileModule('(function(time){'+body+'})', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText);
const clearScript=compile(clearNode.getText(file));
const stepScript=compile(simulate.body.statements.map(n=>n.getText(file)).join('\n'));
function host(sector=20,encounter='bonus'){
 const state={sector,section:sector,encounter,phase:'SECTOR_CLEAR',status:'playing',effects:[],rockEffects:[],powerUps:[{id:1,type:'shield',y:.4}],combo:{pendingAt:null,level:3,total:4},hearts:3,score:100,shards:20,weaponTimers:[0,0,30000],pickupWeaponMs:15000,purchasedShieldMs:12000};
 const events=[],gate=createLevelSummaryGate();
 const scope={state,stateRef:{current:state},delta:34,timing:{clearMs:8500},levelSummaryGate:gate,clearTimerRef:{current:8500},ownerDiagnostics:false,musicRef:{current:null},BOSS_CLEAR_DURATION_MS:9350,MAX_DIFFICULTY_LEVEL:500,BOSS_FALL_DURATION_MS:5000,BOSS_VICTORY_START_MS:5650,bossLifeRemainingRef:{current:0},pendingBossCardRef:{current:null},clearControls:()=>events.push('controls-cleared'),setGame:()=>events.push('paint'),recordsSavedRef:{current:false},adminRunRef:{current:false},scoreRunRef:{current:null},saveRecords:()=>events.push('save-records'),submitScore:()=>events.push('submit-score'),advanceAfterClear:(...args)=>{events.push('advance');return advanceAfterClear(...args);},combatVarietyEnabled:true,intro:{},width:430,height:825,visibleTop:0,playerDiameterRef:{current:40},createFormationSlots:()=>[],lastFrameRef:{current:1000}};
 for(const name of ['dropsCreated','waveComplete','formationIndex','formationStarted','flight','formationOffset','bonusIndex','sectionSlots','bossEscortSlots','bossEscortWave','bossEscortSpawned','bossEscortTimer','spawnTimer','sectionElapsed','attackCooldown'])scope[name+'Ref']={current:0};
 const context=vm.createContext(scope);
 return {state,gate,scope,events,clear:()=>clearScript.runInContext(context)(10000),step:time=>stepScript.runInContext(context)(time)};
}
test('actual clear loop waits for all effects, then commits the readable summary once',()=>{
 const h=host();for(const key of ['asteroids','bonusTargets','rocks','shots','enemyShots'])h.state[key]=[{id:99}];h.state.boss={id:2};
 h.state.effects=[{id:1}];h.clear();assert.equal(h.gate.ready(h.state),false);assert.deepEqual(h.events,[]);
 h.state.effects=[];h.state.rockEffects=[{id:2}];h.clear();assert.equal(h.gate.ready(h.state),false);
 h.state.rockEffects=[];h.clear();assert.equal(h.gate.waiting(h.state),true);assert.deepEqual(h.events,['controls-cleared','paint']);
 assert.equal(h.state.sector,20);assert.equal(h.state.phase,'SECTOR_CLEAR');
 for(const key of ['asteroids','bonusTargets','rocks','shots','enemyShots'])assert.equal(h.state[key].length,0);
 assert.equal(h.state.boss,null);assert.equal(h.scope.sectionSlotsRef.current,null);assert.equal(h.scope.bossEscortSlotsRef.current,null);assert.equal(h.state.powerUps.length,1);
});
test('actual simulation does zero scene commits or state work over 10000 waiting frames; clocks and carried pickups are preserved',()=>{
 const h=host();h.clear();const before=JSON.stringify(h.state),timer=h.scope.clearTimerRef.current;
 for(let frame=1;frame<=10000;frame++)h.step(10000+frame*34);
 assert.equal(JSON.stringify(h.state),before);assert.equal(h.scope.clearTimerRef.current,timer);assert.deepEqual(h.events,['controls-cleared','paint']);
 assert.equal(h.scope.lastFrameRef.current,350000);
});
test('Continue is gated, double click safe and advances exactly once with carried pickups and weapons',()=>{
 const h=host();assert.equal(h.gate.request(h.state),false);h.clear();
 h.state.status='paused';assert.equal(h.gate.request(h.state),false);h.state.status='playing';
 assert.equal(h.gate.request(h.state),true);assert.equal(h.gate.request(h.state),false);h.clear();h.clear();
 assert.equal(h.events.filter(e=>e==='advance').length,1);assert.equal(h.state.sector,21);assert.equal(h.state.phase,'SECTOR_INTRO');
 assert.equal(h.state.powerUps[0].id,1);assert.equal(h.state.weaponTimers[2],30000);assert.equal(h.state.pickupWeaponMs,15000);assert.equal(h.state.purchasedShieldMs,12000);assert.equal(h.state.score,100);assert.equal(h.state.shards,20);assert.equal(h.gate.ready(h.state),false);
});
test('final campaign summary requires Continue and score submission remains once',()=>{
 const h=host(500);h.clear();assert.ok(!h.events.includes('submit-score'));assert.equal(h.state.status,'playing');
 h.gate.request(h.state);h.clear();assert.equal(h.state.status,'victory');assert.equal(h.events.filter(e=>e==='submit-score').length,1);assert.equal(h.events.filter(e=>e==='save-records').length,1);assert.equal(h.gate.request(h.state),false);
});
test('normal blocks retain automatic advancement and restart clears a previous request',()=>{
 const h=host(1,'normal');h.clear();assert.equal(h.state.sector,2);assert.equal(h.state.phase,'SECTOR_INTRO');assert.equal(h.events.filter(e=>e==='advance').length,1);
 const gate=createLevelSummaryGate(),state={sector:20,encounter:'bonus',phase:'SECTOR_CLEAR',status:'playing'};
 gate.settle(state);gate.request(state);gate.reset();assert.equal(gate.ready(state),false);gate.settle(state);assert.equal(gate.waiting(state),true);
});
test('boss clear still advances automatically after the existing physical heart and victory gates',()=>{
 const h=host(20,'boss-clear');
 Object.assign(h.scope,{bossDestroyPlayedRef:{current:true},bossVictoryPendingRef:{current:false},collectBossHeart:()=>false});
 h.scope.clearTimerRef.current=10000;h.clear();assert.equal(h.state.encounter,'boss-clear');assert.equal(h.gate.ready(h.state),false);
 h.state.bossHeartCollected=true;h.clear();assert.equal(h.state.encounter,'bonus');assert.equal(h.state.phase,'SECTOR_INTRO');assert.equal(h.state.sector,20);assert.equal(h.events.filter(e=>e==='advance').length,1);
});
