import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const platform = require('../../build/services/platformAPIClient.js').default;
const mount = require('../../build/handlers/users.js').default;

for (const stage of ['pi', 'storage']) test(`failed ${stage} sign-in exposes no token/provider/database details`, async t => {
  const secret = 'simulated-private-token-and-db-connection';
  const error = Object.assign(new Error(secret), { config: { headers: { Authorization: `Bearer ${secret}` } }, response: { data: secret } });
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args));
  t.mock.method(platform, 'get', async () => { if (stage === 'pi') throw error; return { data: { uid: 'verified-pilot', username: 'pilot' } }; });
  const routes = {};
  mount({ get() {}, post(path, fn) { routes[path] = fn; } });
  const req = { body: { authResult: { accessToken: secret } }, headers: {}, session: {},
    app: { locals: { userCollection: { async findOne() { throw error; } } } } };
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await routes['/signin'](req, res);
  assert.equal(res.code, stage === 'pi' ? 401 : 500);
  assert.equal(req.session.currentUser, undefined);
  assert.equal(logs.length, 1);
  assert.doesNotMatch(JSON.stringify({ logs, response: res.body }), /simulated-private-token|db-connection|Authorization/);
});
