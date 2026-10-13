import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as area from '../src/pages/combatArea.ts';
import {strengthVisualDiameter,enemyVisualDiameter,normalEnemyVisualDiameter,normalEnemyLayoutScale} from '../src/pages/shipDisplayScale.ts';
import * as player from '../src/pages/playerCombat.ts';
import {shipFireInterval,makeShipVolley} from '../src/pages/shipAttributes.ts';
import {stageWeaponLevel} from '../src/pages/shipEvolution.ts';
import {BOSS_HEART_POSITION,collectBossHeart} from '../src/pages/bossReward.ts';
import {bossEscortCount,reactorEscortCount} from '../src/pages/bossEscorts.ts';
import {normalArrival} from '../src/pages/normalArrival.ts';
import {entryPosition,entryStartX,entryPatternForSector} from '../src/pages/entryPatterns.ts';
import {combatEntryStage,combatCryptoid,combatTiming} from '../src/pages/combatVariety.ts';
import {slowerEnemyArrival} from '../src/pages/enemyArrival.ts';
// Use the shared immutable tree: local and connector commits have different
// metadata/SHAs, but every checkout contains this same audited source tree.
const root=new URL('../../',import.meta.url),base=process.env.CRYPTOID_AREA_BASE||'dd41e366c703b6d50e46021d942d4ae2fd076434';
const file='frontend/src/pages/GamePage.tsx',source=fs.readFileSync(new URL('../src/pages/GamePage.tsx',import.meta.url),'utf8'),old=execFileSync('git',['show',base+':'+file],{cwd:root,encoding:'utf8'});
const map=s=>{const ast=ts.createSourceFile('game.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),m=new Map();const visit=n=>{if(ts.isVariableDeclaration(n)&&n.initializer)m.set(n.name.getText(ast),n.initializer.getText(ast));ts.forEachChild(n,visit);};visit(ast);return m;};
const before=map(old),after=map(source),unchanged=['moveAsteroid','attackTime','destroyBoss','saveCombat','activateStartPower'];
for(const name of unchanged)assert.equal(after.get(name),before.get(name),name);
assert.equal(after.get('simulate').replace('movePlayer(state.player, horizontal, vertical, delta, width, height, combatAreaRef.current.minimumY);','movePlayer(state.player, horizontal, vertical, delta, width, height);').replace('collectBossHeart(state, state.player, width, height, combatAreaRef.current.rewardPosition)','collectBossHeart(state, state.player, width, height)'),before.get('simulate'),'all simulation except approved keyboard boundary remains identical');
const visual='(combatVarietyEnabled && !asteroid.escort ? normalEnemyVisualDiameter(asteroid.shipClass, playerDisplayDiameter, sprite, combatAreaRef.current.visualScale) : enemyVisualDiameter(asteroid.radius, playerDisplayDiameter, combatVarietyEnabled && asteroid.size === "small"))';
assert.equal(after.get('renderScene').replace(visual,'enemyVisualDiameter(asteroid.radius, playerDisplayDiameter, combatVarietyEnabled && asteroid.size === "small")').replaceAll('combatAreaRef.current.rewardPosition.x','BOSS_HEART_POSITION.x').replaceAll('combatAreaRef.current.rewardPosition.y','BOSS_HEART_POSITION.y'),before.get('renderScene'),'only approved normal enemy visual sizing changes the scene markup');
assert.equal(after.get('restoreCombat').replace("    combatAreaRef.current.sector = 0;\n",''),before.get('restoreCombat'),'saved state changes only invalidate geometry cache');
for(const path of ['frontend/src/pages/gameAudio.ts','frontend/src/pages/musicPlayback.ts','frontend/src/pages/shipMaterial.ts','frontend/src/pages/bossWeaponRenderer.ts','frontend/src/pages/shipAttributes.ts'])assert.equal(fs.readFileSync(new URL(path,root),'utf8'),execFileSync('git',['show',base+':'+path],{cwd:root,encoding:'utf8'}),path);
const rewardFile='frontend/src/pages/bossReward.ts',rewardOld=execFileSync('git',['show',base+':'+rewardFile],{cwd:root,encoding:'utf8'});
assert.equal(fs.readFileSync(new URL(rewardFile,root),'utf8'),rewardOld.replace('width: number, height: number) {','width: number, height: number, position = BOSS_HEART_POSITION) {').replaceAll('player.x - BOSS_HEART_POSITION.x','player.x - position.x').replaceAll('player.y - BOSS_HEART_POSITION.y','player.y - position.y'),'boss reward changes only optional collection position, never its radius/value/once-only protection');
const changed=execFileSync('git',['diff','--name-only',base,'--'],{cwd:root,encoding:'utf8'}).trim().split('\n');assert.deepEqual(changed.filter(p=>p.endsWith('.css')||p.startsWith('frontend/public/')),[]);

const cases=[];let flights=0,sideEntries=0;
for(const [width,height,hud,diameter] of [[393,659,64,94],[320,568,64,94],[390,844,80,104],[430,932,90,107.5],[768,1024,94,132],[1280,720,80,115],[800,600,80,112]]){
 let minimum=1,maximum=0,clearance=Infinity;
 for(let stage=1;stage<=500;stage++)if(stage%10){
  const campaign=area.campaignCombatArea(stage,width,height,hud,diameter),current=area.normalCombatArea(stage,width,height,hud,diameter);
  assert.equal(campaign.valid,true);assert.equal(campaign.enemyHeight,campaign.playerHeight);assert.equal(campaign.divider,hud+(height-hud)/2);minimum=Math.min(minimum,campaign.minimumPlayerY);maximum=Math.max(maximum,campaign.minimumPlayerY);
  const legal=player.placePlayer(width/2,0,width,height,campaign.minimumPlayerY);let offset=0;
  current.flights.forEach((flight,group)=>{flights++;flight.slots.forEach((slot,index)=>{
   const profile=combatCryptoid(stage,index+offset),enemy={...slot,radius:profile.radius};
   assert.ok(slot.y+profile.radius<=campaign.enemyCeiling+1e-7);
   assert.equal(player.contactWithEnemy({...legal,x:slot.x/width},width,height,enemy,true,false,0).connected,false);
   clearance=Math.min(clearance,legal.y*height-slot.y-profile.radius-player.PLAYER_CONTACT_RADIUS);
   const choreography=combatEntryStage(stage,group),pattern=entryPatternForSector(choreography+group*3),side=slot.entrySide*(group%2?-1:1);
   const route={pattern,startX:entryStartX(pattern,index,width,profile.radius,side,choreography,slot.x),startY:hud+profile.radius+8,targetX:slot.x,targetY:slot.y,width,height,radius:profile.radius,side,index,stage:choreography};
   const duration=slowerEnemyArrival(Math.round((combatTiming(stage).entryMs+(profile.shipClass==='heavy'?600:0))*1.1));
   const incoming=normalArrival(route,duration,stage,group,slot.visualDiameter);
   assert.equal(incoming.duration,duration,'no extra readiness wait or firing delay');if(incoming.startX<0||incoming.startX>width)sideEntries++;
   for(let step=0;step<=32;step++){
    const point=entryPosition({...route,startX:incoming.startX,startY:incoming.startY,progress:step/32});
    assert.equal(player.contactWithEnemy({...legal,x:Math.max(30,Math.min(width-30,point.x))/width},width,height,{...point,radius:profile.radius},true,false,0).connected,false);
   }
  });offset+=flight.slots.length;});
 }
 cases.push({width,height,assumedHudBottom:hud,playerDiameter:diameter,minimumBoundary:minimum,maximumBoundary:maximum,minimumVerticalContactClearancePx:clearance,all450StagesAndFlightsValid:true});
}

let computations=0;
const state={sector:6,encounter:'normal',asteroids:[],player:{x:.5,y:.5}},context={...area,...player,BOSS_HEART_POSITION,combatVarietyEnabled:true,campaignCombatArea:(...args)=>{computations++;return area.campaignCombatArea(...args);},enemyVisualDiameter,normalEnemyLayoutScale,bossEscortCount,reactorEscortCount,stateRef:{current:state},fieldSizeRef:{current:{width:393,height:659}},playerDiameterRef:{current:94},visibleTopRef:{current:64},rulesVersionRef:{current:2},combatAreaRef:{current:{sector:0,mode:'',width:0,height:0,hud:0,diameter:0,rules:0,minimumY:.5,valid:true}},lastPlayerRef:{current:null},playerShipRef:{current:null}};
vm.runInNewContext(ts.transpileModule('globalThis.refresh='+after.get('refreshCombatArea'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
assert.equal(context.refresh(),true);assert.equal(state.player.y,area.campaignCombatArea(6,393,659,64,94).minimumPlayerY);assert.ok(state.player.y>.5);const border=state.player.y,started=performance.now();
for(let frame=0;frame<10000;frame++)assert.equal(context.refresh(),true);
const cachedMilliseconds=performance.now()-started;
for(let stage=1;stage<=9;stage++){state.sector=stage;context.refresh();assert.equal(context.combatAreaRef.current.minimumY,border);}
assert.equal(computations,1,'no repeated layout work while shooting or changing blocks within the level');
context.combatAreaRef.current.sector=0;state.player.y=.5;context.refresh();assert.equal(state.player.y,border);assert.equal(context.lastPlayerRef.current.y,border,'restore snap cannot make a false swept contact');
for(const encounter of ['boss-intro','boss-fight','boss-clear','bonus','normal']){
 state.encounter=encounter;state.sector=encounter==='normal'?11:10;
 assert.equal(context.refresh(),true);assert.equal(context.combatAreaRef.current.minimumY,border,'normal/boss/bonus cannot take space from the player half');
 const rewardPosition=context.combatAreaRef.current.rewardPosition;
 const legal=player.placePlayer(rewardPosition.x*393,rewardPosition.y*659,393,659,border);
 const reward={hearts:2,maxHearts:3,shards:20};assert.equal(collectBossHeart(reward,legal,393,659,rewardPosition),true);
 assert.equal(collectBossHeart(reward,legal,393,659,rewardPosition),false);assert.equal(reward.hearts,3);assert.equal(reward.shards,20);
}
state.asteroids=[{escort:false,radius:50,shipClass:'heavy',sprite:0,entryTargetY:600}];
context.combatAreaRef.current.sector=0;
assert.equal(context.refresh(),false,'an invalid saved target is protected, never accommodated by enlarging enemy space');
assert.equal(context.combatAreaRef.current.minimumY,border,'even invalid legacy geometry cannot move the fixed divider');

const firing=s=>s.slice(s.indexOf('        if (transitionPaused) fireTimerRef.current = 0;'),s.indexOf('        const remainingShots: PlayerShot[] = [];'));
assert.equal(firing(source),firing(old),'firing code byte-identical');
const shots=[];
for(const level of [1,2,3,4,5]){
 const run=s=>{const c={transitionPaused:false,delta:16,time:0,width:393,height:659,state:{weaponLevel:level,rapidFireMs:0,overdriveMs:0,shots:[],player:{x:.5,y:.8}},fireTimerRef:{current:0},shipStageRef:{current:1},shipSelectionRef:{current:{skin:{id:'grey-scout'}}},nextIdRef:{current:1},playerMuzzleRef:{current:0},soundRef:{current:{play(){}}},stageWeaponLevel,shipFireInterval,makeShipVolley,MAX_PLAYER_SHOTS:player.MAX_PLAYER_SHOTS};vm.runInNewContext(ts.transpileModule('globalThis.fire=()=>{'+firing(s)+'}',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,c);const events=[];for(let t=16;t<=10000;t+=16){c.time=t;c.state.shots=[];c.fire();if(c.state.shots.length)events.push([t,c.state.shots.map(s=>[s.damage,s.speedX])]);}return events;};
 const a=run(old),b=run(source);assert.equal(JSON.stringify(b),JSON.stringify(a));shots.push({level,volleyCount10Seconds:b.length,identicalToPrevious:true});
}
assert.equal(player.advanceShot({x:0,y:100,speedX:0},100).y,36);
const tiny=area.campaignCombatArea(159,844,390,64,112);assert.equal(tiny.valid,false,'impossible viewport is explicit, never hidden invulnerability or a reduced graphics tier');
const report={passed:true,base,mode:'real component/cache/firing and geometry in controlled Node; no native Pi Browser/GPU/audio/FPS proof',split:'50%/50% of usable height below HUD; hull-edge safety margins within each half',fixedAcrossNormalBossBonus:true,invalidSavedTargetsCannotEnlargeEnemyHalf:true,visibleStrengthRatios:[1,1.5,2,2.5],cases,flightsChecked:flights,sideEntriesChecked:sideEntries,cachedCalls:10000,geometryComputationsAcrossNineBlocks:1,cachedCallsMilliseconds:cachedMilliseconds,firing:shots,projectilePixelsPer100ms:64,protectedFunctionsUnchanged:unchanged,sceneChangesOnly:'visible hull-normalized strength sizing fitted to fixed enemy half',simulationChangesOnly:'player movement boundary',stylesAndAssetsUnchanged:true,audioAndBossRendererUnchanged:true,limitations:['Some later formations do not fit the extreme 844x390 field with unchanged hit radii; controlled technical pause.','Geometry fixtures are explicit assumptions, not DOM measurements from the user screenshot.','Hull-edge safety margins constrain center positions within the fixed halves; projectile speed and firing cadence are unchanged.','The existing full strength-profile mixture and aggregate rewards are unchanged by this follow-up.']};
if(process.env.CRYPTOID_AREA_OUT)fs.writeFileSync(process.env.CRYPTOID_AREA_OUT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
