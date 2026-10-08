// Runs the actual GamePage loop against isolated backend handlers. No live accounts.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), { createRequire } = require('node:module');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const repo = path.resolve(__dirname, '../..');
const testFile = path.join(repo, 'backend/src/handlers/progress.test.mjs'), req = createRequire(testFile);
const source = fs.readFileSync(testFile, 'utf8').split('const get =')[1].split('const snapshot =')[0];
const harness = new Function('require', 'const get =' + source + '\nreturn harness;')(req);
const { emptyPlayerSave, firstMissionSnapshot } = req('../../build/playerSave.js');
(async () => {
 const { createServer } = await import(path.join(repo, 'frontend/node_modules/vite/dist/node/index.js'));
 const hooks = `
 (window as any).__stability = {
 inspect: () => JSON.parse(JSON.stringify(stateRef.current)),
 pauseRaf: () => window.cancelAnimationFrame(animationRef.current!),
 seedEffect: () => stateRef.current.effects.push({id:nextIdRef.current++,kind:'explosion',x:100,y:200,startedAt:performance.now()}),
 effectAge: () => performance.now()-stateRef.current.effects[stateRef.current.effects.length-1].startedAt,
 wallet: () => totalShards,
 save: saveCombat,
 reward: (n: number) => { stateRef.current.shards += n; },
 prepare: (level: number, encounter = 'normal') => {
   const s=stateRef.current; const {width,height}=fieldSizeRef.current;
   Object.assign(s,{sector:level,section:level,encounter,phase:'ATTACK_CYCLE',asteroids:[],shots:[],enemyShots:[],powerUps:[],effects:[],player:{x:.5,y:.85},hearts:3,shieldCharges:0,shieldMs:0,purchasedShieldMs:0,projectileGuard:0,empMs:0});
   lastPlayerRef.current={...s.player}; impactCooldownRef.current=0;
   s.boss=encounter==='boss-fight'?createSectorBoss(level,width,visibleTopRef.current,height):null;
   if(s.boss)s.boss.elapsed=BOSS_ENTRY_MS+100;
   sectionSlotsRef.current=createFormationSlots(level,level,width,height,visibleTopRef.current);
   formationIndexRef.current=0; formationStartedRef.current=true; sectionElapsedRef.current=0;
   setGame({...s});
 },
 shot: (guard=0,shield=0) => {const s=stateRef.current;const {width,height}=fieldSizeRef.current;s.projectileGuard=guard;s.shieldCharges=shield;s.shieldMs=shield?5000:0;s.enemyShots.push({id:nextIdRef.current++,x:s.player.x*width,y:s.player.y*height,vx:0,vy:.2,radius:3,weaponKind:'laser',weaponWidth:3});},
 clear: () => {const s=stateRef.current;s.phase='SECTOR_CLEAR';s.asteroids=[];s.shots=[{id:nextIdRef.current++,x:50,y:200,speedX:0,damage:1,empowered:false}];s.enemyShots=[];s.powerUps=[{id:nextIdRef.current++,x:20,y:200,type:'shield'}];s.pickupNotice={id:1,type:'shield',remainingMs:1000,level:1};clearTimerRef.current=SECTION_CLEAR_MS+100;setGame({...s});},
 killBoss: () => {if(stateRef.current.boss)destroyBoss(stateRef.current,performance.now());},
 collectHeart: () => {stateRef.current.player={...BOSS_HEART_POSITION};lastPlayerRef.current={...stateRef.current.player};},
 lethalEnemy: () => {const s=stateRef.current;const {width,height}=fieldSizeRef.current;const slots=createFormationSlots(1,1,width,height,visibleTopRef.current);const e=spawnAsteroid(nextIdRef.current++,width,visibleTopRef.current,0,1,slots);Object.assign(e,{x:width/2,y:height*.3,entryTargetX:width/2,entryTargetY:height*.3,entryElapsed:e.entryDuration,formationElapsed:e.formationDuration,health:1,maxHealth:1});s.asteroids=[e];s.shots=[{id:nextIdRef.current++,x:e.x,y:e.y+10,speedX:0,damage:1,empowered:false}];setGame({...s});return e.id;},
 };
 `;
 const server = await createServer({ root:path.join(repo,'frontend'), logLevel:'error', define:{'import.meta.env.VITE_BACKEND_URL':JSON.stringify('/api')}, server:{host:'127.0.0.1',port:0,hmr:false}, plugins:[{ name:'local-stability-qa',enforce:'pre', transform(code,id) { if(id.endsWith('/GamePage.tsx')) return code.replace('  const levelLabel =',hooks+'\n  const levelLabel ='); } }] });
 await server.listen(); const origin = 'http://127.0.0.1:'+server.httpServer.address().port;
 const browser = await chromium.launch({executablePath:process.env.CRYPTOID_CHROMIUM,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const results=[], errors=[];
 try {
  for(const viewport of [{width:390,height:844},{width:1280,height:800}]) {
   const context=await browser.newContext({viewport,locale:'en-US'});
   await context.addInitScript(()=>{if(location.protocol==='about:')return;window.Pi={init(){}};localStorage.setItem('cryptoid_language','en');localStorage.setItem('cryptoid_home_music','off');localStorage.setItem('cryptoid_effects_volume','0');});
   await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.fulfill({body:''});if(u.pathname.startsWith('/api/'))return route.fulfill({status:u.pathname==='/api/user/me'?401:200,contentType:'application/json',body:'{}'});return route.continue();});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
   await page.goto(origin+'/game');await page.waitForFunction(()=>window.__stability);
   // Resolve network-specific guest key through the actual module, not an assumed key.
   const key=await page.evaluate(async()=>{const m=await import('/src/pages/shipFleet.ts');localStorage.setItem(m.SHARD_BALANCE_KEY,'1250');return m.SHARD_BALANCE_KEY;});
   await page.reload();await page.waitForFunction(()=>window.__stability);
   assert.equal(await page.evaluate(()=>window.__stability.wallet()),1250);
   await page.evaluate(()=>window.__stability.reward(20));await page.clock.runFor(80);
   assert.equal(await page.locator('.shard-line b').innerText(),'◆ 1270');
   assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'1270');
   await page.reload();await page.waitForFunction(()=>window.__stability);assert.equal(await page.evaluate(()=>window.__stability.wallet()),1270);
   // Actual damage dispatch, shield consumption, hull armor and I-frames.
   await page.evaluate(()=>{window.__stability.prepare(10,'boss-fight');window.__stability.shot();});await page.clock.runFor(50);
   assert.equal(await page.evaluate(()=>window.__stability.inspect().hearts),2);
   await page.evaluate(()=>window.__stability.shot());await page.clock.runFor(50);assert.equal(await page.evaluate(()=>window.__stability.inspect().hearts),2);
   await page.evaluate(()=>{window.__stability.prepare(10,'boss-fight');window.__stability.shot(1);});await page.clock.runFor(50);assert.equal(await page.evaluate(()=>window.__stability.inspect().hearts),3);assert.equal(await page.evaluate(()=>window.__stability.inspect().projectileGuard),0);
   await page.evaluate(()=>{window.__stability.prepare(10,'boss-fight');window.__stability.shot(0,1);});await page.clock.runFor(50);assert.equal(await page.evaluate(()=>window.__stability.inspect().hearts),3);assert.equal(await page.evaluate(()=>window.__stability.inspect().shieldCharges),0);
   // Enemy and explosion swap in the same rendered frame, with an opaque start.
   await page.evaluate(()=>window.__stability.prepare(1));await page.evaluate(()=>window.__stability.lethalEnemy());await page.clock.runFor(50);
   assert.equal(await page.evaluate(()=>window.__stability.inspect().asteroids.length),0);
   assert.ok(await page.locator('.impact-effect.explosion,.impact-effect.shatter').count());
   const effect=page.locator('.impact-effect.explosion,.impact-effect.shatter').first();
   const visible=await effect.evaluate(el=>{const a=el.getAnimations({subtree:true}).find(a=>a.animationName==='enemy-destruction-fire');return a.effect.getKeyframes()[0].opacity;});assert.equal(Number(visible),1);
   // Each boundary preserves the player and starts with no leftover bullets/pickups.
   for(const stage of [1,9,11,499]) {
    await page.evaluate(n=>{window.__stability.prepare(n);window.__stability.clear();},stage);await page.clock.runFor(50);
    const s=await page.evaluate(()=>window.__stability.inspect());assert.equal(s.sector,stage+1);assert.equal(s.encounter,stage%10===9?'boss-intro':'normal');assert.equal(s.shots.length+s.enemyShots.length+s.powerUps.length,0);assert.equal(s.pickupNotice,null);assert.equal(s.player.y,.85);
   }
   await page.evaluate(()=>{window.__stability.prepare(10,'boss-fight');window.__stability.killBoss();});await page.clock.runFor(11000);
   assert.equal(await page.evaluate(()=>window.__stability.inspect().encounter),'boss-clear');
   await page.evaluate(()=>window.__stability.collectHeart());await page.clock.runFor(3200);
   if(await page.locator('.card-reveal-dialog').count()) { await page.getByRole('button',{name:/Continue/}).click(); await page.clock.runFor(100); }
   assert.equal(await page.evaluate(()=>window.__stability.inspect().encounter),'bonus',JSON.stringify(await page.evaluate(()=>window.__stability.inspect())));
   await page.evaluate(()=>window.__stability.clear());await page.clock.runFor(50);assert.equal(await page.evaluate(()=>window.__stability.inspect().sector),11);
   await page.screenshot({path:path.join(repo,'../package1-'+viewport.width+'.png')});
   results.push({viewport,guestWallet:'1250 → 1270 → reload 1270',damage:'hit, immunity, shield, armor passed',explosion:'opaque first frame',transitions:'block, boss, bonus passed'});
   await context.close();
  }
  // Browser -> real handlers -> isolated data -> resume HUD, including durable saves.
  const h=harness();await h.call('progress','/me',null,{method:'GET'});
  Object.assign(h.profile(),{...emptyPlayerSave(),version:1,balance:1270,legacyImported:true,cardReveals:['grey-scout-1'],creditedShards:20,mission:{sector:1,phase:'normal',rulesVersion:2,snapshot:{...firstMissionSnapshot(3),shards:20},savedAt:new Date().toISOString()}});
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-US'});
  await context.addInitScript(()=>{if(location.protocol==='about:')return;window.Pi={init(){}};localStorage.setItem('cryptoid_pi_session','1');localStorage.setItem('cryptoid_language','en');localStorage.setItem('cryptoid_home_music','off');localStorage.setItem('cryptoid_effects_volume','0');});
  const apiErrors=[];
  await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==origin)return route.fulfill({body:''});if(!u.pathname.startsWith('/api/'))return route.continue();const [group,...parts]=u.pathname.slice(5).split('/'),endpoint='/'+parts.join('/');let r;
   if(group==='user')r={code:200,body:{user:{uid:'pilot-a',username:'QA'},canAdmin:false}};
   else if(group==='usage')r={code:204};
   else if(['progress','hangar','rewards','leaderboard'].includes(group)){r=await h.call(group,endpoint,route.request().postDataJSON(),{method:route.request().method()});if(group==='hangar'&&endpoint==='/start'&&r.code===200){h.session.scoreRun.startedAt-=60000;h.profile().lastStart.runMeta.startedAt=h.session.scoreRun.startedAt;}}
   else r={code:200,body:{}};
   if(r.code>=400)apiErrors.push({endpoint,code:r.code,body:r.body});return route.fulfill({status:r.code,contentType:'application/json',body:r.code===204?'':JSON.stringify(r.body)});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(origin+'/game');await page.getByRole('button',{name:'Resume',exact:true}).click();await page.waitForFunction(()=>window.__stability?.inspect().status==='playing');
  assert.equal(await page.evaluate(()=>window.__stability.wallet()),1270);
  await page.evaluate(()=>window.__stability.reward(15));await page.clock.runFor(80);await page.evaluate(()=>window.__stability.save());
  assert.equal(h.profile().balance,1285);assert.equal(await page.evaluate(()=>window.__stability.wallet()),1285);
  await page.reload();await page.getByRole('button',{name:'Resume',exact:true}).click();await page.waitForFunction(()=>window.__stability?.inspect().status==='playing');assert.equal(await page.evaluate(()=>window.__stability.wallet()),1285);assert.equal(h.profile().balance,1285);
  // Verify lives persist through the real checkpoint endpoint, not only local state.
  await page.evaluate(()=>window.__stability.shot());await page.clock.runFor(80);await page.evaluate(()=>window.__stability.save());
  assert.equal(h.profile().mission.snapshot.hearts,2);
  await page.reload();await page.getByRole('button',{name:'Resume',exact:true}).click();await page.waitForFunction(()=>window.__stability?.inspect().status==='playing');assert.equal(await page.evaluate(()=>window.__stability.inspect().hearts),2);
  // Finish the previous page's outbox before changing the isolated fixture.
  await page.getByRole('button',{name:'Pause',exact:true}).click();await page.evaluate(()=>window.__stability.save());await page.goto('about:blank');
  // Isolated fixture starts a new boss checkpoint; actual death/save/restore is exercised below.
  Object.assign(h.profile(),{mission:{sector:10,phase:'boss',rulesVersion:2,snapshot:firstMissionSnapshot(3),savedAt:new Date().toISOString()},version:h.profile().version+1,creditedShards:0,creditedDestroyed:0});
  h.docs[0].rewardEventKeys={testnet:[...Array.from({length:9},(_,i)=>'block:'+(i+1)),'chain:1']};
  await page.goto(origin+'/game');await page.getByRole('button',{name:'Resume',exact:true}).click();await page.waitForFunction(()=>window.__stability?.inspect().status==='playing');
  await page.evaluate(()=>window.__stability.killBoss());await page.clock.runFor(80);await page.evaluate(()=>window.__stability.save());
  assert.equal(h.profile().mission.combat.encounter,'boss-clear');
  const savedBalance=h.profile().balance;
  await page.reload();await page.getByRole('button',{name:'Resume',exact:true}).click();await page.waitForFunction(()=>window.__stability?.inspect().status==='playing');await page.clock.runFor(80);
  assert.equal(await page.evaluate(()=>window.__stability.inspect().encounter),'boss-clear');assert.equal(await page.locator('.boss-falling-hull').count(),0);assert.equal(h.profile().balance,savedBalance);
  await page.evaluate(()=>window.__stability.collectHeart());await page.clock.runFor(80);assert.equal(await page.evaluate(()=>window.__stability.inspect().hearts),4);
  // App switching pauses immediately rather than letting hidden simulation or audio continue.
  await page.evaluate(()=>window.__stability.seedEffect());
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.evaluate(()=>window.__stability.inspect().status),'paused');
  await page.evaluate(()=>window.__stability.pauseRaf());await page.clock.fastForward(60000);
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'});document.dispatchEvent(new Event('visibilitychange'));});
  assert.ok(Math.abs(await page.evaluate(()=>window.__stability.effectAge()))<80,'stopped background RAF does not age out paused explosions');
  assert.deepEqual(apiErrors,[]);assert.deepEqual(errors,[]);results.push({accountResume:'1270 + 15 = 1285, save/reload without duplicate credit',lives:'loss survives reload',bossClearResume:'heart available, no duplicate destruction/reward',appSwitch:'pauses immediately'});
  console.log(JSON.stringify({results,errors},null,2));await context.close();
 } finally {await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
