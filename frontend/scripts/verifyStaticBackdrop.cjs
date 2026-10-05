// Isolated visual verification. No hooks are shipped in the game bundle.
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const fs=require('node:fs'),os=require('node:os');
const repo=path.resolve(__dirname,'../..');
(async()=>{
 const {createServer}=await import(path.join(repo,'frontend/node_modules/vite/dist/node/index.js'));
 const fixture=`
  import React from 'react';import {createRoot} from 'react-dom/client';
  import Starfield from '/src/pages/Starfield.tsx';import SectorBackdrop from '/src/pages/SectorBackdrop.tsx';import '/src/index.css';
  const root=createRoot(document.getElementById('root'));let props={sector:10,paused:false,player:{x:.5,y:.8}};
  window.__backgroundQA=patch=>{props={...props,...patch};root.render(React.createElement('div',{className:'game-field',style:{position:'fixed',inset:0}},React.createElement(Starfield,{...props,showNebula:true}),React.createElement(SectorBackdrop,props)));};window.__backgroundQA({});
 `;
 const server=await createServer({root:path.join(repo,'frontend'),cacheDir:fs.mkdtempSync(path.join(os.tmpdir(),'cryptoid-background-vite-')),logLevel:'error',optimizeDeps:{include:['react','react-dom/client']},server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'backdrop-fixture',resolveId(id){if(id==='/qa-main.js')return '\0backdrop-fixture';},load(id){if(id==='\0backdrop-fixture')return fixture;}}]});
 await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
 const browser=await chromium.launch({executablePath:process.env.CRYPTOID_CHROMIUM||path.resolve(repo,'../chromium'),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const errors=[],results=[];
 try{
  for(const viewport of [{width:390,height:844},{width:1280,height:800}]){
   const context=await browser.newContext({viewport});const external=[];
   await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    // The game's separate font import is stubbed; Earth itself must be local.
    if(url.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:''});
    if(url.origin!==origin){external.push(url.origin);return route.abort();}
    if(url.pathname==='/qa-backdrop'){
      const html=await server.transformIndexHtml('/qa-backdrop', '<html><head></head><body><div id="root"></div><script type="module" src="/qa-main.js"></script></body></html>');
      return route.fulfill({contentType:'text/html',body:html.replace(/<script type="module" src="\/@vite\/client"><\/script>/,'')});
    }
    return route.continue();
   });
   const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
   page.on('console',m=>{if(m.type()==='error')console.error(m.text());});
   await page.goto(origin+'/qa-backdrop');
   try { await page.waitForSelector('.nebula-cloud'); }
   catch(error){await page.screenshot({path:path.resolve(repo,'../static-backdrop-error.png')});console.error(await page.locator('body').innerText());throw error;}
   assert.equal(await page.locator('vite-error-overlay').count(),0);
   await page.waitForFunction(()=>document.querySelector('.earth-globe-image')?.naturalWidth>0);
   assert.equal(await page.locator('canvas').count(),0);
   assert.equal(await page.locator('.shooting-star').count(),1);
   const before=await page.locator('.nebula-cloud').evaluate(e=>{const s=getComputedStyle(e);return {rect:e.getBoundingClientRect().toJSON(),transform:s.transform,animation:s.animationName,color:s.backgroundImage};});
   assert.equal(before.animation,'none');assert.equal(before.transform,'none');
   const earthBefore=await page.locator('.planet-earth').boundingBox();
   await page.evaluate(()=>window.__backgroundQA({player:{x:.1,y:.3}}));
   await page.waitForTimeout(200);
   const after=await page.locator('.nebula-cloud').evaluate(e=>{const s=getComputedStyle(e);return {rect:e.getBoundingClientRect().toJSON(),transform:s.transform,animation:s.animationName,color:s.backgroundImage};});
   assert.deepEqual(after,before,'moving the player does not move or recolor the nebula');
   assert.deepEqual(await page.locator('.planet-earth').boundingBox(),earthBefore,'earth stays fixed');
   const meteor=await page.locator('.shooting-star').evaluate(e=>{
    const a=e.getAnimations()[0];if(!a)throw Error('Missing meteor animation');a.pause();
    const states=[0,28000,29100,30000].map(t=>{a.currentTime=t;return {t,opacity:getComputedStyle(e).opacity};});
    return {duration:a.effect.getTiming().duration,states};
   });
   assert.equal(meteor.duration,30000);assert.equal(meteor.states[0].opacity,'0');assert.equal(meteor.states[1].opacity,'0');assert.ok(Number(meteor.states[2].opacity)>.7);assert.equal(meteor.states[3].opacity,'0');
   await page.evaluate(()=>window.__backgroundQA({paused:true}));await page.waitForTimeout(100);
   assert.equal(await page.locator('.shooting-star').evaluate(e=>getComputedStyle(e).animationPlayState),'paused');
   await page.emulateMedia({reducedMotion:'reduce'});
   assert.equal(await page.locator('.shooting-star').evaluate(e=>getComputedStyle(e).display),'none');
   assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
   await page.screenshot({path:path.resolve(repo,`../static-backdrop-${viewport.width}.png`)});
   results.push({viewport,earth:'local static image',nebula:'fixed, six colors',meteor,errors:[]});
   await context.close();
  }
  console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
