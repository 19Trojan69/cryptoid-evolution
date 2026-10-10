import { memo, useEffect, useId, useRef } from "react";
import { advanceHomeNetwork, createHomeNetwork, HOME_ART, makeHomeNetworkMesh, pointOnEdge, type NetworkState } from "./homeNetworkModel";

const mesh = makeHomeNetworkMesh();
const foreground = [
  "M118 537 157 550 216 562 316 553 342 548 329 583 357 601 367 637 345 671 330 693 339 721 319 738 282 720 253 696 213 676 169 674 115 681 121 644 133 626 119 597 111 566Z",
  "M703 627 744 642 785 656 803 681 838 711 805 746 772 724 738 706 704 676 695 650Z",
];
const meshPaths = mesh.paths.map(edge => ({d:"M"+edge.points.map(point=>point.map(value=>value.toFixed(1)).join(" ")).join("L"),depth:edge.depth}));
const round = (ctx: CanvasRenderingContext2D, x: number,y: number,r: number,color: string | CanvasGradient) => {
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
};
const glow = (ctx: CanvasRenderingContext2D,x: number,y: number,r: number,color: string,alpha: number) => {
  ctx.save();ctx.globalAlpha=alpha;
  const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
  gradient.addColorStop(0,color);gradient.addColorStop(.3,color);gradient.addColorStop(1,"transparent");
  round(ctx,x,y,r,gradient);ctx.restore();
};

function paint(ctx: CanvasRenderingContext2D,state: NetworkState) {
  const {width,height,cx,cy,radius}=HOME_ART;
  ctx.clearRect(0,0,width,height);ctx.save();
  ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();
  const cutout=new Path2D(`M0 0H${width}V${height}H0Z ${foreground.join(" ")}`);
  ctx.clip(cutout,"evenodd");ctx.lineCap="round";ctx.lineJoin="round";
  for (const actor of state.actors) {
    if (actor.cooldown) continue;
    const edge=mesh.edges[actor.edge], u=actor.u;
    const tail=Math.max(0,Math.min(1,u-actor.direction*50/edge.length));
    const points=Array.from({length:9},(_,i)=>pointOnEdge(edge,tail+(u-tail)*i/8));
    const [x,y]=points[points.length-1], [tx,ty]=points[0];
    if (Math.hypot(x-tx,y-ty)<.3) continue;
    const color=actor.team?"#ff3a2b":"#57b9ff",light=actor.team?"#fff0d0":"#efffff";
    const gradient=ctx.createLinearGradient(tx,ty,x,y);
    gradient.addColorStop(0,"transparent");gradient.addColorStop(.3,"transparent");gradient.addColorStop(1,color);
    ctx.save();ctx.globalAlpha=.83+.12*Math.sin(state.time*2+actor.id);
    for (const [lineWidth,alpha] of [[20,.1],[11,.2],[5,.6],[2.5,1]]) {
      ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));
      ctx.strokeStyle=gradient;ctx.lineWidth=lineWidth;ctx.globalAlpha=alpha;ctx.stroke();
    }
    for (let i=1;i<points.length;i++) {
      ctx.beginPath();ctx.moveTo(...points[i-1]);ctx.lineTo(...points[i]);
      ctx.strokeStyle=light;ctx.lineWidth=.4+i*.15;ctx.globalAlpha=(i/8)**2*.8;ctx.stroke();
    }
    glow(ctx,x,y,18,color,.5);round(ctx,x,y,2.2,light);ctx.restore();
  }
  for (const flash of state.flashes) {
    const fade=1-(state.time-flash.time)/.2;
    glow(ctx,...flash.point,12,"#ffe9b4",fade*.75);
  }
  for (const burst of state.bursts) {
    const q=Math.max(0,(state.time-burst.time)/.68),[x,y]=burst.point;
    ctx.save();ctx.globalAlpha=Math.min(1,(1-q)*1.4);
    glow(ctx,x,y,19+q*24,"#ff9039",.65);glow(ctx,x,y,9+q*6,"#ffd9a2",.8);
    round(ctx,x,y,Math.max(.5,5*(1-q)),"#fff5d7");
    for (let j=0;j<9;j++) {
      const noise=(Math.sin(x*.37+y*.61+j*7.31)+1)/2;
      const angle=j*Math.PI*2/9+noise*.45,near=4+q*16,far=near+(5+noise*12)*(1-q);
      ctx.beginPath();ctx.moveTo(x+Math.cos(angle)*near,y+Math.sin(angle)*near);ctx.lineTo(x+Math.cos(angle)*far,y+Math.sin(angle)*far);
      ctx.strokeStyle="#ffe4af";ctx.lineWidth=.7+noise;ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function HomeEarthNetwork({paused}: {paused: boolean}) {
  const id=useId().replace(/[^a-zA-Z0-9_-]/g,"");
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const stateRef=useRef<NetworkState|null>(null);
  useEffect(()=>{
    const canvas=canvasRef.current,ctx=canvas?.getContext("2d");
    if (!canvas||!ctx) return;
    const state=stateRef.current??createHomeNetwork(mesh);stateRef.current=state;
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf=0,last=0,lastPaint=0,visible=true;
    const allowed=()=>!paused&&!document.hidden&&visible&&!motion.matches&&document.documentElement.dataset.motion!=="reduced";
    const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;last=0;lastPaint=0;};
    const frame=(now:number)=>{
      raf=0;if(!allowed())return;
      if(!lastPaint||now-lastPaint>=1000/24) {
        advanceHomeNetwork(state,mesh,last?Math.min(.1,(now-last)/1000):0);
        last=now;lastPaint=now;paint(ctx,state);
      }
      raf=requestAnimationFrame(frame);
    };
    const resume=()=>{
      stop();ctx.clearRect(0,0,HOME_ART.width,HOME_ART.height);
      if(allowed()){paint(ctx,state);raf=requestAnimationFrame(frame);}
    };
    const resize=()=>{
      const size=Math.min(1024,Math.max(320,canvas.clientWidth*Math.min(window.devicePixelRatio||1,2)));
      canvas.width=Math.round(size);canvas.height=Math.round(size*HOME_ART.height/HOME_ART.width);
      ctx.setTransform(canvas.width/HOME_ART.width,0,0,canvas.height/HOME_ART.height,0,0);resume();
    };
    const resizeObserver=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
    resizeObserver?.observe(canvas);
    const intersection=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;resume();}):null;
    intersection?.observe(canvas);
    const preferences=new MutationObserver(resume);preferences.observe(document.documentElement,{attributes:true,attributeFilter:["data-motion"]});
    document.addEventListener("visibilitychange",resume);
    motion.addEventListener("change",resume);window.addEventListener("resize",resize);
    resize();
    return ()=>{stop();resizeObserver?.disconnect();intersection?.disconnect();preferences.disconnect();document.removeEventListener("visibilitychange",resume);motion.removeEventListener("change",resume);window.removeEventListener("resize",resize);};
  },[paused]);
  return <>
    <svg className="cinematic-network-grid" viewBox={`0 0 ${HOME_ART.width} ${HOME_ART.height}`} aria-hidden="true" focusable="false">
      <defs><mask id={`home-net-${id}`}><rect width={HOME_ART.width} height={HOME_ART.height} fill="white"/>{foreground.map(d=><path key={d} d={d} fill="black"/>)}</mask></defs>
      <g mask={`url(#home-net-${id})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g stroke="#0b1424" strokeWidth="2.9" opacity=".6">{meshPaths.map(({d},i)=><path key={i} d={d}/>)}</g>
        <g stroke="#dfbd78" strokeWidth="1.45">{meshPaths.map(({d,depth},i)=><path key={i} d={d} opacity={.64+depth*.23}/>)}</g>
      </g>
    </svg>
    <canvas className="cinematic-network-traffic" ref={canvasRef} aria-hidden="true"/>
  </>;
}

export default memo(HomeEarthNetwork);
