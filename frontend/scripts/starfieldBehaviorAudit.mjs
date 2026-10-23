import { build } from 'esbuild';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFileSync, writeFileSync } from 'node:fs';
import { prepareStarfieldFixture, auditNodeModules, nativeBrowserTools } from './starfieldAuditFixture.mjs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const root = prepareStarfieldFixture();
const require = createRequire(import.meta.url);
const { current, launchBrowser } = nativeBrowserTools(import.meta.url);
const entry = `import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
import Original from './full-scene-source/frontend/src/pages/Starfield';
import Candidate from './candidate-source/Starfield-safe-clip';
import {startCssFramePacing} from './full-scene-source/frontend/src/lib/cssFramePacing';
const stopPacing=startCssFramePacing(document.body);const root=createRoot(document.getElementById('root'));
window.__starsSet=(candidate,paused=true)=>flushSync(()=>root.render(<div className="game-shell"><div className="game-field">{candidate?<Candidate sector={70} player={{x:.5,y:.5}} paused={paused} showNebula/>:<Original sector={70} player={{x:.5,y:.5}} paused={paused} showNebula/>}</div></div>));
window.__starsClear=()=>flushSync(()=>root.render(null));window.__starsStop=()=>{stopPacing();root.unmount()};window.__starsSet(false);`;
const compiled = await build({stdin:{contents:entry,resolveDir:root,loader:'tsx'},bundle:true,write:false,nodePaths:[auditNodeModules],format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const script=compiled.outputFiles[0].contents, css=readFileSync(root+'full-scene-global.css');
const server=createServer((req,res)=>{
  if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(script);return;}
  if(req.url==='/base.css'){res.setHeader('Content-Type','text/css');res.end(css);return;}
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/base.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
});
server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+server.address().port;
const report={localOnly:true,sourceCommit:'19de3e692f75a1c3e2eddf3438acc937c9dcac19',results:[]};
const read=page=>page.evaluate(()=>({
  observers:window.__resizeObservers?.size??0,
  field:document.querySelector('.game-field')?.getBoundingClientRect().toJSON(),
  bounds:document.querySelector('.starfield')?.getBoundingClientRect().toJSON(),
  stars:[...document.querySelectorAll('.starfield-stars')].map(svg=>{
    const m=svg.getScreenCTM();return{class:svg.getAttribute('class'),viewBox:svg.getAttribute('viewBox'),aspect:svg.getAttribute('preserveAspectRatio'),contents:svg.innerHTML,
      matrix:[m.a,m.b,m.c,m.d,m.e,m.f],overflow:getComputedStyle(svg).overflow,
      animation:getComputedStyle(svg).animation,animationName:getComputedStyle(svg).animationName,
      duration:getComputedStyle(svg).animationDuration,playState:getComputedStyle(svg).animationPlayState,
      times:svg.getAnimations().map(a=>a.currentTime),animationStates:svg.getAnimations().map(a=>a.playState)};}),
}));
const freeze=async(page,time=26000)=>{await page.evaluate(time=>{for(const a of document.getAnimations()){a.pause();a.currentTime=time}},time);await page.waitForTimeout(60);};
const waitOverflow=(page,expected)=>page.waitForFunction(expected=>[...document.querySelectorAll('.starfield-stars')].every(s=>getComputedStyle(s).overflow===expected),expected,{timeout:5000});
try{
  for(const engine of ['webkit','chromium']){
    const browser=await launchBrowser(engine);
    const result={engine,checks:[],errors:[]};report.results.push(result);
    const check=(name,details)=>result.checks.push({name,pass:true,details});
    try{
      const context=await browser.newContext({viewport:{width:430,height:825},deviceScaleFactor:3});
      await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
      await context.addInitScript(()=>{
        const Native=window.ResizeObserver;window.__resizeObservers=new Set();
        window.ResizeObserver=new Proxy(Native,{construct(target,args){
          const observer=Reflect.construct(target,args,target);
          const observe=observer.observe.bind(observer),disconnect=observer.disconnect.bind(observer);
          observer.observe=(...args)=>{window.__resizeObservers.add(observer);return observe(...args)};
          observer.disconnect=()=>{window.__resizeObservers.delete(observer);return disconnect()};
          return observer;
        }});
      });
      const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
      await page.goto(origin);await page.waitForFunction(()=>!!window.__starsSet);
      const geometries=[];
      for(const size of [{width:430,height:825},{width:825,height:430},{width:320,height:600},{width:900,height:240},{width:430,height:825}]){
        await page.setViewportSize(size);
        // The WPE test shell may enforce a minimum native window height.
        // Constrain the actual field explicitly for these layout contracts.
        await page.evaluate(({width,height})=>{const field=document.querySelector('.game-field');field.style.width=width+'px';field.style.height=height+'px'},size);
        await page.evaluate(()=>window.__starsSet(false));await freeze(page);const before=await read(page);
        await page.evaluate(({width,height})=>{const field=document.querySelector('.game-field');field.style.width=width+'px';field.style.height=height+'px'},size);await freeze(page);
        await page.evaluate(()=>window.__starsSet(true));
        const expected=size.width>=367&&size.height>=267?'hidden':'visible';
        await waitOverflow(page,expected);
        await freeze(page);const after=await read(page);
        assert.equal(after.stars.length,2);assert.equal(after.observers,1);
        for(let i=0;i<2;i++)for(const key of ['class','viewBox','aspect','contents','matrix','duration'])assert.deepEqual(after.stars[i][key],before.stars[i][key],`${size.width} ${key}`);
        assert.ok(after.stars.every(s=>s.overflow===expected),JSON.stringify({size,expected,field:after.field,bounds:after.bounds,actual:after.stars.map(s=>s.overflow)}));
        geometries.push({size,overflow:after.stars.map(s=>s.overflow),matrices:after.stars.map(s=>s.matrix)});
      }
      check('same artwork, SVG coordinate mapping and timing across resize; small-window fallback',geometries);
      await page.evaluate(()=>{document.querySelector('.game-field').style.width='320px'});await waitOverflow(page,'visible');
      assert.ok((await read(page)).stars.every(s=>s.overflow==='visible'));
      await page.evaluate(()=>{document.querySelector('.game-field').style.width='100%'});await waitOverflow(page,'hidden');
      assert.ok((await read(page)).stars.every(s=>s.overflow==='hidden'));check('measures the actual field rather than assuming window width');
      await page.evaluate(()=>{window.__starsClear();window.__starsSet(true,false)});await page.waitForTimeout(120);const playing=await read(page);
      assert.ok(playing.stars.every(s=>s.animationStates.every(state=>state==='running')));
      await page.evaluate(()=>window.__starsSet(true,true));await page.waitForTimeout(60);const paused=await read(page);
      await page.waitForTimeout(100);const held=await read(page);
      assert.ok(held.stars.every(s=>s.animationStates.every(state=>state==='paused')));
      for(let i=0;i<2;i++)assert.deepEqual(held.stars[i].times,paused.stars[i].times);
      await page.evaluate(()=>window.__starsSet(true,false));await page.waitForTimeout(120);const resumed=await read(page);
      for(let i=0;i<2;i++)assert.ok(resumed.stars[i].times[0]>held.stars[i].times[0]);check('original running, pause and resume behavior');
      if(engine==='webkit'){
        const session=current._connection.toImpl(page).delegate._session;await session.send('LayerTree.enable');
        const {root:doc}=await session.send('DOM.getDocument');const {nodeIds}=await session.send('DOM.querySelectorAll',{nodeId:doc.nodeId,selector:'.starfield-stars'});
        const stars=async()=>{const{layers}=await session.send('LayerTree.layersForNode',{nodeId:doc.nodeId});return layers.filter(l=>nodeIds.includes(l.nodeId));};
        await page.waitForTimeout(100);const a=await stars();await page.waitForTimeout(1100);const b=await stars();
        assert.equal(a.length,2);assert.equal(b.length,2);
        for(let i=0;i<2;i++){assert.equal(b[i].layerId,a[i].layerId);assert.equal(b[i].paintCount,a[i].paintCount)}
        check('two cached native star layers persist without repainting each sway frame',{before:a,after:b});
      }
      await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
      assert.ok((await read(page)).stars.every(s=>s.animationName==='none'));check('system reduced-motion setting');
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.evaluate(()=>document.documentElement.dataset.motion='reduced');await page.waitForTimeout(100);
      assert.ok((await read(page)).stars.every(s=>s.animationName==='none'));check('existing application reduced-motion setting');
      await page.evaluate(()=>window.__starsClear());await page.waitForTimeout(100);
      const cleared=await read(page);assert.equal(cleared.observers,0);assert.equal(cleared.stars.length,0);check('ResizeObserver and star DOM released on unmount');
      await context.close();
      const legacy=await browser.newContext({viewport:{width:430,height:825}});
      await legacy.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
      await legacy.addInitScript(()=>{window.ResizeObserver=undefined});const old=await legacy.newPage();old.on('pageerror',e=>result.errors.push(e.message));
      await old.goto(origin);await old.waitForFunction(()=>!!window.__starsSet);await old.evaluate(()=>window.__starsSet(true));await old.waitForTimeout(100);
      assert.ok((await read(old)).stars.every(s=>s.overflow==='visible'));check('original rendering retained when ResizeObserver is absent');await legacy.close();
      assert.deepEqual(result.errors,[]);result.passed=true;
    }catch(error){result.failure=String(error);process.exitCode=1}finally{await browser.close()}
    console.log(JSON.stringify({engine,passed:result.passed,checks:result.checks.length,failure:result.failure}));
  }
}finally{server.close();writeFileSync(root+'starfield-behavior-results.json',JSON.stringify(report,null,2))}
