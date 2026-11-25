import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

// Runs the actual hook. Only React scheduling, Pi's host bridge and transport
// are local substitutes; no account, wallet or live payment is contacted.
const source = readFileSync(new URL('./usePayments.ts', import.meta.url), 'utf8');
const code = transformSync(source.replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, ''), { loader: 'ts' }).code;
function paymentHost({ denyRead = false, denyWrite = false, denyRemove = false, stored = '' } = {}) {
  const values = new Map([['cryptoid_pi_access_token', 'isolated-token'], ['cryptoid_payment_diagnostic', stored]]);
  const states = [], requests = [], payments = [], effects = [], scope = { denyRead, denyWrite, denyRemove };
  let stateIndex = 0;
  const env = {
    useState(initial) { const i = stateIndex++; states[i] = typeof initial === 'function' ? initial() : initial;
      return [states[i], value => { states[i] = value; }]; },
    useRef: current => ({ current }), useCallback: fn => fn, useEffect: fn => effects.push(fn),
    PI_AUTH_ATTEMPT_KEY: "cryptoid_pi_auth_attempt_v1",
    PI_ACCESS_TOKEN_KEY: 'cryptoid_pi_access_token',
    sessionStorage: {
      getItem(key) { if (key === 'cryptoid_payment_diagnostic' && scope.denyRead) throw new DOMException('private-read', 'SecurityError'); return values.get(key) ?? null; },
      setItem(key, value) { if (key === 'cryptoid_payment_diagnostic' && scope.denyWrite) throw new DOMException('private-write', 'QuotaExceededError'); values.set(key, value); },
      removeItem(key) { if (key === 'cryptoid_payment_diagnostic' && scope.denyRemove) throw new DOMException('private-remove', 'SecurityError'); values.delete(key); },
    },
    axiosClient: { async post(path, body) {
      requests.push({ path, body });
      if (env.rejectPath === path) throw { response: { status: 503, data: { error: 'isolated_unavailable' } } };
      return { data: { approved: true, completed: true } };
    } },
    window: { Pi: {
      async authenticate() { return { accessToken: 'isolated-token', user: { uid: 'isolated-user' } }; },
      async createPayment(order, callbacks) {
        payments.push({ order, callbacks });
        if (env.mode === 'sdk-error') callbacks.onError(new Error('isolated-sdk-error'));
        if (env.mode === 'approve') await callbacks.onReadyForServerApproval('isolated-payment');
        if (env.mode === 'complete') await callbacks.onReadyForServerCompletion('isolated-payment', 'isolated-txid');
      },
    } },
  };
  const factory = new Function('env', 'with (env) {\n' + code + '\nreturn usePayments; }')(env);
  const api = factory({ isAuthenticated: true, accountId: 'isolated-user', network: 'testnet', onRequireAuth() { throw Error('unexpected login'); } });
  const cleanups = effects.map(fn => fn());
  return { env, api, states, values, payments, requests, scope, unmount: () => cleanups.forEach(fn => fn?.()),
    get loading() { return states[0]; }, get diagnostic() { return states[3]; },
    order: confirmed => api.orderProduct('Isolated Test-Pi', 0.01, { productId: 'weapon_twin', quantity: 1, weaponModel: 2 }, confirmed),
  };
}

test('unavailable optional diagnostic storage does not prevent the purchase hook from mounting', () => {
  const f = paymentHost({ denyRead: true });
  assert.equal(f.loading, false); assert.equal(f.diagnostic, '');
});

test('quota failure while recording an approval error releases busy state and allows an explicit retry', async () => {
  const f = paymentHost({ denyWrite: true });
  f.env.mode = 'approve'; f.env.rejectPath = '/payments/approve';
  await assert.doesNotReject(f.order());
  assert.equal(f.loading, false); assert.match(f.diagnostic, /^Approval: isolated_unavailable/);
  assert.equal(f.payments.length, 1);
  f.env.mode = 'complete'; f.env.rejectPath = undefined;
  let confirmed = 0;
  await f.order(() => { confirmed++; });
  assert.equal(f.loading, false); assert.equal(f.diagnostic, ''); assert.equal(confirmed, 1);
  assert.equal(f.payments.length, 2, 'only the explicit second click starts another order');
});

test('a denied diagnostic removal cannot stop checkout or its successful confirmation', async () => {
  const f = paymentHost({ denyRemove: true, stored: 'previous-error' }); f.env.mode = 'complete';
  let confirmed = 0;
  await assert.doesNotReject(f.order(() => { confirmed++; }));
  assert.equal(f.loading, false); assert.equal(f.diagnostic, ''); assert.equal(confirmed, 1);
  assert.equal(f.payments.length, 1);
  assert.deepEqual(f.requests.map(r => r.path), ['/payments/complete']);
});

test('SDK failures use the current in-memory diagnostic even when a stale persisted message cannot be removed', async () => {
  const f = paymentHost({ denyRead: true, denyWrite: true, denyRemove: true, stored: 'stale-private-message' });
  f.env.mode = 'sdk-error';
  await assert.doesNotReject(f.order());
  assert.equal(f.loading, false); assert.match(f.diagnostic, /^Pi SDK: isolated-sdk-error/);
  assert.equal(f.payments.length, 1);
});

test('a later SDK error preserves the specific approval failure without requiring a successful storage write', async () => {
  const f = paymentHost({ denyWrite: true }); f.env.mode = 'approve'; f.env.rejectPath = '/payments/approve';
  await assert.doesNotReject(f.order());
  const diagnostic = f.diagnostic;
  f.payments[0].callbacks.onError(new Error('less-specific-sdk-error'));
  assert.equal(f.loading, false); assert.equal(f.diagnostic, diagnostic);
});

test('healthy checkout keeps the existing metadata, confirmation request and single callback', async () => {
  const f = paymentHost(); f.env.mode = 'complete'; let confirmed = 0;
  await f.order(() => { confirmed++; });
  assert.deepEqual(f.payments[0].order, { amount: 0.01, memo: 'Isolated Test-Pi', metadata: { productId: 'weapon_twin', quantity: 1, weaponModel: 2 } });
  assert.deepEqual(f.requests, [{ path: '/payments/complete', body: { paymentId: 'isolated-payment', txid: 'isolated-txid' } }]);
  assert.equal(confirmed, 1); assert.equal(f.loading, false);
});

test('SDK account changes cannot replace mission credentials or open checkout', async () => {
  const f = paymentHost();
  f.env.window.Pi.authenticate = async () => ({ accessToken: 'different-account-token', user: { uid: 'different-user' } });
  await f.order();
  assert.equal(f.values.get('cryptoid_pi_access_token'), 'isolated-token');
  assert.equal(f.payments.length, 0); assert.equal(f.requests.length, 0);
  assert.match(f.diagnostic, /payment_account_mismatch/); assert.equal(f.loading, false);
});

test('a stale native authentication after signout or unmount cannot create payments', async () => {
  for (const retire of ['signout', 'unmount', 'network-account']) {
    const f = paymentHost(); let resolve;
    f.env.window.Pi.authenticate = () => new Promise(done => { resolve = done; });
    const request = f.order();
    if (retire === 'unmount') f.unmount();
    else if (retire === 'signout') f.values.set('cryptoid_pi_auth_attempt_v1', 'new-signout-attempt');
    else f.values.set('cryptoid_pi_access_token', 'different-network-account-token');
    resolve({ accessToken: 'isolated-token', user: { uid: 'isolated-user' } }); await request;
    assert.equal(f.payments.length, 0); assert.equal(f.requests.length, 0);
  }
});

test('delayed callbacks cannot contact API or claim a purchase after account switch', async () => {
  const f = paymentHost(); let confirmed = 0;
  await f.order(() => { confirmed++; });
  f.values.set('cryptoid_pi_access_token', 'new-account-token');
  const callback = f.payments[0].callbacks;
  await callback.onReadyForServerApproval('old-payment');
  await callback.onReadyForServerCompletion('old-payment', 'old-txid');
  await callback.onCancel('old-payment');
  assert.equal(f.requests.length, 0); assert.equal(confirmed, 0);
});

test('simultaneous repeated completion calls confirm the same payment only once', async () => {
  const f = paymentHost(); let confirmed = 0, resolve;
  await f.order(() => { confirmed++; });
  f.env.axiosClient.post = async (path, body) => { f.requests.push({ path, body }); return new Promise(done => { resolve = done; }); };
  const callback = f.payments[0].callbacks;
  const first = callback.onReadyForServerCompletion('same-payment', 'same-txid');
  const repeated = callback.onReadyForServerCompletion('same-payment', 'same-txid');
  assert.equal(f.requests.length, 1);
  resolve({ data: { completed: true } }); await Promise.all([first, repeated]);
  await callback.onReadyForServerCompletion('same-payment', 'same-txid');
  assert.equal(f.requests.length, 1); assert.equal(confirmed, 1); assert.equal(f.loading, false);
});

test('incomplete SDK payments for a different account never reach recovery API', async () => {
  const f = paymentHost(); let confirmed = 0;
  f.env.window.Pi.authenticate = async (_scopes, incomplete) => {
    incomplete({ identifier: 'other-account-payment', user_uid: 'different-user' });
    return { accessToken: 'isolated-token', user: { uid: 'isolated-user' } };
  };
  await f.order(() => { confirmed++; });
  assert.equal(f.requests.length, 0); assert.equal(f.payments.length, 0); assert.equal(confirmed, 0);
  assert.match(f.diagnostic, /payment_account_mismatch/);
});
