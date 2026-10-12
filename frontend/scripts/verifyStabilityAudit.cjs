// Isolated production build + real React/router/Canvas in desktop Chromium.
// Forced clears, fixture saves, software GPU and optional virtual time are
// explicit test scaffolding. Nothing here is included in a release build.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root = path.resolve(__dirname, '..'), repo = path.dirname(root);
const baseline = process.env.CRYPTOID_AUDIT_BASELINE === '1';
const performanceOnly = process.env.CRYPTOID_AUDIT_PERF_ONLY === '1';
const blockCount = Number(process.env.CRYPTOID_AUDIT_BLOCKS || 30);
const output = process.env.CRYPTOID_AUDIT_OUT || '/tmp/cryptoid-audit-browser.json';
const outDir = output.replace(/\.json$/, '-build');
const BASE = '16fcfb43aad836de0e38f684c0d4cade82b78976';
const originals = ['pages/GamePage.tsx', 'pages/GameSceneBoundary.tsx', 'pages/gameAudio.ts', 'pages/gameDiagnostics.ts', 'hooks/useModalNavigation.ts', 'App.tsx', 'RouteRecovery.tsx', 'release.ts'];
const hooks = `
 (window as any).__auditQA = {
 info:()=>({owner:startKeyRef.current,sector:stateRef.current.sector,encounter:stateRef.current.encounter,phase:stateRef.current.phase,status:stateRef.current.status,hearts:stateRef.current.hearts,score:stateRef.current.score,shards:stateRef.current.shards,enemies:stateRef.current.asteroids.length,shots:stateRef.current.shots.length,hostile:stateRef.current.enemyShots.length,effects:stateRef.current.effects.length,paid:stateRef.current.paidWeaponMs,rapid:stateRef.current.rapidFireMs,rewardCards:rewardCardsRef.current.length}),
 protect:()=>{adminRunRef.current=true;stateRef.current.hearts=99;},
 clearGroup:()=>{stateRef.current.asteroids=[];stateRef.current.shots=[];formationIndexRef.current=blockFlights(stateRef.current.sector,rulesVersionRef.current)[flightRef.current];},
 killBoss:()=>destroyBoss(stateRef.current,performance.now()),
 heart:()=>{stateRef.current.player={...BOSS_HEART_POSITION};lastPlayerRef.current={...stateRef.current.player};},
 clearBonus:()=>{stateRef.current.bonusTargets=[];bonusIndexRef.current=BONUS_TARGET_COUNT;},
 cards:()=>{rewardCardsRef.current=[];pendingBossCardRef.current=null;setRewardCards([]);stateRef.current.status='playing';lastFrameRef.current=0;},
 seed:(sector:number)=>{restart();stateRef.current.sector=sector;stateRef.current.section=sector;stateRef.current.hearts=99;adminRunRef.current=true;if(sector%10===0){stateRef.current.encounter='boss-intro';stateRef.current.boss=createSectorBoss(sector,fieldSizeRef.current.width,visibleTopRef.current,fieldSizeRef.current.height);}setGame({...stateRef.current});},
 pause:()=>{stateRef.current.status='paused';setGame({...stateRef.current});},
 resume:()=>{stateRef.current.status='playing';lastFrameRef.current=0;setGame({...stateRef.current});},
 fault:()=>{(window as any).__auditRenderFault=true;setGame({...stateRef.current});},
 clearFault:()=>{(window as any).__auditRenderFault=false;},
 timers:()=>Object.assign(stateRef.current,{paidWeaponLevel:2,paidWeaponMs:60000,weaponSource:'paid',weaponTimers:[0,0,60000,0,0,0],unlockedWeapons:[1,2],weaponCap:2,rapidFireMs:15000}),
 stress:()=>{const s=stateRef.current,{width,height}=fieldSizeRef.current;const ids=[];for(let i=0;i<80;i++){ids.push(nextIdRef.current);s.shots.push({id:nextIdRef.current++,x:i/80*width,y:height*.4,speedX:0,damage:1,empowered:false});ids.push(nextIdRef.current);s.enemyShots.push({id:nextIdRef.current++,x:i/80*width,y:height*.1,vx:0,vy:-.1,radius:3});}for(let i=0;i<12;i++){ids.push(nextIdRef.current);s.effects.push({id:nextIdRef.current++,kind:'explosion',x:(i%4+.5)*width/4,y:(Math.floor(i/4)+.5)*height/5,startedAt:performance.now(),sprite:i%20,debrisColor:'gold',debrisSize:72});}return ids;},
 remaining:(ids:number[])=>[...stateRef.current.shots,...stateRef.current.enemyShots,...stateRef.current.effects].filter(x=>ids.includes(x.id)).length,
 player:()=>({...stateRef.current.player}),
 save:async()=>{const s=stateRef.current;s.hearts=3;adminRunRef.current=false;scoreRunRef.current='isolated-audit-fixture';saveQueueRef.current={durable:true,enqueue:async(entry:any)=>{(window as any).__auditSaved=entry.body;}} as any;await saveCombatRef.current();adminRunRef.current=true;return (window as any).__auditSaved;},
 restore:(payload:any)=>{Object.assign(stateRef.current,structuredClone(payload.save));restoreCombat(structuredClone(payload.combat));setGame({...stateRef.current});},
 };
`;
const sampleHook = `const qaStart=(window as any).__auditNow(); simulate(time); const qaWork=(window as any).__auditNow()-qaStart;
 const qaSamples=(window as any).__auditFrames;
 if(stateRef.current.status==='playing' && lastMeasuredFrameRef.current>0 && qaSamples.length<7200) qaSamples.push([lastMeasuredFrameRef.current,qaWork]);`;
const mime = { '.js':'text/javascript', '.css':'text/css', '.html':'text/html', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.mp3':'audio/mpeg', '.woff2':'font/woff2' };
function summary(samples) {
 const frames = samples.map(x=>x[0]).sort((a,b)=>a-b), work=samples.map(x=>x[1]);
 return {samples:samples.length, meanFrameMs:frames.reduce((a,b)=>a+b,0)/Math.max(1,frames.length), p95FrameMs:frames[Math.floor(frames.length*.95)]||0,
 maxFrameMs:Math.max(0,...frames), meanWorkMs:work.reduce((a,b)=>a+b,0)/Math.max(1,work.length), maxWorkMs:Math.max(0,...work)};
}
(async()=>{
 const {build} = await import(path.join(root,'node_modules/vite/dist/node/index.js'));
 await build({root, logLevel:'error', define:{'import.meta.env.VITE_BACKEND_URL':'"/api"'}, build:{outDir,copyPublicDir:false}, plugins:[{
  name:'isolated-stability-audit', enforce:'pre',
  transform(code,id){
   const relative = path.relative(path.join(root,'src'),id);
   if(baseline && originals.includes(relative)) code=execFileSync('git',['show',BASE+':frontend/src/'+relative],{cwd:repo,encoding:'utf8'});
   if(id.endsWith('/GamePage.tsx')) {
    const anchor=code.includes('  const renderScene =')?'  const renderScene =':'  const totalShards =';
    assert.ok(code.includes(anchor));code=code.replace(anchor,hooks+'\n'+anchor);
    code=code.replace('  const levelLabel =',"  if ((window as any).__auditRenderFault) throw new TypeError('injected page presentation failure');\n  const levelLabel =");
    code=code.replace('simulate(time);',sampleHook);
   }
   if(id.endsWith('/paintedShip.ts')) code+='\n(window as any).__auditPaintStats=paintedShipResourceStats;';
   return code;
  },
  transformIndexHtml:{order:'post',handler:html=>html.replace('appNetwork: ""','appNetwork: "testnet"')},
 }]});
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const allowed=pathname.startsWith('/assets/')?outDir:path.join(root,'public');
  const target=path.resolve(allowed,'.'+pathname);
  let file=target.startsWith(allowed+path.sep)&&fs.existsSync(target)&&fs.statSync(target).isFile()?target:path.join(outDir,'index.html');
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 let browser=null; const launch=()=>chromium.launch({executablePath:process.env.CRYPTOID_CHROMIUM,args:['--no-sandbox','--no-zygote',...(process.env.CRYPTOID_AUDIT_SINGLE_PROCESS==='1'?['--single-process']:[]),'--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const result={baseline,base:BASE,browser:'',mode:'isolated instrumented production; Chromium software GPU; forced clears/invulnerability and fixture saves; virtual campaign clock; performance samples use a separate real-time page; no Pi Browser or iOS inference',errors:[],campaigns:[]};
 result.sourceHashes=Object.fromEntries([...originals,'lib/accountSave.ts','pages/gameLoop.ts'].map(file=>{const text=baseline&&originals.includes(file)?execFileSync('git',['show',BASE+':frontend/src/'+file],{cwd:repo}):fs.readFileSync(path.join(root,'src',file));return [file,crypto.createHash('sha256').update(text).digest('hex')];}));
 const create = async (clock=false)=>{
  result.stage='launch';fs.writeFileSync(output,JSON.stringify(result,null,2));
  if(browser)await browser.close(); browser=await launch(); result.browser=await browser.version();
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
  await context.addInitScript(()=>{
   if(location.origin==='null')return;
   let seed=20261012;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'web'})};
   localStorage.setItem('cryptoid_language','en');localStorage.setItem('cryptoid_home_music','off');
   window.__auditFrames=[];window.__auditNow=performance.now.bind(performance);
   const uuid=crypto.randomUUID.bind(crypto);window.__auditUUIDs=0;crypto.randomUUID=()=>{window.__auditUUIDs++;return uuid();};
  });
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.fulfill({body:''});if(u.pathname.startsWith('/api/'))return route.fulfill({json:{}});return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
  if(clock)await page.clock.install({time:new Date('2026-10-12T12:00:00Z')});
  result.stage='page-load';fs.writeFileSync(output,JSON.stringify(result,null,2));
  await page.goto(origin+'/game');await page.waitForFunction(()=>window.__auditQA);
  // Freeze between commands: slow software-GPU/GC/CDP work must not advance
  // the virtual campaign clock and imitate a foreground RAF stall.
  if(clock)await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  await page.evaluate(()=>{window.__auditQA.cards();window.__auditQA.protect();});
  result.stage='page-ready';fs.writeFileSync(output,JSON.stringify(result,null,2));
  return {context,page};
 };
 const persist=()=>{fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2));};
 try {
  // Real browser/router replay: restore a stale marker with a previous Home
  // entry, rather than silently treating that marker as an owned guard.
  if(!performanceOnly){
   const {context,page}=await create(true);
   await page.evaluate(()=>{history.replaceState({idx:0,usr:null,key:'home'},'', '/');history.pushState({idx:1,usr:{cryptoidModalGuard:true},key:'orphan'},'', '/game');});
   await page.reload();await page.waitForTimeout(2500);
   result.orphanGuard={path:new URL(page.url()).pathname};
   assert.equal(result.orphanGuard.path,baseline?'/':'/game');
   result.stage='orphan-context-close';persist();
   await context.close();persist();
  }
  const starts=performanceOnly?[]:[Number(process.env.CRYPTOID_AUDIT_START || (process.env.CRYPTOID_AUDIT_HIGH_ONLY==='1'?101:1))];
  for(const start of starts){
   const {context,page}=await create(true);if(start!==1)await page.evaluate(s=>window.__auditQA.seed(s),start);
   const cdp=await context.newCDPSession(page);await cdp.send('HeapProfiler.enable');
   const normal=[],bosses=[],snapshots=[];let turns=0;
   const campaign={start,normal,bosses,snapshots,complete:false};result.campaigns.push(campaign);
   result.stage='campaign';persist();
   while(normal.length<blockCount){
    assert.ok(++turns<50);let info=await page.evaluate(()=>window.__auditQA.info());
    if(info.status!=='playing'){
     result.unexpectedPause=await page.evaluate(()=>({info:window.__auditQA.info(),visibility:document.visibilityState,focused:document.hasFocus(),dialogs:document.querySelectorAll('dialog[open]').length,diagnostics:JSON.parse(localStorage.getItem('cryptoid_game_diagnostics_v1')||'[]')}));persist();
     if(info.status==='paused'&&info.rewardCards>0){
      result.intentionalCardPauses=(result.intentionalCardPauses||0)+1;
      while((await page.evaluate(()=>window.__auditQA.info())).rewardCards>0){await page.locator('.card-reveal-dialog').getByRole('button',{name:/^Continue/}).click({force:true});await page.clock.runFor(32);}
      info=await page.evaluate(()=>window.__auditQA.info());
     }else if(info.status==='paused'&&result.unexpectedPause.diagnostics.findLast(d=>d.reason==='loop-stall')?.sector===info.sector){
      const before=info;(result.foregroundStallPauses||=[]).push(result.unexpectedPause);
      assert.equal(new URL(page.url()).pathname,'/game');
      await page.getByRole('button',{name:/^Resume/}).last().click({force:true});await page.clock.runFor(3200);
      info=await page.evaluate(()=>window.__auditQA.info());for(const key of ['owner','hearts','score','shards','paid','rapid'])assert.equal(info[key],before[key]);
     }
    }
    assert.equal(info.status,'playing',JSON.stringify(info));
    if(info.encounter==='normal'){
     const sector=info.sector;
     for(let group=0;group<4;group++){
      await page.evaluate(()=>window.__auditQA.protect());
      await page.clock.runFor(8200);
      if(sector===25 && group===0){
       const ids=await page.evaluate(()=>{window.__auditQA.timers();return window.__auditQA.stress();});await page.clock.runFor(64);
       const before=await page.evaluate(()=>window.__auditQA.info());await page.evaluate(()=>window.__auditQA.pause());await page.clock.runFor(30000);
       const paused=await page.evaluate(()=>window.__auditQA.info());for(const key of ['paid','rapid','score','shards'])assert.equal(paused[key],before[key]);
       await page.evaluate(()=>window.__auditQA.resume());await page.clock.runFor(5000);
       assert.equal(await page.evaluate(x=>window.__auditQA.remaining(x),ids),0);result.memeStressReleased=true;
       const visible=await page.evaluate(()=>window.__auditQA.info());
       await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new PageTransitionEvent('pagehide'));});
       await page.clock.runFor(60000);
       const hidden=await page.evaluate(()=>window.__auditQA.info());for(const key of ['paid','rapid','score','shards'])assert.equal(hidden[key],visible[key]);
       await page.evaluate(()=>{delete document.hidden;delete document.visibilityState;window.dispatchEvent(new PageTransitionEvent('pageshow'));document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(32);
       assert.equal((await page.evaluate(()=>window.__auditQA.info())).status,'paused');
       await page.evaluate(()=>window.__auditQA.resume());result.syntheticBackgroundProtected=true;
      }
      await page.evaluate(()=>window.__auditQA.clearGroup());await page.clock.runFor(64);
      info=await page.evaluate(()=>window.__auditQA.info());if(info.phase==='SECTOR_CLEAR')break;
     }
     assert.equal(info.phase,'SECTOR_CLEAR',JSON.stringify(info));assert.ok(!normal.includes(sector),'each completed block is counted once');normal.push(sector);await page.clock.runFor(8600);
    }else if(info.encounter==='boss-intro'||info.encounter==='boss-fight'){
     await page.clock.runFor(6000);await page.evaluate(()=>window.__auditQA.killBoss());await page.clock.runFor(11000);
     await page.evaluate(()=>window.__auditQA.heart());await page.clock.runFor(2400);await page.evaluate(()=>window.__auditQA.cards());await page.clock.runFor(1000);bosses.push(info.sector);
    }else if(info.encounter==='bonus'){
     await page.clock.runFor(8200);await page.evaluate(()=>window.__auditQA.clearBonus());await page.clock.runFor(100);await page.clock.runFor(8600);
    }else throw Error('unexpected encounter '+JSON.stringify(info));
    assert.equal(await page.locator('.formation-target').count(),0);
    await cdp.send('HeapProfiler.collectGarbage');const heap=await cdp.send('Runtime.getHeapUsage');
    snapshots.push({...(await page.evaluate(()=>window.__auditQA.info())),heapBytes:heap.usedSize,dom:await page.locator('*').count(),paint:await page.evaluate(()=>window.__auditPaintStats()),canvases:await page.evaluate(()=>Array.from(document.querySelectorAll('canvas'),c=>({width:c.width,height:c.height})))});
    result.latestDiagnostics=await page.evaluate(()=>JSON.parse(localStorage.getItem('cryptoid_game_diagnostics_v1')||'[]'));
    if(turns%5===0){persist();console.log(JSON.stringify({baseline,start,blocks:normal.length,bosses:bosses.length}));}
   }
   if(blockCount===30)assert.equal(bosses.length,3);
   const payload=await page.evaluate(()=>window.__auditQA.save());assert.ok(payload.combat);
   const before=await page.evaluate(()=>window.__auditQA.info());
   for(let n=0;n<10;n++)await page.evaluate(p=>window.__auditQA.restore(p),payload);
   const restored=await page.evaluate(()=>window.__auditQA.info());for(const key of ['owner','score','shards','hearts','paid','rapid'])assert.equal(restored[key],before[key]);
   await page.evaluate(()=>window.__auditQA.fault());await page.clock.runFor(100);
   const faultRoute=await page.locator('.admin-shell').count();
   if(baseline){assert.equal(faultRoute,1);}
   else{
    assert.equal(faultRoute,0);assert.equal(new URL(page.url()).pathname,'/game');assert.equal(await page.locator('[role="alert"]').count(),1);
    const paused=await page.evaluate(()=>window.__auditQA.info());for(const key of ['owner','score','shards','hearts','paid','rapid'])assert.equal(paused[key],before[key]);assert.equal(paused.status,'paused');
    await page.evaluate(()=>history.back());await page.clock.runFor(4000);
    assert.equal((await page.evaluate(()=>window.__auditQA.info())).status,'paused','Back cannot resume a failed, hidden scene');
    await page.evaluate(()=>window.__auditQA.clearFault());await page.getByRole('button',{name:'Try again',exact:true}).click({force:true});
    await page.clock.runFor(32);assert.equal(await page.locator('.game-field').count(),1);
    await page.getByRole('button',{name:/^Resume/}).last().click({force:true});await page.clock.runFor(3200);
    assert.equal((await page.evaluate(()=>window.__auditQA.info())).status,'playing');
    const position=await page.evaluate(()=>window.__auditQA.player());
    await page.dispatchEvent('.game-field','pointerdown',{pointerId:42,pointerType:'touch',clientX:80,clientY:700,isPrimary:true});
    await page.dispatchEvent('.game-field','pointermove',{pointerId:42,pointerType:'touch',clientX:140,clientY:650,isPrimary:true});
    assert.notDeepEqual(await page.evaluate(()=>window.__auditQA.player()),position,'input rebound after scene retry');
    await page.dispatchEvent('.game-field','pointerup',{pointerId:42,pointerType:'touch',clientX:140,clientY:650,isPrimary:true});
   }
   Object.assign(campaign,{complete:true,restoreTenTimes:true,parentRenderCaught:!baseline});persist();await context.close();
  }
  // Targeted higher-campaign resource paths, in addition to 30 consecutive blocks.
  if(!performanceOnly){
   const {context,page}=await create(true);result.higher=[];
   for(const sector of [101,481,500]){
    await page.evaluate(s=>window.__auditQA.seed(s),sector);await page.clock.runFor(6000);
    if(sector===500){await page.evaluate(()=>window.__auditQA.killBoss());await page.clock.runFor(11000);}
    else {await page.evaluate(()=>window.__auditQA.stress());await page.clock.runFor(5000);}
    result.higher.push(await page.evaluate(()=>window.__auditQA.info()));
    assert.equal(new URL(page.url()).pathname,'/game');
   }
   await context.close();persist();
  }
  if(!baseline && !performanceOnly){
   const {context,page}=await create();
   await page.evaluate(()=>localStorage.setItem('cryptoid_game_diagnostics_v1',JSON.stringify([{reason:'render-error',errorName:'TypeError',sector:25,phase:'FORMATION',encounter:'normal',status:'paused',width:390,height:844,browser:'fixture',at:'2026-10-12T12:00:00.000Z',buildId:'fixture-build',account:'must-be-removed',token:'must-be-removed',message:'must-be-removed'}])));
   const downloaded=page.waitForEvent('download');await page.goto(origin+'/?cryptoid_diagnostics=download');const download=await downloaded;
   const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
   assert.ok(exported.entries.some(x=>x.reason==='render-error'));assert.ok(exported.entries.length<=20);
   for(const entry of exported.entries)for(const key of ['account','token','message','stack'])assert.equal(key in entry,false);
   result.explicitLocalDownload={passed:true,entries:exported.entries.length,fileName:download.suggestedFilename()};await context.close();persist();
  }
  // Native real-time scheduling, separate from virtual campaign time.
  {
   const {context,page}=await create();await page.evaluate(()=>window.__auditQA.seed(25));
   await page.bringToFront();await page.waitForTimeout(5000);
   result.beforeSampling=await page.evaluate(()=>({info:window.__auditQA.info(),visibility:document.visibilityState,focused:document.hasFocus(),diagnostics:JSON.parse(localStorage.getItem('cryptoid_game_diagnostics_v1')||'[]')}));
   await page.evaluate(()=>{window.__auditQA.protect();window.__auditQA.resume();window.__auditFrames=[];window.__auditQA.stress();});
   await page.waitForTimeout(Number(process.env.CRYPTOID_AUDIT_REAL_MS||20000));
   result.realTime={...(summary(await page.evaluate(()=>window.__auditFrames))),uuidCalls:await page.evaluate(()=>window.__auditUUIDs),objects:await page.evaluate(()=>window.__auditQA.info())};
   result.realTime.diagnostics=await page.evaluate(()=>JSON.parse(localStorage.getItem('cryptoid_game_diagnostics_v1')||'[]'));
   assert.ok(result.realTime.samples>30,'real-time measurement requires running RAF, not a paused page');
   await page.screenshot({path:output.replace(/\.json$/,'-real.png')});await context.close();
  }
  result.passed=true;persist();console.log(JSON.stringify({passed:true,baseline,campaigns:result.campaigns.map(c=>({start:c.start,blocks:c.normal.length,bosses:c.bosses.length})),orphanGuard:result.orphanGuard,realTime:result.realTime}));
 } finally {persist();if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
