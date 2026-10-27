import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { transformSync } from 'esbuild';
import { createWeaponSpentNotice, updateWeaponReloadNotice } from './weaponSpentNotice.ts';
import { nextActiveWeapon, shouldAutoReload } from './weaponAutoReload.ts';
import { stageWeaponLevel } from './shipEvolution.ts';
import { weaponSymbols } from './weaponSymbols.ts';
import { restoreQuietFeedbackGameChanges } from '../../scripts/quietFeedbackReviewedChanges.mjs';
import { restoreWeaponSymbolGameChanges } from '../../scripts/weaponSymbolReviewedChanges.mjs';
import { componentHost } from '../../scripts/componentTestHost.mjs';
import { restoreBinaryWeaponGameChanges } from '../../scripts/binaryWeaponReviewedChanges.mjs';
import { translate, languages } from '../i18n.ts';

const source = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const original = restoreBinaryWeaponGameChanges(source);
const hash = value => createHash('sha256').update(value).digest('hex');

test('only a selected timed charge/pickup reaching zero queues a name, without an independent reading deadline', () => {
  for (const source of ['paid', 'pickup']) for (const level of [2, 3, 4, 5]) {
    assert.deepEqual(createWeaponSpentNotice(source, level, 16, 0), { source, level, shown: false });
    for (const before of [0, -1, NaN, Infinity]) assert.equal(createWeaponSpentNotice(source, level, before, 0), null);
    assert.equal(createWeaponSpentNotice(source, level, 16, 1), null);
  }
  for (const level of [0, 1, 6, NaN, 2.5]) assert.equal(createWeaponSpentNotice('paid', level, 16, 0), null);
  assert.equal(createWeaponSpentNotice('standard', 2, 16, 0), null);
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
    { name: 'pickup expires above a different paid weapon', pickup: true, notice: 5 },
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

const binaryLine = source.split('\n').find(line => line.includes('className="formation-data-stream"'));
const binaryCode = transformSync('function render(){return <>' + binaryLine.trim() + '</>}', { loader: 'tsx', jsxFactory: 'element', jsxFragment: 'fragment' }).code;
const nodes = tree => { const result=[]; const visit=n=>{if(!n||typeof n!=='object')return;result.push(n);n.props?.children?.forEach(visit);};visit(tree);return result; };
const element = (type, props, ...children) => ({ type, props: { ...props, children: children.flat(Infinity) } });
const renderBinary = env => new Function('env', 'with(env){' + binaryCode + ';return render();}')(env);

test('the actual JSX mounts the passive name only in the exact binary window and names the current stage-correct shot', () => {
  const names = ['', 'Standard', 'Twin', 'Rapid', 'Triple', 'Plasma'];
  for (const status of ['playing','paused','loading','destroying','game-over','victory']) for (const encounter of ['normal','bonus','boss-intro','boss-fight','boss-clear']) {
    for (const phase of ['SECTOR_INTRO','ENTRY','FORMATION','ATTACK_CYCLE','REFORM','SECTOR_CLEAR']) for (const started of [false,true]) for (const pending of [false,true]) {
      const env={element,fragment:'fragment',game:{status,encounter,phase,weaponLevel:4},formationStartedRef:{current:started},flight:0,weaponSpent:pending?createWeaponSpentNotice('paid',2,16,0):null,weaponSpentRef:{current:pending?createWeaponSpentNotice('paid',2,16,0):null},reinforcementIntro:false,
        FORMATION_DATA_ROWS:['01'],WeaponSpentNotice:'WeaponSpentNotice',weaponNames:names,stageWeaponLevel,shipStage:1,levelIntro:false,markWeaponSpentShown(){}};
      const tree=nodes(renderBinary(env));
      const expected=status==='playing'&&encounter==='normal'&&!started&&['SECTOR_INTRO','ENTRY','FORMATION'].includes(phase);
      assert.equal(tree.some(n=>n.props.className==='formation-data-stream'),expected);
      assert.equal(tree.some(n=>n.type==='WeaponSpentNotice'),expected&&pending);
    }
  }
  const titleEnv={element,fragment:'fragment',game:{status:'playing',encounter:'normal',phase:'SECTOR_INTRO',weaponLevel:1},formationStartedRef:{current:false},flight:0,weaponSpent:createWeaponSpentNotice('paid',4,16,0),weaponSpentRef:{current:createWeaponSpentNotice('paid',4,16,0)},reinforcementIntro:false,FORMATION_DATA_ROWS:['01'],WeaponSpentNotice:'WeaponSpentNotice',weaponNames:names,stageWeaponLevel,shipStage:1,levelIntro:true,markWeaponSpentShown(){}};
  const titled=nodes(renderBinary(titleEnv));assert.equal(titled.some(n=>n.props.className==='formation-data-stream'),true);assert.equal(titled.some(n=>n.type==='WeaponSpentNotice'),false,'a centered level title keeps its space while the code continues');
  for (const stage of [1,2,3]) for (const level of [1,2,3,4,5]) {
    const tree=nodes(renderBinary({element,fragment:'fragment',game:{status:'playing',encounter:'normal',phase:'ENTRY',weaponLevel:level},formationStartedRef:{current:false},flight:0,weaponSpent:createWeaponSpentNotice('paid',2,16,0),weaponSpentRef:{current:createWeaponSpentNotice('paid',2,16,0)},reinforcementIntro:false,
      FORMATION_DATA_ROWS:['01'],WeaponSpentNotice:'WeaponSpentNotice',weaponNames:names,stageWeaponLevel,shipStage:stage,levelIntro:false,markWeaponSpentShown(){}}));
    const notice=tree.find(n=>n.type==='WeaponSpentNotice');
    assert.equal(notice.props.weaponName,names[stageWeaponLevel(stage,level)]);
    assert.equal(notice.props.level,stageWeaponLevel(stage,level));assert.equal(notice.props.expiredLevel,2);
    assert.equal(tree.find(n=>n.props.className==='formation-data-stream').props['aria-hidden'],'true');
  }
});

test('the real lifecycle keeps a pending name through combat/pauses, uses the whole binary window and dismisses it when that window ends', () => {
  const start=source.indexOf('        if (weaponSpentRef.current?.shown');
  const block=source.slice(start,source.indexOf('        impactCooldownRef.current =',start));
  const run=new Function('env','with(env){if(state.status==="playing"){'+block+'}}');
  const make=(shown=false)=>({state:{status:'playing',encounter:'normal',phase:'ATTACK_CYCLE',section:19},flightRef:{current:0},formationStartedRef:{current:true},weaponSpentRef:{current:{...createWeaponSpentNotice('paid',2,16,0),shown,window:'19:0'}},setWeaponSpent(){},forceScene:false});
  const queued=make();for(let i=0;i<100;i++)run(queued);assert.ok(queued.weaponSpentRef.current,'an unseen name is queued, never shown over combat');
  for(const phase of ['SECTOR_INTRO','ENTRY','FORMATION']){
    const env=make(true);env.state.phase=phase;env.formationStartedRef.current=false;
    for(let i=0;i<600;i++)run(env);assert.ok(env.weaponSpentRef.current,'no 8s/6s timer truncates the existing binary window');
    env.state.status='paused';env.formationStartedRef.current=true;run(env);assert.ok(env.weaponSpentRef.current,'manual/technical pause never consumes the message');
    env.state.status='playing';run(env);assert.equal(env.weaponSpentRef.current,null);assert.equal(env.forceScene,true);
  }
  for(const [encounter,phase] of [['normal','ATTACK_CYCLE'],['normal','SECTOR_CLEAR'],['bonus','SECTOR_INTRO'],['boss-fight','FORMATION']]){
    const env=make(true);Object.assign(env.state,{encounter,phase});env.formationStartedRef.current=false;run(env);assert.equal(env.weaponSpentRef.current,null);
  }
});

test('the real component names expiry and the current shot, with passive accessible status and no purchase or menu action', () => {
  for(const locale of Object.keys(languages)){
    let shown=0;
    const name=translate(locale,'Standard');
    const h=componentHost('src/pages/WeaponSpentNotice.tsx','WeaponSpentNotice',{expiredLevel:1,level:1,expiredWeaponName:name,weaponName:name,onShown:()=>{shown++;}},
      {useLocale:()=>({t:key=>translate(locale,key)}),useLayoutEffect:fn=>fn(),weaponSymbols});
    assert.equal(h.nodes().find(n=>n.type==='strong').props.children.filter(v=>typeof v==='string').join(''),name);
    assert.equal(h.nodes().filter(n=>n.type==='button'||n.type==='a').length,0);
    const activeSymbol=h.nodes().find(n=>n.props.className==='weapon-notice-symbol');
    assert.equal(activeSymbol.props.children.join(''),weaponSymbols[1]);assert.equal(activeSymbol.props['aria-hidden'],'true');
    assert.equal(h.nodes()[0].props.role,'status');assert.equal(shown,1);h.unmount();assert.equal(shown,1);
    const expired=componentHost('src/pages/WeaponSpentNotice.tsx','WeaponSpentNotice',{expiredLevel:4,level:1,expiredWeaponName:translate(locale,'Triple'),weaponName:name,onShown(){}},
      {useLocale:()=>({t:key=>translate(locale,key)}),useLayoutEffect:fn=>fn(),weaponSymbols});
    const text=expired.nodes().find(n=>n.type==='span').props.children.join('');
    assert.deepEqual(expired.nodes().filter(n=>n.props.className==='weapon-notice-symbol').map(n=>n.props.children.join('')),[weaponSymbols[4],weaponSymbols[1]]);
    assert.ok(text.includes(translate(locale,'Expired')));assert.ok(text.includes(translate(locale,'Triple')));expired.unmount();
  }
});

test('exact reviewed changes restore the entire published controller, original binary markup and retained critical guards', () => {
  assert.equal(hash(restoreWeaponSymbolGameChanges(source)),'4fdd0f448af7dfd952a69db6c3a5c681bd8ad03822be91f10657ecf832a1ac2b');
  assert.throws(()=>restoreWeaponSymbolGameChanges(source.replace('expiredLevel={weaponSpent.level}','expiredLevel={1}')),/one exact/);
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
  for(const locale of Object.keys(languages))for(const reload of ['pending','complete','failed']){
    const key=reload==='pending'?'Reloading weapon…':reload==='complete'?'Weapon reloaded':'Reload not confirmed';
    const h=componentHost('src/pages/WeaponSpentNotice.tsx','WeaponSpentNotice',{expiredLevel:2,level:2,expiredWeaponName:'Twin',weaponName:'Twin',reload,onShown(){}},{useLocale:()=>({t:key=>translate(locale,key)}),useLayoutEffect:fn=>fn(),weaponSymbols});
    assert.equal(h.nodes().find(n=>n.props.className==='weapon-reload-status').props.children.join(''),translate(locale,key));
    if(locale!=='en')assert.notEqual(translate(locale,key),key);h.unmount();
  }
});
