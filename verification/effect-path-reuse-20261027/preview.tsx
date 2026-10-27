// Local only: native pixel/work comparison and actual React effect lifecycle.
import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {drawImpact as beforeImpact} from 'baseline-impact';
import {CanvasEffectLayer,CanvasImpact,drawImpact as afterImpact,prepareCanvasImpactResources,canvasEffectResources} from '../../frontend/src/pages/CanvasEffects';
import {prepareImpactClipPaths} from '../../frontend/src/pages/impactClipPaths';
import {staticHullAsset} from '../../frontend/src/pages/staticHullAssets';

const NativePath=window.Path2D;
let paths=0;
(window as any).Path2D=function(path?:Path2D|string){paths++;return path===undefined?new NativePath():new NativePath(path);};
const pixels=async(canvas:HTMLCanvasElement)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data))).map(v=>v.toString(16).padStart(2,'0')).join('');
function surface(width:number,height:number,scale:number){const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);const ctx=canvas.getContext('2d')!;ctx.setTransform(scale,0,0,scale,0,0);return{canvas,ctx};}
function outlines(count:number){
 const columns=count===8?4:2,rows=count/columns;let seed=0x9e3779b1;
 const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/2**32;};
 return Array.from({length:count},(_,index)=>{
  const x=index%columns,y=Math.floor(index/columns),l=x/columns,t=y/rows,r=(x+1)/columns,b=(y+1)/rows,j=Math.min(7,18/columns)/100;
  return{points:[[l+random()*j,t],[r-random()*j,t],[r,t+random()*j],[r,b-random()*j],[r-random()*j,b],[l+random()*j,b],[l,b-random()*j],[l,t+random()*j]],
   pivot:[(x+.5)/columns,(y+.5)/rows],x:(x%2?1:-1)*(20+index*13),y:(y?1:-1)*(30+index*11),spin:(index%2?1:-1)*(1.7+index*.3),delay:index*5};
 });
}
const hull=staticHullAsset(0,'gold',1).url;
async function compareImpact(){
 const rows=[];const calls={before:0,after:0,clipsBefore:0,clipsAfter:0};
 for(const scale of [1,1.5])for(const scene of [{size:50,count:4,x:215.37,y:240.46},{size:86,count:8,x:25,y:35},{size:72,count:8,x:410,y:480}]){
  const [image,fire,smoke]=await prepareCanvasImpactResources(hull,scene.size*1.25);
  const pieces=outlines(scene.count),record={effect:{kind:'explosion',debrisSize:scene.size,x:scene.x,y:scene.y,debrisRotation:13},pieces,assets:{hull:image,fire,smoke}};
  const prepared={...record,clipPaths:prepareImpactClipPaths(pieces,scene.size)};
  const a=surface(430,500,scale),b=surface(430,500,scale);
  const proxy=(ctx:CanvasRenderingContext2D,kind:'before'|'after')=>new Proxy(ctx,{get(target,key){
   if(key==='moveTo'||key==='lineTo'||key==='beginPath'||key==='closePath')return(...args:any[])=>{calls[kind]++;return(target as any)[key](...args);};
   if(key==='clip')return(...args:any[])=>{calls[kind==='before'?'clipsBefore':'clipsAfter']++;return(target as any).clip(...args);};
   const value=(target as any)[key];return typeof value==='function'?value.bind(target):value;
  },set(target,key,value){(target as any)[key]=value;return true;}});
  const ca=proxy(a.ctx,'before'),cb=proxy(b.ctx,'after');
  for(const age of [0,120,500,1000,1600,2150]){
   a.ctx.clearRect(0,0,430,500);b.ctx.clearRect(0,0,430,500);
   beforeImpact(ca,record,age);afterImpact(cb,prepared,age);
   const expected=await pixels(a.canvas),actual=await pixels(b.canvas);
   rows.push({scale,...scene,age,equal:expected===actual,expected,actual});
  }
  a.canvas.width=a.canvas.height=b.canvas.width=b.canvas.height=0;
 }
 return{rows,calls};
}
const debris=<div>{outlines(4).map((p,index)=><i key={index} style={{clipPath:`polygon(${p.points.map(([x,y])=>`${x*100}% ${y*100}%`).join(',')})`,transformOrigin:`${p.pivot[0]*100}% ${p.pivot[1]*100}%`,
 '--fragment-x':`${p.x}px`,'--fragment-y':`${p.y}px`,'--fragment-spin':`${p.spin*180/Math.PI}deg`,'--fragment-delay':`${p.delay}ms`} as any}/>)}</div>;
let update:(value:any)=>void;
function Mounted(){const[state,setState]=useState({paused:false,visible:true,id:1,fallback:false});update=setState;
 return <main className="game-shell" data-effects-paused={state.paused} style={{position:'relative',width:430,height:825}}><CanvasEffectLayer enabled>
  {state.visible&&<CanvasImpact key={state.id} effect={{id:state.id,kind:'explosion',x:215,y:240,debrisSize:50,sprite:0,debrisColor:'gold',shipStage:1}} debris={debris} original={<div data-original>Original effect</div>}/>}
 </CanvasEffectLayer></main>;
}
const root=createRoot(document.getElementById('root')!);
(window as any).__paths={compareImpact,inspect:()=>({paths,...canvasEffectResources()}),
 mount:()=>root.render(<Mounted/>),update:(value:any)=>update((state:any)=>({...state,...value})),
 lose:()=>document.querySelector('.normal-effects-surface')!.dispatchEvent(new Event('contextlost')),
 pathSupport:(enabled:boolean)=>(window as any).Path2D=enabled?NativePath:undefined,
 unmount:()=>root.unmount()};
