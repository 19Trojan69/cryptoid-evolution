import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer, request } from 'node:http';

const require = createRequire(import.meta.url);
const fixture = process.argv.indexOf('--fixture');

async function runFixture(mode) {
  // Synthetic configuration only; never use a developer's database or account.
  process.env.NODE_ENV = 'production';
  process.env.VERCEL = '1';
  process.env.SESSION_SECRET = 'session-initialization-test-only';
  process.env.MONGODB_URI = 'mongodb://fixture.invalid/session-initialization';
  process.env.MONGODB_DATABASE_NAME = 'session-initialization';
  if (mode === 'isolated') process.env.CRYPTOID_SESSION_COOKIE_NAME = 'cryptoid.testnet.local.sid';
  else delete process.env.CRYPTOID_SESSION_COOKIE_NAME;
  delete process.env.CRYPTOID_TESTNET_BACKEND;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  require('ts-node').register({
    project: fileURLToPath(new URL('../tsconfig.json', import.meta.url)),
    transpileOnly: true,
  });

  const { MongoClient } = require('mongodb');
  const mongoStoreModule = require('connect-mongo');
  const MongoStore = mongoStoreModule.default ?? mongoStoreModule;
  const originalCreate = MongoStore.create;
  const stores = [], connections = [], collections = new Map();
  let failConnection = mode === 'retry';
  const client = {
    db(name) {
      assert.equal(name, 'session-initialization');
      return { collection(collectionName) {
        if (!collections.has(collectionName)) {
          const documents = new Map();
          collections.set(collectionName, {
            async createIndex() { return 'fixture-index'; },
            async findOne(query) { return documents.get(query._id) ?? null; },
            async updateOne(query, update) {
              documents.set(query._id, { _id: query._id, ...documents.get(query._id), ...update.$set });
              return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
            },
            async deleteOne(query) { documents.delete(query._id); return { deletedCount: 1 }; },
          });
        }
        return collections.get(collectionName);
      } };
    },
    async close() {},
  };
  MongoClient.connect = (uri, options) => {
    connections.push({ uri, options });
    if (mode === 'proxy') return new Promise(() => {});
    if (failConnection) {
      failConnection = false;
      return Promise.reject(new Error('synthetic database unavailable'));
    }
    return Promise.resolve(client);
  };
  MongoStore.create = options => {
    stores.push(options);
    return originalCreate.call(MongoStore, options);
  };
  const unhandled = [];
  process.on('unhandledRejection', error => unhandled.push(String(error)));

  // Load the real statically traced Vercel entry, not just a gateway fixture.
  const gateway = require('../../api/index.ts').default;
  assert.equal(stores.length, 0, 'importing the actual API entry must not create a Mongo session store');
  assert.equal(connections.length, 0, 'importing the actual API entry must not connect to MongoDB');

  if (mode === 'proxy') {
    const forwarded = [];
    globalThis.fetch = async (url, init) => {
      forwarded.push({ url: String(url), init });
      const endpoint = new URL(url).pathname;
      if (endpoint === '/api/temporary-failure') throw new Error('synthetic upstream unavailable');
      return new Response(endpoint === '/api/usage/collect' ? null : endpoint === '/api/admin/status' ? '{"error":"not_authenticated"}' : '{"ok":true}', {
        status: endpoint === '/api/admin/status' ? 401 : endpoint === '/api/usage/collect' ? 204 : 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    const response = () => ({
      code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; },
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; return this; },
      send(body) { this.body = body; return this; },
    });
    for (const path of ['hangar/catalog', '', 'user/signin', 'admin/status', 'usage/collect', 'temporary-failure']) {
      const res = response();
      await gateway({
        method: path === 'user/signin' || path === 'usage/collect' ? 'POST' : 'GET',
        url: `/api/index?path=${encodeURIComponent(path)}`,
        headers: { host: 'cryptoid-evolution-testnet.vercel.app', authorization: 'Bearer fixture-token', cookie: 'fixture-cookie', 'x-cryptoid-app-network': 'mainnet' },
        body: {},
      }, res);
      assert.equal(res.code, path === 'admin/status' ? 401 : path === 'usage/collect' ? 204 : path === 'temporary-failure' ? 500 : 200);
    }
    assert.equal(forwarded.length, 5, 'catalog stays local; other routes retain the existing proxy');
    for (const { init } of forwarded) {
      assert.equal(init.headers.get('x-cryptoid-app-network'), 'testnet');
      assert.equal(init.headers.get('authorization'), 'Bearer fixture-token');
      assert.equal(init.headers.get('cookie'), 'fixture-cookie');
    }
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(stores.length, 0, 'proxy success and failure must never initialize sessions locally');
    assert.equal(connections.length, 0, 'proxy success and failure must never connect to MongoDB');
    assert.deepEqual(unhandled, []);
    return { mode, routes: 6, sessionStores: stores.length, mongoConnections: connections.length };
  }

  const { app } = require('./index.ts');
  app.get('/session-initialization-probe', (req, res) => {
    req.session.probeCount = (req.session.probeCount ?? 0) + 1;
    res.json({ count: req.session.probeCount, network: req.headers['x-cryptoid-app-network'] });
  });
  const server = createServer((req, res) => {
    // Vercel supplies these helpers before Express is entered, including when
    // database startup fails before the app can initialize the response.
    res.status = code => { res.statusCode = code; return res; };
    res.json = body => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(body)); return res; };
    void gateway(req, res).catch(error => { unhandled.push(String(error)); res.statusCode = 500; res.end(); });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const get = cookie => new Promise((resolve, reject) => {
    const req = request({
      port: server.address().port, host: '127.0.0.1',
      path: '/api/index?path=session-initialization-probe',
      headers: { host: 'cryptoid-evolution.vercel.app', 'x-forwarded-proto': 'https', ...(cookie ? { cookie } : {}) },
    }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ code: res.statusCode, body, cookies: res.headers['set-cookie'] }));
    });
    req.on('error', reject);
    req.end();
  });
  try {
    if (mode === 'retry') {
      assert.equal((await get()).code, 500);
      assert.equal(stores.length, 0, 'failed database startup must not start a separate session connection');
    }
    const oldProxyCookie = 'connect.sid=synthetic-upstream-session';
    const first = await get(mode === 'isolated' ? oldProxyCookie : undefined);
    assert.equal(first.code, 200);
    assert.equal(JSON.parse(first.body).count, 1);
    const cookie = first.cookies[0];
    assert.ok(cookie.startsWith(mode === 'isolated' ? 'cryptoid.testnet.local.sid=' : 'connect.sid='));
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=Lax/);
    const localCookie = cookie.split(';')[0];
    const second = await get(mode === 'isolated' ? `${oldProxyCookie}; ${localCookie}` : localCookie);
    assert.equal(second.code, 200);
    assert.equal(JSON.parse(second.body).count, 2, 'existing Mongo-backed session must persist across warm requests');
    assert.equal(stores.length, 1, 'warm requests reuse the same session store');
    assert.equal(connections.length, mode === 'retry' ? 3 : 2, 'only the established backend and session connections are created');
    assert.equal(stores[0].collectionName, 'user_sessions');
    assert.equal(stores[0].dbName, 'session-initialization');
    assert.equal(stores[0].mongoUrl, process.env.MONGODB_URI);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(unhandled, []);
    return { mode, sessionStores: stores.length, mongoConnections: connections.length, sessionCount: 2 };
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

if (fixture >= 0) {
  try {
    console.log('RESULT ' + JSON.stringify(await runFixture(process.argv[fixture + 1])));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
} else {
  for (const [mode, name] of [
    ['proxy', 'actual Vercel import and Testnet proxy requests never start MongoDB'],
    ['native', 'native backend retains Mongo sessions, secure cookies and warm reuse'],
    ['isolated', 'local Testnet session coexists with the established proxy cookie and retains its stored state'],
    ['retry', 'native database failure returns a controlled error and retries without an unhandled rejection'],
  ]) {
    test(name, () => {
      const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--fixture', mode], {
        cwd: fileURLToPath(new URL('..', import.meta.url)),
        env: { PATH: process.env.PATH },
        encoding: 'utf8', timeout: 30000,
      });
      assert.equal(child.status, 0, child.stdout + child.stderr);
      assert.match(child.stdout, new RegExp(`RESULT \\{\"mode\":\"${mode}\"`));
    });
  }
}
