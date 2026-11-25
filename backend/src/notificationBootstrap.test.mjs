import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer, request } from 'node:http';
const require = createRequire(import.meta.url);

test('real Express authentication and notification routing reject unauthorized requests before every Pi client', async t => {
  const envKeys = ['VERCEL','VERCEL_PROJECT_PRODUCTION_URL','CRYPTOID_APP_NETWORK','PI_MAINNET_API_KEY','ADMIN_PI_UID','CRYPTOID_NOTIFICATIONS_ENABLED'];
  const saved = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  Object.assign(process.env, { VERCEL: '1', VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution.vercel.app', PI_MAINNET_API_KEY: 'notification-bootstrap-fixture', ADMIN_PI_UID: 'verified-owner', CRYPTOID_NOTIFICATIONS_ENABLED: '1' });
  t.after(() => { for (const [key, value] of Object.entries(saved)) value === undefined ? delete process.env[key] : process.env[key] = value; });
  const session = require('express-session');
  const mongoModule = require('connect-mongo');
  const MongoStore = mongoModule.default ?? mongoModule;
  t.mock.method(MongoStore, 'create', () => new session.MemoryStore());
  const platform = require('../build/services/platformAPIClient.js').default;
  const security = require('../build/notificationSecurity.js');
  let outbound = 0;
  t.mock.method(platform, 'get', async () => { outbound++; throw new Error('unexpected external authentication'); });
  t.mock.method(security, 'notificationClient', () => { outbound++; throw new Error('unexpected external dispatch'); });
  // VERCEL=1 prevents standalone auto-start; all collections and sessions here
  // are explicit in-memory fixtures. No database, Pi or other network is used.
  const { app } = require('../build/index.js');
  app.locals.adminCollection = { async findOne() { return null; } };
  app.locals.userCollection = { async findOne() { return null; } };
  app.get('/notification-login-fixture/:kind', (req, res) => {
    const owner = req.params.kind !== 'regular';
    const uid = owner ? 'verified-owner' : 'ordinary-pilot';
    const context = security.notificationContext(req);
    req.session.currentUser = {
      uid, username: owner ? '19Trojan69' : 'ordinary', roles: ['admin'], accessToken: `verified-${uid}`,
      notificationAuthByNetwork: { mainnet: { uid, namespace: context.namespace, scopes: ['username'], validUntil: req.params.kind === 'expired' ? 1 : Date.now() + 60_000 } },
    };
    res.json({ ok: true });
  });
  const server = createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const send = (path, { cookie, bearer, body } = {}) => new Promise((resolve, reject) => {
    const input = body === undefined ? undefined : JSON.stringify(body);
    const call = request({ host: '127.0.0.1', port: server.address().port, path,
      method: input === undefined ? 'GET' : 'POST',
      headers: { 'x-forwarded-proto': 'https', 'x-cryptoid-app-network': 'testnet',
        ...(cookie ? { cookie } : {}), ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
        ...(input ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(input) } : {}),
      },
    }, res => {
      let text = ''; res.on('data', chunk => text += chunk); res.on('end', () => resolve({ code: res.statusCode, body: JSON.parse(text), cookie: res.headers['set-cookie']?.[0]?.split(';')[0] }));
    });
    call.on('error', reject); call.end(input);
  });
  for (const bearer of [undefined, 'invented-token']) {
    assert.equal((await send('/notifications/send', { body: {}, bearer })).code, 401);
  }
  const regular = await send('/notification-login-fixture/regular');
  assert.equal((await send('/notifications/send', { body: { admin: true }, cookie: regular.cookie })).code, 403);
  const expired = await send('/notification-login-fixture/expired');
  assert.equal((await send('/notifications/send', { body: {}, cookie: expired.cookie })).code, 401);
  const owner = await send('/notification-login-fixture/owner');
  assert.equal((await send('/notifications/send', { body: {}, cookie: owner.cookie, bearer: 'another-account-token' })).code, 401);
  assert.equal((await send('/notifications/send', { body: {}, cookie: owner.cookie })).code, 401, 'a mismatched account token invalidates the old cookie identity');
  const freshOwner = await send('/notification-login-fixture/owner');
  assert.equal((await send('/notifications/send', { body: {}, cookie: freshOwner.cookie })).code, 400);
  assert.equal(outbound, 0, 'neither /me nor notification transport may run for these rejected requests');
});
