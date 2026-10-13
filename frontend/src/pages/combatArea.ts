import {combatCryptoid} from './combatVariety.ts';
import {blockFlights} from './blockFlights.ts';
import {arrangeFormationBySize,formationSlotsForCount,variedFormationLayout} from './sectorManager.ts';
import {normalEnemyVisualDiameter,normalEnemyLayoutScale,strengthVisualDiameter} from './shipDisplayScale.ts';
import {enemyAppearance,spriteVisualOffset,shipNozzleStyles} from './shipFleet.ts';
import {enemyHullExtents} from './shipHullBounds.ts';
import {PLAYER_CONTACT_RADIUS} from './playerCombat.ts';

export const COMBAT_AREA_GAP=12;
export const playerUpperExtent=(diameter:number)=>Math.max(PLAYER_CONTACT_RADIUS,diameter/2+16);
// HUD is outside the usable arena. Its remaining height is split exactly 50/50.
export const splitCombatArea=(height:number,hud:number,playerDiameter:number)=>{
 const top=Math.max(0,Math.min(height,hud)),half=(height-top)/2,divider=top+half;
 return{enemyTop:top,divider,enemyHeight:half,playerHeight:half,
  minimumPlayerY:(divider+playerUpperExtent(playerDiameter)+COMBAT_AREA_GAP/2)/height,
  enemyCeiling:divider-COMBAT_AREA_GAP/2};
};
export function enemyFormationExtents(radius:number,shipClass:'light'|'medium'|'heavy'|'elite',sprite:number,playerDiameter:number,visualScale=1){
 const diameter=normalEnemyVisualDiameter(shipClass,playerDiameter,sprite,visualScale),hull=enemyHullExtents(sprite,diameter),offset=spriteVisualOffset(sprite,diameter,true);
 const flame=Math.max(...shipNozzleStyles(sprite).map(nozzle=>parseFloat(String((nozzle as unknown as Record<string,string>)['--nozzle-y']))/100))+.31;
 return{top:Math.max(hull.top,diameter/2+offset.y+(shipClass==='heavy'||shipClass==='elite'?12:9),(flame-.5)*diameter+offset.y+2)+2,
  bottom:Math.max(radius,hull.bottom+2),hull,diameter};
}

// One finite flight. Ship pixels, physics and nine template topologies remain
// intact; vertical spacing responds only when the viewport requires it.
export function normalFormation(section:number,stage:number,width:number,height:number,hud:number,playerDiameter:number,count=6,offset=0){
 const profiles=Array.from({length:count},(_,index)=>combatCryptoid(stage,index+offset));
 const appearances=profiles.map((_,index)=>enemyAppearance(stage,index+offset));
 const visualScale=normalEnemyLayoutScale(height,hud,playerDiameter);
 const extents=profiles.map((p,index)=>enemyFormationExtents(p.radius,p.shipClass,appearances[index].sprite,playerDiameter,visualScale));
 const slots=arrangeFormationBySize(formationSlotsForCount(variedFormationLayout(section,width,height,stage,Math.floor(offset/6)),count),profiles.map(p=>strengthVisualDiameter(p.shipClass,playerDiameter)*visualScale));
 const first=Math.min(...slots.map(s=>s.y)),relative=slots.map(s=>s.y-first);
 let minimumScale=0;
 for(let a=0;a<count;a++)for(let b=a+1;b<count;b++){
  const dy=Math.abs(relative[a]-relative[b]),dx=Math.abs(slots[a].x-slots[b].x);
  // Enemies do not collide with each other. Reserve their visible hulls,
  // rather than their player/projectile hit circles, for row spacing.
  const visibleRadius=(index:number)=>Math.max(extents[index].hull.left+extents[index].hull.right,extents[index].hull.top+extents[index].hull.bottom)/2;
  const hullGap=visibleRadius(a)+visibleRadius(b)+6;
  if(dy)minimumScale=Math.max(minimumScale,Math.sqrt(Math.max(0,hullGap*hullGap-dx*dx))/dy);
 }
 const ceiling=splitCombatArea(height,hud,playerDiameter).enemyCeiling;
 const position=(scale:number)=>{
  const base=Math.max(...relative.map((y,index)=>hud+8+extents[index].top-y*scale));
  return{slots:slots.map((slot,index)=>({...slot,y:base+relative[index]*scale,visualDiameter:extents[index].diameter})),bottom:Math.max(...relative.map((y,index)=>base+y*scale+extents[index].bottom))};
 };
 let scale=Math.max(1,minimumScale),placed=position(scale);
 if(placed.bottom>ceiling&&minimumScale<scale){
  let low=minimumScale,high=scale;
  for(let n=0;n<32;n++){const mid=(low+high)/2;if(position(mid).bottom<=ceiling)low=mid;else high=mid;}
  scale=low;placed=position(scale);
 }
 return{...placed,scale,visualScale,valid:placed.bottom<=ceiling+1e-7};
}

export function normalCombatArea(stage:number,width:number,height:number,hud:number,playerDiameter:number,rulesVersion=2){
 let offset=0;
 const flights=blockFlights(stage,rulesVersion).map(count=>{const flight=normalFormation(stage,stage,width,height,hud,playerDiameter,count,offset);offset+=count;return flight;});
 const bottom=Math.max(0,...flights.map(f=>f.bottom));
 return{flights,bottom,...splitCombatArea(height,hud,playerDiameter),visualScale:normalEnemyLayoutScale(height,hud,playerDiameter),valid:flights.every(f=>f.valid)};
}

// A stable boundary throughout the nine blocks: clearing enemies or replacing
// a flight never exposes its reserved space to the player.
export function campaignCombatArea(stage:number,width:number,height:number,hud:number,playerDiameter:number,rulesVersion=2){
 const first=Math.floor((stage-1)/10)*10+1;
 const areas=Array.from({length:9},(_,index)=>normalCombatArea(first+index,width,height,hud,playerDiameter,rulesVersion));
 return{...splitCombatArea(height,hud,playerDiameter),visualScale:normalEnemyLayoutScale(height,hud,playerDiameter),valid:areas.every(a=>a.valid)};
}
