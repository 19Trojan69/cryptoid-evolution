import test from 'node:test';
import assert from 'node:assert/strict';
import {bossWeapons} from './bossWeapons.ts';
import {createSectorBoss} from './sectorBoss.ts';
import {bossHitTarget} from './bossHitTarget.ts';
import {gunPosition} from './bossTurrets.ts';
import {MIN_TURRET_BODY_DIAMETER,turretBodyScale,turretBodyEllipse} from './bossTurretBody.ts';

test('all 392 bodies meet the CSS-pixel minimum without shrinking larger guns',()=>{
 for(const width of [320,390,430,1024])for(let id=1;id<=50;id++){
  const boss=createSectorBoss(id*10,width,90,825),scale=boss.width/boss.config.sourceWidth;
  for(const gun of bossWeapons[id-1]){
   const factor=turretBodyScale(gun,scale);
   assert.ok(gun.halfWidth*scale*factor*2>=MIN_TURRET_BODY_DIAMETER-1e-10);
   if(gun.halfWidth*scale*2>=MIN_TURRET_BODY_DIAMETER)assert.equal(factor,1);
  }
 }
});

test('enlarged rotated bodies are hittable without widening the distant barrel',()=>{
 let enlarged=0;
 for(let id=1;id<=50;id++)for(let index=0;index<bossWeapons[id-1].length;index++){
  const boss=createSectorBoss(id*10,430,90,825);boss.elapsed=5000;boss.weaponClock=5000;
  const gun=bossWeapons[id-1][index],scale=boss.width/boss.config.sourceWidth,body=turretBodyEllipse(gun,scale);
  if(body.factor<=1)continue;
  enlarged++;
  boss.turrets.forEach((t,i)=>{if(i!==index)t.health=0;});
  const state=boss.turrets[index],p=gunPosition(boss,gun);
  for(const angle of [0,.7,Math.PI/2,Math.PI]){
   state.a=angle;
   const point=(x,y)=>({x:p.x+Math.cos(angle)*x-Math.sin(angle)*y,y:p.y+Math.sin(angle)*x+Math.cos(angle)*y});
   const at=point(body.x*.82,body.centerY);
   assert.equal(bossHitTarget(boss,at,at)?.index,index,`boss ${id} body ${index} angle ${angle}`);
   // Original rectangular shaft interception is preserved; body enlargement
   // must not create a wider full-length barrel target.
   const outside=point(Math.max(3,gun.halfWidth*scale)+.2,Math.max(body.centerY+body.y+1,gun.muzzle*scale+3));
   assert.equal(bossHitTarget(boss,outside,outside),null);
  }
  state.health=0;
  assert.notEqual(bossHitTarget(boss,p,p)?.kind,'turret');
 }
 assert.ok(enlarged>100);
});

test('a swept shot catches the added edge during recoil and rejects an ellipse corner',()=>{
 const boss=createSectorBoss(20,430,90,825);boss.elapsed=5000;boss.weaponClock=5000;
 boss.turrets.forEach((t,i)=>{if(i!==2)t.health=0;});
 const gun=bossWeapons[1][2],state=boss.turrets[2],p=gunPosition(boss,gun),scale=boss.width/boss.config.sourceWidth,body=turretBodyEllipse(gun,scale);
 state.a=0;state.lastFired=boss.weaponClock;
 const y=p.y+body.centerY-gun.recoil*scale;
 assert.equal(bossHitTarget(boss,{x:p.x+body.x*.9,y:y+25},{x:p.x+body.x*.9,y:y-25})?.index,2);
 const corner={x:p.x+body.x*.99,y:y-body.y*.99};
 assert.equal(bossHitTarget(boss,corner,corner),null);
});
