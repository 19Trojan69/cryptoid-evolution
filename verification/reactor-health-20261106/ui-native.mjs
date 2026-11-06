import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,createReadStream,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=new URL('../../',import.meta.url).pathname;
const require=createRequire(root+'frontend/package.json'),{build}=require('esbuild');
const pw=createRequire(new URL('../transition-motion-20261106/package.json',import.meta.url))('playwright');
const engine=process.argv[2];
const out=root+'verification/reactor-health-20261106/results';mkdirSync(out,{recursive:true});
const source=`import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
import BlockchainProgress from './BlockchainProgress';import BossHullView from './BossHullView';import BossReactorView from './BossReactorView';
import {createSectorBoss} from './sectorBoss';import {specialWeaponBox} from './bossSpecialWeapon';import {BOSS_DEFEAT_MS} from './bossDefeatTiming';
import {drawBossWeapons,disposeBossWeapons,weaponCanvasSize} from './bossWeaponRenderer';
const root=createRoot(document.getElementById('mount'));
window.qa=(mode,id=1,health=100)=>{const boss=createSectorBoss(id*10,390,90,760);boss.turrets.forEach(g=>g.health=0);boss.health=boss.maxHealth*health/100;boss.core={elapsed:900,volley:1,lastShotColor:'#22ff66'};
const fall={id:1,x:195,y:240,bossShipWidth:boss.width,bossHeight:boss.height,bossImage:boss.config.image,bossModel:boss,fallDistance:200,fireSites:[[40,40],[60,60]]};
flushSync(()=>root.render(mode==='empty'?null:mode==='motion'?<BlockchainProgress blocks={7}/>:mode==='heat'?<BossReactorView boss={boss}/>:<BossHullView boss={null} fall={fall} ready light={0} now={0} fallDurationMs={BOSS_DEFEAT_MS} title=""/>));return specialWeaponBox(boss);};
window.heatAllocation=async()=>{let peakHeatBytes=0,totalHeatBytes=0,cases=0;
for(let id=1;id<=50;id++){const boss=createSectorBoss(id*10,390,90,760),atlas=new Image();atlas.src=boss.config.weaponImage;await atlas.decode();
const size=weaponCanvasSize(boss),canvas=document.createElement('canvas');canvas.width=Math.ceil(size.width);canvas.height=Math.ceil(size.height);
const surfaces=[],make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;surfaces.push(c);return c;};
if(!drawBossWeapons(canvas,boss,atlas,false,make))throw Error('cold draw failed');const cold=surfaces.length;
for(const ratio of [.49,.4,.25,.01]){boss.turrets.forEach(g=>g.health=g.maxHealth*ratio);if(!drawBossWeapons(canvas,boss,atlas,false,make))throw Error('heat draw failed');}
if(surfaces.length!==cold+boss.turrets.length)throw Error('Heat textures accumulated');
const bytes=surfaces.slice(cold).reduce((s,c)=>s+c.width*c.height*4,0);peakHeatBytes=Math.max(peakHeatBytes,bytes);totalHeatBytes+=bytes;
boss.turrets.forEach(g=>g.health=0);drawBossWeapons(canvas,boss,atlas,false,make);if(surfaces.slice(cold).some(c=>c.width*c.height))throw Error('Destroyed heat tile retained');
disposeBossWeapons(canvas);if(surfaces.some(c=>c.width*c.height)||canvas.width*canvas.height)throw Error('surface retained after disposal');cases++;}
return {cases,peakHeatBytes,totalHeatBytes,unit:'logical RGBA bytes; not process RAM',heatStagesAccumulate:false,disposedSurfacesReleased:true};};`;
const bundle=await build({absWorkingDir:root,stdin:{contents:source,resolveDir:root+'frontend/src/pages',loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',logLevel:'silent',plugins:[{name:'test-localization-only',setup(b){b.onResolve({filter:/^\.\.\/i18n$/},()=>({path:'locale',namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:'export const useLocale=()=>({t:x=>x});',loader:'js'}));}}]});
const css=readFileSync(root+'frontend/src/index.css','utf8');
const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(path==='/'){res.setHeader('Content-Type','text/html');res.end('<style>'+css+'</style><main class="game-shell" data-effects-paused="true"><div id="mount"></div><i class="hull-hotspot"></i><div class="formation-data-stream">'+Array.from({length:5},()=>'<div class="formation-data-row"><span>101010101010</span><span>101010101010</span></div>').join('')+'</div></main><script src="/qa.js"></script>');return;}if(path==='/qa.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].text);return;}const file=resolve(root+'frontend/public','.'+path);if(file.startsWith(root+'frontend/public/')&&existsSync(file)){createReadStream(file).pipe(res);return;}res.writeHead(404).end();});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw[engine].launch({headless:true});
try{const page=await browser.newPage({viewport:{width:390,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('crash'));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.qa);
// Actual component markup, all nine cubes, both user/OS motion settings and transition pause.
for(const media of ['no-preference','reduce'])for(const setting of ['full','reduced']){
 await page.emulateMedia({reducedMotion:media});await page.evaluate(setting=>{document.documentElement.dataset.motion=setting;window.qa('motion');},setting);
 const result=await page.evaluate(()=>{const cubes=[...document.querySelectorAll('.blockchain-cube-rotor')];
 const moving=e=>{const a=e.getAnimations()[0];if(!a)throw Error('Missing native animation');const running=a.playState==='running';a.pause();a.currentTime=100;const first=getComputedStyle(e).transform;a.currentTime=1000;const second=getComputedStyle(e).transform;return {running,changed:first!==second,direction:getComputedStyle(e).animationDirection,first,second};};
 return {cubes:cubes.map(moving),binary:moving(document.querySelector('.blockchain-binary-track')),rows:[...document.querySelectorAll('.formation-data-row')].map(e=>getComputedStyle(e).animationDirection),combat:getComputedStyle(document.querySelector('.hull-hotspot')).animationPlayState};});
 assert.equal(result.cubes.length,9);assert.ok(result.cubes.every(c=>c.running&&c.changed&&c.direction==='reverse'));assert.ok(result.binary.running&&result.binary.changed);assert.equal(result.binary.direction,'reverse');
 // Binary keyframes run from X=0 to negative X, reverse must advance right.
 const tx=s=>Number(s.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+)/)[1]);assert.ok(tx(result.binary.second)>tx(result.binary.first));
 assert.deepEqual(result.rows,['reverse','normal','reverse','normal','reverse']);assert.equal(result.combat,'paused');if(media==='no-preference'&&setting==='full')await page.screenshot({path:out+'/'+engine+'-motion.png'});await page.evaluate(()=>window.qa('empty'));
}
await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>{document.documentElement.dataset.motion='full';document.querySelector('main').dataset.effectsPaused='false';});
for(let id=1;id<=50;id++){
 const box=await page.evaluate(id=>window.qa('fall',id,0),id);
 const seq=await page.evaluate(()=>{const hull=document.querySelector('.boss-falling-hull'),blast=document.querySelector('.boss-reactor-destruction'),a=hull.getAnimations()[0],b=blast.getAnimations()[0];a.pause();b.pause();a.currentTime=300;const before=getComputedStyle(hull).transform;b.currentTime=300;const opacity=Number(getComputedStyle(blast).opacity);a.currentTime=640;const hold=getComputedStyle(hull).transform;a.currentTime=900;const after=getComputedStyle(hull).transform;const rect=blast.style;return {before,hold,after,opacity,delay:a.effect.getTiming().delay,duration:a.effect.getTiming().duration,burstDuration:b.effect.getTiming().duration,width:parseFloat(rect.width),height:parseFloat(rect.height)};});
 assert.equal(seq.before,seq.hold);assert.notEqual(seq.hold,seq.after);assert.ok(seq.opacity>0);assert.equal(seq.delay,650);assert.equal(seq.duration,5000);assert.equal(seq.burstDuration,650);assert.ok(Math.abs(seq.width-box.width)<.001);assert.ok(Math.abs(seq.height-box.height)<.001);
 await page.evaluate(()=>window.qa('empty'));
}
await page.evaluate(()=>window.qa('fall',1,0));await page.waitForTimeout(750);assert.equal(await page.locator('.boss-reactor-destruction').count(),0,'finished blast releases DOM during descent');
await page.evaluate(()=>{window.qa('empty');window.qa('fall',1,0);document.querySelector('main').dataset.effectsPaused='true';});await page.waitForTimeout(750);assert.equal(await page.locator('.boss-reactor-destruction').count(),1,'paused burst retained');
await page.evaluate(()=>{document.querySelector('main').dataset.effectsPaused='false';});await page.waitForTimeout(750);assert.equal(await page.locator('.boss-reactor-destruction').count(),0);
let shapes;for(const health of [100,50,49,25,1]){await page.evaluate(h=>window.qa('heat',1,h),health);const state=await page.evaluate(()=>({nodes:document.querySelector('svg').querySelectorAll('*').length,fill:getComputedStyle(document.querySelector('.boss-reactor-pulse')).fill,canvases:document.querySelectorAll('canvas').length,filters:document.querySelectorAll('svg filter').length}));shapes??=state.nodes;assert.equal(state.nodes,shapes);assert.equal(state.canvases,0);assert.equal(state.filters,0);if(health<50)assert.match(state.fill,/rgb\(255,/);}
await page.evaluate(()=>window.qa('empty'));const heat=await page.evaluate(()=>window.heatAllocation());assert.equal(heat.cases,50);assert.deepEqual(errors,[]);
const result={engine,actualComponents:true,motionCases:4,cubes:9,sequenceBosses:50,reactorBurstRemoved:true,pauseResume:true,reactorHeatExtraCanvas:0,heat,physicalDevice:false,totalProcessRamMeasured:false,whiteScreenFixed:false};writeFileSync(out+'/'+engine+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await new Promise(r=>server.close(r));}
