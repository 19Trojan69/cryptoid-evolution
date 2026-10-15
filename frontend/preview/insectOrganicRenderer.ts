import type {SectorBoss} from '../src/pages/sectorBoss';
import {specialWeaponBox,specialWeaponMuzzle} from '../src/pages/bossSpecialWeapon';
import {coreInterval} from '../src/pages/bossCore';

/** Species-specific presentation data, independent of difficulty and hitboxes.
 * The current reference is mantis; future bosses can select their own eyes. */
export const insectEyeProfiles=[
 {species:'mantis',facetRows:7,width:.88,pupil:'slit',lid:'upper-lower'},
 {species:'dragonfly',facetRows:12,width:1,pupil:'round',lid:'upper-lower'},
 {species:'wasp',facetRows:9,width:.76,pupil:'slit',lid:'upper-lower'},
 {species:'scarab',facetRows:8,width:.90,pupil:'round',lid:'upper-lower'},
 {species:'moth',facetRows:10,width:1,pupil:'round',lid:'upper-lower'},
 {species:'weaver',facetRows:4,width:.88,pupil:'cluster',lid:'upper-lower'},
 {species:'scorpion',facetRows:5,width:.82,pupil:'cluster',lid:'upper-lower'},
 {species:'hornet',facetRows:9,width:.80,pupil:'slit',lid:'upper-lower'},
] as const;

export type EyeAtlas={frames:HTMLCanvasElement[];width:number;height:number;dispose:()=>void};
type MakeCanvas=(width:number,height:number)=>HTMLCanvasElement;

/** Bake only one current eye, in 13 bounded opening steps. Each eyelid is an
 * actual translating armored leaf, with source hull texture and facet-edge rim.
 * No shaders, blur, filters, particle effects or per-frame pixel reads. */
export function prepareInsectEye(eye:CanvasImageSource,hull:CanvasImageSource,make:MakeCanvas,species:typeof insectEyeProfiles[number]['species']='mantis'):EyeAtlas{
 const profile=insectEyeProfiles.find(p=>p.species===species)??insectEyeProfiles[0];
 const width=144,height=192,frames:HTMLCanvasElement[]=[];
 for(let step=0;step<=12;step++){
  const out=make(width,height),c=out.getContext('2d')!;const open=step/12;
  c.drawImage(eye,(1-profile.width)*width/2,0,width*profile.width,height);
  // Facet overlays and sensor cluster layout distinguish future species,
  // without retaining any additional species atlases for the current mission.
  if(species!=='mantis'){
   c.save();c.beginPath();c.ellipse(72,96,48*profile.width,65,0,0,Math.PI*2);c.clip();
   const r=65/profile.facetRows;c.strokeStyle='#b5ffb330';c.lineWidth=.7;
   for(let row=0;row<profile.facetRows*2;row++)for(let col=0;col<profile.facetRows;col++){const x=18+col*r*1.8+(row%2?r*.9:0),y=34+row*r*1.5;c.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.stroke();}
   if(profile.pupil==='cluster'){for(const [x,y]of [[46,71],[98,71],[35,98],[109,98],[50,123],[94,123]]){c.fillStyle='#010c09';c.beginPath();c.ellipse(x,y,7,9,0,0,Math.PI*2);c.fill();c.strokeStyle='#a4f655';c.stroke();}}
   c.restore();
  }
  // Pin the shutters to a convex oval bay so plates never protrude into space.
  c.save();c.beginPath();c.ellipse(72,96,63*profile.width,87,0,0,Math.PI*2);c.clip();
  for(const upper of [true,false]){
   const travel=(upper?-1:1)*open*85;
   c.save();c.translate(0,travel);c.beginPath();
   if(upper){c.moveTo(1,-8);c.lineTo(143,-8);c.lineTo(143,94);c.quadraticCurveTo(72,122,1,94);}else{c.moveTo(1,98);c.quadraticCurveTo(72,74,143,98);c.lineTo(143,200);c.lineTo(1,200);}c.closePath();c.clip();
   c.drawImage(hull,-55,-30,254,252);
   const metal=c.createLinearGradient(0,upper?0:96,144,upper?108:192);metal.addColorStop(0,'#21302be6');metal.addColorStop(.42,'#526252cf');metal.addColorStop(.7,'#1c291fe6');metal.addColorStop(1,'#080f11ef');c.fillStyle=metal;c.fillRect(0,upper?-8:80,144,120);
   c.strokeStyle='#9ba178';c.lineWidth=2;c.beginPath();c.moveTo(7,upper?93:100);c.quadraticCurveTo(72,upper?118:78,137,upper?93:100);c.stroke();
   c.strokeStyle='#263d2b';c.lineWidth=3;for(let p=0;p<3;p++){const x=26+p*40;c.beginPath();c.moveTo(x,upper?8:186);c.lineTo(x+6,upper?77:116);c.stroke();}
   c.restore();
  }
  c.restore();frames.push(out);
 }
 return{frames,width,height,dispose(){for(const f of frames)f.width=f.height=1;frames.length=0;}};
}

export function drawInsectEye(c:CanvasRenderingContext2D,boss:SectorBoss,atlas:EyeAtlas,time:number){
 const bay=specialWeaponBox(boss),left=boss.x-boss.width/2+bay.left,top=boss.y-boss.height/2+bay.top;
 const exposed=boss.turrets.every(g=>g.health<=0),core=boss.core;
 const opening=exposed?Math.min(1,(core?.volley??0)>0?1:(core?.elapsed??0)/900):0;
 const frame=atlas.frames[Math.round(opening*12)];if(!frame)return;
 c.drawImage(frame,left,top,bay.width,bay.height);
 if(opening>.65){
  const muzzle=specialWeaponMuzzle(boss),charge=Math.min(1,(core?.elapsed??0)/coreInterval(boss));
  const rx=Math.max(1.2,bay.width*.08),ry=Math.max(2,bay.height*.14);
  c.fillStyle='#020909';c.beginPath();c.ellipse(muzzle.x,muzzle.y,rx,ry,0,0,Math.PI*2);c.fill();
  c.strokeStyle=`rgba(180,255,94,${.25+charge*.7})`;c.lineWidth=1+charge;c.beginPath();c.ellipse(muzzle.x,muzzle.y,rx+2,ry+1,0,0,Math.PI*2);c.stroke();
  c.fillStyle=boss.core?.lastShotColor??'#ccff66';c.globalAlpha=.2+charge*.65;c.beginPath();c.ellipse(muzzle.x,muzzle.y,Math.max(.7,rx*(.15+charge*.6)),Math.max(1.5,ry*.65),0,0,Math.PI*2);c.fill();c.globalAlpha=1;
  if((core?.volley??0)>0&&(core?.elapsed??1000)<140){c.globalAlpha=1-(core?.elapsed??0)/140;c.beginPath();c.ellipse(muzzle.x,muzzle.y,Math.max(7,bay.width*.4),Math.max(8,bay.height*.3),0,0,Math.PI*2);c.fill();c.globalAlpha=1;}
 }
 void time; // Deliberately use simulation clocks, not wall-time animations.
}

/** Anatomical cannon art uses the very same pivots, angles, muzzle and recoil
 * as the existing turret simulation. No second targeting/firing implementation. */
export function drawAnatomicalWeapons(c:CanvasRenderingContext2D,boss:SectorBoss,weapon:CanvasImageSource,frozen=false){
 const scale=boss.width/boss.config.sourceWidth,guns=boss.weaponSlots??[];
 for(let i=0;i<guns.length;i++){
  const g=guns[i],s=boss.turrets[i];
  const x=boss.x+(g.sourceX/boss.config.sourceWidth-.5)*boss.width,y=boss.y+(g.sourceY/boss.config.sourceHeight-.5)*boss.height;
  const half=g.halfWidth*scale,back=g.back*scale,muzzle=g.muzzle*scale;
  if(s.health<=0){c.fillStyle='#10211a';c.beginPath();c.ellipse(x,y,half*.85,back*.6,0,0,Math.PI*2);c.fill();c.strokeStyle='#b5723c';c.lineWidth=1;c.beginPath();c.moveTo(x-half*.6,y);c.lineTo(x+half*.5,y+back*.35);c.stroke();continue;}
  const age=boss.weaponClock-s.lastFired,recoil=frozen?0:Math.max(0,1-age/250)*g.recoil*scale;
  c.save();c.translate(x,y);c.rotate(s.a);c.translate(0,-recoil);
  // A small shadow anchors the chitin hinge to its anatomical hull socket.
  c.globalAlpha=.35;c.drawImage(weapon,-half+1,-back+2,half*2,back+muzzle);c.globalAlpha=1;
  c.drawImage(weapon,-half,-back,half*2,back+muzzle);
  const damage=1-s.health/s.maxHealth;if(damage>.15){c.strokeStyle=`rgba(255,${Math.round(150-damage*60)},45,${damage*.8})`;c.lineWidth=Math.max(1,half*.12);c.beginPath();c.moveTo(-half*.4,-back*.2);c.lineTo(half*.3,muzzle*.4);c.lineTo(-half*.2,muzzle*.7);c.stroke();}
  if(!frozen&&age>=0&&age<80){c.fillStyle=g.shotColor;c.globalAlpha=1-age/80;c.beginPath();c.ellipse(0,muzzle-g.recoil*scale,Math.max(2,half*.4),Math.max(4,half*.8),0,0,Math.PI*2);c.fill();}
  c.restore();
 }
}
