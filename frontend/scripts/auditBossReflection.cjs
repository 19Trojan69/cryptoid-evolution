// Isolate the actual BossHullView reflection with its authored production CSS.
// Children outside the hull/reflection and engine animation are excluded only
// in this local diagnostic fixture. No production component or style is edited.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {build}=require('esbuild');
const root=path.resolve(__dirname,'..');
(async()=>{
 const source=`
 import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
 import BossHullView from './src/pages/BossHullView';import {createSectorBoss} from './src/pages/sectorBoss';
 import './src/index.css';import './src/fleetMenus.css';
 const root=createRoot(document.getElementById('qa'));
 window.drawQa=(id,width,mode,frame=0)=>{
   const boss=createSectorBoss(id*10,width,96,825);boss.elapsed=10000;boss.x=width/2+frame*.15;boss.y=160;
   document.body.dataset.mode=mode;
   flushSync(()=>root.render(<BossHullView boss={boss} ready light={mode==='lit'?.65:0} now={10000}
      fallDurationMs={5000} title="reflection isolation"/>));
 };
 window.clearQa=()=>flushSync(()=>root.render(null));
 `;
 const result=await build({absWorkingDir:root,stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,write:false,
  outdir:'/virtual',platform:'browser',format:'iife',jsx:'automatic',external:['/ships/*','/planets/*','/satellite.svg'],define:{'process.env.NODE_ENV':'"production"'},
  plugins:[{name:'isolate-reflection',setup(b){b.onLoad({filter:/\/(?:BossWeaponsView|BossReactorView|BossHealthView|HullDamage)\.tsx$/},()=>({contents:'export default function OmittedQaChild(){return null}',loader:'tsx'}));}}]});
 const output=new Map(result.outputFiles.map(f=>[path.extname(f.path),f.text]));
 const html='<!doctype html><link rel="stylesheet" href="/qa.css"><style>body{margin:0;background:#050b18}.boss-engine-flame{animation:none!important}body[data-mode="hidden"] .hull-reflection{display:none}</style><div id="qa"></div><script src="/qa.js"></script>';
 const server=http.createServer((req,res)=>{
  const p=new URL(req.url,'http://localhost').pathname;
  if(p==='/'){res.setHeader('Content-Type','text/html');return res.end(html);}
  if(p==='/qa.js'||p==='/qa.css'){res.setHeader('Content-Type',p.endsWith('js')?'text/javascript':'text/css');return res.end(output.get(p.endsWith('js')?'.js':'.css'));}
  const asset=path.resolve(root,'public','.'+p);
  if(asset.startsWith(path.join(root,'public')+path.sep)&&fs.existsSync(asset)&&fs.statSync(asset).isFile()){
   if(asset.endsWith('.webp'))res.setHeader('Content-Type','image/webp');return fs.createReadStream(asset).pipe(res);
  }res.statusCode=404;res.end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
 const pkg=await import('/tmp/cryptoid-boss-native-qa/node_modules/@sparticuz/chromium/build/index.js');
 let browser;
 try{
  browser=await chromium.launch({executablePath:'/tmp/cryptoid-boss-native-runtime/chromium',headless:true,args:pkg.default.args});
  const page=await browser.newPage({viewport:{width:900,height:440},deviceScaleFactor:1.5});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const session=await page.context().newCDPSession(page);let layers=[],layerEvents=0;
  session.on('LayerTree.layerTreeDidChange',event=>{layerEvents++;layers=event.layers||[];});
  await session.send('LayerTree.enable');await session.send('DOM.enable');
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const cases=[],snapshots=new Map(),pixelMismatches=[];
  for(const id of [1,2,50])for(const width of [320,430,820])for(const mode of ['zero','hidden','lit']){
   await page.evaluate(p=>window.drawQa(...p),[id,width,mode]);
   await page.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode())));await settle();
   // A visible positive control is required before treating any layer or paint
   // counter as evidence. A silent CDP stream is unavailable, not zero cost.
   const pixels=await page.screenshot({animations:'allow'});
   const pixelHash=createHash('sha256').update(pixels).digest('hex');
   snapshots.set(`${id}/${width}/${mode}`,{hash:pixelHash,pixels});
   const state=await page.locator('.hull-reflection').evaluate(el=>{
    const s=getComputedStyle(el);return {opacity:s.opacity,display:s.display,mask:s.maskImage,blend:s.mixBlendMode,
     animation:s.animationName,transition:s.transitionProperty,willChange:s.willChange,nodes:document.querySelectorAll('.hull-reflection').length};
   });
   assert.equal(state.nodes,1);assert.equal(state.animation,'none');assert.equal(state.blend,'screen');
   const document=await session.send('DOM.getDocument');
   const node=await session.send('DOM.querySelector',{nodeId:document.root.nodeId,selector:'.hull-reflection'});
   const description=await session.send('DOM.describeNode',{nodeId:node.nodeId});
   const nodeId=description.node.backendNodeId;
   const reflectionLayers=layers.filter(l=>l.backendNodeId===nodeId);
   const reasons=[];for(const layer of reflectionLayers)reasons.push(await session.send('LayerTree.compositingReasons',{layerId:layer.layerId}));
   const initialPaints=layers.reduce((sum,l)=>sum+(l.paintCount||0),0);
   let paintEvents=0;const onPaint=()=>{paintEvents++;};session.on('LayerTree.layerPainted',onPaint);
   for(let frame=1;frame<=30;frame++){
    await page.evaluate(p=>window.drawQa(...p),[id,width,mode,frame]);await settle();
   }
   session.off('LayerTree.layerPainted',onPaint);
   cases.push({id,width,mode,state,pixelHash,totalLayers:layers.length,drawingLayers:layers.filter(l=>l.drawsContent).length,
    reflectionLayers:reflectionLayers.length,reflectionReasons:reasons,initialPaints,layerPaintEventsDuring30MovingUpdates:paintEvents});
  }
  let exactZeroHiddenComparisons=0,visibleGlintControls=0;
  const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
  for(const id of [1,2,50])for(const width of [320,430,820]){
   const before=snapshots.get(`${id}/${width}/zero`),after=snapshots.get(`${id}/${width}/hidden`);
   if(before.hash===after.hash)exactZeroHiddenComparisons++;
   else{
    const rgba=await Promise.all([before,after].map(async shot=>{
     const image=await loadImage(shot.pixels),canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');
     ctx.drawImage(image,0,0);return ctx.getImageData(0,0,image.width,image.height).data;
    }));
    let differentPixels=0;const maxChannels=[0,0,0,0];
    for(let i=0;i<rgba[0].length;i+=4){let differs=false;for(let c=0;c<4;c++){
     const delta=Math.abs(rgba[0][i+c]-rgba[1][i+c]);maxChannels[c]=Math.max(maxChannels[c],delta);differs||=delta>0;
    }if(differs)differentPixels++;}
    if(differentPixels===0)exactZeroHiddenComparisons++;
    else pixelMismatches.push({id,width,differentPixels,maxChannels});
   }
   assert.notEqual(before.hash,snapshots.get(`${id}/${width}/lit`).hash,'visible glint positive control');
   visibleGlintControls++;
  }
  await page.evaluate(()=>window.clearQa());await settle();
  const remaining=await page.locator('.hull-reflection').count();assert.equal(remaining,0);assert.deepEqual(errors,[]);
  const resourceMeasurementAvailable=layerEvents>0&&cases.some(c=>c.mode==='lit'&&c.drawingLayers>0);
  const audit={passed:resourceMeasurementAvailable&&pixelMismatches.length===0,structuralChecksPassed:true,
   status:resourceMeasurementAvailable&&pixelMismatches.length===0?'measured':'inconclusive',
   browser:await browser.version(),baseline:'171cb5c4507a1530a9bbb080d61805be0da545f7',
   isolated:true,bosses:[1,2,50],widths:[320,430,820],exactZeroHiddenComparisons,visibleGlintControls,
   pixelMismatches,layerEvents,resourceMeasurementAvailable,
   cases,reflectionNodesAfterUnmount:remaining,pageErrors:errors,
   limits:'Linux Chromium/SwiftShader CDP layer observations in an isolated fixture. Other boss children and engine animation excluded. Layer count/paint events do not measure GPU bytes, total page cost, WebKit resource retirement or iPhone interruption cause. Hidden mode is a QA prototype, not a production change.'};
  fs.writeFileSync(path.join(root,'../docs/boss-reflection-audit-20261021/native.json'),JSON.stringify(audit,null,2)+'\n');
  console.log(JSON.stringify({passed:audit.passed,exactZeroHiddenComparisons,visibleGlintControls,layerEvents,
   resourceMeasurementAvailable:audit.resourceMeasurementAvailable,pixelMismatches,cases:cases.length,
   summary:cases.map(c=>({id:c.id,width:c.width,mode:c.mode,layers:c.totalLayers,reflectionLayers:c.reflectionLayers,paintEvents:c.layerPaintEventsDuring30MovingUpdates})),cleanup:remaining},null,2));
  if(!audit.passed)process.exitCode=2;
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
