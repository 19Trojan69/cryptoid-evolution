// A repeatable trajectory audit. Frozen-target attack recordings are planned in
// space-time with swept hitboxes, 300ms reaction and conservative touch speed.
// This is not a claim about physical device latency or every adaptive human path.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSectorBoss,moveSectorBoss} from '../src/pages/sectorBoss.ts';
import {advanceBossTurrets} from '../src/pages/bossTurrets.ts';
import {advanceEnemyShot,enemyShotOutsideField,enemyShotHitsPlayer} from '../src/pages/enemyFire.ts';
import {insectLayout} from '../src/pages/insectBoss.ts';
const views=[[320,568,80],[375,667,80],[390,760,90],[430,820,90],[768,920,90],[1024,600,60],[844,360,60]],dt=40;
const rows=[];let scenarios=0;
for(const [w,h,top] of views){
 const metrics=insectLayout(w,h,top);let maxBottom=0;
 for(const targetX of [.12,.5,.88])for(const targetY of [.52,.75,.89]){
  let boss=createSectorBoss(60,w,top,h,true),live=[],id=0,firstWarning=Infinity;
  const births=[];
  for(let t=0;t<16000;t+=dt){
   boss=moveSectorBoss(boss,dt,w,h);maxBottom=Math.max(maxBottom,boss.y+boss.height/2);
   live=live.map(s=>advanceEnemyShot(s,dt)).filter(s=>!enemyShotOutsideField(s,w,h));
   const out=advanceBossTurrets(boss,{x:targetX,y:targetY},w,h,dt,3-live.length,id,live);id+=out.shots.length;live.push(...out.shots);
   if(boss.insect.telegraphGun>=0)firstWarning=Math.min(firstWarning,t);
   births.push(...out.shots.map(s=>({s:{...s},at:t})));
  }
  assert.ok(births.length>0,`No attacks ${w}x${h} ${targetX},${targetY}`);
  // Keep the exact initial position as an extra grid node; never round a player
  // away from an incoming shot. Allowed step speed is 0.32px/ms (game: 0.68).
  const points=[...new Set([30,w-30,targetX*w,...Array.from({length:Math.floor((w-60)/10)+1},(_,i)=>30+i*10)])].sort((a,b)=>a-b);
  let possible=new Set([points.indexOf(targetX*w)]),lastCount=0;
  for(let t=dt;t<16000;t+=dt){
   const next=new Set();
   for(const from of possible)for(let to=Math.max(0,from-2);to<=Math.min(points.length-1,from+2);to++){
    if(Math.abs(points[to]-points[from])>dt*.32+.001)continue;
    if(t<firstWarning+300&&points[to]!==targetX*w)continue;
    const prev={x:points[from]/w,y:targetY},p={x:points[to]/w,y:targetY};let safe=true;
    for(const {s,at} of births){
     if(at>t||t-at>8000)continue;
     const before=advanceEnemyShot(s,Math.max(0,t-dt-at)),after=advanceEnemyShot(s,t-at);
     if(enemyShotHitsPlayer(after,p,w,h,before,prev)){safe=false;break;}
    }
    if(safe)next.add(to);
   }
   possible=next;lastCount=possible.size;assert.ok(lastCount>0,`No reachable escape at ${w}x${h} target ${targetX},${targetY},t=${t}`);
  }
  scenarios++;
 }
 rows.push({width:w,height:h,visibleTop:top,bossWidth:+metrics.width.toFixed(2),bossHeight:+metrics.height.toFixed(2),maxHullBottom:+maxBottom.toFixed(2),contactClearanceToPlayerTop:+(h*.5-maxBottom-27).toFixed(2),playerCenterTop:metrics.playerTop,playerCenterBottom:metrics.playerBottom,playerCenterWidth:w-60,reservedEscapeCenters:66,minimumPhysicalGap:112,bodyFreePlayerArea:{left:30,right:w-30,top:metrics.playerTop,bottom:metrics.playerBottom}});
}
const report={passed:true,scenarios,viewports:rows,planner:{recordedMs:16000,stepMs:dt,gridPx:10,reactionMs:300,speedPxMs:.32,gameSpeedPxMs:.68,collision:'actual swept enemyShotHitsPlayer',limits:'Frozen target recordings; route moves horizontally. Does not prove every adaptive path or real mobile latency. Continuous full-height corridor checked separately in unit tests.'}};
const output=process.argv[2];if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
