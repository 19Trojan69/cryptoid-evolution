import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createPowerUpDrop } from './powerUps.ts';

const source=fs.readFileSync(new URL('./GamePage.tsx',import.meta.url),'utf8');
const tree=ts.createSourceFile('GamePage.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);

test('all new floating power-ups originate in the projectile/enemy defeat loop',()=>{
 const sites=[];
 const visit=node=>{
  if(ts.isCallExpression(node)&&node.expression.getText(tree)==='state.powerUps.push') sites.push(node);
  if(ts.isCallExpression(node)) assert.notEqual(node.expression.getText(tree),'safeEarlyPickup','no timed, player-position pickup');
  ts.forEachChild(node,visit);
 };visit(tree);
 assert.equal(sites.length,1);
 let parent=sites[0];let shotLoop=false;
 while(parent){if(ts.isForOfStatement(parent)&&parent.expression.getText(tree)==='state.shots')shotLoop=true;parent=parent.parent;}
 assert.equal(shotLoop,true);
});

const start=source.indexOf('          const enemy = state.asteroids.find(item => shotHitsEnemy(shot, item));');
const end=source.indexOf('\n        }\n        state.shots =',start);
assert.ok(start>=0&&end>start);
const actual=source.slice(start,end);
function hit(health,damage){
 const state={asteroids:health===null?[]:[{id:1,x:195,y:220,health,maxHealth:health,radius:25,sprite:0,rotation:0,type:'solflare',shipClass:'light',points:10,reward:2,attackPattern:null}],rocks:[],effects:[],rockEffects:[],powerUps:[],powerUpTypes:[],destroyed:0,score:0,sector:1,weaponLevel:1};
 const context={state,shots:[{id:2,x:195,y:220,damage}],previous:{x:195,y:221},remainingShots:[],width:390,height:844,time:1000,
  nextIdRef:{current:3},dropsCreatedRef:{current:0},attackCooldownRef:{current:0},elapsedRef:{current:1000},
  createPowerUpDrop,shotHitsEnemy:()=>true,rockHitsShot:()=>false,creditComboDefeat:s=>{s.destroyed++;},soundRef:{current:{play(){}}},gameHaptics:{explosion(){}},
  hullFireAtImpact:()=>({}),spriteFireSites:[[]],spriteVisualOffset:()=>({}),addPersistentHullFire:()=>[],hullFireLimit:()=>1,
  Math:Object.assign(Object.create(Math),{random:()=>0})};
 const compiled=ts.transpileModule('for(const shot of shots){'+actual+'}',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(compiled,context);return state;
}
test('actual hit handler creates no pickup without an enemy or on a nonlethal hit',()=>{
 assert.equal(hit(null,1).powerUps.length,0);
 assert.equal(hit(3,1).powerUps.length,0);
});
test('actual lethal hit handler drops at the defeated ship, preserving the duplicate ledger',()=>{
 const state=hit(3,3);
 assert.equal(state.asteroids.length,0);
 assert.equal(state.powerUps.length,1);
 assert.equal(state.powerUps[0].x,195);assert.equal(state.powerUps[0].y,220);
 assert.deepEqual(Array.from(state.powerUpTypes),[state.powerUps[0].type]);
});
