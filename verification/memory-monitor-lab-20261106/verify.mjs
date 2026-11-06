import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {createReadStream,existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {extname,resolve} from 'node:path';
const directory=new URL('.',import.meta.url).pathname,out=directory+'results';mkdirSync(out,{recursive:true});
const require=createRequire(new URL('../transition-motion-20261106/package.json',import.meta.url)),pw=require('playwright');
const engine=process.argv[2];assert.ok(['chromium','webkit'].includes(engine));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.woff2':'font/woff2'};
const site=resolve(directory,'site');
const server=createServer((req,res)=>{
 let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 let file=resolve(site,'.'+path);
 if(!file.startsWith(site+'/')&&file!==site){res.writeHead(403).end();return;}
 if(!existsSync(file)||statSync(file).isDirectory())file=site+'/index.html';
 res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await pw[engine].launch({headless:true});let page;let result={engine,complete:false,physicalPhone:false,whiteScreenFixed:false,scenes:[]};
try{
 const context=await browser.newContext({viewport:{width:390,height:760},deviceScaleFactor:3,isMobile:true,hasTouch:true,acceptDownloads:true});
 const unexpected=[],pageErrors=[],assetErrors=[];
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===origin||['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))return route.continue();unexpected.push(u.origin);return route.abort();});
 page=await context.newPage();page.setDefaultTimeout(60000);
 page.on('pageerror',e=>pageErrors.push(e.message));page.on('crash',()=>pageErrors.push('page-crash'));
 page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)assetErrors.push({url:r.url().replace(origin,''),status:r.status()});});
 await page.goto(origin,{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Speicherlabor',exact:true}).waitFor();
 assert.equal(await page.locator('.game-shell').count(),0);
 for(const scene of ['normal','turrets','reactor']){
   await page.getByLabel('Startpunkt',{exact:true}).selectOption(scene);
   if(scene!=='normal')await page.getByLabel('Testschutz gegen Lebensverlust',{exact:true}).check();
   const overwrite=page.getByLabel('Den letzten lokalen Bericht durch einen neuen Lauf ersetzen',{exact:true});
   if(await overwrite.count())await overwrite.check();
   await page.getByRole('button',{name:'Test vorbereiten',exact:true}).click();
   await page.getByRole('button',{name:'Testspiel starten',exact:true}).click();
   await page.waitForFunction(()=>typeof window.__cryptoidLabRead==='function');
   let state=await page.evaluate(()=>window.__cryptoidLabRead());
   if(scene==='normal'){assert.equal(state.level,1);assert.equal(state.bossId,null);}
   else {assert.equal(state.bossId,2);assert.equal(state.status,'paused');if(scene==='reactor'){assert.equal(state.liveTurrets,0);assert.ok(Math.abs(state.reactorPercent-55)<.0001);}else assert.ok(state.liveTurrets>0);
   }
   assert.equal(state.status,'paused');
   await page.locator('.pause-resume-button').click();
   await page.waitForFunction(()=>window.__cryptoidLabRead?.().status==='playing');
   await page.waitForFunction(()=>{const points=window.__cryptoidLabRun?.samples,last=points?.at(-1);return points?.length>=2&&last?.status==='playing'&&last.activeMs>1000&&last.frames>5;});
   if(scene!=='normal'){
     await page.waitForFunction(()=>{const s=window.__cryptoidLabRead?.(),canvas=document.querySelector('.sector-boss .boss-weapons-canvas');return s?.encounter==='boss-fight'&&s.status==='playing'&&canvas?.width>0&&!canvas.hidden&&!!document.querySelector('.sector-boss .boss-special-weapon');});
     await page.waitForFunction(()=>{const s=window.__cryptoidLabRun?.samples.at(-1);return s?.encounter==='boss-fight'&&s.domCanvasLogicalBytes>0;});
   }
   const samples=await page.evaluate(()=>window.__cryptoidLabRun.samples);
   assert.ok(samples.at(-1).activeMs>0);assert.equal(await page.locator('[data-lab-monitor] .lab-total').innerText(),'Browser-Gesamt-RAM: nicht verfügbar');
   if(engine==='webkit')assert.equal(samples.at(-1).heapBytes,null);
   assert.equal(await page.evaluate(()=>window.__cryptoidLabRun.state),'running','StrictMode setup must undo its temporary cleanup marker');
   const elapsed=samples.at(-1).wallMs-samples.at(-2).wallMs;assert.ok(elapsed>=4000,'One sampler only, not duplicated by StrictMode');
   assert.ok(await page.locator('.lab-graph path[d]').count()>1);
   const panelBox=await page.locator('.lab-monitor').boundingBox();assert.ok(panelBox.x+panelBox.width<=390/2-12,'Monitor must leave the central reactor corridor visible');
   const before=await page.evaluate(()=>window.__cryptoidLabRead().activeMs);
   await page.getByRole('button',{name:'Pause',exact:true}).click();
   await page.waitForFunction(()=>window.__cryptoidLabRead().status==='paused');
   const frozen=await page.evaluate(()=>window.__cryptoidLabRead().activeMs);await page.waitForTimeout(5250);
   assert.ok(Math.abs((await page.evaluate(()=>window.__cryptoidLabRead().activeMs))-frozen)<100);
   await page.locator('.pause-resume-button').click();
   await page.waitForFunction(()=>window.__cryptoidLabRead().status==='playing');
   await page.getByRole('button',{name:'Monitor verkleinern',exact:true}).click();assert.equal(await page.locator('.lab-graph').count(),0);
   assert.match(await page.locator('.lab-mini').innerText(),/Canvas-Flächen/);
   assert.equal(await page.evaluate(()=>window.__cryptoidLabRead().status),'playing');
   await page.getByRole('button',{name:'Monitor vergrößern',exact:true}).click();assert.equal(await page.locator('.lab-graph').count(),1);
   if(scene==='reactor'){await page.screenshot({path:out+'/'+engine+'-reactor-monitor.png'});}
   const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('cryptoid_memory_lab_report_v1')));
   assert.ok(persisted.samples.length>=2);assert.ok(persisted.samples.length<=360);assert.equal(persisted.options.scene,scene);
   await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Speicherlabor',exact:true}).waitFor();
   assert.equal(await page.locator('.game-shell').count(),0);assert.equal(await page.evaluate(()=>typeof window.__cryptoidLabRead),'undefined');
   assert.match(await page.locator('.lab-last').innerText(),/Letzter gesicherter Lauf/);
   assert.equal(await page.getByRole('button',{name:'Test vorbereiten',exact:true}).isEnabled(),false);
   const waiting=page.waitForEvent('download');await page.getByRole('button',{name:'Bericht herunterladen',exact:true}).click();const download=await waiting;
   const chunks=[];for await(const chunk of await download.createReadStream())chunks.push(chunk);const exported=JSON.parse(Buffer.concat(chunks).toString());
   assert.equal(exported.startedAt,persisted.startedAt);assert.ok(exported.samples.length>=persisted.samples.length);assert.equal(exported.limits.totalNativeRamAvailable,false);
   result.scenes.push({scene,pauseResume:true,recoveredWithoutAutoRestart:true,downloadValid:true,samples:exported.samples.length,activeBeforePause:before,heapSupported:exported.samples.at(-1).heapBytes!==null,bossFightCanvasAndReactorVerified:scene!=='normal'});
 }
 assert.deepEqual(unexpected,[]);assert.deepEqual(pageErrors,[]);assert.deepEqual(assetErrors,[]);
 result.complete=true;result.noLiveBackendRequests=true;result.noBrowserErrors=true;
}catch(e){result.failure={message:e.message,stack:e.stack};if(page){result.lastScene=await page.evaluate(()=>window.__cryptoidLabRead?.()??null).catch(()=>null);result.visibleText=await page.locator('body').innerText().catch(()=>null);await page.screenshot({path:out+'/'+engine+'-failed.png'}).catch(()=>{});}process.exitCode=1;}
finally{writeFileSync(out+'/'+engine+'.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));await browser.close();await new Promise(r=>server.close(r));}
