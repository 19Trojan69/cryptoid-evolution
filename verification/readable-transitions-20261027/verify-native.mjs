// Local real GamePage/handler control. A synthetic fatal shot uses normal damage.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(new URL('../..', import.meta.url).pathname), require = createRequire(root + '/frontend/package.json');
const { createServer } = require('vite'), { webkit } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const backendRequire = createRequire(root + '/backend/src/handlers/progress.test.mjs');
const harnessSource = readFileSync(root + '/backend/src/handlers/progress.test.mjs', 'utf8');
const harness = new Function('require', harnessSource.slice(harnessSource.indexOf('const get ='), harnessSource.indexOf('const snapshot =')) + '\nreturn harness;')(backendRequire);
const { emptyPlayerSave, firstMissionSnapshot } = backendRequire('../../build/playerSave.js');
const base = '09a6a4047236c7c8cc5ef430386fd0c6825ebb41', control = process.argv.includes('--control');
const output = root + '/verification/readable-transitions-20261027/results'; mkdirSync(output, { recursive: true });
const result = { baseline: base, control, localOnly: true, realGamePageAndApiHandlers: true, syntheticSdkAndFatalShot: true,
  controlledClock: true, nativeAnimationHeldThenResumedForBoundary: true, physicalDevice: false, temperatureMeasured: false, checks: [], errors: [], complete: false };
const check = (name, value) => { assert.ok(value, name); result.checks.push(name); console.log(name); };
const hooks = `
  (window as any).__readable = {
    inspect: () => ({state:structuredClone(stateRef.current), elapsed:sectionElapsedRef.current,clear:clearTimerRef.current,flight:flightRef.current,technical:technicalPause}),
    resume: resumeWeaponSelection, checkpoint: saveCombat,
    interrupt: () => interruptionRef.current('loop-stall'),
    setup: (phase:string) => {const s=stateRef.current;s.phase=phase;s.asteroids=[];s.shots=[];s.enemyShots=[];s.effects=[];s.rockEffects=[];
      sectionElapsedRef.current=phase==='SECTOR_CLEAR'?SECTION_INTRO_MS:0;clearTimerRef.current=0;formationIndexRef.current=phase==='SECTOR_CLEAR'?(sectionSlotsRef.current?.length??6):0;formationStartedRef.current=false;
      if(phase==='SECTOR_CLEAR'){flightRef.current=blockFlights(s.sector,rulesVersionRef.current).length-1;s.chainResult='BLOCK LINKED';}
      s.paidWeaponLevel=2;s.paidWeaponMs=45000;s.weaponTimers[2]=45000;s.weaponSource='paid';s.unlockedWeapons=[1,2];s.pickupWeaponLevel=3;s.pickupWeaponMs=20000;
      s.shieldMs=10000;s.shieldCharges=2;s.overdriveMs=10000;s.rapidFireMs=10000;s.empMs=10000;s.purchasedShieldMs=10000;
      setGame({...s});},
  };
`;
let server, browser;
try {
  server = await createServer({ root: root + '/frontend', cacheDir: output + (control ? '/vite-control' : '/vite-candidate'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [root] } },
    plugins: [{ name: 'local-game-over-control', enforce: 'pre', transform(code, id) {
      if (!id.endsWith('/GamePage.tsx')) return;
      if (control) code = execFileSync('git', ['show', base + ':frontend/src/pages/GamePage.tsx'], { cwd: root, encoding: 'utf8' });
      return code.replace('  const levelLabel =', hooks + '\n  const levelLabel =');
    }, transformIndexHtml: { order: 'post', handler: html => html.replace(/appNetwork:\s*"[^"]*"/, 'appNetwork: "testnet"').replace(/backendURL:\s*"[^"]*"/, 'backendURL: "/api"') } }] });
  server.middlewares.use((req, res, next) => {
    if (!/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(req.url || '')) return next();
    res.setHeader('Content-Type', 'font/ttf'); res.end(readFileSync(root + '/verification/white-screen-fonts/' + req.url.split('/').at(-1)));
  });
  await server.listen(); const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  const wpe = root + '/verification/native-browsers/webkit-2336/minibrowser-wpe';
  const libs = root + '/verification/effect-path-reuse-20261027/local-libraries/extracted/usr/lib/x86_64-linux-gnu';
  browser = await webkit.launch({ headless: true, executablePath: wpe + '/bin/MiniBrowser', env: { ...process.env,
    WEBKIT_EXEC_PATH: wpe + '/bin', WEBKIT_INJECTED_BUNDLE_PATH: wpe + '/lib', WEBKIT_INSPECTOR_RESOURCES_PATH: wpe + '/share',
    LD_LIBRARY_PATH: `${wpe}/lib:${wpe}/sys/lib:${libs}`, GST_PLUGIN_SYSTEM_PATH_1_0: libs + '/gstreamer-1.0',
    GST_PLUGIN_SCANNER: libs + '/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner', GST_REGISTRY_1_0: output + '/registry.bin' } });
  result.engine = browser.version();
  const scenarios = [
    {stage:1,encounter:'normal',phase:'SECTOR_INTRO',duration:4800,label:'level'},
    {stage:55,encounter:'normal',phase:'SECTOR_INTRO',duration:4800,label:'quantum-block',pause:true},
    {stage:499,encounter:'normal',phase:'SECTOR_CLEAR',duration:5200,label:'block-clear'},
    {stage:60,encounter:'boss-intro',phase:'SECTOR_INTRO',duration:4900,label:'boss-warning'},
    {stage:60,encounter:'bonus',phase:'SECTOR_INTRO',duration:4800,label:'bonus'},
    {stage:55,encounter:'normal',phase:'SECTOR_INTRO',duration:4800,label:'system-reduced',motion:'reduce'},
    {stage:60,encounter:'boss-intro',phase:'SECTOR_INTRO',duration:4900,label:'setting-reduced-tablet',settingReduced:true,width:768,height:1024},
  ];
  result.scenarios=[];
  for (const scenario of scenarios) {
    const h=harness();await h.call('progress','/me',null,{method:'GET'});
    const cards=['grey-scout-1'];
    Object.assign(h.profile(), {...emptyPlayerSave(),version:1,legacyImported:true,cardReveals:cards,
      mission:{sector:scenario.stage,phase:scenario.encounter==='normal'?'normal':scenario.encounter==='bonus'?'bonus':'boss',rulesVersion:2,
        snapshot:{...firstMissionSnapshot(3),score:27795,shards:1613,destroyed:247,damageCount:2,comboTotal:43},savedAt:new Date().toISOString()}});
    h.orders.push({user:'pilot-a',paid:true,product_id:'weapon_twin',pi_payment_id:'local-readable-charges',quantity:10,weapon_model:2,payment_network:'Pi Testnet'});
    h.docs[0].rewardEventKeys={testnet:[]};
    for(let stage=1;stage<scenario.stage;stage++)if(stage%10)h.docs[0].rewardEventKeys.testnet.push('block:'+stage);else h.docs[0].rewardEventKeys.testnet.push('boss:'+stage/10,'bonus:'+stage/10);
    const context=await browser.newContext({viewport:{width:scenario.width||393,height:scenario.height||744},hasTouch:true,locale:'de-AT',reducedMotion:scenario.motion||'no-preference'});
    await context.addInitScript(() => {window.Pi={init(){},getPiHostAppInfo:async()=>({hostApp:'web'})};localStorage.setItem('cryptoid_pi_session','1');localStorage.setItem('cryptoid_home_music','off');localStorage.setItem('cryptoid_card_reveals_v1_testnet_pilot-a',JSON.stringify(['grey-scout-1']));});
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
      if(group==='hangar'&&endpoint==='/start'&&response.code===200){h.session.scoreRun.startedAt-=3_600_000;h.profile().lastStart.runMeta.startedAt=h.session.scoreRun.startedAt;}
      requests.push({path:u.pathname,status:response.code,error:response.body?.error});
      return route.fulfill({status:response.code,contentType:'application/json',body:response.code===204?'':JSON.stringify(response.body)});
    });
    const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
    await page.clock.install();await page.goto(origin+'/game');await page.getByRole('button',{name:'Fortsetzen',exact:true}).click();
    await page.waitForFunction(()=>window.__readable?.inspect().state.status==='playing');
    await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
    await page.evaluate(()=>window.__readable.checkpoint());
    const activation=await h.call('hangar','/weapon/activate',{runId:h.session.scoreRun.id,level:2,requestId:'readable-activation-0001'});
    check(scenario.label+': timed fixture charge is confirmed by the real handler',activation.code===200);
    await page.evaluate(phase=>window.__readable.setup(phase),scenario.phase);
    if(scenario.settingReduced)await page.evaluate(()=>document.documentElement.dataset.motion='reduced');
    const banner=page.locator('.sector-banner.readable-transition');await banner.waitFor();
    const read=()=>banner.evaluate(node=>({text:node.textContent,opacity:Number(getComputedStyle(node).opacity),animation:getComputedStyle(node).animationName,
      duration:getComputedStyle(node).animationDuration,childAnimation:getComputedStyle(node.querySelector('strong')).animationName,
      bounds:{x:node.getBoundingClientRect().x,y:node.getBoundingClientRect().y,width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height},
      native:node.getAnimations().map(a=>({name:a.animationName,time:Number(a.currentTime),state:a.playState,duration:a.effect.getTiming().duration,iterations:a.effect.getTiming().iterations}))}));
    const before=await page.evaluate(()=>window.__readable.inspect());
    await page.clock.runFor(3000);await page.waitForTimeout(40);
    check(scenario.label+': actual title and phase survive three active seconds',await banner.count()===1&&(await page.evaluate(()=>window.__readable.inspect())).state.phase===scenario.phase);
    const middle=await read(),reduced=scenario.motion==='reduce'||scenario.settingReduced;
    check(scenario.label+': native animation matches phase or reduced motion stays static',reduced?middle.animation==='none'&&middle.opacity===1:middle.animation==='readable-notice'&&middle.native[0]?.duration===scenario.duration&&middle.native[0]?.iterations===1);
    check(scenario.label+': competing child title animations are absent',middle.childAnimation==='none');
    check(scenario.label+': existing text remains within the viewport',middle.bounds.x>=0&&middle.bounds.x+middle.bounds.width<=(scenario.width||393)+1);
    const during=await page.evaluate(()=>window.__readable.inspect());
    const clockKeys=['paidWeaponMs','pickupWeaponMs','shieldMs','overdriveMs','rapidFireMs','empMs','purchasedShieldMs'];
    check(scenario.label+': reading consumes no active equipment time',clockKeys.every(k=>during.state[k]===before.state[k]));
    if(!reduced)await banner.evaluate(node=>{for(const a of node.getAnimations())a.currentTime=1500;});
    if(scenario.pause){
      await banner.evaluate(node=>window.__retainedReadable=node);
      await page.locator('.pause-control').tap();const paused=await page.evaluate(()=>window.__readable.inspect());
      await page.waitForTimeout(80);const a=await read();await page.clock.runFor(6000);await page.waitForTimeout(250);const b=await read();
      result.pauseObservation={a,b,paused,after:await page.evaluate(()=>window.__readable.inspect()),same:await page.evaluate(()=>window.__retainedReadable===document.querySelector('.readable-transition'))};console.log(JSON.stringify({pauseObservation:result.pauseObservation}));
      check('manual pause: same mounted title, native clock and phase stay frozen',await page.evaluate(()=>window.__retainedReadable===document.querySelector('.readable-transition'))&&b.native[0].state==='paused'&&Math.abs(b.native[0].time-a.native[0].time)<1&&await page.evaluate(()=>window.__readable.inspect().elapsed)===paused.elapsed);
      await page.evaluate(()=>window.__readable.resume());await page.waitForTimeout(40);for(let tick=0;tick<2;tick++){await page.clock.runFor(1000);await page.waitForTimeout(40);}await page.clock.runFor(999);
      check('manual pause: waiting/countdown cannot skip the remaining title',await page.evaluate(()=>window.__readable.inspect().state.status)==='paused'&&await banner.count()===1);
      await page.clock.runFor(1);await page.waitForTimeout(200);const resumed=await read();
      result.resumeObservation={resumed,state:await page.evaluate(()=>window.__readable.inspect())};
      check('explicit Resume: native title continues without remounting',await page.evaluate(()=>window.__retainedReadable===document.querySelector('.readable-transition'))&&resumed.native[0].state==='running'&&resumed.native[0].time>b.native[0].time);
      await page.evaluate(()=>window.__readable.interrupt());const technical=await page.evaluate(()=>window.__readable.inspect());await page.clock.runFor(6000);await page.waitForTimeout(100);
      check('technical pause: waiting never resumes combat or skips the title',technical.technical&&await page.evaluate(()=>window.__readable.inspect().state.status)==='paused'&&await page.evaluate(()=>window.__readable.inspect().elapsed)===technical.elapsed&&(await read()).native[0].state==='paused');
      await page.evaluate(()=>window.__readable.resume());await page.waitForTimeout(40);for(let tick=0;tick<3;tick++){await page.clock.runFor(1000);await page.waitForTimeout(40);}
    }
    await page.screenshot({path:output+'/'+scenario.label+'.png',animations:'allow'});
    const elapsed=await page.evaluate(phase=>phase==='SECTOR_CLEAR'?window.__readable.inspect().clear:window.__readable.inspect().elapsed,scenario.phase);
    await page.clock.runFor(Math.max(0,scenario.duration-elapsed-120));await page.waitForTimeout(20);
    check(scenario.label+': phase still retains the title near its full deadline',await banner.count()===1&&(await page.evaluate(()=>window.__readable.inspect())).state.phase===scenario.phase);
    await page.clock.runFor(250);await page.waitForTimeout(40);
    const final=await page.evaluate(()=>window.__readable.inspect());
    check(scenario.label+': phase advances only after the extended deadline',scenario.phase==='SECTOR_CLEAR'?final.state.sector!==scenario.stage:final.state.phase!=='SECTOR_INTRO');
    result.apiObservations=requests;console.log(JSON.stringify({apiErrors:requests.filter(r=>r.status>=400)}));
    check(scenario.label+': isolated real API handlers return no unexpected errors',requests.every(r=>r.status<400));
    result.scenarios.push({scenario,middle,requests,final:{status:final.state.status,phase:final.state.phase,sector:final.state.sector}});
    await context.close();
  }
  check('no JavaScript page errors',result.errors.length===0);result.complete=true;
} catch(error){result.failure={message:error.message,stack:error.stack};throw error;}
finally {await browser?.close();await server?.close();writeFileSync(output+'/native.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({complete:result.complete,checks:result.checks.length,failure:result.failure?.message}));}
