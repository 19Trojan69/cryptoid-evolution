import test from 'node:test';
import { languages, translate } from '../i18n.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import * as fleet from './shipFleet.ts';
import * as evolution from './shipEvolution.ts';
import * as attributes from './shipAttributes.ts';
import { hangarCatalog } from '../../../backend/src/hangarCatalog.ts';
import { shipNftEditions } from '../../../backend/src/shipNftCatalog.ts';
import * as liveries from '../../../backend/src/shipLivery.ts';
import { shipNftCopy } from '../locales/shipNft.ts';
import { testPiPurchaseAllowed, isTestnetWeaponPurchaseEnabled } from '../../../backend/src/paymentPolicy.ts';
import { availableShipCards } from './cardRevealRules.ts';
import { bossCardAvailable, shipCardAvailable } from './cardAvailability.ts';
import { playerCardUnlocked } from './collectionRules.ts';
import { restoreOwnerTestnetGameChanges } from '../../scripts/ownerTestnetReviewedChanges.mjs';

const Price = ({amount,testnet}) => jsx.jsxs('span',{children:[amount,testnet?' Test-Pi':' Pi']});
function component(file, extra = {}) {
 const source = readFileSync(new URL(file, import.meta.url),'utf8');
 const code = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports = {};
 const modules = {'react/jsx-runtime':jsx,'./ShipPreview':{default:()=>null},'../components/PiPrice':{default:Price},'../i18n':{useLocale:()=>({locale:'en',t:s=>s})},'./shipFleet':fleet,'./shipEvolution':evolution,'./shipAttributes':attributes,'../../../backend/src/shipNftCatalog':{shipNftEditions},'../../../backend/src/shipLivery.ts':liveries,'../locales/shipNft':{shipNftCopy},'./shipNftVisibility':{shipNftMainnetVisible:false},...extra};
 vm.runInNewContext(code,{exports,require:name=>{if(!modules[name])throw Error(`Unstubbed ${name}`);return modules[name];}});
 return exports.default;
}
const Purchase = component('./TestPiPurchase.tsx');
const Panel = component('./ShipSelectionPanel.tsx',{'./TestPiPurchase':{default:Purchase}});
const nodes = tree => {const out=[]; const visit=n=>{if(!n||typeof n!=='object')return;if(n.type)out.push(n);[n.props?.children].flat(Infinity).forEach(visit);};visit(tree);return out;};
const defaults = () => ({view:'shop',skin:fleet.playerSkins[0],focusStage:1,ownedStage:1,fleet:{'grey-scout':{silver:1}},shards:10000,locale:'en',offers:hangarCatalog.filter(x=>x.kind==='ship_upgrade'),message:'',selectedSkinId:'grey-scout',t:s=>s,onStageChange:()=>{},onBuyStandard:()=>{},onEquipPreview:()=>{},onOpenShop:()=>{}});

test('owner permission expands every catalog item strictly on Pi Testnet',()=>{
 for(const offer of hangarCatalog){
  assert.equal(testPiPurchaseAllowed(offer,'Pi Testnet',true),true,offer.id);
  for(const network of ['Pi Network','testnet',undefined])assert.equal(testPiPurchaseAllowed(offer,network,true),false,offer.id);
  assert.equal(testPiPurchaseAllowed(offer,'Pi Testnet'),['weapon_twin','weapon_rapid_twin'].includes(offer.id));
 }
 assert.equal(testPiPurchaseAllowed(undefined,'Pi Testnet',true),false);
 assert.equal(isTestnetWeaponPurchaseEnabled({id:'unknown',kind:'weapon'},true),false);
});

test('all Standard hulls in the prepared Mainnet catalog keep their original Shard prices',()=>{
 const MainnetPanel = component('./ShipSelectionPanel.tsx',{'./TestPiPurchase':{default:Purchase},'./shipNftVisibility':{shipNftMainnetVisible:true}});
 for(const skin of fleet.playerSkins){
  const props={...defaults(),skin,fleet:{}};
  const buy=p=>nodes(MainnetPanel({...props,...p})).find(n=>n.props.className?.includes('ship-shard-button'));
  const price=fleet.standardShipPrice(skin);
  assert.equal(Boolean(buy({shards:price-1}).props.disabled),true);
  assert.equal(Boolean(buy({shards:price}).props.disabled),false);
  assert.equal(Boolean(buy({shards:price,purchaseBusy:true}).props.disabled),true);
 }
 assert.equal(fleet.standardHullAvailable('core-carrier'),false);
});

test('public Testnet offers the free starter and exactly two Shard hulls, while owner and Mainnet catalogs remain separate', () => {
 const available = (network, mainnet = false, owner = false) => fleet.playerSkins.filter(skin => fleet.standardHullAvailableForNetwork(skin.id, network, mainnet, owner));
 assert.deepEqual(available('testnet').map(skin => skin.id), ['grey-scout', 'nova-wing', 'solar-lance']);
 assert.deepEqual(available('testnet', true).map(skin => skin.id), ['grey-scout', 'nova-wing', 'solar-lance'], 'a Mainnet feature flag cannot expand public Testnet');
 assert.deepEqual(available('testnet').filter(skin => skin.price > 0).map(skin => skin.price), [150, 400]);
 assert.equal(available('testnet', false, true).length, 20);
 assert.equal(available('mainnet').length, 10);
 assert.equal(available('mainnet', false, true).length, 10, 'owner Testnet permission does not open Mainnet hulls');
 assert.equal(available('mainnet', true).length, 20);
 assert.equal(fleet.standardHullAvailableForNetwork('unknown', 'testnet', false, true), false);
});

test('the actual Testnet panel keeps all hull previews visible but locks new purchases beyond Solar Lance', () => {
 const TestnetPanel = component('./ShipSelectionPanel.tsx', { './shipFleet': { ...fleet,
   standardHullAvailable: (skin, mainnet, owner) => fleet.standardHullAvailableForNetwork(skin, 'testnet', mainnet, owner),
 } });
 for (const skin of fleet.playerSkins.slice(1)) {
   const props = { ...defaults(), skin, fleet: {} };
   const tree = nodes(TestnetPanel(props));
   const button = tree.find(node => node.props.className?.includes('ship-shard-button'));
   assert.ok(button, skin.id);
   assert.equal(Boolean(button.props.disabled), !['nova-wing', 'solar-lance'].includes(skin.id), skin.id);
   const html = renderToStaticMarkup(jsx.jsx(TestnetPanel, props));
   assert.ok(html.includes(skin.name));
   assert.equal(html.includes('MAINNET READY'), !['nova-wing', 'solar-lance'].includes(skin.id), skin.id);
   const owner = nodes(TestnetPanel({ ...props, ownerTestnet: true }));
   assert.equal(Boolean(owner.find(node => node.props.className?.includes('ship-shard-button')).props.disabled), false, skin.id);
 }
 const owned = TestnetPanel({ ...defaults(), skin: fleet.playerSkins[19], fleet: { 'core-carrier': { grey: 1 } }, selectedStage: 1, selectedSkinId: 'grey-scout' });
 assert.ok(nodes(owned).some(node => node.props.className?.includes('ship-equip-button') && !node.props.disabled), 'previously owned hulls remain selectable');
});

test('Advanced and Elite list planned Pi prices and keep checkout locked',()=>{
 for (const [stage, price] of [[2, 9.9], [3, 19.9]]) {
  const props = { ...defaults(), focusStage: stage, ownedStage: stage - 1 };
  const tree = nodes(Panel(props));
  assert.equal(tree.some(node => node.type === Purchase), false);
  assert.equal(tree.find(node => node.type === 'button' && node.props.children === 'Purchases locked')?.props.disabled, true);
  assert.ok(tree.some(node => node.type === Price && node.props.amount === price && !node.props.testnet));
  const html = renderToStaticMarkup(jsx.jsx(Panel, props));
  assert.match(html, /Planned price/);
  assert.doesNotMatch(html, /Test-Pi/);
 }
});

test('expanded collection still requires an acquired hull and its actually bought stage',()=>{
 const skin=fleet.playerSkins[19];
 const cards=(inventory,upgrades=[])=>availableShipCards(fleet.playerSkins,inventory,[],upgrades,true);
 assert.deepEqual(cards({}),[]);
 assert.equal(cards({[skin.id]:{gold:1}}).length,1);
 assert.equal(cards({[skin.id]:{gold:1}},['ship_20_stage_2']).length,2);
 assert.equal(cards({[skin.id]:{gold:1}},['ship_20_stage_2','ship_20_stage_3']).length,3);
 assert.deepEqual(availableShipCards(fleet.playerSkins,{[skin.id]:{gold:1}},[],[]),[]);
 assert.equal(playerCardUnlocked(skin.id,skin.sprite,3,[skin.id],['ship_20_stage_2']),false);
 assert.equal(bossCardAvailable(50,true),true);assert.equal(bossCardAvailable(50),false);assert.equal(bossCardAvailable(51,true),false);
 assert.equal(shipCardAvailable(19,3,true),true);assert.equal(shipCardAvailable(20,3,true),false);
});

test('the actual ship panel describes the selected pickup benefit in every selectable language', () => {
 for (const locale of Object.keys(languages)) for (const stage of [1,2,3]) {
  const tree=Panel({...defaults(),focusStage:stage,locale,adminPreview:true,t:source=>translate(locale,source)});
  const benefit=nodes(tree).find(node=>node.props?.className==='ship-version-benefits');
  assert.ok(benefit);
  assert.equal(benefit.props.children.length,2);
  const html=renderToStaticMarkup(benefit);
  const percent=new Intl.NumberFormat(locale,{style:'percent',maximumFractionDigits:0}).format([0,.1,.2][stage-1]);
  assert.ok(html.includes(translate(locale,'Power-up pickup radius')),locale+':'+stage);
  assert.ok(html.includes('+'+percent),locale+':'+stage);
 }
});

test('three exact controller permission arguments restore the complete released controller',()=>{
 const source=readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
 const pinned=readFileSync(new URL('../../scripts/ownerTestnetController.sha256',import.meta.url),'utf8').trim();
 const hash=text=>createHash('sha256').update(text).digest('hex');
 assert.equal(hash(restoreOwnerTestnetGameChanges(source)),pinned);
 assert.notEqual(hash(restoreOwnerTestnetGameChanges(source.replace('watch: callback => window.setInterval(callback, 500)','watch: callback => window.setInterval(callback, 1000)'))),pinned);
});
