import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(new URL('../..',import.meta.url).pathname),require=createRequire(root+'/frontend/package.json');
const {createServer}=require('vite'),{webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output=root+'/verification/continue-hull-prefetch/results';mkdirSync(output,{recursive:true});
const before=process.env.BASELINE==='1',result={localOnly:true,physicalDevice:false,baseline:before,checks:[],errors:[]};let server,browser;
const check=(label,value)=>{assert.ok(value,label);result.checks.push(label);};
try{
 server=await createServer({root:root+'/frontend',cacheDir:output+(before?'/vite-published':'/vite-candidate'),logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false,fs:{allow:[root,root+'/frontend/node_modules']}},plugins:[{name:'pinned-prefetch-counterexample',enforce:'pre',transform(code,id){
  const path=id.split('?')[0];if(!['src/pages/paintedShip.ts','src/pages/usePreparedGameHulls.ts','src/pages/bossArtwork.ts'].some(f=>path===root+'/frontend/'+f))return;
  if(before)code=execFileSync('git',['show','bd23bd4:frontend/'+path.slice((root+'/frontend/').length)],{cwd:root,encoding:'utf8'});
  if(path.endsWith('/bossArtwork.ts'))return code.replace('const image = new Image();',"const image = new Image(); (window as any).__cardWarm.push(src);");
  if(path.endsWith('/paintedShip.ts'))return code.replace('const image = new Image();',"const image = new Image(); (window as any).__rawWarm.push(url);").replace("hullPreparationStep('source-ready', diagnostic);","hullPreparationStep('source-ready', diagnostic); (window as any).__sourceDone.push(url);").replace('canvas = document.createElement("canvas");','canvas = document.createElement("canvas"); (window as any).__centerWarm.push(url);');
  return code.replace(/const next = retainPreparedHulls\([^\n]+\);/,m=>m+' (window as any).__nextHullPlan = next.settled;');
 }}]});
 writeFileSync(root+'/frontend/prefetch-local.html','<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/@fs/'+root+'/verification/continue-hull-prefetch/preview.tsx"></script></body></html>');
 server.middlewares.use((req,res,next)=>{if(!/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(req.url||''))return next();res.setHeader('Content-Type','font/ttf');res.end(readFileSync(root+'/verification/white-screen-fonts/'+req.url.split('/').at(-1)));});
 await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
 const base=root+'/verification/native-browsers/webkit-2336/minibrowser-wpe',libs=root+'/verification/webkit-libs/usr/lib/x86_64-linux-gnu';
 browser=await webkit.launch({headless:true,executablePath:base+'/bin/MiniBrowser',env:{...process.env,WEBKIT_EXEC_PATH:base+'/bin',WEBKIT_INJECTED_BUNDLE_PATH:base+'/lib',WEBKIT_INSPECTOR_RESOURCES_PATH:base+'/share',LD_LIBRARY_PATH:`${base}/lib:${base}/sys/lib:${libs}`,GST_PLUGIN_SYSTEM_PATH_1_0:libs+'/gstreamer-1.0',GST_PLUGIN_SCANNER:libs+'/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner',GST_REGISTRY_1_0:output+'/registry.bin'}});
 result.engine=browser.version();const context=await browser.newContext({viewport:{width:1040,height:1460},reducedMotion:'reduce'});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:readFileSync(root+'/verification/white-screen-fonts/fonts.css','utf8').replaceAll('/font-mirror/',origin+'/font-mirror/')});if(u.origin===origin)return route.continue();return route.fulfill({status:200,body:''});});
 await context.addInitScript(()=>{window.__rawWarm=[];window.__centerWarm=[];window.__cardWarm=[];window.__sourceDone=[];});const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('console',e=>{if(e.type()==='error'){result.consoleErrors??=[];result.consoleErrors.push(e.text());}});page.on('requestfailed',r=>{result.failedRequests??=[];result.failedRequests.push({path:new URL(r.url()).pathname,error:r.failure()?.errorText});});result.frames=[];
 await page.goto(origin+'/prefetch-local.html');
 await page.waitForFunction(()=>Boolean(window.__prefetchState?.sector===60 && window.__nextHullPlan)).catch(async error=>{console.log(JSON.stringify({body:await page.locator('body').innerText(),errors:result.errors,consoleErrors:result.consoleErrors,failedRequests:result.failedRequests}));throw error;});
 await page.evaluate(()=>window.__nextHullPlan);
 await page.waitForFunction(()=>document.querySelectorAll('.material-hull[data-hull-ready="true"]').length===7);
 check('bonus/next group preparation settles with every visible original hull ready',await page.evaluate(()=>document.querySelectorAll('.material-hull[data-hull-ready="true"]').length===7));
 await page.waitForFunction(()=>document.querySelector('#offset-probe')?.style.getPropertyValue('--ship-visual-offset-x')!=='0%');
 const offsetBefore=await page.locator('#offset-probe').getAttribute('style');
 const beforeStats=await page.evaluate(()=>{window.__prefetchState.hulls.releaseUnusedPaintedShips();window.__rawWarm=[];window.__centerWarm=[];window.__sourceDone=[];return window.__prefetchState.hulls.paintedShipResourceStats();});
 check('completion cleanup evicts raw sources while prepared hulls stay retained',beforeStats.sources===0 && beforeStats.painted>=12);
 await page.evaluate(()=>window.__prefetchState.remountOffset());
 await page.waitForFunction(()=>document.querySelector('#offset-probe')?.style.getPropertyValue('--ship-visual-offset-x')!=='0%');
 const remount=await page.evaluate(()=>({jobs:[...window.__rawWarm],centers:window.__centerWarm.length}));
 check(before?'published player remount reloads its known original':'known player center avoids original-image reload on re-entry',remount.jobs.length===(before?1:0));
 check('player offset stays identical after remount',await page.locator('#offset-probe').getAttribute('style')===offsetBefore);
 if(before)await page.waitForFunction(()=>window.__sourceDone.length===1);
 await page.evaluate(()=>{window.__prefetchState.hulls.releaseUnusedPaintedShips();window.__rawWarm=[];window.__centerWarm=[];});
 await page.evaluate(()=>window.__prefetchState.advance());
 await page.waitForFunction(()=>window.__prefetchState.sector===61);
 await page.evaluate(()=>window.__nextHullPlan);
 const evidence=await page.evaluate(()=>({rawImages:[...window.__rawWarm],centeringCanvases:window.__centerWarm.length,ready:document.querySelectorAll('.material-hull[data-hull-ready="true"]').length,stats:window.__prefetchState.hulls.paintedShipResourceStats()}));
 check(before?'published hook reloads all six already-prepared raw originals':'prepared transition creates no redundant raw Image jobs',evidence.rawImages.length===(before?6:0));
 check('all seven visible hulls remain ready after the transition',evidence.ready===7);
 check('incoming prepared pins remain active',evidence.stats.retained>=12);
 result.evidence=evidence;result.playerRemount=remount;
 const artwork=await page.evaluate(async()=>{
  window.__cardWarm=[];const art=await window.__prefetchState.artwork();
  const outputs=art.map(canvas=>{const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let hash=2166136261;for(const byte of pixels)hash=Math.imul(hash^byte,16777619)>>>0;return{width:canvas.width,height:canvas.height,pixelHash:hash};});
  const jobs=[...window.__cardWarm];const cached=await window.__prefetchState.artwork();
  return{jobs,outputs,cachedSame:cached.every((canvas,i)=>canvas===art[i]),jobsAfterCache:window.__cardWarm.length};
 });
 check(before?'published eight-color gallery creates eight original-image jobs':'eight-color gallery shares one pending original-image job',artwork.jobs.length===(before?8:1));
 check('all eight artwork outputs have visible pixels',artwork.outputs.length===8&&artwork.outputs.every(a=>a.width>100&&a.height>100));
 check('cached artwork is reused without further source work',artwork.cachedSame&&artwork.jobsAfterCache===artwork.jobs.length);
 if(!before){const baseline=JSON.parse(readFileSync(output+'/published-control.json','utf8'));check('all gallery dimensions and original painted pixels match published control',JSON.stringify(artwork.outputs)===JSON.stringify(baseline.artwork.outputs));}
 result.artwork=artwork;
 const bossArt=await page.evaluate(async()=>{
  window.__cardWarm=[];const art=await window.__prefetchState.bossArtwork();
  return{jobs:[...window.__cardWarm],outputs:art.map(canvas=>{const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let hash=2166136261;for(const byte of pixels)hash=Math.imul(hash^byte,16777619)>>>0;return{width:canvas.width,height:canvas.height,pixelHash:hash,turrets:canvas.dataset.turretCount};})};
 });
 check(before?'published simultaneous boss resolutions load the original twice':'boss map/card resolutions share one pending original-image job',bossArt.jobs.length===(before?2:1));
 check('both boss resolutions retain their distinct composed output and turrets',bossArt.outputs.length===2&&bossArt.outputs[0].width!==bossArt.outputs[1].width&&bossArt.outputs.every(a=>Number(a.turrets)>0));
 if(!before){const baseline=JSON.parse(readFileSync(output+'/published-control.json','utf8'));check('both boss dimensions and composed pixels match published control',JSON.stringify(bossArt.outputs)===JSON.stringify(baseline.bossArtwork.outputs));}
 result.bossArtwork=bossArt;
 check('no page errors',result.errors.length===0);result.complete=true;
 await page.screenshot({path:output+`/${before?'published':'candidate'}-ready.png`});
}finally{try{unlinkSync(root+'/frontend/prefetch-local.html');}catch{}writeFileSync(output+`/${before?'published-control':'native'}.json`,JSON.stringify(result,null,2)+'\n');await browser?.close();await server?.close();console.log(JSON.stringify({complete:result.complete,checks:result.checks.length,rawJobs:result.evidence?.rawImages.length,centeringCanvases:result.evidence?.centeringCanvases,errors:result.errors}));}
