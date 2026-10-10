import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import * as model from './galaxyModel.ts';
import { loadGalaxySnapshot, emptyGalaxySnapshot, readGalaxyGuestProgress } from './galaxyData.ts';
import { emptyRewardProgress, REWARD_PROGRESS_KEY } from './rewardProgress.ts';
import { bossManifest } from './bossManifest.ts';
import { bossName } from './bossNames.ts';
import { translate, languages } from '../i18n.ts';
import { galaxyMapTranslations } from '../locales/galaxyMap.ts';

test('500 unique levels ascend from the bottom across ten regions with exact port counts', () => {
  const stations = model.galaxyStations.flat();
  assert.equal(stations.length, 500);
  assert.deepEqual(stations.map(s => s.level).sort((a,b) => a-b), Array.from({ length: 500 }, (_,i) => i+1));
  assert.equal(stations.filter(s => s.boss).length, 50);
  assert.equal(stations.filter(s => s.mini).length, 100);
  assert.equal(stations.filter(s => s.trade).length, 10);
  for (let level=1;level<500;level++) assert.ok(model.galaxyPoint(level).mapY > model.galaxyPoint(level+1).mapY);
  for (const stations of model.galaxyStations) {
    assert.ok(stations.at(-1).y+90 < model.GALAXY_REGION_HEIGHT);
    assert.ok(model.galaxyRoute(stations).startsWith('M 50 0 C'));
  }
  for (let id=1;id<=50;id++) {
    const station=model.galaxyPoint(id*10);
    assert.equal(station.boss, bossManifest[id-1]);
    assert.equal(station.name, bossName(id));
    assert.equal(station.mini,true);
  }
});

test('saved reached stage is not counted as a completed level or a boss win', () => {
  const rewards=emptyRewardProgress(); rewards.highestLevel=180;
  const before=JSON.stringify(rewards), progress=model.galaxyProgress(rewards,180);
  assert.equal(progress.completedLevel,179); assert.equal(progress.currentLevel,180);
  assert.equal(model.eligibleMiniStations(progress.completedLevel).length,35);
  assert.equal(model.galaxyBossState(progress,18).defeated,false);
  assert.equal(JSON.stringify(rewards),before);
});

test('confirmed block and boss records yield retroactive eligibility without bypassing card releases', () => {
  const rewards=emptyRewardProgress(); rewards.linkedBlocks[18]=9; rewards.bossWins[18]=1;
  const progress=model.galaxyProgress(rewards);
  assert.equal(progress.completedLevel,180); assert.equal(progress.currentLevel,181);
  assert.equal(model.eligibleMiniStations(progress.completedLevel).length,36);
  assert.deepEqual(model.galaxyBossState(progress,18),{defeated:true,cardAvailable:false});
  assert.deepEqual(model.galaxyBossState({...progress,bossWins:{1:1}},1),{defeated:true,cardAvailable:true});
  assert.equal(model.galaxyBossState(progress,17).defeated,false);
  assert.equal(model.futureMiniGamePolicy.enabled,false);
  const final=model.galaxyProgress({...rewards,bossWins:{50:1}});
  assert.equal(final.currentLevel,500); assert.equal(final.completedLevel,500);
});

test('invalid records cannot create future stations or simulated boss wins', () => {
  const progress=model.galaxyProgress({...emptyRewardProgress(),highestLevel:900,linkedBlocks:{51:9,1:10},bossWins:{0:1,51:1,1:-1,2:1.5}},NaN);
  assert.deepEqual(progress,model.emptyGalaxyProgress());
});

test('guest progress uses existing origin-local records but never a different network override', () => {
  const data=new Map([[REWARD_PROGRESS_KEY,JSON.stringify({...emptyRewardProgress(),bossWins:{1:1}})],['cryptoid_highest_sector','18']]);
  const storage={getItem:key=>data.get(key)??null};
  assert.equal(readGalaxyGuestProgress(storage,'testnet','testnet').currentLevel,18);
  assert.deepEqual(readGalaxyGuestProgress(storage,'mainnet','testnet'),model.emptyGalaxyProgress());
  data.set('cryptoid_highest_sector_mainnet','42');
  assert.equal(readGalaxyGuestProgress(storage,'mainnet','testnet').currentLevel,42);
  assert.equal(data.size,3);
});

const unauthorized=()=>Promise.reject({response:{status:401}});
test('unauthenticated map remains available without invoking sign-in or any write',async()=>{
  const calls=[],get=path=>{calls.push(path);return unauthorized();};
  const guest={...emptyGalaxySnapshot(),progress:{currentLevel:18,completedLevel:17,bossWins:{}}};
  assert.equal(await loadGalaxySnapshot(get,'testnet',()=>guest),guest);
  assert.deepEqual(calls,['/user/me']);
  await assert.rejects(loadGalaxySnapshot(get,'testnet',()=>guest,'owner'));
});

test('account snapshot uses only four GETs, actual wins and equipped ship inventory',async()=>{
  const calls=[],rewards={...emptyRewardProgress(),bossWins:{1:2},highestLevel:11};
  const responses={'/user/me':{user:{uid:'qa'}},'/progress/me':{save:{skin:'nova-wing',color:'blue',highestSector:18}},'/rewards/me':{network:'testnet',progress:rewards},'/hangar/inventory':{ownedShipUpgrades:['ship_0_stage2']}};
  const before=JSON.stringify(responses),get=async path=>{calls.push(path);return {data:responses[path]};};
  const snapshot=await loadGalaxySnapshot(get,'testnet',()=>{throw Error('No guest fallback');},'qa');
  assert.deepEqual(calls.sort(),Object.keys(responses).sort());
  assert.equal(snapshot.progress.currentLevel,18); assert.deepEqual(snapshot.progress.bossWins,{1:2});
  assert.equal(snapshot.skin,'nova-wing'); assert.equal(snapshot.color,'blue');
  assert.deepEqual(snapshot.upgrades,['ship_0_stage2']); assert.equal(JSON.stringify(responses),before);
  await assert.rejects(loadGalaxySnapshot(get,'mainnet',emptyGalaxySnapshot,'qa'),/network mismatch/);
  await assert.rejects(loadGalaxySnapshot(get,'testnet',emptyGalaxySnapshot,'different'),/Account changed/);
});

test('network/server failures do not reinterpret old local records as an account save',async()=>{
  let guests=0;
  await assert.rejects(loadGalaxySnapshot(async()=>{throw {response:{status:503}};},'testnet',()=>{guests++;return emptyGalaxySnapshot();}));
  assert.equal(guests,0);
});

function component(file,imports,globals={}) {
  const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const exports={};vm.runInNewContext(code,{exports,require:name=>{
    if(name==='react/jsx-runtime')return jsx;
    if(name==='react'&&!imports.react)return {memo:fn=>fn,useRef:value=>({current:value}),useEffect:()=>{},useState:value=>[typeof value==='function'?value():value,()=>{}]};
    if(name.endsWith('.css'))return {};
    assert.ok(name in imports,`Unmapped dependency: ${name}`);return imports[name];
  },...globals});return exports.default;
}
const elements=tree=>{const result=[];const walk=node=>{if(!node||typeof node!=='object')return;if(node.type)result.push(node);for(const child of [node.props?.children].flat(Infinity))walk(child);};walk(tree);return result;};
const text=node=>typeof node==='string'?node:typeof node==='number'?String(node):Array.isArray(node)?node.map(text).join(''):node?.props?text(node.props.children):'';
const locale={'../i18n':{useLocale:()=>({t:source=>translate('de',source)})}};

test('actual sector buttons have labels and independent level, boss, mini-game and trade callbacks',()=>{
  const hits=[],Sector=component('./GalaxySector.tsx',{...locale,'./galaxyModel':model,'./GalaxyBossArt':{default:()=>null},'../components/BlockchainIcon':{default:()=>null}});
  const nodes=model.galaxyRegions.flatMap((_,region)=>elements(Sector({region,progress:model.emptyGalaxyProgress(),onSelect:value=>hits.push(value)})));
  const buttons=nodes.filter(node=>node.type==='button');
  assert.equal(buttons.length,660);
  for(const button of buttons)button.props.onClick();
  assert.equal(hits.filter(hit=>hit.kind==='level').length,500);
  assert.equal(hits.filter(hit=>hit.kind==='boss').length,50);
  assert.equal(hits.filter(hit=>hit.kind==='mini').length,100);
  assert.equal(hits.filter(hit=>hit.kind==='trade').length,10);
  for(const button of buttons.filter(node=>node.props.className==='galaxy-mini')) assert.match(text(button),/Minispiel/);
  for(const kind of ['level','boss','mini'])assert.ok(hits.some(hit=>hit.kind===kind&&hit.level===10));
});

test('dialogs preserve future-only mini-games and route trades into the supplied existing shop',()=>{
  const shop=[],Dialog=component('./GalaxyInfoDialog.tsx',{...locale,'./galaxyModel':model,'./GalaxyBossArt':{default:()=>null}});
  const props={progress:model.emptyGalaxyProgress(),onClose:()=>{},onCards:()=>{},onShop:value=>shop.push(value)};
  const mini=elements(Dialog({...props,selection:{kind:'mini',level:5}}));
  assert.equal(mini.filter(node=>node.type==='button').length,1);
  assert.match(text(mini.find(node=>node.type==='h2')),/Minispiel.*Entwicklung/);
  const trade=elements(Dialog({...props,selection:{kind:'trade',level:50}}));
  trade.filter(node=>node.type==='button'&&node.props.className!=='galaxy-dialog-close').forEach(node=>node.props.onClick());
  assert.deepEqual(shop,['shop','hangar']);
});

test('both native navigation entries use real callbacks and Quick access exposes the preview status',()=>{
  let opened=0;
  const Home=component('./CinematicHome.tsx',{...locale,'../components/ServiceBadge':{default:()=>null},'../components/BlockchainIcon':{default:()=>null},'./HomeEarthNetwork':{default:()=>null},'./gameFullscreen':{isGameFullscreen:()=>false}});
  const entry=elements(Home({onGalaxy:()=>opened++,paused:false,busy:false})).find(node=>node.type==='button'&&node.props.className==='cinematic-galaxy');
  assert.ok(entry);entry.props.onClick();assert.equal(opened,1);
  const actions=[],Quick=component('../components/QuickAccessMenu.tsx',{...locale,'./BlockchainIcon':{default:()=>null}});
  const menu=elements(Quick({onClose:()=>{},onAction:value=>actions.push(value),signedIn:false,canAdmin:false}));
  const quick=menu.find(node=>node.type==='button'&&text(node).includes('500'));
  assert.ok(quick);assert.match(text(quick),/Vorschau/);quick.props.onClick();assert.deepEqual(actions,['galaxy']);
});

test('all 19 selectable languages translate every new map string and retain their existing language choice',()=>{
  const keys=Object.keys(galaxyMapTranslations.en);
  for(const language of Object.keys(languages)) {
    assert.deepEqual(Object.keys(galaxyMapTranslations[language]).sort(),keys.slice().sort());
    for(const key of keys) {
      assert.ok(translate(language,key).trim(),`${language}: ${key}`);
      assert.equal(translate(language,key),galaxyMapTranslations[language][key]);
      if(language!=='en')assert.notEqual(translate(language,key),key,`${language}: ${key}`);
    }
  }
});
