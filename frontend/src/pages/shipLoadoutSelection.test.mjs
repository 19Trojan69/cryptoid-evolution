import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{transformSync}from'esbuild';
import{restoreShipSelectionGameChanges}from'../../scripts/shipSelectionReviewedChanges.mjs';
const source=readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
const published=restoreShipSelectionGameChanges(source);
const compiled=tsx=>transformSync(tsx,{loader:'tsx',jsxFactory:'element'}).code;
const element=(type,props,...children)=>({type,props:{...props,children}});
function entry(text,auth){
 const block=text.slice(text.indexOf('function GameEntry()'),text.indexOf('export default GameEntry;'));
 return new Function('env','with(env){'+compiled(block)+';return GameEntry();}')({element,useAuth:()=>auth,GameRoute:'route',GamePage:'game',GameAccessGate:'gate'}).props.children[0];
}
function initial(text,verified,marker,admin=false){
 const line=text.split('\n').find(line=>line.startsWith('const createInitialState ='));
 const env={localStorage:{getItem:()=>marker?'1':null},sessionStorage:{getItem:()=>admin?'1':null},createDoubleKillCombo:()=>({}),shipStartHeight:[.8],readShipStart:()=>0,shardBalance:()=>0,SHARD_BALANCE_KEY:'balance',ADMIN_MODE_KEY:'admin',POWER_UP_DURATION_MS:20000};
 return new Function('env','verified','with(env){'+compiled(line)+';return createInitialState(verified);}')(env,verified);
}

test('the actual verified entry owns the guest/account decision, including a restored token without its persistent marker',()=>{
 const ready={authReady:true,isLoading:false,authError:'',isAuthenticated:true,canAdmin:false,signIn(){}};
 assert.equal(entry(published,ready).props.authenticated,undefined,'pinned entry loses the verified identity');
 assert.equal(initial(published,true,false).status,'playing','pinned factory silently starts a guest');
 for(const verified of [false,true])for(const marker of [false,true]){
  const view=entry(source,{...ready,isAuthenticated:verified});assert.equal(view.type,'game');assert.equal(view.props.authenticated,verified);
  assert.equal(initial(source,verified,marker).status,verified?'loading':'playing');
 }
 assert.equal(initial(source,false,false,true).status,'loading','verified Admin preview still loads its separate configuration');
 for(const auth of [{...ready,authReady:false},{...ready,isLoading:true},{...ready,authError:'unconfirmed'}])assert.equal(entry(source,auth).type,'gate');
});

test('restart reuses the confirmed owner and explicit stages do not regain saved hull protection',()=>{
 assert.ok(source.includes('stateRef.current = createInitialState(authenticated);'));
 const start=source.indexOf('        if (data.combat) {'),end=source.indexOf('        else varietyRef.current',start);
 const block=source.slice(start,end);
 const run=new Function('stateRef','shipStageRef','projectileGuardForStage','restoreCombat','data',block);
 for(const stage of [1,2,3])for(const guard of [0,1,2]){
  const ref={current:{projectileGuard:99}};run(ref,{current:stage},stage=>stage-1,()=>{ref.current.projectileGuard=guard;},{combat:{}});
  assert.equal(ref.current.projectileGuard,Math.min(guard,stage-1));
 }
});

test('the complete current public controller is restored exactly and altered payment/pause gates still fail',()=>{
 const hash=text=>createHash('sha256').update(text).digest('hex');
 assert.equal(hash(published),'b5574344a195886dedb02730f20b9a486d4f3a410717ac17d0f468d42c3eb74d');
 assert.throws(()=>restoreShipSelectionGameChanges(source.replace('authenticated={isAuthenticated}','authenticated={true}')),/one exact/);
 assert.notEqual(hash(restoreShipSelectionGameChanges(source.replace('watch: callback => window.setInterval(callback, 500)','watch: callback => window.setInterval(callback, 1000)'))),hash(published));
});
