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
import * as availability from './ownerTestnetCatalog.ts';
import * as evolution from './shipEvolution.ts';
import * as attributes from './shipAttributes.ts';
import { hangarCatalog } from '../../../backend/src/hangarCatalog.ts';
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
 const modules = {'react/jsx-runtime':jsx,'./ShipPreview':{default:()=>null},'../components/PiPrice':{default:Price},'../i18n':{useLocale:()=>({locale:'en',t:s=>s})},'./ownerTestnetCatalog':availability,'./shipFleet':fleet,'./shipEvolution':evolution,'./shipAttributes':attributes,...extra};
 vm.runInNewContext(code,{exports,require:name=>{if(!modules[name])throw Error(`Unstubbed ${name}`);return modules[name];}});
 return exports.default;
}
const Purchase = component('./TestPiPurchase.tsx');
const Panel = component('./ShipSelectionPanel.tsx',{'./TestPiPurchase':{default:Purchase}});
const nodes = tree => {const out=[]; const visit=n=>{if(!n||typeof n!=='object')return;if(n.type)out.push(n);[n.props?.children].flat(Infinity).forEach(visit);};visit(tree);return out;};
const defaults = () => ({view:'shop',skin:fleet.playerSkins[0],color:fleet.playerColors[0],focusStage:1,ownedStage:1,fleet:{'grey-scout':{silver:1}},shards:10000,locale:'en',offers:hangarCatalog.filter(x=>x.kind==='ship_upgrade'),message:'',selectedSkinId:'grey-scout',selectedColorId:'silver',t:s=>s,onStageChange:()=>{},onColorChange:()=>{},onBuyStandard:()=>{},onEquipPreview:()=>{},onOpenShop:()=>{}});

test('owner permission expands every catalog item strictly on Pi Testnet',()=>{
 for(const offer of hangarCatalog){
  assert.equal(testPiPurchaseAllowed(offer,'Pi Testnet',true),true,offer.id);
  for(const network of ['Pi Network','testnet',undefined])assert.equal(testPiPurchaseAllowed(offer,network,true),false,offer.id);
  assert.equal(testPiPurchaseAllowed(offer,'Pi Testnet'),['weapon_twin','weapon_rapid_twin'].includes(offer.id));
 }
 assert.equal(testPiPurchaseAllowed(undefined,'Pi Testnet',true),false);
 assert.equal(isTestnetWeaponPurchaseEnabled({id:'unknown',kind:'weapon'},true),false);
});

test('all Standard hulls can be bought by owner only after enough Shards, with original prices',()=>{
 for(const skin of fleet.playerSkins){
  assert.equal(availability.standardHullAvailable(skin.id,true),true);
  const props={...defaults(),skin,testnetCatalogAccess:true};
  const buy=p=>nodes(Panel({...props,...p})).find(n=>n.props.className?.includes('ship-shard-button'));
  const price=fleet.standardShipPrice(skin);
  assert.equal(Boolean(buy({shards:price-1}).props.disabled),true);
  assert.equal(Boolean(buy({shards:price}).props.disabled),false);
  assert.equal(Boolean(buy({shards:price,purchaseBusy:true}).props.disabled),true);
 }
 assert.equal(availability.standardHullAvailable('core-carrier'),false);
});

test('Advanced and Elite checkout keeps base hull, prerequisite, busy and confirmed ownership gates',()=>{
 let offerId;
 const base={...defaults(),testnetCatalogAccess:true,onBuyUpgrade:offer=>{offerId=offer.id;}};
 const purchase=props=>nodes(Panel({...base,...props})).find(n=>n.type===Purchase);
 assert.equal(Boolean(purchase({focusStage:2}).props.disabled),false);
 purchase({focusStage:2}).props.onBuy();assert.equal(offerId,'ship_02_stage_2');
 assert.equal(Boolean(purchase({focusStage:2,fleet:{}}).props.disabled),true);
 assert.equal(Boolean(purchase({focusStage:3,ownedStage:1}).props.disabled),true);
 assert.equal(Boolean(purchase({focusStage:3,ownedStage:2}).props.disabled),false);
 assert.equal(Boolean(purchase({focusStage:3,ownedStage:2,purchaseBusy:true}).props.disabled),true);
 assert.equal(purchase({focusStage:2,ownedStage:2}),undefined);
 assert.equal(purchase({focusStage:3,testnetCatalogAccess:false}),undefined);
 const html=renderToStaticMarkup(jsx.jsx(Panel,{...base,focusStage:2}));
 assert.match(html,/Buy with Test-Pi/);assert.doesNotMatch(html,/MAINNET READY/);
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
