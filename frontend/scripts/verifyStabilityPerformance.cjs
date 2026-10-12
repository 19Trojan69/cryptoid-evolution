// Local-only instrumentation of the actual GamePage. No QA hooks enter a build.
// Accelerated transitions verify lifetime/phase logic, not player skill/balance.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const repo=path.resolve(__dirname,'../..'),output=process.env.CRYPTOID_STABILITY_OUT||'/tmp/cryptoid-stability.json';
const hooks=`
 (window as any).__stabilityQA={
  info:()=>({sector:stateRef.current.sector,encounter:stateRef.current.encounter,phase:stateRef.current.phase,status:stateRef.current.status,hearts:stateRef.current.hearts,score:stateRef.current.score,shards:stateRef.current.shards,enemies:stateRef.current.asteroids.length,shots:stateRef.current.shots.length,hostile:stateRef.current.enemyShots.length,effects:stateRef.current.effects.length,paid:stateRef.current.paidWeaponMs,rapid:stateRef.current.rapidFireMs,paintTier:performanceRef.current.level}),
  clearGroup:()=>{stateRef.current.asteroids=[];stateRef.current.shots=[];formationIndexRef.current=blockFlights(stateRef.current.sector,rulesVersionRef.current)[flightRef.current];},
  killBoss:()=>destroyBoss(stateRef.current,performance.now()),
  heart:()=>{stateRef.current.player={...BOSS_HEART_POSITION};lastPlayerRef.current={...stateRef.current.player};},
  clearBonus:()=>{stateRef.current.bonusTargets=[];bonusIndexRef.current=BONUS_TARGET_COUNT;},
  cards:()=>{rewardCardsRef.current=[];pendingBossCardRef.current=null;setRewardCards([]);stateRef.current.status='playing';lastFrameRef.current=0;},
  stress:()=>{const s=stateRef.current,{width,height}=fieldSizeRef.current;for(let i=0;i<80;i++){s.shots.push({id:nextIdRef.current++,x:i/80*width,y:height*.4,speedX:0,damage:1,empowered:false});s.enemyShots.push({id:nextIdRef.current++,x:i/80*width,y:height*.1,vx:0,vy:-.1,radius:3});}for(let i=0;i<12;i++)s.effects.push({id:nextIdRef.current++,kind:'explosion',x:(i%4+.5)*width/4,y:(Math.floor(i/4)+.5)*height/5,startedAt:performance.now(),sprite:i%20,debrisColor:'gold',debrisSize:72});},
  pause:()=>{stateRef.current.status='paused';setGame({...stateRef.current});},
  resume:()=>{stateRef.current.status='playing';lastFrameRef.current=0;setGame({...stateRef.current});},
  timers:()=>{Object.assign(stateRef.current,{paidWeaponLevel:2,paidWeaponMs:60000,weaponSource:'paid',weaponTimers:[0,0,60000,0,0,0],rapidFireMs:15000});},
  effectAge:()=>stateRef.current.effects.length?performance.now()-stateRef.current.effects[0].startedAt:0,
  fault:()=>interruptionRef.current('frame-error',new Error('controlled test failure')),
 };
`;
(async()=>{
 const {createServer}=await import(path.join(repo,'frontend/node_modules/vite/dist/node/index.js'));
 const server=await createServer({root:path.join(repo,'frontend'),logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'stability-qa',enforce:'pre',transform(code,id){
  if(id.endsWith('/GamePage.tsx'))return code.replace('  const levelLabel =',hooks+'\n  const levelLabel =');
  if(id.endsWith('/paintedShip.ts'))return code+'\n(window as any).__paintStats=paintedShipResourceStats;';
 }}]});await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
 let browser=null;const launch=()=>chromium.launch({executablePath:process.env.CRYPTOID_CHROMIUM,args:['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote']});
 const results=[],errors=[];
 try{
  for(const viewport of [{width:390,height:844},{width:1024,height:768}].filter(v=>!process.env.CRYPTOID_QA_VIEWPORT||v.width===Number(process.env.CRYPTOID_QA_VIEWPORT))){
   browser=await launch();
   const context=await browser.newContext({viewport,deviceScaleFactor:viewport.width===390?3:1});
   await context.addInitScript(()=>{window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'web'})};localStorage.setItem('cryptoid_language','en');localStorage.setItem('cryptoid_home_music','off');localStorage.setItem('cryptoid_effects_volume','0');});
   await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.fulfill({body:''});if(u.pathname.startsWith('/api/'))return route.fulfill({json:{}});return route.continue();});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(origin+'/game');await page.waitForFunction(()=>window.__stabilityQA);
   await page.evaluate(()=>window.__stabilityQA.cards());
   const cdp=await context.newCDPSession(page);await cdp.send('HeapProfiler.enable');
   const snapshots=[],normal=[],bosses=[];let turns=0;
   while(normal.length<Number(process.env.CRYPTOID_QA_BLOCKS||30)){
    if(++turns>45)throw Error('campaign failed to advance');
    let info=await page.evaluate(()=>window.__stabilityQA.info());
    assert.equal(info.status,'playing',JSON.stringify(info));
    if(info.encounter==='normal'){
     const sector=info.sector;
     for(let group=0;group<4;group++){
      await page.clock.runFor(8200);await page.evaluate(()=>window.__stabilityQA.clearGroup());await page.clock.runFor(60);
      info=await page.evaluate(()=>window.__stabilityQA.info());if(info.phase==='SECTOR_CLEAR')break;
     }
     assert.equal(info.phase,'SECTOR_CLEAR',JSON.stringify(info));normal.push(sector);
     if(sector===25){
      await page.evaluate(()=>{window.__stabilityQA.timers();window.__stabilityQA.stress();});await page.clock.runFor(40);
      const before=await page.evaluate(()=>window.__stabilityQA.info());await page.evaluate(()=>window.__stabilityQA.pause());await page.clock.runFor(3000);
      const paused=await page.evaluate(()=>window.__stabilityQA.info());assert.equal(paused.paid,before.paid);assert.equal(paused.rapid,before.rapid);
      await page.evaluate(()=>window.__stabilityQA.resume());await page.clock.runFor(2000);
     }
     await page.clock.runFor(8600);
    }else if(info.encounter==='boss-intro'||info.encounter==='boss-fight'){
     const sector=info.sector;await page.clock.runFor(6000);await page.evaluate(()=>window.__stabilityQA.killBoss());await page.clock.runFor(1000);
     assert.equal(await page.locator('.impact-effect.boss-explosion').count(),0,'defer the final blast');
     await page.clock.runFor(4100);assert.equal(await page.locator('.impact-effect.boss-explosion').count(),1);
     const fragments=await page.locator('.boss-debris-field .scattered-debris-piece').count();assert.ok(fragments<= (viewport.width===390?8:16));
     await page.clock.runFor(5000);await page.evaluate(()=>window.__stabilityQA.heart());await page.clock.runFor(2400);await page.evaluate(()=>window.__stabilityQA.cards());await page.clock.runFor(1000);bosses.push({sector,fragments});
    }else if(info.encounter==='bonus'){
     await page.clock.runFor(8200);await page.evaluate(()=>window.__stabilityQA.clearBonus());await page.clock.runFor(100);await page.clock.runFor(8600);
    }else throw Error('unexpected phase '+JSON.stringify(info));
    await cdp.send('HeapProfiler.collectGarbage');const heap=await cdp.send('Runtime.getHeapUsage');
    snapshots.push({...(await page.evaluate(()=>window.__stabilityQA.info())),heapBytes:heap.usedSize,dom:await page.locator('*').count(),paint:await page.evaluate(()=>window.__paintStats())});
    if(turns%5===0)console.log(JSON.stringify({viewport,completed:normal.length,bosses:bosses.length,sector:snapshots.at(-1).sector}));
   }
   if(normal.length>=25)assert.ok(normal.includes(25),'Meme Nebula 5/9');assert.equal(bosses.length,Math.floor(normal.length/9));assert.ok(snapshots.every(s=>s.effects<40&&s.enemies<=12&&s.paint.painted<=48&&s.paint.sources<=8));
   const beforeFault=await page.evaluate(()=>window.__stabilityQA.info());await page.evaluate(()=>window.__stabilityQA.fault());await page.clock.runFor(1000);
   const afterFault=await page.evaluate(()=>window.__stabilityQA.info());assert.equal(afterFault.status,'paused');for(const key of ['score','shards','hearts','sector','paid'])assert.equal(afterFault[key],beforeFault[key]);
   assert.equal(new URL(page.url()).pathname,'/game');await page.screenshot({path:output.replace(/\.json$/,`-${viewport.width}.png`)});
   results.push({viewport,normal,bosses,snapshots,faultPreservesRun:true});fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({results,errors,mode:'accelerated actual loop; forced group cleanup; no FPS inference'},null,2));await context.close();await browser.close();browser=null;
  }
  assert.deepEqual(errors,[]);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({results,errors,mode:'accelerated actual loop; forced group cleanup, real transitions and effects; no FPS inference'},null,2));console.log(JSON.stringify({passed:true,scenarios:results.map(r=>({viewport:r.viewport,blocks:r.normal.length,bosses:r.bosses.length})),errors}));
 }finally{if(browser)await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
