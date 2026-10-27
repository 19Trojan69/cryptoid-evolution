// Actual home/shop DOM with original art/fonts and isolated local handlers.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const root=resolve(new URL('../..',import.meta.url).pathname),require=createRequire(root+'/frontend/package.json');
const {createServer}=require('vite'),{chromium}=require(process.env.CRYPTOID_PLAYWRIGHT_MODULE||process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const backendRequire=createRequire(root+'/backend/src/handlers/progress.test.mjs');
const harnessSource=readFileSync(root+'/backend/src/handlers/progress.test.mjs','utf8');
const harness=new Function('require',harnessSource.slice(harnessSource.indexOf('const get ='),harnessSource.indexOf('const snapshot ='))+'\nreturn harness;')(backendRequire);
const {emptyPlayerSave}=backendRequire('../../build/playerSave.js');
const base='a718b4c60dc93ab022acffe6bacfb6e4fc9a688f',output=root+'/verification/home-play-shop-20261027/results';mkdirSync(output,{recursive:true});
const result={base,localOnly:true,actualHomeAndShop:true,originalArtAndFonts:true,realIsolatedHandlers:true,controlledSdkAndClock:true,physicalDevice:false,checks:[],cases:[],errors:[],complete:false};
const check=(name,value)=>{assert.ok(value,name);result.checks.push(name);console.log(name);};
let browser;const servers=[];
async function serverFor(baseline){
 const server=await createServer({root:root+'/frontend',cacheDir:output+(baseline?'/vite-baseline':'/vite-candidate'),logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false,fs:{allow:[root]}},plugins:[{name:'isolated-home-comparison',enforce:'pre',transform(code,id){
  if(!baseline)return;
  const file=id.split('?')[0];for(const name of ['CinematicHome.tsx','cinematicHome.css'])if(file.endsWith('/'+name))return execFileSync('git',['show',base+':frontend/src/pages/'+name],{cwd:root,encoding:'utf8'});
 },transformIndexHtml:{order:'post',handler:html=>html.replace(/appNetwork:\s*"[^"]*"/,'appNetwork: "testnet"').replace(/backendURL:\s*"[^"]*"/,'backendURL: "/api"')}}]});
 server.middlewares.use((req,res,next)=>{if(!/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(req.url||''))return next();res.setHeader('Content-Type','font/ttf');res.end(readFileSync(root+'/verification/white-screen-fonts/'+req.url.split('/').at(-1)));});
 await server.listen();servers.push(server);return 'http://127.0.0.1:'+server.httpServer.address().port;
}
async function pageFor(origin,scenario){
 const h=harness();await h.call('progress','/me',null,{method:'GET'});Object.assign(h.profile(),{...emptyPlayerSave(),version:1,legacyImported:true,cardReveals:['grey-scout-1']});
 const context=await browser.newContext({viewport:{width:scenario.width,height:scenario.height},hasTouch:true,locale:scenario.locale==='de'?'de-AT':scenario.locale,reducedMotion:scenario.motion||'reduce'});
 await context.addInitScript(({locale,signedIn})=>{window.__homeAuthCalls=0;window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'web'}),authenticate:async()=>{window.__homeAuthCalls++;throw Error('Unrequested local sign-in');}};localStorage.setItem('cryptoid_home_music','off');localStorage.setItem('cryptoid_language',locale);if(signedIn)localStorage.setItem('cryptoid_pi_session','1');localStorage.setItem('cryptoid_card_reveals_v1_testnet_pilot-a',JSON.stringify(['grey-scout-1']));},scenario);
 const requests=[];
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:readFileSync(root+'/verification/white-screen-fonts/fonts.css','utf8').replaceAll('/font-mirror/',origin+'/font-mirror/')});
  if(u.origin!==origin)return route.fulfill({status:200,contentType:'application/javascript',body:''});
  if(!u.pathname.startsWith('/api/'))return route.continue();
  const [group,...parts]=u.pathname.slice(5).split('/'),endpoint='/'+parts.join('/'),body=route.request().postDataJSON();let response;
  if(group==='user')response={code:200,body:{user:scenario.signedIn?{uid:'pilot-a',username:'Local verification'}:null,canAdmin:false,adminMode:false}};
  else if(group==='usage')response={code:204};
  else if(['progress','hangar','rewards','leaderboard'].includes(group))response=await h.call(group,endpoint,body,{method:route.request().method()});
  else response={code:200,body:{}};
  requests.push({method:route.request().method(),path:u.pathname,status:response.code,error:response.body?.error});
  return route.fulfill({status:response.code,contentType:'application/json',body:response.code===204?'':JSON.stringify(response.body)});
 });
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));await page.clock.install();await page.goto(origin+'/');await page.locator('.cinematic-play').waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('.cinematic-play').disabled);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));await page.evaluate(()=>document.fonts.ready);return{page,context,requests};
}
const geometry=page=>page.evaluate(()=>{
 const rect=node=>{const b=node.getBoundingClientRect();return{left:b.left,top:b.top+scrollY,right:b.right,bottom:b.bottom+scrollY,width:b.width,height:b.height,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth};};
 const play=document.querySelector('.cinematic-play'),shop=document.querySelector('.cinematic-shop');return{play:rect(play),shop:shop?rect(shop):null,career:rect(document.querySelector('.cinematic-career')),overflow:document.documentElement.scrollWidth>innerWidth+1,playText:play.innerText,shopText:shop?.innerText,focusable:shop?.type==='button'};
});
try{
 browser=await chromium.launch({headless:true});result.engine=browser.version();const baselineOrigin=await serverFor(true),candidateOrigin=await serverFor(false);
 const locales=['en','de','es','fr','pt','it','pl','tr','ru','hr','cs','sk','hu','ro','sr','uk','th','zh','vi'];
 const scenarios=[...locales.map(locale=>({width:320,height:568,locale,name:'compact-'+locale,open:locale==='de'})),
  {width:393,height:744,locale:'de',signedIn:true,open:true,name:'phone-signed-in'},
  {width:430,height:825,locale:'de',name:'phone-large'},
  {width:768,height:1024,locale:'th',open:true,name:'tablet-thai'},
  {width:1363,height:768,locale:'en',open:true,play:true,motion:'no-preference',name:'desktop'},
  {width:760,height:900,locale:'fr',name:'tablet-breakpoint'},
  {width:900,height:600,locale:'de',name:'laptop-narrow'},
  {width:844,height:390,locale:'en',name:'landscape'}];
 const baselines=new Map();
 for(const scenario of scenarios){
  const key=scenario.width+'x'+scenario.height+':'+scenario.locale+':'+Boolean(scenario.signedIn);
  if(!baselines.has(key)){
   const b=await pageFor(baselineOrigin,scenario);const view=await geometry(b.page);baselines.set(key,view);await b.context.close();
  }
  const {page,context,requests}=await pageFor(candidateOrigin,scenario);const view=await geometry(page),before=baselines.get(key);result.lastView={scenario,view,before};
  check(scenario.name+': shop is exactly half the play width in one row',view.shop&&Math.abs(view.play.width/view.shop.width-2)<.025&&Math.abs(view.play.top-view.shop.top)<1);
  check(scenario.name+': both buttons retain the original play height',Math.abs(view.play.height-view.shop.height)<1&&Math.abs(view.play.height-before.play.height)<1);
  const gap=view.shop.left-view.play.right;check(scenario.name+': visible spacing and no text/page overflow',gap>=15.5&&gap<=22.5&&!view.overflow&&view.play.scrollWidth<=view.play.clientWidth+1&&view.shop.scrollWidth<=view.shop.clientWidth+1);
  check(scenario.name+': career and remaining layout keep their vertical position',Math.abs(view.career.top-before.career.top)<1&&view.focusable&&!!view.shopText);
  if(['compact-de','phone-signed-in','desktop'].includes(scenario.name))await page.screenshot({path:output+'/'+scenario.name+'.png',fullPage:true,animations:'disabled'});
  if(scenario.name==='desktop'){await page.locator('.cinematic-play').focus();await page.keyboard.press('Tab');check('the paired Shop button follows Play in keyboard focus order',await page.locator('.cinematic-shop').evaluate(node=>node===document.activeElement));}
  if(scenario.open){
   await page.locator('.cinematic-shop').click();await page.locator('.shop-overlay[role="dialog"]').waitFor();
   check(scenario.name+': shop opens the original ship catalogue and pauses the home scene',await page.locator('main[data-shop-area="shop"]').count()===1&&await page.locator('main[data-home-paused="true"]').count()===1&&await page.locator('.ship-selector-shop').count()===1);
   check(scenario.name+': opening it does not request account authentication',await page.evaluate(()=>window.__homeAuthCalls)===0);
   await page.locator('.shop-modal-header .close-button').click();await page.locator('.shop-overlay').waitFor({state:'detached'});
   check(scenario.name+': closing returns to the same paired buttons',await page.locator('main[data-shop-area="home"][data-home-paused="false"]').count()===1&&await page.locator('.cinematic-launch-actions .cinematic-shop').count()===1);
  }
  if(scenario.play){await page.locator('.cinematic-play').click();await page.waitForURL('**/game');check('Play still follows the existing game route',new URL(page.url()).pathname==='/game');}
  check(scenario.name+': no payment, purchase, equip or start action was issued',requests.every(r=>!/(payment|orders|\/hangar\/(start|equip|weapon\/activate)|\/progress\/checkpoint)/.test(r.path)));
  check(scenario.name+': isolated API responses succeed',requests.every(r=>r.status<400));
  result.cases.push({scenario,view,originalPlayHeight:before.play.height,gap});await context.close();
 }
 check('no JavaScript page errors',result.errors.length===0);result.complete=true;
}catch(error){result.failure={message:error.message,stack:error.stack};throw error;}
finally{await browser?.close();for(const server of servers)await server.close();writeFileSync(output+'/native.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({complete:result.complete,checks:result.checks.length,failure:result.failure?.message}));}
