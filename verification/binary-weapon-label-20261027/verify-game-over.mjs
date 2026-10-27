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
const base = '09a6a4047236c7c8cc5ef430386fd0c6825ebb41', control = process.argv.includes('--control');
const output = root + '/verification/binary-weapon-label-20261027/results/game-over'; mkdirSync(output, { recursive: true });
const result = { baseline: base, control, localOnly: true, realGamePageAndApiHandlers: true, syntheticSdkAndFatalShot: true,
  controlledClock: true, nativeAnimationHeldThenResumedForBoundary: true, physicalDevice: false, temperatureMeasured: false, checks: [], errors: [], complete: false };
const check = (name, value) => { assert.ok(value, name); result.checks.push(name); console.log(name); };
const hooks = `
  (window as any).__gameOverIdle = {
    inspect: () => ({status:stateRef.current.status,hearts:stateRef.current.hearts,shots:stateRef.current.shots.length,effects:stateRef.current.effects.map(e=>({id:e.id,kind:e.kind})),steps:(window as any).__gameOverSteps??0}),
    fatalShot: () => {const s=stateRef.current,{width,height}=fieldSizeRef.current;Object.assign(s,{hearts:1,invulnMs:0,shieldCharges:0,shieldMs:0,purchasedShieldMs:0,shieldActive:false,projectileGuard:0,empMs:0});impactCooldownRef.current=0;s.enemyShots=[{id:nextIdRef.current++,x:s.player.x*width,y:s.player.y*height,vx:0,vy:0,radius:5}];},
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
  const h = harness(); await h.call('progress', '/me', null, { method: 'GET' });
  Object.assign(h.profile(), { ...emptyPlayerSave(), version: 1, legacyImported: true, cardReveals: ['grey-scout-1'],
    mission: { sector: 1, phase: 'normal', rulesVersion: 2, snapshot: firstMissionSnapshot(3), savedAt: new Date().toISOString() } });
  const context = await browser.newContext({ viewport: { width: 393, height: 744 }, hasTouch: true, locale: 'de-AT', reducedMotion: 'no-preference' });
  await context.addInitScript(() => {
    window.Pi = { init() {}, getPiHostAppInfo: async () => ({ hostApp: 'web' }) };
    localStorage.setItem('cryptoid_pi_session', '1'); localStorage.setItem('cryptoid_home_music', 'off');
    localStorage.setItem('cryptoid_card_reveals_v1_testnet_pilot-a', JSON.stringify(['grey-scout-1']));
  });
  const requests = [];
  await context.route('**/*', async route => {
    const u = new URL(route.request().url());
    if (u.hostname === 'fonts.googleapis.com') return route.fulfill({ contentType: 'text/css', body: readFileSync(root + '/verification/white-screen-fonts/fonts.css', 'utf8').replaceAll('/font-mirror/', origin + '/font-mirror/') });
    if (u.origin !== origin) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    if (!u.pathname.startsWith('/api/')) return route.continue();
    const [group, ...parts] = u.pathname.slice(5).split('/'), endpoint = '/' + parts.join('/'), body = route.request().postDataJSON();
    let response;
    if (group === 'user') response = { code: 200, body: { user: { uid: 'pilot-a', username: 'Local verification' }, canAdmin: false, adminMode: false } };
    else if (group === 'usage') response = { code: 204 };
    else if (['progress', 'hangar', 'rewards', 'leaderboard'].includes(group)) response = await h.call(group, endpoint, body, { method: route.request().method() });
    else response = { code: 200, body: {} };
    if (group === 'hangar' && endpoint === '/start' && response.code === 200) { h.session.scoreRun.startedAt -= 3_600_000; h.profile().lastStart.runMeta.startedAt = h.session.scoreRun.startedAt; }
    requests.push({ path: u.pathname, status: response.code, error: response.body?.error });
    return route.fulfill({ status: response.code, contentType: 'application/json', body: response.code === 204 ? '' : JSON.stringify(response.body) });
  });
  const page = await context.newPage(); page.on('pageerror', e => result.errors.push(e.message));
  await page.clock.install(); await page.goto(origin + '/game');
  await page.getByRole('button', { name: 'Fortsetzen', exact: true }).click();
  await page.waitForFunction(() => window.__gameOverIdle?.inspect().status === 'playing');
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const until = async predicate => { for (let i = 0; i < 320; i++) { if (await page.evaluate(predicate)) return; await page.clock.runFor(50); await page.waitForTimeout(5); } throw Error('Controlled condition not reached'); };
  await until(() => window.__gameOverIdle.inspect().shots > 0);
  await page.evaluate(() => window.__gameOverIdle.fatalShot());
  await until(() => window.__gameOverIdle.inspect().status === 'destroying');
  check('normal damage creates the original player explosion', await page.evaluate(() => window.__gameOverIdle.inspect().hearts === 0 && window.__gameOverIdle.inspect().effects.some(e => e.kind === 'player-explosion')));
  await page.locator('.impact-effect.player-explosion').evaluate(node => {
    window.__heldGameOverAnimations = node.getAnimations({ subtree: true });
    for (const animation of window.__heldGameOverAnimations) { animation.pause(); animation.currentTime = 0; }
  });
  const destruction = await page.evaluate(() => window.__gameOverIdle.inspect()); await page.clock.runFor(1000);
  check('destruction reveal keeps its existing active callbacks and delay', await page.evaluate(() => window.__gameOverIdle.inspect().status === 'destroying' && window.__gameOverIdle.inspect().steps > 0) && await page.locator('.game-over-modal').count() === 0);
  await until(() => window.__gameOverIdle.inspect().status === 'game-over'); await page.locator('.game-over-modal').waitFor();
  const shown = await page.evaluate(() => window.__gameOverIdle.inspect());
  check('terminal state still retains the original effect record', shown.effects.some(e => e.kind === 'player-explosion'));
  const animation = () => page.evaluate(() => window.__heldGameOverAnimations.map(a => ({ time: Number(a.currentTime), name: a.animationName })));
  const beforeAnimations = await animation();
  await page.evaluate(() => { for (const animation of window.__heldGameOverAnimations) animation.play(); });
  await page.waitForTimeout(150); const afterAnimations = await animation();
  check('the final native explosion continues after Game Over appears', beforeAnimations.length > 0 && afterAnimations.some(a => beforeAnimations.some(b => a.name === b.name && a.time > b.time)));
  await page.waitForTimeout(2400);
  check('finite original explosion releases its visible DOM independently', await page.locator('.impact-effect.player-explosion').count() === 0);
  const settled = await page.evaluate(() => window.__gameOverIdle.inspect()); await page.clock.runFor(5000);
  const idle = await page.evaluate(() => window.__gameOverIdle.inspect());
  result.stepsWhileGameOver = idle.steps - settled.steps;
  check(control ? 'released control keeps running with a retained finished effect' : 'candidate sleeps after Game Over despite the retained finished effect', control ? result.stepsWhileGameOver > 200 : result.stepsWhileGameOver === 0);
  check('waiting cannot resume or mutate terminal score state', idle.status === 'game-over' && idle.hearts === 0 && JSON.stringify(idle.effects) === JSON.stringify(settled.effects));
  await page.waitForLoadState('networkidle'); await page.locator('.game-over-modal .button-primary').tap();
  await until(() => window.__gameOverIdle.inspect().status === 'playing');
  const restarted = await page.evaluate(() => window.__gameOverIdle.inspect()); await page.clock.runFor(200);
  check('explicit Play Again creates a healthy new game and immediately wakes its loop', restarted.hearts > 0 && restarted.effects.length === 0 && await page.evaluate(() => window.__gameOverIdle.inspect().steps) > restarted.steps);
  await until(() => window.__gameOverIdle.inspect().shots > 0); await page.evaluate(() => window.__gameOverIdle.fatalShot());
  await until(() => window.__gameOverIdle.inspect().status === 'game-over'); await page.locator('.game-over-modal').waitFor();
  await page.locator('.game-over-modal .button-secondary').tap(); await page.waitForURL(origin + '/'); await page.locator('.landing-shell').waitFor();
  const homeSteps = await page.evaluate(() => window.__gameOverSteps); await page.clock.runFor(1000);
  check('terminal Home exit works and unmount stops the game loop', await page.evaluate(() => window.__gameOverSteps) === homeSteps);
  check('no unexpected local API errors', requests.every(r => r.status < 400)); check('no JavaScript page errors', result.errors.length === 0);
  result.requests = requests; result.destruction = destruction; result.shown = shown; result.idle = idle; result.complete = true;
  await context.close();
} catch (error) { result.failure = { message: error.message, stack: error.stack }; throw error; }
finally {
  await browser?.close(); await server?.close();
  writeFileSync(output + (control ? '/released-control.json' : '/native.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ control, complete: result.complete, checks: result.checks.length, stepsWhileGameOver: result.stepsWhileGameOver, failure: result.failure?.message }));
}
