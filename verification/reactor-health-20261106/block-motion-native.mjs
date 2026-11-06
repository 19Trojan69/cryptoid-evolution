import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
const root=new URL('../../',import.meta.url).pathname;
const req=createRequire(root+'frontend/package.json'),{build:bundle}=req('esbuild');
const {build}=await import(pathToFileURL(req.resolve('vite')));
const pw=createRequire(new URL('../transition-motion-20261106/package.json',import.meta.url))('playwright');
const engine=process.argv[2];assert.ok(['chromium','webkit'].includes(engine));
const out=root+'verification/reactor-health-20261106/results';mkdirSync(out,{recursive:true});
const cssPath=root+'frontend/src/pages/transitionNotices.css',candidate=readFileSync(cssPath,'utf8');
const fixed='.game-field .sector-banner.readable-transition :not(.blockchain-cube-rotor):not(.blockchain-binary-track),';
const blocked='.game-field .sector-banner.readable-transition *,';
assert.equal(candidate.split(fixed).length,2);
const released=candidate.replace(fixed,blocked);
const hash=s=>createHash('sha256').update(s).digest('hex');
assert.equal(hash(released),'139bb3bcc3ae24b1233e67cf110b8cf8b6f72e9b295885a5d23e6003c0083c7b','restore every byte of the released transition sheet');
const controller=readFileSync(root+'frontend/src/pages/GamePage.tsx','utf8');
assert.ok(controller.includes('className={`sector-banner readable-transition'));
assert.ok(controller.includes('game.phase === "SECTOR_CLEAR" && game.encounter === "normal"'));
assert.ok(controller.includes('<BlockchainProgress blocks={game.chainBlocks} />'));
const css={},cssAssets={};const previousCwd=process.cwd(),previousEnv=process.env.VERCEL_ENV;
process.chdir(root+'frontend');process.env.VERCEL_ENV='production';
try{
 for(const [name,source] of [['before',released],['after',candidate]]){
  writeFileSync(cssPath,source);
  const result=await build({root:root+'frontend',logLevel:'error',build:{write:false,copyPublicDir:false}});
  const outputs=(Array.isArray(result)?result:[result]).flatMap(r=>r.output);
  const byName=new Map(outputs.map(o=>[o.fileName,o]));
  const entry=outputs.find(o=>o.type==='chunk'&&o.isEntry);
  const game=outputs.find(o=>o.type==='chunk'&&o.facadeModuleId?.endsWith('/pages/GamePage.tsx'));
  assert.ok(entry&&game,'find the actual application entry and lazy GamePage chunk');
  const visited=new Set(),styles=new Set();
  const load=chunk=>{if(visited.has(chunk.fileName))return;visited.add(chunk.fileName);for(const dep of chunk.imports)if(byName.get(dep)?.type==='chunk')load(byName.get(dep));for(const f of chunk.viteMetadata?.importedCss??[])styles.add(f);};
  load(entry);load(game);cssAssets[name]=[...styles];assert.ok(styles.size>=2,'include global CSS and the separately loaded GamePage CSS');
  css[name]=[...styles].map(f=>{const asset=byName.get(f);assert.equal(asset?.type,'asset');return typeof asset.source==='string'?asset.source:Buffer.from(asset.source).toString();}).join('\n');
  assert.ok(css[name].includes('blockchain-cube-turn')&&css[name].includes('readable-transition'));
 }
}finally{writeFileSync(cssPath,candidate);process.chdir(previousCwd);if(previousEnv===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previousEnv;}
assert.equal(readFileSync(cssPath,'utf8'),candidate);
const source=`import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';import BlockchainProgress from './BlockchainProgress';import {startCssFramePacing} from '../lib/cssFramePacing';
const root=createRoot(document.getElementById('mount'));window.stopQa=startCssFramePacing(document.body);
window.showBlock=(blocks=8)=>flushSync(()=>root.render(<div key={blocks} className="sector-banner readable-transition sector-clear-message" data-encounter="normal" style={{'--transition-duration':'5000ms'}}><span>BLOCK VERBUNDEN</span><strong>Block {blocks} ABGESCHLOSSEN</strong><small className="chain-result">Block {blocks}/9 · BLOCK VERBUNDEN</small><BlockchainProgress blocks={blocks}/></div>));`;
const compiled=await bundle({absWorkingDir:root,stdin:{contents:source,resolveDir:root+'frontend/src/pages',loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',logLevel:'silent',plugins:[{name:'labels-only',setup(b){b.onResolve({filter:/^\.\.\/i18n$/},()=>({path:'locale',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const useLocale=()=>({t:x=>x});',loader:'js'}));}}]});
const server=createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/qa.js'){res.setHeader('Content-Type','text/javascript');res.end(compiled.outputFiles[0].text);return;}res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css[url.searchParams.get('version')==='before'?'before':'after']+'</style><main class="game-shell" data-effects-paused="false"><div class="game-field" style="height:100vh"><div id="mount"></div></div></main><script src="/qa.js"></script>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await pw[engine].launch({headless:true});
const read=()=>{
 const cubes=[...document.querySelectorAll('.blockchain-cube-rotor')],track=document.querySelector('.blockchain-binary-track');
 const state=e=>{const a=e.getAnimations()[0],m=new DOMMatrixReadOnly(getComputedStyle(e).transform);return {name:getComputedStyle(e).animationName,state:getComputedStyle(e).animationPlayState,clock:a?.currentTime??null,angle:Math.atan2(-m.m13,m.m11),x:m.m41};};
 return {cubes:cubes.map(state),binary:state(track),title:getComputedStyle(document.querySelector('strong')).animationName,halo:getComputedStyle(document.querySelector('.blockchain-halo')).animationName,nodes:document.querySelector('.blockchain-progress').querySelectorAll('*').length};
};
let cases=0;
try{
 const context=await browser.newContext({viewport:{width:390,height:760}});await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const page=await context.newPage(),faults=[];page.on('pageerror',e=>faults.push(e.message));page.on('crash',()=>faults.push('crash'));
 const origin='http://127.0.0.1:'+server.address().port;
 await page.goto(origin+'/?version=before');await page.evaluate(()=>window.showBlock(8));
 const before=await page.evaluate(read);assert.equal(before.cubes.length,9);assert.ok(before.cubes.every(c=>c.name==='none'));assert.equal(before.binary.name,'none');
 await page.waitForTimeout(180);assert.deepEqual(await page.evaluate(read),before,'reproduce the frozen block banner with the released complete CSS');
 await page.goto(origin+'/?version=after');
 for(const [width,height] of [[390,760],[1366,768]]){
  await page.setViewportSize({width,height});
  for(const media of ['no-preference','reduce'])for(const setting of ['full','reduced'])for(let block=1;block<=9;block++){
   await page.emulateMedia({reducedMotion:media});await page.evaluate(({block,setting})=>{document.documentElement.dataset.motion=setting;window.showBlock(block);},{block,setting});
   await page.waitForFunction(()=>[...document.querySelectorAll('.blockchain-cube-rotor'),document.querySelector('.blockchain-binary-track')].every(e=>{const a=e.getAnimations()[0];return a&&a.playState==='running'&&Number(a.currentTime)>0;}),{},{timeout:2000});
   const a=await page.evaluate(read);await page.waitForTimeout(220);const b=await page.evaluate(read);
   assert.equal(a.nodes,b.nodes);assert.equal(a.cubes.length,9);assert.ok(b.cubes.every((c,i)=>c.name==='blockchain-cube-turn'&&c.state==='running'&&c.clock>a.cubes[i].clock),JSON.stringify({width,height,media,setting,block,a,b}));
   for(let i=0;i<9;i++){const delta=Math.atan2(Math.sin(b.cubes[i].angle-a.cubes[i].angle),Math.cos(b.cubes[i].angle-a.cubes[i].angle));assert.ok(delta<-.01,'every cube turns left on its real running native clock');}
   assert.equal(b.binary.name,'blockchain-binary-flow');assert.ok(b.binary.x>a.binary.x,'the single binary row moves right');
   assert.equal(b.title,'none');assert.equal(b.halo,'none');cases++;
  }
 }
 // The screenshot's exact eight-block banner, visible after its authored fade-in.
 await page.setViewportSize({width:390,height:760});await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>{document.documentElement.dataset.motion='full';window.showBlock(8);});await page.waitForTimeout(550);
 const running=await page.evaluate(read);assert.ok(running.cubes.every(c=>c.state==='running'));
 await page.evaluate(()=>{document.getAnimations().forEach(a=>{a.pause();if(a.animationName==='readable-notice')a.currentTime=1000;});document.querySelectorAll('.blockchain-cube-rotor').forEach(e=>e.getAnimations()[0].currentTime=100);});
 const first=await page.locator('.blockchain-node.active').first().screenshot({path:out+'/'+engine+'-block-cube-first.png'});
 await page.evaluate(()=>document.querySelectorAll('.blockchain-cube-rotor').forEach(e=>e.getAnimations()[0].currentTime=1600));
 const second=await page.locator('.blockchain-node.active').first().screenshot({path:out+'/'+engine+'-block-cube-second.png'});assert.notEqual(Buffer.compare(first,second),0);
 await page.screenshot({path:out+'/'+engine+'-block-banner.png'});
 // An actual game pause freezes both animations; Resume continues the same clocks.
 await page.evaluate(()=>{window.showBlock(7);document.querySelector('main').dataset.effectsPaused='false';});await page.waitForTimeout(120);
 await page.evaluate(()=>{document.querySelector('main').dataset.effectsPaused='true';});await page.waitForTimeout(80);const paused=await page.evaluate(read);await page.waitForTimeout(180);assert.deepEqual(await page.evaluate(read),paused);
 assert.ok(paused.cubes.every(c=>c.state==='paused'));assert.equal(paused.binary.state,'paused');
 await page.evaluate(()=>{document.querySelector('main').dataset.effectsPaused='false';});await page.waitForTimeout(180);const resumed=await page.evaluate(read);assert.ok(resumed.cubes.every((c,i)=>c.clock>paused.cubes[i].clock));assert.ok(resumed.binary.clock>paused.binary.clock);
 assert.deepEqual(faults,[]);const result={engine,actualBlockBanner:true,completeApplicationCss:true,nativeFramePacing:true,releasedFreezeReproduced:true,cases,blocks:9,viewports:2,motionSettings:4,cubeLeft:true,binaryRight:true,visibleCubePixelsChange:true,pauseResume:true,unchangedNodeCount:true,cssSourceBytesChanged:'one selector',beforeCssSha256:hash(css.before),afterCssSha256:hash(css.after),cssAssets,physicalDevice:false,whiteScreenFixed:false};
 writeFileSync(out+'/'+engine+'-block-motion.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await new Promise(r=>server.close(r));}
