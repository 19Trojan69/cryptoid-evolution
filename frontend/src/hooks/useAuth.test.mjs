import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

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
function harness(authenticate, restore) {
  const states = [], refs = [], effects = [], timers = new Map(), posts = [];
  let stateIndex = 0, refIndex = 0, nextTimer = 0, mounted = false;
  const setTimeout = (fn, delay) => { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; };
  const clearTimeout = id => timers.delete(id);
  const localStorage = storage(), sessionStorage = storage();
  const user = { uid: 'auth-test', username: 'auth-test', roles: [] };
  const axiosClient = {
    get: async () => restore ?? { data: { user, canAdmin: false, adminMode: false } },
    post: async (url, body) => { posts.push({ url, body }); return { data: { user, canAdmin: false, adminMode: false } }; },
  };
  const react = {
    useCallback: fn => fn,
    useRef: value => refs[refIndex++] ??= { current: value },
    useState: initial => { const i = stateIndex++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
    useEffect: fn => { if (!mounted) effects.push(fn); },
  };
  const globals = {
    setTimeout, clearTimeout, localStorage, sessionStorage,
    navigator: { userAgent: 'Mozilla PiBrowser Android Tablet' },
    window: { Pi: { authenticate }, setTimeout, clearTimeout, location: { pathname: '/', origin: 'https://cryptoid-evolution.vercel.app', hostname: 'cryptoid-evolution.vercel.app' } },
    console: { error() {} },
  };
  function module(file, imports) {
    const exports = {};
    const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
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
    axios: { default: { isAxiosError: error => error?.isAxiosError === true } },
  });
  const render = () => { stateIndex = refIndex = 0; const auth = useAuth(); mounted = true; return auth; };
  render();
  return { render, boot: () => effects.forEach(fn => fn()), timers, posts, localStorage, sessionStorage, timeout: () => { const pending = [...timers.values()].find(timer => timer.delay === 60_000); assert.ok(pending, 'Authentication has a bounded deadline'); pending.fn(); } };
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
