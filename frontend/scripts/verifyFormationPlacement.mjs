// Geometry/collision evidence from the real component, without a browser.
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import * as sector from '../src/pages/sectorManager.ts';
import { combatCryptoid } from '../src/pages/combatVariety.ts';
import { blockFlights } from '../src/pages/blockFlights.ts';
import { placePlayer, contactWithEnemy, PLAYER_CONTACT_RADIUS } from '../src/pages/playerCombat.ts';

const root=new URL('../../',import.meta.url);
const before=process.env.CRYPTOID_FORMATION_BASE||'640c43a5fb34fcc935fc449a31683f5c6a82c1aa';
const current=fs.readFileSync(new URL('../src/pages/GamePage.tsx',import.meta.url),'utf8');
function runtime(source) {
 const ast=ts.createSourceFile('game.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let code;
 const visit=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='createFormationSlots')code=`const ${node.getText(ast)};globalThis.create=createFormationSlots;`;ts.forEachChild(node,visit);};visit(ast);
 const context={...sector,combatVarietyEnabled:true,chooseCryptoid:combatCryptoid};
 vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);return context.create;
}
const createBefore=runtime(execFileSync('git',['show',before+':frontend/src/pages/GamePage.tsx'],{cwd:root,encoding:'utf8'}));
const createAfter=runtime(current);
function measure(create,width,height,hud,diameter){
 let minimum=Infinity,contacts=0,ships=0,flights=0,example=null;
 for(let stage=1;stage<=500;stage++){
  let offset=0;
  for(const count of blockFlights(stage)){
   const slots=create(stage,stage,width,height,hud,diameter,count,offset);flights++;
   slots.forEach((slot,index)=>{
    const enemy={...slot,radius:combatCryptoid(stage,index+offset).radius};
    const player=placePlayer(enemy.x,0,width,height);
    const clearance=height*.5-enemy.y-enemy.radius-PLAYER_CONTACT_RADIUS;
    minimum=Math.min(minimum,clearance);ships++;
    if(contactWithEnemy(player,width,height,enemy,true,false,0).connected){contacts++;example??={stage,flightOffset:offset,index,enemyY:enemy.y,radius:enemy.radius,playerY:player.y*height};}
   });offset+=count;
  }
 }
 return{flights,ships,minVerticalContactClearancePx:Math.round(minimum*1000)/1000,contactingDestinationsAtHighestLegalPlayer:contacts,example};
}
const cases=[[320,568,64,94],[390,700,64,104],[390,844,80,104],[390,844,100,104],[430,932,90,107.5],[768,1024,94,112],[1280,720,80,115],[844,390,64,112]].map(([width,height,hud,diameter])=>({width,height,assumedMeasuredHudBottom:hud,playerDiameter:diameter,before:measure(createBefore,width,height,hud,diameter),after:measure(createAfter,width,height,hud,diameter)}));
const report={before,mode:'Real formation creation and real contact rules; assumed explicit geometry fixtures, no DOM/native rendering or measured user viewport',requiredHudEnvelopeGapPx:8,formationRelativeCoordinatesUnchanged:true,steeringAndCollisionRulesUnchanged:true,cases,limits:'Uniform translation cannot guarantee both HUD clearance and player separation when the unchanged formation span cannot fit the available upper half. Those geometries are reported as unresolved; no invisible invulnerability, ship reduction or steering restriction was added.'};
if(process.env.CRYPTOID_FORMATION_OUT)fs.writeFileSync(process.env.CRYPTOID_FORMATION_OUT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
