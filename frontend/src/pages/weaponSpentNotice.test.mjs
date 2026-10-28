import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { transformSync } from 'esbuild';
import { createWeaponSpentNotice, updateWeaponReloadNotice, canShowWeaponSpentNotice, advanceWeaponSpentNotice } from './weaponSpentNotice.ts';
import { nextActiveWeapon, shouldAutoReload } from './weaponAutoReload.ts';
import { stageWeaponLevel } from './shipEvolution.ts';
import { restorePaidExpiryChanges } from '../../scripts/paidExpiryReviewedChanges.mjs';
import { restoreQuietFeedbackGameChanges } from '../../scripts/quietFeedbackReviewedChanges.mjs';
import { restoreWeaponSymbolGameChanges } from '../../scripts/weaponSymbolReviewedChanges.mjs';
import { componentHost } from '../../scripts/componentTestHost.mjs';
import { restoreBinaryWeaponGameChanges } from '../../scripts/binaryWeaponReviewedChanges.mjs';
import { translate, languages } from '../i18n.ts';
import { powerUpNames, powerUpSymbols } from './powerUps.ts';

const source = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const pickupLabelsSource=source.slice(source.indexOf('const pickupEffectLabels:'),source.indexOf('\n};',source.indexOf('const pickupEffectLabels:'))+3);
const pickupEffectLabels=new Function(transformSync(pickupLabelsSource,{loader:'ts'}).code+';return pickupEffectLabels;')();
const original = restoreBinaryWeaponGameChanges(source);
const hash = value => createHash('sha256').update(value).digest('hex');

test('only a real selected paid expiry queues a three-second notice; pickups and permanent weapons stay quiet', () => {
  for (const level of [2,3,4,5]) {
    assert.deepEqual(createWeaponSpentNotice('paid',level,16,0),{source:'paid',level,shown:false,remainingMs:3000});
    assert.equal(createWeaponSpentNotice('pickup',level,16,0),null);
    for (const before of [0,-1,NaN,Infinity]) assert.equal(createWeaponSpentNotice('paid',level,before,0),null);
    assert.equal(createWeaponSpentNotice('paid',level,16,1),null);
  }
  for(const level of [0,1,6,NaN,2.5]) assert.equal(createWeaponSpentNotice('paid',level,16,0),null);
  assert.equal(createWeaponSpentNotice('standard',2,16,0),null);
});

const expiryBlock = text => text.slice(text.indexOf('        const expiringLevel ='), text.indexOf('        state.combo.remainingMs ='));
const runExpiry = text => new Function('env', 'with(env){' + expiryBlock(text) + '}');
const baseState = () => ({ weaponSource: 'paid', paidWeaponLevel: 2, paidWeaponMs: 10, pickupWeaponLevel: 5, pickupWeaponMs: 0,
  weaponLevel: 2, weaponTimers: [0, 0, 10, 0, 0, 0] });

test('real expiry still makes the same fallback/activation/stock decisions, including pickup and delayed automatic confirmation', () => {
  const cases = [
    { name: 'manual with stock', stock: 3, notice: 2 },
    { name: 'automatic empty stock', auto: true, stock: 0, notice: 2 },
    { name: 'automatic activation', auto: true, stock: 3, start: true, notice: 2 },
    { name: 'busy automatic activation', auto: true, stock: 3, start: false, notice: 2 },
    { name: 'purchase policy disabled', auto: true, stock: 3, allowed: false, notice: 2 },
    { name: 'another live paid weapon takes over', stock: 0, next: true, notice: 2 },
    { name: 'pickup expires above a different paid weapon', pickup: true, notice: null },
    { name: 'unselected pickup expires', backgroundPickup: true, notice: null },
  ];
  for (const c of cases) {
    const run = text => {
      const state = baseState(), requests = [];
      if (c.pickup) Object.assign(state, { weaponSource: 'pickup', pickupWeaponMs: 10 });
      if (c.backgroundPickup) { state.pickupWeaponMs = 10; state.paidWeaponMs = 100; state.weaponTimers[2] = 100; }
      if (c.next) state.weaponTimers[4] = 30000;
      const env = { state, purchasedWeaponDelta: c.pickup ? 0 : 16, pickupWeaponDelta: 16, ownerDiagnostics: false,
        autoReloadRef: { current: { 2: !!c.auto, 4: !!c.next } }, stockRef: { current: { weapon_twin: c.stock ?? 0 } }, shipSaveNetwork: 'testnet',
        hangarCatalog: [{ kind: 'weapon', level: 2 }], isTestnetWeaponPurchaseEnabled: () => c.allowed !== false,
        syncSelectedWeapon() {}, nextActiveWeapon, shouldAutoReload, createWeaponSpentNotice,
        reloadRequestRef: { current: level => { requests.push(level); return c.start ?? false; } }, weaponSpentRef: { current: null }, reloadPendingRef: { current: false }, setWeaponSpent() {}, forceScene: false };
      runExpiry(text)(env); return { env, requests, state };
    };
    const before = run(original), after = run(source);
    assert.deepEqual(after.state, before.state, c.name); assert.deepEqual(after.requests, before.requests, c.name);
    assert.equal(after.env.weaponSpentRef.current?.level ?? null, c.notice, c.name);
    if (c.next) assert.equal(after.state.paidWeaponLevel, 4);
  }
});

const binaryLine=source.split('\n').find(line=>line.includes('className="formation-data-stream"'));
const expiryLine=source.split('\n').find(line=>line.includes('&& canShowWeaponSpentNotice(')&&line.includes('<WeaponSpentNotice'));
const binaryCode=transformSync('function render(){return <>'+binaryLine.trim()+expiryLine.trim()+'</>}',{loader:'tsx',jsxFactory:'element',jsxFragment:'fragment'}).code;
const nodes=tree=>{const result=[];const visit=n=>{if(!n||typeof n!=='object')return;result.push(n);n.props?.children?.forEach(visit);};visit(tree);return result;};
const element=(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}});
const renderBinary=env=>new Function('env','with(env){'+binaryCode+';return render();}')(env);
const compileJsx=text=>{
 const code=transformSync('function render(){return <>'+text+'</>}',{loader:'tsx',jsxFactory:'element',jsxFragment:'fragment'}).code;
 return env=>new Function('env','with(env){'+code+';return render();}')(env);
};
const noticeEnv=(overrides={})=>{
 const notice=createWeaponSpentNotice('paid',2,16,0);
 return {element,fragment:'fragment',game:{status:'playing',encounter:'normal',phase:'SECTOR_CLEAR',asteroids:[],enemyShots:[],weaponLevel:4},
   stateRef:{current:{enemyShots:[]}},formationStartedRef:{current:false},weaponSpent:notice,weaponSpentRef:{current:notice},clearTimerRef:{current:0},
   combatVarietyEnabled:true,combatTiming:()=>({clearMs:5200}),SECTION_CLEAR_MS:8500,canShowWeaponSpentNotice,
   FORMATION_DATA_ROWS:['01'],WeaponSpentNotice:'WeaponSpentNotice',weaponNames:['','Standard','Twin','Rapid','Triple','Plasma'],markWeaponSpentShown(){},...overrides};
};

test('the actual JSX keeps binary scenery unchanged and starts paid expiry only in a complete safe block break',()=>{
 for(const status of ['playing','paused','loading','destroying','game-over','victory'])for(const encounter of ['normal','bonus','boss-intro','boss-fight','boss-clear'])
  for(const phase of ['SECTOR_INTRO','ENTRY','FORMATION','ATTACK_CYCLE','REFORM','SECTOR_CLEAR'])for(const started of [false,true])for(const pending of [false,true]){
   const env=noticeEnv();Object.assign(env.game,{status,encounter,phase});env.formationStartedRef.current=started;
   if(!pending){env.weaponSpent=null;env.weaponSpentRef.current=null;}
   const tree=nodes(renderBinary(env));
   assert.equal(tree.some(n=>n.props.className==='formation-data-stream'),status==='playing'&&encounter==='normal'&&!started&&['SECTOR_INTRO','ENTRY','FORMATION'].includes(phase));
   const expected=status==='playing'&&encounter==='normal'&&phase==='SECTOR_CLEAR'&&pending;
   const notice=tree.find(n=>n.type==='WeaponSpentNotice');assert.equal(Boolean(notice),expected);
   if(notice){assert.equal(notice.props.expiredWeaponName,'Twin');assert.equal(notice.props.weaponName,undefined);}
  }
 for(const remaining of [2999,3000,5200])for(const incoming of [false,true])for(const alive of [false,true]){
  const env=noticeEnv();env.clearTimerRef.current=5200-remaining;env.stateRef.current.enemyShots=incoming?[{}]:[];env.game.asteroids=alive?[{}]:[];
  assert.equal(nodes(renderBinary(env)).some(n=>n.type==='WeaponSpentNotice'),remaining>=3000&&!incoming&&!alive);
 }
});

test('the actual playing step starts at the committed caption, waits through combat and counts exactly three unpaused seconds',()=>{
 const start=source.indexOf('        if (advanceWeaponSpentNotice('),end=source.indexOf('        impactCooldownRef.current =',start);
 assert.ok(start>0&&end>start);
 const run=new Function('env','with(env){if(state.status==="playing"){'+source.slice(start,end)+'}}');
 const env={state:{status:'playing',encounter:'normal',phase:'ATTACK_CYCLE',asteroids:[{}],enemyShots:[]},delta:1000,
  advanceWeaponSpentNotice,weaponSpentRef:{current:createWeaponSpentNotice('paid',2,16,0)},setWeaponSpent(){},forceScene:false};
 for(let i=0;i<100;i++)run(env);assert.equal(env.weaponSpentRef.current.remainingMs,3000);assert.equal(env.weaponSpentRef.current.shown,false);
 Object.assign(env.state,{phase:'SECTOR_CLEAR',asteroids:[]});run(env);assert.equal(env.weaponSpentRef.current.remainingMs,3000,'uncommitted captions never spend reading time');
 const a=source.indexOf('  const markWeaponSpentShown ='),b=source.indexOf('  const showRewardCards=',a);
 const onShown=new Function('env','with(env){'+source.slice(a,b)+';return markWeaponSpentShown;}')({...env,useCallback:fn=>fn});
 const h=componentHost('src/pages/WeaponSpentNotice.tsx','WeaponSpentNotice',{expiredWeaponName:'Twin',onShown},{useLocale:()=>({t:key=>key}),useLayoutEffect:fn=>fn()});
 assert.equal(env.weaponSpentRef.current.shown,true);env.delta=1499;run(env);assert.equal(env.weaponSpentRef.current.remainingMs,1501);
 env.state.status='paused';env.delta=60000;run(env);assert.equal(env.weaponSpentRef.current.remainingMs,1501);
 onShown();assert.equal(env.weaponSpentRef.current.remainingMs,1501,'remount or Resume cannot restart the reading duration');
 env.state.status='playing';env.delta=1500;run(env);assert.equal(env.weaponSpentRef.current.remainingMs,1);
 env.delta=1;run(env);assert.equal(env.weaponSpentRef.current,null);assert.equal(env.forceScene,true);h.unmount();
 const shown={...createWeaponSpentNotice('paid',2,16,0),shown:true};
 assert.equal(advanceWeaponSpentNotice(shown,16,false),true,'unexpected active combat consumes the displayed caption instead of covering enemies');
});

test('the real weapon rail has one usable Weapons button and no live shot name, charge meter or reload banner',()=>{
 const start=source.indexOf('        <div className={`touch-controls touch-controls-');
 const end=source.indexOf('            {game.purchasedShieldMs > 0',start);
 assert.ok(start>0&&end>start);
 const render=compileJsx(source.slice(start,end)+'</div></div>');
 for(const locale of Object.keys(languages))for(const weaponSource of ['paid','pickup','standard']){
  let opened=0;
  const tree=nodes(render({element,fragment:'fragment',readControlHand:()=> 'left',game:{status:'playing',weaponSource,weaponLevel:2,paidWeaponMs:40000,pickupWeaponMs:20000,paidWeaponLevel:2,pickupWeaponLevel:3},
    stageWeaponLevel,shipStage:1,weaponNames:['','Standard','Twin','Rapid Twin','Triple','Plasma'],t:key=>translate(locale,key),openWeaponSelection:()=>opened++,confirmedReload:2,ReloadConfirmation:'ReloadConfirmation'}));
  const text=tree.flatMap(n=>n.props?.children?.filter(v=>typeof v==='string')??[]).join('');
  assert.equal(text.trim(),translate(locale,'Weapons'));
  assert.equal(tree.filter(n=>n.type==='button').length,1);
  assert.equal(tree.some(n=>n.type==='progress'||n.type==='ReloadConfirmation'),false);
  const button=tree.find(n=>n.type==='button');assert.equal(button.props.disabled,false);button.props.onClick();assert.equal(opened,1);
 }
});

test('the real pickup caption omits weapon upgrades while preserving the other boost captions',()=>{
 const line=source.split('\n').find(line=>line.includes('{game.pickupNotice &&'));
 const render=compileJsx(line.trim());
 for(const type of ['weapon','shield','rapid','overdrive'])for(const status of ['playing','paused']){
  const tree=nodes(render({element,fragment:'fragment',game:{status,pickupNotice:{id:1,type,level:2}},powerUpNames,powerUpSymbols,pickupEffectLabels,t:key=>key}));
  assert.equal(tree.some(n=>n.props.role==='status'),type!=='weapon'&&status==='playing');
 }
});

test('the actual component shows only the expired paid name in all19 locales, with no fallback name or reload status',()=>{
 for(const locale of Object.keys(languages))for(const level of [2,3,4,5]){
  let shown=0;const expiredWeaponName=translate(locale,['','','Twin','Rapid Twin','Triple','Plasma'][level]);
  const h=componentHost('src/pages/WeaponSpentNotice.tsx','WeaponSpentNotice',{expiredWeaponName,onShown:()=>{shown++;},weaponName:'UNWANTED_CURRENT_SHOT',reload:'pending'},
   {useLocale:()=>({t:key=>translate(locale,key)}),useLayoutEffect:fn=>fn()});
  const text=h.nodes().find(n=>n.type==='strong').props.children.join('');
  assert.equal(text,expiredWeaponName+' · '+translate(locale,'Expired'));
  assert.equal(h.nodes()[0].props.role,'status');assert.equal(h.nodes().some(n=>['button','a','small'].includes(n.type)),false);
  assert.equal(shown,1);assert.ok(!text.includes('UNWANTED_CURRENT_SHOT'));h.unmount();
 }
 const css=readFileSync(new URL('./weaponNotices.css',import.meta.url),'utf8');
 assert.match(css,/color: #ff3347/);assert.match(css,/paid-weapon-expiry 1.5s ease-in-out 2/);
 assert.match(css,/animation-play-state: paused/);assert.match(css,/prefers-reduced-motion: reduce/);assert.match(css,/visibility: hidden/);
 const modules=readFileSync(new URL('./weaponSpentNotice.ts',import.meta.url),'utf8')+readFileSync(new URL('./WeaponSpentNotice.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(modules,/setTimeout|setInterval|requestAnimationFrame/);
});

test('exact reviewed changes restore the entire published controller, original binary markup and retained critical guards', () => {
  assert.equal(hash(restorePaidExpiryChanges(source)),'0785ece27dc608498958f949852972545c5b15138369615d07bbc4a9223ba02a');
  assert.equal(hash(restoreWeaponSymbolGameChanges(source)),'4fdd0f448af7dfd952a69db6c3a5c681bd8ad03822be91f10657ecf832a1ac2b');
  assert.throws(()=>restoreWeaponSymbolGameChanges(source.replace('expiredWeaponName={weaponNames[weaponSpent.level]}','expiredWeaponName={weaponNames[1]}')),/one exact/);
  assert.equal(hash(original),'ab979a75eef6698b84a0f015f10c50dc513cd7f211f790624a09b3dc45697be3');
  assert.throws(()=>restoreBinaryWeaponGameChanges(source.replace('onShown={markWeaponSpentShown}','onShown={()=>{}}')),/one exact/);
  assert.notEqual(hash(restoreBinaryWeaponGameChanges(source.replace('watch: callback => window.setInterval(callback, 500)','watch: callback => window.setInterval(callback, 1000)'))),hash(original));
  assert.throws(()=>restoreBinaryWeaponGameChanges(source.replace("stockRef.current, shipSaveNetwork === 'testnet'","stockRef.current, shipSaveNetwork === 'mainnet'")),/one exact/);
  const oldBinary=original.split('\n').find(line=>line.includes('className="formation-data-stream"'));
  const newBinary=restoreQuietFeedbackGameChanges(source).split('\n').find(line=>line.includes('className="formation-data-stream"')).replace('&& <><div className="formation-data-stream"','&& <div className="formation-data-stream"').replace(/<\/div>\{weaponSpent && !levelIntro && <WeaponSpentNotice[\s\S]*$/, '</div>}');
  assert.equal(newBinary,oldBinary);
  assert.ok(!source.includes('reloadNoticeTimerRef'));assert.ok(!source.includes('<WeaponReloadNotice'));
});


test('the actual direct next-flight boundary consumes shown feedback without needing an active frame', () => {
  const current=source.slice(source.indexOf('        if (nextFlight &&'),source.indexOf('          if (rulesVersionRef.current === 2) state.score += GROUP_CLEAR_POINTS;',source.indexOf('        if (nextFlight &&')));
  const old=restoreQuietFeedbackGameChanges(source);
  const previous=old.slice(old.indexOf('        if (nextFlight &&'),old.indexOf('          if (rulesVersionRef.current === 2) state.score += GROUP_CLEAR_POINTS;',old.indexOf('        if (nextFlight &&')));
  const run=text=>new Function('env','with(env){'+text+'}}');
  for(const phase of ['ENTRY','FORMATION','ATTACK_CYCLE'])for(const shown of [false,true]){
    const make=()=>({nextFlight:{group:1},state:{phase},weaponSpentRef:{current:{...createWeaponSpentNotice('paid',2,16,0),shown}},setWeaponSpent(){},forceScene:false});
    const before=make();run(previous)(before);assert.ok(before.weaponSpentRef.current,'the pinned public boundary never consumes the already-shown record');
    const after=make();run(current)(after);assert.equal(after.weaponSpentRef.current===null,shown);assert.equal(after.forceScene,shown);
  }
});

test('real automatic confirmation updates only the pending record and never recreates consumed feedback', () => {
  const notice={...createWeaponSpentNotice('paid',2,16,0),reload:'pending'};
  updateWeaponReloadNotice(notice,3,'complete');assert.equal(notice.reload,'pending');
  updateWeaponReloadNotice(notice,2,'complete');assert.equal(notice.reload,'complete');
  updateWeaponReloadNotice(notice,2,'failed');assert.equal(notice.reload,'complete');
  updateWeaponReloadNotice(null,2,'complete');
  const pickup={...createWeaponSpentNotice('pickup',2,16,0),reload:'pending'};
  updateWeaponReloadNotice(pickup,2,'complete');assert.equal(pickup.reload,'pending');
  assert.equal(hash(restoreQuietFeedbackGameChanges(source)),'eb219ac8306919d27008dd7929fce871eff0e1b2df0d682ee518d3a23394e782');
  assert.throws(()=>restoreQuietFeedbackGameChanges(source.replace("updateWeaponReloadNotice(weaponSpentRef.current, level, 'failed');",'')),/one exact/);
  for(const reload of ['pending','complete','failed']){
    const h=componentHost('src/pages/WeaponSpentNotice.tsx','WeaponSpentNotice',{expiredWeaponName:'Twin',reload,onShown(){}},{useLocale:()=>({t:key=>key}),useLayoutEffect:fn=>fn()});
    assert.equal(h.nodes().find(n=>n.props.className==='weapon-reload-status'),undefined);h.unmount();
  }
});
