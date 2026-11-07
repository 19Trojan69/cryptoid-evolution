import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {transformSync} from 'esbuild';
import {automaticStartWeapon} from './weaponAutoReload.ts';
import {hangarCatalog} from '../../../backend/src/hangarCatalog.ts';
import {isTestnetWeaponPurchaseEnabled} from '../../../backend/src/paymentPolicy.ts';
import {restoreWeaponMenuGameChanges} from '../../scripts/weaponMenuReviewedChanges.mjs';
import {weaponMenu} from '../../scripts/weaponReloadRecoveryHost.mjs';

const source=readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
const start=source.indexOf('  useEffect(() => {\n    const state = stateRef.current, runId = scoreRunRef.current;');
const end=source.indexOf('  useEffect(() => {\n    if (weaponCountdown === null)',start);
assert.ok(start>0&&end>start);
const effectCode=transformSync(source.slice(start,end),{loader:'tsx'}).code;
function startHost(overrides={}) {
 const requests=[];
 const env={useEffect:fn=>fn(),stateRef:{current:{status:'playing',weaponSource:'standard',weaponTimers:[0,0,0,0,0,0]}},scoreRunRef:{current:'run-a'},accountRun:true,adminRunRef:{current:false},automaticStartRunRef:{current:null},activationRef:{current:null},weaponBusyRef:{current:false},autoReloadRef:{current:{5:true}},stockRef:{current:{weapon_plasma:19}},hangarCatalog,shipSaveNetwork:'testnet',ownerDiagnostics:true,isTestnetWeaponPurchaseEnabled,automaticStartWeapon,reloadRequestRef:{current:level=>{requests.push(level);return true;}},game:{status:'playing'},autoReload:{},weaponStock:{},...overrides};
 const run=()=>new Function('env','with(env){'+effectCode+'}')(env);
 return {env,requests,run};
}

test('the actual confirmed-run effect honors saved Auto once without polling or overriding an existing weapon',()=>{
 const f=startHost();f.run();for(let i=0;i<50;i++)f.run();assert.deepEqual(f.requests,[5]);
 f.env.scoreRunRef.current='run-b';f.run();assert.deepEqual(f.requests,[5,5],'a new confirmed run honors the saved choice');
 for(const status of ['loading','paused','destroying','game-over','victory']){
  const f=startHost();f.env.stateRef.current.status=status;f.run();assert.deepEqual(f.requests,[]);assert.equal(f.env.automaticStartRunRef.current,null);
 }
 for(const source of ['paid','pickup']){const f=startHost();f.env.stateRef.current.weaponSource=source;f.run();assert.deepEqual(f.requests,[],'saved/manual selection remains authoritative');}
 for(const patch of [{accountRun:false},{adminRunRef:{current:true}},{scoreRunRef:{current:null}},{shipSaveNetwork:'mainnet'},{ownerDiagnostics:false},{autoReloadRef:{current:{5:false}}},{stockRef:{current:{}}}]){
  const f=startHost(patch);f.run();assert.deepEqual(f.requests,[]);
 }
 const failed=startHost({reloadRequestRef:{current:()=>false}});failed.run();assert.equal(failed.env.automaticStartRunRef.current,'run-a','a denied automatic attempt does not become an API retry loop');
});

test('the real drawer marks only its scrollable offer body for the existing route touch lock',()=>{
 const menu=weaponMenu({});const scroll=menu.nodes.find(n=>n.props.className==='mission-shop-scroll');
 assert.equal(scroll.props['data-game-scroll'],true);
 assert.equal(menu.tree.props['data-game-scroll'],undefined,'header/footer do not become page-pull surfaces');
 const footer=menu.nodes.find(n=>n.props.className==='mission-shop-footer');assert.ok(footer);
 assert.equal(footer.props['data-game-scroll'],undefined);
});

function inventoryHost() {
  const start = source.indexOf('  const changeAutoReload =');
  const end = source.indexOf('  const [weaponBusy,', start);
  const code = transformSync(source.slice(start, end), { loader: 'tsx' }).code;
  const writes = [], requests = [];
  const env = {
    automaticStartRunRef: { current: 'run-a' }, autoReloadRef: { current: { 5: true } },
    stockRef: { current: { weapon_plasma: 19 } }, hangarCatalog, shipSaveNetwork: 'testnet',
    cardOwnerRef: { current: 'pilot-a' }, autoReloadKey: (network, owner) => network + ':' + owner,
    setAutoReload() {}, setWeaponStock() {}, localStorage: { setItem: (...args) => writes.push(args) },
    useCallback: fn => fn, scoreRunRef: { current: 'run-a' }, adminRunRef: { current: false },
    weaponMountedRef: { current: true }, inventoryRequestRef: { current: null }, manualWeaponChoiceRef: { current: 0 },
    axiosClient: { get(path) {
      assert.equal(path, '/hangar/inventory');
      return new Promise(resolve => requests.push(stock => resolve({
        data: { ownedWeapons: Object.keys(stock), weaponStock: stock },
      })));
    } },
  };
  const handlers = new Function('env', 'with(env){' + code + ';return {changeAutoReload,receiveWeaponInventory,refreshWeaponInventory};}')(env);
  return { env, writes, requests, ...handlers };
}

test('only an explicit Auto change or replenished enabled stock re-arms the bounded choice',()=>{
 const { env, writes, receiveWeaponInventory, changeAutoReload } = inventoryHost();
 receiveWeaponInventory({weapon_plasma:19}, true);assert.equal(env.automaticStartRunRef.current,'run-a','a refresh cannot repeatedly arm a charge');
 receiveWeaponInventory({weapon_plasma:18}, true);assert.equal(env.automaticStartRunRef.current,'run-a','consumption cannot re-arm');
 receiveWeaponInventory({weapon_plasma:23}, true);assert.equal(env.automaticStartRunRef.current,null,'a confirmed repurchase can restore the Auto weapon on explicit return');
 env.automaticStartRunRef.current='run-a';changeAutoReload(5,false);assert.equal(env.autoReloadRef.current[5],false);assert.equal(writes[0][0],'testnet:pilot-a');assert.equal(env.automaticStartRunRef.current,null);
 env.automaticStartRunRef.current='run-a';receiveWeaponInventory({weapon_plasma:24}, true);assert.equal(env.automaticStartRunRef.current,'run-a','disabled Auto remains disabled after a purchase');
});

test('the menu keeps confirmed stock and weapon choices usable during an inventory refresh', () => {
  const menu = weaponMenu({ onSelect() {} }, { ready: false, refreshing: true });
  assert.ok(menu.nodes.some(n => n.type === 'b' && n.props.children.includes(2)));
  assert.ok(!menu.nodes.some(n => n.type === 'b' && n.props.children.includes('…')));
  assert.equal(menu.card(2).props['data-owned'], true);
  const choices = menu.nodes.filter(n => n.props.className === 'mission-select' && !n.props.disabled);
  assert.deepEqual(choices.map(n => n.props.children[0]), ['Select', 'Select', 'Active weapon']);
  assert.equal(menu.nodes.find(n => n.props.className === 'mission-return').props.disabled, false);
  assert.equal(menu.nodes.find(n => n.type === 'WeaponPurchase').props.disabled, true);

  const unknown = weaponMenu({ stock: undefined, timers: [0, 0, 0, 12000], onSelect() {} }, { ready: false, refreshing: true });
  assert.deepEqual(unknown.nodes.filter(n => n.props.className === 'mission-select' && !n.props.disabled).map(n => n.props.children[0]), ['Select', 'Active weapon']);
});

test('a shared inventory request cannot overwrite a newer charge confirmation', async () => {
  const { env, requests, refreshWeaponInventory } = inventoryHost();
  const beforeActivation = refreshWeaponInventory();
  assert.equal(refreshWeaponInventory(), beforeActivation);
  assert.equal(requests.length, 1);
  env.stockRef.current = { weapon_plasma: 18 };
  requests[0]({ weapon_plasma: 19 });
  await beforeActivation;
  assert.equal(env.stockRef.current.weapon_plasma, 18);
  assert.equal(env.inventoryRequestRef.current, null);
});

test('a post-purchase read supersedes an older refresh and respects a later manual choice', async () => {
  const { env, requests, refreshWeaponInventory } = inventoryHost();
  const beforePurchase = refreshWeaponInventory();
  const afterPurchase = refreshWeaponInventory(true);
  env.manualWeaponChoiceRef.current++;
  requests[1]({ weapon_plasma: 22 });
  await afterPurchase;
  requests[0]({ weapon_plasma: 19 });
  await beforePurchase;
  assert.equal(env.stockRef.current.weapon_plasma, 22);
  assert.equal(env.automaticStartRunRef.current, 'run-a');
});

test('7 exact reviewed changes restore the complete public controller, including all payment and pause guards',()=>{
 const hash=t=>createHash('sha256').update(t).digest('hex');const restored=restoreWeaponMenuGameChanges(source);
 assert.equal(hash(restored),'dd41d1c39a361d5de2940ed8f8799a3699970d9fcda258d8fef30d494aca4d9e');
 assert.throws(()=>restoreWeaponMenuGameChanges(source.replace("if (!automatic || (['playing', 'paused'].includes(state.status)","if (!automatic || (true")),/one exact/);
 assert.notEqual(hash(restoreWeaponMenuGameChanges(source.replace('watch: callback => window.setInterval(callback, 500)','watch: callback => window.setInterval(callback, 1000)'))),hash(restored));
});
