import {completionSaveFailure} from '../src/pages/completionSaveFailure.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {transformSync} from 'esbuild';
import {componentHost} from './componentTestHost.mjs';
import {actualBackend} from './weaponReloadRecoveryHost.mjs';
import {advanceSummaryVisibility,canContinueBossSummary,BOSS_SUMMARY_VISIBLE_MS} from '../src/pages/bossSummaryTiming.ts';
import {ResourceCache} from '../src/pages/resourceCache.ts';
const summary={stage:10,score:100,shards:12,destroyed:10,hearts:3,combos:2};
const translate=(s,p={})=>s.replace(/\{(\w+)\}/g,(_,k)=>String(p[k]));
test('the actual statistics component waits ten visible prepared seconds and then waits indefinitely for a click',()=>{
 let now=0,interval,continued=0;const doc={hidden:false,activeElement:null,addEventListener(){},removeEventListener(){}};
 const h=componentHost('src/pages/LevelCompletion.tsx','LevelCompletion',{summary,name:"GENESIS BELT",headline:"LEVEL 1 COMPLETE",bonusHits:12,bonusResult:"+18 SHARDS",bonusPoints:3000,bonusHeart:true,prepared:false,saving:true,failed:false,continuing:false,onRetry(){},onContinue(){continued++;}}, {
  BlockchainProgress:()=>null,BLOCKS_PER_CHAIN:9,useLocale:()=>({t:translate,locale:'en'}),advanceSummaryVisibility,canContinueBossSummary,BOSS_SUMMARY_VISIBLE_MS,
  HTMLElement:class{},document:doc,performance:{now:()=>now},window:{setInterval(fn){interval=fn;return 1;},clearInterval(){interval=null;}},
 });
 const advance=ms=>{for(let t=0;t<ms;t+=250){now+=250;interval();h.render();}};
 const button=()=>h.nodes().find(n=>n.type==='button'&&n.props.children.includes('Continue game'));
 advance(10000);assert.equal(button().props.disabled,true,'saving time cannot unlock Continue');
 h.update({prepared:true,saving:false});advance(5000);doc.hidden=true;advance(30000);assert.equal(button().props.disabled,true);
 doc.hidden=false;advance(4750);assert.equal(button().props.disabled,true);advance(250);assert.equal(button().props.disabled,false);
 advance(60000);assert.equal(continued,0);button().props.onClick();assert.equal(continued,1);
 h.update({failed:true});assert.equal(button().props.disabled,true);h.unmount();assert.equal(interval,null);
});
async function handlers(){
 const {harness,firstMissionSnapshot}=await actualBackend(),h=harness();await h.call('progress','/me',null,{method:'GET'});
 const started=await h.call('hangar','/start',{action:'new',rulesVersion:2,version:h.profile().version,startKey:'boss-intermission-actual-0001'});
 const runId=started.body.scoreRunId;
 h.profile().mission={sector:11,phase:'normal',snapshot:{...firstMissionSnapshot(3),score:100,shards:12,destroyed:10},savedAt:new Date().toISOString()};
 const source=fs.readFileSync(new URL('../src/pages/GamePage.tsx',import.meta.url),'utf8');
 const block=source.slice(source.indexOf('  const beginBossSummary ='),source.indexOf('  const resumeSavedMission ='));
 const code=transformSync(block,{loader:'tsx'}).code,ref=current=>({current}),calls=[];
 const state={...summary,sector:10,combo:{total:2},status:'playing',weaponTimers:[0,0,0,0,0,0],unlockedWeapons:[1],effects:[1],shots:[1],enemyShots:[1],asteroids:[1],rocks:[1],rockEffects:[1],bonusTargets:[1]};
 const env={stateRef:ref(state),scoreRunRef:ref(runId),bossSummaryRef:ref(null),bossPreparationRef:ref(0),weaponMountedRef:ref(true),adminRunRef:ref(false),activationRef:ref(null),weaponBusyRef:ref(false),stockRef:ref({}),lastSavedAtRef:ref(0),lastFrameRef:ref(99),
  completionSaveFailure,hasLocalLevelBackup:()=>false,localExitAvailable:false,bossSummaryFailure:"",
  bossSummary:null,bossSummaryPrepared:false,bossSummarySaving:false,bossSummaryFailed:false,bossSummaryContinuing:false,bossSummaryContinueFailed:false,
  clearControls(){calls.push('controls');},soundRef:ref({setPaused(){calls.push('audio-pause');}}),musicRef:ref({pause(){}}),
  unlockAudioForResume(){calls.push('gesture');},ownerDiagnostics:true,sessionDiagnostic(kind,data){calls.push(data.operation||kind);},ownerResourceContext:()=>({effects:state.effects.length}),
  releaseIdleCanvasEffects(){calls.push('cleanup');return env.idle!==false;},releaseUnusedPaintedShips(){calls.push('unused');},syncSelectedWeapon(){},setWeaponStock(){},
  saveQueueRef:ref({async drain(){calls.push('drain');if(env.failSave)throw Error('offline');}}),
  async loadAccountSave(){calls.push('read-save');return(await h.call('progress','/me',null,{method:'GET'})).body.save;},
  axiosClient:{async post(path,body){calls.push(path);if(path==='/hangar/weapon/activate'){if(env.activationReply)return env.activationReply;throw {response:{status:409,data:{error:'save_before_activation'}}};}
   const res=await h.call('progress',path.replace('/progress',''),body);if(res.code>=400)throw{response:{status:res.code,data:res.body}};
   if(env.loseContinue&&path.endsWith('/continue'))throw Error('lost reply');return{data:res.body};}},
  retrySave:fn=>fn(),useEffect(){},useCallback:fn=>fn,setGame(value){env.game=value;},
 };
 for(const field of ['localExitAvailable','bossSummaryFailure','bossSummary','bossSummaryPrepared','bossSummarySaving','bossSummaryFailed','bossSummaryContinuing','bossSummaryContinueFailed'])env['set'+field[0].toUpperCase()+field.slice(1)]=value=>{env[field]=value;};
 const api=new Function('env','with(env){'+code+';return {beginBossSummary,prepareBossSummary,continueBossSummary};}')(env);
 return{...api,h,env,state,calls};
}
test('actual level-completion handlers verify and verify the next checkpoint before releasing unused resources; no auto continuation',async()=>{
 const f=await handlers();f.beginBossSummary();assert.equal(f.state.status,'paused');assert.equal(f.state.effects.length,0);assert.ok(!f.calls.includes('cleanup'));
 await f.prepareBossSummary();assert.equal(f.env.bossSummaryPrepared,true);assert.equal(f.state.status,'paused');
 assert.ok(f.calls.indexOf('read-save')<f.calls.indexOf('cleanup'));assert.ok(f.calls.indexOf('drain')<f.calls.indexOf('read-save'));
 assert.equal(f.h.profile().mission.sector,11);assert.ok(!f.calls.includes('/progress/boss-summary/continue'));
 await f.continueBossSummary();assert.equal(f.state.status,'playing');assert.equal(f.env.bossSummary,null);assert.equal(f.env.lastFrameRef.current,0);
});
test('failed save or active effect consumer keeps the actual game paused and offers retry',async()=>{
 for(const failure of ['failSave','idle']){
  const f=await handlers();f.beginBossSummary();f.env[failure]=failure==='idle'?false:true;await f.prepareBossSummary();
  assert.equal(f.env.bossSummaryPrepared,false);assert.equal(f.env.bossSummaryFailed,true);await f.continueBossSummary();assert.equal(f.state.status,'paused');
  f.env[failure]=failure==='idle'?true:false;await f.prepareBossSummary();assert.equal(f.env.bossSummaryPrepared,true);
 }
});
test('uncertain activation replays only its original receipt and a definitive no-charge reply cannot deadlock the boss stop',async()=>{
 const f=await handlers();f.beginBossSummary();f.env.activationRef.current={id:'original-receipt-0001',level:2};await f.prepareBossSummary();
 assert.equal(f.env.activationRef.current,null);assert.equal(f.env.bossSummaryPrepared,true);assert.equal(f.state.status,'paused');
 assert.equal(f.calls.filter(c=>c==='/hangar/weapon/activate').length,1);assert.ok(!f.calls.includes('/progress/checkpoint'));
});
test('continuing a completed level changes no rewards and a repeated click is ignored',async()=>{
 const f=await handlers();f.beginBossSummary();await f.prepareBossSummary();
 const before=structuredClone(f.h.profile());
 await f.continueBossSummary();assert.equal(f.state.status,'playing');
 assert.deepEqual(f.h.profile(),before);const gestures=f.calls.filter(v=>v==='gesture').length;
 await f.continueBossSummary();assert.equal(f.calls.filter(v=>v==='gesture').length,gestures);
 assert.ok(!f.calls.includes('/progress/boss-summary/continue'));
});
test('late preparation and continuation replies cannot resume an unmounted game',async()=>{
 const f=await handlers();f.beginBossSummary();const load=f.env.loadAccountSave;f.env.loadAccountSave=async()=>{f.env.weaponMountedRef.current=false;return load();};await f.prepareBossSummary();assert.equal(f.env.bossSummaryPrepared,false);assert.equal(f.state.status,'paused');
});
test('intermission cache cleanup keeps active and pending pinned resources until their consumers release them',()=>{
 const disposed=[],cache=new ResourceCache(10,10000,v=>disposed.push(v));
 const release=cache.retain('active'),releasePending=cache.retain('pending');cache.set('active','on-screen',100);cache.set('unused','old',100);
 cache.clearUnused();assert.deepEqual(disposed,['old']);assert.equal(cache.get('active'),'on-screen');assert.equal(cache.retained('pending'),true);
 cache.set('pending','prepared',100);cache.clearUnused();assert.equal(cache.get('pending'),'prepared');
 release();releasePending();cache.clearUnused();assert.equal(cache.size,0);assert.deepEqual(disposed,['old','on-screen','prepared']);
});

test('background and Home saves cannot overwrite a pending resumed boss marker through the established checkpoint route',async()=>{
 const source=fs.readFileSync(new URL('../src/pages/GamePage.tsx',import.meta.url),'utf8');
 const block=source.slice(source.indexOf('  const saveCombat ='),source.indexOf('  const saveCombatRef ='));
 const code=transformSync(block,{loader:'tsx'}).code;
 const env={bossSummaryRef:{current:{accepted:false}},activationRef:{current:null}};
 const save=new Function('env','with(env){'+code+';return saveCombat;}')(env);
 await assert.doesNotReject(save(),'pending summary returns before any checkpoint payload or network access');
});
test('closing a reward card cannot resume a pending boss summary or count time hidden beneath that card',()=>{
 const source=fs.readFileSync(new URL('../src/pages/GamePage.tsx',import.meta.url),'utf8');
 const start=source.indexOf('  const continueRewardCard=');const end=source.indexOf('  useEffect(',start);
 const code=transformSync(source.slice(start,end),{loader:'tsx'}).code;
 const state={status:'paused'},env={rewardCardsRef:{current:[{}]},bossSummaryRef:{current:{accepted:false}},stateRef:{current:state},clearControls(){},setRewardCards(){},setGame(){},lastFrameRef:{current:0},performance:{now:()=>1000}};
 new Function('env','with(env){'+code+';return continueRewardCard;}')(env)();assert.equal(state.status,'paused');
 assert.match(source,/bossSummary && !rewardCards\.length && !homePrompt && <LevelCompletion/);
});

test('an unconfirmed reward snapshot cannot enable Continue',async()=>{
 const f=await handlers();f.beginBossSummary();const load=f.env.loadAccountSave;
 f.env.loadAccountSave=async()=>{const save=await load();save.mission.snapshot.shards++;return save;};
 await f.prepareBossSummary();assert.equal(f.env.bossSummaryPrepared,false);assert.equal(f.env.bossSummaryFailed,true);
 await f.continueBossSummary();assert.equal(f.state.status,'paused');
});
