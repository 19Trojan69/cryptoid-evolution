// Native visual QA of the actual network renderer. This is not a browser
// screenshot or a substitute for physical Pi Browser/mobile acceptance.
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import * as model from '../src/pages/homeNetworkModel.ts';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage,Path2D}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const output=process.argv[2]||path.resolve('../doc/home-review');mkdirSync(output,{recursive:true});
const art=await loadImage('public/home/cinematic-earth-fleet.webp');
let seed=42;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
const rendererModel={...model,createHomeNetwork:mesh=>model.createHomeNetwork(mesh,random),advanceHomeNetwork:(state,mesh,dt)=>model.advanceHomeNetwork(state,mesh,dt,random)};
const traffic=createCanvas(862,904);traffic.clientWidth=862;
let refIndex=0,effect,serial=0;const frames=new Map(),refs=[];
const code=ts.transpileModule(readFileSync('src/pages/HomeEarthNetwork.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const exports={};vm.runInNewContext(code,{exports,require:name=>name==='react/jsx-runtime'?jsx:name==='react'?{memo:x=>x,useId:()=>':native-home:',useRef:value=>{const result={current:refIndex++===0?traffic:value};refs.push(result);return result;},useEffect:fn=>effect=fn}:rendererModel,
  window:{devicePixelRatio:1,matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),addEventListener(){},removeEventListener(){}},
  document:{hidden:false,documentElement:{dataset:{motion:'standard'}},addEventListener(){},removeEventListener(){}},
  MutationObserver:class{observe(){}disconnect(){}},Path2D,requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id)});
const tree=exports.default({paused:false});
const svg=renderToStaticMarkup(tree.props.children[0]).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="862" height="904" ');
const grid=await loadImage(Buffer.from(svg));const cleanup=effect();
const globe=createCanvas(862,904),g=globe.getContext('2d');
const small=createCanvas(432,452),s=small.getContext('2d'),videoFrames=[];
let captured=false,after=0,collisionTime=null;
for(let frame=0;frame<24*120;frame++) {
  const [id,fn]=[...frames][0];frames.delete(id);fn(frame*1000/24);
  g.clearRect(0,0,862,904);g.drawImage(art,0,0,862,904);g.drawImage(grid,0,0);g.drawImage(traffic,0,0);
  s.drawImage(globe,0,0,432,452);videoFrames.push(small.toBuffer('image/png'));
  if(!captured&&videoFrames.length>48)videoFrames.shift();
  const burst=refs[1].current.bursts.find(burst=>{
    const age=refs[1].current.time-burst.time,[x,y]=burst.point;
    return age>.08&&age<.2&&x>35&&x<827&&y>35&&y<869;
  });
  if(!captured&&burst) {
    // Require actual bright explosion pixels: events hidden by a ship do not
    // count. Keep two seconds before and four after the real visible meeting.
    const [x,y]=burst.point,pixel=traffic.getContext('2d').getImageData(Math.round(x),Math.round(y),1,1).data;
    if(pixel[0]>220&&pixel[1]>170&&pixel[2]>100&&pixel[3]>180) {
      writeFileSync(path.join(output,'earth-network-collision.png'),globe.toBuffer('image/png'));
      captured=true;collisionTime=burst.time;
    }
  }
  if(captured&&++after>=96)break;
}
writeFileSync(path.join(output,'earth-network.png'),globe.toBuffer('image/png'));cleanup();
if(!captured)throw new Error('No visible opposing collision captured');
const encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','png','-framerate','24','-i','pipe:0','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart','-y',path.join(output,'earth-network-animation.mp4')],{stdio:['pipe','ignore','inherit']});
const finished=once(encoder,'close');
for(const frame of videoFrames)if(!encoder.stdin.write(frame))await once(encoder.stdin,'drain');
encoder.stdin.end();const [exitCode]=await finished;if(exitCode!==0)throw new Error(`ffmpeg exited ${exitCode}`);
console.log(JSON.stringify({nativeCanvas:true,browserTest:false,artBytes:333498,edges:model.makeHomeNetworkMesh().edges.length,collisionCaptured:captured,collisionTime,files:['earth-network.png','earth-network-collision.png','earth-network-animation.mp4']}));
