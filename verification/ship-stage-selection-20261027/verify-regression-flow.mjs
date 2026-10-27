// Local acceptance: real GamePage/loop, real API handlers, isolated account data.
// Test-only hooks finish combat; native clocks are controlled. No live Pi or DB.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(new URL('../..', import.meta.url).pathname);
const require = createRequire(resolve(root, 'frontend/package.json'));
const { createServer } = require('vite');
const { chromium } = require(process.env.CRYPTOID_PLAYWRIGHT_MODULE || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const backendRequire = createRequire(resolve(root, 'backend/src/handlers/progress.test.mjs'));
const source = readFileSync(resolve(root, 'backend/src/handlers/progress.test.mjs'), 'utf8');
const harness = new Function('require', source.slice(source.indexOf('const get ='), source.indexOf('const snapshot =')) + '\nreturn harness;')(backendRequire);
process.env.NODE_ENV='test';harness();
const { emptyPlayerSave, firstMissionSnapshot } = backendRequire('../../build/playerSave.js');
const output = resolve(root, 'verification/ship-stage-selection-20261027/results/regression-flow');
mkdirSync(output, { recursive: true });
const result = { localOnly: true, syntheticSdk: true, realApiHandlers: true, isolatedData: true,
  testOnlyCombatCompletion: true, controlledNativeClock: true, physicalDevice: false,
  historicalWhiteScreenFixed: false, checks: [], cases: [], errors: [], complete: false };
const check = (label, value) => { assert.ok(value, label); result.checks.push(label);console.log(label); };
const hooks = `
  (window as any).__levelFlow = {
    inspect: () => ({loopSteps:(window as any).__workLoopSteps??0,countdown:weaponCountdown,countdownStep:weaponCountdownStep,technicalPause,weaponMenuOpen,visibility:document.visibilityState,state:structuredClone(stateRef.current),summary:bossSummaryRef.current,prepared:bossSummaryPrepared,failed:bossSummaryFailed,canvas:canvasEffectResources(),activation:activationRef.current,busy:weaponBusy,saving:bossSummarySaving}),
    reload: () => reloadRequestRef.current(2),
    openWeapons: openWeaponSelection, select: (level:number) => selectWeaponLevel(level), resumeWeapon: resumeWeaponSelection,
    killBoss: () => destroyBoss(stateRef.current, performance.now()),
    collectHeart: () => {stateRef.current.player={...BOSS_HEART_POSITION};lastPlayerRef.current={...stateRef.current.player};},
    finishLastBonus: () => {const s=stateRef.current,{width,height}=fieldSizeRef.current,index=11,elapsed=1800,point=bonusPosition(index,elapsed,width,height);s.bonusHits=11;s.effects=[];s.bonusTargets=[{id:nextIdRef.current++,index,elapsed,...point,radius:22,...bonusShowcaseShip(index,s.sector)}];s.shots=makeShipVolley(shipSelectionRef.current.skin.id,shipStageRef.current,1,point.x,point.y+14,false,()=>nextIdRef.current++);s.phase='FORMATION';bonusIndexRef.current=BONUS_TARGET_COUNT;sectionElapsedRef.current=SECTION_INTRO_MS+100;setGame({...s});},
    finishBonus: (hits:number) => {const s=stateRef.current;s.bonusHits=hits;s.bonusTargets=[];s.shots=[];s.phase='FORMATION';bonusIndexRef.current=BONUS_TARGET_COUNT;sectionElapsedRef.current=SECTION_INTRO_MS+100;setGame({...s});},
  };
`;
let server, browser;
try {
  server = await createServer({ root: resolve(root, 'frontend'), cacheDir:resolve(output,'vite-flow'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, hmr: false, fs:{allow:[root,resolve(root,'frontend/node_modules')]} },
    plugins: [{ name: 'local-completion-acceptance', enforce: 'pre',
      transform(code, id) { if (id.endsWith('/GamePage.tsx')) return code.replace('  const levelLabel =', hooks + '\n  const levelLabel =').replace('const step = (time: number) => {', 'const step = (time: number) => { (window as any).__workLoopSteps=((window as any).__workLoopSteps??0)+1;'); },
      transformIndexHtml: {order:'post',handler(html) { return html.replace(/appNetwork:\s*"[^"]*"/,'appNetwork: "testnet"').replace(/backendURL:\s*"[^"]*"/,'backendURL: "/api"'); }},
    }],
  });
  writeFileSync(resolve(root,'frontend/entrance-preview-local.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/@fs/'+root+'/verification/level-completion-entrance/preview.tsx"></script></body></html>');
  server.middlewares.use((req,res,next)=>{if(!/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(req.url||''))return next();res.setHeader('Content-Type','font/ttf');res.end(readFileSync(resolve(root,'verification/white-screen-fonts',req.url.split('/').at(-1))));});
  await server.listen();
  const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  browser = await chromium.launch({headless:true});
  result.engine = browser.version();
  for (const scenario of [{stage:60,hits:12,fullHearts:true,realFinal:true,pauseCycles:true,motion:'no-preference'}, {stage:500,hits:12,failSave:true,realFinal:true}]) {
    console.log(JSON.stringify({scenario}));
    const h = harness(); await h.call('progress', '/me', null, { method: 'GET' });
    const card = `boss-${scenario.stage / 10}`, cards = ['grey-scout-1', card];
    Object.assign(h.profile(), { ...emptyPlayerSave(), version: 1, legacyImported: true, cardReveals: cards,
      mission: { sector: scenario.stage, phase: scenario.legacy ? 'bonus' : 'boss', rulesVersion: 2,
        snapshot: { ...firstMissionSnapshot(scenario.fullHearts?3:1), score:27795, shards:1613, destroyed:247, damageCount:2, comboTotal:43 }, savedAt: new Date().toISOString(),
        ...(scenario.legacy ? { bossIntermission: { stage: scenario.stage, createdAt: Date.now() } } : {}),
      } });
    h.orders.push({user:'pilot-a',paid:true,product_id:'weapon_twin',pi_payment_id:'local-ten-charges',quantity:10,weapon_model:2,payment_network:'Pi Testnet'});
    h.docs[0].rewardEventKeys = { testnet: [] };
    for (let stage = 1; stage < scenario.stage; stage++) {
      if (stage % 10) h.docs[0].rewardEventKeys.testnet.push('block:' + stage);
      else h.docs[0].rewardEventKeys.testnet.push('boss:' + stage / 10, 'bonus:' + stage / 10);
      if (stage % 10 === 9) h.docs[0].rewardEventKeys.testnet.push('chain:' + Math.ceil(stage / 10));
    }
    if (scenario.legacy) h.docs[0].rewardEventKeys.testnet.push('boss:' + scenario.stage / 10);
    const context = await browser.newContext({ viewport: { width: 393, height: scenario.height || 744 }, locale: 'de-AT', hasTouch: true, reducedMotion: scenario.motion || 'reduce' });
    await context.addInitScript(({cards,noStorage}) => {
      if(noStorage){const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('cryptoid_save_outbox_v1_'))throw new DOMException('Synthetic full storage','QuotaExceededError');return set.call(this,k,v);};}
      window.Pi = { init() {}, getPiHostAppInfo: async () => ({ hostApp: 'web' }) };
      localStorage.setItem('cryptoid_pi_session', '1'); localStorage.setItem('cryptoid_home_music', 'off');
      for (const network of ['testnet', 'mainnet']) localStorage.setItem(`cryptoid_card_reveals_v1_${network}_pilot-a`, JSON.stringify(cards));
    }, {cards,noStorage:scenario.noStorage});
    let releasePreparation; const preparationWait=new Promise(resolve=>{releasePreparation=resolve;}); let preparationHeld=false;
    let offline = false, activationStarted = false, releaseActivation; const requests = [];
    await context.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.hostname === 'fonts.googleapis.com') return route.fulfill({ contentType: 'text/css', body: '' });
      if (u.origin !== origin) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
      if (!u.pathname.startsWith('/api/')) return route.continue();
      const [group, ...parts] = u.pathname.slice(5).split('/'), endpoint = '/' + parts.join('/');
      const body = route.request().postDataJSON(); let response;
      if(group==='progress'&&endpoint==='/me'&&!preparationHeld){preparationHeld=true;await preparationWait;}
      if (group === 'user') response = { code: 200, body: { user: { uid: 'pilot-a', username: 'Local verification' }, canAdmin: false, adminMode: false } };
      else if (group === 'usage') response = { code: 204 };
      else if (offline && group === 'rewards' && body?.kind === 'bonus') response = { code: 503, body: { error: 'isolated_save_failure' } };
      else if (['progress', 'hangar', 'rewards', 'leaderboard'].includes(group)) {
        response = await h.call(group, endpoint, body, { method: route.request().method() });
        if (group === 'hangar' && endpoint === '/start' && response.code === 200) {
          h.session.scoreRun.startedAt -= 3_600_000; h.profile().lastStart.runMeta.startedAt = h.session.scoreRun.startedAt;
        }
      } else response = { code: 200, body: {} };
      if (scenario.activation && group === 'hangar' && endpoint === '/weapon/activate' && !activationStarted) {
        check('original activation is confirmed by the real backend before the bonus',response.code===200);
        activationStarted=true;await new Promise(resolve=>{releaseActivation=resolve;});
        if(scenario.activation==='lost')response={code:503,body:{error:'isolated_lost_activation_reply'}};
      }
      requests.push({ path: u.pathname, kind: body?.kind, status: response.code, error: response.body?.error });
      return route.fulfill({ status: response.code, contentType: 'application/json', body: response.code === 204 ? '' : JSON.stringify(response.body) });
    });
    const page = await context.newPage();
    context.on('requestfailed',req=>{result.failedRequests??=[];result.failedRequests.push({path:new URL(req.url()).origin+new URL(req.url()).pathname,error:req.failure()?.errorText});});
    const driveUntil = async predicate => {for(let elapsed=0;elapsed<70_000;elapsed+=250){if(await page.evaluate(predicate))return;await page.clock.runFor(250);await page.waitForTimeout(15);}throw Error('Controlled condition not reached');};
    page.on('pageerror', error => result.errors.push(error.message));
    await page.clock.install();
    await page.goto(origin + '/game');
    await page.waitForSelector('.mission-start-modal .launch-status i');
    check('pending mission uses three activity stripes',await page.locator('.mission-start-modal .launch-status i').count()===3);
    releasePreparation();
    await page.getByRole('button', { name: 'Fortsetzen', exact: true }).click().catch(async error=>{console.log(JSON.stringify({page:await page.locator('body').innerText(),requests}));throw error;});
    await page.waitForFunction(() => window.__levelFlow?.inspect().state.status === 'playing');
    await page.locator('.mission-start-modal .launch-status').waitFor({state:'detached'});
    check('mission activity feedback is removed when play is ready',await page.locator('.mission-start-modal .launch-status').count()===0);
    if(scenario.stage===60){
      await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
      await page.evaluate(()=>window.__levelFlow.openWeapons());
      await page.waitForSelector('.mission-duration');
      check('weapon menu states forty-five seconds per charge',await page.getByText('45 Sekunden pro Ladung',{exact:true}).count()>0);
      await page.evaluate(()=>window.__levelFlow.select(2));
      check('actual authenticated activation grants exactly forty-five seconds',await page.evaluate(()=>window.__levelFlow.inspect().state.weaponTimers[2]===45000));
      await page.evaluate(()=>window.__levelFlow.resumeWeapon());
      await page.waitForTimeout(30);console.log(JSON.stringify({countdownStart:await page.evaluate(()=>{const s=window.__levelFlow.inspect();return{countdown:s.countdown,step:s.countdownStep,technical:s.technicalPause,menu:s.weaponMenuOpen,visibility:s.visibility,status:s.state.status,source:s.state.weaponSource,remaining:s.state.paidWeaponMs};})}));for(let step=0;step<2;step++){await page.clock.runFor(500);await page.waitForTimeout(30);console.log(JSON.stringify({afterStep:step,values:await page.evaluate(()=>{const s=window.__levelFlow.inspect();return{countdown:s.countdown,step:s.countdownStep,technical:s.technicalPause,visibility:s.visibility,status:s.state.status};})}));}
      await page.clock.runFor(499);check('armed menu return stays paused until its half-length countdown finishes',await page.evaluate(()=>window.__levelFlow.inspect().state.status==='paused'));
      await page.clock.runFor(1);await page.waitForTimeout(15);check('armed menu return is playing at fifteen hundred milliseconds',await page.evaluate(()=>window.__levelFlow.inspect().state.status==='playing'));
      await page.locator('.pause-control').tap();await page.evaluate(()=>window.__levelFlow.resumeWeapon());
      await page.waitForTimeout(15);for(let step=0;step<2;step++){await page.clock.runFor(1000);await page.waitForTimeout(15);}
      await page.clock.runFor(999);check('ordinary pause keeps its full three-second countdown',await page.evaluate(()=>window.__levelFlow.inspect().state.status==='paused'));
      await page.clock.runFor(1);await page.waitForTimeout(15);check('ordinary Resume releases at three seconds',await page.evaluate(()=>window.__levelFlow.inspect().state.status==='playing'));
    }

    // Inspect the actual existing direct presenter, independent of React's
    // scene snapshots. No gameplay state is changed by this added inspection.
    const compareProjectiles = async label => {
      const detail = await page.evaluate(() => {
        const state = window.__levelFlow.inspect().state;
        const matches = (selector, shots) => {
          const nodes = [...document.querySelectorAll('.projectile-layer ' + selector)];
          return { nodes: nodes.length, shots: shots.length, equal: nodes.length === shots.length && nodes.every(node => {
            const [x, y = '0'] = node.style.translate.split(' ');
            return shots.some(shot => Math.abs(parseFloat(x) - shot.x) < .002 && Math.abs(parseFloat(y) - shot.y) < .002);
          }) };
        };
        return { player: matches('.player-laser', state.shots), hostile: matches('.enemy-laser', state.enemyShots) };
      });
      check(label + ': direct player and hostile DOM positions/counts match live simulation', detail.player.equal && detail.hostile.equal);
      result.projectileSamples ??= []; result.projectileSamples.push({ label, ...detail });
      return detail;
    };
    await driveUntil(() => { const s=window.__levelFlow.inspect().state; return s.status==='playing' && s.encounter==='boss-fight' && s.shots.length>0 && s.enemyShots.length>0; });
    const liveShots = await compareProjectiles(`stage ${scenario.stage} before boss defeat`);
    check(`stage ${scenario.stage}: actual player fire is present without a React projectile copy`, liveShots.player.shots > 0);
    check(`stage ${scenario.stage}: actual hostile fire is present without a React projectile copy`, liveShots.hostile.shots > 0);
    await page.clock.runFor(120); await compareProjectiles(`stage ${scenario.stage} moving fire`);
    await page.locator('.pause-control').tap();
    const heldPositions = await page.locator('.projectile-layer').evaluate(node => [...node.querySelectorAll('.player-laser,.enemy-laser')].map(n => n.style.translate));
    await page.clock.runFor(4000);
    check(`stage ${scenario.stage}: paused live projectiles stay fixed without automatic Resume`,
      await page.evaluate(() => window.__levelFlow.inspect().state.status) === 'paused' &&
      JSON.stringify(heldPositions) === JSON.stringify(await page.locator('.projectile-layer').evaluate(node => [...node.querySelectorAll('.player-laser,.enemy-laser')].map(n => n.style.translate))));
    await page.evaluate(() => window.__levelFlow.resumeWeapon()); await driveUntil(() => window.__levelFlow.inspect().state.status === 'playing');
    await page.clock.runFor(100); await compareProjectiles(`stage ${scenario.stage} live fire after explicit Resume`);

    if (scenario.legacy) {
      await page.clock.runFor(1000);
      check('legacy marker moves before bonus without separate summary', h.profile().mission.bossIntermission === undefined && await page.locator('.level-completion').count() === 0);
    } else {
      await page.evaluate(() => window.__levelFlow.killBoss());
      await page.clock.runFor(12_000);
      check(`stage ${scenario.stage}: no summary before heart and bonus`, await page.locator('.level-completion').count() === 0);
      await page.evaluate(() => window.__levelFlow.collectHeart());
      await page.clock.runFor(3500);
      await page.waitForFunction(() => window.__levelFlow.inspect().state.encounter === 'bonus');
      check(`stage ${scenario.stage}: actual boss event has no legacy stop`, h.profile().mission.phase === 'bonus' && h.profile().mission.bossIntermission === undefined);
    }
    if(scenario.pauseCycles && process.env.BASELINE!=='1') {
      for(let cycle=1;cycle<=5;cycle++) {
        await page.locator('.pause-control').tap();
        const paused=await page.evaluate(()=>window.__levelFlow.inspect().state);
        const steps=await page.evaluate(()=>window.__levelFlow.inspect().loopSteps);
        await page.clock.runFor(4000);
        const waiting=await page.evaluate(()=>window.__levelFlow.inspect().state);
        check(`pause ${cycle}: frozen until an explicit Resume`,waiting.status==='paused' && ['score','shards','hearts'].every(k=>waiting[k]===paused[k]));
        if(!paused.effects.length)check(`pause ${cycle}: empty-effect game loop stays dormant`,await page.evaluate(()=>window.__levelFlow.inspect().loopSteps)===steps);
        await page.evaluate(()=>window.__levelFlow.resumeWeapon());
        await driveUntil(()=>window.__levelFlow.inspect().state.status==='playing');
      }
    }
    if(scenario.activation) {
      check('actual automatic reload starts while bonus combat is playable',await page.evaluate(()=>window.__levelFlow.reload()));
      for(let i=0;i<100 && !activationStarted;i++)await page.waitForTimeout(20);
      check('original activation response is held while the bonus ends',activationStarted && await page.evaluate(()=>window.__levelFlow.inspect().busy));
    }
    offline = !!scenario.failSave;
    if (scenario.staleSession) h.session.scoreRun = {...h.session.scoreRun,id:"stale-session-run"};
    if(scenario.realFinal)await page.evaluate(()=>window.__levelFlow.finishLastBonus());
    else await page.evaluate(hits => window.__levelFlow.finishBonus(hits), scenario.hits);
    await page.clock.runFor(200);
    if(scenario.realFinal) {
      const last=await page.evaluate(()=>window.__levelFlow.inspect());
      check('the real final shot creates the last explosion before any summary',last.state.bonusHits===12 && last.state.effects.some(e=>e.kind==='explosion') && !last.summary);
      if(scenario.motion==='no-preference') {
        await page.locator('.pause-control').tap();await page.clock.runFor(4000);
        check('pausing during the last explosion cannot open or auto-resume the summary',await page.evaluate(()=>window.__levelFlow.inspect().state.status==='paused' && !window.__levelFlow.inspect().summary));
        await page.evaluate(()=>window.__levelFlow.resumeWeapon());await driveUntil(()=>window.__levelFlow.inspect().state.status==='playing');
      }
      const earned={score:last.state.score,shards:last.state.shards,hearts:last.state.hearts,destroyed:last.state.destroyed};
      await page.clock.runFor(1000);
      check('the original explosion keeps its full lifetime',await page.evaluate(()=>!window.__levelFlow.inspect().summary && window.__levelFlow.inspect().state.effects.length>0));
      await page.clock.runFor(1250);
      check('a quiet beat follows the expired explosion',await page.evaluate(()=>!window.__levelFlow.inspect().summary && window.__levelFlow.inspect().state.effects.length===0));
      await driveUntil(()=>!!window.__levelFlow.inspect().summary);
      const settled=await page.evaluate(()=>window.__levelFlow.inspect().state);
      check('the outro cannot change the already queued reward snapshot',Object.keys(earned).every(k=>earned[k]===settled[k]));
    }
    await driveUntil(()=>!!window.__levelFlow.inspect().summary);
    await page.locator('.level-completion').waitFor();
    const button = page.getByRole('button', { name: 'Spiel fortsetzen', exact: false });
    check(`stage ${scenario.stage}: Continue follows save readiness without a countdown`,await page.evaluate(()=>{const f=window.__levelFlow.inspect(),button=document.querySelector('.level-completion .button-primary');return button.disabled===!(f.prepared&&!f.saving&&!f.failed);}));
    if(scenario.activation) {
      await page.clock.runFor(12_000);
      const waiting=await page.evaluate(()=>window.__levelFlow.inspect());
      if(process.env.BASELINE==='1') {
        check('released completion falsely fails while the successful activation reply is pending',waiting.failed && !waiting.prepared && await button.isDisabled());
        releaseActivation();await page.waitForLoadState('networkidle');
        check('released completion does not prepare after the successful reply arrives',await page.evaluate(()=>window.__levelFlow.inspect().failed && !window.__levelFlow.inspect().prepared));
        result.cases.push({...scenario,requests});await context.close();continue;
      }
      check('completion waits without failure or retry while activation is still in flight',waiting.busy && waiting.saving && !waiting.failed && !waiting.prepared && await button.isDisabled() && await page.getByRole('button',{name:'Erneut speichern',exact:true}).count()===0);
      check('the original activation has consumed one charge',h.docs[0].weaponStockByNetwork.testnet.balances.weapon_twin===9);
      releaseActivation();
      await driveUntil(()=>window.__levelFlow.inspect().prepared || window.__levelFlow.inspect().failed);
      check('activation settlement triggers preparation without a Retry click',await page.evaluate(()=>window.__levelFlow.inspect().prepared && !window.__levelFlow.inspect().failed && !window.__levelFlow.inspect().busy));
      check('activation settlement consumes no second charge',h.docs[0].weaponStockByNetwork.testnet.balances.weapon_twin===9 && Object.keys(h.docs[0].weaponStockByNetwork.testnet.activations).length===1);
      check('only the original uncertain activation receipt can be replayed',requests.filter(r=>r.path==='/api/hangar/weapon/activate').length === (scenario.activation==='lost'?2:1));
    }
    if (scenario.staleSession) {
      await driveUntil(()=>window.__levelFlow.inspect().failed);
      const retry=page.getByRole('button',{name:'Erneut speichern',exact:true}); await retry.waitFor();
      check('stale session run blocks Continue with the bonus still backed up',await button.isDisabled());
      await retry.tap(); await driveUntil(()=>{const f=window.__levelFlow.inspect();return f.prepared||f.failed;});
      if(process.env.BASELINE==='1') {
        check('published Retry fails to recover the signed-in active run',await retry.isVisible() && h.session.scoreRun.id === "stale-session-run" && requests.filter(r=>r.status===403).length>=2);
        result.cases.push({scenario,requests});await page.waitForLoadState('networkidle');await context.close();continue;
      }
    }
    if (scenario.failSave) {
      await driveUntil(()=>window.__levelFlow.inspect().failed);
      await page.getByRole('button', { name: 'Erneut speichern', exact: true }).waitFor();
      check('campaign save failure retains bonus checkpoint and blocks Continue', await button.isDisabled() && h.profile().mission?.phase === 'bonus');
      if(!scenario.noStorage) check('failed bonus remains in durable outbox', await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('cryptoid_save_outbox_v1_')).some(k => JSON.parse(localStorage.getItem(k) || '[]').some(e => e.path === '/rewards/event' && e.body.kind === 'bonus'))));
      if(scenario.noStorage) {
        await page.locator('.home-control').tap();
        check('no local escape is offered when the durable outbox write failed',await page.getByRole('button',{name:'Mit lokaler Sicherung zur Basis',exact:true}).count()===0);
        await page.getByRole('button',{name:'Weiterspielen',exact:true}).tap();
      }
      if(scenario.returnLocal) {
        const retained=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('cryptoid_save_outbox_v1_')).map(k=>localStorage.getItem(k)));
        await page.locator('.home-control').tap();
        await page.getByRole('button',{name:process.env.BASELINE==='1'?'Spiel verlassen':'Erneut speichern',exact:true}).tap();await driveUntil(()=>!document.querySelector('.game-modal .modal-actions button')?.disabled);
        await page.getByRole('button',{name:process.env.BASELINE==='1'?'Spiel verlassen':'Mit lokaler Sicherung zur Basis',exact:true}).waitFor();
        check('failed confirmed exit stays on the game with pending rewards',page.url().endsWith('/game') && h.profile().mission.phase==='bonus');
        if(process.env.BASELINE==='1') {
          check('published Home exit has no available route out while its save fails',await page.getByRole('button',{name:'Mit lokaler Sicherung zur Basis',exact:true}).count()===0);
          result.cases.push({...scenario,requests});await page.waitForLoadState('networkidle');await context.close();continue;
        }
        await page.screenshot({path:resolve(output,'home-local-backup-393x628.png')});
        const local=page.getByRole('button',{name:'Mit lokaler Sicherung zur Basis',exact:true});
        await local.tap();await page.waitForURL(origin+'/');await page.waitForLoadState('networkidle');
        check('explicit local exit reaches Home without finishing the active run',!!h.profile().activeRunId && !requests.some(r=>r.path==='/api/leaderboard/score'));
        check('local exit retains the exact unconfirmed outbox',JSON.stringify(retained)===JSON.stringify(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('cryptoid_save_outbox_v1_')).map(k=>localStorage.getItem(k)))));
        offline=false;await page.goto(origin+'/game');await page.getByRole('button',{name:'Fortsetzen',exact:true}).click();await page.waitForFunction(()=>window.__levelFlow?.inspect().state.status==='playing');
        check('re-entry recovers the retained bonus before resuming the next level',h.profile().mission.sector===31 && await page.evaluate(()=>window.__levelFlow.inspect().state.sector)===31);
        check('recovered bonus is credited once',h.docs[0].rewardEventKeys.testnet.filter(k=>k==='bonus:3').length===1);
        result.cases.push({...scenario,requests});await page.waitForLoadState('networkidle');await context.close();continue;
      }
      offline = false; await page.getByRole('button', { name: 'Erneut speichern', exact: true }).tap();
    }
    if(scenario.motion==='no-preference') {
      const captured=await page.evaluate(()=>{const overlay=document.querySelector('.level-completion-overlay');const animations=overlay.getAnimations({subtree:true}).filter(a=>a.animationName?.startsWith('completion-'));const sampled=animations.map(a=>({name:a.animationName,iterations:a.effect.getTiming().iterations,started:a.playState==='running'}));for(const a of animations){a.pause();a.currentTime=480;}return sampled;});
      check('the holographic entrance has finite native animations',captured.length>=7 && captured.every(a=>a.iterations===1 && a.started));
      await page.screenshot({path:resolve(output,'entrance-480ms-393x744.png')});
      const staged=await page.evaluate(()=>({title:Number(getComputedStyle(document.querySelector('.level-completion header')).opacity),stats:Number(getComputedStyle(document.querySelector('.level-completion-stats')).opacity)}));
      check('the headline arrives before the statistics',staged.title>0 && staged.stats===0);
      await page.evaluate(()=>{for(const a of document.querySelector('.level-completion-overlay').getAnimations({subtree:true}).filter(a=>a.animationName?.startsWith('completion-')))a.finish();});
      await page.screenshot({path:resolve(output,'entrance-complete-393x744.png')});
    } else check('reduced motion has no new entrance animation',await page.evaluate(()=>document.querySelector('.level-completion-overlay').getAnimations({subtree:true}).every(a=>!a.animationName?.startsWith('completion-'))));
    await page.waitForFunction(() => window.__levelFlow.inspect().prepared,undefined,{timeout:15000}).catch(async error=>{console.log(JSON.stringify({inspection:await page.evaluate(()=>window.__levelFlow.inspect()),requests}));throw error;});
    check(`stage ${scenario.stage}: Continue is immediately enabled after confirmed preparation`,await button.isEnabled());
    check(`stage ${scenario.stage}: no reading countdown is rendered`,await page.locator('.level-completion-status').innerText()==='Im Pi-Konto gespeichert.');
    const idleSteps=await page.evaluate(()=>window.__levelFlow.inspect().loopSteps);
    await page.clock.runFor(5000);
    check(`stage ${scenario.stage}: prepared completion uses no game frames`,await page.evaluate(()=>window.__levelFlow.inspect().loopSteps)===idleSteps);
    await compareProjectiles(`stage ${scenario.stage} prepared summary`);
    const before = await page.evaluate(() => window.__levelFlow.inspect().state);
    check(`stage ${scenario.stage}: only an earned heart is displayed`, await page.locator('.level-completion-heart').count() === (scenario.hits === 12&&!scenario.fullHearts ? 1 : 0));
    if (scenario.stage === 500) check('final campaign checkpoint is null after acknowledged bonus', h.profile().mission === null);
    else check('next normal checkpoint includes exact score Shards and hearts', h.profile().mission.sector === scenario.stage+1 && ['score', 'shards', 'hearts'].every(key => h.profile().mission.snapshot[key] === before[key]));
    const persisted = structuredClone(h.profile()), events = requests.filter(r => r.path === '/api/rewards/event').length;
    await page.screenshot({ path: resolve(output, `summary-${scenario.stage}-${scenario.legacy ? 'legacy' : 'new'}.png`) });
    await button.tap({force:true});
    const after = await page.evaluate(() => window.__levelFlow.inspect().state);
    check(`stage ${scenario.stage}: Continue grants nothing`, ['score', 'shards', 'hearts'].every(key => before[key] === after[key]) && events === requests.filter(r => r.path === '/api/rewards/event').length);
    await page.clock.runFor(100);
    const advanced=await page.evaluate(()=>window.__levelFlow.inspect().state);
    if (scenario.stage === 500) check('final Continue reaches victory', advanced.status === 'victory');
    else check('Continue reaches the next normal level', advanced.sector === scenario.stage+1 && advanced.encounter === 'normal');
    if (scenario.stage !== 500) { await driveUntil(() => window.__levelFlow.inspect().state.shots.length>0); const nextShots = await compareProjectiles('next normal level after Continue'); check('next normal level fires with live direct presentation', nextShots.player.shots > 0); }
    if (scenario.stage !== 500) check('Continue leaves saved reward balances unchanged', ['balance', 'totalShardsEarned', 'totalShardsSpent', 'creditedShards'].every(key => h.profile()[key] === persisted[key]));
    check('no unexpected API failures', requests.every(r => r.status < 400 || r.error === 'isolated_save_failure' || r.error === 'isolated_lost_activation_reply' || scenario.staleSession && r.status===403));
    result.cases.push({ ...scenario, before: { score: before.score, shards: before.shards, hearts: before.hearts }, requests });
    await page.waitForLoadState('networkidle');await context.close();
  }
  check('no JavaScript page errors', result.errors.length === 0); result.complete = true;
} catch (error) { result.failure = { message: error.message, stack: error.stack }; throw error; }
finally { try{unlinkSync(resolve(root,'frontend/entrance-preview-local.html'));}catch{} writeFileSync(resolve(output, process.env.BASELINE==='1'?'published-control.json':'native.json'), JSON.stringify(result, null, 2) + '\n'); await browser?.close(); await server?.close(); console.log(JSON.stringify({ complete: result.complete, checks: result.checks.length, failure: result.failure?.message })); }
