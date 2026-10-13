import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as sector from './sectorManager.ts';
import {normalFormation,normalCombatArea,enemyFormationExtents,playerUpperExtent,splitCombatArea} from './combatArea.ts';
import {normalArrival} from './normalArrival.ts';
import {strengthVisualDiameter} from './shipDisplayScale.ts';
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
function game(testnet=true){const context={...sector,combatVarietyEnabled:testnet,chooseCryptoid:testnet?combatCryptoid:chooseCryptoid,combatEntryStage,combatTiming,entryPatternForSector,entryPosition,entryStartX,attackDuration,attackPosition,enemyAppearance,slowerEnemyArrival,normalFormation,normalArrival,strengthVisualDiameter};vm.runInNewContext(code,context);return context.game;}

test('all normal flights fit above an exact 50/50 split with distinct normalized hulls and unchanged contacts',()=>{
 const runtime=game();
 for(const [width,height,hud,diameter] of [[393,659,64,94],[320,568,64,94],[390,844,80,104],[1280,720,80,115],[800,600,80,112]])
 for(let stage=1;stage<=500;stage++)if(stage%10){
  const area=normalCombatArea(stage,width,height,hud,diameter);assert.equal(area.valid,true);
  let offset=0;
  for(const count of blockFlights(stage)){
   const placed=runtime.createFormationSlots(stage,stage,width,height,hud,diameter,count,offset);
   const anchor=placed.findIndex(slot=>slot.anchor);
   const visibleSizes=placed.map((_,index)=>strengthVisualDiameter(combatCryptoid(stage,index+offset).shipClass,diameter));
   assert.equal(visibleSizes[anchor],Math.max(...visibleSizes),'strongest visible class retains the formation anchor');
   placed.forEach((slot,index)=>{
    const profile=combatCryptoid(stage,index+offset),sprite=enemyAppearance(stage,index+offset).sprite,extent=enemyFormationExtents(profile.radius,profile.shipClass,sprite,diameter,area.visualScale);
    assert.ok(slot.y-extent.top>=hud+8-1e-7,'complete visible envelope stays below HUD');
    assert.equal(area.enemyHeight,area.playerHeight);
    assert.equal(area.divider,hud+(height-hud)/2);
    assert.ok(slot.y+extent.bottom<=area.enemyCeiling+1e-7,'enemy stays in its fixed half');
    assert.ok(area.minimumPlayerY*height-playerUpperExtent(diameter)>=area.divider+6-1e-7,'player hull stays in its fixed half');
    let enemy=runtime.spawnAsteroid(index,width,hud,index,stage,placed,offset);
    for(let frame=0;frame<24;frame++){
     const before=enemy;enemy=runtime.moveAsteroid(enemy,enemy.entryDuration/23,width,height);
     const player=placePlayer(enemy.x,0,width,height,area.minimumPlayerY);
     assert.equal(contactWithEnemy(player,width,height,enemy,true,false,0,before,player).connected,false,`arrival ${width}/${stage}/${offset}/${index}/${frame}`);
    }
   });offset+=count;
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


test('all strength classes are shown at distinct sizes; first 29 stages use the original real strength mixture',()=>{
 for(const diameter of [94,104,132,160]){
  const sizes=['light','medium','heavy','elite'].map(c=>strengthVisualDiameter(c,diameter));
  for(let i=1;i<sizes.length;i++)assert.ok(sizes[i]>sizes[i-1]);
  assert.equal(sizes[0],55*Math.max(1,diameter/94));
  assert.equal(sizes[2],sizes[0]*2);
 }
 for(let stage=1;stage<=29;stage++)if(stage%10){
  const profiles=Array.from({length:6},(_,i)=>combatCryptoid(stage,i));
  assert.ok(new Set(profiles.map(p=>p.shipClass)).size>=3);
  const signature=p=>JSON.stringify(p);
  assert.deepEqual(profiles.map(signature).sort(),Array.from({length:6},(_,i)=>chooseCryptoid(stage,i)).map(signature).sort(),'same complete existing profiles, including health/rewards');
 }
});

test('nine original silhouettes remain distinct, with different layouts in successive levels and extra flights',()=>{
 const signature=slots=>slots.map(s=>[s.x,s.y]);
 const layouts=Array.from({length:9},(_,i)=>sector.variedFormationLayout(i+1,390,844,i+1));
 assert.equal(new Set(layouts.map(s=>JSON.stringify(signature(s)))).size,9);
 for(let level=0;level<49;level++)assert.notDeepEqual(signature(sector.variedFormationLayout(1,390,844,level*10+1)),signature(sector.variedFormationLayout(1,390,844,(level+1)*10+1)));
 for(let flight=1;flight<3;flight++)assert.notDeepEqual(signature(sector.variedFormationLayout(1,390,844,39,flight-1)),signature(sector.variedFormationLayout(1,390,844,39,flight)));
});

test('moving an in-flight checkpoint/resize to its new target cannot leave a stale player-overlap endpoint',()=>{
 const context={...sector,combatVarietyEnabled:true,chooseCryptoid:combatCryptoid,combatEntryStage,combatTiming,entryPatternForSector,entryPosition,entryStartX,attackDuration,attackPosition,enemyAppearance,slowerEnemyArrival,normalFormation,normalArrival,strengthVisualDiameter};
 vm.runInNewContext(code,context);
 let helper,restoreTarget;
 const visit=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='retargetFormationY')helper=`const ${n.getText(ast)};globalThis.retarget=retargetFormationY;`;if(ts.isIfStatement(n)&&n.expression.getText(ast)==='slot'&&n.thenStatement.getText(ast).includes('enemy.entryTargetX'))restoreTarget=n.getText(ast);ts.forEachChild(n,visit);};visit(ast);
 assert.ok(restoreTarget,'execute the actual restore target branch');
 if(helper)vm.runInNewContext(ts.transpileModule(helper,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
 const width=390,height=844,engine=context.game,slots=engine.createFormationSlots(6,6,width,height,80,104);
 let enemy=engine.spawnAsteroid(1,width,80,4,6,slots);
 const target=enemy.entryTargetY;enemy.entryStartX=195;enemy.entryStartY=110;enemy.entryTargetY=height*.5;enemy=engine.moveAsteroid(enemy,enemy.entryDuration*.95,width,height);
 const player=placePlayer(enemy.x,0,width,height);
 assert.equal(contactWithEnemy(player,width,height,enemy,true,false,0).connected,true,'old saved position reproduces the overlap');
 const snapshot={elapsed:enemy.entryElapsed,duration:enemy.entryDuration,health:enemy.health,formationElapsed:enemy.formationElapsed};
 context.enemy=enemy;context.slot={x:enemy.entryTargetX,y:target};context.width=width;context.height=height;
 vm.runInNewContext(ts.transpileModule(restoreTarget,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
 assert.equal(contactWithEnemy(player,width,height,enemy,true,false,0).connected,false);
 const next=engine.moveAsteroid(enemy,16,width,height);
 assert.equal(contactWithEnemy(player,width,height,next,true,false,0,enemy,player).connected,false,'no artificial swept hit from stale restore endpoint');
 assert.deepEqual({elapsed:enemy.entryElapsed,duration:enemy.entryDuration,health:enemy.health,formationElapsed:enemy.formationElapsed},snapshot);
 const docked={...enemy,entryElapsed:enemy.entryDuration,y:target};context.retarget(docked,target-10,width,height);assert.equal(docked.y,target-10);
 const attacking={...enemy,attackPattern:'dive',y:410};context.retarget(attacking,target-10,width,height);assert.equal(attacking.y,410,'active attack position remains unchanged');
});
