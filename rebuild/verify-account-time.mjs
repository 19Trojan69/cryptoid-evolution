// Continuous real-time account/graphics/audio control of released source.
// Local SDK/API responses and automated legal input only; no live player data.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, openSync, closeSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { armNativeProfile } from './fixture/nativeProfile.mjs';
import { resolve, relative, extname, basename } from 'node:path';

const directory = new URL('.', import.meta.url).pathname, root = resolve(directory, '..');
const frontend = resolve(root, 'frontend'), artifacts = resolve(root, 'verification/rebuild');
const require = createRequire(resolve(frontend, 'package.json'));
const engine = process.env.CRYPTOID_TEST_ENGINE || 'webkit', tag = process.env.CRYPTOID_NATIVE_OUTPUT_TAG;
const seconds = Number(process.env.CRYPTOID_ACCOUNT_TIME_SECONDS || 780);
const accountMode = process.env.CRYPTOID_ACCOUNT_TIME_MODE || 'owner';
const scenario = process.env.CRYPTOID_ACCOUNT_TIME_SCENARIO || 'boss-time';
assert.ok(['boss-time','transition'].includes(scenario));
const startSector = scenario === 'transition' ? 53 : 40;
const apiLatencyMs=Number(process.env.CRYPTOID_ACCOUNT_LATENCY_MS||1500);
assert.ok(Number.isSafeInteger(apiLatencyMs)&&apiLatencyMs>=0&&apiLatencyMs<=5000);
assert.ok(Number.isSafeInteger(seconds) && seconds >= 1 && seconds <= 1200);
assert.ok(['owner','account'].includes(accountMode));
assert.ok(['chromium', 'webkit'].includes(engine)); assert.match(tag || '', /^[a-z0-9-]{1,40}$/);
mkdirSync(artifacts, { recursive: true });
const stem = resolve(artifacts, `account-time-${engine}-${accountMode}-${scenario}-${seconds}-${tag}`), output = stem + '.json';
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
const cases = [{ name: `phone-${accountMode}-${scenario}-timed`, mode: accountMode === 'owner' ? 'owner-valid' : 'account-valid',
  width: 430, height: 825, dpr: 3, live: true }];
result.selectedCases = cases.map(control => control.name); result.seconds = seconds; result.accountMode = accountMode; result.apiLatencyMs=apiLatencyMs;
result.elapsedIntervalComplete = false; result.scenario = scenario; result.targetedTransitionComplete = false;result.syntheticLegalLoadout={initialHearts:6,armorBonus:3,paidWeaponLevel:scenario==='transition'?3:1,paidWeaponMs:scenario==='transition'?60000:0}; result.nativeSamples = []; result.forcedGC = false;
const procRows = () => readdirSync('/proc').filter(id => /^\d+$/.test(id)).flatMap(id => {
  try { const status = readFileSync(`/proc/${id}/status`, 'utf8'); return [{ pid: Number(id),
    parent: Number(status.match(/^PPid:\s+(\d+)/m)[1]), role: status.match(/^Name:\s+(.+)/m)[1] }]; } catch { return []; }
});
const hostPid = Number(readFileSync('/proc/self/status','utf8').match(/^Pid:\s+(\d+)/m)[1]);
const excluded = new Set();
function memory() {
  const rows = procRows(), parents = new Map(rows.map(row => [row.pid,row.parent]));
  const roots = new Set(rows.filter(row => row.parent === hostPid && !excluded.has(row.pid)).map(row => row.pid));
  const processes = []; let unavailable = 0;
  for (const row of rows) {
    let ancestor = row.pid, owned = false;
    for (let depth=0; depth<20 && ancestor; depth++,ancestor=parents.get(ancestor)) if(roots.has(ancestor)){owned=true;break;}
    if(!owned)continue;
    try {
      const maps=readFileSync(`/proc/${row.pid}/smaps_rollup`,'utf8');
      const value=key=>Number(maps.match(new RegExp(`^${key}:\\s+(\\d+)`,'m'))?.[1]||0)/1024;
      processes.push({role:row.role,pssMiB:value('Pss'),anonymousMiB:value('Pss_Anon'),fileMiB:value('Pss_File')});
    } catch { unavailable++; }
  }
  assert.ok(processes.length && unavailable === 0, 'Native process reads incomplete');
  return {pssMiB:processes.reduce((sum,row)=>sum+row.pssMiB,0),unavailable,processes};
}
const save=()=>writeFileSync(output,JSON.stringify(result,null,2)+'\n');
let nativeProfile;
try {
  const { build, stop } = require('esbuild');
  const gamePath = resolve(frontend, 'src/pages/GamePage.tsx'), game = original(gamePath);
  const sentinel = '  const levelLabel ='; assert.equal(game.split(sentinel).length, 2);
  const observer = `
  useEffect(() => {
    const mount = ((window as any).__accountFlowMounts || 0) + 1;
    (window as any).__accountFlowMounts = mount;
    const read = () => {
      const s=stateRef.current,b=s.boss,f=fieldSizeRef.current;
      return {mount,timeOrigin:performance.timeOrigin,route:location.pathname,elapsed:elapsedRef.current,
        status:s.status,phase:s.phase,encounter:s.encounter,sector:s.sector,
        hasRun:scoreRunRef.current!==null,admin:adminRunRef.current,hearts:s.hearts,weaponLevel:s.weaponLevel,weaponSource:s.weaponSource,paidWeaponMs:s.paidWeaponMs,
        width:f.width,height:f.height,player:{x:s.player.x*f.width,y:s.player.y*f.height},
        boss:b?{id:b.config.id,elapsed:b.elapsed,health:b.health,turrets:b.turrets.map((g,index)=>({health:g.health,...gunPosition(b,bossWeapons[b.config.id-1][index])}))}:null,
        enemies:s.asteroids.map(({x,y,radius})=>({x,y,radius})),
        enemyShots:s.enemyShots.map(({x,y,vx,vy,radius})=>({x,y,vx,vy,radius})),
        playerShots:s.shots.length,effects:s.effects.length,dom:document.getElementsByTagName('*').length,
        resources:ownerResourceContext()};
    };
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
import {observeSessionDiagnostics} from ${JSON.stringify(resolve(frontend,'src/lib/sessionDiagnosticEvents.ts'))};
const signals=[];window.__accountTimeSignals=signals;
observeSessionDiagnostics((kind,details)=>{
  if(kind!=='boundary'||!['hull-plan-start','hull-plan-settled','hull-plan-progress','transition-before','transition-reset-done','first-spawn-created'].includes(details.operation))return;
  const data={};for(const key of ['operation','sector','phase','encounter','status','requested','prepared','success','step','imageJob','sprite','hullStage','paintIndex'])if(details[key]!==undefined)data[key]=details[key];
  signals.push({clockMs:performance.now(),data});if(signals.length>1024)signals.shift();
});
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
  const checkpoint = {damageCount:0,comboTotal:0,score:0,shards:0,destroyed:0,hearts:6,weaponSource:scenario==='transition'?'paid':'standard',paidWeaponLevel:scenario==='transition'?3:1,paidWeaponMs:scenario==='transition'?60000:0,pickupWeaponLevel:1,pickupWeaponMs:0,weaponTimers:[0,0,0,scenario==='transition'?60000:0,0,0],shieldCharges:0,shieldMs:0,purchasedShieldMs:0,shieldActive:true,overdriveMs:0,overdriveTotalMs:20000,rapidFireMs:0,rapidFireTotalMs:20000,empMs:0};
  const profile = { version: 1, balance: 0, fleet: { 'grey-scout': { grey: 1 } }, skin: 'grey-scout', color: 'grey',
    mission: {sector:startSector,phase:scenario==='transition'?'normal':'boss',snapshot:checkpoint,savedAt:'2026-10-26T00:00:00.000Z'}, highestSector: startSector, totalDestroyed: 0, totalShardsEarned: 0, totalShardsSpent: 0,
    legacyImported: true, cardReveals: [], usedShipSkins: [], updatedAt: '2026-10-26T00:00:00.000Z' };
  const localUser = { uid: 'local-synthetic-pilot', username: 'LocalSyntheticPilot', roles: [] };
  server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://local').pathname; res.setHeader('Cache-Control', 'no-store');
      if (path.startsWith('/api/')) {
        for await (const chunk of req) { void chunk; }
        if(['/api/progress/checkpoint','/api/rewards/event','/api/leaderboard/checkpoint','/api/leaderboard/score'].includes(path)&&apiLatencyMs)await new Promise(resolve=>setTimeout(resolve,apiLatencyMs));
        let status = 200, body;
        if (path === '/api/user/me') {
          status = activeCase.mode === 'guest' ? 401 : activeCase.mode === 'restore-503' ? 503 : 200;
          body = status === 200 ? { user: localUser, canAdmin: activeCase.mode === 'owner-valid', adminMode: false } : { error: 'local_synthetic_session_failure' };
        } else if (path === '/api/user/signin') body = { user: localUser, canAdmin: false, adminMode: false };
        else if (path === '/api/progress/me') body = { save: profile };
        else if (path === '/api/progress/card-reveals') body = { ok: true };
        else if (path === '/api/hangar/start') body = { weaponLevel: scenario==='transition'?3:1, unlockedWeaponLevels: [1,2,3], ownedShipUpgrades: [], powerUp: null,
          armorBonus: 3, scoreRunId: 'local-synthetic-run', startSector, startPhase:scenario==='transition'?'normal':'boss', checkpoint, shipStage: 1, adminPreview: false, rulesVersion: 2, profile };
        else if (path === '/api/rewards/me') body = { progress: { bossWins: {}, completedChains: [], linkedBlocks: {}, bonusMedals: {}, perfectBonuses: 0, highestLevel: 1 } };
        else if (['/api/progress/checkpoint', '/api/rewards/event', '/api/leaderboard/checkpoint', '/api/leaderboard/score'].includes(path)) {
          body = { ok: true }; // Regular success; only synthetic server persistence is replaced.
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
  nativeProfile = engine === 'webkit' ? armNativeProfile(require) : null;
  const playwright = engine === 'webkit' ? require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright')
    : require(resolve(root, 'verification/browser-tools/node_modules/playwright'));
  const cache = process.env.CRYPTOID_BROWSER_CACHE || resolve(root, 'verification/native-browsers');
  const options = { headless: true, timeout: 20000 };
  if (engine === 'chromium') { options.chromiumSandbox = true; options.executablePath = resolve(cache, 'chromium_headless_shell-1194/chrome-linux/headless_shell'); }
  else {
    const base = resolve(cache, 'webkit-2336/minibrowser-wpe'), libs = resolve(root, 'verification/webkit-libs/usr/lib/x86_64-linux-gnu');
    options.executablePath = base + '/bin/MiniBrowser';
    options.env = { ...process.env, WEBKIT_EXEC_PATH: base + '/bin', WEBKIT_INJECTED_BUNDLE_PATH: base + '/lib', WEBKIT_INSPECTOR_RESOURCES_PATH: base + '/share',
      LD_LIBRARY_PATH: `${base}/lib:${base}/sys/lib:${libs}`, GST_PLUGIN_SYSTEM_PATH_1_0: libs + '/gstreamer-1.0',
      GST_PLUGIN_SCANNER: libs + '/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner', GST_REGISTRY_1_0: resolve(root, 'verification/webkit-native-audio-registry.bin') };
  }
  for(const row of procRows())if(row.parent===hostPid)excluded.add(row.pid);
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
      await page.getByRole('button',{name:'Resume',exact:true}).click();
      if (control.live) {
        await page.waitForFunction(() => window.__accountFlowRead?.().status === 'playing' && window.__accountFlowRead?.().hasRun);
        record.initial = await page.evaluate(() => window.__accountFlowRead());
        assert.equal(record.initial.sector,startSector);assert.equal(record.initial.admin,false);
        if(scenario==='transition')assert.equal(record.initial.weaponLevel,3,'Valid saved L3 timer required');
        const began=performance.now(); let logged=-10000, held=false;
        while(performance.now()-began < seconds*1000){
          const state=await page.evaluate(()=>window.__accountFlowRead?.());
          const realMs=performance.now()-began;
          if(!state){record.ended='game-owner-lost';break;}
          if(state.timeOrigin!==started||state.mount!==record.initial.mount||state.route!=='/game'){
            record.ended='document-or-game-owner-replaced';break;
          }
          if(realMs-logged>=2000){
            const native=memory();result.nativeSamples.push({realMs,state,memory:native,inspector:nativeProfile?.snapshot()??null});
            console.log(JSON.stringify({realSeconds:Math.round(realMs/1000),status:state.status,hearts:state.hearts,
              sector:state.sector,liveTurrets:state.boss?.turrets.filter(g=>g.health>0).length,pssMiB:native.pssMiB,dom:state.dom}));
            save();logged=realMs;
            if(native.pssMiB>1800){record.ended='native-memory-stop';break;}
          }
          if(state.status!=='playing'){record.ended=state.status;break;}
          if(scenario==='transition'&&state.sector===54&&state.enemies.length>0&&await page.evaluate(()=>window.__accountTimeSignals.some(row=>row.data.operation==='hull-plan-settled'&&row.data.sector===54&&row.data.prepared===12&&row.data.requested===12))){record.ended='targeted-transition-complete';result.targetedTransitionComplete=true;break;}
          if(scenario==='boss-time'&&(!state.boss||!['boss-intro','boss-fight'].includes(state.encounter))){record.ended='controlled-encounter-ended';break;}
          const target=state.boss?(state.boss.turrets.find(g=>g.health<=0)||state.boss.turrets[0]):state.enemies.filter(e=>e.y>100&&e.y<state.height*.65).sort((a,b)=>b.y-a.y)[0];
          const y=state.height*.78,desired=target?.x??state.width*.5;
          const candidates=[desired,...[.1,.2,.3,.4,.5,.6,.7,.8,.9].map(x=>x*state.width)];
          const score=x=>{
            let danger=1000;
            for(const shot of state.enemyShots){
              const t=(y-shot.y)/shot.vy;if(t< -100||t>1600)continue;
              danger=Math.min(danger,Math.abs(x-(shot.x+shot.vx*Math.max(0,t)))-shot.radius-42);
            }
            for(const enemy of state.enemies)if(Math.abs(enemy.y-y)<150)danger=Math.min(danger,Math.abs(x-enemy.x)-enemy.radius-50);
            return Math.min(50,danger)*10-Math.abs(x-desired)*.4;
          };
          const x=candidates.reduce((best,x)=>score(x)>score(best)?x:best,candidates[0]);
          const box=await page.locator('.game-field').boundingBox();
          if(box){await page.mouse.up();await page.mouse.move(box.x+x,box.y+y);await page.mouse.down();held=true;(record.operatorTargets??=[]).push({realMs,x,y});if(record.operatorTargets.length>32)record.operatorTargets.shift();}
          await page.waitForTimeout(120);
        }
        record.ended ||= 'observation-window-complete';
        await page.mouse.up();record.after=await page.evaluate(()=>window.__accountFlowRead?.());
        record.realMs=performance.now()-began;record.beforeCloseMemory=memory();
        result.elapsedIntervalComplete=record.ended==='observation-window-complete'&&record.realMs>=seconds*1000;
        if(record.after?.status==='playing')await page.locator('.pause-control').click();
        record.afterExplicitPause=await page.evaluate(()=>window.__accountFlowRead?.());
        record.apiCounts=Object.fromEntries([...new Set(result.api.map(row=>row.path))].map(path=>[path,result.api.filter(row=>row.path===path).length]));
        record.sameRun=record.after?.mount===record.initial.mount&&record.after?.timeOrigin===started&&record.after?.hasRun===true;
        assert.equal(record.after?.mount,record.initial.mount);assert.equal(record.after?.timeOrigin,started);
        if(!['destroying','game-over'].includes(record.ended))assert.equal(record.sameRun,true);
        record.signals=await page.evaluate(()=>window.__accountTimeSignals);
        if(result.targetedTransitionComplete){
          record.targetHullPlans=record.signals.filter(row=>row.data.operation==='hull-plan-settled'&&row.data.sector===54);
          assert.ok(record.targetHullPlans.some(row=>row.data.prepared===row.data.requested&&row.data.prepared===12),'All twelve target hull preparations must settle');
        }
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
      record.complete = scenario==='transition'?result.targetedTransitionComplete:result.elapsedIntervalComplete; save(); console.log(JSON.stringify({ engine, case: control.name, complete: record.complete, sdkCalls: record.surface.sdkCalls }));
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
  assert.equal(scenario==='transition'?result.targetedTransitionComplete:result.elapsedIntervalComplete,true,'Stopped before the requested control completed; not a pass');
  result.complete = true;
} catch (error) { result.failure = String(error?.stack || error); process.exitCode = 1; }
finally {
  result.originalRuntimeSources = [...sources.values()].sort((a, b) => a.path.localeCompare(b.path));
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ engine, complete: result.complete, checks: result.checks.map(row => ({ name: row.name, complete: row.complete })), failure: result.failure || null, output }));
  await browser?.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
