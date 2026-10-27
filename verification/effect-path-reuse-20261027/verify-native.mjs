import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(new URL('../..',import.meta.url).pathname),require=createRequire(root+'/frontend/package.json');
const {createServer}=require('vite'),{webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output=root+'/verification/effect-path-reuse-20261027/results';mkdirSync(output,{recursive:true});
const result={baseline:'3588ff2d0d39779e54c3a9b31eba636e81559c93',localOnly:true,physicalDevice:false,temperatureMeasured:false,checks:[],errors:[]};
const check=(label,value)=>{assert.ok(value,label);result.checks.push(label);};let server,browser;
try{
 server=await createServer({root:root+'/frontend',cacheDir:output+'/vite-native',logLevel:'error',optimizeDeps:{noDiscovery:true,include:['react','react-dom/client']},server:{host:'127.0.0.1',port:0,hmr:false,fs:{allow:[root]}},
  plugins:[{name:'native-path-source-control',enforce:'pre',resolveId(id){if(id==='baseline-impact')return root+'/frontend/src/pages/CanvasEffects.baseline.tsx';},
   load(id){if(id.endsWith('/CanvasEffects.baseline.tsx'))return execFileSync('git',['show','3588ff2:frontend/src/pages/CanvasEffects.tsx'],{cwd:root,encoding:'utf8'});}}]});
 writeFileSync(root+'/frontend/effect-path-local.html','<!doctype html><html><body><div id="root"></div><script type="module" src="/@fs/'+root+'/verification/effect-path-reuse-20261027/preview.tsx"></script></body></html>');
 await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
 const base=root+'/verification/native-browsers/webkit-2336/minibrowser-wpe',libs=root+'/verification/effect-path-reuse-20261027/local-libraries/extracted/usr/lib/x86_64-linux-gnu';
 browser=await webkit.launch({headless:true,executablePath:base+'/bin/MiniBrowser',env:{...process.env,WEBKIT_EXEC_PATH:base+'/bin',WEBKIT_INJECTED_BUNDLE_PATH:base+'/lib',WEBKIT_INSPECTOR_RESOURCES_PATH:base+'/share',LD_LIBRARY_PATH:`${base}/lib:${base}/sys/lib:${libs}`,GST_PLUGIN_SYSTEM_PATH_1_0:libs+'/gstreamer-1.0',GST_PLUGIN_SCANNER:libs+'/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner',GST_REGISTRY_1_0:output+'/registry.bin'}});
 result.engine=browser.version();const page=await browser.newPage({viewport:{width:430,height:825}});page.on('pageerror',e=>result.errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({status:200,body:''}));
 await page.clock.install();await page.goto(origin+'/effect-path-local.html');await page.waitForFunction(()=>!!window.__paths);
 result.impacts=await page.evaluate(()=>window.__paths.compareImpact());
 check('all thirty-six WebKit impact images retain exact RGBA',result.impacts.rows.length===36&&result.impacts.rows.every(row=>row.equal));
 check('all original fragment clips still execute',result.impacts.calls.clipsBefore===result.impacts.calls.clipsAfter&&result.impacts.calls.clipsAfter>0);
 check('fixed fragment outlines need no frame-time path commands',result.impacts.calls.before>0&&result.impacts.calls.after===0);
 await page.evaluate(()=>window.__paths.mount());await page.waitForFunction(()=>window.__paths.inspect().registeredEffects===1);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
 const start=await page.evaluate(()=>window.__paths.inspect());await page.clock.runFor(500);
 const moving=await page.evaluate(()=>window.__paths.inspect());
 check('actual React effect keeps four compiled paths while drawing',moving.paths===start.paths&&moving.draws>start.draws&&moving.registeredEffects===1);
 await page.evaluate(()=>window.__paths.update({paused:true}));await page.waitForFunction(()=>document.querySelector('.game-shell').dataset.effectsPaused==='true');
 await page.clock.runFor(50);const pause=await page.evaluate(()=>window.__paths.inspect());await page.clock.runFor(5000);
 check('a five-second pause preserves the prepared effect without drawing',await page.evaluate(()=>window.__paths.inspect().draws)===pause.draws);
 await page.evaluate(()=>window.__paths.update({paused:false}));await page.waitForFunction(()=>document.querySelector('.game-shell').dataset.effectsPaused==='false');await page.clock.runFor(100);
 check('explicit resume draws the original effect again',await page.evaluate(()=>window.__paths.inspect().draws)>pause.draws);
 await page.evaluate(()=>window.__paths.lose());await page.waitForSelector('[data-original]');
 check('context loss retires prepared records and keeps original DOM fallback',await page.evaluate(()=>window.__paths.inspect().registeredEffects===0&&!window.__paths.inspect().activeDrawFrame));
 await page.evaluate(()=>window.__paths.unmount());
 check('unmount releases existing raster caches and effect ownership',await page.evaluate(()=>{const s=window.__paths.inspect();return s.registeredEffects===0&&s.cacheBytes===0&&s.surfaceBytes===0;}));
 check('no JavaScript page errors',result.errors.length===0);result.complete=true;
}catch(error){result.failure={message:error.message,stack:error.stack};throw error;}
finally{
 try{unlinkSync(root+'/frontend/effect-path-local.html');}catch{}
 writeFileSync(output+'/native.json',JSON.stringify(result,null,2)+'\n');await browser?.close();await server?.close();console.log(JSON.stringify({complete:result.complete,checks:result.checks.length,failure:result.failure?.message}));
}
