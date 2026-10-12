import { memo, useEffect, useRef } from 'react';
import type { BonusRock, RockEffect } from './bonusRocks';
const textures = new Map<number, HTMLCanvasElement>();
function rockTexture(seed: number) {
  const key = Math.abs(Math.floor(seed)) % 7;
  const cached = textures.get(key); if (cached) return cached;
  // Same cached, high resolution stone material as Minigames Package 2.
  // Seven 192px textures use about 1 MiB; no surface work runs every frame.
  const c = document.createElement('canvas'); c.width = c.height = 192;
  const g = c.getContext('2d')!;
  let randomSeed=130+key*71;
  const random=()=>{randomSeed|=0;randomSeed=randomSeed+0x6D2B79F5|0;let t=Math.imul(randomSeed^randomSeed>>>15,1|randomSeed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
  g.translate(96,96);g.beginPath();
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=78*(.8+random()*.18);if(i)g.lineTo(Math.cos(a)*r,Math.sin(a)*r);else g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
  g.closePath();g.shadowColor='#0009';g.shadowBlur=9;g.shadowOffsetY=5;
  const shade=g.createRadialGradient(-35,-40,1,12,15,105);
  shade.addColorStop(0,'#c6bba5');shade.addColorStop(.3,'#827d75');shade.addColorStop(.68,'#454955');shade.addColorStop(1,'#171e2a');
  g.fillStyle=shade;g.fill();g.shadowBlur=0;g.shadowOffsetY=0;g.clip();
  for(let i=0;i<1200;i++){const x=(random()-.5)*170,y=(random()-.5)*170;g.fillStyle=random()>.5?'#e2d6bb26':'#11182455';g.fillRect(x,y,random()*2.5+.4,random()*2+.5);}
  for(let i=0;i<16;i++){const x=(random()-.5)*125,y=(random()-.5)*125,r=3+random()*13;g.fillStyle='#17202a88';g.beginPath();g.ellipse(x,y,r,r*.7,.3,0,Math.PI*2);g.fill();g.strokeStyle='#e3d6b455';g.lineWidth=1.5;g.beginPath();g.ellipse(x,y+2,r,r*.7,.3,.15,2.5);g.stroke();}
  for(let i=0;i<8;i++){g.strokeStyle='#18202b66';g.lineWidth=1.2;g.beginPath();const x=(random()-.5)*130,y=(random()-.5)*130;g.moveTo(x,y);g.lineTo(x+12,y+4);g.lineTo(x+20,y-9);g.stroke();g.strokeStyle='#d8c4a32b';g.beginPath();g.moveTo(x-1,y-1);g.lineTo(x+11,y+3);g.stroke();}
  textures.set(key,c); return c;
}
const BonusRockLayer = ({ rocks, effects, width, height }: { rocks: BonusRock[];effects: RockEffect[];width:number;height:number }) => {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    let canceled=false,next=0;
    let timer=window.setTimeout(prepare,80);
    function prepare(){if(canceled)return;rockTexture(next++);if(next<7)timer=window.setTimeout(prepare,80);}
    return ()=>{canceled=true;window.clearTimeout(timer);};
  },[]);
  useEffect(()=>{
    const c=ref.current;if(!c)return;const dpr=Math.min(1.5,window.devicePixelRatio||1);
    if(c.width!==Math.round(width*dpr)||c.height!==Math.round(height*dpr)){c.width=Math.round(width*dpr);c.height=Math.round(height*dpr);}
    const g=c.getContext('2d');if(!g)return;g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,width,height);
    for(const r of rocks){g.save();g.translate(r.x,r.y);g.rotate(r.rotation);const size=r.radius*1.23;g.drawImage(rockTexture(r.seed),-size,-size,size*2,size*2);if(r.hitMs>0){g.globalAlpha=Math.min(.7,r.hitMs/220);g.fillStyle='#f1d3ac';g.beginPath();g.arc(0,r.radius*.44,Math.max(2,r.radius*.17),0,Math.PI*2);g.fill();}g.restore();}
    for(const e of effects){const t=e.age/1000,p=Math.min(1,t/(e.final?.75:.25));if(p>=1)continue;g.save();g.translate(e.x,e.y);g.globalAlpha=(1-p)*.35;const dust=g.createRadialGradient(0,0,0,0,0,e.radius*(1+p*2));dust.addColorStop(0,'#d3b69b');dust.addColorStop(1,'rgba(158,143,126,0)');g.fillStyle=dust;g.beginPath();g.arc(0,0,e.radius*(1+p*2),0,Math.PI*2);g.fill();g.globalAlpha=1-p;
      if(p<.14){g.fillStyle='#fff2d4';g.beginPath();g.arc(0,0,e.radius*.45*(1-p/.14),0,Math.PI*2);g.fill();}
      const n=e.final?(e.radius>20?9:6):3;
      for(let i=0;i<n;i++){const a=i/n*Math.PI*2+e.seed,speed=25+(i*17)%63;const x=Math.cos(a)*speed*t,y=Math.sin(a)*speed*t+45*t*t;g.save();g.translate(x,y);g.rotate(a+t*(i%2?4:-4));const r=(e.final?e.radius*.48:5)*(1-p*.7);g.beginPath();g.moveTo(-r,-r*.4);g.lineTo(r*.3,-r);g.lineTo(r,r*.2);g.lineTo(r*.2,r*.85);g.lineTo(-r*.7,r*.5);g.closePath();g.clip();const texture=rockTexture(e.seed+i);g.drawImage(texture,46+(i*11)%31,43+(i*17)%35,65,65,-r,-r,r*2,r*2);g.restore();}
      if(e.points){g.globalAlpha=1-p;g.textAlign='center';g.font='bold 16px system-ui';g.fillStyle='#f2d7a7';g.fillText('+'+e.points,0,-e.radius-12-p*25);}g.restore();}
  },[rocks,effects,width,height]);
  return <canvas ref={ref} className="bonus-rock-layer" style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:2,pointerEvents:'none'}} aria-hidden="true"/>;
};
export default memo(BonusRockLayer);
