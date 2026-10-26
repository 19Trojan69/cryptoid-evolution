// Real WPE rendering and DOM controls with local fixtures; never real accounts.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFileSync,mkdirSync,readFileSync,unlinkSync} from 'node:fs';
const root=resolve(new URL('../..',import.meta.url).pathname),require=createRequire(resolve(root,'frontend/package.json'));
const {createServer}=require('vite'),{webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output=resolve(root,'verification/control-center/results');mkdirSync(output,{recursive:true});
const result={localOnly:true,syntheticFixtures:true,physicalDevice:false,historicalWhiteScreenFixed:false,checks:[],errors:[],complete:false};
let server,browser;
const check=(label,value)=>{assert.ok(value,label);result.checks.push(label);};
try{
 const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Local component verification</title></head><body><div id="root"></div><script type="module" src="/@fs/'+root+'/verification/mobile-cockpit/preview.tsx"></script></body></html>';
 writeFileSync(resolve(root,'frontend/control-center-local.html'),html);
 server=await createServer({root:resolve(root,'frontend'),resolve:{dedupe:['react','react-dom']},server:{host:'127.0.0.1',port:4186,strictPort:true,fs:{allow:[root,resolve(root,'frontend/node_modules')]}},logLevel:'error'});server.middlewares.use((req,res,next)=>{
   if (!/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(req.url||'')) return next();
   const bytes=readFileSync(resolve(root,'verification/white-screen-fonts',req.url.split('/').at(-1)));
   res.setHeader('Content-Type','font/ttf');res.end(bytes);
 });await server.listen();
 const base=resolve(root,'verification/native-browsers/webkit-2336/minibrowser-wpe'),libs=resolve(root,'verification/webkit-libs/usr/lib/x86_64-linux-gnu');
 browser=await webkit.launch({headless:true,executablePath:base+'/bin/MiniBrowser',env:{...process.env,WEBKIT_EXEC_PATH:base+'/bin',WEBKIT_INJECTED_BUNDLE_PATH:base+'/lib',WEBKIT_INSPECTOR_RESOURCES_PATH:base+'/share',LD_LIBRARY_PATH:`${base}/lib:${base}/sys/lib:${libs}`,GST_PLUGIN_SYSTEM_PATH_1_0:libs+'/gstreamer-1.0',GST_PLUGIN_SCANNER:libs+'/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner',GST_REGISTRY_1_0:resolve(root,'verification/webkit-native-audio-registry.bin')}});
 result.engine=browser.version();
 for (const size of [{width:393,height:628},{width:768,height:1024},{width:1280,height:800}]) {
  const context=await browser.newContext({viewport:size,locale:'de-AT',hasTouch:size.width<1000});
  await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:readFileSync(resolve(root,'verification/white-screen-fonts/fonts.css'),'utf8').replaceAll('/font-mirror/','http://127.0.0.1:4186/font-mirror/')});if(url.hostname==='127.0.0.1')return route.continue();await route.abort();});
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push({size,message:e.message}));
  const url='http://127.0.0.1:4186/control-center-local.html?view=settings';
  await page.goto(url);await page.getByRole('heading',{name:'Kontrollzentrum',exact:true}).waitFor();
  const nav=page.getByRole('navigation',{name:'Kontrollzentrum'});
  check(`${size.width}: four overview tiles`,await nav.getByRole('button').count()===4);
  check(`${size.width}: no hidden controls exposed`,await page.getByRole('button',{name:'Linkshänder-Steuerung',exact:true}).count()===0);
  check(`${size.width}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:resolve(output,`overview-${size.width}.png`)});
  await nav.getByRole('button',{name:/Musik & Effekte/}).click();
  await page.locator('#preview-music-volume').fill('37');await page.locator('#preview-effects-volume').fill('68');
  check(`${size.width}: music and effects callbacks`,await page.locator('output[for="preview-music-volume"]').textContent()==='37%'&&await page.locator('output[for="preview-effects-volume"]').textContent()==='68%');
  await page.getByRole('button',{name:'← Alle Einstellungen'}).click();
  check(`${size.width}: current audio summary`,await nav.getByRole('button',{name:/Musik & Effekte.*37%.*68%/}).isVisible());
  await nav.getByRole('button',{name:/Steuerung/}).click();
  await page.getByRole('button',{name:'Linkshänder-Steuerung',exact:true}).click();
  await page.reload();await nav.getByRole('button',{name:/Steuerung.*Linkshändig/}).click();
  check(`${size.width}: saved hand retained`,await page.getByRole('button',{name:'Linkshänder-Steuerung',exact:true}).getAttribute('aria-pressed')==='true');
  const modal=page.locator('.pause-settings-modal');
  await modal.evaluate(el=>{el.scrollTop=el.scrollHeight;});
  check(`${size.width}: inner menu scrolls with route fixed`,await modal.evaluate(el=>el.scrollHeight<=el.clientHeight||el.scrollTop>0)&&await page.evaluate(()=>scrollY===0&&getComputedStyle(document.body).position==='fixed'));
  await page.screenshot({path:resolve(output,`controls-${size.width}.png`)});
  await page.getByRole('button',{name:'← Alle Einstellungen'}).click();await nav.getByRole('button',{name:/Anzeige/}).click();
  check(`${size.width}: fullscreen shortcut visibility`,await page.getByRole('button',{name:'Vollbild',exact:true}).isVisible()===(size.width<701));
  const effects=page.getByRole('button',{name:'Standardeffekte',exact:true});await effects.click();
  check(`${size.width}: display preference saved`,await page.evaluate(()=>localStorage.getItem('cryptoid_reduced_effects')==='1'&&document.documentElement.dataset.motion==='reduced'));
  await page.getByRole('button',{name:'← Alle Einstellungen'}).click();await nav.getByRole('button',{name:/Sprache/}).click();await page.locator('.language-change').click();await page.locator('.language-picker-row').filter({hasText:'English'}).click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  check(`${size.width}: language applies`,await page.getByRole('heading',{name:'Control Center',exact:true}).isVisible());
  await page.getByRole('button',{name:'← All settings'}).click();
  await page.getByRole('button',{name:/Resume/}).click();check(`${size.width}: resume callback once`,await page.locator('#fixture-continued').textContent()==='1');
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:1280,height:800},locale:'de-AT',hasTouch:true,reducedMotion:'reduce'});
 await context.addInitScript(()=>{window.Pi={init(){},getPiHostAppInfo:()=>Promise.resolve({hostApp:'browser'})};window.testFullscreenCalls=0;Element.prototype.requestFullscreen=()=>{window.testFullscreenCalls++;return Promise.resolve();};});
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname==='127.0.0.1'){if(u.pathname.startsWith('/api/'))return route.fulfill({contentType:'application/json',body:JSON.stringify(u.pathname.endsWith('/user/me')?{user:null,canAdmin:false,adminMode:false}:{})});return route.continue();}return route.abort();});
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push({actualGame:true,message:e.message}));await page.goto('http://127.0.0.1:4186/game');await page.getByRole('button',{name:'Pause',exact:true}).waitFor({timeout:45000});
 check('actual game has no fullscreen shortcut',await page.locator('.game-fullscreen-control').count()===0);
 await page.mouse.click(180,620);await page.mouse.click(200,610);await page.mouse.wheel(0,-400);
 check('steering does not request fullscreen repeatedly',await page.evaluate(()=>window.testFullscreenCalls===0));
 check('native wheel does not scroll or pause the game',await page.evaluate(()=>scrollY===0&&!document.querySelector('.pause-settings-overlay')));
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.locator('.pause-settings-overlay').waitFor();check('genuine blur still pauses',await page.locator('.pause-settings-overlay').isVisible());
 await page.getByRole('heading',{name:'Kontrollzentrum',exact:true}).waitFor();check('actual pause includes control center',await page.locator('.control-center-tile').count()===4);
 await page.screenshot({path:resolve(output,'pause-original-game.png')});await page.locator('.pause-resume-button').click();await page.locator('.pause-settings-overlay').waitFor({state:'hidden'});check('explicit Resume works',await page.locator('.pause-settings-overlay').count()===0);await context.close();
 check('no uncaught page errors',result.errors.length===0);result.complete=true;
} catch(error) {result.failure=String(error.stack||error);process.exitCode=1;}
finally {if(browser)await browser.close();if(server)await server.close();try{unlinkSync(resolve(root,'frontend/control-center-local.html'));}catch{}writeFileSync(resolve(output,'native.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));}
