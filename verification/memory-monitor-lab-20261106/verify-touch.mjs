import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {createReadStream,existsSync,mkdirSync,statSync,writeFileSync} from 'node:fs';
import {extname,resolve} from 'node:path';
const directory=new URL('.',import.meta.url).pathname,out=directory+'results';mkdirSync(out,{recursive:true});
const require=createRequire(new URL('../transition-motion-20261106/package.json',import.meta.url)),pw=require('playwright');
const engine=process.argv[2];assert.ok(['chromium','webkit'].includes(engine));
const site=resolve(directory,'site'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.woff2':'font/woff2'};
const server=createServer((req,res)=>{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=resolve(site,'.'+path);if(!file.startsWith(site+'/')&&file!==site){res.writeHead(403).end();return;}if(!existsSync(file)||statSync(file).isDirectory())file=site+'/index.html';res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');createReadStream(file).pipe(res);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await pw[engine].launch({headless:true});let page,context;
const result={engine,complete:false,physicalPhone:false,piBrowser:false,whiteScreenFixed:false,publicDeploymentChanged:false,cases:[]};
try{
 for(const scene of ['normal','turrets','reactor'])for(const disableGuard of [false,true]){
  context=await browser.newContext({viewport:{width:390,height:760},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{
   const key='cryptoid_tap_test_boots';const boots=Number(sessionStorage.getItem(key)||0)+1;sessionStorage.setItem(key,String(boots));
   window.__tapTest={boots,guardListeners:[],events:[]};
   const nativeAdd=EventTarget.prototype.addEventListener;
   EventTarget.prototype.addEventListener=function(type,listener,options){
    if(this instanceof Element&&this.classList.contains('game-field')&&['touchstart','touchend'].includes(type)&&options?.capture===true&&options?.passive===false)window.__tapTest.guardListeners.push({target:this,type,listener});
    return nativeAdd.call(this,type,listener,options);
   };
   window.__tapTest.restoreRegistration=()=>{EventTarget.prototype.addEventListener=nativeAdd;};
   for(const type of ['touchstart','touchend','touchcancel'])window.addEventListener(type,event=>{window.__tapTest.events.push({type,trusted:event.isTrusted,prevented:event.defaultPrevented,at:performance.now()});if(window.__tapTest.events.length>128)window.__tapTest.events.shift();},{passive:true});
  });
  const errors=[],unexpected=[],navigations=[];
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===origin||['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))return route.continue();unexpected.push(u.origin);return route.abort();});
  page=await context.newPage();page.setDefaultTimeout(45000);
  page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('page-crash'));page.on('framenavigated',f=>{if(f===page.mainFrame())navigations.push(f.url());});
  await page.goto(origin,{waitUntil:'domcontentloaded'});await page.getByLabel('Startpunkt',{exact:true}).selectOption(scene);await page.getByLabel('Testschutz gegen Lebensverlust',{exact:true}).check();
  await page.getByRole('button',{name:'Test vorbereiten',exact:true}).click();await page.getByRole('button',{name:'Testspiel starten',exact:true}).click();
  await page.waitForFunction(()=>window.__cryptoidLabRead?.().status==='paused');
  const listeners=await page.evaluate(disable=>{const t=window.__tapTest;const live=t.guardListeners.filter(x=>x.target.isConnected);t.restoreRegistration();if(disable)for(const x of live)x.target.removeEventListener(x.type,x.listener,true);return live.map(x=>x.type);},disableGuard);
  assert.deepEqual(listeners.sort(),['touchend','touchstart'],'Exactly the two existing field guard listeners must be identified; no input/audio listeners removed');
  await page.locator('.pause-resume-button').click();await page.waitForFunction(()=>window.__cryptoidLabRead?.().status==='playing');
  if(scene==='normal')await page.waitForFunction(()=>window.__cryptoidLabRead?.().enemies>0);else await page.waitForFunction(()=>window.__cryptoidLabRead?.().encounter==='boss-fight');
  await page.evaluate(()=>{window.__tapTest.events=[];});
  const before=await page.evaluate(()=>({boots:window.__tapTest.boots,active:window.__cryptoidLabRead().activeMs,scale:visualViewport?.scale??1})),navigationCount=navigations.length;
  // Trusted browser touchscreen events; no DOM-dispatched synthetic touch events.
  for(let round=0;round<2;round++)for(const [x,y]of [[195,480],[265,580],[110,650]]){
   await page.touchscreen.tap(x,y);await page.waitForTimeout(65);await page.touchscreen.tap(x,y);await page.waitForTimeout(430);
  }
  const after=await page.evaluate(()=>({boots:window.__tapTest.boots,active:window.__cryptoidLabRead?.().activeMs,status:window.__cryptoidLabRead?.().status,mode:window.__cryptoidLabRead?.().rulesMode,scale:visualViewport?.scale??1,events:window.__tapTest.events}));
  assert.equal(after.boots,before.boots);assert.equal(page.url(),origin+'/game');assert.equal(navigations.length,navigationCount,'Double tapping must not cause history or document navigation');assert.equal(after.status,'playing');assert.equal(after.mode,'current');assert.ok(after.active>before.active+1500);assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
  const starts=after.events.filter(e=>e.type==='touchstart'),ends=after.events.filter(e=>e.type==='touchend'),prevented=after.events.filter(e=>e.prevented);
  assert.equal(starts.length,12);assert.equal(ends.length,12);assert.ok(after.events.every(e=>e.trusted));
  if(!disableGuard)assert.ok(prevented.length>=6,'The normal variant must actually exercise double-tap prevention');else assert.equal(prevented.length,0,'The comparison must genuinely bypass the guard');
  // Positive control: a real reload must be distinguished from the taps.
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Speicherlabor',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__tapTest.boots),before.boots+1);assert.equal(await page.locator('.game-shell').count(),0);
  result.cases.push({scene,guard:disableGuard?'removed-in-test-only':'current',trustedTaps:starts.length,preventedEvents:prevented.length,noNavigation:true,noRestart:true,noPageErrors:true,activeTimeAdvanced:true,scaleBefore:before.scale,scaleAfter:after.scale,reloadControlDetected:true});
  await context.close();context=null;page=null;
 }
 result.complete=true;
}catch(error){result.failure={message:error.message,stack:error.stack};if(page){result.visibleText=await page.locator('body').innerText().catch(()=>null);await page.screenshot({path:out+'/'+engine+'-touch-failed.png'}).catch(()=>{});}process.exitCode=1;}
finally{writeFileSync(out+'/'+engine+'-touch.json',JSON.stringify(result,null,2)+'\n');console.log('TAP_COMPARISON '+JSON.stringify(result));await browser.close();await new Promise(r=>server.close(r));}
