// Real WPE rendering and DOM controls with local fixtures; never real accounts.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFileSync,mkdirSync,readFileSync,unlinkSync} from 'node:fs';
const root=resolve(new URL('../..',import.meta.url).pathname),require=createRequire(resolve(root,'frontend/package.json'));
const {createServer}=require('vite'),{webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output=resolve(root,'verification/mobile-cockpit/results');mkdirSync(output,{recursive:true});
const result={localOnly:true,syntheticFixtures:true,physicalDevice:false,historicalWhiteScreenFixed:false,checks:[],errors:[],complete:false};
let server,browser;
const check=(label,value)=>{assert.ok(value,label);result.checks.push(label);};
try{
 const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Local component verification</title></head><body><div id="root"></div><script type="module" src="/@fs/'+root+'/verification/mobile-cockpit/preview.tsx"></script></body></html>';
 writeFileSync(resolve(root,'frontend/mobile-cockpit-local.html'),html);
 server=await createServer({root:resolve(root,'frontend'),resolve:{dedupe:['react','react-dom']},server:{host:'127.0.0.1',port:4186,strictPort:true,fs:{allow:[root,resolve(root,'frontend/node_modules')]}},logLevel:'error'});server.middlewares.use((req,res,next)=>{
   if (!/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(req.url||'')) return next();
   const bytes=readFileSync(resolve(root,'verification/white-screen-fonts',req.url.split('/').at(-1)));
   res.setHeader('Content-Type','font/ttf');res.end(bytes);
 });await server.listen();
 const base=resolve(root,'verification/native-browsers/webkit-2336/minibrowser-wpe'),libs=resolve(root,'verification/webkit-libs/usr/lib/x86_64-linux-gnu');
 browser=await webkit.launch({headless:true,executablePath:base+'/bin/MiniBrowser',env:{...process.env,WEBKIT_EXEC_PATH:base+'/bin',WEBKIT_INJECTED_BUNDLE_PATH:base+'/lib',WEBKIT_INSPECTOR_RESOURCES_PATH:base+'/share',LD_LIBRARY_PATH:`${base}/lib:${base}/sys/lib:${libs}`,GST_PLUGIN_SYSTEM_PATH_1_0:libs+'/gstreamer-1.0',GST_PLUGIN_SCANNER:libs+'/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner',GST_REGISTRY_1_0:resolve(root,'verification/webkit-native-audio-registry.bin')}});
 result.engine=browser.version();
 for(const size of [{width:393,height:744},{width:393,height:628},{width:768,height:1024}]){
  const context=await browser.newContext({viewport:size,locale:'de-AT',hasTouch:true,reducedMotion:'reduce'});
  await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:readFileSync(resolve(root,'verification/white-screen-fonts/fonts.css'),'utf8').replaceAll('/font-mirror/','http://127.0.0.1:4186/font-mirror/')});if(url.hostname==='127.0.0.1')return route.continue();await route.abort();});
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push({size,message:e.message}));
  const local='http://127.0.0.1:4186/mobile-cockpit-local.html';
  await page.goto(local+'?view=access');await page.getByRole('status').filter({hasText:'Anmeldung'}).waitFor();
  check(`${size.width}x${size.height} access lock`,await page.evaluate(()=>getComputedStyle(document.body).position==='fixed'&&document.documentElement.scrollHeight<=innerHeight));
  await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:resolve(output,`access-${size.width}x${size.height}.png`)});
  await page.goto(local+'?view=level');const panel=page.locator('.level-completion');await panel.waitFor();
  await page.getByRole('button',{name:'Spiel fortsetzen'}).waitFor();
  check(`${size.width}x${size.height} device locale`,await page.evaluate(()=>document.documentElement.lang==='de'&&!localStorage.getItem('cryptoid_language')));
  check(`${size.width}x${size.height} bonus heart present`,await page.locator('.level-completion-heart').isVisible());
  const geometry=await panel.evaluate(el=>{const button=el.querySelector('footer button:last-child').getBoundingClientRect(),box=el.getBoundingClientRect();return {scroll:el.scrollHeight,client:el.clientHeight,top:box.top,bottom:box.bottom,buttonTop:button.top,buttonBottom:button.bottom,screen:innerHeight,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth};});
  const chain=await panel.evaluate(el=>{const box=el.querySelector('.blockchain-progress').getBoundingClientRect();return [...el.querySelectorAll('.blockchain-node')].every(node=>{const r=node.getBoundingClientRect();return r.top>=box.top&&r.bottom<=box.bottom;});});check(`${size.width}x${size.height} all nine chain blocks fit`,chain);result.checks.push({size,geometry});check(`${size.width}x${size.height} all statistics and Continue fit`,geometry.scroll<=geometry.client+1&&geometry.buttonBottom<=size.height&&geometry.top>=0&&!geometry.overflow);
  await page.screenshot({path:resolve(output,`level-${size.width}x${size.height}.png`)});
  if(size.height===744){
    const button=page.getByRole('button',{name:'Spiel fortsetzen'});check('Continue initially disabled',await button.isDisabled());await button.waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('.level-completion footer button:last-child').disabled,{},{timeout:18000});await button.click();check('Continue callback once',await page.locator('#fixture-continued').textContent()==='1');
  }
  await page.goto(local+'?view=level&heart=0');await panel.waitFor();check(`${size.width}x${size.height} no unearned heart`,await page.locator('.level-completion-heart').count()===0);
  await page.goto(local+'?view=settings');await page.getByRole('heading',{name:'Eine kurze Verschnaufpause.'}).waitFor();
  if(size.width<600){
    const controls=page.getByRole('button',{name:/Steuerung.*Rechtshändig/});await controls.waitFor();await controls.click();
  }
  const right=page.getByRole('button',{name:'Rechtshänder-Steuerung',exact:true});check(`${size.width}x${size.height} right default`,await right.getAttribute('aria-pressed')==='true');
  await page.getByRole('button',{name:'Linkshänder-Steuerung',exact:true}).click();await page.reload();
  if(size.width<600)await page.getByRole('button',{name:/Steuerung.*Linkshändig/}).click();
  check(`${size.width}x${size.height} saved manual hand`,await page.getByRole('button',{name:'Linkshänder-Steuerung',exact:true}).getAttribute('aria-pressed')==='true');
  const modal=page.locator('.pause-settings-modal');await modal.evaluate(el=>{el.scrollTop=el.scrollHeight;});
  check(`${size.width}x${size.height} settings scroll without page motion`,await page.evaluate(()=>scrollY===0&&getComputedStyle(document.body).position==='fixed'));
  await page.screenshot({path:resolve(output,`settings-${size.width}x${size.height}.png`)});
  if(size.height===744){
    await page.locator('.mobile-settings-back').click();await page.getByRole('button',{name:/Sprache.*Gerätesprache/}).click();await page.locator('.language-change').click();await page.locator('.language-picker-row').filter({hasText:'English'}).click();
    await page.waitForFunction(()=>document.documentElement.lang==='en');await page.reload();await page.waitForFunction(()=>document.documentElement.lang==='en');check('manual language survives reload',await page.evaluate(()=>document.documentElement.lang==='en'&&localStorage.getItem('cryptoid_language')==='en'));
    await page.getByRole('button',{name:/Language.*English/}).click();await page.locator('.language-change').click();await page.locator('.language-picker-row').filter({hasText:'Automatic (device language)'}).click();await page.waitForFunction(()=>document.documentElement.lang==='de');check('automatic choice returns to device language',await page.evaluate(()=>!localStorage.getItem('cryptoid_language')));
  }
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:393,height:744},locale:'de-AT',hasTouch:true,reducedMotion:'reduce'});
 await context.addInitScript(()=>{window.Pi={init(){},getPiHostAppInfo:()=>Promise.resolve({hostApp:'browser'})};window.testFullscreenCalls=0;Element.prototype.requestFullscreen=()=>{window.testFullscreenCalls++;return Promise.resolve();};});
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname==='127.0.0.1'){if(u.pathname.startsWith('/api/'))return route.fulfill({contentType:'application/json',body:JSON.stringify(u.pathname.endsWith('/user/me')?{user:null,canAdmin:false,adminMode:false}:{})});return route.continue();}return route.abort();});
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push({actualGame:true,message:e.message}));await page.goto('http://127.0.0.1:4186/game');await page.getByRole('button',{name:'Pause',exact:true}).waitFor({timeout:45000});
 await page.mouse.click(180,620);await page.mouse.click(200,610);await page.mouse.wheel(0,-400);
 check('steering does not request fullscreen repeatedly',await page.evaluate(()=>window.testFullscreenCalls===0));
 check('native wheel does not scroll or pause the game',await page.evaluate(()=>scrollY===0&&!document.querySelector('.pause-settings-overlay')));
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.locator('.pause-settings-overlay').waitFor();check('genuine blur still pauses',await page.locator('.pause-settings-overlay').isVisible());
 await page.screenshot({path:resolve(output,'pause-original-game.png')});await page.locator('.pause-resume-button').click();await page.locator('.pause-settings-overlay').waitFor({state:'hidden'});check('explicit Resume works',await page.locator('.pause-settings-overlay').count()===0);await context.close();
 check('no page errors',result.errors.length===0);result.complete=true;
}catch(error){result.failure={message:error.message,stack:error.stack};throw error;}
finally{writeFileSync(resolve(output,'native.json'),JSON.stringify(result,null,2));await browser?.close();await server?.close();try{unlinkSync(resolve(root,'frontend/mobile-cockpit-local.html'));}catch{}console.log(JSON.stringify({complete:result.complete,checks:result.checks.length,failure:result.failure?.message}));}
