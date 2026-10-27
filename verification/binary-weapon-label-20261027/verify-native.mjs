// Local actual GamePage/handler checks. Expiry/combat boundaries are isolated fixtures.
import assert from 'node:assert/strict';
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
const base = '0ae15558a2251adaf1b9dde833220cb3b3f932e3', control = false;
const output = root + '/verification/binary-weapon-label-20261027/results'; mkdirSync(output, { recursive: true });
const result = { baseline: base, localOnly:true, realGamePageAndApiHandlers:true, syntheticSdkAndOrders:true, controlledClock:true, physicalDevice:false, checks:[], errors:[], cases:[], complete:false };
const check = (name, value) => { assert.ok(value, name); result.checks.push(name); console.log(name); };
const hooks = `
  (window as any).__binaryWeaponQA = {
    inspect:()=>({state:structuredClone(stateRef.current),notice:weaponSpentRef.current?{...weaponSpentRef.current}:null,menu:weaponMenuOpen,technical:technicalPause,countdown:weaponCountdown,error:weaponError,busy:weaponBusy,formation:formationStartedRef.current}),
    select:selectWeaponLevel,auto:changeAutoReload,
    interrupt:()=>interruptionRef.current('loop-stall'),
    expire:(source:string,level:number)=>{const s=stateRef.current;if(source==='paid'){s.weaponTimers[level]=1;s.paidWeaponMs=1;s.paidWeaponLevel=level;}else{s.pickupWeaponMs=1;s.pickupWeaponLevel=level;}s.weaponSource=source;syncSelectedWeapon(s);setGame({...s});},
    protect:()=>{impactCooldownRef.current=1000000;},
    stage:(stage:any)=>{shipStageRef.current=stage;setShipStage(stage);},
    finishFormation:()=>{const s=stateRef.current;s.asteroids=[];s.shots=[];s.enemyShots=[];s.effects=[];s.rocks=[];s.rockEffects=[];setGame({...s});},
    beginBinary:()=>{const s=stateRef.current;s.phase='SECTOR_INTRO';s.asteroids=[];s.shots=[];s.enemyShots=[];s.effects=[];s.rocks=[];s.rockEffects=[];sectionElapsedRef.current=0;formationIndexRef.current=0;formationStartedRef.current=false;spawnTimerRef.current=0;waveCompleteRef.current=false;varietyRef.current.waveComplete=false;setGame({...s});},
  };
`;
let server, browser;
try {
  server = await createServer({ root: root + '/frontend', cacheDir: output + (control ? '/vite-control' : '/vite-candidate'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [root] } },
    plugins: [{ name: 'local-game-over-control', enforce: 'pre', transform(code, id) {
      if (!id.endsWith('/GamePage.tsx')) return;
      if (control) code = execFileSync('git', ['show', base + ':frontend/src/pages/GamePage.tsx'], { cwd: root, encoding: 'utf8' });
      return code.replace('  const levelLabel =', hooks + '\n  const levelLabel =').replace('const step = (time: number) => {', 'const step = (time: number) => { (window as any).__gameOverSteps=((window as any).__gameOverSteps??0)+1;');
    }, transformIndexHtml: { order: 'post', handler: html => html.replace(/appNetwork:\s*"[^"]*"/, 'appNetwork: "testnet"').replace(/backendURL:\s*"[^"]*"/, 'backendURL: "/api"') } }] });
  server.middlewares.use((req, res, next) => {
    if (!/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(req.url || '')) return next();
    res.setHeader('Content-Type', 'font/ttf'); res.end(readFileSync(root + '/verification/white-screen-fonts/' + req.url.split('/').at(-1)));
  });
  await server.listen(); const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  browser = await chromium.launch({headless:true});
  result.engine = browser.version();
  const scenarios=[
    {width:393,height:744,locale:'de',hand:'right',mode:'paid',name:'phone-paid'},
    {width:320,height:568,locale:'de',hand:'left',mode:'pickup',name:'compact-left'},
    {width:768,height:1024,locale:'th',hand:'right',mode:'paid',name:'tablet-thai'},
    {width:1363,height:768,locale:'en',hand:'left',mode:'automatic',name:'desktop-auto'},
    {width:393,height:628,locale:'de',hand:'right',mode:'fallback',name:'phone-live-fallback'},
    {width:430,height:825,locale:'de',hand:'right',mode:'pickup-paid',name:'phone-pickup-to-twin'},
    {width:393,height:744,locale:'en',hand:'left',mode:'evolved',name:'phone-evolved'},
    {width:430,height:825,locale:'de',hand:'right',mode:'pickup',motion:'reduce',name:'phone-reduced'},
  ];
  for(const scenario of scenarios){
    const h=harness();await h.call('progress','/me',null,{method:'GET'});
    Object.assign(h.profile(),{...emptyPlayerSave(),version:1,legacyImported:true,cardReveals:['grey-scout-1'],mission:{sector:1,phase:'normal',rulesVersion:2,snapshot:firstMissionSnapshot(3),savedAt:new Date().toISOString()}});
    for(const [product,model] of [['weapon_twin',2],['weapon_rapid_twin',3]])h.orders.push({user:'pilot-a',paid:true,product_id:product,pi_payment_id:'isolated-'+product,quantity:10,weapon_model:model,payment_network:'Pi Testnet'});
    const context=await browser.newContext({viewport:{width:scenario.width,height:scenario.height},hasTouch:true,locale:scenario.locale==='de'?'de-AT':scenario.locale,reducedMotion:scenario.motion||'no-preference'});
    await context.addInitScript(({locale,hand})=>{window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'web'})};localStorage.setItem('cryptoid_pi_session','1');localStorage.setItem('cryptoid_home_music','off');localStorage.setItem('cryptoid_language',locale);localStorage.setItem('cryptoid_control_hand',hand);localStorage.setItem('cryptoid_card_reveals_v1_testnet_pilot-a',JSON.stringify(['grey-scout-1']));},scenario);
    const requests=[];
    await context.route('**/*',async route=>{
      const u=new URL(route.request().url());
      if(u.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:readFileSync(root+'/verification/white-screen-fonts/fonts.css','utf8').replaceAll('/font-mirror/',origin+'/font-mirror/')});
      if(u.origin!==origin)return route.fulfill({status:200,contentType:'application/javascript',body:''});
      if(!u.pathname.startsWith('/api/'))return route.continue();
      const [group,...parts]=u.pathname.slice(5).split('/'),endpoint='/'+parts.join('/'),body=route.request().postDataJSON();let response;
      if(group==='user')response={code:200,body:{user:{uid:'pilot-a',username:'Local verification'},canAdmin:false,adminMode:false}};
      else if(group==='usage')response={code:204};
      else if(['progress','hangar','rewards','leaderboard'].includes(group))response=await h.call(group,endpoint,body,{method:route.request().method()});
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
    if(scenario.mode==='fallback'){await page.evaluate(()=>window.__binaryWeaponQA.select(3));await page.waitForTimeout(40);await page.evaluate(()=>window.__binaryWeaponQA.auto(3,true));}
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
    if(scenario.mode==='automatic')await driveUntil(()=>!window.__binaryWeaponQA.inspect().busy&&window.__binaryWeaponQA.inspect().state.weaponLevel===2);
    await page.clock.runFor(600);await page.waitForTimeout(30);
    check(scenario.name+': no expiry/reload/error popup during active combat',await page.locator('.weapon-transition-notice,.weapon-spent-action,.weapon-reloading,.weapon-reload-error').count()===0);
    check(scenario.name+': expiry queues once without a reading deadline',await page.evaluate(()=>{const n=window.__binaryWeaponQA.inspect().notice;return n&&!n.shown&&!('remainingMs'in n);}));
    check(scenario.name+': no extra charge is consumed beyond the original Auto rule',activations().length===armed+(scenario.mode==='automatic'?1:0));
    if(scenario.name==='phone-paid'){
      await page.evaluate(()=>window.__binaryWeaponQA.finishFormation());
      await driveUntil(()=>!!document.querySelector('.formation-data-stream'));
      check('the first notice enters through the actual next-block clear/intro flow',await page.evaluate(()=>window.__binaryWeaponQA.inspect().state.sector)===2);
    }else await page.evaluate(()=>window.__binaryWeaponQA.beginBinary());
    await driveUntil(()=>!!document.querySelector('.weapon-transition-notice'));
    const label=page.locator('.weapon-transition-notice');await label.waitFor();
    const view=await label.evaluate(node=>{
      const field=node.closest('.game-field'),code=field.querySelector('.formation-data-stream');const box=node.getBoundingClientRect(),binary=code.getBoundingClientRect();
      const blockers=[...field.querySelectorAll('.game-hud,.game-label,.flight-indicator,.bonus-counter,.combat-variety-notice,.reinforcement-notice,.sector-banner,.combo-notice,.pickup-notice,.weapon-control-wrap,.shield-control-wrap,.power-timer,.edge-action-purchased')].map(n=>n.getBoundingClientRect()).filter(b=>b.width&&b.height);
      return{text:node.innerText,color:getComputedStyle(node).color,animation:getComputedStyle(node).animationName,pointerEvents:getComputedStyle(node).pointerEvents,buttons:node.querySelectorAll('button,a').length,box:{top:box.top,bottom:box.bottom,left:box.left,right:box.right},binary:{top:binary.top,bottom:binary.bottom,left:binary.left,right:binary.right},overlaps:blockers.filter(b=>box.left<b.right&&box.right>b.left&&box.top<b.bottom&&box.bottom>b.top).length,active:field.querySelector('.mission-active-weapon b').textContent.trim()};
    });
    result.lastView={scenario:scenario.name,view};await page.screenshot({path:output+'/'+scenario.name+'.png',animations:'allow'});
    check(scenario.name+': visible current weapon exactly matches the real HUD, not the expired one',await label.locator('strong').innerText()===((await label.locator('span').count())?'→ ':'')+view.active);
    check(scenario.name+': lighter red passive text, no call to buy and no animation',view.color==='rgb(255, 179, 183)'&&view.buttons===0&&view.pointerEvents==='none'&&view.animation==='none'&&!/nachkaufen|buy charges|Schussart wechseln/i.test(view.text));
    check(scenario.name+': entire notice is in front of the existing binary area and covers no other text',view.box.top>=view.binary.top&&view.box.bottom<=view.binary.bottom&&view.box.left>=view.binary.left&&view.box.right<=view.binary.right&&view.overlaps===0);
    check(scenario.name+': a changed type clearly identifies expiry',scenario.mode==='automatic'||scenario.mode==='evolved'||await label.locator('span').count()===1);
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
    check(scenario.name+': local real handler responses succeed',requests.every(r=>r.status<400));
    await context.close();
  }
  check('no JavaScript page errors',result.errors.length===0);result.complete=true;
}catch(error){result.failure={message:error.message,stack:error.stack};throw error;}
finally{await browser?.close();await server?.close();writeFileSync(output+'/native.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({complete:result.complete,checks:result.checks.length,failure:result.failure?.message}));}
