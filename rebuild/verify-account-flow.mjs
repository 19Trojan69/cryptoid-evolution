// Local fault controls for the released auth/account path. Native Linux browsers
// and synthetic SDK/API responses only; no Pi identity, wallet or live backend.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve, relative, extname, basename } from 'node:path';

const directory = new URL('.', import.meta.url).pathname, root = resolve(directory, '..');
const frontend = resolve(root, 'frontend'), artifacts = resolve(root, 'verification/rebuild');
const require = createRequire(resolve(frontend, 'package.json'));
const engine = process.env.CRYPTOID_TEST_ENGINE || 'chromium', tag = process.env.CRYPTOID_NATIVE_OUTPUT_TAG;
assert.ok(['chromium', 'webkit'].includes(engine)); assert.match(tag || '', /^[a-z0-9-]{1,40}$/);
mkdirSync(artifacts, { recursive: true });
const stem = resolve(artifacts, `account-flow-${engine}-${tag}`), output = stem + '.json';
closeSync(openSync(output, 'wx'));
const manifest = JSON.parse(readFileSync(resolve(directory, 'fixture/accountSourceManifest.json'), 'utf8'));
const expected = new Map(manifest.files.map(file => [file.path, file.sha])), sources = new Map();
const gitSha = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
function original(path) {
  const name = relative(root, path), wanted = expected.get(name);
  assert.ok(wanted, 'Unpinned runtime source: ' + name);
  for (const candidate of [path, resolve(root, 'verification/released-app-source', name)]) {
    if (!existsSync(candidate)) continue;
    const bytes = readFileSync(candidate);
    if (gitSha(bytes) !== wanted) continue;
    sources.set(name, { path: name, gitBlob: wanted, sha256: createHash('sha256').update(bytes).digest('hex') });
    return bytes.toString('utf8');
  }
  throw new Error('Released source bytes unavailable: ' + name);
}
const result = { engine, tag, sourceCommit: manifest.sourceCommit, originalRuntimeSources: [],
  scriptSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
  localOnly: true, syntheticSdkAndApi: true, realAuthentication: false, realPlayerDataChanged: false,
  originalSimulationClock: true, readOnlyStateObserver: true, historicalWhiteScreenFixed: false,
  physicalDeviceAcceptance: false, nativeMemoryAcceptance: false, forcedGC: false,
  checks: [], api: [], pageErrors: [], consoleErrors: [], failedRequests: [], missing: [], crashes: [], navigations: [], documentRequests: [], complete: false };
let server, browser, activeCase;
const allCases = [
  { name: 'phone-pi-signin-expired-save', mode: 'pi-valid', width: 393, height: 744, dpr: 3, live: true },
  { name: 'tablet-restored-owner-expired-save', mode: 'owner-valid', width: 820, height: 1180, dpr: 2, live: true },
  { name: 'tablet-restored-account-expired-save', mode: 'account-valid', width: 820, height: 1180, dpr: 2, live: true },
  { name: 'phone-pi-signin-rejected', mode: 'pi-reject', width: 393, height: 744, dpr: 3,
    expected: 'Could not sign in with Pi. Please retry.' },
  { name: 'tablet-session-unavailable', mode: 'restore-503', width: 820, height: 1180, dpr: 2,
    expected: 'Could not verify the Pi session. Please retry.' },
  { name: 'phone-no-session', mode: 'guest', width: 393, height: 744, dpr: 3, guest: true },
];
const selected = process.env.CRYPTOID_ACCOUNT_CASES?.split(',');
if (selected) assert.ok(selected.length && selected.every(name => allCases.some(control => control.name === name)), 'Unknown account control');
const cases = selected ? allCases.filter(control => selected.includes(control.name)) : allCases;
result.selectedCases = cases.map(control => control.name);
try {
  const { build, stop } = require('esbuild');
  const gamePath = resolve(frontend, 'src/pages/GamePage.tsx'), game = original(gamePath);
  const sentinel = '  const levelLabel ='; assert.equal(game.split(sentinel).length, 2);
  const observer = `
  useEffect(() => {
    const mount = ((window as any).__accountFlowMounts || 0) + 1;
    (window as any).__accountFlowMounts = mount;
    const read = () => ({mount, timeOrigin:performance.timeOrigin, route:location.pathname,
      elapsed:elapsedRef.current, status:stateRef.current.status, sector:stateRef.current.sector,
      hasRun:scoreRunRef.current !== null, admin:adminRunRef.current});
    (window as any).__accountFlowRead = read;
    return () => { if ((window as any).__accountFlowRead === read) delete (window as any).__accountFlowRead; };
  }, []);
`;
  const css = [...original(resolve(frontend, 'src/main.tsx')).matchAll(/import ['"](.+\.css)['"]/g)]
    .map(match => `import ${JSON.stringify(resolve(frontend, 'src', match[1]))};`).join('\n');
  const entry = `import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import {createBrowserRouter,RouterProvider} from 'react-router-dom';
import Game from ${JSON.stringify(gamePath)};
import {primeGameAudio} from ${JSON.stringify(resolve(frontend, 'src/pages/gameAudio.ts'))};
import {primeGameMusic} from ${JSON.stringify(resolve(frontend, 'src/pages/musicPlayback.ts'))};
import {startCssFramePacing} from ${JSON.stringify(resolve(frontend, 'src/lib/cssFramePacing.ts'))};
${css}
startCssFramePacing(document.body);
const router=createBrowserRouter([{path:'/game',element:<Game/>},{path:'*',element:<p data-local-home>Local return route</p>}]);
function Entry(){const [started,setStarted]=useState(false);return started?<RouterProvider router={router}/>:<button id="start" onClick={()=>{primeGameAudio();primeGameMusic(50);setStarted(true);}}>Start local account control</button>;}
createRoot(document.getElementById('root')).render(<React.StrictMode><Entry/></React.StrictMode>);`;
  const built = await build({ stdin: { contents: entry, resolveDir: frontend, loader: 'tsx' }, absWorkingDir: frontend,
    outfile: 'account-local.js', bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic', logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}', __CRYPTOID_RELEASE__: '"local-account-control"',
      __CRYPTOID_BUILD__: JSON.stringify({ sourceCommit: manifest.sourceCommit, workingTreeDirty: true }) },
    plugins: [{ name: 'pinned-original-sources', setup(builder) {
      builder.onResolve({ filter: /\/paintedShip$/ }, args => ({ path: resolve(args.resolveDir, args.path + '.ts') }));
      builder.onResolve({ filter: /^\// }, args => args.kind === 'url-token' ? { path: args.path, external: true } : undefined);
      builder.onResolve({ filter: /^@mui\/styled-engine$/ }, () => ({ path: require.resolve('@mui/styled-engine-sc') }));
      builder.onLoad({ filter: /\/(frontend|backend)\/src\/.*\.(tsx?|css|mjs)$/ }, args => {
        const source = original(args.path), extension = extname(args.path).slice(1);
        return { contents: args.path === gamePath ? source.replace(sentinel, observer + sentinel) : source,
          loader: extension === 'mjs' ? 'js' : extension, resolveDir: resolve(args.path, '..') };
      });
    } }],
  });
  stop();
  result.originalRuntimeSources = [...sources.values()].sort((a, b) => a.path.localeCompare(b.path));
  const js = built.outputFiles.find(file => file.path.endsWith('.js')).contents;
  const compiledCss = built.outputFiles.find(file => file.path.endsWith('.css')).contents;
  const profile = { version: 1, balance: 0, fleet: { 'grey-scout': { grey: 1 } }, skin: 'grey-scout', color: 'grey',
    mission: null, highestSector: 1, totalDestroyed: 0, totalShardsEarned: 0, totalShardsSpent: 0,
    legacyImported: true, cardReveals: [], usedShipSkins: [], updatedAt: '2026-10-26T00:00:00.000Z' };
  const localUser = { uid: 'local-synthetic-pilot', username: 'LocalSyntheticPilot', roles: [] };
  server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://local').pathname; res.setHeader('Cache-Control', 'no-store');
      if (path.startsWith('/api/')) {
        for await (const chunk of req) { void chunk; }
        let status = 200, body;
        if (path === '/api/user/me') {
          status = activeCase.mode === 'guest' ? 401 : activeCase.mode === 'restore-503' ? 503 : 200;
          body = status === 200 ? { user: localUser, canAdmin: activeCase.mode === 'owner-valid', adminMode: false } : { error: 'local_synthetic_session_failure' };
        } else if (path === '/api/user/signin') body = { user: localUser, canAdmin: false, adminMode: false };
        else if (path === '/api/progress/me') body = { save: profile };
        else if (path === '/api/progress/card-reveals') body = { ok: true };
        else if (path === '/api/hangar/start') body = { weaponLevel: 1, unlockedWeaponLevels: [1], ownedShipUpgrades: [], powerUp: null,
          armorBonus: 0, scoreRunId: 'local-synthetic-run', startSector: 1, shipStage: 1, adminPreview: false, rulesVersion: 2, profile };
        else if (path === '/api/rewards/me') body = { progress: { bossWins: {}, completedChains: [], linkedBlocks: {}, bonusMedals: {}, perfectBonuses: 0, highestLevel: 1 } };
        else if (['/api/progress/checkpoint', '/api/rewards/event', '/api/leaderboard/checkpoint', '/api/leaderboard/score'].includes(path)) {
          status = 401; body = { error: 'local_synthetic_session_expired' };
        } else if (path === '/api/hangar/inventory') body = { weaponStock: {}, ownedShipUpgrades: [] };
        else if (path === '/api/hangar/catalog') body = { offers: [] };
        else { status = 404; body = { error: 'unhandled_local_fixture_endpoint' }; }
        result.api.push({ case: activeCase.name, path, method: req.method, status, authorizationPresent: Boolean(req.headers.authorization) });
        res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); return;
      }
      if (path === '/account.js' || path === '/account.css') {
        res.setHeader('Content-Type', path.endsWith('.js') ? 'application/javascript' : 'text/css'); res.end(path.endsWith('.js') ? js : compiledCss); return;
      }
      if (/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(path)) {
        res.setHeader('Content-Type', 'font/ttf'); res.end(readFileSync(resolve(root, 'verification/white-screen-fonts', basename(path)))); return;
      }
      if (/^\/(ships|planets|audio|effects|fonts)\//.test(path)) {
        const file = resolve(frontend, 'public', '.' + path);
        if (!file.startsWith(resolve(frontend, 'public') + '/') || !existsSync(file)) {
          result.missing.push({ case: activeCase.name, path }); res.writeHead(404); res.end(); return;
        }
        res.setHeader('Content-Type', ({ '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg' })[extname(file)] || 'application/octet-stream');
        res.end(readFileSync(file)); return;
      }
      if (path === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      if (path !== '/game') { res.writeHead(404); res.end(); return; }
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/account.css"></head><body><div id="root"></div><script>window.__ENV={appNetwork:"testnet",backendURL:"/api"};</script><script src="/account.js"></script></body></html>');
    } catch (error) { result.serverError = String(error); res.writeHead(500); res.end(); }
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const playwright = engine === 'webkit' ? require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright')
    : require(resolve(root, 'verification/browser-tools/node_modules/playwright'));
  const cache = process.env.CRYPTOID_BROWSER_CACHE || resolve(root, 'verification/native-browsers');
  const options = { headless: true, timeout: 20000 };
  if (engine === 'chromium') options.executablePath = resolve(cache, 'chromium_headless_shell-1194/chrome-linux/headless_shell');
  else {
    const base = resolve(cache, 'webkit-2336/minibrowser-wpe'), libs = resolve(root, 'verification/webkit-libs/usr/lib/x86_64-linux-gnu');
    options.executablePath = base + '/bin/MiniBrowser';
    options.env = { ...process.env, WEBKIT_EXEC_PATH: base + '/bin', WEBKIT_INJECTED_BUNDLE_PATH: base + '/lib', WEBKIT_INSPECTOR_RESOURCES_PATH: base + '/share',
      LD_LIBRARY_PATH: `${base}/lib:${base}/sys/lib:${libs}`, GST_PLUGIN_SYSTEM_PATH_1_0: libs + '/gstreamer-1.0',
      GST_PLUGIN_SCANNER: libs + '/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner', GST_REGISTRY_1_0: resolve(root, 'verification/webkit-native-audio-registry.bin') };
  }
  browser = await playwright[engine].launch(options); result.version = browser.version();
  for (const control of cases) {
    activeCase = control;
    const context = await browser.newContext({ viewport: { width: control.width, height: control.height }, deviceScaleFactor: control.dpr,
      locale: 'en-US', ...(control.mode.startsWith('pi-') ? { userAgent: 'Mozilla/5.0 PiBrowser Android LocalDiagnostic' } : {}) });
    const record = { ...control, complete: false }; result.checks.push(record);
    try {
      await context.addInitScript(({ mode }) => {
        localStorage.setItem('cryptoid_language', 'en');
        if (mode === 'owner-valid' || mode === 'account-valid' || mode === 'restore-503') { localStorage.setItem('cryptoid_pi_session', '1'); sessionStorage.setItem('cryptoid_pi_access_token', 'local-synthetic-token'); }
        window.__accountSdkCalls = 0;
        window.Pi = { getPiHostAppInfo: async () => ({ hostApp: 'web' }), authenticate: async () => {
          window.__accountSdkCalls++;
          if (mode === 'pi-reject') throw new Error('Local synthetic SDK rejection');
          return { accessToken: 'local-synthetic-token', user: { uid: 'local-synthetic-pilot', username: 'LocalSyntheticPilot' } };
        } };
      }, { mode: control.mode });
      await context.route('**/*', route => {
        const url = route.request().url();
        if (url.startsWith('https://fonts.googleapis.com/')) return route.fulfill({ contentType: 'text/css', body: readFileSync(resolve(root, 'verification/white-screen-fonts/fonts.css'), 'utf8').replaceAll('/font-mirror/', origin + '/font-mirror/') });
        if (url.startsWith(origin + '/') || /^(blob|data):/.test(url)) return route.continue();
        result.failedRequests.push({ case: control.name, kind: 'blocked-external', url: new URL(url).origin }); return route.abort();
      });
      const page = await context.newPage(); page.setDefaultTimeout(20000);
      page.on('pageerror', error => result.pageErrors.push({ case: control.name, message: String(error).slice(0, 300) }));
      page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push({ case: control.name, message: message.text().slice(0, 240) }); });
      page.on('crash', () => result.crashes.push(control.name));
      page.on('requestfailed', request => result.failedRequests.push({ case: control.name, path: new URL(request.url()).pathname, error: request.failure()?.errorText }));
      page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) result.documentRequests.push({ case: control.name, path: new URL(request.url()).pathname }); });
      page.on('framenavigated', frame => { if (frame === page.mainFrame()) result.navigations.push({ case: control.name, path: new URL(frame.url()).pathname }); });
      await page.goto(origin + '/game', { waitUntil: 'load' }); const started = await page.evaluate(() => performance.timeOrigin);
      await page.locator('#start').click();
      if (control.live) {
        await page.waitForFunction(() => window.__accountFlowRead?.().status === 'playing' && window.__accountFlowRead?.().hasRun);
        record.initial = await page.evaluate(() => window.__accountFlowRead());
        await page.waitForResponse(response => response.url().endsWith('/api/progress/checkpoint') && response.status() === 401, { timeout: 22000 });
        const atFailure = await page.evaluate(() => window.__accountFlowRead());
        await page.waitForFunction(previous => window.__accountFlowRead?.().elapsed > previous + 500, atFailure.elapsed);
        record.afterFailure = await page.evaluate(() => window.__accountFlowRead());
        assert.equal(record.afterFailure.mount, record.initial.mount, 'Account failure remounted the game');
        assert.equal(record.afterFailure.timeOrigin, started); assert.equal(record.afterFailure.route, '/game');
        assert.equal(record.afterFailure.hasRun, true); assert.equal(record.afterFailure.status, 'playing');
        record.unconfirmedQueueRetained = await page.evaluate(() => {
          const key = Object.keys(localStorage).find(key => key.startsWith('cryptoid_save_outbox_v1_'));
          return Boolean(key && JSON.parse(localStorage.getItem(key)).some(entry => entry.path === '/progress/checkpoint'));
        });
        assert.equal(record.unconfirmedQueueRetained, true);
        await page.locator('.pause-control').click();
        await page.getByText('Save not confirmed. Pending data will be retried.', { exact: true }).waitFor({ state: 'visible' });
        record.afterExplicitPause = await page.evaluate(() => window.__accountFlowRead());
        assert.equal(record.afterExplicitPause.mount, record.initial.mount);
        assert.equal(record.afterExplicitPause.status, 'paused');
      } else if (control.guest) {
        await page.waitForFunction(() => window.__accountFlowRead?.().status === 'playing' && window.__accountFlowRead?.().elapsed > 5000);
        record.guestState = await page.evaluate(() => window.__accountFlowRead());
        assert.equal(record.guestState.hasRun, false);
        assert.equal(record.guestState.mount, 1);
        assert.equal(result.api.filter(row => row.case === control.name).length, 0, 'Guest baseline unexpectedly uses account API');
      } else {
        await page.getByText(control.expected, { exact: true }).waitFor({ state: 'visible' });
        assert.equal(await page.locator('.game-shell').count(), control.gameMounted ? 1 : 0);
      }
      record.surface = await page.evaluate(() => ({ timeOrigin: performance.timeOrigin, route: location.pathname, sdkCalls: window.__accountSdkCalls,
        gameMounts: window.__accountFlowMounts || 0, bodyTextLength: document.body.innerText.length,
        modal: [...document.querySelectorAll('.game-modal')].map(node => { const box = node.getBoundingClientRect(); return { width: box.width, height: box.height, display: getComputedStyle(node).display }; }) }));
      assert.equal(record.surface.timeOrigin, started); assert.equal(record.surface.route, '/game');
      assert.ok(record.surface.bodyTextLength > 10);
      assert.equal(record.surface.sdkCalls, control.mode.startsWith('pi-') ? 1 : 0);
      const screenshot = `${stem}-${control.name}.png`;
      await page.screenshot({ path: screenshot }); record.screenshot = basename(screenshot);
      assert.equal(result.documentRequests.filter(row => row.case === control.name).length, 1, 'Unexpected document request');
      assert.ok(result.navigations.filter(row => row.case === control.name).every(row => row.path === '/game'), 'Unexpected Home route');
      record.complete = true; console.log(JSON.stringify({ engine, case: control.name, complete: true, sdkCalls: record.surface.sdkCalls }));
    } catch (error) {
      record.failure = String(error);
      const page = context.pages()[0];
      if (page && !page.isClosed()) {
        try { record.failedState = await page.evaluate(() => ({ route: location.pathname, timeOrigin: performance.timeOrigin, game: window.__accountFlowRead?.(), diagnostics: JSON.parse(localStorage.getItem('cryptoid_game_diagnostics_v1') || '[]').map(row => ({reason: row.reason, errorName: row.errorName, sector: row.sector, phase: row.phase, status: row.status, frameMs: row.frameMs})), text: document.body.innerText.slice(0, 1200) })); } catch {}
        try { await page.screenshot({ path: `${stem}-${control.name}-failed.png` }); } catch {}
      }
      console.log(JSON.stringify({engine, case: control.name, complete: false, failure: String(error)}));
    } finally { await context.close(); }
  }
  assert.ok(result.checks.every(row => row.complete), 'One or more native account controls failed; preserve failedState');
  assert.deepEqual(result.pageErrors, []); assert.deepEqual(result.crashes, []); assert.deepEqual(result.missing, []);
  assert.ok(!result.api.some(row => row.status === 404));
  result.complete = true;
} catch (error) { result.failure = String(error?.stack || error); process.exitCode = 1; }
finally {
  result.originalRuntimeSources = [...sources.values()].sort((a, b) => a.path.localeCompare(b.path));
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ engine, complete: result.complete, checks: result.checks.map(row => ({ name: row.name, complete: row.complete })), failure: result.failure || null, output }));
  await browser?.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
