import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';
const origin = 'https://www.cryptoid-evolution.app';
const settings = { VITE_PI_OAUTH_CLIENT_ID: 'configured-portal-client', VITE_PI_OAUTH_ORIGIN: origin, VITE_PI_OAUTH_NETWORK: 'mainnet' };
const load = (path, imports = {}, globals = {}, environment = {}) => {
  const exports = {};
  const source = readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('import.meta.env', JSON.stringify(environment));
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { assert.ok(name in imports, `Unmapped ${name}`); return imports[name]; }, URL, Uint8Array, crypto: webcrypto, ...globals });
  return exports;
};
const oauth = load('./piOAuth.ts');
const store = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };
const flush = async () => { for (let n = 0; n < 30; n++) await Promise.resolve(); };

test('OAuth requires actual portal configuration bound to exact origin and network', () => {
  assert.equal(oauth.resolvePiOAuthConfiguration(origin, 'mainnet', {}), null);
  const config = oauth.resolvePiOAuthConfiguration(origin, 'mainnet', settings);
  assert.equal(config.redirectUri, `${origin}/signin/callback`);
  assert.equal(oauth.resolvePiOAuthConfiguration('https://cryptoid-evolution-testnet.vercel.app', 'testnet', settings), null);
  assert.equal(oauth.resolvePiOAuthConfiguration(origin, 'testnet', settings), null);
  for (const invalid of [`${origin}/`, `${origin}/signin/callback`, 'https://attacker.example', 'javascript:alert(1)', 'https://user:pass@www.cryptoid-evolution.app']) {
    assert.equal(oauth.resolvePiOAuthConfiguration(origin, 'mainnet', { ...settings, VITE_PI_OAUTH_ORIGIN: invalid }), null);
  }
  const testnet = 'https://cryptoid-evolution-testnet.vercel.app';
  assert.ok(oauth.resolvePiOAuthConfiguration(testnet, 'testnet', { ...settings, VITE_PI_OAUTH_NETWORK: 'testnet', VITE_PI_OAUTH_ORIGIN: testnet }));
});

test('OAuth return routes reject absolute, encoded, query and protocol-relative targets', () => {
  for (const safe of ['/', '/admin', '/game', '/galaxy']) assert.equal(oauth.safePiReturnPath(safe), safe);
  for (const value of ['//attacker.example', 'https://attacker.example', '/admin?next=//attacker.example', '/%2f%2fattacker.example', '/admin#x', '/signin/callback', '/shop', undefined]) {
    assert.equal(oauth.safePiReturnPath(value), '/');
  }
});

test('OAuth transaction validates state, age, origin, network and return route', () => {
  const storage = store(), state = oauth.beginPiAuthAttempt(storage), config = oauth.resolvePiOAuthConfiguration(origin, 'mainnet', settings);
  oauth.storePiOAuthTransaction(storage, config, state, '/admin', 1000);
  const raw = storage.getItem(oauth.PI_OAUTH_STATE_KEY);
  assert.ok(oauth.validatePiOAuthTransaction(raw, state, config, state, 1001));
  for (const change of [{ state: '0'.repeat(64) }, { network: 'testnet' }, { origin: 'https://attacker.example' }, { redirectUri: 'https://attacker.example/signin/callback' }, { returnTo: '//attacker.example' }, { createdAt: 1002 }]) {
    assert.equal(oauth.validatePiOAuthTransaction(JSON.stringify({ ...JSON.parse(raw), ...change }), state, config, state, 1001), null);
  }
  assert.equal(oauth.validatePiOAuthTransaction(raw, state, config, 'different-attempt', 1001), null);
  assert.equal(oauth.validatePiOAuthTransaction(raw, state, config, state, 1000 + oauth.PI_OAUTH_MAX_AGE_MS + 1), null);
});

function callbackHost({ error, token = 'oauth-token', invalidState = false, configured = true, post } = {}) {
  const sessionStorage = store(), localStorage = store(), states = [], navigations = [], posts = [];
  const state = oauth.beginPiAuthAttempt(sessionStorage);
  const config = oauth.resolvePiOAuthConfiguration(origin, 'mainnet', settings);
  oauth.storePiOAuthTransaction(sessionStorage, config, state, '/admin');
  const params = new URLSearchParams({ state: invalidState ? '0'.repeat(64) : state, ...(error ? { error } : { access_token: token }) });
  let effect;
  const componentOauth = load('./piOAuth.ts', {}, {}, configured ? settings : {});
  const { default: Component } = load('../pages/PiSignInCallback.tsx', {
    react: { useState: initial => { const i = states.length; states.push(initial); return [initial, value => { states[i] = value; }]; }, useEffect: fn => { effect = fn; } },
    'react/jsx-runtime': { jsx() {}, jsxs() {} },
    '../lib/axiosClient': { PI_ACCESS_TOKEN_KEY: 'token', axiosClient: { post: async (path, body, options) => { posts.push({ path, body, options }); return post ? post() : { data: { user: { uid: 'verified-user' } } }; } } },
    '../config/piOAuth': componentOauth,
    './shipFleet': { ADMIN_MODE_KEY: 'admin', shipSaveNetwork: 'mainnet' },
    '../i18n': { useLocale: () => ({ t: value => value }) },
  }, { sessionStorage, localStorage, URLSearchParams, AbortController, history: { replaceState() {} }, window: { location: { origin, pathname: '/signin/callback', hash: `#${params}`, replace: path => navigations.push(path) } } });
  Component();
  return { sessionStorage, localStorage, states, navigations, posts, start: () => effect(), state };
}

test('OAuth callback consumes the transaction once and commits only server-verified credentials', async () => {
  const h = callbackHost(); const cleanup = h.start();
  assert.equal(h.posts.length, 0);
  await flush();
  assert.equal(h.posts.length, 1);
  assert.equal(h.sessionStorage.getItem('token'), 'oauth-token');
  assert.equal(h.sessionStorage.getItem(oauth.PI_OAUTH_STATE_KEY), null);
  assert.deepEqual(h.navigations, ['/admin']);
  cleanup(); h.start(); await flush();
  assert.equal(h.posts.length, 1, 'replayed callback cannot contact backend');
});

test('invalid state, missing config and cancelled OAuth preserve existing credentials and never call server', async () => {
  for (const options of [{ invalidState: true }, { configured: false }, { error: 'access_denied' }, { error: 'expired' }, { token: 'invalid token' }]) {
    const h = callbackHost(options); h.sessionStorage.setItem('token', 'newer-session'); h.start(); await flush();
    assert.equal(h.posts.length, 0);
    assert.equal(h.sessionStorage.getItem('token'), 'newer-session');
    assert.equal(h.states[0], 'error');
    assert.deepEqual(h.navigations, []);
  }
});

test('retired callback responses cannot replace or clear a newer account token', async () => {
  for (const reject of [false, true]) {
    let resolve, fail;
    const request = new Promise((done, failed) => { resolve = done; fail = failed; });
    const h = callbackHost({ post: () => request }); const cleanup = h.start(); await flush();
    assert.equal(h.posts.length, 1);
    cleanup(); h.sessionStorage.setItem('token', 'new-account-token');
    if (reject) fail(new Error('private server error')); else resolve({ data: { user: { uid: 'old-account' } } });
    await flush();
    assert.equal(h.sessionStorage.getItem('token'), 'new-account-token');
    assert.equal(h.localStorage.getItem('cryptoid_pi_session'), null);
    assert.deepEqual(h.navigations, []);
    assert.equal(h.posts[0].options.signal.aborted, true);
  }
});

test('callback rejects a superseded attempt while mounted and survives StrictMode setup replay', async () => {
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const stale = callbackHost({ post: () => pending }); stale.start(); await flush();
  oauth.beginPiAuthAttempt(stale.sessionStorage); stale.sessionStorage.setItem('token', 'new-account-token');
  resolve({ data: { user: { uid: 'old' } } }); await flush();
  assert.equal(stale.sessionStorage.getItem('token'), 'new-account-token'); assert.deepEqual(stale.navigations, []);
  const strict = callbackHost(); const firstCleanup = strict.start(); firstCleanup(); strict.start(); await flush();
  assert.equal(strict.posts.length, 1); assert.deepEqual(strict.navigations, ['/admin']);
});
