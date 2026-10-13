import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as sector from './sectorManager.ts';
import { combatCryptoid, combatEntryStage, combatTiming } from './combatVariety.ts';
import { chooseCryptoid } from './cryptoidRoster.ts';
import { entryPatternForSector, entryPosition, entryStartX } from './entryPatterns.ts';
import { attackDuration, attackPosition } from './attackPatterns.ts';
import { enemyAppearance } from './shipFleet.ts';
import { slowerEnemyArrival } from './enemyArrival.ts';
import { blockFlights } from './blockFlights.ts';
import { placePlayer, contactWithEnemy, PLAYER_CONTACT_RADIUS } from './playerCombat.ts';

// Real component declarations, not a second layout/motion implementation.
const source=fs.readFileSync(process.env.CRYPTOID_FORMATION_SOURCE||new URL('./GamePage.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('game.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const names=['createFormationSlots','spawnAsteroid','moveAsteroid','attackTime','RETURN_DURATION_MS','ENTRY_HUD_GAP_PX'];
const declarations=[];
const visit=node=>{if(ts.isVariableDeclaration(node)&&names.includes(node.name.getText(ast)))declarations.push(`const ${node.getText(ast)};`);ts.forEachChild(node,visit);};visit(ast);
assert.equal(declarations.length,names.length);
const code=ts.transpileModule(declarations.join('\n')+'\nglobalThis.game={createFormationSlots,spawnAsteroid,moveAsteroid};',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
function game(testnet=true){const context={...sector,combatVarietyEnabled:testnet,chooseCryptoid:testnet?combatCryptoid:chooseCryptoid,combatEntryStage,combatTiming,entryPatternForSector,entryPosition,entryStartX,attackDuration,attackPosition,enemyAppearance,slowerEnemyArrival};vm.runInNewContext(code,context);return context.game;}

test('all normal formation flights dock close below the HUD without changing their silhouettes or sizes',()=>{
 const runtime=game();
 for(const [width,height,hud,diameter] of [[390,844,80,104],[430,932,90,107.5],[390,932,98,104]])
 for(let stage=1;stage<=500;stage++) {
  const plan=blockFlights(stage);let offset=0;
  for(const count of plan){
   const placed=runtime.createFormationSlots(stage,stage,width,height,hud,diameter,count,offset);
   const radii=Array.from({length:count},(_,index)=>combatCryptoid(stage,index+offset).radius);
   const base=sector.arrangeFormationBySize(sector.formationSlotsForCount(sector.formationLayout(stage,width,height,stage),count),radii);
   const top=Math.min(...placed.map((slot,index)=>slot.y-sector.formationTopExtent(radii[index]===25?radii[index]*1.5:radii[index],diameter)));
   assert.ok(Math.abs(top-hud-8)<1e-7,`${width} stage ${stage}/${offset} close HUD gap`);
   const shift=placed[0].y-base[0].y;
   placed.forEach((slot,index)=>{assert.equal(slot.x,base[index].x);assert.equal(slot.index,base[index].index);assert.ok(Math.abs(slot.y-base[index].y-shift)<1e-7);});
   offset+=count;
  }
 }
});

test('actual arrival and docking cannot contact the highest legal player position on a 390x844 field with the compact HUD',()=>{
 const runtime=game(),width=390,height=844,hud=80,diameter=104;
 for(let stage=1;stage<=500;stage++){
  let offset=0;
  for(const count of blockFlights(stage)){
   const slots=runtime.createFormationSlots(stage,stage,width,height,hud,diameter,count,offset);
   for(let index=0;index<count;index++){
    let enemy=runtime.spawnAsteroid(index,width,hud,index,stage,slots,offset);
    for(let frame=0;frame<=64;frame++){
     const before=enemy;enemy=runtime.moveAsteroid(enemy,enemy.entryDuration/64,width,height);
     const player=placePlayer(enemy.x,0,width,height);
     const contact=contactWithEnemy(player,width,height,enemy,true,false,0,before,player);
     assert.equal(contact.connected,false,`stage ${stage}/${offset}/${index} frame ${frame}`);
     assert.ok(height*.5-enemy.y-enemy.radius-PLAYER_CONTACT_RADIUS>=0);
    }
    assert.equal(enemy.y,enemy.entryTargetY);
   }
   offset+=count;
  }
 }
});

test('HUD resize corrections move both ways, remain idempotent, and preserve the Mainnet placement',()=>{
 const slots=sector.formationLayout(4,390,844),radii=[50,36,37.5,37.5,36,37.5];
 const first=sector.formationNearHud(slots,radii,80,104);
 assert.equal(sector.formationNearHud(first,radii,80,104),first);
 const down=sector.formationNearHud(first,radii,100,104);
 const back=sector.formationNearHud(down,radii,80,104);
 for(let index=0;index<first.length;index++)assert.ok(Math.abs(back[index].y-first[index].y)<1e-8);
 const mainnet=game(false),actual=mainnet.createFormationSlots(4,4,390,844,80,104);
 const sizes=actual.map((_,index)=>chooseCryptoid(4,index).radius);
 const expected=sector.formationBelowHud(sector.arrangeFormationBySize(sector.formationLayout(4,390,844,4),sizes),sizes,390,80,104);
 assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected);
});


test('an impossible short-field translation preserves the previous layout instead of silently compressing formations',()=>{
 const runtime=game();
 for(const [width,height,hud,diameter] of [[320,568,64,94],[390,700,64,104],[844,390,64,112]])
 for(let stage=1;stage<=500;stage++) {
  let offset=0;
  for(const count of blockFlights(stage)) {
   const actual=runtime.createFormationSlots(stage,stage,width,height,hud,diameter,count,offset);
   const physical=Array.from({length:count},(_,i)=>combatCryptoid(stage,i+offset).radius),visual=physical.map(r=>r===25?r*1.5:r);
   const base=sector.arrangeFormationBySize(sector.formationSlotsForCount(sector.formationLayout(stage,width,height,stage),count),physical);
   const proposed=sector.formationNearHud(base,visual,hud,diameter);
   if(!sector.formationFitsPlayerArea(proposed,physical,height))assert.deepEqual(JSON.parse(JSON.stringify(actual)),sector.formationBelowHud(base,visual,width,hud,diameter));
   else assert.equal(sector.formationFitsPlayerArea(actual,physical,height),true);
   offset+=count;
  }
 }
});
