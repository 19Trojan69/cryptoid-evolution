import { chooseInsectLane, insectDifficulty, insectProjectile, insectShotAdmitted, INSECT_LOCK_MS, INSECT_WARNING_MS } from './insectBoss.ts';
import { bossWeapons, type BossGunConfig, type BossWeaponKind } from './bossWeapons.ts';
import { bossDifficulty } from './bossDifficulty.ts';
import type { SectorBoss } from './sectorBoss.ts';
import { bossFireInterval, bossVulnerable } from './sectorBoss.ts';
import type { EnemyShot, BossProjectileKind } from './enemyFire.ts';
import type { PlayerPosition } from './playerCombat.ts';

export type BossTurretState = { health:number; maxHealth:number; lastHit:number; a:number; lock:number; next:number; pendingIndex:number; pendingTotal:number; pendingAt:number; lastFired:number; firedBarrels:number[]; shots:number };
export type BossFireEvent = { kind:BossWeaponKind; radius:number; barrels:number; pan:number; gunIndex:number; error:number; lock:number };
const turretWeight = (g:BossGunConfig) => 4 + g.caliber / 4;
const turretHealthScales = bossWeapons.map((guns,index) =>
 bossDifficulty(index + 1).turretHealthBudget / guns.reduce((sum,g) => sum + turretWeight(g),0));
export const turretHealth = (id:number,g:BossGunConfig) =>
 Math.round(turretWeight(g) * turretHealthScales[id - 1] * 1e6) / 1e6;
export const turretPoints = (id:number,g:BossGunConfig) => 25 * Math.ceil((100 + g.caliber * 5 + (id - 1) * 4) / 25);
export const createBossTurrets = (id:number,guns:readonly BossGunConfig[]=bossWeapons[id-1],budget?:number):BossTurretState[] => guns.map((g,i)=>({health:budget === undefined ? turretHealth(id,g) : budget*turretWeight(g)/guns.reduce((sum,g)=>sum+turretWeight(g),0),maxHealth:budget === undefined ? turretHealth(id,g) : budget*turretWeight(g)/guns.reduce((sum,g)=>sum+turretWeight(g),0),lastHit:-Infinity,a:g.base,lock:0,next:1100+i*90,pendingIndex:0,pendingTotal:0,pendingAt:0,lastFired:-10000,firedBarrels:[],shots:0}));
export const damageBossTurret = (boss:SectorBoss,index:number,damage:number) => {
 const state=boss.turrets[index];
 if(!state||boss.health<=0||!bossVulnerable(boss)||state.health<=0||!Number.isFinite(damage)||damage<=0)return 0;
 state.health=Math.max(0,state.health-damage);if(state.health<1e-9)state.health=0;state.lastHit=boss.weaponClock;
 if(state.health>0)return 0;
 state.pendingTotal=0;state.pendingIndex=0;state.firedBarrels=[];state.lock=0;
 return turretPoints(boss.config.id,(boss.weaponSlots??bossWeapons[boss.config.id-1])[index]);
};
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
export const advanceBossTurrets = (boss:SectorBoss,player:PlayerPosition,width:number,height:number,delta:number,available:number,firstId:number,liveShots:readonly EnemyShot[]=[]) => {
 const shots:EnemyShot[]=[],events:BossFireEvent[]=[];
 if(delta<=0||!bossVulnerable(boss)||boss.health<=0)return {shots,events};
 const dt=Math.min(80,delta);boss.weaponClock+=dt;
 const pressure=bossDifficulty(boss.config.id);
 const guns=boss.weaponSlots??bossWeapons[boss.config.id-1];
 const insect=boss.insect;
 if(insect){
  const bounded=insectDifficulty(boss.config.level);
  pressure.projectileScale=bounded.projectileScale;pressure.trackingScale=bounded.trackingScale;
  chooseInsectLane(boss,player.x,liveShots);
 }
 for(let i=0;i<guns.length;i++){
  const g=guns[i],state=boss.turrets[i],p=gunPosition(boss,g);
  if(state.health<=0)continue;
  const desired=Math.atan2(-(player.x*width-p.x),player.y*height-p.y),diff=angleDifference(desired,state.a);
  const speed=Math.min(g.turnSpeed*pressure.trackingScale,Math.abs(diff)*6);state.a+=Math.sign(diff)*Math.min(Math.abs(diff),speed*dt/1000);
  const error=Math.abs(angleDifference(desired,state.a));state.lock=error<.035?state.lock+dt:0;
 }
 let slots=Math.max(0,Math.floor(available));const start=boss.turretCursor;
 if(insect){
  slots=Math.min(slots,3-liveShots.length);
  if(boss.weaponClock<insect.nextAttackAt)return {shots,events};
  if(insect.telegraphGun<0){
   for(let n=0;n<guns.length;n++){const i=(start+n)%guns.length;if(boss.turrets[i].health>0&&boss.weaponClock>=boss.turrets[i].next){insect.telegraphGun=i;insect.warningStarted=boss.weaponClock;break;}}
  }
  if(insect.telegraphGun<0||boss.weaponClock-insect.warningStarted<INSECT_WARNING_MS)return {shots,events};
 }
 for(let visit=0;visit<guns.length&&slots>0;visit++){
  const i=(start+visit)%guns.length,g=guns[i],state=boss.turrets[i];
  if(state.health<=0){if(insect?.telegraphGun===i)insect.telegraphGun=-1;continue;}
  if(insect&&insect.telegraphGun!==i)continue;
  if(state.lock<(insect?INSECT_LOCK_MS:160)||boss.weaponClock<(state.pendingTotal?state.pendingAt:state.next))continue;
  if(!state.pendingTotal){state.pendingIndex=0;state.pendingTotal=g.barrels.length*g.rows;state.shots++;}
  const rowRemaining=g.barrels.length-state.pendingIndex%g.barrels.length,count=Math.min(slots,rowRemaining);
  state.firedBarrels=[];
  for(let b=0;b<count;b++){
   const barrel=state.pendingIndex%g.barrels.length,p=gunMuzzle(boss,g,state,barrel,g.recoil);
   const core=Math.max(1.5,g.visualShotWidth*Math.max(.45,boss.width/904));
   const radius=Math.max(2,core*(g.kind==='laser'?.7:g.kind==='rocket'?1:1.28));
   let candidate:EnemyShot={id:firstId+shots.length,...p,vx:-Math.sin(state.a)*speeds[g.kind]*pressure.projectileScale,vy:Math.cos(state.a)*speeds[g.kind]*pressure.projectileScale,radius,bossKind:legacyKind[g.kind],weaponKind:g.kind,weaponColor:g.shotColor,weaponWidth:core,sourceGun:i,caliber:g.caliber};
   if(insect){
    const speed=(g.kind==='pulse'?.22:g.kind==='plasma'?.185:.16)*pressure.projectileScale;
    candidate=insectProjectile({...candidate,vx:-Math.sin(state.a)*speed,vy:Math.cos(state.a)*speed},g.caliber);
    if(!insectShotAdmitted(boss,candidate,width,height)){
     state.pendingTotal=0;state.pendingIndex=0;state.next=boss.weaponClock+350;
     insect.telegraphGun=-1;insect.nextAttackAt=boss.weaponClock+350;boss.turretCursor=(i+1)%guns.length;break;
    }
   }
   shots.push(candidate);state.firedBarrels.push(barrel);
   state.pendingIndex++;slots--;
  }
  if(!state.firedBarrels.length)continue;
  state.lastFired=boss.weaponClock;
  const pos=gunPosition(boss,g),desired=Math.atan2(-(player.x*width-pos.x),player.y*height-pos.y);
  events.push({kind:g.kind,radius:g.radius,barrels:count,pan:Math.max(-.65,Math.min(.65,(pos.x/width-.5)*1.3)),gunIndex:i,error:Math.abs(angleDifference(desired,state.a)),lock:state.lock});
  boss.turretCursor=(i+1)%guns.length;boss.fireElapsed=0;boss.volley++;
  if(state.pendingIndex>=state.pendingTotal){state.pendingTotal=0;state.next=boss.weaponClock+g.interval*1000*bossFireInterval(boss,boss.config.level)/2500*pressure.cadenceScale;}
  else state.pendingAt=boss.weaponClock+(insect?280:state.pendingIndex%g.barrels.length===0?130:40);
  if(insect){
   if(!state.pendingTotal){state.next=boss.weaponClock+g.interval*1000;insect.nextAttackAt=boss.weaponClock+insectDifficulty(boss.config.level).cadenceMs;insect.telegraphGun=-1;insect.phrase++;}
   break;
  }
 }
 return {shots,events};
};
