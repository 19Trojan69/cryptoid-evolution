import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import * as fleet from './shipFleet.ts';
import * as evolution from './shipEvolution.ts';
import {hangarCatalog} from '../../../backend/src/hangarCatalog.ts';
const PaintedShip=()=>null;
const code=ts.transpileModule(readFileSync(new URL('./ShipSelectionPanel.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const exports={};
vm.runInNewContext(code,{exports,require:name=>({'react/jsx-runtime':jsx,'./PaintedShip':{default:PaintedShip},'../components/PiPrice':{default:()=>null},'./shipFleet':fleet,'./shipEvolution':evolution,'./shipPreviewPlacement':{shipPreviewPlacement:()=>({})}})[name]});
const Panel=exports.default;
const nodes=tree=>{const out=[];function walk(node){if(!node||typeof node!=='object')return;if(node.type)out.push(node);for(const child of [node.props?.children].flat(Infinity))walk(child);}walk(tree);return out;};
const label=node=>typeof node==='string'?node:Array.isArray(node)?node.map(label).join(''):node?.props?label(node.props.children):'';
const defaults=()=>({view:'shop',skin:fleet.playerSkins[0],color:fleet.playerColors[0],focusStage:1,ownedStage:1,fleet:{'grey-scout':{silver:1}},shards:500,locale:'de',offers:hangarCatalog.filter(x=>x.kind==='ship_upgrade'),message:'',selectedSkinId:'nova-wing',selectedColorId:'silver',t:x=>x,onStageChange:()=>{},onColorChange:()=>{},onBuyStandard:()=>{},onEquipPreview:()=>{},onOpenShop:()=>{}});

test('all versions use one preview with the corresponding stage, paint and actual offer',()=>{
  for(const stage of [1,2,3]){
    const clicks=[],props={...defaults(),focusStage:stage,onStageChange:x=>clicks.push(x)};
    const tree=nodes(Panel(props));const tabs=tree.find(x=>x.props.className==='ship-version-tabs');
    const buttons=nodes(tabs).filter(x=>x.type==='button');assert.equal(buttons.length,3);
    assert.deepEqual(buttons.map(x=>x.props['aria-pressed']),[stage===1,stage===2,stage===3]);
    buttons.forEach(x=>x.props.onClick());assert.deepEqual(clicks,[1,2,3]);
    const artwork=tree.filter(x=>x.type===PaintedShip);assert.equal(artwork.length,1);assert.equal(artwork[0].props.stage,stage);assert.equal(artwork[0].props.color,'silver');
    assert.equal(tree.some(x=>x.props.className==='ship-evolution-stage-art'),false);
    if(stage>1)assert.ok(tree.some(x=>x.type==='p'&&label(x).includes(stage===2?'one free':'two free')));
  }
});

test('shard balance, released hulls, busy state and Pi locks still gate purchases',()=>{
  const buy=props=>nodes(Panel({...defaults(),...props})).find(x=>x.type==='button'&&x.props.className?.includes('ship-shard-button'));
  assert.equal(Boolean(buy({shards:149}).props.disabled),true);
  assert.equal(Boolean(buy({shards:150}).props.disabled),false);
  assert.equal(Boolean(buy({purchaseBusy:true}).props.disabled),true);
  assert.equal(Boolean(buy({skin:fleet.playerSkins[19],shards:10000}).props.disabled),true);
  for(const focusStage of [2,3]){
    const buttons=nodes(Panel({...defaults(),focusStage})).filter(x=>x.type==='button'&&label(x).includes('Purchases locked'));
    assert.equal(buttons.length,1);assert.equal(buttons[0].props.disabled,true);
  }
});

test('hangar previews only equip the owned paint at the actual owned stage',()=>{
  let equipped=0,color;
  const props={...defaults(),view:'hangar',ownedStage:2,focusStage:2,fleet:{'grey-scout':{silver:1,gold:1}},onEquipPreview:()=>equipped++,onColorChange:x=>color=x.id};
  let tree=nodes(Panel(props));const equip=tree.find(x=>x.props.className?.includes('ship-equip-button'));
  assert.ok(equip);equip.props.onClick();assert.equal(equipped,1);
  const paints=tree.filter(x=>x.type==='button'&&x.props.title);assert.equal(paints.length,2);paints.find(x=>x.props.title==='Gold').props.onClick();assert.equal(color,'gold');assert.equal(equipped,1);
  for(const focusStage of [1,3])assert.equal(nodes(Panel({...props,focusStage})).some(x=>x.props.className?.includes('ship-equip-button')),false);
  tree=nodes(Panel({...props,selectedSkinId:'grey-scout'}));assert.equal(tree.find(x=>x.props.className?.includes('ship-equip-button')).props.disabled,true);
});

test('missing standard ownership and an unowned color never expose an equip action',()=>{
  for(const props of [{fleet:{}},{color:fleet.playerColors[1]}])assert.equal(nodes(Panel({...defaults(),...props})).some(x=>x.props.className?.includes('ship-equip-button')),false);
});
