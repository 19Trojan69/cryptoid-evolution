// Real handlers, isolated account and local-only Vite hooks; never live purchases.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const repo=path.resolve(__dirname,'../..'),testFile=path.join(repo,'backend/src/handlers/progress.test.mjs'),req=createRequire(testFile);
const src=fs.readFileSync(testFile,'utf8').split('const get =')[1].split('const snapshot =')[0];
const harness=new Function('require','const get ='+src+'\nreturn harness;')(req);
const {emptyPlayerSave,firstMissionSnapshot}=req('../../build/playerSave.js');
const {emptyRewardProgress}=req('../../build/rewardRules.js');
(async()=>{
 const {createServer}=await import(path.join(repo,'frontend/node_modules/vite/dist/node/index.js'));
 const hooks=`(window as any).__weaponQA={inspect:()=>stateRef.current,expire:()=>{const state=stateRef.current;state.phase='ATTACK_CYCLE';state.encounter='boss-fight';state.weaponTimers[state.paidWeaponLevel]=1;state.paidWeaponMs=1;setGame({...state});}};`;
 const server=await createServer({root:path.join(repo,'frontend'),cacheDir:path.join(repo,'frontend/node_modules/.vite-card-baseline'),logLevel:'error',define:{'import.meta.env.VITE_BACKEND_URL':JSON.stringify('/api')},server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'reward-qa',enforce:'pre',transform(code,id){
  if(id.endsWith('/shipFleet.ts'))return code.replace(/export const shipSaveNetwork = [^;]+;/, 'export const shipSaveNetwork: ShipSaveNetwork = \"testnet\";');
  if(id.endsWith('/GamePage.tsx'))return code.replace('  const levelLabel =',hooks+'\n  const levelLabel =');
 }}]});
 await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
 const browser=await chromium.launch({executablePath:process.env.CRYPTOID_CHROMIUM||path.resolve(repo,'../chromium'),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const evidence=process.env.CRYPTOID_EVIDENCE_DIR||path.resolve(repo,'../evidence');fs.mkdirSync(evidence,{recursive:true});
 const results=[],errors=[];let paidCalls=0;
 try{
  for(const scenario of ['success','lost','off','empty','rapid']){
   const level=scenario==='rapid'?3:2, product=level===3?'weapon_rapid_twin':'weapon_twin', name=level===3?'Rapid Twin':'Twin Laser';
   const h=harness();await h.call('progress','/me',null,{method:'GET'});const stage=10;
   Object.assign(h.profile(),{...emptyPlayerSave(),version:1,legacyImported:true,cardReveals:['grey-scout-1'],mission:{sector:stage,phase:'boss',rulesVersion:2,snapshot:firstMissionSnapshot(3),savedAt:new Date().toISOString()}});
   h.docs[0].rewardsByNetwork={testnet:emptyRewardProgress()};
   h.docs[0].rewardEventKeys={testnet:[]};for(let s=1;s<stage;s++)if(s%10){h.docs[0].rewardEventKeys.testnet.push('block:'+s);if(s%10===9)h.docs[0].rewardEventKeys.testnet.push('chain:'+Math.ceil(s/10));}else h.docs[0].rewardEventKeys.testnet.push('boss:'+s/10,'bonus:'+s/10);
   const viewport={width:{success:390,lost:1440,off:320,empty:768,rapid:844}[scenario],height:scenario==='rapid'?390:900};
   const context=await browser.newContext({viewport,locale:'en-US'});
   await context.addInitScript(()=>{window.Pi={init(){}};localStorage.setItem('cryptoid_pi_session','1');localStorage.setItem('cryptoid_language','en');localStorage.setItem('cryptoid_home_music','off');});
   h.orders.push({user:'pilot-a',paid:true,product_id:product,pi_payment_id:'reload-fixture',quantity:scenario==='empty'?1:scenario==='lost'?2:3,weapon_model:2,payment_network:'Pi Testnet'});
   const apiErrors=[],activationIds=[];let loseReply=scenario==='lost';
   await context.route('**/*',async route=>{
    const u=new URL(route.request().url());if(u.origin!==origin)return route.fulfill({contentType:'application/javascript',body:''});
    if(!u.pathname.startsWith('/api/'))return route.continue();
    const [group,...parts]=u.pathname.slice(5).split('/'),endpoint='/'+parts.join('/');let response;
    if(group==='payments'||group==='payment'){paidCalls++;return route.abort('failed');}
    if(group==='user')response={code:200,body:{user:{uid:'pilot-a',username:'QA'},canAdmin:false,adminMode:false}};
    else if(group==='usage')response={code:204};
    else if(['progress','rewards','hangar','leaderboard'].includes(group)){
      response=await h.call(group,endpoint,route.request().postDataJSON(),{method:route.request().method()});
      if(group==='hangar'&&endpoint==='/start'&&response.code===200){h.session.scoreRun.startedAt-=60_000;h.profile().lastStart.runMeta.startedAt=h.session.scoreRun.startedAt;}
    }else response={code:200,body:{}};
    if(endpoint==='/weapon/activate'){activationIds.push(route.request().postDataJSON().requestId);if(activationIds.length===2&&loseReply){loseReply=false;return route.abort('failed');}}
    if(response.code>=400)apiErrors.push({endpoint,status:response.code,body:response.body});
    return route.fulfill({status:response.code,contentType:'application/json',body:response.code===204?'':JSON.stringify(response.body)});
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
   await page.goto(origin+'/game');await page.getByRole('button',{name:'Resume',exact:true}).click();

   await page.waitForFunction(()=>window.__weaponQA?.inspect().status==='playing');
   const access=page.locator('.mission-shop-access');
   const box=await access.boundingBox();assert.ok(box.width===60&&box.height===60);
   await page.screenshot({path:`${evidence}/weapons-access-${viewport.width}.png`});
   await access.click();
   const toggle=page.getByRole('switch',{name:`Auto-reload · ${name}`,exact:true});await toggle.waitFor();
   await page.waitForFunction(()=>document.querySelector('[role="switch"]:not(:disabled)'));
   assert.equal(await toggle.getAttribute('aria-checked'),'false');
   if(scenario!=='off') await toggle.click();
   assert.equal(await page.getByRole('switch',{name:`Auto-reload · ${level===3?'Twin Laser':'Rapid Twin'}`,exact:true}).getAttribute('aria-checked'),'false');
   assert.equal(await page.getByRole('switch',{name:'Auto-reload · Triple Laser',exact:true}).isEnabled(),false);
   await page.locator(`.mission-weapon-card[data-level="${level}"] .mission-select`).click();
   await page.waitForFunction(()=>window.__weaponQA.inspect().weaponSource==='paid');
   assert.equal(activationIds.length,1);
   await page.screenshot({path:`${evidence}/weapons-menu-${viewport.width}.png`});
   await page.getByRole('button',{name:/Back to game/}).click();await page.clock.runFor(3100);
   await page.evaluate(()=>window.__weaponQA.expire());await page.clock.runFor(40);
   if(['success','lost','rapid'].includes(scenario)){
    if(scenario==='lost'){
     await page.getByRole('alert').filter({hasText:'Not confirmed'}).waitFor();
     assert.equal(h.docs[0].weaponStockByNetwork.testnet.balances[product],scenario==='lost'?0:1);
     await page.locator(`.mission-weapon-card[data-level="${level}"] .mission-select`).click();
    }
    await page.waitForFunction(()=>window.__weaponQA.inspect().paidWeaponMs>59000);
    assert.equal(h.docs[0].weaponStockByNetwork.testnet.balances[product],scenario==='lost'?0:1);
    assert.equal(new Set(activationIds).size,2);
   }else{
    await page.clock.runFor(500);assert.equal(activationIds.length,1);
    assert.equal(await page.evaluate(()=>window.__weaponQA.inspect().weaponSource),'standard');
   }
   if(scenario==='lost'){
    await page.reload();await page.getByRole('button',{name:'Resume',exact:true}).click();
    await page.waitForFunction(()=>window.__weaponQA?.inspect().status==='playing');await access.click();
    await page.getByRole('switch',{name:`Auto-reload · ${name}`,exact:true}).waitFor();
    assert.equal(await toggle.getAttribute('aria-checked'),'true','preference survives reload');
    assert.equal(activationIds.length,3,'resuming does not consume another charge');
   }
   if(scenario==='success'){
    await access.click();assert.equal(await toggle.getAttribute('aria-checked'),'true');
    await toggle.click();await page.getByRole('button',{name:/Back to game/}).click();await page.clock.runFor(3100);
    await page.evaluate(()=>window.__weaponQA.expire());await page.clock.runFor(100);
    assert.equal(activationIds.length,2,'switching off stops further consumption');
   }
   if(scenario==='empty'){
    await access.click();await page.evaluate(()=>{localStorage.setItem('cryptoid_language','de');window.dispatchEvent(new Event('cryptoid-language'));});
    await page.getByRole('heading',{name:'Shop & Waffen'}).waitFor();
    await page.screenshot({path:`${evidence}/weapons-menu-de.png`});
   }
   const pref=await page.evaluate(()=>localStorage.getItem('cryptoid_auto_reload:testnet:pilot-a'));
   results.push({scenario,viewport,access:box,activationRequests:activationIds.length,uniqueActivations:new Set(activationIds).size,preferences:pref,stock:h.docs[0].weaponStockByNetwork.testnet.balances[product]});
   assert.deepEqual(apiErrors,[]);await context.close();
  }
  assert.deepEqual(errors,[]);assert.equal(paidCalls,0);console.log(JSON.stringify({results,errors,paidCalls},null,2));
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
