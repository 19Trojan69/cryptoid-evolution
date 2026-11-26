import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const security = require('../build/notificationSecurity.js');
const platform = require('../build/services/platformAPIClient.js').default;
const mountUsers = require('../build/handlers/users.js').default;

function environment(t) {
  const keys = ['VERCEL_PROJECT_PRODUCTION_URL', 'PI_MAINNET_API_KEY', 'PI_TESTNET_API_KEY'];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, {
    VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution.vercel.app',
    PI_MAINNET_API_KEY: 'consent-mainnet-fixture', PI_TESTNET_API_KEY: 'consent-testnet-fixture',
  });
  t.after(() => { for (const [key, value] of Object.entries(saved)) value === undefined ? delete process.env[key] : process.env[key] = value; });
}

function fixture(t) {
  environment(t);
  const context = security.notificationContext({ notificationNetwork: 'mainnet' });
  const uid = 'verified-app-specific-pilot';
  const until = Date.now() + 600_000;
  const oldMainnet = { uid, namespace: context.namespace, validUntil: until, scopes: ['username', 'in_app_notifications'] };
  const oldTestnet = { uid, namespace: 'separate-verified-testnet-context', validUntil: until, scopes: ['username'] };
  const record = { _id: 'stored-pilot', uid, username: 'Pilot', accessToken: 'old-token',
    playerByNetwork: { testnet: { balance: 123, version: 4 } },
    notificationAuthByNetwork: { mainnet: oldMainnet, testnet: oldTestnet } };
  const me = { uid, username: 'Pilot', credentials: { scopes: ['username', 'in_app_notifications'],
    valid_until: { timestamp: Math.floor(until / 1000) } } };
  let verifies = 0;
  t.mock.method(platform, 'get', async () => { verifies++; return { data: structuredClone(me) }; });
  const users = {
    async findOne(query) { return query.uid === uid || query._id === record._id ? structuredClone(record) : null; },
    async updateOne(query, update) {
      assert.equal(query._id, record._id);
      for (const [path, value] of Object.entries(update.$set)) {
        if (path.startsWith('notificationAuthByNetwork.')) record.notificationAuthByNetwork[path.split('.')[1]] = structuredClone(value);
        else record[path] = structuredClone(value);
      }
    },
  };
  const req = { notificationNetwork: 'mainnet', path: '/user/signin',
    headers: { 'x-cryptoid-app-network': 'testnet' },
    body: { authResult: { accessToken: 'new-verified-token', user: { uid } } },
    session: { currentUser: null }, app: { locals: { userCollection: users } } };
  const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
  return { context, record, me, req, users, oldTestnet, response, verifies: () => verifies };
}

test('a Testnet proxy sign-in cannot refresh Mainnet notification consent or carry stale Mainnet consent forward', async t => {
  const h = fixture(t);
  const routes = {};
  mountUsers({ post(path, handler) { routes[path] = handler; }, get() {} });
  const res = h.response();
  await routes['/signin'](h.req, res);
  assert.equal(res.code, 200, 'the established proxy sign-in remains available');
  assert.equal(h.verifies(), 1);
  assert.equal(h.record.notificationAuthByNetwork.mainnet, null);
  assert.equal(h.req.session.currentUser.notificationAuthByNetwork.mainnet, null);
  assert.deepEqual(h.record.notificationAuthByNetwork.testnet, h.oldTestnet, 'a browser hint cannot author or replace Testnet proof');
  assert.deepEqual(h.record.playerByNetwork, { testnet: { balance: 123, version: 4 } });
});

test('matching server app context retains only Pi-verified consent and malformed network hints cannot grant it', async t => {
  const h = fixture(t);
  const routes = {};
  mountUsers({ post(path, handler) { routes[path] = handler; }, get() {} });
  for (const hint of ['mainnet', undefined]) {
    h.req.headers = hint === undefined ? {} : { 'x-cryptoid-app-network': hint };
    const res = h.response(); await routes['/signin'](h.req, res);
    assert.equal(res.code, 200);
    assert.equal(h.record.notificationAuthByNetwork.mainnet.namespace, h.context.namespace);
    assert.equal(h.record.notificationAuthByNetwork.mainnet.provenanceVersion, 2);
    assert.deepEqual(h.record.notificationAuthByNetwork.mainnet.scopes, h.me.credentials.scopes);
  }
  for (const hint of ['testnet', 'unknown', ['mainnet', 'testnet']]) {
    h.req.headers = { 'x-cryptoid-app-network': hint };
    const res = h.response(); await routes['/signin'](h.req, res);
    assert.equal(res.code, 200);
    assert.equal(h.record.notificationAuthByNetwork.mainnet, null);
    assert.deepEqual(h.record.notificationAuthByNetwork.testnet, h.oldTestnet);
  }
});

test('actual bearer rehydration keeps Testnet login working without stamping Mainnet notification proof', async t => {
  const h = fixture(t);
  const source = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
  const start = source.indexOf('app.use(async (req, _res, next) => {', source.indexOf('// If a proxied Pi Browser request'));
  const end = source.indexOf('app.use(restoreAdminPreview)', start);
  assert.ok(start > 0 && end > start);
  let authenticate;
  new Function('app', 'deletedAccessToken', 'platformAPIClient', 'notificationContext', 'notificationConsentContext', 'verifiedNotificationIdentity', source.slice(start, end))(
    { use(handler) { authenticate = handler; } }, async () => false, platform,
    security.notificationContext, security.notificationConsentContext, security.verifiedNotificationIdentity,
  );
  h.req.path = '/hangar/inventory';
  h.req.get = name => name === 'authorization' ? 'Bearer new-verified-token' : undefined;
  let next = 0;
  await authenticate(h.req, h.response(), () => next++);
  assert.equal(next, 1);
  assert.equal(h.verifies(), 1);
  assert.equal(h.req.session.currentUser.uid, h.record.uid);
  assert.equal(h.record.notificationAuthByNetwork.mainnet, null);
  assert.deepEqual(h.record.notificationAuthByNetwork.testnet, h.oldTestnet);
});

test('legacy consent snapshots remain unusable until a new matching app-context capture', async t => {
  const h = fixture(t);
  assert.equal(security.currentNotificationIdentity(h.record, h.context), null);
  const routes = {};
  mountUsers({ post(path, handler) { routes[path] = handler; }, get() {} });
  h.req.headers = { 'x-cryptoid-app-network': 'mainnet' };
  const res = h.response(); await routes['/signin'](h.req, res);
  assert.equal(res.code, 200);
  assert.equal(security.currentNotificationIdentity(h.record, h.context)?.uid, h.record.uid);
  assert.deepEqual(h.record.playerByNetwork, { testnet: { balance: 123, version: 4 } });
});

test('failed bearer rehydration exposes neither upstream messages nor credential-bearing request data', async t => {
  const h = fixture(t);
  const logs = [];
  const secret = 'simulated-private-pi-token-and-server-key';
  t.mock.method(console, 'warn', (...args) => logs.push(args));
  t.mock.method(platform, 'get', async () => { throw Object.assign(new Error(secret), {
    config: { headers: { Authorization: `Bearer ${secret}` } }, response: { data: { secret } },
  }); });
  const source = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
  const start = source.indexOf('app.use(async (req, _res, next) => {', source.indexOf('// If a proxied Pi Browser request'));
  const end = source.indexOf('app.use(restoreAdminPreview)', start);
  assert.ok(start > 0 && end > start);
  let authenticate;
  new Function('app', 'deletedAccessToken', 'platformAPIClient', 'notificationContext', 'notificationConsentContext', 'verifiedNotificationIdentity', source.slice(start, end))(
    { use(handler) { authenticate = handler; } }, async () => false, platform,
    security.notificationContext, security.notificationConsentContext, security.verifiedNotificationIdentity,
  );
  h.req.path = '/user/me';
  h.req.get = name => name === 'authorization' ? `Bearer ${secret}` : undefined;
  let next = 0;
  await authenticate(h.req, h.response(), () => next++);
  assert.equal(next, 1);
  assert.equal(h.req.session.currentUser, null);
  assert.deepEqual(logs, [['Pi session rehydration failed']]);
  assert.doesNotMatch(JSON.stringify(logs), /simulated-private|Authorization|Bearer|secret/);
});
