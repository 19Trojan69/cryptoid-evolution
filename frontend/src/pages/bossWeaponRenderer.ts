import { bossWeapons, type AtlasRect } from './bossWeapons.ts';
import type { SectorBoss } from './sectorBoss.ts';

type CanvasFactory = (width:number,height:number)=>HTMLCanvasElement;
const bases=new WeakMap<HTMLCanvasElement,{id:number;width:number;height:number;layer:HTMLCanvasElement}>();
const factory:CanvasFactory=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export const weaponCanvasSize=(boss:SectorBoss)=>({width:boss.width*1.44,height:boss.height*2.4,padX:boss.width*.22,padY:boss.height*.7});
const tile=(c:CanvasRenderingContext2D,image:CanvasImageSource,r:AtlasRect,x:number,y:number,scale:number)=>c.drawImage(image,r.x,r.y,r.width,r.height,x,y,r.width*scale/2,r.height*scale/2);

export const drawBossWeapons=(canvas:HTMLCanvasElement,boss:SectorBoss,image:CanvasImageSource,frozen=false,make:CanvasFactory=factory)=>{
 const c=canvas.getContext('2d');if(!c)return;
 const size=weaponCanvasSize(boss),sx=canvas.width/size.width,sy=canvas.height/size.height,scale=boss.width/boss.config.sourceWidth;
 const guns=bossWeapons[boss.config.id-1];
 let cached=bases.get(canvas);
 if(!cached||cached.id!==boss.config.id||cached.width!==canvas.width||cached.height!==canvas.height){
  const layer=make(canvas.width,canvas.height),base=layer.getContext('2d');if(!base)return;
  base.setTransform(sx,0,0,sy,0,0);
  for(const g of guns){const x=size.padX+g.sourceX/boss.config.sourceWidth*boss.width,y=size.padY+g.sourceY/boss.config.sourceHeight*boss.height;tile(base,image,g.socket,x-g.socket.width*scale/4,y-g.socket.height*scale/4,scale);}
  cached={id:boss.config.id,width:canvas.width,height:canvas.height,layer};bases.set(canvas,cached);
 }
 c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(cached.layer,0,0);c.setTransform(sx,0,0,sy,0,0);
 for(let i=0;i<guns.length;i++){
  const g=guns[i],state=boss.turrets[i],x=size.padX+g.sourceX/boss.config.sourceWidth*boss.width,y=size.padY+g.sourceY/boss.config.sourceHeight*boss.height;
  if(state.health<=0){
   const radius=Math.max(3,g.radius*scale);c.fillStyle='#151c24';c.beginPath();c.ellipse(x,y,radius,radius*.65,0,0,Math.PI*2);c.fill();
   c.strokeStyle='#bf7446';c.lineWidth=Math.max(1,scale*2);c.beginPath();c.moveTo(x-radius*.6,y-radius*.35);c.lineTo(x+radius*.5,y+radius*.25);c.stroke();continue;
  }
  const age=(boss.weaponClock-state.lastFired)/1000,recoil=frozen?0:Math.max(0,1-age/.25)*g.recoil*scale;
  c.save();c.translate(x,y);c.rotate(state.a);c.translate(0,-recoil);
  c.globalAlpha=.64;tile(c,image,g.shadow,-g.spritePivot.x*scale-12*scale+3*scale,-g.spritePivot.y*scale-12*scale+6*scale,scale);
  c.globalAlpha=1;tile(c,image,g.sprite,-g.spritePivot.x*scale,-g.spritePivot.y*scale,scale);c.restore();
  const r=g.halfWidth*scale;c.fillStyle=state.lock>=160?'#c8f0db':'#d5934f';c.beginPath();c.ellipse(x-r*.45,y-r*.31,Math.max(.7,1.5*scale),Math.max(.5,scale),0,0,Math.PI*2);c.fill();
  if(!frozen){
   const w=Math.max(14,Math.min(26,g.halfWidth*scale*1.6)),barY=y-g.back*scale-7;
   c.fillStyle='#07111ee6';c.fillRect(x-w/2-1,barY-1,w+2,5);
   c.fillStyle=state.health/state.maxHealth<=.3?'#ff8870':'#edce87';c.fillRect(x-w/2,barY,w*state.health/state.maxHealth,3);
   if(boss.weaponClock-state.lastHit<120){c.strokeStyle='#fff2c9';c.lineWidth=1;c.strokeRect(x-w/2-1,barY-1,w+2,5);}
  }
  if(!frozen&&age>=0&&age<.08){
   c.save();c.translate(x,y);c.rotate(state.a);c.globalAlpha=1-age/.08;c.fillStyle=g.shotColor;
   for(const b of state.firedBarrels){c.beginPath();c.ellipse(g.barrels[b]*scale,(g.muzzle-g.recoil)*scale,Math.max(1.5,g.visualShotWidth*scale*1.4),Math.max(3,g.visualShotWidth*scale*2.4),0,0,Math.PI*2);c.fill();}c.restore();
  }
 }
};
