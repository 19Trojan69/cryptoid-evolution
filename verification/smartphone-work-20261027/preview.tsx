// Local comparison fixture; never an application route or shipped debug hook.
import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import HomeCombatPreview from '../../frontend/src/pages/HomeCombatPreview';
import {startGuardedGameLoop} from '../../frontend/src/pages/gameLoop';
import {requestGameFrame,cancelGameFrame} from '../../frontend/src/lib/frameScheduler';
import {createProjectilePresentation} from '../../frontend/src/pages/projectilePresentation';
import '../../frontend/src/index.css';

const mode=new URLSearchParams(location.search).get('mode');
const work={steps:0,homeFrames:0,widthReads:0,angles:0,active:false,faults:[] as string[]};
const clientWidth=Object.getOwnPropertyDescriptor(Element.prototype,'clientWidth')!;
Object.defineProperty(Element.prototype,'clientWidth',{...clientWidth,get(){
  if((this as Element).classList.contains('home-cinematic-ship'))work.widthReads++;
  return clientWidth.get!.call(this);
}});
let cleanup=()=>{},wake=()=>{};
if(mode==='idle'){
  const stop=startGuardedGameLoop({step:()=>{work.steps++;},active:()=>work.active,
    sleepWhenInactive:()=>true,visible:()=>!document.hidden,now:()=>performance.now(),
    requestFrame:requestGameFrame,cancelFrame:cancelGameFrame,
    watch:callback=>window.setInterval(callback,500),unwatch:id=>clearInterval(id),
    fault:reason=>work.faults.push(reason)});
  cleanup=stop;wake=()=>stop.wake?.();
}
function Home(){const[paused,setPaused]=useState(false);return <>
  <button style={{position:'relative',zIndex:100}} onClick={()=>setPaused(value=>!value)}>Pause preview</button>
  <div style={{position:'relative',height:600,width:393}}><HomeCombatPreview defender={{sprite:2,color:'grey',stage:1}} paused={paused}/></div>
</>;}
function projectileCheck(){
  const mount=document.createElement('div');document.body.append(mount);
  const presenter=createProjectilePresentation(mount),atan2=Math.atan2;
  Math.atan2=(...args)=>{work.angles++;return atan2(...args);};
  const frames=[];
  try{
    for(let frame=0;frame<600;frame++){
      presenter.present({shots:[{id:1,x:140+frame,y:400-frame,speedX:.1,damage:1,empowered:frame>300,visualLevel:3}],
        enemyShots:[{id:2,x:150+frame,y:120+frame,vx:frame<400?.1:-.1,vy:.2,radius:4,
          enemyClass:'heavy',bossKind:'lance',weaponKind:'laser',weaponColor:'#abcdef',weaponWidth:7}]});
      if(frame%100===0||frame===400)frames.push(mount.innerHTML);
    }
    return {angles:work.angles,frames,size:presenter.size};
  }finally{Math.atan2=atan2;presenter.dispose();mount.remove();}
}
(window as any).__work={work,wake,setActive:(value:boolean)=>{work.active=value;wake();},cleanup,projectileCheck};
createRoot(document.getElementById('root')!).render(mode==='home'?<Home/>:<p>Isolated native work comparison</p>);
