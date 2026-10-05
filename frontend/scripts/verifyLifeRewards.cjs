// Real handlers, isolated account and local-only Vite hooks; never live purchases.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const repo=path.resolve(__dirname,'../..'),testFile=path.join(repo,'backend/src/handlers/progress.test.mjs'),req=createRequire(testFile);
const src=fs.readFileSync(testFile,'utf8').split('const get =')[1].split('const snapshot =')[0];
const harness=new Function('require','const get ='+src+'\nreturn harness;')(req);
const {emptyPlayerSave,firstMissionSnapshot}=req('../../build/playerSave.js');
const {emptyRewardProgress}=req('../../build/rewardRules.js');
(async()=>{
 const {createServer}=await import(path.join(repo,'frontend/node_modules/vite/dist/node/index.js'));
 const hooks=`(window as any).__rewardQA={inspect:()=>stateRef.current,finishBoss:()=>{Object.assign(stateRef.current,{phase:'SECTOR_CLEAR',encounter:'boss-clear',boss:null,bossHeartCollected:false,player:{...BOSS_HEART_POSITION},asteroids:[],enemyShots:[],shots:[],status:'playing'});clearTimerRef.current=BOSS_CLEAR_DURATION_MS+100;bossDestroyPlayedRef.current=true;bossVictoryPendingRef.current=false;musicRef.current?.pause();setGame({...stateRef.current});}};`;
 const server=await createServer({root:path.join(repo,'frontend'),cacheDir:path.join(repo,'frontend/node_modules/.vite-card-baseline'),logLevel:'error',define:{'import.meta.env.VITE_BACKEND_URL':JSON.stringify('/api')},server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'reward-qa',enforce:'pre',transform(code,id){
  if(id.endsWith('/GamePage.tsx'))return code.replace('  const levelLabel =',hooks+'\n  const levelLabel =');
  if(id.endsWith('/gameAudio.ts'))return code+'\n(window as any).__sounds=[];const qaPlay=GameAudio.prototype.play;GameAudio.prototype.play=function(sound,level){(window as any).__sounds.push(sound);return qaPlay.call(this,sound,level);};';
 }}]});
 await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
 const browser=await chromium.launch({executablePath:process.env.CRYPTOID_CHROMIUM||path.resolve(repo,'../chromium'),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const results=[],errors=[];
 try{
  for(const scenario of ['first','repeat','locked','ship']){
   const h=harness();await h.call('progress','/me',null,{method:'GET'});const stage=scenario==='locked'?40:10;
   Object.assign(h.profile(),{...emptyPlayerSave(),version:1,legacyImported:true,cardReveals:scenario==='ship'?[]:['grey-scout-1'],mission:{sector:stage,phase:'boss',rulesVersion:2,snapshot:firstMissionSnapshot(3),savedAt:new Date().toISOString()}});
   if(scenario==='ship') h.profile().fleet={'grey-scout':{grey:1},'dark-delta':{grey:1},verdant:{grey:1}};
   h.docs[0].rewardsByNetwork={testnet:emptyRewardProgress()};if(scenario==='repeat')h.docs[0].rewardsByNetwork.testnet.bossWins[1]=1;
   h.docs[0].rewardEventKeys={testnet:[]};for(let s=1;s<stage;s++)if(s%10){h.docs[0].rewardEventKeys.testnet.push('block:'+s);if(s%10===9)h.docs[0].rewardEventKeys.testnet.push('chain:'+Math.ceil(s/10));}else h.docs[0].rewardEventKeys.testnet.push('boss:'+s/10,'bonus:'+s/10);
   const viewport=scenario==='repeat'?{width:1280,height:800}:{width:390,height:844};
   const context=await browser.newContext({viewport,locale:'en-US'});
   await context.addInitScript(()=>{window.Pi={init(){}};localStorage.setItem('cryptoid_pi_session','1');localStorage.setItem('cryptoid_language','en');localStorage.setItem('cryptoid_home_music','off');});
   const apiErrors=[];
   await context.route('**/*',async route=>{
    const u=new URL(route.request().url());if(u.origin!==origin)return route.fulfill({contentType:'application/javascript',body:''});
    if(!u.pathname.startsWith('/api/'))return route.continue();
    const [group,...parts]=u.pathname.slice(5).split('/'),endpoint='/'+parts.join('/');let response;
    if(group==='user')response={code:200,body:{user:{uid:'pilot-a',username:'QA'},canAdmin:false,adminMode:false}};
    else if(group==='usage')response={code:204};
    else if(['progress','rewards','hangar','leaderboard'].includes(group)){
      response=group==='hangar'&&endpoint==='/catalog'?{code:200,body:{offers:[]}}:await h.call(group,endpoint,route.request().postDataJSON(),{method:route.request().method()});
      if(group==='hangar'&&endpoint==='/start'&&response.code===200){h.session.scoreRun.startedAt-=60_000;h.profile().lastStart.runMeta.startedAt=h.session.scoreRun.startedAt;}
    }else response={code:200,body:{}};
    if(response.code>=400)apiErrors.push({endpoint,status:response.code,body:response.body});
    return route.fulfill({status:response.code,contentType:'application/json',body:response.code===204?'':JSON.stringify(response.body)});
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
   await page.goto(origin+'/game');await page.getByRole('button',{name:'Resume',exact:true}).click();
   if(scenario==='ship'){
     await page.waitForFunction(()=>window.__rewardQA?.inspect().status==='playing');
     assert.equal(await page.locator('.card-reveal-dialog').count(),0,'Existing fleet never opens a start card queue, even with no prior receipts');
     await page.waitForTimeout(100);
     assert.ok(['grey-scout-1','dark-delta-1','verdant-1'].every(key=>h.profile().cardReveals.includes(key)));
     // Simulate a fresh client or cleared browser storage; old start payload may also be cached.
     await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('cryptoid_card_reveals'))localStorage.removeItem(key);});
     await page.reload();await page.getByRole('button',{name:'Resume',exact:true}).click();
     await page.waitForFunction(()=>window.__rewardQA?.inspect().status==='playing');
     assert.equal(await page.locator('.card-reveal-dialog').count(),0);
     results.push({scenario,existingFleetSilent:'passed',freshClient:'passed'});await context.close();continue;
   }
   await page.waitForFunction(()=>window.__rewardQA?.inspect().status==='playing');
   assert.equal(await page.locator('.card-reveal-dialog').count(),0,'account receipts suppress starter cards on a fresh device');
   await page.evaluate(()=>window.__rewardQA.finishBoss());await page.clock.runFor(34);
   assert.equal(await page.locator('.boss-extra-life').innerText(),'EXTRA LIFE\n+1 ♥');
   assert.equal(await page.locator('.card-reveal-dialog').count(),0);assert.equal(await page.evaluate(()=>window.__rewardQA.inspect().hearts),4);
   const fieldStyle=await page.locator('.game-field').evaluate(e=>{const s=getComputedStyle(e);return {opacity:s.opacity,filter:s.filter};});assert.deepEqual(fieldStyle,{opacity:'1',filter:'none'});
   await page.clock.runFor(1200);assert.equal(await page.locator('.card-reveal-dialog').count(),0);assert.equal(await page.locator('.boss-extra-life').count(),1);
   await page.screenshot({path:path.resolve(repo,`../extra-life-${scenario}.png`)});
   await page.clock.runFor(2200);
   assert.equal(await page.locator('.boss-extra-life').count(),0);
   assert.equal(await page.evaluate(()=>window.__sounds.filter(s=>s==='extraLife').length),1);
   if(scenario==='first'){
     await page.waitForSelector('.card-reveal-dialog');assert.ok(h.profile().cardReveals.includes('boss-1'));
     await page.getByRole('button',{name:/Continue/}).click();await page.clock.runFor(100);
   }else assert.equal(await page.locator('.card-reveal-dialog').count(),0,'repeat and locked bosses have no popup');
   assert.equal(await page.evaluate(()=>window.__rewardQA.inspect().encounter),'bonus');
   assert.equal(h.profile().mission.snapshot.hearts,4);assert.deepEqual(apiErrors,[]);assert.deepEqual(errors,[]);
   results.push({scenario,lifeBeforeCard:'passed',jingleOnce:'passed',bonus:'passed',viewport,fieldStyle});await context.close();
  }
  console.log(JSON.stringify({results,errors},null,2));
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
