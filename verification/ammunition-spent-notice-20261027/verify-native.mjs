// Local real GamePage/handler control. A synthetic fatal shot uses normal damage.
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
const base = '22842bb7a1986b2b34710f2dcbca7c2e5e6a7b7c', control = false;
const output = root + '/verification/ammunition-spent-notice-20261027/results'; mkdirSync(output, { recursive: true });
const result = { baseline: base, localOnly:true, realGamePageAndApiHandlers:true, syntheticSdkAndOrders:true, controlledClock:true, physicalDevice:false, checks:[], errors:[], cases:[], complete:false };
const check = (name, value) => { assert.ok(value, name); result.checks.push(name); console.log(name); };
const hooks = `
  (window as any).__ammoQA = {
    inspect: () => ({state:structuredClone(stateRef.current),notice:weaponSpentRef.current?{...weaponSpentRef.current}:null,menu:weaponMenuOpen,technical:technicalPause,countdown:weaponCountdown,reloading:autoReloading,error:weaponError,busy:weaponBusy,formation:formationStartedRef.current}),
    open: openWeaponSelection, select: selectWeaponLevel, resume: resumeWeaponSelection, auto:changeAutoReload,
    interrupt: () => interruptionRef.current('loop-stall'),
    expire: (source:string,level:number) => {const s=stateRef.current;if(source==='paid'){s.weaponTimers[level]=1;s.paidWeaponMs=1;s.paidWeaponLevel=level;}else{s.pickupWeaponMs=1;s.pickupWeaponLevel=level;}s.weaponSource=source;syncSelectedWeapon(s);impactCooldownRef.current=1000000;setGame({...s});},
    protect:()=>{impactCooldownRef.current=1000000;},
    layoutCue:(enabled:boolean)=>{const s=stateRef.current;if(enabled){(window as any).__ammoLayoutSaved={phase:s.phase,elapsed:sectionElapsedRef.current,pickup:s.pickupNotice};s.phase='SECTOR_INTRO';sectionElapsedRef.current=0;s.pickupNotice={id:987654,type:'weapon',level:3,remainingMs:2400};}else{const old=(window as any).__ammoLayoutSaved;s.phase=old.phase;sectionElapsedRef.current=old.elapsed;s.pickupNotice=old.pickup;}setGame({...s});},
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
    {width:393,height:744,locale:'de',hand:'right',mode:'manual',name:'phone-manual'},
    {width:320,height:568,locale:'de',hand:'left',mode:'manual',name:'compact-left'},
    {width:768,height:1024,locale:'th',hand:'right',mode:'manual',name:'tablet-thai'},
    {width:1363,height:768,locale:'en',hand:'left',mode:'automatic',name:'desktop-auto'},
    {width:393,height:628,locale:'de',hand:'right',mode:'empty-auto',name:'phone-empty-auto'},
    {width:430,height:825,locale:'de',hand:'right',mode:'pickup',name:'phone-pickup'},
    {width:393,height:744,locale:'de',hand:'left',mode:'timed',name:'phone-full-duration'},
  ];
  for(const scenario of scenarios){
    const h=harness();await h.call('progress','/me',null,{method:'GET'});
    Object.assign(h.profile(),{...emptyPlayerSave(),version:1,legacyImported:true,cardReveals:['grey-scout-1'],mission:{sector:1,phase:'normal',rulesVersion:2,snapshot:firstMissionSnapshot(3),savedAt:new Date().toISOString()}});
    for(const [product,model] of [['weapon_twin',2],['weapon_rapid_twin',3]])h.orders.push({user:'pilot-a',paid:true,product_id:product,pi_payment_id:'isolated-'+product,quantity:scenario.mode==='empty-auto'&&model===2?1:10,weapon_model:model,payment_network:'Pi Testnet'});
    const context=await browser.newContext({viewport:{width:scenario.width,height:scenario.height},hasTouch:true,locale:scenario.locale==='de'?'de-AT':scenario.locale,reducedMotion:'no-preference'});
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
    await page.waitForFunction(()=>window.__ammoQA?.inspect().state.status==='playing');
    await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
    await page.evaluate(()=>window.__ammoQA.protect());
    const driveUntil=async predicate=>{for(let i=0;i<240;i++){if(await page.evaluate(predicate))return;await page.clock.runFor(100);await page.waitForTimeout(10);}throw Error('Controlled condition not reached: '+scenario.name);};
    const resume=async()=>{await page.evaluate(()=>window.__ammoQA.resume());await page.waitForTimeout(30);for(let i=0;i<3;i++){await page.clock.runFor(1000);await page.waitForTimeout(30);}await driveUntil(()=>window.__ammoQA.inspect().state.status==='playing');};
    await driveUntil(()=>{const a=window.__ammoQA.inspect();return a.formation&&a.state.phase!=='SECTOR_INTRO'&&a.state.phase!=='SECTOR_CLEAR';});
    await page.evaluate(()=>window.__ammoQA.open());await page.waitForTimeout(40);await page.evaluate(()=>window.__ammoQA.select(2));await page.waitForTimeout(30);
    check(scenario.name+': real handler grants a single 45-second charge',await page.evaluate(()=>window.__ammoQA.inspect().state.weaponTimers[2]===45000));
    const firstActivations=()=>requests.filter(r=>r.path==='/api/hangar/weapon/activate');
    check(scenario.name+': isolated stock is debited once',firstActivations().length===1);
    await resume();await driveUntil(()=>{const a=window.__ammoQA.inspect();return a.formation&&a.state.phase!=='SECTOR_INTRO'&&a.state.phase!=='SECTOR_CLEAR';});
    if(scenario.mode==='automatic'||scenario.mode==='empty-auto')await page.evaluate(()=>window.__ammoQA.auto(2,true));
    await page.evaluate(mode=>window.__ammoQA.expire(mode==='pickup'?'pickup':'paid',mode==='pickup'?5:2),scenario.mode);
    if(scenario.mode==='automatic'){
      await driveUntil(()=>window.__ammoQA.inspect().reloading===2&&!window.__ammoQA.inspect().busy);
      check('automatic reload suppresses the depleted-charge prompt',await page.evaluate(()=>window.__ammoQA.inspect().notice===null)&&await page.locator('.weapon-spent-action').count()===0);
      check('automatic reload confirms exactly one additional owned charge',firstActivations().length===2&&await page.evaluate(()=>window.__ammoQA.inspect().state.weaponTimers[2]>40000));
      await page.clock.runFor(5000);await page.waitForTimeout(30);
      check('purchase-weapon reload feedback stays visible beyond the former three seconds',await page.locator('.weapon-reloading').count()===1);
      await page.clock.runFor(1200);await page.waitForTimeout(30);
      check('reload feedback ends without creating another activation',await page.locator('.weapon-reloading').count()===0&&firstActivations().length===2);
    }else{
      await driveUntil(()=>!!window.__ammoQA.inspect().notice?.visible);
      const notice=page.locator('.weapon-reloading');await notice.waitFor();
      const text=await notice.innerText();
      check(scenario.name+': exhausted type is named before fallback',text.includes(scenario.mode==='pickup'?'Plasma':scenario.locale==='th'?'':scenario.locale==='de'?'Doppel':'Twin'));
      const readGeometry=()=>notice.evaluate(node=>{
        const box=node.getBoundingClientRect(),field=node.closest('.game-field').getBoundingClientRect();
        const blockers=[...node.closest('.game-field').querySelectorAll('.game-hud,.game-label,.flight-indicator,.bonus-counter,.combat-variety-notice,.reinforcement-notice,.sector-banner,.combo-notice,.pickup-notice,.weapon-control-wrap,.shield-control-wrap,.power-timer,.edge-action-purchased')].map(n=>{const b=n.getBoundingClientRect();return{left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};}).filter(b=>b.width&&b.height);
        return{box:{left:box.left,right:box.right,top:box.top,bottom:box.bottom},field:{left:field.left,right:field.right,top:field.top,bottom:field.bottom},color:getComputedStyle(node).color,visibility:getComputedStyle(node).visibility,overlaps:blockers.filter(b=>box.left<b.right&&box.right>b.left&&box.top<b.bottom&&box.bottom>b.top),buttonEvents:getComputedStyle(node.querySelector('button')).pointerEvents};
      });
      const geometry=await readGeometry();
      check(scenario.name+': red high-contrast message covers no existing text/control',geometry.color==='rgb(255, 155, 159)'&&geometry.overlaps.length===0&&geometry.visibility==='visible');
      check(scenario.name+': message and action stay inside the field',geometry.box.left>=geometry.field.left&&geometry.box.right<=geometry.field.right&&geometry.box.top>=geometry.field.top&&geometry.box.bottom<=geometry.field.bottom&&geometry.buttonEvents==='auto');
      const shown=await page.evaluate(()=>window.__ammoQA.inspect());await page.clock.runFor(1500);await page.waitForTimeout(30);
      check(scenario.name+': reading time is long and creates no automatic purchase/reload',await page.locator('.weapon-spent-action').count()===1&&firstActivations().length===1&&await page.evaluate(()=>window.__ammoQA.inspect().notice.remainingMs>0));
      if(scenario.name==='phone-manual'){
        await page.locator('.pause-control').tap();await page.waitForTimeout(30);const paused=await page.evaluate(()=>window.__ammoQA.inspect());
        await page.clock.runFor(12000);await page.waitForTimeout(30);
        check('manual pause retains the exact remaining notice time and never resumes itself',await page.evaluate(()=>window.__ammoQA.inspect().state.status)==='paused'&&await page.evaluate(()=>window.__ammoQA.inspect().notice.remainingMs)===paused.notice.remainingMs);
        await resume();await driveUntil(()=>!!window.__ammoQA.inspect().notice?.visible);
        await page.evaluate(()=>window.__ammoQA.interrupt());await page.waitForTimeout(30);const technical=await page.evaluate(()=>window.__ammoQA.inspect());
        await page.clock.runFor(10000);await page.waitForTimeout(30);
        check('technical pause retains notice time and requires explicit Resume',technical.technical&&await page.evaluate(()=>window.__ammoQA.inspect().state.status)==='paused'&&await page.evaluate(()=>window.__ammoQA.inspect().notice.remainingMs)===technical.notice.remainingMs);
        await resume();await driveUntil(()=>!!window.__ammoQA.inspect().notice?.visible);
      }
      if(scenario.name==='phone-manual'){
        const activeNotice=await page.evaluate(()=>window.__ammoQA.inspect().notice.remainingMs);
        await page.evaluate(()=>window.__ammoQA.layoutCue(true));await page.waitForTimeout(80);
        const layered=await readGeometry();
        check('level/bonus-style title and pickup text keep their space; notice moves or defers',layered.visibility==='hidden'||layered.overlaps.length===0);
        await page.clock.runFor(1000);await page.waitForTimeout(30);
        check('reading time is preserved while the competing transition occupies the field',await page.evaluate(()=>window.__ammoQA.inspect().notice.remainingMs)===activeNotice);
        await page.evaluate(()=>window.__ammoQA.layoutCue(false));await page.waitForTimeout(40);await driveUntil(()=>!!window.__ammoQA.inspect().notice?.visible);
      }
      if(scenario.mode==='timed'){
        for(let i=0;i<240&&await page.evaluate(()=>!!window.__ammoQA.inspect().notice);i++){await page.clock.runFor(250);await page.waitForTimeout(10);}
        check('full visible-active reading deadline releases both the transient record and its action',await page.evaluate(()=>window.__ammoQA.inspect().notice)===null&&await page.locator('.weapon-spent-action').count()===0);
        check('reading to the end activates no extra charge',firstActivations().length===1);
        check(scenario.name+': all real local handler responses succeed',requests.every(r=>r.status<400));
        await context.close();continue;
      }
      await page.screenshot({path:output+'/'+scenario.name+'.png',animations:'allow'});
      const beforeOpen=firstActivations().length;await page.locator('.weapon-spent-action').tap();await page.waitForTimeout(40);
      check(scenario.name+': visible action opens the existing paused weapon shop and dismisses the notice',await page.locator('.weapon-selection-dialog').count()===1&&await page.evaluate(()=>window.__ammoQA.inspect().state.status)==='paused'&&await page.evaluate(()=>window.__ammoQA.inspect().notice)===null);
      check(scenario.name+': opening the shop grants nothing and changes no charge stock',firstActivations().length===beforeOpen);
      await page.evaluate(()=>window.__ammoQA.select(3));await page.waitForTimeout(50);
      check(scenario.name+': a different owned weapon is selected through the original confirmed handler',await page.evaluate(()=>window.__ammoQA.inspect().state.weaponLevel)===3&&firstActivations().length===2);
      result.cases.push({scenario,text,geometry,shownNotice:shown.notice});
    }
    check(scenario.name+': no purchase API was called',requests.every(r=>!r.path.includes('/payment')&&!r.path.includes('/order')));
    check(scenario.name+': all real local handler responses succeed',requests.every(r=>r.status<400));
    await context.close();
  }
  check('no JavaScript page errors',result.errors.length===0);result.complete=true;
}catch(error){result.failure={message:error.message,stack:error.stack};throw error;}
finally{await browser?.close();await server?.close();writeFileSync(output+'/native.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({complete:result.complete,checks:result.checks.length,failure:result.failure?.message}));}
