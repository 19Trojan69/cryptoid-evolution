import test from 'node:test';
import assert from 'node:assert/strict';
import {componentHost} from '../../scripts/componentTestHost.mjs';
import {LEVEL_COMPLETION_QUIET_MS,LEVEL_COMPLETION_REVEAL_MS,advanceCompletionQuiet} from './levelCompletionEntrance.ts';
import {advanceSummaryVisibility,canContinueBossSummary,BOSS_SUMMARY_VISIBLE_MS} from './bossSummaryTiming.ts';

test('the quiet beat begins only after the last effect and cannot accumulate through another explosion',()=>{
  assert.equal(advanceCompletionQuiet(0,2250,1),0);
  assert.equal(advanceCompletionQuiet(0,500,0),500);
  assert.equal(advanceCompletionQuiet(500,16,1),0);
  assert.equal(advanceCompletionQuiet(0,899,0),899);
  assert.equal(advanceCompletionQuiet(899,16,0),LEVEL_COMPLETION_QUIET_MS);
  assert.equal(advanceCompletionQuiet(0,-10,0),0);
});
for(const reduced of [false,true])test(`the real completion counts ten visible seconds after ${reduced?'reduced-motion arrival':'the full entrance'}`,()=>{
  let now=0,interval,continued=0;
  const h=componentHost('src/pages/LevelCompletion.tsx','LevelCompletion',{
    summary:{stage:10,score:100,shards:12,destroyed:10,hearts:3,combos:2},name:'GENESIS BELT',headline:'LEVEL 1 COMPLETE',bonusHits:12,bonusResult:'+18 SHARDS',bonusPoints:3000,bonusHeart:true,
    prepared:true,saving:false,failed:false,continuing:false,onRetry(){},onContinue(){continued++;},
  },{
    BlockchainProgress:()=>null,BLOCKS_PER_CHAIN:9,useLocale:()=>({t:s=>s,locale:'en'}),advanceSummaryVisibility,canContinueBossSummary,BOSS_SUMMARY_VISIBLE_MS,LEVEL_COMPLETION_REVEAL_MS,
    HTMLElement:class{},document:{hidden:false,activeElement:null,addEventListener(){},removeEventListener(){}},performance:{now:()=>now},
    window:{matchMedia:()=>({matches:reduced}),setInterval(fn){interval=fn;return 1;},clearInterval(){interval=null;}},
  });
  const advance=ms=>{for(let i=0;i<ms;i+=250){now+=250;interval();h.render();}};
  const button=()=>h.nodes().find(n=>n.type==='button'&&n.props.children.includes('Continue game'));
  advance(reduced?9750:11000);assert.equal(button().props.disabled,true);
  advance(250);assert.equal(button().props.disabled,false);
  assert.equal(continued,0);button().props.onClick();assert.equal(continued,1);
  h.unmount();assert.equal(interval,null);
});

test('actual block and boss transition guards wait for every ending effect; bonus still needs explicit Continue', async()=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
  const expression=source.match(/const clearFinished = ([\s\S]*?);/)[1];
  const ready=new Function('env','with(env){return '+expression+';}');
  const env={state:{encounter:'normal',effects:[{}],rockEffects:[]},clearTimerRef:{current:100000},BOSS_CLEAR_DURATION_MS:10000,timing:{clearMs:2000},victoryStillPlaying:false,bossSummaryRef:{current:{accepted:false}}};
  assert.equal(ready(env),false);env.state.effects=[];env.state.rockEffects=[{}];assert.equal(ready(env),false);
  env.state.rockEffects=[];assert.equal(ready(env),true);env.state.encounter='boss-clear';env.state.effects=[{}];assert.equal(ready(env),false);
  env.state.effects=[];assert.equal(ready(env),true);env.state.encounter='bonus';assert.equal(ready(env),false);env.bossSummaryRef.current.accepted=true;assert.equal(ready(env),true);
});
