import { bossWeapons } from './bossWeapons.ts';
import { gunPosition } from './bossTurrets.ts';
import { bossHullContains } from './bossCombat.ts';
import type { SectorBoss } from './sectorBoss.ts';
import { bossHullExposed } from './sectorBoss.ts';

// Sweep the projectile path so small barrels cannot be skipped between frames.
// While protected, the hull lets shots reach rear-mounted guns. Only live guns
// absorb shots in phase one; turret damage never leaks into hull HP.
export function bossHitTarget(boss:SectorBoss,from:{x:number;y:number},to:{x:number;y:number}) {
 const margin=boss.width*.3;
 if(Math.min(from.y,to.y)>boss.y+boss.height/2+margin||Math.max(from.y,to.y)<boss.y-boss.height/2-margin||Math.min(from.x,to.x)>boss.x+boss.width/2+margin||Math.max(from.x,to.x)<boss.x-boss.width/2-margin)return null;
 const dx=to.x-from.x,dy=to.y-from.y;
 if(!bossHullExposed(boss)){
  // A protected hull has no collision surface. Intersect each live rotated
  // gun analytically rather than sampling every 2px against every gun.
  const scale=boss.width/boss.config.sourceWidth;
  let earliest=Infinity,hitIndex=-1;
  const guns=bossWeapons[boss.config.id-1];
  for(let index=0;index<guns.length;index++){
   const state=boss.turrets[index];if(state.health<=0)continue;
   const gun=guns[index],pos=gunPosition(boss,gun),c=Math.cos(state.a),s=Math.sin(state.a);
   const x=c*(from.x-pos.x)+s*(from.y-pos.y),y=-s*(from.x-pos.x)+c*(from.y-pos.y);
   const vx=c*dx+s*dy,vy=-s*dx+c*dy,halfWidth=Math.max(3,gun.halfWidth*scale);
   let enter=0,leave=1;
   if(Math.abs(vx)<1e-8){if(Math.abs(x)>halfWidth)continue;}
   else {const a=(-halfWidth-x)/vx,b=(halfWidth-x)/vx;enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));}
   if(enter>leave)continue;
   const back=gun.back*scale+2,muzzle=gun.muzzle*scale+2;
   if(Math.abs(vy)<1e-8){if(y < -back||y > muzzle)continue;}
   else {const a=(-back-y)/vy,b=(muzzle-y)/vy;enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));}
   if(enter<=leave&&enter<earliest){earliest=enter;hitIndex=index;}
  }
  if(hitIndex>=0)return {kind:'turret' as const,index:hitIndex,x:from.x+dx*earliest,y:from.y+dy*earliest};
  return null;
 }
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/2));
 for(let step=0;step<=steps;step++){
  const x=from.x+dx*step/steps,y=from.y+dy*step/steps;
  if(bossHullContains(boss,x,y))return {kind:'hull' as const,x,y};
 }
 return null;
}
