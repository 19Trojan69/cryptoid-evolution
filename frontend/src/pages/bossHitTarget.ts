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
 const scale=boss.width/boss.config.sourceWidth;
 const guns=bossWeapons[boss.config.id-1].map((gun,index)=>({gun,index,pos:gunPosition(boss,gun),state:boss.turrets[index]})).filter(g=>g.state.health>0);
 const hullExposed=bossHullExposed(boss);
 const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/2));
 for(let step=0;step<=steps;step++){
  const x=from.x+(to.x-from.x)*step/steps,y=from.y+(to.y-from.y)*step/steps;
  for(const {gun,index,pos,state} of guns){
   const dx=x-pos.x,dy=y-pos.y,c=Math.cos(state.a),s=Math.sin(state.a);
   const localX=c*dx+s*dy,localY=-s*dx+c*dy;
   if(Math.abs(localX)<=Math.max(3,gun.halfWidth*scale)&&localY>=-gun.back*scale-2&&localY<=gun.muzzle*scale+2)return {kind:'turret' as const,index,x,y};
  }
  if(hullExposed&&bossHullContains(boss,x,y))return {kind:'hull' as const,x,y};
 }
 return null;
}
