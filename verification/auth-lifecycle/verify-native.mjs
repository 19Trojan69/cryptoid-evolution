// Real React/useAuth and native WPE, with only isolated SDK/API fixtures.
// This verifies route retirement, not live Pi login or historical White Screens.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(new URL('../..', import.meta.url).pathname);
const require = createRequire(resolve(root, 'frontend/package.json'));
const { build } = require('esbuild');
const { webkit } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const hook = resolve(root, 'frontend/src/hooks/useAuth.ts');
const released = readFileSync(resolve(root, 'frontend/scripts/fixtures/useAuth-0ec94cf.ts.txt'), 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');
assert.equal(sha(released), 'e07c190f2bc21d2bfb5bcfb0e4338aeb5923fb9f9af24e27408151c77fffebf8');
const output = resolve(root, 'verification/auth-lifecycle/results'); mkdirSync(output, { recursive: true });
const result = { localOnly: true, realReact: true, realAuthHook: true, realAuthentication: false,
  syntheticSdkAndApi: true, physicalDevice: false, historicalWhiteScreenFixed: false,
  releasedSourceSha256: sha(released), candidateSourceSha256: sha(readFileSync(hook)), cases: [], errors: [], complete: false };
const entry = `
import React, {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {useAuth} from ${JSON.stringify(hook)};
import {axiosClient} from ${JSON.stringify(resolve(root, 'frontend/src/lib/axiosClient.ts'))};
window.__signinResponses=0;
axiosClient.interceptors.response.use(value=>{if(value.config.url==='/user/signin')window.__signinResponses++;return value;},error=>{if(error.config?.url==='/user/signin')window.__signinResponses++;throw error;});
function Login({leave}){
 const auth=useAuth();
 useEffect(()=>{window.__loginMounted=true;return()=>{window.__loginMounted=false;};},[]);
 return <section><h1>Isolated native authentication</h1><output id="auth-ready">{String(auth.authReady&&!auth.isLoading)}</output><output id="signed-in">{String(auth.isAuthenticated)}</output>
 <button onClick={()=>{window.__manualSettled=false;auth.signIn().finally(()=>{window.__manualSettled=true;});}}>Connect Pi</button><button onClick={leave}>Leave login</button></section>;
}
function Entry(){const [login,setLogin]=useState(true);return login?<Login leave={()=>setLogin(false)}/>:<h1>Current route</h1>;}
createRoot(document.getElementById('root')).render(<React.StrictMode><Entry/></React.StrictMode>);`;
const bundles = {};
for (const mode of ['released', 'candidate']) {
  const built = await build({ stdin: { contents: entry, resolveDir: resolve(root, 'frontend'), loader: 'tsx' },
    absWorkingDir: resolve(root, 'frontend'), outfile: 'auth-local.js', write: false, bundle: true,
    platform: 'browser', format: 'iife', jsx: 'automatic', logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}',
      __CRYPTOID_BUILD__: JSON.stringify({ sourceCommit: 'local-auth-lifecycle-control' }) },
    plugins: [{ name: 'pinned-auth-counterexample', setup(builder) {
      builder.onLoad({ filter: /\/hooks\/useAuth\.ts$/ }, args => mode === 'released' && args.path === hook
        ? { contents: released, loader: 'ts', resolveDir: resolve(hook, '..') } : undefined);
    } }],
  });
  bundles[mode] = built.outputFiles.find(file => file.path.endsWith('.js')).contents;
}
const defer = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const deadline = promise => Promise.race([promise, new Promise((_, reject) => {
  const timer = setTimeout(() => reject(Error('Isolated native event deadline exceeded')), 15_000);
  timer.unref();
})]);
let active, server, browser;
try {
  server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (path === '/released' || path === '/candidate') {
        const mode = path.slice(1); res.setHeader('Content-Type', 'text/html');
        return res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated auth lifecycle</title></head><body><div id="root"></div><script src="/' + mode + '.js"></script></body></html>');
      }
      if (path.endsWith('.js')) { res.setHeader('Content-Type', 'application/javascript'); return res.end(bundles[path.slice(1, -3)]); }
      if (!path.startsWith('/api/')) return res.end('barrier');
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
      const test = active;
      if (path === '/api/user/signin') {
        test.posts++; test.signinSeen.resolve();
        if (test.scenario.startsWith('api-')) await test.release.promise;
        if (test.scenario === 'api-failed') { res.statusCode = 503; res.setHeader('Content-Type', 'application/json'); return res.end('{"error":"isolated_failure"}'); }
      }
      if (path === '/api/payments/incomplete') test.paymentReplays++;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(path === '/api/user/signin'
        ? { user: { uid: 'isolated-pilot', username: 'Local test', roles: [] }, canAdmin: false, adminMode: false }
        : path === '/api/user/me' ? { user: null, canAdmin: false, adminMode: false } : {}));
    } catch { res.statusCode = 500; res.end(); }
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const base = resolve(root, 'verification/native-browsers/webkit-2336/minibrowser-wpe');
  const libs = resolve(root, 'verification/webkit-libs/usr/lib/x86_64-linux-gnu');
  browser = await webkit.launch({ headless: true, executablePath: base + '/bin/MiniBrowser', env: { ...process.env,
    WEBKIT_EXEC_PATH: base + '/bin', WEBKIT_INJECTED_BUNDLE_PATH: base + '/lib', WEBKIT_INSPECTOR_RESOURCES_PATH: base + '/share',
    LD_LIBRARY_PATH: `${base}/lib:${base}/sys/lib:${libs}`, GST_PLUGIN_SYSTEM_PATH_1_0: libs + '/gstreamer-1.0',
    GST_PLUGIN_SCANNER: libs + '/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner', GST_REGISTRY_1_0: resolve(output, 'audio-registry.bin') } });
  result.engine = browser.version();
  for (const mode of ['released', 'candidate']) for (const scenario of ['sdk-late', 'api-failed', 'api-success', 'host-late', 'healthy']) {
    const test = active = { scenario, posts: 0, paymentReplays: 0, signinSeen: defer(), release: defer(), navSeen: defer(), navigationAttempts: 0 };
    const context = await browser.newContext({ viewport: { width: 393, height: 744 }, hasTouch: true,
      userAgent: scenario === 'host-late' ? 'Local external browser control' : 'Local PiBrowser control' });
    await context.route('**/*', async route => {
      if (new URL(route.request().url()).origin === origin) return route.continue();
      if (route.request().isNavigationRequest()) { test.navigationAttempts++; test.navSeen.resolve(); }
      return route.abort(); // No request ever reaches a real service.
    });
    await context.addInitScript(scenario => {
      window.__ENV = { backendURL: '/api', appNetwork: 'testnet' };
      window.__sdkCalls = 0; window.__oauthCalls = 0; window.__requestedScopes = [];
      window.Pi = {
        signIn: () => { window.__oauthCalls++; },
        getPiHostAppInfo: () => new Promise(resolve => { window.__releaseHost = () => resolve({ hostApp: 'web' }); }),
        authenticate: (scopes, incomplete) => {
          window.__sdkCalls++; window.__requestedScopes = [...scopes];
          if (scenario === 'healthy') incomplete({ identifier: 'local-incomplete-payment' });
          const auth = { accessToken: 'retired-route-token', user: { uid: 'isolated-pilot', username: 'Local test' } };
          return scenario === 'sdk-late' ? new Promise(resolve => { window.__releaseSdk = () => resolve(auth); }) : Promise.resolve(auth);
        },
      };
    }, scenario);
    const page = await context.newPage(); page.on('pageerror', error => result.errors.push({ mode, scenario, message: error.message }));
    await page.goto(origin + '/' + mode);
    if (scenario === 'healthy') {
      await page.waitForFunction(() => document.querySelector('#signed-in')?.textContent === 'true');
      await page.waitForFunction(() => document.querySelector('#auth-ready')?.textContent === 'true');
      await page.evaluate(async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); await fetch('/barrier'); });
      assert.equal(test.posts, 1); assert.equal(test.paymentReplays, 1);
      assert.equal(await page.evaluate(() => window.__sdkCalls), 1);
      assert.deepEqual(await page.evaluate(() => window.__requestedScopes), ['username', 'payments', 'wallet_address']);
      result.cases.push({ mode, scenario, passed: true, signinPosts: test.posts, paymentReplays: test.paymentReplays, strictMode: true });
      await context.close(); continue;
    }
    if (scenario.startsWith('api-')) await deadline(test.signinSeen.promise);
    else if (scenario === 'sdk-late') await page.waitForFunction(() => typeof window.__releaseSdk === 'function');
    else { await page.getByRole('button', { name: 'Connect Pi', exact: true }).click(); await page.waitForFunction(() => typeof window.__releaseHost === 'function'); }
    await page.getByRole('button', { name: 'Leave login', exact: true }).click();
    await page.waitForFunction(() => window.__loginMounted === false);
    await page.evaluate(() => { sessionStorage.setItem('cryptoid_pi_access_token', 'current-route-token'); sessionStorage.setItem('cryptoid_admin_preview', '1'); });
    if (scenario.startsWith('api-')) {
      test.release.resolve(); await page.waitForFunction(() => window.__signinResponses === 1);
    } else if (scenario === 'sdk-late') {
      await page.evaluate(() => window.__releaseSdk());
      if (mode === 'released') { await deadline(test.signinSeen.promise); await page.waitForFunction(() => window.__signinResponses === 1); }
    } else {
      await page.evaluate(() => window.__releaseHost());
      await page.waitForFunction(() => window.__manualSettled === true);
    }
    {
      await page.evaluate(async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); await fetch('/barrier'); });
      const state = await page.evaluate(() => ({ tokenPreserved: sessionStorage.getItem('cryptoid_pi_access_token') === 'current-route-token',
        adminPreserved: sessionStorage.getItem('cryptoid_admin_preview') === '1', routeVisible: document.body.textContent.includes('Current route') }));
      if (mode === 'candidate') { assert.equal(state.tokenPreserved, true); assert.equal(state.adminPreserved, true); assert.equal(state.routeVisible, true); }
      else if (scenario === 'host-late') assert.equal(state.tokenPreserved, true);
      else if (scenario === 'api-success') assert.equal(state.adminPreserved, false);
      else assert.equal(state.tokenPreserved, false);
      if (scenario === 'sdk-late') assert.equal(test.posts, mode === 'released' ? 1 : 0);
      const oauthCalls = await page.evaluate(() => window.__oauthCalls);
      if (scenario === 'host-late') assert.equal(oauthCalls, mode === 'released' ? 1 : 0,
        'localhost uses Pi.signIn; the production-origin redirect is covered separately by the actual-hook unit control');
      result.cases.push({ mode, scenario, passed: true, signinPosts: test.posts, ...state, oauthCalls, navigationAttempts: test.navigationAttempts });
    }
    assert.equal(test.navigationAttempts, 0);
    await context.close();
  }
  assert.deepEqual(result.errors, []); result.complete = true;
} catch (error) { result.failure = { message: error.message, stack: error.stack }; throw error; }
finally { writeFileSync(resolve(output, 'native.json'), JSON.stringify(result, null, 2) + '\n'); await browser?.close(); if (server) { server.closeAllConnections(); await new Promise(done => server.close(done)); } console.log(JSON.stringify({ complete: result.complete, cases: result.cases.length, failure: result.failure?.message })); }
