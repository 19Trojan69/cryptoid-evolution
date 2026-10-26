// Local acceptance: real GamePage/loop, real API handlers, isolated account data.
// Test-only hooks finish combat; native clocks are controlled. No live Pi or DB.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {execFileSync} from 'node:child_process';
const root = resolve(new URL('../..', import.meta.url).pathname);
const require = createRequire(resolve(root, 'frontend/package.json'));
const { createServer } = require('vite');
const { webkit } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const backendRequire = createRequire(resolve(root, 'backend/src/handlers/progress.test.mjs'));
const source = readFileSync(resolve(root, 'backend/src/handlers/progress.test.mjs'), 'utf8');
const harness = new Function('require', source.slice(source.indexOf('const get ='), source.indexOf('const snapshot =')) + '\nreturn harness;')(backendRequire);
const { emptyPlayerSave, firstMissionSnapshot } = backendRequire('../../build/playerSave.js');
const output = resolve(root, 'verification/level-completion-confirmation/results');
mkdirSync(output, { recursive: true });
const result = { localOnly: true, syntheticSdk: true, realApiHandlers: true, isolatedData: true,
  testOnlyCombatCompletion: true, controlledNativeClock: true, physicalDevice: false,
  historicalWhiteScreenFixed: false, checks: [], cases: [], errors: [], complete: false };
const check = (label, value) => { assert.ok(value, label); result.checks.push(label);console.log(label); };
const hooks = `
  (window as any).__levelFlow = {
    inspect: () => ({state:structuredClone(stateRef.current),summary:bossSummaryRef.current,prepared:bossSummaryPrepared,failed:bossSummaryFailed,canvas:canvasEffectResources(),activation:activationRef.current}),
    killBoss: () => destroyBoss(stateRef.current, performance.now()),
    collectHeart: () => {stateRef.current.player={...BOSS_HEART_POSITION};lastPlayerRef.current={...stateRef.current.player};},
    finishBonus: (hits:number) => {const s=stateRef.current;s.bonusHits=hits;s.bonusTargets=[];s.shots=[];s.phase='FORMATION';bonusIndexRef.current=BONUS_TARGET_COUNT;sectionElapsedRef.current=SECTION_INTRO_MS+100;setGame({...s});},
  };
`;
let server, browser;
try {
  server = await createServer({ root: resolve(root, 'frontend'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, hmr: false },
    plugins: [{ name: 'local-completion-acceptance', enforce: 'pre',
      transform(code, id) { if (id.endsWith('/GamePage.tsx')) {if(process.env.BASELINE==='1')code=execFileSync('git',['show','220b199:frontend/src/pages/GamePage.tsx'],{cwd:root,encoding:'utf8'});return code.replace('  const levelLabel =', hooks + '\n  const levelLabel =');} },
      transformIndexHtml: {order:'post',handler(html) { return html.replace(/appNetwork:\s*"[^"]*"/,'appNetwork: "testnet"').replace(/backendURL:\s*"[^"]*"/,'backendURL: "/api"'); }},
    }],
  });
  await server.listen();
  const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  const base = resolve(root, 'verification/native-browsers/webkit-2336/minibrowser-wpe');
  const libs = resolve(root, 'verification/webkit-libs/usr/lib/x86_64-linux-gnu');
  browser = await webkit.launch({ headless: true, executablePath: base + '/bin/MiniBrowser', env: {
    ...process.env, WEBKIT_EXEC_PATH: base + '/bin', WEBKIT_INJECTED_BUNDLE_PATH: base + '/lib',
    WEBKIT_INSPECTOR_RESOURCES_PATH: base + '/share', LD_LIBRARY_PATH: `${base}/lib:${base}/sys/lib:${libs}`,
    GST_PLUGIN_SYSTEM_PATH_1_0: libs + '/gstreamer-1.0',
    GST_PLUGIN_SCANNER: libs + '/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner',
    GST_REGISTRY_1_0: resolve(output, 'audio-registry.bin'),
  } });
  result.engine = browser.version();
  for (const scenario of [{ stage: 30, hits: 12, fullHearts: true, staleSession: true }, {stage:30,hits:12,fullHearts:true,failSave:true,returnLocal:true,height:628}, {stage:30,hits:12,fullHearts:true,failSave:true,noStorage:true}, {stage:10,hits:0,legacy:true}, {stage:500,hits:12,failSave:true}].filter(s=>process.env.BASELINE!=='1'||s.staleSession||s.returnLocal)) {
    console.log(JSON.stringify({scenario}));
    const h = harness(); await h.call('progress', '/me', null, { method: 'GET' });
    const card = `boss-${scenario.stage / 10}`, cards = ['grey-scout-1', card];
    Object.assign(h.profile(), { ...emptyPlayerSave(), version: 1, legacyImported: true, cardReveals: cards,
      mission: { sector: scenario.stage, phase: scenario.legacy ? 'bonus' : 'boss', rulesVersion: 2,
        snapshot: { ...firstMissionSnapshot(scenario.fullHearts?3:1), score:27795, shards:1613, destroyed:247, damageCount:2, comboTotal:43 }, savedAt: new Date().toISOString(),
        ...(scenario.legacy ? { bossIntermission: { stage: scenario.stage, createdAt: Date.now() } } : {}),
      } });
    h.docs[0].rewardEventKeys = { testnet: [] };
    for (let stage = 1; stage < scenario.stage; stage++) {
      if (stage % 10) h.docs[0].rewardEventKeys.testnet.push('block:' + stage);
      else h.docs[0].rewardEventKeys.testnet.push('boss:' + stage / 10, 'bonus:' + stage / 10);
      if (stage % 10 === 9) h.docs[0].rewardEventKeys.testnet.push('chain:' + Math.ceil(stage / 10));
    }
    if (scenario.legacy) h.docs[0].rewardEventKeys.testnet.push('boss:' + scenario.stage / 10);
    const context = await browser.newContext({ viewport: { width: 393, height: scenario.height || 744 }, locale: 'de-AT', hasTouch: true, reducedMotion: 'reduce' });
    await context.addInitScript(({cards,noStorage}) => {
      if(noStorage){const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('cryptoid_save_outbox_v1_'))throw new DOMException('Synthetic full storage','QuotaExceededError');return set.call(this,k,v);};}
      window.Pi = { init() {}, getPiHostAppInfo: async () => ({ hostApp: 'web' }) };
      localStorage.setItem('cryptoid_pi_session', '1'); localStorage.setItem('cryptoid_home_music', 'off');
      for (const network of ['testnet', 'mainnet']) localStorage.setItem(`cryptoid_card_reveals_v1_${network}_pilot-a`, JSON.stringify(cards));
    }, {cards,noStorage:scenario.noStorage});
    let offline = false; const requests = [];
    await context.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.origin !== origin) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
      if (!u.pathname.startsWith('/api/')) return route.continue();
      const [group, ...parts] = u.pathname.slice(5).split('/'), endpoint = '/' + parts.join('/');
      const body = route.request().postDataJSON(); let response;
      if (group === 'user') response = { code: 200, body: { user: { uid: 'pilot-a', username: 'Local verification' }, canAdmin: false, adminMode: false } };
      else if (group === 'usage') response = { code: 204 };
      else if (offline && group === 'rewards' && body?.kind === 'bonus') response = { code: 503, body: { error: 'isolated_save_failure' } };
      else if (['progress', 'hangar', 'rewards', 'leaderboard'].includes(group)) {
        response = await h.call(group, endpoint, body, { method: route.request().method() });
        if (group === 'hangar' && endpoint === '/start' && response.code === 200) {
          h.session.scoreRun.startedAt -= 3_600_000; h.profile().lastStart.runMeta.startedAt = h.session.scoreRun.startedAt;
        }
      } else response = { code: 200, body: {} };
      requests.push({ path: u.pathname, kind: body?.kind, status: response.code, error: response.body?.error });
      return route.fulfill({ status: response.code, contentType: 'application/json', body: response.code === 204 ? '' : JSON.stringify(response.body) });
    });
    const page = await context.newPage();
    context.on('requestfailed',req=>{result.failedRequests??=[];result.failedRequests.push({path:new URL(req.url()).origin+new URL(req.url()).pathname,error:req.failure()?.errorText});});
    const driveUntil = async predicate => {for(let elapsed=0;elapsed<70_000;elapsed+=250){if(await page.evaluate(predicate))return;await page.clock.runFor(250);await page.waitForTimeout(15);}throw Error('Controlled condition not reached');};
    page.on('pageerror', error => result.errors.push(error.message));
    await page.clock.install();
    await page.goto(origin + '/game');
    await page.getByRole('button', { name: 'Fortsetzen', exact: true }).click();
    await page.waitForFunction(() => window.__levelFlow?.inspect().state.status === 'playing');
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
    offline = !!scenario.failSave;
    if (scenario.staleSession) h.session.scoreRun = {...h.session.scoreRun,id:"stale-session-run"};
    await page.evaluate(hits => window.__levelFlow.finishBonus(hits), scenario.hits);
    await page.clock.runFor(200);
    await driveUntil(()=>!!window.__levelFlow.inspect().summary);
    await page.locator('.level-completion').waitFor();
    const button = page.getByRole('button', { name: 'Spiel fortsetzen', exact: false });
    check(`stage ${scenario.stage}: summary appears after bonus and Continue is locked`, await button.isDisabled());
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
    await page.waitForFunction(() => window.__levelFlow.inspect().prepared,undefined,{timeout:15000}).catch(async error=>{console.log(JSON.stringify({inspection:await page.evaluate(()=>window.__levelFlow.inspect()),requests}));throw error;});
    await page.clock.runFor(9000); check(`stage ${scenario.stage}: ten prepared seconds required`, await button.isDisabled());
    await page.clock.runFor(1500); check(`stage ${scenario.stage}: ready Continue`, await button.isEnabled());
    const before = await page.evaluate(() => window.__levelFlow.inspect().state);
    check(`stage ${scenario.stage}: only an earned heart is displayed`, await page.locator('.level-completion-heart').count() === (scenario.hits === 12&&!scenario.fullHearts ? 1 : 0));
    if (scenario.stage === 500) check('final campaign checkpoint is null after acknowledged bonus', h.profile().mission === null);
    else check('next normal checkpoint includes exact score Shards and hearts', h.profile().mission.sector === scenario.stage+1 && ['score', 'shards', 'hearts'].every(key => h.profile().mission.snapshot[key] === before[key]));
    const persisted = structuredClone(h.profile()), events = requests.filter(r => r.path === '/api/rewards/event').length;
    await page.screenshot({ path: resolve(output, `summary-${scenario.stage}-${scenario.legacy ? 'legacy' : 'new'}.png`) });
    await button.tap();
    const after = await page.evaluate(() => window.__levelFlow.inspect().state);
    check(`stage ${scenario.stage}: Continue grants nothing`, ['score', 'shards', 'hearts'].every(key => before[key] === after[key]) && events === requests.filter(r => r.path === '/api/rewards/event').length);
    await page.clock.runFor(100);
    const advanced=await page.evaluate(()=>window.__levelFlow.inspect().state);
    if (scenario.stage === 500) check('final Continue reaches victory', advanced.status === 'victory');
    else check('Continue reaches the next normal level', advanced.sector === scenario.stage+1 && advanced.encounter === 'normal');
    if (scenario.stage !== 500) check('Continue leaves saved reward balances unchanged', ['balance', 'totalShardsEarned', 'totalShardsSpent', 'creditedShards'].every(key => h.profile()[key] === persisted[key]));
    check('no unexpected API failures', requests.every(r => r.status < 400 || r.error === 'isolated_save_failure' || scenario.staleSession && r.status===403));
    result.cases.push({ ...scenario, before: { score: before.score, shards: before.shards, hearts: before.hearts }, requests });
    await page.waitForLoadState('networkidle');await context.close();
  }
  check('no JavaScript page errors', result.errors.length === 0); result.complete = true;
} catch (error) { result.failure = { message: error.message, stack: error.stack }; throw error; }
finally { writeFileSync(resolve(output, process.env.BASELINE==='1'?'published-control.json':'native.json'), JSON.stringify(result, null, 2) + '\n'); await browser?.close(); await server?.close(); console.log(JSON.stringify({ complete: result.complete, checks: result.checks.length, failure: result.failure?.message })); }
