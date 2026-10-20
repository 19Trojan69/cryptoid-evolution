import test from 'node:test';
import assert from 'node:assert/strict';
import { bossExplosionBudget, BOSS_IMPACT_RASTER_BUDGET, activateBossExplosion, bossExplosionReady } from './bossExplosionBudget.ts';
import { createSectorBoss, advanceAfterClear } from './sectorBoss.ts';
import { bossExplosionSize } from './bossCombat.ts';
import { collectBossHeart } from './bossReward.ts';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { bossFallTargetY } from './bossCombat.ts';
import { bossPoints, bossShardReward } from './shardEarnings.ts';
import { createDoubleKillCombo, creditComboDefeat } from './doubleKillCombo.ts';
test('all 50 bosses stay within the raster estimate on phone, tablet and desktop layouts',()=>{
  for(const [width,height] of [[320,600],[390,760],[430,900],[760,390],[768,1024],[1024,768],[1366,900],[2560,1440]])
    for(const ratio of [1,2,3,4])for(const reduced of [false,true])for(let id=1;id<=50;id++) {
      const boss=createSectorBoss(id*10,width,40,height);
      const budget=bossExplosionBudget(boss.width,boss.height,bossExplosionSize(boss.config,boss.width),width,height,ratio,reduced);
      assert.ok(budget.estimatedRasterBytes<=BOSS_IMPACT_RASTER_BUDGET+1);
      assert.ok([0,4,8,16].includes(budget.fragments));
      assert.ok(budget.diameter>0&&budget.diameter<=width*1.3);
      if(width<=700||ratio>1.5)assert.ok(budget.fragments<=8&&budget.fireSites===4);
      if(reduced)assert.ok(budget.fragments<=4);
    }
});
test('invalid geometry remains finite and bounded',()=>{
  const budget=bossExplosionBudget(NaN,Infinity,-1,0,NaN,Infinity);
  assert.ok(Number.isFinite(budget.diameter)&&budget.estimatedRasterBytes<=BOSS_IMPACT_RASTER_BUDGET);
});
test('the final blast is not mounted during descent and activates once at the existing deadline',()=>{
  const effect={kind:'boss-explosion',startedAt:1000,finalDelayMs:5000};
  assert.equal(bossExplosionReady(effect),false);
  assert.equal(activateBossExplosion(effect,5999),effect);
  const active=activateBossExplosion(effect,6000);
  assert.equal(bossExplosionReady(active),true);
  assert.equal(active.startedAt,6000);assert.equal(active.finalDelayMs,0);
  assert.equal(activateBossExplosion(active,6034),active);
  assert.equal(active.startedAt+3400,effect.startedAt+effect.finalDelayMs+3400);
});
test('pausing during descent shifts the blast timeline without adding a second delay',()=>{
  const effect={kind:'boss-explosion',startedAt:1000+20000,finalDelayMs:5000};
  assert.equal(activateBossExplosion(effect,25999),effect);
  const active=activateBossExplosion(effect,26000);
  assert.equal(active.startedAt,26000);assert.equal(bossExplosionReady(active),true);
  const ordinary={kind:'explosion',startedAt:1000};assert.equal(activateBossExplosion(ordinary,6000),ordinary);
});
test('presentation changes do not alter boss pickups or boss-to-bonus progression across all levels',()=>{
  for(let id=1;id<=50;id++)for(const hearts of [1,2,3]) {
    const state={hearts,maxHearts:3,shards:0};
    assert.equal(collectBossHeart(state,{x:.1,y:.9},390,760),false);
    assert.equal(collectBossHeart(state,{x:.5,y:.58},390,760),true);
    assert.equal(state.hearts,Math.min(3,hearts+1));assert.equal(state.shards,hearts===3?5:0);
    assert.equal(collectBossHeart(state,{x:.5,y:.58},390,760),false);
    const next=advanceAfterClear(id*10,'boss-clear');
    assert.equal(next.encounter,'bonus');assert.equal(next.sector,id*10);
  }
});
test('actual GamePage boss destruction saves the waiting reward and installs the bounded delayed blast',async()=>{
  const source=fs.readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
  const ast=ts.createSourceFile('GamePage.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let declaration;
  const visit=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='destroyBoss')declaration=node.getText(ast);ts.forEachChild(node,visit);};visit(ast);
  assert.ok(declaration);
  for(let id=1;id<=50;id++) for(const combatVarietyEnabled of [false,true]) {
    let saved; const lifecycle=[];
    const state={boss:createSectorBoss(id*10,390,40,760),sector:id*10,hearts:2,maxHearts:3,score:0,shards:0,destroyed:0,combo:createDoubleKillCombo(),effects:[],asteroids:[],enemyShots:[{}],shots:[{}],powerUps:[{}]};
    const context={ownerDiagnostics:false,combatVarietyEnabled,performanceProbeRef:{current:{lifecycle:kind=>lifecycle.push(kind)}},Image:class {},bossExplosionBudget,bossExplosionSize,bossFallTargetY,bossPoints,bossShardReward,creditComboDefeat,
      BOSS_FALL_DURATION_MS:5000,soundRef:{current:null},fieldSizeRef:{current:{width:390,height:760}},
      window:{devicePixelRatio:3,matchMedia:()=>({matches:false})},document:{documentElement:{dataset:{}}},nextIdRef:{current:1},
      gameHaptics:{explosion(){},boss(){}},bossDestroyPlayedRef:{current:true},bossVictoryPendingRef:{current:false},bossVictoryFinishedRef:{current:true},
      clearTimerRef:{current:100},elapsedRef:{current:1000},saveCombat:async()=>{saved=structuredClone(state);},setSaveNotice(){}};
    vm.runInNewContext(ts.transpileModule('const '+declaration+';globalThis.run=destroyBoss;', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
    context.run(state,1000);await Promise.resolve();
    assert.deepEqual(lifecycle,['boss-defeat-start','boss-defeat-complete']);
    assert.equal(state.encounter,'boss-clear');assert.equal(state.phase,'SECTOR_CLEAR');assert.equal(state.boss,null);
    assert.equal(saved.hearts,2);assert.equal(saved.bossHeartCollected,false);assert.equal(saved.encounter,'boss-clear');
    assert.equal(state.enemyShots.length,0);assert.equal(state.shots.length,0);
    assert.equal(state.powerUps.length,combatVarietyEnabled?1:0);
    assert.equal(JSON.stringify(saved.powerUps),JSON.stringify(state.powerUps));
    const effect=state.effects.find(effect=>effect.kind==='boss-explosion');
    assert.ok(effect.bossFragments<=8);assert.equal(effect.boundedBossImpact,true);assert.equal(bossExplosionReady(effect),false);
    assert.equal(bossExplosionReady(activateBossExplosion(effect,6000)),true);
  }
});
