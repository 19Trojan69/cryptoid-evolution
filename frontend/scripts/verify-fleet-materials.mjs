// Native QA of the actual material function; no browser or Pi authentication.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import path from 'node:path';
import assert from 'node:assert/strict';
import {paintShipMaterial} from '../src/pages/shipMaterial.ts';
import {playerColors} from '../src/pages/shipFleet.ts';
import {namedShipAccent} from '../src/pages/shipIdentityColor.ts';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const output=process.argv[2]||path.resolve('../doc/fleet-review');mkdirSync(output,{recursive:true});
const oldTint=(data,target,accent)=>{for(let i=0;i<data.length;i+=4){if(data[i+3]<20)continue;const r=data[i],g=data[i+1],b=data[i+2],brightness=.2126*r+.7152*g+.0722*b;if(b>r*1.18&&b>g*1.12&&brightness<115)continue;const saturation=Math.max(r,g,b)-Math.min(r,g,b);const identity=accent&&saturation>28&&brightness>45&&(accent[0]>accent[1]*1.5?r>g*1.25&&r>b*1.15:accent[1]>accent[0]?g>r*1.08&&g>b*1.1:r>b*1.25&&g>b*1.12&&r>g*.95);const palette=identity?accent:target,strength=brightness<58?.32:.92,reflection=Math.max(0,brightness-190)*.42;for(let c=0;c<3;c++)data[i+c]=Math.min(255,Math.round(data[i+c]*(1-strength)+(palette[c]*brightness/155+reflection)*strength));}};
const samples=[],times=[];let variants=0;
for(let index=0;index<20;index++)for(const stage of [1,2,3]){
  const source=await loadImage('public/ships/evolution/ship_'+String(index+1).padStart(2,'0')+'_stage_'+stage+'.png');
  const canvas=createCanvas(source.width,source.height),ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);const original=ctx.getImageData(0,0,source.width,source.height);
  for(const color of playerColors){
    const pixels=new Uint8ClampedArray(original.data);const start=performance.now();paintShipMaterial(pixels,source.width,source.height,color.rgb,namedShipAccent(index));times.push(performance.now()-start);
    for(let i=3;i<pixels.length;i+=4)assert.equal(pixels[i],original.data[i],index+':'+stage+':'+color.id+': alpha');
    variants++;
    if(index===1&&stage===1){const result=ctx.createImageData(source.width,source.height);result.data.set(pixels);ctx.putImageData(result,0,0);const next=createCanvas(source.width,source.height);next.getContext('2d').drawImage(canvas,0,0);const previous=ctx.createImageData(source.width,source.height);previous.data.set(original.data);oldTint(previous.data,color.rgb,namedShipAccent(index));const before=createCanvas(source.width,source.height);before.getContext('2d').putImageData(previous,0,0);samples.push({color,before,next});}
  }
}
const atlas=createCanvas(1080,855),ctx=atlas.getContext('2d');ctx.fillStyle='#081526';ctx.fillRect(0,0,1080,855);
ctx.font='bold 25px sans-serif';ctx.fillStyle='#eed7a3';ctx.fillText('CRYPTOID EVOLUTION · METALLFARBEN',24,34);ctx.font='14px sans-serif';ctx.fillStyle='#b8ccdd';ctx.fillText('Native Grafikprüfung · links bisher, rechts neue Materialdarstellung',24,59);
for(let i=0;i<samples.length;i++){const {color,before,next}=samples[i],x=(i%3)*360,y=80+Math.floor(i/3)*250;ctx.strokeStyle='#3c5870';ctx.strokeRect(x+12,y,336,238);ctx.font='bold 16px sans-serif';ctx.fillStyle='#e6d5b2';ctx.fillText(color.name,x+24,y+26);for(let j=0;j<2;j++){ctx.drawImage(j?next:before,x+20+j*164,y+40,160,160);ctx.font='13px sans-serif';ctx.fillStyle=j?'#c1eadc':'#8c9cae';ctx.fillText(j?'NEU':'BISHER',x+67+j*164,y+220);}}
writeFileSync(path.join(output,'metal-paints.png'),atlas.toBuffer('image/png'));
const combat=createCanvas(860,390),c=combat.getContext('2d');c.fillStyle='#081526';c.fillRect(0,0,860,390);c.font='bold 20px sans-serif';c.fillStyle='#eed7a3';c.fillText('SCHIFFDETAILS IN SPIELGRÖSSE · NATIVE GRAFIKPRÜFUNG',22,30);
for(let row=0;row<2;row++){c.fillStyle='#a8bfd0';c.font='14px sans-serif';c.fillText(row?'NEU':'BISHER',22,90+row*145);for(let i=0;i<6;i++){const ship=samples[i];c.save();c.translate(155+i*90,96+row*145);c.rotate(Math.PI);c.drawImage(row?ship.next:ship.before,-32,-32,64,64);c.restore();}c.drawImage(row?samples[0].next:samples[0].before,685,40+row*145,112,112);}
writeFileSync(path.join(output,'combat-materials.png'),combat.toBuffer('image/png'));
times.sort((a,b)=>a-b);const report={hulls:20,stages:3,paints:9,variants,alphaBoundsPreserved:true,nativeRenderingOnly:true,medianMaterialMs:Number(times[Math.floor(times.length*.5)].toFixed(3)),p95MaterialMs:Number(times[Math.floor(times.length*.95)].toFixed(3)),note:'Node/native measurements are not mobile browser FPS or device validation.'};
writeFileSync(path.join(output,'material-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

