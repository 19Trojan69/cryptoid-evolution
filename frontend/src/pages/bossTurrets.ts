import { bossWeapons, type BossGunConfig, type BossWeaponKind } from './bossWeapons.ts';
import type { SectorBoss } from './sectorBoss.ts';
import { bossFireInterval, bossVulnerable } from './sectorBoss.ts';
import type { EnemyShot, BossProjectileKind } from './enemyFire.ts';
import type { PlayerPosition } from './playerCombat.ts';

export type BossTurretState = { a:number; lock:number; next:number; pendingIndex:number; pendingTotal:number; pendingAt:number; lastFired:number; firedBarrels:number[]; shots:number };
export type BossFireEvent = { kind:BossWeaponKind; radius:number; barrels:number; pan:number; gunIndex:number; error:number; lock:number };
export const createBossTurrets = (id:number):BossTurretState[] => bossWeapons[id-1].map((g,i)=>({a:g.base,lock:0,next:1100+i*90,pendingIndex:0,pendingTotal:0,pendingAt:0,lastFired:-10000,firedBarrels:[],shots:0}));
export const angleDifference = (a:number,b:number) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const gunPosition = (boss:SectorBoss,g:BossGunConfig) => ({x:boss.x+(g.sourceX/boss.config.sourceWidth-.5)*boss.width,y:boss.y+(g.sourceY/boss.config.sourceHeight-.5)*boss.height});
export const gunMuzzle = (boss:SectorBoss,g:BossGunConfig,state:BossTurretState,barrel:number,recoil=0) => {
 const p=gunPosition(boss,g),s=boss.width/boss.config.sourceWidth;
 return {x:p.x+(-Math.sin(state.a)*(g.muzzle-recoil)+Math.cos(state.a)*g.barrels[barrel])*s,y:p.y+(Math.cos(state.a)*(g.muzzle-recoil)+Math.sin(state.a)*g.barrels[barrel])*s};
};
const legacyKind:Record<BossWeaponKind,BossProjectileKind>={laser:'lance',pulse:'pulse',plasma:'orb',heavy:'heavy',siege:'heavy',rocket:'bolt'};
const speeds:Record<BossWeaponKind,number>={laser:.24,pulse:.19,plasma:.17,heavy:.15,siege:.135,rocket:.18};

// The projectile budget is shared with escorts. Round-robin admission prevents
// a large battery or a fast small gun from permanently starving other stations.
export const advanceBossTurrets = (boss:SectorBoss,player:PlayerPosition,width:number,height:number,delta:number,available:number,firstId:number) => {
 const shots:EnemyShot[]=[],events:BossFireEvent[]=[];
 if(delta<=0||!bossVulnerable(boss)||boss.health<=0)return {shots,events};
 const dt=Math.min(80,delta);boss.weaponClock+=dt;
 const guns=bossWeapons[boss.config.id-1];
 for(let i=0;i<guns.length;i++){
  const g=guns[i],state=boss.turrets[i],p=gunPosition(boss,g);
  const desired=Math.atan2(-(player.x*width-p.x),player.y*height-p.y),diff=angleDifference(desired,state.a);
  const speed=Math.min(g.turnSpeed,Math.abs(diff)*6);state.a+=Math.sign(diff)*Math.min(Math.abs(diff),speed*dt/1000);
  const error=Math.abs(angleDifference(desired,state.a));state.lock=error<.035?state.lock+dt:0;
 }
 let slots=Math.max(0,Math.floor(available));const start=boss.turretCursor;
 for(let visit=0;visit<guns.length&&slots>0;visit++){
  const i=(start+visit)%guns.length,g=guns[i],state=boss.turrets[i];
  if(state.lock<160||boss.weaponClock<(state.pendingTotal?state.pendingAt:state.next))continue;
  if(!state.pendingTotal){state.pendingIndex=0;state.pendingTotal=g.barrels.length*g.rows;state.shots++;}
  const rowRemaining=g.barrels.length-state.pendingIndex%g.barrels.length,count=Math.min(slots,rowRemaining);
  state.lastFired=boss.weaponClock;state.firedBarrels=[];
  for(let b=0;b<count;b++){
   const barrel=state.pendingIndex%g.barrels.length,p=gunMuzzle(boss,g,state,barrel,g.recoil);state.firedBarrels.push(barrel);
   const core=Math.max(1.5,g.visualShotWidth*Math.max(.45,boss.width/904));
   const radius=Math.max(2,core*(g.kind==='laser'?.7:g.kind==='rocket'?1:1.28));
   shots.push({id:firstId+shots.length,...p,vx:-Math.sin(state.a)*speeds[g.kind],vy:Math.cos(state.a)*speeds[g.kind],radius,bossKind:legacyKind[g.kind],weaponKind:g.kind,weaponColor:g.shotColor,weaponWidth:core,sourceGun:i,caliber:g.caliber});
   state.pendingIndex++;slots--;
  }
  const pos=gunPosition(boss,g),desired=Math.atan2(-(player.x*width-pos.x),player.y*height-pos.y);
  events.push({kind:g.kind,radius:g.radius,barrels:count,pan:Math.max(-.65,Math.min(.65,(pos.x/width-.5)*1.3)),gunIndex:i,error:Math.abs(angleDifference(desired,state.a)),lock:state.lock});
  boss.turretCursor=(i+1)%guns.length;boss.fireElapsed=0;boss.volley++;
  if(state.pendingIndex>=state.pendingTotal){state.pendingTotal=0;state.next=boss.weaponClock+g.interval*1000*bossFireInterval(boss,boss.config.level)/2500;}
  else state.pendingAt=boss.weaponClock+(state.pendingIndex%g.barrels.length===0?130:40);
 }
 return {shots,events};
};
