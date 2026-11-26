import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const security = require('../../build/notificationSecurity.js');
const mount = require('../../build/handlers/notifications.js').default;
const { createApiGateway } = require('../../build/apiGateway.js');

function store() {
  let record;
  return {
    async findOne({ _id }) { return record?._id === _id ? structuredClone(record) : null; },
    async updateOne(query, update, options) {
      if (!record && options?.upsert) { record = { ...query, ...structuredClone(update.$set) }; return { upsertedCount: 1 }; }
      if (record?._id === query._id && record.revision === query.revision) {
        Object.assign(record, structuredClone(update.$set)); return { matchedCount: 1 };
      }
      if (options?.upsert) throw Object.assign(new Error('duplicate'), { code: 11000 });
      return { matchedCount: 0 };
    },
    get record() { return record; },
  };
}
function response() { return { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
function setup(t) {
  const saved = Object.fromEntries(['PI_MAINNET_API_KEY','PI_TESTNET_API_KEY','ADMIN_PI_UID','ADMIN_PI_TESTNET_UID','CRYPTOID_NOTIFICATIONS_ENABLED'].map(k => [k, process.env[k]]));
  Object.assign(process.env, { PI_MAINNET_API_KEY: 'fixture-main-key', PI_TESTNET_API_KEY: 'fixture-test-key', ADMIN_PI_UID: 'owner-main', ADMIN_PI_TESTNET_UID: 'owner-test', CRYPTOID_NOTIFICATIONS_ENABLED: '1' });
  if (!t.notificationEnvironmentSaved) {
    t.notificationEnvironmentSaved = true;
    t.after(() => { for (const [k, v] of Object.entries(saved)) v === undefined ? delete process.env[k] : process.env[k] = v; });
  }
  const sends = [], clients = [];
  t.mock.method(security, 'notificationClient', context => {
    clients.push(context.network);
    return { async post(url, body) { sends.push({ url, body }); return { status: 201, data: { success: true, delivered_notifications: body.notifications.map(item => ({ user_uid: item.user_uid })) } }; } };
  });
  const routes = {}; mount({ post(path, handler) { routes[path] = handler; } });
  const claims = store();
  const context = security.notificationContext({ notificationNetwork: 'mainnet' });
  const identity = uid => ({ uid, notificationAuthByNetwork: { mainnet: { provenanceVersion: 2, uid, namespace: context.namespace, scopes: ['username','in_app_notifications'], validUntil: Date.now() + 600_000 } } });
  const users = [identity('recipient')];
  const req = {
    notificationNetwork: 'mainnet',
    session: { currentUser: { ...identity('owner-main'), accessToken: 'verified-token' } },
    headers: {}, body: { requestId: 'notification-00000001', notifications: [{ title: 'Mission update', body: 'Your next mission is available.', user_uid: 'recipient', subroute: '/' }] },
    app: { locals: { adminCollection: claims, userCollection: { async findOne({ uid }) { return users.find(user => user.uid === uid) ?? null; } } } },
  };
  return { req, users, clients, sends, context, claims, identity, async call(input = req) { const res = response(); await routes['/send'](input, res); return res; } };
}

test('anonymous and non-owner requests never construct or call a Pi client', async t => {
  const h = setup(t);
  for (const currentUser of [null, { uid: 'pilot', username: '19Trojan69', roles: ['admin'] }]) {
    h.req.session.currentUser = currentUser;
    h.req.session.adminMode = true;
    h.req.session.adminUid = currentUser?.uid;
    h.req.headers['x-cryptoid-app-network'] = 'testnet';
    h.req.headers['x-cryptoid-admin-test'] = '1';
    assert.equal((await h.call()).code, currentUser ? 403 : 401);
  }
  assert.deepEqual(h.clients, []); assert.deepEqual(h.sends, []);
});

test('server context determines owner and credential namespace despite browser network claims', async t => {
  const h = setup(t); h.req.headers['x-cryptoid-app-network'] = 'testnet';
  const res = await h.call();
  assert.equal(res.code, 201); assert.deepEqual(res.body, { requested: 1, delivered: 1 });
  assert.deepEqual(h.clients, ['mainnet']);
  assert.equal(h.sends[0].url, '/v2/in_app_notifications/notify');
  assert.equal('requestId' in h.sends[0].body, false);
});

test('missing, expired or different-key identities fail closed and mismatched bearer is rejected', async t => {
  for (const mutation of [
    h => { delete h.req.session.currentUser.notificationAuthByNetwork; },
    h => { delete h.req.session.currentUser.notificationAuthByNetwork.mainnet.provenanceVersion; },
    h => { h.req.session.currentUser.notificationAuthByNetwork.mainnet.validUntil = 1; },
    h => { h.req.session.currentUser.notificationAuthByNetwork.mainnet.namespace = 'another-app'; },
    h => { h.req.headers.authorization = 'Bearer another-account'; },
  ]) {
    const h = setup(t); mutation(h); assert.equal((await h.call()).code, 401); assert.equal(h.clients.length, 0);
  }
});

test('dispatch needs explicit enabled network credentials and durable storage', async t => {
  const h = setup(t);
  delete process.env.PI_MAINNET_API_KEY;
  assert.equal((await h.call()).code, 503);
  process.env.PI_MAINNET_API_KEY = 'fixture-main-key';
  process.env.CRYPTOID_NOTIFICATIONS_ENABLED = '0'; assert.equal((await h.call()).code, 503);
  process.env.CRYPTOID_NOTIFICATIONS_ENABLED = '1'; delete h.req.app.locals.adminCollection;
  assert.equal((await h.call()).code, 503); assert.equal(h.clients.length, 0);
});

test('unknown, unconsented, expired and other-app recipients cannot be sent to', async t => {
  for (const mutation of [
    h => { h.users.length = 0; },
    h => { delete h.users[0].notificationAuthByNetwork.mainnet.provenanceVersion; },
    h => { h.users[0].notificationAuthByNetwork.mainnet.scopes = ['username']; },
    h => { h.users[0].notificationAuthByNetwork.mainnet.validUntil = 1; },
    h => { h.users[0].notificationAuthByNetwork.mainnet.namespace = 'testnet-or-another-key'; },
  ]) {
    const h = setup(t); mutation(h); assert.equal((await h.call()).code, 403); assert.equal(h.clients.length, 0);
  }
});

test('server validates every field and quantity, including internal routes', async t => {
  const h = setup(t), original = structuredClone(h.req.body);
  const notification = original.notifications[0];
  const bad = [
    {}, { ...original, owner: true }, { ...original, requestId: 'short' },
    { ...original, notifications: [] }, { ...original, notifications: Array(51).fill(notification) },
    ...[
      { ...notification, title: '' }, { ...notification, body: 'x'.repeat(501) },
      { ...notification, title: '<script>' }, { ...notification, body: 'line\nbreak' },
      { ...notification, user_uid: '$where' }, { ...notification, network: 'testnet' },
      { ...notification, subroute: '//attacker.test' }, { ...notification, subroute: '/shop?redirect=https://attacker.test' },
    ].map(item => ({ ...original, notifications: [item] })),
    { ...original, notifications: [notification, notification] },
  ];
  for (const body of bad) { h.req.body = body; assert.equal((await h.call()).code, 400, JSON.stringify(body)); }
  assert.equal(h.clients.length, 0);
});

test('durable request and payload deduplication suppresses repeated sends across handlers', async t => {
  const h = setup(t);
  assert.equal((await h.call()).code, 201);
  assert.equal((await h.call()).code, 409);
  h.req.body.requestId = 'notification-00000002';
  assert.equal((await h.call()).code, 409);
  assert.equal(h.sends.length, 1);
});

test('uncertain upstream result consumes the claim and never exposes errors or credentials', async t => {
  const h = setup(t);
  t.mock.method(security, 'notificationClient', () => ({ async post() { throw { response: { data: { secret: 'fixture-main-key' } }, config: { headers: { Authorization: 'Key fixture-main-key' } } }; } }));
  const res = await h.call();
  assert.equal(res.code, 503); assert.doesNotMatch(JSON.stringify(res.body), /fixture-main-key|Authorization|secret/);
  assert.equal((await h.call()).code, 409);
});

test('atomic claims bound concurrent worker dispatches and per-user rolling 24 hour allowance', async t => {
  const h = setup(t);
  const requests = Array.from({ length: 16 }, (_, i) => security.parseNotificationRequest({ requestId: `notification-${String(i).padStart(8, '0')}`, notifications: [{ ...h.req.body.notifications[0], title: `Update ${i}` }] }));
  const outcomes = await Promise.all(requests.map(request => security.claimNotificationDispatch(h.claims, h.context, request, 1_000_000).catch(() => 'busy')));
  assert.ok(outcomes.filter(x => x === 'claimed').length <= 10);
  assert.ok(outcomes.some(x => x !== 'claimed'));
  const separate = store();
  for (let i = 0; i < 13; i++) {
    assert.equal(await security.claimNotificationDispatch(separate, h.context, requests[i], 1_000_000 + i * 61_000), i < 12 ? 'claimed' : 'limited');
  }
  assert.equal(await security.claimNotificationDispatch(separate, h.context, requests[12], 100_000_000), 'claimed');
});

test('verified scopes and credential expiry come exclusively from Pi UserDTO', async () => {
  const context = { namespace: 'server-key' };
  assert.equal(security.verifiedNotificationIdentity({ uid: 'u', scopes: ['in_app_notifications'] }, context), null);
  const dto = { uid: 'u', credentials: { scopes: ['username', 'in_app_notifications'], valid_until: { timestamp: Math.floor(Date.now() / 1000) + 1000 } } };
  const identity = security.verifiedNotificationIdentity(dto, context);
  assert.equal(identity.namespace, 'server-key'); assert.ok(identity.scopes.includes('in_app_notifications'));
  assert.equal(security.notificationServerNetwork({ CRYPTOID_APP_NETWORK: 'mainnet' }), 'mainnet');
  assert.equal(security.notificationServerNetwork({ VERCEL: '1', CRYPTOID_APP_NETWORK: 'mainnet' }), null);
  assert.equal(security.notificationServerNetwork({ VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution-testnet.vercel.app' }), 'testnet');
});

test('Testnet notification requests stay on their local backend and never invoke proxy fetch', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('must not proxy'); });
  const gateway = createApiGateway(async () => ({ async start() {}, app(req, res) { calls.push(req); return res.status(401).json({ error: 'not_authenticated' }); } }), () => ({ VERCEL: '1', VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution-testnet.vercel.app' }));
  const req = { method: 'POST', headers: { host: 'cryptoid-evolution-testnet.vercel.app', 'x-cryptoid-app-network': 'mainnet' }, url: '/api/index?path=notifications/send' };
  const res = response(); await gateway(req, res);
  assert.equal(res.code, 401); assert.equal(calls.length, 1); assert.equal(calls[0].notificationNetwork, 'testnet');
  const index = readFileSync(new URL('../index.ts', import.meta.url), 'utf8');
  assert.match(index, /if \(!accessToken \|\| \/\^\\\/notifications/);
});

test('Mainnet notification routing keeps server Mainnet context and cannot stamp Testnet', async () => {
  let received;
  const gateway = createApiGateway(async () => ({ async start() {}, app(req, res) { received = req; return res.status(401).json({ error: 'not_authenticated' }); } }), () => ({ VERCEL: '1', VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution.vercel.app' }));
  const res = response();
  await gateway({ method: 'POST', headers: { 'x-cryptoid-app-network': 'testnet' }, url: '/api/index?path=notifications/send' }, res);
  assert.equal(received.notificationNetwork, 'mainnet');
  assert.equal(received.headers['x-cryptoid-app-network'], 'mainnet');
  assert.equal(res.headers['x-cryptoid-backend'], 'local');
});
