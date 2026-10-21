// Native comparison of actual baseline/current BonusRockLayer drawing and lifetime.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {build}=require('esbuild');
const root=path.resolve(__dirname,'..');
const baseline='a51ce39e3199aeafc1101e30bb6f8aa53bf7cbab';
const accelerated=process.env.CRYPTOID_ACCELERATED_ROCK_QA==='1';
const baselineSelfControl=process.env.CRYPTOID_ROCK_BASELINE_CONTROL==='1';
(async()=>{
 const before=execFileSync('git',['show',baseline+':frontend/src/pages/BonusRockLayer.tsx'],{cwd:root,encoding:'utf8'});
 const current=baselineSelfControl?before:fs.readFileSync(path.join(root,'src/pages/BonusRockLayer.tsx'),'utf8');
 assert.equal((current.match(/window\.setTimeout\(/g)||[]).length,(before.match(/window\.setTimeout\(/g)||[]).length,'no added timeout');
 assert.equal((current.match(/requestAnimationFrame|requestGameFrame/g)||[]).length,0,'no added animation clock');
 const compiled=await build({absWorkingDir:root,stdin:{resolveDir:root,loader:'tsx',contents:`
  import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
  import Before from './src/pages/RockBefore';import After from './src/pages/BonusRockLayer';
  let now=0;window.rockQaNow=()=>now;
  const roots=['before','after'].map(id=>createRoot(document.getElementById(id)));
  window.renderRocks=(w,h,rocks,effects,time)=>{now=time;flushSync(()=>roots.forEach((r,i)=>r.render(React.createElement(i?After:Before,{width:w,height:h,rocks,effects}))));};
  window.removeRocks=()=>flushSync(()=>roots.forEach(r=>r.render(null)));
 `},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'baseline-and-clock',setup(b){
  b.onResolve({filter:/RockBefore$/},()=>({path:path.join(root,'src/pages/RockBefore.tsx')}));
  b.onLoad({filter:/(?:RockBefore|BonusRockLayer)\.tsx$/},args=>({contents:(args.path.endsWith('RockBefore.tsx')?before:current).replaceAll('performance.now()','window.rockQaNow()'),loader:'tsx'}));
  // Diagnostic timing is unrelated to drawing or the idle clock under test.
  b.onResolve({filter:/^\.\/renderWork$/},()=>({path:'timing',namespace:'audit'}));
  b.onLoad({filter:/.*/,namespace:'audit'},()=>({contents:'export const beginRockPaint=()=>undefined;export const endRockPaint=()=>{};'}));
 }}]});
 const html='<!doctype html><style>section{position:relative;width:100%;height:100%}</style><section id="before"></section><section id="after"></section><script>'+compiled.outputFiles[0].text+'</script>';
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end(html);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
 let browser;
 try{
  const pkg=await import(process.env.CRYPTOID_CHROMIUM_PACKAGE||'/tmp/cryptoid-boss-native-qa/node_modules/@sparticuz/chromium/build/index.js');
  browser=await chromium.launch({executablePath:process.env.CRYPTOID_CHROMIUM_EXECUTABLE||'/tmp/cryptoid-boss-native-runtime/chromium',headless:true,args:[...pkg.default.args,...(accelerated?[]:['--disable-accelerated-2d-canvas'])]});
  const errors=[];let comparisons=0,cycles=0;const dimensions=[];
  for(const dpr of [1,1.5,3]){
   const page=await browser.newPage({viewport:{width:900,height:1000},deviceScaleFactor:dpr});page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:'+server.address().port);
   const render=(width,height,rocks,effects,time)=>page.evaluate(p=>window.renderRocks(...p),[width,height,rocks,effects,time]);
   const size=()=>page.evaluate(()=>[...document.querySelectorAll('canvas')].map(c=>[c.width,c.height]));
   if(baselineSelfControl){
    await render(430,825,[],[],0);
    await render(320,700,[{id:1,seed:0,x:128,y:280,radius:32,rotation:0,hitMs:110}],[],3000);
    const pixels=await page.evaluate(()=>{
     const [a,b]=document.querySelectorAll('canvas'),x=a.getContext('2d').getImageData(0,0,a.width,a.height).data,y=b.getContext('2d').getImageData(0,0,b.width,b.height).data;
     let differingPixels=0;const maxChannels=[0,0,0,0];
     for(let i=0;i<x.length;i+=4){let differs=false;for(let c=0;c<4;c++){const d=Math.abs(x[i+c]-y[i+c]);maxChannels[c]=Math.max(maxChannels[c],d);differs=differs||d>0;}if(differs)differingPixels++;}
     return {dimensions:[a.width,a.height],differentPixels:differingPixels,maxChannels,exactEqual:differingPixels===0};
    });
    const control={baselineSelfControl:true,source:baseline,accelerated2dDisabled:!accelerated,browser:await browser.version(),pixels,limits:'Two independent mounts of the exact same unmodified component. A non-equal result limits accelerated cross-canvas pixel comparisons; it is not a candidate pass.'};
    if(process.env.CRYPTOID_IDLE_ROCK_REPORT)fs.writeFileSync(process.env.CRYPTOID_IDLE_ROCK_REPORT,JSON.stringify(control,null,2)+'\n');console.log(JSON.stringify(control,null,2));return;
   }
   const compare=async(label)=>{
    const result=await page.evaluate(()=>{const [a,b]=document.querySelectorAll('canvas');const x=a.getContext('2d').getImageData(0,0,a.width,a.height).data,y=b.getContext('2d').getImageData(0,0,b.width,b.height).data;return {same:x.length===y.length&&x.every((v,i)=>v===y[i]),before:[a.width,a.height],after:[b.width,b.height],cssSame:a.style.cssText===b.style.cssText};});
    if(!result.same){const shots=await page.evaluate(()=>[...document.querySelectorAll('canvas')].map(c=>c.toDataURL().split(',')[1]));shots.forEach((s,i)=>fs.writeFileSync('/tmp/rock-surface-'+i+'.png',Buffer.from(s,'base64')));console.error(JSON.stringify({label,result}));}
    assert.equal(result.same,true,label);assert.equal(result.cssSame,true,label+' CSS');assert.deepEqual(result.after,result.before);comparisons++;
   };
   let time=0;
   await render(430,825,[],[],time);assert.deepEqual((await size())[1],[1,1]);
   for(const [width,height] of [[320,700],[430,825],[820,900]]){
    for(let cycle=0;cycle<8;cycle++){
     time+=6000;
     const rock={id:1,seed:cycle,x:width*.4,y:height*.4,radius:cycle%2?16:32,rotation:cycle*.23,hitMs:cycle%3?0:110};
     await render(width,height,[rock],[],time);await compare('rock first frame '+cycle);
     const warm=await size();dimensions.push({width,height,dpr,pixels:warm[1]});
     await render(width,height,[],[],time+20);
     assert.deepEqual((await size())[1],warm[1],'retain short empty gap');
     assert.equal(await page.evaluate(()=>{const c=document.querySelectorAll('canvas')[1];return c.getContext('2d').getImageData(0,0,c.width,c.height).data.every(v=>v===0);}),true,'no stale rock');
     await render(width,height,[rock],[],time+1000);await compare('warm reuse '+cycle);
     for(const final of [false,true])for(const age of [0,90,240,500,740]){
      const effect={id:2,x:width*.55,y:height*.5,radius:rock.radius,seed:cycle,age,points:25,final};
      await render(width,height,[],[effect],time+1100+age);await compare('dust/debris '+cycle+'/'+age);
     }
     await render(width,height,[],[],time+1900);
     await render(width,height,[],[],time+3899);assert.deepEqual((await size())[1],warm[1],'do not shrink before grace');
     await render(width,height,[],[],time+3900);assert.deepEqual((await size())[1],[1,1],'release after grace');
     await render(width,height,[rock],[],time+3910);await compare('first frame after release '+cycle);cycles++;
    }
   }
   const detached=await page.evaluate(()=>{const c=document.querySelectorAll('canvas')[1];window.removeRocks();return [c.width,c.height];});assert.deepEqual(detached,[0,0],'explicit unmount release');
   // Keep contexts open until browser.close(): this serverless Chromium runs
   // in one process and may exit when its last context is closed.
  }
  assert.deepEqual(errors,[]);
  const result={passed:true,baseline,browser:await browser.version(),accelerated2dDisabled:!accelerated,pixelComparisons:comparisons,reuseReleaseCycles:cycles,viewports:3,deviceScales:[1,1.5,3],rasterCap:1.5,startsAtOnePixel:true,graceMs:2000,unmountPixels:0,pageErrors:errors,samplePhoneSurface:dimensions.find(x=>x.width===430&&x.dpr===3),limits:'Native Linux Chromium/serverless SwiftShader setup. Exact RGBA comparisons without tolerance; diagnostic timing stubbed and idle time controlled. No measured Safari/GPU/process memory or iPhone crash-fix proof.'};
  if(process.env.CRYPTOID_IDLE_ROCK_REPORT)fs.writeFileSync(process.env.CRYPTOID_IDLE_ROCK_REPORT,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
