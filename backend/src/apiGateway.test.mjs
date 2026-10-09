import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createApiGateway } = require('../build/apiGateway.js');

const response = () => ({
  code: 200, headers: {},
  setHeader(name, value) { this.headers[name] = value; },
  status(code) { this.code = code; return this; },
  json(body) { this.body = body; return this; },
  send(body) { this.body = body; return this; },
});
const preview = { VERCEL_ENV: 'preview', CRYPTOID_TESTNET_BACKEND: 'local' };
const backendFixture = () => {
  const calls = [];
  return { calls, backend: {
    async start(listen) { calls.push({ start: listen }); },
    app(req, res) { calls.push({ url: req.url, network: req.headers['x-cryptoid-app-network'] }); return res.json({ ok: true }); },
  } };
};

test('local Testnet preview overrides a Mainnet header, preserves queries and starts once', async () => {
  const { backend, calls } = backendFixture();
  const gateway = createApiGateway(async () => backend, () => preview);
  const req = { method: 'GET', url: '/api/index?path=leaderboard%2Ftop&rules=1&sort=career', headers: { host: 'preview.vercel.app', 'x-cryptoid-app-network': 'mainnet' } };
  const res = response();
  await gateway(req, res);
  assert.equal(req.url, '/leaderboard/top?rules=1&sort=career');
  assert.equal(req.headers['x-cryptoid-app-network'], 'testnet');
  assert.equal(res.headers['x-cryptoid-backend'], 'testnet-local');
  assert.equal(res.headers['x-cryptoid-score-api'], '5');
  await gateway({ ...req, url: '/api/index?path=progress%2Fstate', headers: { host: 'preview.vercel.app' } }, response());
  assert.deepEqual(calls.filter(call => 'start' in call), [{ start: false }]);
  assert.equal(calls.at(-1).network, 'testnet');
});

test('preview opt-in cannot change the production network or archive query', async () => {
  const { backend, calls } = backendFixture();
  const gateway = createApiGateway(async () => backend, () => ({ VERCEL_ENV: 'production', CRYPTOID_TESTNET_BACKEND: 'local' }));
  await gateway({ method: 'GET', url: '/api/index?path=leaderboard%2Ftop&rules=2', headers: { host: 'cryptoid-evolution.vercel.app', 'x-cryptoid-app-network': 'mainnet' } }, response());
  assert.deepEqual(calls.at(-1), { url: '/leaderboard/top?rules=2', network: 'mainnet' });
});

test('default Testnet proxy does not start the local backend and keeps authentication, body and response cookies', async t => {
  let sent;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    sent = { url: String(url), init };
    return new Response('{"network":"testnet"}', { status: 201, headers: { 'content-type': 'application/json', 'set-cookie': 'connect.sid=test; HttpOnly' } });
  });
  const gateway = createApiGateway(async () => { throw new Error('must not import backend'); }, () => ({ VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution-testnet.vercel.app' }));
  const res = response();
  await gateway({ method: 'POST', url: '/api/index?path=user%2Fsignin&key=one', body: { authResult: { accessToken: 'test-token' } }, headers: { host: 'preview.vercel.app', authorization: 'Bearer test-token', cookie: 'connect.sid=test', 'x-cryptoid-app-network': 'mainnet', 'x-vercel-protection-bypass': 'preview-only' } }, res);
  assert.equal(sent.url, 'https://cryptoid-evolution.vercel.app/api/user/signin?key=one');
  assert.equal(sent.init.headers.get('x-cryptoid-app-network'), 'testnet');
  assert.equal(sent.init.headers.get('authorization'), 'Bearer test-token');
  assert.equal(sent.init.headers.get('cookie'), 'connect.sid=test');
  assert.equal(sent.init.headers.has('x-vercel-protection-bypass'), false);
  assert.equal(sent.init.body, JSON.stringify({ authResult: { accessToken: 'test-token' } }));
  assert.equal(sent.init.redirect, 'manual');
  assert.equal(res.code, 201);
  assert.equal(res.headers['x-cryptoid-backend'], 'production-proxy');
  assert.deepEqual(res.headers['set-cookie'], ['connect.sid=test; HttpOnly']);
});

test('local preview retains the existing Pi-key service for payments and payment administration', async t => {
  const urls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    urls.push(String(url));
    assert.equal(init.headers.get('x-cryptoid-app-network'), 'testnet');
    return new Response('{}', { headers: { 'content-type': 'application/json' } });
  });
  const gateway = createApiGateway(async () => { throw new Error('must not load backend'); }, () => preview);
  for (const path of ['payments/approve', 'payments/complete', 'payments/incomplete', 'admin/payments/id/refresh', 'admin/status', 'notifications/send']) {
    const res = response();
    await gateway({ method: 'POST', url: `/api/index?path=${path}`, body: {}, headers: { host: 'preview.vercel.app' } }, res);
    assert.equal(res.headers['x-cryptoid-backend'], 'production-proxy');
  }
  assert.equal(urls.length, 6);
});

test('local score and reset routes stay Testnet and a failed startup can recover', async t => {
  let attempts = 0;
  const { backend, calls } = backendFixture();
  t.mock.method(console, 'error', () => {});
  const gateway = createApiGateway(async () => {
    if (++attempts === 1) throw new Error('temporary connection failure');
    return backend;
  }, () => preview);
  for (const path of ['leaderboard/score', 'admin/scores/reset', 'leaderboard/checkpoint']) {
    const res = response();
    await gateway({ method: 'POST', url: `/api/index?path=${path}`, body: {}, headers: { host: 'preview.vercel.app', 'x-cryptoid-app-network': 'mainnet' } }, res);
    assert.equal(res.code, path === 'leaderboard/score' ? 500 : 200);
  }
  assert.equal(attempts, 2);
  assert.equal(calls.filter(call => 'start' in call).length, 1);
  assert.ok(calls.filter(call => call.url).every(call => call.network === 'testnet'));
});


test('local Testnet ledger and CSV do not require application API keys', async () => {
  const { backend, calls } = backendFixture();
  const gateway = createApiGateway(async () => backend, () => preview);
  for (const path of ['admin/payments', 'admin/payments/export', 'admin/payments/id/valuation']) {
    const res = response();
    await gateway({ method: 'GET', url: `/api/index?path=${path}`, headers: { host: 'preview.vercel.app' } }, res);
    assert.equal(res.headers['x-cryptoid-backend'], 'testnet-local');
  }

});
