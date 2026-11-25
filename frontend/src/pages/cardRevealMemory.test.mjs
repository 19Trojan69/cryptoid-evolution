import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Exercise the actual preference helper. Transport, storage and the existing
// bounded retry scheduler are isolated; no account or Pi endpoint is contacted.
const source = readFileSync(new URL('./cardRevealMemory.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const TOKEN_KEY = 'cryptoid_pi_access_token', ATTEMPT_KEY = 'cryptoid_pi_auth_attempt_v1';
const PREVIEW_KEY = 'cryptoid_admin_preview';
const storage = values => ({
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: key => values.delete(key),
});

function harness({ token = 'token-a', uid = 'pilot-a', failPost = false, verifyError = false } = {}) {
  const localValues = new Map(), sessionValues = new Map([[ATTEMPT_KEY, 'attempt-a']]);
  if (token) sessionValues.set(TOKEN_KEY, token);
  const localStorage = storage(localValues), sessionStorage = storage(sessionValues);
  const requests = [], retryAttempts = [], accepted = [];
  const context = { network: 'mainnet', uid, failPost, verifyError, beforeRetry: undefined, beforeIdentityResult: undefined, beforePost: undefined };
  const request = (method, path, body, config) => {
    const explicitAuthorization = config?.headers?.Authorization;
    const authorization = explicitAuthorization ?? (sessionValues.has(TOKEN_KEY) ? `Bearer ${sessionValues.get(TOKEN_KEY)}` : null);
    const entry = { method, path, body, explicitAuthorization, authorization };
    requests.push(entry);
    return entry;
  };
  const axiosClient = {
    async get(path, config) {
      const entry = request('GET', path, undefined, config);
      assert.equal(path, '/user/me', 'identity is verified through the existing server route');
      if (context.verifyError) throw { response: { status: 503 } };
      await context.beforeIdentityResult?.();
      return { data: { user: context.uid === undefined ? undefined : { uid: context.uid } }, request: entry };
    },
    async post(path, body, config) {
      request('POST', path, body, config);
      assert.equal(path, '/progress/card-reveals');
      await context.beforePost?.();
      // Simulate the server-side compare against its authenticated session.
      // Client verification alone cannot prevent another tab replacing cookies.
      if ((body.expectedUid !== undefined && body.expectedUid !== context.uid)
        || (body.expectedNetwork !== undefined && body.expectedNetwork !== context.network)) {
        throw { response: { status: 409, data: { error: 'account_context_changed' } } };
      }
      if (context.failPost) throw { response: { status: 503 } };
      accepted.push({ uid: context.uid, ids: [...body.ids] });
      return { data: { saved: true } };
    },
  };
  const retrySave = async operation => {
    for (let attempt = 0; attempt < 3; attempt++) {
      retryAttempts.push(attempt);
      try { return await operation(); }
      catch (error) {
        if (attempt === 2 || (error?.response?.status >= 400 && error.response.status < 500)) throw error;
        // Simulate the existing retry boundary without real timers or requests.
        await context.beforeRetry?.(attempt);
      }
    }
  };
  const imports = {
    './shipFleet': { get shipSaveNetwork() { return context.network; } },
    '../lib/axiosClient': { axiosClient, PI_ACCESS_TOKEN_KEY: TOKEN_KEY },
    '../lib/accountSave': { retrySave },
    '../config/piOAuth': { PI_AUTH_ATTEMPT_KEY: ATTEMPT_KEY },
  };
  const module = { exports: {} };
  const require = id => {
    assert.ok(Object.hasOwn(imports, id), `unexpected helper dependency ${id}`);
    return imports[id];
  };
  new Function('require', 'module', 'exports', 'localStorage', 'sessionStorage', compiled)(
    require, module, module.exports, localStorage, sessionStorage,
  );
  return { api: module.exports, requests, retryAttempts, accepted, context, localValues, sessionValues,
    posts: () => requests.filter(entry => entry.method === 'POST'),
    persisted: (owner, network = 'mainnet') => JSON.parse(localValues.get(`cryptoid_card_reveals_v1_${network}_${owner}`) ?? '[]'),
  };
}

test('current verified account syncs its own preferences with captured bearer authorization', async () => {
  const h = harness();
  h.api.rememberCard('pilot-a', 'grey-scout-1');
  h.api.rememberCard('pilot-a', 'grey-scout-1');
  await h.api.syncCardReveals('pilot-a');
  assert.deepEqual(h.requests.map(entry => [entry.method, entry.path]), [
    ['GET', '/user/me'], ['POST', '/progress/card-reveals'],
  ]);
  for (const entry of h.requests) assert.equal(entry.explicitAuthorization, 'Bearer token-a');
  assert.deepEqual(h.posts()[0].body.ids, ['grey-scout-1']);
  assert.equal(h.posts()[0].body.expectedUid, 'pilot-a');
  assert.deepEqual(h.accepted, [{ uid: 'pilot-a', ids: ['grey-scout-1'] }]);
  assert.deepEqual(h.persisted('pilot-a'), ['grey-scout-1']);
});

test('a stale caller cannot upload account A preferences using already current account B credentials', async () => {
  const h = harness({ token: 'token-b', uid: 'pilot-b' });
  h.api.rememberCard('pilot-a', 'grey-scout-1');
  await h.api.syncCardReveals('pilot-a');
  assert.equal(h.posts().length, 0);
  assert.deepEqual(h.persisted('pilot-a'), ['grey-scout-1']);
  assert.deepEqual(h.persisted('pilot-b'), []);
});

test('retired identity verification cannot upload after a token or auth attempt changes', async () => {
  for (const key of [TOKEN_KEY, ATTEMPT_KEY]) {
    const h = harness();
    h.api.rememberCard('pilot-a', 'grey-scout-1');
    h.context.beforeIdentityResult = () => { h.sessionValues.set(key, 'new-context'); };
    await h.api.syncCardReveals('pilot-a');
    assert.equal(h.posts().length, 0, key);
    assert.deepEqual(h.persisted('pilot-a'), ['grey-scout-1']);
  }
});

test('a retry is retired on account change without uploading A preferences into B', async () => {
  const h = harness({ failPost: true });
  h.api.rememberCard('pilot-a', 'grey-scout-1');
  h.context.beforeRetry = () => {
    h.context.failPost = false; h.context.uid = 'pilot-b';
    h.sessionValues.set(TOKEN_KEY, 'token-b'); h.sessionValues.set(ATTEMPT_KEY, 'attempt-b');
  };
  await h.api.syncCardReveals('pilot-a');
  assert.equal(h.posts().length, 1);
  assert.equal(h.posts()[0].explicitAuthorization, 'Bearer token-a');
  assert.deepEqual(h.persisted('pilot-a'), ['grey-scout-1']);
  assert.deepEqual(h.persisted('pilot-b'), []);
});

test('same-token auth attempt, network and preview changes retire a queued preference retry', async () => {
  for (const change of ['auth-attempt', 'network', 'preview']) {
    const h = harness({ failPost: true });
    h.api.rememberCard('pilot-a', 'grey-scout-1');
    h.context.beforeRetry = () => {
      h.context.failPost = false;
      if (change === 'auth-attempt') h.sessionValues.set(ATTEMPT_KEY, 'attempt-b');
      else if (change === 'network') h.context.network = 'testnet';
      else h.sessionValues.set(PREVIEW_KEY, '1');
    };
    await h.api.syncCardReveals('pilot-a');
    assert.equal(h.posts().length, 1, change);
    assert.deepEqual(h.persisted('pilot-a'), ['grey-scout-1'], change);
    assert.deepEqual(h.persisted('pilot-a', 'testnet'), [], change);
  }
});

test('healthy same-account retry retains its immutable preference payload and authorization', async () => {
  const h = harness({ failPost: true });
  h.api.rememberCard('pilot-a', 'grey-scout-1');
  h.context.beforeRetry = () => {
    h.context.failPost = false;
    h.api.rememberCard('pilot-a', 'grey-scout-2');
  };
  await h.api.syncCardReveals('pilot-a');
  assert.equal(h.posts().length, 2);
  for (const entry of h.posts()) {
    assert.deepEqual(entry.body.ids, ['grey-scout-1']);
    assert.equal(entry.body.expectedUid, 'pilot-a');
    assert.equal(entry.explicitAuthorization, 'Bearer token-a');
  }
  assert.deepEqual(h.persisted('pilot-a'), ['grey-scout-1', 'grey-scout-2']);
});

test('guest and empty account queues remain local without contacting a server', async () => {
  const h = harness();
  h.api.rememberCard('guest', 'grey-scout-1');
  await h.api.syncCardReveals('guest'); await h.api.syncCardReveals('pilot-a');
  assert.deepEqual(h.requests, []);
  assert.equal(h.api.hasSeenCard('guest', 'grey-scout-1'), true);
  assert.equal(h.api.hasSeenCard('pilot-a', 'grey-scout-1'), false);
  assert.deepEqual(h.persisted('guest'), ['grey-scout-1']);
});

test('a cookie-only verified session still syncs its own seen flags with a server-side owner guard', async () => {
  const h = harness({ token: null });
  h.api.rememberCard('pilot-a', 'grey-scout-1');
  await h.api.syncCardReveals('pilot-a');
  assert.deepEqual(h.requests.map(entry => [entry.method, entry.path]), [
    ['GET', '/user/me'], ['POST', '/progress/card-reveals'],
  ]);
  for (const entry of h.requests) assert.equal(entry.explicitAuthorization, undefined);
  assert.equal(h.posts()[0].body.expectedUid, 'pilot-a');
  assert.deepEqual(h.accepted, [{ uid: 'pilot-a', ids: ['grey-scout-1'] }]);
  assert.equal(h.api.hasSeenCard('pilot-a', 'grey-scout-1'), true);
  assert.deepEqual(h.persisted('pilot-a'), ['grey-scout-1']);
});

test('a cookie replaced after verification cannot record account A flags on account B', async () => {
  const h = harness({ token: null });
  h.api.rememberCard('pilot-a', 'grey-scout-1');
  h.context.beforePost = () => { h.context.uid = 'pilot-b'; };
  await h.api.syncCardReveals('pilot-a').catch(() => {});
  assert.deepEqual(h.accepted, []);
  assert.equal(h.posts().length, 1);
  assert.equal(h.posts()[0].body.expectedUid, 'pilot-a');
  assert.deepEqual(h.persisted('pilot-a'), ['grey-scout-1']);
  assert.deepEqual(h.persisted('pilot-b'), []);
});

test('preview mode retains local seen flags without remotely updating normal-account preferences', async () => {
  const h = harness();
  h.sessionValues.set(PREVIEW_KEY, '1');
  h.api.rememberCard('pilot-a', 'grey-scout-1');
  await h.api.syncCardReveals('pilot-a');
  assert.deepEqual(h.requests, []);
  assert.deepEqual(h.persisted('pilot-a'), ['grey-scout-1']);
});

test('unavailable or incomplete server identity never uploads preferences', async () => {
  for (const variant of ['unavailable', 'missing-uid']) {
    const h = harness({ verifyError: variant === 'unavailable' });
    if (variant === 'missing-uid') h.context.uid = undefined;
    h.api.rememberCard('pilot-a', 'grey-scout-1');
    await h.api.syncCardReveals('pilot-a').catch(() => {});
    assert.equal(h.posts().length, 0, variant);
    assert.deepEqual(h.persisted('pilot-a'), ['grey-scout-1']);
  }
});
