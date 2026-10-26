// Local acceptance: real GamePage/loop, real API handlers, isolated account data.
// Test-only hooks finish combat; native clocks are controlled. No live Pi or DB.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(new URL('../..', import.meta.url).pathname);
const require = createRequire(resolve(root, 'frontend/package.json'));
const { createServer } = require('vite');
const { webkit } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const backendRequire = createRequire(resolve(root, 'backend/src/handlers/progress.test.mjs'));
const source = readFileSync(resolve(root, 'backend/src/handlers/progress.test.mjs'), 'utf8');
const harness = new Function('require', source.slice(source.indexOf('const get ='), source.indexOf('const snapshot =')) + '\nreturn harness;')(backendRequire);
const { emptyPlayerSave, firstMissionSnapshot } = backendRequire('../../build/playerSave.js');
const output = resolve(root, 'verification/mobile-cockpit/results/completion-flow');
mkdirSync(output, { recursive: true });
const result = { localOnly: true, syntheticSdk: true, realApiHandlers: true, isolatedData: true,
  testOnlyCombatCompletion: true, controlledNativeClock: true, physicalDevice: false,
  historicalWhiteScreenFixed: false, checks: [], cases: [], errors: [], complete: false };
const check = (label, value) => { assert.ok(value, label); result.checks.push(label); };
const hooks = `
  (window as any).__levelFlow = {
    inspect: () => ({state:structuredClone(stateRef.current),summary:bossSummaryRef.current,prepared:bossSummaryPrepared,failed:bossSummaryFailed}),
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
      transform(code, id) { if (id.endsWith('/GamePage.tsx')) return code.replace('  const levelLabel =', hooks + '\n  const levelLabel ='); },
      transformIndexHtml(html) { return html.replace('$$APP_NETWORK$$', 'testnet').replace('$$BACKEND_URL$$', '/api'); },
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
  for (const scenario of [{ stage: 10, hits: 12 }, { stage: 10, hits: 0, legacy: true }, { stage: 500, hits: 12, failSave: true }]) {
    const h = harness(); await h.call('progress', '/me', null, { method: 'GET' });
    const card = `boss-${scenario.stage / 10}`, cards = ['grey-scout-1', card];
    Object.assign(h.profile(), { ...emptyPlayerSave(), version: 1, legacyImported: true, cardReveals: cards,
      mission: { sector: scenario.stage, phase: scenario.legacy ? 'bonus' : 'boss', rulesVersion: 2,
        snapshot: firstMissionSnapshot(1), savedAt: new Date().toISOString(),
        ...(scenario.legacy ? { bossIntermission: { stage: scenario.stage, createdAt: Date.now() } } : {}),
      } });
    h.docs[0].rewardEventKeys = { testnet: [] };
    for (let stage = 1; stage < scenario.stage; stage++) {
      if (stage % 10) h.docs[0].rewardEventKeys.testnet.push('block:' + stage);
      else h.docs[0].rewardEventKeys.testnet.push('boss:' + stage / 10, 'bonus:' + stage / 10);
      if (stage % 10 === 9) h.docs[0].rewardEventKeys.testnet.push('chain:' + Math.ceil(stage / 10));
    }
    if (scenario.legacy) h.docs[0].rewardEventKeys.testnet.push('boss:' + scenario.stage / 10);
    const context = await browser.newContext({ viewport: { width: 393, height: 744 }, locale: 'de-AT', hasTouch: true, reducedMotion: 'reduce' });
    await context.addInitScript(cards => {
      window.Pi = { init() {}, getPiHostAppInfo: async () => ({ hostApp: 'web' }) };
      localStorage.setItem('cryptoid_pi_session', '1'); localStorage.setItem('cryptoid_home_music', 'off');
      for (const network of ['testnet', 'mainnet']) localStorage.setItem(`cryptoid_card_reveals_v1_${network}_pilot-a`, JSON.stringify(cards));
    }, cards);
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
    const page = await context.newPage(); page.on('pageerror', error => result.errors.push(error.message));
    await page.clock.install();
    await page.goto(origin + '/game');
    await page.getByRole('button', { name: 'Fortsetzen', exact: true }).click();
    await page.waitForFunction(() => window.__levelFlow?.inspect().state.status === 'playing');
    if (scenario.legacy) {
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
    await page.evaluate(hits => window.__levelFlow.finishBonus(hits), scenario.hits);
    await page.clock.runFor(200);
    await page.locator('.level-completion').waitFor();
    const button = page.getByRole('button', { name: 'Spiel fortsetzen', exact: false });
    check(`stage ${scenario.stage}: summary appears after bonus and Continue is locked`, await button.isDisabled());
    if (scenario.failSave) {
      await page.clock.runFor(20_000);
      await page.getByRole('button', { name: 'Erneut speichern', exact: true }).waitFor();
      check('campaign save failure retains bonus checkpoint and blocks Continue', await button.isDisabled() && h.profile().mission?.phase === 'bonus');
      check('failed bonus remains in durable outbox', await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('cryptoid_save_outbox_v1_')).some(k => JSON.parse(localStorage.getItem(k) || '[]').some(e => e.path === '/rewards/event' && e.body.kind === 'bonus'))));
      offline = false; await page.getByRole('button', { name: 'Erneut speichern', exact: true }).click();
    }
    await page.waitForFunction(() => window.__levelFlow.inspect().prepared);
    await page.clock.runFor(9750); check(`stage ${scenario.stage}: ten prepared seconds required`, await button.isDisabled());
    await page.clock.runFor(500); check(`stage ${scenario.stage}: ready Continue`, await button.isEnabled());
    const before = await page.evaluate(() => window.__levelFlow.inspect().state);
    check(`stage ${scenario.stage}: only an earned heart is displayed`, await page.locator('.level-completion-heart').count() === (scenario.hits === 12 ? 1 : 0));
    if (scenario.stage === 500) check('final campaign checkpoint is null after acknowledged bonus', h.profile().mission === null);
    else check('next normal checkpoint includes exact score Shards and hearts', h.profile().mission.sector === 11 && ['score', 'shards', 'hearts'].every(key => h.profile().mission.snapshot[key] === before[key]));
    const persisted = structuredClone(h.profile()), events = requests.filter(r => r.kind).length;
    await page.screenshot({ path: resolve(output, `summary-${scenario.stage}-${scenario.legacy ? 'legacy' : 'new'}.png`) });
    await button.click(); await page.clock.runFor(100);
    const after = await page.evaluate(() => window.__levelFlow.inspect().state);
    check(`stage ${scenario.stage}: Continue grants nothing`, ['score', 'shards', 'hearts'].every(key => before[key] === after[key]) && events === requests.filter(r => r.kind).length);
    if (scenario.stage === 500) check('final Continue reaches victory', after.status === 'victory');
    else check('Continue reaches the next normal level', after.sector === 11 && after.encounter === 'normal');
    if (scenario.stage !== 500) check('Continue leaves saved reward balances unchanged', ['balance', 'totalShardsEarned', 'totalShardsSpent', 'creditedShards'].every(key => h.profile()[key] === persisted[key]));
    check('no unexpected API failures', requests.every(r => r.status < 400 || r.error === 'isolated_save_failure'));
    result.cases.push({ ...scenario, before: { score: before.score, shards: before.shards, hearts: before.hearts }, requests });
    await context.close();
  }
  check('no JavaScript page errors', result.errors.length === 0); result.complete = true;
} catch (error) { result.failure = { message: error.message, stack: error.stack }; throw error; }
finally { writeFileSync(resolve(output, 'result.json'), JSON.stringify(result, null, 2) + '\n'); await browser?.close(); await server?.close(); console.log(JSON.stringify({ complete: result.complete, checks: result.checks.length, failure: result.failure?.message })); }
