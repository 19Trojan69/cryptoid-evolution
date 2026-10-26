import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(new URL('../..',import.meta.url).pathname),require=createRequire(root+'/frontend/package.json');
const {createServer}=require('vite'),{webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output=root+'/verification/cockpit-indicator-spacing/results';mkdirSync(output,{recursive:true});
const before=process.env.BASELINE==='1',result={localOnly:true,physicalDevice:false,baseline:before,checks:[],errors:[]};let server,browser;
const check=(label,value)=>{assert.ok(value,label);result.checks.push(label);};
try{
 server=await createServer({root:root+'/frontend',cacheDir:output+(before?'/vite-baseline':'/vite-candidate'),logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false,fs:{allow:[root,root+'/frontend/node_modules']}},plugins:[{name:'pinned-overlay-control',enforce:'pre',transform(code,id){if(!before)return;const path=id.split('?')[0];if(['src/components/GameAccessGate.tsx','src/cockpitMenus.css','src/index.css'].some(f=>path===root+'/frontend/'+f))return execFileSync('git',['show','dbed249:frontend/'+path.slice((root+'/frontend/').length)],{cwd:root,encoding:'utf8'});}}]});
 writeFileSync(root+'/frontend/cockpit-indicators-local.html','<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/@fs/'+root+'/verification/cockpit-indicator-spacing/preview.tsx"></script></body></html>');
 server.middlewares.use((req,res,next)=>{if(!/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(req.url||''))return next();res.setHeader('Content-Type','font/ttf');res.end(readFileSync(root+'/verification/white-screen-fonts/'+req.url.split('/').at(-1)));});
 await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
 const base=root+'/verification/native-browsers/webkit-2336/minibrowser-wpe',libs=root+'/verification/webkit-libs/usr/lib/x86_64-linux-gnu';
 browser=await webkit.launch({headless:true,executablePath:base+'/bin/MiniBrowser',env:{...process.env,WEBKIT_EXEC_PATH:base+'/bin',WEBKIT_INJECTED_BUNDLE_PATH:base+'/lib',WEBKIT_INSPECTOR_RESOURCES_PATH:base+'/share',LD_LIBRARY_PATH:`${base}/lib:${base}/sys/lib:${libs}`,GST_PLUGIN_SYSTEM_PATH_1_0:libs+'/gstreamer-1.0',GST_PLUGIN_SCANNER:libs+'/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner',GST_REGISTRY_1_0:output+'/registry.bin'}});
 result.engine=browser.version();const context=await browser.newContext({viewport:{width:1040,height:1460},reducedMotion:'reduce'});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:readFileSync(root+'/verification/white-screen-fonts/fonts.css','utf8').replaceAll('/font-mirror/',origin+'/font-mirror/')});if(u.origin===origin)return route.continue();return route.fulfill({status:200,body:''});});
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));result.views=[];
 const url=(mode,extra='')=>origin+'/cockpit-indicators-local.html?mode='+mode+(before?'&baseline=1':'')+extra;
 for(const viewport of [{width:393,height:744},{width:393,height:628},{width:768,height:1024},{width:393,height:550}]){
  await page.setViewportSize(viewport);await page.goto(url('access'));await page.waitForSelector('.launch-ship');await page.waitForFunction(()=>document.querySelector('.launch-ship').complete);await page.evaluate(()=>document.fonts.ready);
  const center=await page.evaluate(()=>{const scene=document.querySelector('.launch-scene').getBoundingClientRect(),ship=document.querySelector('.launch-ship').getBoundingClientRect(),[l,t,r,b]=window.__launchBounds;return{x:ship.left+ship.width*(l+r)/200-(scene.left+scene.width/2),y:ship.top+ship.height*(t+b)/200-(scene.top+scene.height/2)};});
  check(before?'published visible hull is off-center at '+viewport.height:'visible original hull is centered at '+viewport.height,before?Math.abs(center.y)>10:Math.abs(center.x)<.6&&Math.abs(center.y)<.6);
  result.views.push({viewport,center});await page.screenshot({path:output+`/${before?'before':'after'}-access-${viewport.height}.png`});
 }
 await page.setViewportSize({width:393,height:744});await page.goto(url('access'));await page.waitForSelector('.launch-status i');await page.emulateMedia({reducedMotion:'no-preference'});
 const phases=await page.locator('.launch-status i').evaluateAll(nodes=>[100,500,900,1300].map(time=>nodes.map(n=>{const a=n.getAnimations()[0];if(a){a.pause();a.currentTime=time;}return Number(getComputedStyle(n).opacity);})));
 check(before?'published loading stripes are static':'three stripes light in order and repeat',before?phases.every(row=>row.every(x=>x===1)):JSON.stringify(phases)===JSON.stringify([[1,.2,.2],[.2,1,.2],[.2,.2,1],[1,.2,.2]]));result.loadingPhases=phases;
 await page.emulateMedia({reducedMotion:'reduce'});check('reduced motion keeps clear static stripes',await page.locator('.launch-status i').evaluateAll(nodes=>nodes.every(n=>n.getAnimations().length===0&&Number(getComputedStyle(n).opacity)===1)));
 for(const viewport of [{width:393,height:628},{width:393,height:744},{width:768,height:1024}]){
  await page.setViewportSize(viewport);await page.goto(url('notice'));await page.waitForSelector('.weapon-reloading');
  const inspect=()=>page.evaluate(()=>{const n=document.querySelector('.weapon-reloading'),a=n.getBoundingClientRect(),labels=[...document.querySelectorAll('.game-hud,.game-label,.flight-indicator,.bonus-counter')].map(x=>x.getBoundingClientRect());return{top:a.top,bottom:a.bottom,color:getComputedStyle(n).color,overlaps:labels.some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)};});
  let row=await inspect();if(!before){check('reload notice is red at '+viewport.height,row.color==='rgb(255, 127, 135)');check('reload notice clears all top text at '+viewport.height,!row.overlaps);}
  await page.evaluate(()=>window.__extraNotice());await page.waitForSelector('.bonus-counter');row=await inspect();if(!before)check('new bonus text gets its own space at '+viewport.height,!row.overlaps);result.views.push({viewport,notice:row});
  await page.screenshot({path:output+`/${before?'before':'after'}-notice-${viewport.height}.png`});
 }
 await page.setViewportSize({width:1040,height:1460});result.gallery=[];
 for(const stage of [1,2,3]){
  await page.goto(url('gallery','&stage='+stage));await page.waitForFunction(()=>document.querySelectorAll('.qa-cell[data-sprite] .material-hull[data-hull-ready="true"]').length===20);
  const rows=await page.locator('.qa-cell[data-sprite]').evaluateAll(cells=>cells.map(cell=>{const bar=cell.querySelector('.health-bar').getBoundingClientRect(),jets=[...cell.querySelectorAll('.exhaust')].map(x=>x.getBoundingClientRect());return{sprite:Number(cell.dataset.sprite),width:bar.width,height:bar.height,gap:Math.min(...jets.map(j=>j.top))-bar.bottom};}));
  check('stage '+stage+': all twenty hulls have actual loaded plumes',rows.length===20);
  if(!before)check('stage '+stage+': every bar clears maximum plumes including bank',rows.every(r=>r.gap>=4));
  result.gallery.push({stage,rows});
  if(stage===1)result.bossBars=await page.locator('.qa-cell[data-boss]').evaluateAll(cells=>cells.map(cell=>[...cell.querySelectorAll('[role=progressbar]')].map(n=>{const a=n.closest('.sector-boss').getBoundingClientRect(),r=n.getBoundingClientRect(),s=getComputedStyle(n);return{width:r.width,height:r.height,x:r.left-a.left,y:r.top-a.top,border:s.borderWidth};})));
  await page.screenshot({path:output+`/${before?'before':'after'}-gallery-${stage}.png`,fullPage:true});
 }
 if(!before){const old=JSON.parse(readFileSync(output+'/baseline.json','utf8'));check('all boss indicators keep exact published geometry',JSON.stringify(old.bossBars)===JSON.stringify(result.bossBars));check('ordinary bars retain their released compact sizes',result.gallery.every((g,i)=>g.rows.every((r,j)=>r.width===old.gallery[i].rows[j].width&&r.height===old.gallery[i].rows[j].height)));}
 check('no page errors',result.errors.length===0);result.complete=true;
}finally{try{unlinkSync(root+'/frontend/cockpit-indicators-local.html');}catch{}writeFileSync(output+`/${before?'baseline':'native'}.json`,JSON.stringify(result,null,2)+'\n');await browser?.close();await server?.close();console.log(JSON.stringify({complete:result.complete,checks:result.checks.length,errors:result.errors}));}
