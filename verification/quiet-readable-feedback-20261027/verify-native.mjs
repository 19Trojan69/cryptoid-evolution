// Local actual GamePage/handler checks. Expiry/combat boundaries are isolated fixtures.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(new URL('../..', import.meta.url).pathname), require = createRequire(root + '/frontend/package.json');
const { createServer } = require('vite'), { chromium } = require(process.env.CRYPTOID_PLAYWRIGHT_MODULE || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const backendRequire = createRequire(root + '/backend/src/handlers/progress.test.mjs');
const harnessSource = readFileSync(root + '/backend/src/handlers/progress.test.mjs', 'utf8');
const harness = new Function('require', harnessSource.slice(harnessSource.indexOf('const get ='), harnessSource.indexOf('const snapshot =')) + '\nreturn harness;')(backendRequire);
const { emptyPlayerSave, firstMissionSnapshot } = backendRequire('../../build/playerSave.js');
const base = 'c7811d0856dd18e3e0d56449c32f644120a7ae81', control = process.env.CRYPTOID_FEEDBACK_CONTROL === '1';
const output = root + '/verification/quiet-readable-feedback-20261027/results'; mkdirSync(output, { recursive: true });
const sourceHash=()=>createHash('sha256').update(control?execFileSync('git',['show',base+':frontend/src/pages/GamePage.tsx'],{cwd:root}):readFileSync(root+'/frontend/src/pages/GamePage.tsx')).digest('hex');
const result = { sourceSha256:sourceHash(), baseline: base, localOnly:true, realGamePageAndApiHandlers:true, syntheticSdkAndOrders:true, controlledClock:true, physicalDevice:false, checks:[], errors:[], cases:[], complete:false };
const check = (name, value) => { assert.ok(value, name); result.checks.push(name); console.log(name); };
const hooks = `
  (window as any).__binaryWeaponQA = {
    inspect:()=>({state:structuredClone(stateRef.current),notice:weaponSpentRef.current?{...weaponSpentRef.current}:null,menu:weaponMenuOpen,technical:technicalPause,countdown:weaponCountdown,error:weaponError,busy:weaponBusy,formation:formationStartedRef.current,spawned:formationIndexRef.current,flight:flightRef.current,sectionElapsed:sectionElapsedRef.current,variety:{...varietyRef.current}}),
    select:selectWeaponLevel,auto:changeAutoReload,
    interrupt:()=>interruptionRef.current('loop-stall'),
    expire:(source:string,level:number)=>{const s=stateRef.current;if(source==='paid'){s.weaponTimers[level]=1;s.paidWeaponMs=1;s.paidWeaponLevel=level;}else{s.pickupWeaponMs=1;s.pickupWeaponLevel=level;}s.weaponSource=source;syncSelectedWeapon(s);setGame({...s});},
    protect:()=>{impactCooldownRef.current=1000000;},
    stage:(stage:any)=>{shipStageRef.current=stage;setShipStage(stage);},
    finishFormation:()=>{const s=stateRef.current;s.asteroids=[];s.shots=[];s.enemyShots=[];s.effects=[];s.rocks=[];s.rockEffects=[];setGame({...s});},
    beginMultiBinary:()=>{const s=stateRef.current;s.sector=159;s.section=317;s.phase='SECTOR_INTRO';s.asteroids=[];s.shots=[];s.enemyShots=[];s.effects=[];s.rocks=[];s.rockEffects=[];flightRef.current=0;formationOffsetRef.current=0;sectionElapsedRef.current=0;formationIndexRef.current=0;formationStartedRef.current=false;spawnTimerRef.current=0;waveCompleteRef.current=false;sectionSlotsRef.current=createFormationSlots(s.section,s.sector,fieldSizeRef.current.width,fieldSizeRef.current.height,visibleTopRef.current,playerDiameterRef.current,6,0);varietyRef.current.waveComplete=false;setGame({...s});},
    beginBinary:()=>{const s=stateRef.current;s.phase='SECTOR_INTRO';s.asteroids=[];s.shots=[];s.enemyShots=[];s.effects=[];s.rocks=[];s.rockEffects=[];sectionElapsedRef.current=0;formationIndexRef.current=0;formationStartedRef.current=false;spawnTimerRef.current=0;waveCompleteRef.current=false;varietyRef.current.waveComplete=false;setGame({...s});},
  };
`;
let server, browser;
try {
  server = await createServer({ root: root + '/frontend', cacheDir: output + (control ? '/vite-control' : '/vite-candidate'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [root] } },
    plugins: [{ name: 'local-game-over-control', enforce: 'pre', transform(code, id) {
      const relative=id.split('?')[0].replace(root+'/', '');
      if(control && ['frontend/src/pages/GamePage.tsx','frontend/src/pages/WeaponSpentNotice.tsx','frontend/src/pages/weaponSpentNotice.ts','frontend/src/pages/transitionTiming.ts','frontend/src/pages/transitionNotices.css','frontend/src/pages/weaponNotices.css'].includes(relative)) code=execFileSync('git',['show',base+':'+relative],{cwd:root,encoding:'utf8'});
      if (!id.endsWith('/GamePage.tsx')) return control?code:undefined;
      return code.replace('  const levelLabel =', hooks + '\n  const levelLabel =').replace('const step = (time: number) => {', 'const step = (time: number) => { (window as any).__gameOverSteps=((window as any).__gameOverSteps??0)+1;');
    }, transformIndexHtml: { order: 'post', handler: html => html.replace(/appNetwork:\s*"[^"]*"/, 'appNetwork: "testnet"').replace(/backendURL:\s*"[^"]*"/, 'backendURL: "/api"') } }] });
  server.middlewares.use((req, res, next) => {
    if (!/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(req.url || '')) return next();
    res.setHeader('Content-Type', 'font/ttf'); res.end(readFileSync(root + '/verification/white-screen-fonts/' + req.url.split('/').at(-1)));
  });
  await server.listen(); const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  browser = await chromium.launch({headless:true});
  result.engine = browser.version();
  let scenarios=[
    {width:393,height:744,locale:'de',hand:'right',mode:'paid',name:'phone-paid'},
    {width:393,height:744,locale:'de',hand:'right',mode:'paid',name:'phone-multiflight',multi:true},
    {width:430,height:825,locale:'de',hand:'right',mode:'paid',name:'phone-reduced-multiflight',multi:true,motion:'reduce'},
    {width:393,height:744,locale:'de',hand:'right',mode:'automatic',name:'phone-delayed-reload',delayed:true},
    {width:320,height:568,locale:'de',hand:'left',mode:'automatic',name:'compact-failed-reload',delayed:true,failed:true},
    {width:320,height:568,locale:'de',hand:'left',mode:'pickup',name:'compact-left'},
    {width:768,height:1024,locale:'th',hand:'right',mode:'paid',name:'tablet-thai'},
    {width:1363,height:768,locale:'en',hand:'left',mode:'automatic',name:'desktop-auto'},
    {width:393,height:628,locale:'de',hand:'right',mode:'fallback',name:'phone-live-fallback'},
    {width:430,height:825,locale:'de',hand:'right',mode:'pickup-paid',name:'phone-pickup-to-twin'},
    {width:393,height:744,locale:'en',hand:'left',mode:'evolved',name:'phone-evolved'},
    {width:430,height:825,locale:'de',hand:'right',mode:'pickup',motion:'reduce',name:'phone-reduced'},
  ];
  if(control)scenarios=scenarios.filter(s=>s.name==='phone-multiflight');
  for(const scenario of scenarios){
    const h=harness();await h.call('progress','/me',null,{method:'GET'});
    Object.assign(h.profile(),{...emptyPlayerSave(),version:1,legacyImported:true,cardReveals:['grey-scout-1'],mission:{sector:scenario.multi?159:1,phase:'normal',rulesVersion:2,snapshot:firstMissionSnapshot(3),savedAt:new Date().toISOString()}});
    if(scenario.multi){h.docs[0].rewardEventKeys={testnet:[]};for(let stage=1;stage<159;stage++){if(stage%10)h.docs[0].rewardEventKeys.testnet.push('block:'+stage);else h.docs[0].rewardEventKeys.testnet.push('boss:'+stage/10,'bonus:'+stage/10);if(stage%10===9)h.docs[0].rewardEventKeys.testnet.push('chain:'+Math.ceil(stage/10));}}
    for(const [product,model] of [['weapon_twin',2],['weapon_rapid_twin',3]])h.orders.push({user:'pilot-a',paid:true,product_id:product,pi_payment_id:'isolated-'+product,quantity:10,weapon_model:model,payment_network:'Pi Testnet'});
    const context=await browser.newContext({viewport:{width:scenario.width,height:scenario.height},hasTouch:true,locale:scenario.locale==='de'?'de-AT':scenario.locale,reducedMotion:scenario.motion||'no-preference'});
    await context.addInitScript(({locale,hand})=>{window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'web'})};localStorage.setItem('cryptoid_pi_session','1');localStorage.setItem('cryptoid_home_music','off');localStorage.setItem('cryptoid_language',locale);localStorage.setItem('cryptoid_control_hand',hand);localStorage.setItem('cryptoid_card_reveals_v1_testnet_pilot-a',JSON.stringify(['grey-scout-1']));},scenario);
    const requests=[];let activationCount=0,releaseReload;
    await context.route('**/*',async route=>{
      const u=new URL(route.request().url());
      if(u.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:readFileSync(root+'/verification/white-screen-fonts/fonts.css','utf8').replaceAll('/font-mirror/',origin+'/font-mirror/')});
      if(u.origin!==origin)return route.fulfill({status:200,contentType:'application/javascript',body:''});
      if(!u.pathname.startsWith('/api/'))return route.continue();
      const [group,...parts]=u.pathname.slice(5).split('/'),endpoint='/'+parts.join('/'),body=route.request().postDataJSON();let response;
      if(group==='user')response={code:200,body:{user:{uid:'pilot-a',username:'Local verification'},canAdmin:false,adminMode:false}};
      else if(group==='usage')response={code:204};
      else if(['progress','hangar','rewards','leaderboard'].includes(group)){
        if(group==='hangar'&&endpoint==='/weapon/activate'&&++activationCount===2&&scenario.delayed){await new Promise(resolve=>{releaseReload=resolve;});if(scenario.failed)response={code:503,body:{error:'isolated_unavailable'}};}
        response??=await h.call(group,endpoint,body,{method:route.request().method()});
      }
      else response={code:200,body:{}};
      if(group==='hangar'&&endpoint==='/start'&&response.code===200){h.session.scoreRun.startedAt-=3600000;h.profile().lastStart.runMeta.startedAt=h.session.scoreRun.startedAt;}
      requests.push({path:u.pathname,level:body?.level,status:response.code,error:response.body?.error});
      return route.fulfill({status:response.code,contentType:'application/json',body:response.code===204?'':JSON.stringify(response.body)});
    });
    const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
    await page.clock.install();await page.goto(origin+'/game');
    await page.locator('.mission-start-modal .button-primary').click();
    await page.waitForFunction(()=>window.__binaryWeaponQA?.inspect().state.status==='playing');
    await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
    const driveUntil=async predicate=>{for(let i=0;i<260;i++){if(await page.evaluate(predicate))return;await page.clock.runFor(100);await page.waitForTimeout(10);}throw Error('Controlled condition not reached: '+scenario.name);};
    const resume=async()=>{await page.locator('.pause-resume-button').click();for(let i=0;i<3;i++){await page.clock.runFor(1000);await page.waitForTimeout(25);}await driveUntil(()=>window.__binaryWeaponQA.inspect().state.status==='playing');};
    await driveUntil(()=>window.__binaryWeaponQA.inspect().formation);
    await page.evaluate(()=>window.__binaryWeaponQA.protect());
    check(scenario.name+': no unsolicited notice before any expiry',await page.locator('.weapon-transition-notice').count()===0);
    await page.locator('.mission-shop-access').tap();await page.waitForFunction(()=>window.__binaryWeaponQA.inspect().menu);
    const shopSymbols=await page.locator('.mission-weapon-card').evaluateAll(cards=>Object.fromEntries(cards.map(card=>[card.dataset.level,card.querySelector('h3 > span').textContent.trim()])));
    if(scenario.mode==='fallback'||scenario.multi){await page.evaluate(()=>window.__binaryWeaponQA.select(3));await page.waitForTimeout(40);await page.evaluate(()=>window.__binaryWeaponQA.auto(3,true));}
    await page.evaluate(()=>window.__binaryWeaponQA.select(2));await page.waitForTimeout(40);
    result.lastSelection={scenario:scenario.name,state:await page.evaluate(()=>window.__binaryWeaponQA.inspect()),requests};
    check(scenario.name+': real handler confirms one selected 45-second charge',await page.evaluate(()=>window.__binaryWeaponQA.inspect().state.weaponTimers[2]===45000));
    const activations=()=>requests.filter(r=>r.path==='/api/hangar/weapon/activate');
    const armed=activations().length;
    await page.locator('.weapon-drawer-tab').tap();for(let i=0;i<3;i++){await page.clock.runFor(1000);await page.waitForTimeout(20);}
    await driveUntil(()=>window.__binaryWeaponQA.inspect().state.status==='playing');
    await page.evaluate(()=>window.__binaryWeaponQA.protect());
    if(['automatic','pickup-paid'].includes(scenario.mode))await page.evaluate(()=>window.__binaryWeaponQA.auto(2,true));
    if(scenario.mode==='evolved')await page.evaluate(()=>window.__binaryWeaponQA.stage(2));
    const pickup=scenario.mode.startsWith('pickup');
    await page.evaluate(({pickup,mode})=>window.__binaryWeaponQA.expire(pickup?'pickup':'paid',pickup?(mode==='pickup-paid'?5:4):2),{pickup,mode:scenario.mode});
    await driveUntil(()=>!!window.__binaryWeaponQA.inspect().notice);
    if(scenario.mode==='automatic'&&!scenario.delayed)await driveUntil(()=>!window.__binaryWeaponQA.inspect().busy&&window.__binaryWeaponQA.inspect().state.weaponLevel===2);
    await page.clock.runFor(600);await page.waitForTimeout(30);
    check(scenario.name+': no expiry/reload/error popup during active combat',await page.locator('.weapon-transition-notice,.weapon-spent-action,.weapon-reloading,.weapon-reload-error').count()===0);
    check(scenario.name+': expiry queues once without a reading deadline',await page.evaluate(()=>{const n=window.__binaryWeaponQA.inspect().notice;return n&&!n.shown&&!('remainingMs'in n);}));
    check(scenario.name+': no extra charge is consumed beyond the original Auto rule',activations().length===armed+(scenario.mode==='automatic'&&!scenario.delayed?1:0));
    if(scenario.name==='phone-paid'){
      await page.evaluate(()=>window.__binaryWeaponQA.finishFormation());
      await driveUntil(()=>!!document.querySelector('.formation-data-stream'));
      check('the first notice enters through the actual next-block clear/intro flow',await page.evaluate(()=>window.__binaryWeaponQA.inspect().state.sector)===2);
    }else if(scenario.multi)await page.evaluate(()=>window.__binaryWeaponQA.beginMultiBinary());
    else await page.evaluate(()=>window.__binaryWeaponQA.beginBinary());
    await driveUntil(()=>!!document.querySelector('.weapon-transition-notice'));
    const label=page.locator('.weapon-transition-notice');await label.waitFor();
    const view=await label.evaluate(node=>{
      const field=node.closest('.game-field'),code=field.querySelector('.formation-data-stream');const box=node.getBoundingClientRect(),binary=code.getBoundingClientRect();
      const blockers=[...field.querySelectorAll('.game-hud,.game-label,.flight-indicator,.bonus-counter,.combat-variety-notice,.reinforcement-notice,.sector-banner,.combo-notice,.pickup-notice,.weapon-control-wrap,.shield-control-wrap,.power-timer,.edge-action-purchased')].map(n=>n.getBoundingClientRect()).filter(b=>b.width&&b.height);
      return{currentName:[...node.querySelector('strong').childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim(),symbols:[...node.querySelectorAll('.weapon-notice-symbol')].map(n=>({level:Number(n.dataset.level),text:n.textContent.trim(),hidden:n.getAttribute('aria-hidden')})),text:node.innerText,color:getComputedStyle(node).color,animation:getComputedStyle(node).animationName,pointerEvents:getComputedStyle(node).pointerEvents,buttons:node.querySelectorAll('button,a').length,box:{top:box.top,bottom:box.bottom,left:box.left,right:box.right},binary:{top:binary.top,bottom:binary.bottom,left:binary.left,right:binary.right},overlaps:blockers.filter(b=>box.left<b.right&&box.right>b.left&&box.top<b.bottom&&box.bottom>b.top).length,active:field.querySelector('.mission-active-weapon b').textContent.trim()};
    });
    result.lastView={scenario:scenario.name,view};await page.screenshot({path:output+'/'+scenario.name+'.png',animations:'allow'});
    check(scenario.name+': visible current weapon exactly matches the real HUD, not the expired one',view.currentName===view.active);
    check(scenario.name+': current and expired symbols exactly match the original shop marks',view.symbols.length>0&&view.symbols.every(symbol=>symbol.text===shopSymbols[symbol.level]&&symbol.hidden==='true'));
    check(scenario.name+': lighter red passive text, no call to buy and no animation',view.color==='rgb(255, 179, 183)'&&view.buttons===0&&view.pointerEvents==='none'&&view.animation==='none'&&!/nachkaufen|buy charges|Schussart wechseln/i.test(view.text));
    check(scenario.name+': entire notice is in front of the existing binary area and covers no other text',view.box.top>=view.binary.top&&view.box.bottom<=view.binary.bottom&&view.box.left>=view.binary.left&&view.box.right<=view.binary.right&&view.overlaps===0);
    check(scenario.name+': a changed type clearly identifies expiry',scenario.mode==='automatic'||scenario.mode==='evolved'||await label.locator('span').count()===1);
    if(scenario.mode==='automatic'){
      check(scenario.name+': actual reload status is legible in the binary strip',await label.locator('.weapon-reload-status').innerText()===(scenario.delayed?'Waffe wird nachgeladen…':'Weapon reloaded'));
      if(scenario.delayed){
        check(scenario.name+': no false success before server confirmation',await page.evaluate(()=>window.__binaryWeaponQA.inspect().busy)&&!await label.innerText().then(t=>t.includes('Waffe nachgeladen')));
        releaseReload();await driveUntil(()=>!window.__binaryWeaponQA.inspect().busy);
        check(scenario.name+': visible result follows the real response',await label.locator('.weapon-reload-status').innerText()===(scenario.failed?'Nachladen nicht bestätigt':'Waffe nachgeladen'));
      }
      const timers=await page.evaluate(()=>window.__binaryWeaponQA.inspect().state.weaponTimers);
      await page.clock.runFor(1800);await page.waitForTimeout(25);
      check(scenario.name+': result remains readable in the same binary window without spending charge time',await label.count()===1&&JSON.stringify(timers)===JSON.stringify(await page.evaluate(()=>window.__binaryWeaponQA.inspect().state.weaponTimers)));
      await page.screenshot({path:output+'/'+scenario.name+'.png',animations:'allow'});
    }
    if(scenario.multi){
      await driveUntil(()=>window.__binaryWeaponQA.inspect().spawned===6&&!window.__binaryWeaponQA.inspect().formation);
      await page.evaluate(()=>window.__binaryWeaponQA.finishFormation());
      await driveUntil(()=>window.__binaryWeaponQA.inspect().flight===1);
      await page.waitForTimeout(30);
      const stale=await label.count(),notice=await page.evaluate(()=>window.__binaryWeaponQA.inspect().notice);
      result.directWindowBoundary={staleVisible:stale,pending:notice};
      if(control){
        check('pinned public controller repeats a shown expiry across the direct next-flight binary boundary',stale===1&&notice?.shown===true);
        check('pinned public controller has no visible reload-result component',await page.locator('.weapon-reload-status').count()===0);
        await page.screenshot({path:output+'/control-repeated.png',animations:'allow'});await context.close();continue;
      }
      check('direct entry-clear-to-next-flight boundary consumes the notice without needing an active frame',stale===0&&notice===null);
      const warning=page.locator('.readable-reinforcement');await warning.waitFor();
      const initial=await warning.evaluate(node=>{window.__retainedWarning=node;window.__warningAnimation=node.getAnimations()[0];return{duration:getComputedStyle(node).animationDuration,animation:getComputedStyle(node).animationName,text:node.textContent};});
      check('reinforcement native animation and actual phase share a 4800ms readable lifetime',(scenario.motion==='reduce'?initial.animation==='none':initial.duration==='4.8s')&&initial.text==='Verstärkung im Anflug');
      await page.waitForTimeout(500);
      check('reinforcement holds full native opacity after one calm arrival',Number(await warning.evaluate(n=>getComputedStyle(n).opacity))===1);
      await page.screenshot({path:output+'/'+scenario.name+'-reinforcement.png',animations:'allow'});
      const before=await page.evaluate(()=>window.__binaryWeaponQA.inspect());
      await page.locator('.pause-control').tap();await page.waitForTimeout(30);
      const frozen=await warning.evaluate(n=>({same:n===window.__retainedWarning,time:window.__warningAnimation?.currentTime,paused:getComputedStyle(n).animationPlayState}));
      await page.clock.runFor(12000);await page.waitForTimeout(100);
      check('manual pause retains warning DOM and freezes native and phase clocks',frozen.same&&(scenario.motion==='reduce'||frozen.paused==='paused')&&await warning.evaluate(n=>n===window.__retainedWarning&&window.__warningAnimation?.currentTime===window.__frozenWarningTime,await page.evaluate(t=>{window.__frozenWarningTime=t;return t;},frozen.time))&&await page.evaluate(()=>window.__binaryWeaponQA.inspect().sectionElapsed)===before.sectionElapsed);
      await resume();await page.evaluate(()=>window.__binaryWeaponQA.interrupt());await page.waitForTimeout(25);await page.clock.runFor(10000);await page.waitForTimeout(25);
      check('technical warning pause never resumes itself',await page.evaluate(()=>window.__binaryWeaponQA.inspect().technical&&window.__binaryWeaponQA.inspect().state.status==='paused'));
      await resume();
      await page.clock.runFor(4000);await page.waitForTimeout(30);
      check('reinforcement phase still exists after four seconds and protects paid/pickup/boost clocks',before.state.weaponTimers[3]>0&&await warning.count()===1&&await page.evaluate(()=>window.__binaryWeaponQA.inspect().state.phase)==='SECTOR_INTRO'&&JSON.stringify(before.state.weaponTimers)===JSON.stringify(await page.evaluate(()=>window.__binaryWeaponQA.inspect().state.weaponTimers)));
      await driveUntil(()=>window.__binaryWeaponQA.inspect().formation);
      check('first later flight has no repeated expiry',await label.count()===0&&await warning.count()===0);
      await page.evaluate(()=>window.__binaryWeaponQA.finishFormation());await driveUntil(()=>window.__binaryWeaponQA.inspect().flight===2);
      check('second later flight also has no repeated expiry',await label.count()===0&&await page.evaluate(()=>window.__binaryWeaponQA.inspect().notice)===null);
      check('longer comparable clear notice uses 4800ms before being replaced',await page.evaluate(()=>window.__binaryWeaponQA.inspect().variety.noticeMs)>4500);
      check('a real confirmed charge survives subsequent active combat with its normal consumption',await page.evaluate(()=>window.__binaryWeaponQA.inspect().state.weaponTimers[3])>0&&await page.evaluate(()=>window.__binaryWeaponQA.inspect().state.weaponTimers[3])<=before.state.weaponTimers[3]);
      check('late-stage real checkpoint handlers report no unexpected failure',requests.every(r=>r.status<400));
      result.responses??=[];result.responses.push({scenario:scenario.name,requests});
      await context.close();continue;
    }
    if(scenario.name==='phone-paid'){
      const animation=await page.evaluate(()=>{const row=document.querySelector('.formation-data-row');window.__nativeBinaryNode=row;window.__nativeBinaryAnimation=row.getAnimations()[0];return window.__nativeBinaryAnimation?.currentTime;});
      await page.waitForTimeout(160);
      check('original native binary animation keeps running behind the static notice',await page.evaluate(time=>window.__nativeBinaryNode===document.querySelector('.formation-data-row')&&window.__nativeBinaryAnimation===document.querySelector('.formation-data-row').getAnimations()[0]&&window.__nativeBinaryAnimation.currentTime>time,animation));
      const before=await page.evaluate(()=>window.__binaryWeaponQA.inspect().state.weaponTimers);
      await page.clock.runFor(400);await page.waitForTimeout(30);
      check('the binary reading window consumes no active ammunition time',JSON.stringify(before)===JSON.stringify(await page.evaluate(()=>window.__binaryWeaponQA.inspect().state.weaponTimers)));
      await page.locator('.pause-control').tap();await page.waitForTimeout(25);
      const paused=await page.evaluate(()=>window.__binaryWeaponQA.inspect());await page.clock.runFor(12000);await page.waitForTimeout(25);
      check('manual pause hides both code and notice, preserves pending state and never resumes itself',await page.locator('.formation-data-stream,.weapon-transition-notice').count()===0&&await page.evaluate(()=>window.__binaryWeaponQA.inspect().state.status)==='paused'&&JSON.stringify(paused.notice)===JSON.stringify(await page.evaluate(()=>window.__binaryWeaponQA.inspect().notice)));
      await resume();await label.waitFor();
      await page.evaluate(()=>window.__binaryWeaponQA.interrupt());await page.waitForTimeout(30);await page.clock.runFor(10000);await page.waitForTimeout(30);
      check('technical pause also hides both and requires explicit Resume',await page.evaluate(()=>window.__binaryWeaponQA.inspect().technical&&window.__binaryWeaponQA.inspect().state.status==='paused')&&await page.locator('.formation-data-stream,.weapon-transition-notice').count()===0);
      await resume();await label.waitFor();
    }
    await page.screenshot({path:output+'/'+scenario.name+'.png',animations:'allow'});
    result.cases.push({scenario,view});
    await driveUntil(()=>window.__binaryWeaponQA.inspect().formation);
    check(scenario.name+': notice and code leave together before active combat resumes',await page.locator('.formation-data-stream,.weapon-transition-notice').count()===0&&await page.evaluate(()=>window.__binaryWeaponQA.inspect().notice)===null);
    await page.clock.runFor(1200);await page.waitForTimeout(20);
    check(scenario.name+': no trailing or repeated popup after the binary window',await page.locator('.weapon-transition-notice,.weapon-spent-action,.weapon-reloading,.weapon-reload-error').count()===0);
    await page.evaluate(()=>window.__binaryWeaponQA.beginBinary());await page.clock.runFor(100);await page.waitForTimeout(20);
    check(scenario.name+': the next unchanged binary window does not repeat stale feedback',await page.locator('.formation-data-stream').count()===1&&await page.locator('.weapon-transition-notice').count()===0);
    check(scenario.name+': no purchase endpoint was called',requests.every(r=>!r.path.includes('/payment')&&!r.path.includes('/order')));
    check(scenario.name+': only the explicitly injected reload failure is permitted',requests.every(r=>r.status<400||(scenario.failed&&r.path==='/api/hangar/weapon/activate'&&r.status===503)));
    result.responses??=[];result.responses.push({scenario:scenario.name,requests});
    await context.close();
  }
  check('the complete run used one unchanged controller',sourceHash()===result.sourceSha256);
  check('no JavaScript page errors',result.errors.length===0);result.complete=true;
}catch(error){result.failure={message:error.message,stack:error.stack};throw error;}
finally{await browser?.close();await server?.close();writeFileSync(output+(control?'/control-observation.json':'/native.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({complete:result.complete,checks:result.checks.length,failure:result.failure?.message}));}
