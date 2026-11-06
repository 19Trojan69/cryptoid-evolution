import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {root,configuration} from '../boss2-forensics-20261028/fixture.mjs';import {serveDevicePreview} from '../boss2-forensics-20261028/devicePreviewServer.mjs';
const req=createRequire(new URL('../boss2-forensics-20261028/package.json',import.meta.url)),pw=req('playwright');
const engine=process.argv[2];assert.ok(['chromium','webkit'].includes(engine));assert.equal(req('playwright/package.json').version,'1.62.1');
const out=root+'/verification/star-clip-20261106/results/'+engine;mkdirSync(out,{recursive:true});
const css=readFileSync(root+'/frontend/src/index.css','utf8');
assert.equal(createHash('sha256').update(css).digest('hex'),'cf48ca4553ac7fa425f37e84a334acc3fec2f2163b72d31bfe9b35f7d33c27b5');
for(const exact of ['@keyframes star-sway-far { to { transform: translate3d(7px, -5px, 0); } }','@keyframes star-sway-near { to { transform: translate3d(-11px, 8px, 0); } }'])assert.equal(css.split(exact).length-1,1);
const result={version:1,complete:false,engine,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 sourceTree:execFileSync('git',['rev-parse','HEAD^{tree}'],{cwd:root,encoding:'utf8'}).trim(),physicalDevice:false,whiteScreenFixed:false,
 sourceGameFilesEdited:false,fullGamePixelAcceptance:false,fixtureUsesBothActualStarSvgs:true,cases:[],clip:'inset(-12px) border-box',
 originalMotionExtrema:{far:[7,-5],near:[-11,8]},clipSafetyMarginPx:12};
const save=()=>writeFileSync(out+'/result.json',JSON.stringify(result,null,2)+'\n');let browser,server,page;
async function tap(locator){await locator.waitFor({state:'visible',timeout:60000});const b=await locator.boundingBox();assert.ok(b);await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);}
async function layers(){
 const s=page._connection.toImpl(page).delegate._session;await s.send('LayerTree.enable');const nodes=new Map(),visit=n=>{if(!n)return;const a=n.attributes??[];let cls='';for(let i=0;i<a.length;i+=2)if(a[i]==='class')cls=a[i+1];if(n.nodeId)nodes.set(n.nodeId,{name:n.nodeName,cls});for(const c of n.children??[])visit(c);};
 const listener=e=>(e.nodes??[]).forEach(visit);s.on('DOM.setChildNodes',listener);
 try{const {root}=await s.send('DOM.getDocument');visit(root);await s.send('DOM.requestChildNodes',{nodeId:root.nodeId,depth:-1});const {layers}=await s.send('LayerTree.layersForNode',{nodeId:root.nodeId});
  const star=layers.filter(l=>nodes.get(l.nodeId)?.cls.includes('starfield-stars')).map(l=>({node:nodes.get(l.nodeId),memory:l.memory,bounds:l.compositedBounds}));return {stars:star,estimatedBytes:star.reduce((a,l)=>a+l.memory,0)};
 }finally{s.removeListener('DOM.setChildNodes',listener);}
}
try{
 server=await serveDevicePreview();browser=await pw[engine].launch({headless:true});result.engineVersion=browser.version();
 const sourceContext=await browser.newContext({...configuration('iphone',pw.devices).context,viewport:{width:430,height:825},deviceScaleFactor:3});page=await sourceContext.newPage();
 await page.goto(server.origin,{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Testszene vorbereiten',exact:true}).waitFor();
 const info=await(await sourceContext.request.get(server.origin+'/device-preview-info.json')).json();assert.equal(info.guestOnly,true);assert.equal(info.sourceCommit,result.sourceCommit);
 assert.equal(info.playerMuzzleLocalCandidate.compiledVirtualControllerSha256,'00e3796f3eb0bbaec3f2ae16bb5ac46a2d88c8abc6647fee0e1a5b634249a18d');
 await tap(page.getByRole('button',{name:'Testszene vorbereiten',exact:true}));await tap(page.getByRole('button',{name:'Boss-2-Test öffnen',exact:true}));
 await page.waitForFunction(()=>window.__crossDeviceTest?.inspect().status==='paused');
 const markup=await page.locator('.starfield > svg').evaluateAll(nodes=>nodes.map(n=>n.outerHTML).join(''));assert.equal(await page.locator('.starfield > svg').count(),2);
 const hrefs=await page.locator('link[rel="stylesheet"]').evaluateAll(nodes=>nodes.map(n=>n.href));let styles='';
 for(const href of hrefs.filter(x=>x.startsWith(server.origin+'/'))){const r=await sourceContext.request.get(href);assert.ok(r.ok());styles+='\n'+await r.text();}
 assert.ok(styles.includes('starfield-stars'));result.originalLoadedCssSha256=createHash('sha256').update(styles).digest('hex');
 await sourceContext.close();
 const motions=['normal','system-reduced','setting-reduced'];
 const transforms=[[[0,0],[0,0]],[[7,-5],[-11,8]],[[7,-5],[0,0]],[[0,0],[-11,8]],[[3.5,-2.5],[-5.5,4]]];
 for(const [width,height] of [[390,844],[430,825],[844,430],[1024,768]])for(const dpr of [1,3]){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr});page=await ctx.newPage();
  await page.setContent('<!doctype html><meta name="viewport" content="width=device-width"><div id="clip-fixture"><div class="starfield starfield-sector-2 starfield-paused">'+markup+'</div></div>');
  await page.addStyleTag({content:styles});await page.addStyleTag({content:'html,body{margin:0!important;width:100%!important;height:100%!important;overflow:hidden!important}#clip-fixture{position:relative;width:100vw;height:100vh;overflow:hidden;background:#08101b}.starfield-stars{animation:none!important}'});
  assert.equal(await page.evaluate(()=>CSS.supports('clip-path','inset(-12px) border-box')),true);
  for(const motion of motions){
   await page.emulateMedia({reducedMotion:motion==='system-reduced'?'reduce':'no-preference'});
   await page.evaluate(m=>{if(m==='setting-reduced')document.documentElement.dataset.motion='reduced';else delete document.documentElement.dataset.motion;},motion);
   for(const positions of motion==='normal'?transforms:[transforms[0]]){
    await page.locator('.starfield-stars').evaluateAll((nodes,p)=>nodes.forEach((n,i)=>n.style.transform='translate3d('+p[i][0]+'px,'+p[i][1]+'px,0)'),positions);
    const beforeGeometry=await page.locator('.starfield-stars').evaluateAll(ns=>ns.map(n=>({r:JSON.stringify(n.getBoundingClientRect().toJSON()),transform:getComputedStyle(n).transform,clip:getComputedStyle(n).clipPath})));assert.ok(beforeGeometry.every(x=>x.clip==='none'));
    const before=await page.locator('#clip-fixture').screenshot({animations:'allow'});
    let beforeLayers;if(engine==='webkit'&&width===430&&height===825&&dpr===3&&motion==='normal'&&positions===transforms[0])beforeLayers=await layers();
    const style=await page.addStyleTag({content:'.starfield-stars{clip-path:inset(-12px) border-box;}'});
    const afterGeometry=await page.locator('.starfield-stars').evaluateAll(ns=>ns.map(n=>({r:JSON.stringify(n.getBoundingClientRect().toJSON()),transform:getComputedStyle(n).transform,clip:getComputedStyle(n).clipPath})));
    for(let i=0;i<2;i++){assert.equal(beforeGeometry[i].r,afterGeometry[i].r);assert.equal(beforeGeometry[i].transform,afterGeometry[i].transform);assert.notEqual(afterGeometry[i].clip,'none');}
    const after=await page.locator('#clip-fixture').screenshot({animations:'allow'});
    const comparison=await page.evaluate(async raw=>{
     const images=await Promise.all(raw.map(s=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='data:image/png;base64,'+s;})));
     const canvases=images.map(i=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);return c;});
     if(canvases[0].width!==canvases[1].width||canvases[0].height!==canvases[1].height)throw Error('Dimensions differ');
     const data=canvases.map(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data);let different=0,maxDelta=0,nonBackgroundPixels=0;for(let p=0;p<data[0].length;p+=4){if([0,1,2,3].some(c=>data[0][p+c]!==data[0][c]))nonBackgroundPixels++;}for(let i=0;i<data[0].length;i++){if(data[0][i]!==data[1][i])different++;maxDelta=Math.max(maxDelta,Math.abs(data[0][i]-data[1][i]));}
     const result={width:canvases[0].width,height:canvases[0].height,differentChannels:different,maxDelta,nonBackgroundPixels};for(const c of canvases)c.width=c.height=0;for(const i of images)i.src='';return result;
    },[before.toString('base64'),after.toString('base64')]);
    const row={width,height,dpr,motion,positions,comparison};result.cases.push(row);
    if(beforeLayers){const afterLayers=await layers();result.nativeBackingEstimate={before:beforeLayers,after:afterLayers,eligible:beforeLayers.stars.length===2&&afterLayers.stars.length===2,limits:'Logical browser estimate for the two fixture SVG backing stores; no total PSS or phone/GPU measurement.'};}
    await style.evaluate(n=>n.remove());save();assert.ok(comparison.nonBackgroundPixels>0,'The original stars must actually be visible');assert.equal(comparison.differentChannels,0,'Every visible fixture pixel must remain identical');
   }
  }
  await ctx.close();
 }
 result.complete=true;
}catch(e){result.failure={message:e.message};process.exitCode=1;}
finally{if(browser)await browser.close();if(server)await server.close();save();console.log('STAR_CLIP_RESULT '+JSON.stringify({complete:result.complete,cases:result.cases.length,failure:result.failure,native:result.nativeBackingEstimate}));}
