import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createSectorBoss,moveSectorBoss,bossVulnerable} from '../../frontend/src/pages/sectorBoss.ts';
import {advanceBossTurrets} from '../../frontend/src/pages/bossTurrets.ts';
import {enemyShotLimit,advanceEnemyShot,enemyShotOutsideField} from '../../frontend/src/pages/enemyFire.ts';
const root=new URL('../../',import.meta.url).pathname,require=createRequire(root+'frontend/package.json'),{build}=require('esbuild');
const BASE='d005c99b03dfdfe9433e300ac1add26a38a74eb9';
async function released(){const result=await build({absWorkingDir:root,entryPoints:['frontend/src/pages/bossTurrets.ts'],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',plugins:[{name:'released-tracking',setup(b){b.onLoad({filter:/bossTurrets\.ts$/},()=>({contents:execFileSync('git',['show',BASE+':frontend/src/pages/bossTurrets.ts'],{cwd:root,encoding:'utf8'}),loader:'ts'}));}}]});const m={exports:{}};Function('module','exports','require',result.outputFiles[0].text)(m,m.exports,require);return m.exports.advanceBossTurrets;}
test('all 50 bosses retain exact angles, locks, salvos and trajectories with moving targets and variable frame times',async()=>{
 const prior=await released();let skippedPositionObjects=0,shots=0;
 for(const [width,height] of [[390,760],[1366,768]])for(let id=1;id<=50;id++){
  let boss=createSectorBoss(id*10,width,90,height),old=structuredClone(boss),active=[],serial=1;
  for(let frame=0;frame<900;frame++){
   const delta=[16,20,33,80,0][frame%5],player={x:.5+Math.sin(frame*.008)*.3,y:.84+Math.cos(frame*.013)*.03};
   boss=moveSectorBoss(boss,delta,width,height);old=moveSectorBoss(old,delta,width,height);
   if(frame>400&&frame%80===0){const index=Math.floor(frame/80)%boss.turrets.length;boss.turrets[index].health=old.turrets[index].health=0;}
   active=active.map(s=>advanceEnemyShot(s,delta)).filter(s=>!enemyShotOutsideField(s,width,height));
   const available=enemyShotLimit(width,frame*20,id*10)-active.length;
   const before=prior(old,player,width,height,delta,available,serial),after=advanceBossTurrets(boss,player,width,height,delta,available,serial);
   assert.deepEqual(after,before);assert.deepEqual(boss,old);
   if(delta>0&&bossVulnerable(boss)&&boss.health>0)skippedPositionObjects+=boss.turrets.length;
   serial+=after.shots.length;shots+=after.shots.length;active.push(...after.shots);assert.ok(active.length<=enemyShotLimit(width,frame*20,id*10));
  }
 }
 assert.ok(shots>1000);assert.ok(skippedPositionObjects>100000);
 console.log(JSON.stringify({kind:'exact-tracking-comparison',cases:90000,bosses:50,viewports:2,shots,trackingPositionObjectsAvoided:skippedPositionObjects,totalRamSavingMeasured:false}));
});
test('only the reviewed scalar tracking change differs from the released turret module',()=>{
 const before=execFileSync('git',['show',BASE+':frontend/src/pages/bossTurrets.ts'],{cwd:root,encoding:'utf8'});
 const actual=readFileSync(root+'frontend/src/pages/bossTurrets.ts','utf8');
 const start=actual.indexOf('  const g=guns[i],state=boss.turrets[i];'),end=actual.indexOf('  const speed=',start);
 const oldStart=before.indexOf('  const g=guns[i],state=boss.turrets[i],p=gunPosition(boss,g);'),oldEnd=before.indexOf('  const speed=',oldStart);
 assert.ok(start>0&&oldStart>0);assert.equal(actual.slice(0,start)+before.slice(oldStart,oldEnd)+actual.slice(end),before);
});
