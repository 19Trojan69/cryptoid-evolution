import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {viewportStyle,blob} from './transform.mjs';
import {capture,summarize,nodeIds,resolveLabels} from '../active-render-profile-20261105/trace.mjs';
const root=new URL('../..',import.meta.url).pathname.replace(/\/$/,'');
const req=createRequire(new URL('../boss2-forensics-20261028/package.json',import.meta.url)),pw=req('playwright'),engine=process.argv[2];
assert.ok(['chromium','webkit'].includes(engine));const output=root+'/verification/viewport-selector-guard-20261105/results/'+engine;mkdirSync(output,{recursive:true});
const original=readFileSync(root+'/frontend/src/gameViewport.css','utf8'),candidate=viewportStyle(original);
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const result={version:1,kind:'specificity-preserving-viewport-fallback-guard',complete:false,engine,sourceCommit:git('rev-parse','HEAD'),sourceTree:git('rev-parse','HEAD^{tree}'),
 originalCssBlob:blob(original),candidateCssBlob:blob(candidate),cases:[],syntheticFixture:true,gameStarted:false,
 physicalDevice:false,memoryBenefitMeasured:false,whiteScreenFixed:false};
const save=(name,x)=>writeFileSync(output+'/'+name,x);let browser;
function html(css,{locked,route,cascade}){const klass=[locked?'game-viewport-locked':'',cascade?'cascade-probe':''].join(' ');
 const extra=cascade?'html.cascade-probe{height:81%;overflow:scroll}body.cascade-probe{position:relative;inset:auto}':'';
 return '<!doctype html><html class="'+klass+'"><head><style>'+css+extra+'</style></head><body class="'+klass+'">'+
  (route?'<div class="game-route"><main class="game-shell"><div class="game-field"><div id="fixture-field"></div><div class="game-overlay"><div class="game-modal"><div data-game-scroll>x</div></div></div></div></main></div>':'<div id="fixture-field">home</div>')+'</body></html>';}
async function snapshot(page){return page.evaluate(()=>['html','body','.game-route','.game-shell','.game-field','.game-modal','[data-game-scroll]'].map(selector=>{
 const e=document.querySelector(selector);if(!e)return{selector,absent:true};const s=getComputedStyle(e),r=e.getBoundingClientRect();
 return{selector,styles:Object.fromEntries([...s].map(k=>[k,s.getPropertyValue(k)])),rect:[r.x,r.y,r.width,r.height]};}));}
try{browser=await pw[engine].launch({headless:true});result.engineVersion=browser.version();result.playwrightVersion=req('playwright/package.json').version;
 const context=await browser.newContext();
 for(const viewport of [{width:430,height:825},{width:1024,height:768}])for(const locked of [false,true])for(const route of [false,true])for(const cascade of [false,true]){
  const settings={locked,route,cascade},a=await context.newPage(),b=await context.newPage();await a.setViewportSize(viewport);await b.setViewportSize(viewport);
  await a.setContent(html(original,settings));await b.setContent(html(candidate,settings));
  const before=await snapshot(a),after=await snapshot(b);assert.deepEqual(after,before,'Same complete computed styles, cascade and rectangles');
  result.cases.push({viewport,...settings,comparedNodes:before.filter(x=>!x.absent).length,allComputedStylesAndRectsEqual:true});await a.close();await b.close();}
 if(engine==='chromium'){
  const profiles={};
  for(const [name,css]of [['control',original],['candidate',candidate]]){
   const page=await context.newPage();await page.setContent(html(css,{locked:true,route:true,cascade:false}));
   const ps=await context.newCDPSession(page),frameId=(await ps.send('Page.getFrameTree')).frameTree.frame.id;
   const recorded=await capture({session:await browser.newBrowserCDPSession(),save:x=>save(name+'-trace.json.gz',x),run:()=>page.evaluate(async()=>{
    const field=document.getElementById('fixture-field');for(let i=0;i<8;i++){
     await new Promise(requestAnimationFrame);const p=document.createElement('div');p.className='player-laser';field.append(p);getComputedStyle(p).color;
     await new Promise(requestAnimationFrame);p.remove();getComputedStyle(field).color;}
    return{pairs:8,insertions:8,removals:8,forcedReads:16,allOperationsIdentical:true};})});
   profiles[name]={...recorded.result};assert.equal(recorded.result.complete,true,recorded.result.failure);
   const labels=await resolveLabels(ps,nodeIds(recorded.events,frameId));
   profiles[name].labels=labels;profiles[name].summary=summarize(recorded.events,frameId,labels.labels);
   await ps.detach();await page.close();}
  result.nativeProfiles=profiles;
  const has=p=>p.summary.relatedEventGroups.filter(g=>g.reason==='Affected by :has()'&&/^(HTML|BODY)(?:[.#]|$)/.test(g.label??'')).reduce((n,g)=>n+g.events,0);
  const control=has(profiles.control),guarded=has(profiles.candidate);assert.ok(control>0,'The unchanged native fixture must actually trigger root :has dependencies');
  result.rootHasEvents={control,candidate:guarded};
  result.redundantRootHasInvalidationsReduced=guarded<control;
  result.nativeStyleWorkReduced=profiles.candidate.summary.elementStyleCalculations<profiles.control.summary.elementStyleCalculations;
  result.noMemoryOrFrameRateConclusion=true;
 }
 result.complete=true;
}catch(e){result.failure=e.message;process.exitCode=1;}
finally{save('observation.json',JSON.stringify(result,null,2)+'\n');console.log('VIEWPORT_SELECTOR_GUARD '+JSON.stringify({complete:result.complete,engine,
 cases:result.cases.length,rootHasEvents:result.rootHasEvents,nativeStyleWorkReduced:result.nativeStyleWorkReduced,failure:result.failure}));if(browser)await browser.close();}
