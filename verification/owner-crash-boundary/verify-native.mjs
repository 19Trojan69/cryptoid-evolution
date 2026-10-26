// Real WPE rendering and DOM controls with local fixtures; never real accounts.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFileSync,mkdirSync,readFileSync,unlinkSync} from 'node:fs';
const root=resolve(new URL('../..',import.meta.url).pathname),require=createRequire(resolve(root,'frontend/package.json'));
const {createServer}=require('vite'),{webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output=resolve(root,'verification/owner-crash-boundary/results');mkdirSync(output,{recursive:true});
const result={localOnly:true,syntheticFixtures:true,physicalDevice:false,historicalWhiteScreenFixed:false,checks:[],errors:[],complete:false};
let server,browser;
const check=(label,value)=>{assert.ok(value,label);result.checks.push(label);};
try{
 const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Local component verification</title></head><body><div id="root"></div><script type="module" src="/@fs/'+root+'/verification/owner-crash-boundary/preview.tsx"></script></body></html>';
 writeFileSync(resolve(root,'frontend/owner-crash-local.html'),html);
 server=await createServer({root:resolve(root,'frontend'),resolve:{dedupe:['react','react-dom']},server:{host:'127.0.0.1',port:4186,strictPort:true,fs:{allow:[root,resolve(root,'frontend/node_modules')]}},logLevel:'error'});server.middlewares.use((req,res,next)=>{
   if (!/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(req.url||'')) return next();
   const bytes=readFileSync(resolve(root,'verification/white-screen-fonts',req.url.split('/').at(-1)));
   res.setHeader('Content-Type','font/ttf');res.end(bytes);
 });await server.listen();
 const base=resolve(root,'verification/native-browsers/webkit-2336/minibrowser-wpe'),libs=resolve(root,'verification/webkit-libs/usr/lib/x86_64-linux-gnu');
 browser=await webkit.launch({headless:true,executablePath:base+'/bin/MiniBrowser',env:{...process.env,WEBKIT_EXEC_PATH:base+'/bin',WEBKIT_INJECTED_BUNDLE_PATH:base+'/lib',WEBKIT_INSPECTOR_RESOURCES_PATH:base+'/share',LD_LIBRARY_PATH:`${base}/lib:${base}/sys/lib:${libs}`,GST_PLUGIN_SYSTEM_PATH_1_0:libs+'/gstreamer-1.0',GST_PLUGIN_SCANNER:libs+'/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner',GST_REGISTRY_1_0:resolve(root,'verification/webkit-native-audio-registry.bin')}});
 result.engine=browser.version();
 for (const published of [true,false]) {
  const context=await browser.newContext({viewport:{width:430,height:825}});
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>result.errors.push(error.message));
  const local='http://127.0.0.1:4186/owner-crash-local.html';
  await page.goto(local+(published?'?published=1':''));await page.getByRole('button',{name:'Start fixture'}).waitFor();
  await page.getByRole('button',{name:'Start fixture'}).click();
  await page.getByRole('heading',{name:'Local game DOM'}).waitFor();
  await page.waitForFunction(()=>window.__crashFixture.tails().sessions[0]?.frames.length>=6);
  const observed=await page.evaluate(()=>window.__crashFixture.report().events.filter(e=>e.kind==='scene-mounted'));
  check(published?'released observer misses nested shell':'corrected observer sees active shell',published?observed.length===0:observed.some(e=>e.active));
  const tail=await page.evaluate(()=>window.__crashFixture.tails().sessions[0]);
  check(`${published?'control':'candidate'}: independent quarter-second frames`,tail.frames.length>=6&&tail.limits.frameIntervalMs===250&&tail.frames.at(-1).at-tail.frames.at(-2).at<400);
  check(`${published?'control':'candidate'}: callback progress`,tail.head.progress.completedFrames>0&&tail.head.progress.sceneCommits>0&&tail.head.progress.completedWork==='boss-motion-and-weapons');
  if(!published){
   await page.getByRole('button',{name:'Pause fixture'}).click();
   await page.waitForFunction(()=>window.__crashFixture.report().events.some(e=>e.kind==='pause-state'&&!e.active));
   check('native pause-state observed without automatic Resume',await page.locator('.game-shell').getAttribute('data-effects-paused')==='true');
  }
  await page.goto(local+'?home=1'+(published?'&published=1':''));await page.getByRole('heading',{name:'Local Home'}).waitFor();
  const exported=await page.evaluate(()=>window.__crashFixture.export());
  check(`${published?'control':'candidate'}: actual IDB history exported`,exported.integrity.contiguous&&exported.records.length>0);
  writeFileSync(resolve(output,`${published?'published-control':'candidate'}-synthetic-export.json`),JSON.stringify(exported,null,2));
  const boundary=exported.crashEvidence.recoveryBoundary;
  check(`${published?'control':'candidate'}: replacement and Home linked`,boundary.homeObservedAt>0&&boundary.nextDocumentStartedAt>boundary.lastEvidenceAt&&boundary.nativeCauseKnown===false);
  check(`${published?'control':'candidate'}: ordinary pagehide remains distinct`,boundary.status==='replacement-with-lifecycle-signal');

  await context.close();
 }
 check('no page errors',result.errors.length===0);result.complete=true;
}catch(error){result.failure=String(error.stack||error);process.exitCode=1;}
finally{if(browser)await browser.close();if(server)await server.close();try{unlinkSync(resolve(root,'frontend/owner-crash-local.html'));}catch{}writeFileSync(resolve(output,'native.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
