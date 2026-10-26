import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const releasedSource = readFileSync(new URL('../../scripts/fixtures/useAuth-0ec94cf.ts.txt', import.meta.url), 'utf8');
assert.equal(createHash('sha256').update(releasedSource).digest('hex'), 'e07c190f2bc21d2bfb5bcfb0e4338aeb5923fb9f9af24e27408151c77fffebf8');

const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const authResult = token => ({ accessToken: token, user: { uid: 'auth-test', username: 'auth-test' } });

// Run the actual hook and deadline helper with an isolated SDK, API and clock.
// No Pi account, real session or network writes are used in these regressions.
function harness(authenticate, restore, options = {}) {
  const states = [], refs = [], effects = [], timers = new Map(), posts = [], accessUpdates = [], navigations = [];
  let stateIndex = 0, refIndex = 0, nextTimer = 0, mounted = false;
  const setTimeout = (fn, delay) => { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; };
  const clearTimeout = id => timers.delete(id);
  const localStorage = storage(), sessionStorage = storage();
  const user = { uid: 'auth-test', username: 'auth-test', roles: [] };
  const axiosClient = {
    get: async () => restore ?? { data: { user, canAdmin: false, adminMode: false } },
    post: async (url, body) => { posts.push({ url, body }); return options.post ? options.post(url, body) : { data: { user, canAdmin: false, adminMode: false } }; },
  };
  const react = {
    useCallback: fn => fn,
    useRef: value => refs[refIndex++] ??= { current: value },
    useState: initial => { const i = stateIndex++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
    useEffect: fn => { if (!mounted) effects.push(fn); },
  };
  const globals = {
    setTimeout, clearTimeout, localStorage, sessionStorage,
    navigator: { userAgent: options.userAgent ?? 'Mozilla PiBrowser Android Tablet' },
    window: { Pi: { authenticate, ...options.sdk }, setTimeout, clearTimeout, location: { pathname: '/', origin: 'https://cryptoid-evolution.vercel.app', hostname: 'cryptoid-evolution.vercel.app', assign: url => navigations.push(url) } },
    console: { error() {} },
  };
  function module(file, imports) {
    const exports = {};
    const source = options.released && file === './useAuth.ts' ? releasedSource : readFileSync(new URL(file, import.meta.url), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { exports, require: name => { assert.ok(name in imports, `Unmapped import: ${name}`); return imports[name]; }, ...globals });
    return exports;
  }
  const timeout = module('../lib/piAuthTimeout.ts', {});
  const { useAuth } = module('./useAuth.ts', {
    react,
    '../lib/axiosClient': { axiosClient, PI_ACCESS_TOKEN_KEY: 'token' },
    '../pages/shipFleet': { ADMIN_MODE_KEY: 'admin-mode' },
    '../config/piOAuth': { PI_OAUTH_ORIGIN: 'https://cryptoid-evolution-testnet.vercel.app' },
    '../lib/piAuthTimeout': timeout,
    '../lib/ownerLifecycle': { updateOwnerLifecycleAccess: value => accessUpdates.push(value) },
    axios: { default: { isAxiosError: error => error?.isAxiosError === true } },
  });
  const render = () => { stateIndex = refIndex = 0; const auth = useAuth(); mounted = true; return auth; };
  render();
  let cleanups = [];
  return { render, boot: () => { cleanups = effects.map(fn => fn()); }, unmount: () => { cleanups.forEach(fn => fn?.()); cleanups = []; }, timers, posts, accessUpdates, navigations, localStorage, sessionStorage,
    timeout: () => { const pending = [...timers.values()].find(timer => timer.delay === 60_000); assert.ok(pending, 'Authentication has a bounded deadline'); pending.fn(); } };
}

test('a stalled Pi Browser no longer holds the startup and retry controls forever', async () => {
  const h = harness(() => new Promise(() => {}));
  h.boot(); await flush();
  assert.equal(h.render().isLoading, true);
  assert.equal(h.render().authReady, false);
  h.timeout(); await flush();
  const auth = h.render();
  assert.equal(auth.isLoading, false);
  assert.equal(auth.authReady, true);
  assert.equal(auth.isAuthenticated, false);
  assert.equal(auth.authError, 'Could not sign in with Pi. Please retry.');
  assert.equal(h.posts.length, 0);
  assert.equal(h.timers.size, 0);
});

test('late native replies are ignored and a new attempt can sign in normally', async () => {
  const first = deferred(); let attempts = 0;
  const h = harness(() => ++attempts === 1 ? first.promise : Promise.resolve(authResult('new-token')));
  h.boot(); await flush(); h.timeout(); await flush();
  first.resolve(authResult('old-token')); await flush();
  assert.equal(h.posts.length, 0);
  await h.render().signIn();
  assert.equal(h.posts.length, 1);
  assert.equal(h.posts[0].body.authResult.accessToken, 'new-token');
  assert.equal(h.render().user.username, 'auth-test');
  assert.equal(h.render().authError, '');
  assert.equal(h.timers.size, 0);
});

test('SDK rejection unlocks manual sign-in without writing an invalid session', async () => {
  const h = harness(async () => { throw new Error('Native sign-in unavailable'); });
  h.boot(); await flush();
  assert.equal(h.render().authReady, true);
  assert.equal(h.render().isLoading, false);
  assert.equal(h.sessionStorage.getItem('token'), null);
  assert.equal(h.posts.length, 0);
  assert.equal(h.timers.size, 0);
});

test('an existing Web App session is restored without replacing it with native authentication', async () => {
  let calls = 0;
  const h = harness(async () => { calls++; throw new Error('Should not use SDK'); });
  h.localStorage.setItem('cryptoid_pi_session', '1');
  h.boot(); await flush();
  assert.equal(calls, 0);
  assert.equal(h.render().user.username, 'auth-test');
  assert.equal(h.render().authReady, true);
  assert.equal(h.posts.length, 0);
});

test('a native sign-in response from an unmounted route cannot replace the current token or session', async () => {
  const sdk = deferred(), h = harness(() => sdk.promise);
  h.boot(); await flush();
  assert.equal(h.render().isLoading, true);
  h.unmount();
  h.sessionStorage.setItem('token', 'current-route-token');
  sdk.resolve(authResult('retired-route-token')); await flush();
  assert.equal(h.posts.length, 0, 'a retired native result must never reach /user/signin');
  assert.equal(h.sessionStorage.getItem('token'), 'current-route-token');
  assert.deepEqual(h.accessUpdates, []);
  assert.equal(h.timers.size, 0);
});

test('an old failed sign-in request cannot clear credentials belonging to a later route', async () => {
  let reject;
  const reply = new Promise((resolve, fail) => { reject = fail; });
  const h = harness(async () => authResult('retired-route-token'), undefined, { post: () => reply });
  h.boot(); await flush(); assert.equal(h.posts.length, 1);
  h.unmount(); h.sessionStorage.setItem('token', 'current-route-token');
  reject(new Error('Isolated old response failed')); await flush();
  assert.equal(h.sessionStorage.getItem('token'), 'current-route-token');
  assert.deepEqual(h.accessUpdates, []);
});

test('an old successful sign-in response cannot change the new route admin/session flags', async () => {
  const reply = deferred();
  const h = harness(async () => authResult('retired-route-token'), undefined, { post: () => reply.promise });
  h.boot(); await flush(); assert.equal(h.posts.length, 1);
  h.unmount(); h.sessionStorage.setItem('admin-mode', '1'); h.sessionStorage.setItem('token', 'current-route-token');
  reply.resolve({ data: { user: { uid: 'retired-user' }, canAdmin: false, adminMode: false } }); await flush();
  assert.equal(h.sessionStorage.getItem('admin-mode'), '1');
  assert.equal(h.sessionStorage.getItem('token'), 'current-route-token');
  assert.equal(h.localStorage.getItem('cryptoid_pi_session'), null);
  assert.deepEqual(h.accessUpdates, []);
});

test('late host detection from a retired manual attempt cannot navigate the current document', async () => {
  const host = deferred();
  const h = harness(async () => authResult('unused'), undefined, {
    userAgent: 'External browser', sdk: { getPiHostAppInfo: () => host.promise },
  });
  h.boot(); const manual = h.render().signIn(); await flush();
  h.unmount(); host.resolve({ hostApp: 'web' }); await manual; await flush();
  assert.deepEqual(h.navigations, []);
  assert.equal(h.posts.length, 0);
  assert.equal(h.sessionStorage.getItem('token'), null);
});

test('StrictMode startup setup cleanup setup produces only one current native authentication', async () => {
  let calls = 0;
  const h = harness(async () => { calls++; return authResult('current-token'); });
  h.boot(); h.unmount(); h.boot(); await flush();
  assert.equal(calls, 1);
  assert.equal(h.posts.length, 1);
  assert.equal(h.render().isAuthenticated, true);
  assert.equal(h.render().isLoading, false);
  assert.equal(h.timers.size, 0);
});

test('current native authentication retains the original permissions and incomplete-payment replay', async () => {
  const payment = { identifier: 'isolated-incomplete-payment' }; let scopes;
  const h = harness(async (requested, incomplete) => {
    scopes = requested; await incomplete(payment); return authResult('current-token');
  });
  h.boot(); await flush();
  assert.deepEqual(Array.from(scopes), ['username', 'payments', 'wallet_address']);
  assert.deepEqual(h.posts.map(p => p.url), ['/user/signin', '/payments/incomplete']);
  assert.deepEqual(h.posts[1].body.payment, payment);
  assert.equal(h.render().isAuthenticated, true);
  assert.equal(h.sessionStorage.getItem('token'), 'current-token');
});

test('the pinned released hook reproduces all four retired-attempt counterexamples', async () => {
  const sdk = deferred(), native = harness(() => sdk.promise, undefined, { released: true });
  native.boot(); await flush(); native.unmount(); native.sessionStorage.setItem('token', 'current-route-token');
  sdk.resolve(authResult('retired-route-token')); await flush();
  assert.equal(native.posts.length, 1);
  assert.equal(native.sessionStorage.getItem('token'), 'retired-route-token');

  let reject;
  const failedReply = new Promise((resolve, fail) => { reject = fail; });
  const failed = harness(async () => authResult('retired-route-token'), undefined, { released: true, post: () => failedReply });
  failed.boot(); await flush(); failed.unmount(); failed.sessionStorage.setItem('token', 'current-route-token');
  reject(new Error('Isolated failure')); await flush();
  assert.equal(failed.sessionStorage.getItem('token'), null);

  const successReply = deferred();
  const success = harness(async () => authResult('retired-route-token'), undefined, { released: true, post: () => successReply.promise });
  success.boot(); await flush(); success.unmount(); success.sessionStorage.setItem('admin-mode', '1');
  successReply.resolve({ data: { user: {}, canAdmin: false, adminMode: false } }); await flush();
  assert.equal(success.sessionStorage.getItem('admin-mode'), null);

  const host = deferred();
  const redirect = harness(async () => authResult('unused'), undefined, { released: true,
    userAgent: 'External browser', sdk: { getPiHostAppInfo: () => host.promise } });
  redirect.boot(); const manual = redirect.render().signIn(); await flush(); redirect.unmount();
  host.resolve({ hostApp: 'web' }); await manual; await flush();
  assert.equal(redirect.navigations.length, 1);
});
