import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const require = createRequire(import.meta.url);
const { createApiGateway } = require('../build/apiGateway.js');
const { arcadeLocales } = require('../build/galaxyArcadeCopy.js');
const { publicArcadeCatalog, publicArcadeTicket } = require('../build/galaxyArcade.js');
const { hangarCatalog } = require('../build/hangarCatalog.js');
const ts = require('typescript');

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

test('the official Testnet Arcade serves localized public stations with a distinct rating route', async () => {
  const env = {
    VERCEL_ENV: 'production',
    VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution-testnet.vercel.app',
    CRYPTOID_TESTNET_GALAXY_ARCADE: '1',
    CRYPTOID_GALAXY_ARCADE_KEY: 'ac'.repeat(32),
  };
  const { calls, backend } = backendFixture();
  const gateway = createApiGateway(async () => backend, () => env);
  const check = async (path, { locale = 'en', method = 'GET', body, headers = {} } = {}) => {
    const res = response();
    await gateway({ method, body, url: '/api/index?' + new URLSearchParams({ path, lang: locale }), headers }, res);
    return res;
  };
  const base = 'galaxy-minigames';
  assert.equal(arcadeLocales.length, 19);
  for (const locale of arcadeLocales) {
    const { code, body } = await check(base, { locale });
    assert.equal(code, 200);
    assert.deepEqual(body.levels, Array.from({ length: 40 }, (_, i) => (i + 1) * 5));
    assert.equal(body.owner, null);
    assert.deepEqual(body.stations, []);
    assert.ok(Object.values(body.labels).every(Boolean));
    const unlocked = publicArcadeCatalog(locale, 'pilot', 200);
    assert.equal(new Set(unlocked.labels.stickers.ranks).size, 6);
    assert.ok(Object.values(unlocked.labels.stickers).every(Boolean));
    assert.equal(new Set(unlocked.stations.map(station => station.name)).size, 40);
    for (const [index, station] of unlocked.stations.entries()) {
      assert.equal(station.level, (index + 1) * 5);
      assert.ok(station.description && station.scoring && station.medalLabel && station.rulesVersion);
      assert.equal(station.medalGoals.length, 6);
      assert.ok(station.medalGoals.every((goal, tier, goals) => Number.isInteger(goal) && goal > (goals[tier - 1] ?? 0)));
    }
  }
  assert.notEqual(publicArcadeCatalog('th', 'pilot', 40).stations[7].description, publicArcadeCatalog('de', 'pilot', 40).stations[7].description);
  assert.deepEqual((await check(base, { locale: 'zh-Hans' })).body, (await check(base, { locale: 'zh' })).body);
  assert.equal((await check(base + '/5/launch', { method: 'POST' })).code, 401);
  assert.equal((await check(base + '/5/launch')).code, 405);
  assert.equal((await check(base + '/5/play')).code, 403);
  assert.equal((await check(base + '/5/document')).code, 403);
  assert.equal((await check(base + '/5/standalone')).code, 403);
  const launch = { method: 'POST', body: { ticket: publicArcadeTicket(env.CRYPTOID_GALAXY_ARCADE_KEY, '5') } };
  assert.equal((await check(base + '/10/standalone', launch)).code, 403);
  assert.equal((await check(base + '/5/standalone', { body: launch.body })).code, 403);
  const playUnavailable = await check(base + '/5/play', launch);
  assert.equal(playUnavailable.code, 503); // The fixture key does not decrypt the released assets.
  assert.match(playUnavailable.headers['Content-Security-Policy'], /sandbox allow-scripts;.*frame-ancestors 'self' https:\/\/cryptoidevo3025\.pinet\.com$/);
  assert.equal(playUnavailable.headers['X-Frame-Options'], undefined);
  assert.match(playUnavailable.body, /postMessage\(\{ type: 'cryptoid:arcade-error'/);
  const documentUnavailable = await check(base + '/5/document', launch);
  assert.equal(documentUnavailable.code, 503);
  assert.deepEqual(documentUnavailable.body, { error: 'arcade_unavailable' });
  assert.equal((await check(base + '/205/document')).code, 404);
  const standaloneUnavailable = await check(base + '/5/standalone', launch);
  assert.equal(standaloneUnavailable.code, 503);
  assert.equal(standaloneUnavailable.headers['Content-Type'], 'text/html; charset=utf-8');
  assert.match(standaloneUnavailable.headers['Content-Security-Policy'], /^default-src 'none'; script-src 'nonce-[A-Za-z0-9+/]{22}=='/);
  assert.doesNotMatch(standaloneUnavailable.headers['Content-Security-Policy'], /sandbox|frame-ancestors/);
  assert.match(standaloneUnavailable.body, /href="\/galaxy\?arcade-return=1"/);
  assert.match(standaloneUnavailable.body, /role="alert">[^<]*AR-02/);
  assert.equal((await check(base + '/205/standalone')).code, 404);
  assert.equal((await check(base + '/205/rating')).code, 404);
  assert.equal(calls.length, 0);
  const headers = { authorization: 'Bearer pilot' };
  assert.equal((await check(base, { headers })).code, 200);
  assert.equal(calls.at(-1).network, 'testnet');
  assert.equal((await check(base + '/5/launch', { method: 'POST', headers })).code, 200);
  assert.equal(calls.at(-1).url, '/galaxy-minigames/5/launch?lang=en');
  assert.equal((await check(base + '/5/rating')).code, 200);
  assert.equal(calls.at(-1).network, 'testnet');
  env.VERCEL_ENV = 'preview';
  assert.equal((await check(base)).code, 404);
  assert.equal((await check(base + '/5/standalone')).code, 404);
  env.VERCEL_ENV = 'production';
  env.VERCEL_PROJECT_PRODUCTION_URL = 'cryptoid-evolution.vercel.app';
  assert.equal((await check(base)).code, 404);
  assert.equal((await check(base + '/5/document')).code, 404);
  assert.equal((await check(base + '/5/standalone')).code, 404);
});

test('Galaxy Arcade is isolated to the enabled Testnet preview and requires a verified Pi owner', async t => {
  const key = 'ab'.repeat(32);
  const env = { VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution-testnet.vercel.app', CRYPTOID_GALAXY_ARCADE_KEY: key };
  const ownerChecks = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(String(url), 'https://cryptoid-evolution.vercel.app/api/user/me');
    assert.deepEqual(Object.keys(options.headers).sort(), ['authorization', 'x-cryptoid-app-network']);
    assert.equal(options.headers['x-cryptoid-app-network'], 'testnet');
    const token = options.headers.authorization;
    ownerChecks.push(token);
    return Response.json({ user: { uid: token }, canAdmin: token === 'Bearer owner' });
  });
  const check = async (environment, path, { token, method = 'GET' } = {}) => {
    const gateway = createApiGateway(async () => { throw new Error('Arcade must not start a local database'); }, () => environment);
    const res = response();
    await gateway({ method, url: `/api/index?path=${encodeURIComponent(path)}`, headers: {
      host: 'preview.vercel.app', 'x-cryptoid-admin-test': '1', cookie: 'connect.sid=stale', ...(token ? { authorization: `Bearer ${token}` } : {}),
    } }, res);
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
    return res;
  };
  const route = 'admin/galaxy-minigames';
  assert.equal((await check({ ...env, VERCEL_ENV: 'production' }, `${route}/5`, { token: 'owner' })).code, 404);
  assert.equal((await check({ ...env, VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution.vercel.app' }, route, { token: 'owner' })).code, 404);
  assert.equal((await check({ ...env, CRYPTOID_GALAXY_ARCADE_KEY: undefined }, route, { token: 'owner' })).code, 404);
  assert.equal((await check(env, `${route}/5`)).code, 401);
  assert.equal((await check(env, route, { method: 'POST', token: 'owner' })).code, 405);
  assert.deepEqual(ownerChecks, []);
  assert.equal((await check(env, `${route}/5`, { token: 'other' })).code, 403);
  const allowed = await check(env, route, { token: 'owner' });
  assert.equal(allowed.code, 200);
  assert.deepEqual(allowed.body.stations.map(station => station.level), Array.from({ length: 40 }, (_, i) => (i + 1) * 5));
  assert.equal((await check(env, `${route}/205`, { token: 'owner' })).code, 404);
  assert.deepEqual(ownerChecks, ['Bearer other', 'Bearer owner', 'Bearer owner']);
});

test('a personal Galaxy test code grants only an expiring, server-signed preview session', async t => {
  const code = '0123456789ABCDEF01234567';
  const digest = createHash('sha256').update(code).digest('hex');
  const key = 'ad'.repeat(32);
  const env = { VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution-testnet.vercel.app', CRYPTOID_GALAXY_ARCADE_KEY: key, CRYPTOID_GALAXY_ARCADE_INVITATION: `${digest}:${Date.now() + 60_000}` };
  t.mock.method(globalThis, 'fetch', async () => { throw Error('An arcade invitation must not contact Pi'); });
  const check = async (path, headers = {}, method = 'GET', environment = env) => {
    const gateway = createApiGateway(async () => { throw Error('An arcade invitation must not start a database'); }, () => environment);
    const res = response();
    await gateway({ url: `/api/index?path=${encodeURIComponent(path)}`, method, headers: { host: 'preview.vercel.app', ...headers } }, res);
    return res;
  };
  const manifest = 'admin/galaxy-minigames', unlock = `${manifest}/access`;
  const invited = { 'x-cryptoid-arcade-invitation': code.toLowerCase().match(/.{4}/g).join('-') };
  const denied = await check(manifest);
  assert.equal(denied.code, 401);
  assert.equal(denied.body.previewAccess, true);
  assert.deepEqual(denied.body.previewLevels, Array.from({ length: 40 }, (_, index) => (index + 1) * 5));
  assert.equal(denied.body.stations, undefined);
  assert.equal((await check(`${manifest}/5`, invited)).code, 401);
  assert.equal((await check(unlock, invited)).code, 405);
  assert.equal((await check(unlock, { 'x-cryptoid-arcade-invitation': 'F'.repeat(24) }, 'POST')).code, 403);

  const accepted = await check(unlock, invited, 'POST');
  assert.equal(accepted.code, 200);
  assert.equal(accepted.body.stations.length, 40);
  assert.equal(accepted.headers['Cache-Control'], 'private, no-store');
  const setCookie = accepted.headers['Set-Cookie'];
  assert.match(setCookie, /^__Secure-cryptoid-arcade=[0-9a-f]{64}; Max-Age=[1-9]\d?; Path=\/api\/admin\/galaxy-minigames; HttpOnly; Secure; SameSite=Strict$/);
  const [cookie] = setCookie.split(';');
  assert.ok(!setCookie.includes(code));
  assert.equal((await check(manifest, { cookie })).body.stations.length, 40);
  assert.equal((await check(manifest, { cookie: `${cookie.slice(0, -1)}x` })).code, 401);
  assert.equal((await check(unlock, invited, 'POST', { ...env, VERCEL_ENV: 'production' })).code, 404);
  assert.equal((await check(manifest, { cookie }, 'GET', { ...env, CRYPTOID_GALAXY_ARCADE_INVITATION: `${digest}:${Date.now() - 1000}` })).code, 401);
});

test('a Galaxy play page needs a verified launch or test session and stays isolated', async t => {
  const env = { VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution-testnet.vercel.app', CRYPTOID_GALAXY_ARCADE_KEY: 'ab'.repeat(32) };
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const token = options.headers.authorization;
    calls.push(token);
    return Response.json({ user: { uid: token }, canAdmin: token === 'Bearer owner' });
  });
  const gateway = createApiGateway(async () => { throw Error('Arcade must not use the local database'); }, () => env);
  const check = async (path, method = 'GET', headers = {}) => {
    const res = response();
    await gateway({ url: `/api/index?path=${encodeURIComponent(`admin/galaxy-minigames/${path}`)}`, method, headers: { host: 'preview.vercel.app', ...headers } }, res);
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
    return res;
  };
  const blocked = await check('5/play');
  assert.equal(blocked.code, 401);
  assert.match(blocked.body, /Galaxiekarte/);
  assert.equal(blocked.headers['Content-Type'], 'text/html; charset=utf-8');
  assert.match(blocked.headers['Content-Security-Policy'], /sandbox allow-scripts.*frame-ancestors 'none'/);
  assert.equal(blocked.headers['X-Frame-Options'], 'DENY');
  assert.equal((await check('5/launch')).code, 405);
  assert.equal((await check('5/launch', 'POST')).code, 401);
  assert.equal((await check('5/launch', 'POST', { authorization: 'Bearer other' })).code, 403);

  const launch = await check('5/launch', 'POST', { authorization: 'Bearer owner' });
  assert.equal(launch.code, 204);
  const setCookie = launch.headers['Set-Cookie'];
  assert.match(setCookie, /^__Secure-cryptoid-arcade-play=\d{13}\.[0-9a-f]{64}; Max-Age=120; Path=\/api\/admin\/galaxy-minigames\/5\/play; HttpOnly; Secure; SameSite=Strict$/);
  const [cookie] = setCookie.split(';');
  // The fixture key accepts the launch but cannot decrypt the sealed real arcade.
  const unavailable = await check('5/play', 'GET', { cookie });
  assert.equal(unavailable.code, 503);
  assert.match(unavailable.body, /Minispiel ist gerade nicht verfügbar/);
  assert.equal((await check('10/play', 'GET', { cookie })).code, 401);
  const expires = Number(cookie.split('=')[1].split('.')[0]);
  t.mock.method(Date, 'now', () => expires);
  assert.equal((await check('5/play', 'GET', { cookie })).code, 401);
  assert.deepEqual(calls, ['Bearer other', 'Bearer owner']);
});

test('real Vercel entry forwards the deletion guard without blocking an active Testnet login', async t => {
  const keys = ['VERCEL_ENV', 'VERCEL_PROJECT_PRODUCTION_URL', 'CRYPTOID_TESTNET_ACCOUNT_DELETION'];
  const previous = keys.map(key => process.env[key]);
  Object.assign(process.env, {
    VERCEL_ENV: 'production',
    VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution-testnet.vercel.app',
    CRYPTOID_TESTNET_ACCOUNT_DELETION: 'enabled',
  });
  t.after(() => keys.forEach((key, index) => {
    if (previous[index] === undefined) delete process.env[key];
    else process.env[key] = previous[index];
  }));
  let forwarded = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    forwarded++;
    return Response.json({ ok: true });
  });
  const { backend, calls } = backendFixture();
  backend.proxyAccountAllowed = async req => req.headers.authorization !== 'Bearer deleted';
  const entrySource = readFileSync(new URL('../../api/index.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(entrySource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, { exports, require(moduleName) {
    if (moduleName === '../backend/src/apiGateway') return { createApiGateway };
    if (moduleName === '../backend/src/index') return backend;
    throw Error(`Unexpected entry dependency: ${moduleName}`);
  } });
  for (const [token, expected] of [['fresh', 200], ['deleted', 410]]) {
    const res = response();
    await exports.default({ method: 'GET', url: '/api/index?path=progress/me',
      headers: { host: 'cryptoid-evolution-testnet.vercel.app', authorization: `Bearer ${token}` } }, res);
    assert.equal(res.code, expected);
  }
  assert.equal(forwarded, 1);
  assert.equal(calls.filter(call => 'start' in call).length, 1);
});

test('Testnet serves its own public catalog without the production proxy or database startup', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('catalog must not use production'); });
  for (const [host, env] of [
    ['cryptoid-evolution-testnet.vercel.app', { VERCEL_ENV: 'preview' }],
    ['preview.vercel.app', { VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'cryptoid-evolution-testnet.vercel.app' }],
    ['preview.vercel.app', preview],
  ]) {
    const gateway = createApiGateway(async () => { throw new Error('catalog must not start the database'); }, () => env);
    for (const method of ['GET', 'HEAD']) {
      const res = response();
      await gateway({ method, url: '/api/index?path=hangar%2Fcatalog', headers: { host } }, res);
      assert.equal(res.code, 200);
      assert.deepEqual(res.body, { offers: hangarCatalog });
      assert.equal(res.headers['x-cryptoid-backend'], 'testnet-catalog');
      assert.equal(res.headers['Cache-Control'], 'no-store');
    }
  }
});

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
    return new Response('{"network":"testnet"}', { status: 201, headers: { 'content-type': 'application/json', 'set-cookie': 'connect.sid=test; HttpOnly', 'x-vercel-id': 'fra1::upstream-123' } });
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
  assert.equal(res.headers['x-cryptoid-upstream-request-id'], 'fra1::upstream-123');
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

const publicTranslationEnv = {VERCEL_ENV:'production',VERCEL_PROJECT_PRODUCTION_URL:'cryptoid-evolution-testnet.vercel.app'};
const translationId = 'a'.repeat(32), replyId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const translationRequest = query => ({method:'GET',url:`/api/index?path=feedback/posts/${translationId}/translation&${query}`,headers:{host:'cryptoid-evolution-testnet.vercel.app',authorization:'Bearer private-token',cookie:'private-session','x-cryptoid-app-network':'mainnet'}});
test('Testnet translation gateway validates language, reference and public-list context before fetching', async t => {
  t.mock.method(globalThis,'fetch',async()=>{throw Error('must not fetch');});
  const gateway=createApiGateway(async()=>{throw Error('must not start database');},()=>publicTranslationEnv);
  for(const query of ['locale=xx','locale=de&reply=invalid','locale=de&category=private','locale=de&page=0','locale=de&page=1.5','locale=de&sort=bogus']) {
    const res=response();await gateway(translationRequest(query),res);assert.equal(res.code,400);
  }
});
test('Testnet translation gateway reads public Testnet posts without credentials and translates posts/replies', async t => {
  let reads=0, translations=0;
  t.mock.method(globalThis,'fetch',async(url,init)=>{
    if(String(url).startsWith('https://cryptoid-evolution.vercel.app/api/feedback/posts')) {
      reads++;
      assert.equal(new Headers(init.headers).get('authorization'),null);
      assert.equal(new Headers(init.headers).get('cookie'),null);
      assert.equal(new Headers(init.headers).get('x-cryptoid-app-network'),'testnet');
      assert.equal(new URL(url).searchParams.get('hidden'),'0');
      assert.equal(new URL(url).searchParams.get('category'),'problem');
      assert.equal(new URL(url).searchParams.get('sort'),'support');
      assert.equal(new URL(url).searchParams.get('page'),'2');
      return Response.json({network:'testnet',posts:[{id:translationId,hidden:false,title:'Gateway public translation test',description:'A unique public gateway description to translate.',replies:[{id:replyId,text:'A unique gateway developer reply.'}]}]});
    }
    assert.equal(new URL(url).hostname,'api.mymemory.translated.net');
    assert.equal(new Headers(init.headers).get('authorization'),null);
    translations++;
    return Response.json({responseStatus:200,responseData:{translatedText:'Übersetzung: '+new URL(url).searchParams.get('q')}});
  });
  const gateway=createApiGateway(async()=>{throw Error('must not start database');},()=>publicTranslationEnv);
  const query='locale=de-AT&category=problem&page=2&sort=support';
  const post=response();await gateway(translationRequest(query),post);
  assert.equal(post.code,200);assert.equal(post.headers['x-cryptoid-backend'],'testnet-translation');
  assert.equal(post.body.locale,'de');assert.equal(post.body.fields.length,2);assert.equal(translations,2);
  const cached=response();await gateway(translationRequest(query),cached);
  assert.deepEqual(cached.body,post.body);assert.equal(translations,2);
  const reply=response();await gateway(translationRequest(query+'&reply='+replyId),reply);
  assert.equal(reply.body.fields.length,1);assert.equal(translations,3);assert.equal(reads,3);
});
test('Testnet translation gateway excludes hidden and Mainnet posts and handles upstream failures', async t => {
  let data;
  t.mock.method(globalThis,'fetch',async()=>data instanceof Error?Promise.reject(data):Response.json(data));
  const gateway=createApiGateway(async()=>{throw Error('must not start database');},()=>publicTranslationEnv);
  for(const value of [{network:'testnet',posts:[]},{network:'testnet',posts:[{id:translationId,hidden:true}]},{network:'mainnet',posts:[{id:translationId,hidden:false}]}]) {
    data=value;const res=response();await gateway(translationRequest('locale=de'),res);assert.equal(res.code,404);
  }
  data=Error('upstream offline');const res=response();await gateway(translationRequest('locale=de'),res);assert.equal(res.code,503);
});
test('Mainnet and opted-in local Testnet keep the native translation handler', async () => {
  for(const env of [{VERCEL_ENV:'production'},preview]) {
    const {backend,calls}=backendFixture(), gateway=createApiGateway(async()=>backend,()=>env);
    const req=translationRequest('locale=de');req.headers.host='cryptoid-evolution.vercel.app';
    const res=response();await gateway(req,res);assert.equal(res.code,200);
    assert.equal(calls.at(-1).url,`/feedback/posts/${translationId}/translation?locale=de`);
  }
});


test('official Testnet keeps legacy cookie-only progress writes on the existing proxy', async t => {
  const proxied=[];
  t.mock.method(globalThis,'fetch',async url=>{proxied.push(String(url));return Response.json({});});
  const {backend,calls}=backendFixture();
  const gateway=createApiGateway(async()=>backend,()=>({VERCEL_ENV:'production',VERCEL_PROJECT_PRODUCTION_URL:'cryptoid-evolution-testnet.vercel.app'}));
  for(const path of ['progress/boss-summary/prepare','progress/boss-summary/continue','admin/players/find','admin/players/prepare','admin/players/execute']) {
    const res=response();await gateway({method:'POST',url:`/api/index?path=${path}`,body:{},headers:{host:'cryptoid-evolution-testnet.vercel.app','x-cryptoid-app-network':'mainnet'}},res);
    assert.equal(res.headers['x-cryptoid-backend'],'testnet-local'); assert.equal(calls.at(-1).network,'testnet');
  }
  assert.equal(calls.filter(c=>'start' in c).length,1);
  for(const path of ['progress/me','progress/checkpoint','hangar/start','hangar/weapon/activate','rewards/event','admin/status','payments/approve','admin/players-extra/find','progress/boss-summary/arbitrary']) {
    const res=response();await gateway({method:'POST',url:`/api/index?path=${path}`,body:{},headers:{host:'cryptoid-evolution-testnet.vercel.app'}},res);
    assert.equal(res.headers['x-cryptoid-backend'],'production-proxy');
  }
  assert.equal(proxied.length,9);
});

test('verified-session save routes are local only on the Testnet project', async t => {
  const forwarded = [];
  t.mock.method(globalThis, 'fetch', async url => { forwarded.push(String(url)); return Response.json({}); });
  const { backend, calls } = backendFixture();
  const testnet = 'cryptoid-evolution-testnet.vercel.app';
  const mainnet = 'cryptoid-evolution.vercel.app';
  const gateway = host => createApiGateway(async () => backend, () => ({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: host }));
  const call = async (handle, host, path) => {
    const req = { method: 'POST', url: '/api/index?path=' + path, body: {},
      headers: { host, authorization: 'Bearer test-token', 'x-cryptoid-app-network': 'mainnet' } };
    const res = response();
    await handle(req, res);
    return { req, res };
  };
  const testnetGateway = gateway(testnet);
  for (const path of ['rewards/event', 'progress/checkpoint', 'leaderboard/score']) {
    const { req, res } = await call(testnetGateway, testnet, path);
    assert.equal(res.headers['x-cryptoid-backend'], 'testnet-local');
    assert.equal(req.testnetSave, true);
    assert.equal(calls.at(-1).network, 'testnet');
  }
  assert.equal(forwarded.length, 0);
  const payment = await call(testnetGateway, testnet, 'payments/approve');
  assert.equal(payment.res.headers['x-cryptoid-backend'], 'production-proxy');
  assert.equal(payment.req.testnetSave, undefined);
  const mainnetSave = await call(gateway(mainnet), mainnet, 'rewards/event');
  assert.equal(mainnetSave.res.headers['x-cryptoid-backend'], 'local');
  assert.equal(mainnetSave.req.testnetSave, undefined);
  assert.equal(calls.at(-1).network, 'mainnet');
});

test('mission power requests use the verified local Testnet session and never the payment proxy', async t => {
  const { backend, calls } = backendFixture();
  const testnet = 'cryptoid-evolution-testnet.vercel.app';
  const mainnet = 'cryptoid-evolution.vercel.app';
  const handle = createApiGateway(async () => backend, () => ({ VERCEL_ENV: 'production' }));
  const forwarded = t.mock.method(globalThis, 'fetch', async () => Response.json({}));
  for (const [method, path] of [['GET', 'hangar/power'], ['POST', 'hangar/power/activate']]) {
    for (const [host, authorization, expected] of [[testnet, 'Bearer fixture', 200], [testnet, undefined, 401], [mainnet, 'Bearer fixture', 404]]) {
      const res = response();
      const req = { method, url: '/api/index?path=' + path, headers: { host, authorization } };
      await handle(req, res);
      assert.equal(res.code, expected);
      if (expected === 200) {
        assert.equal(req.testnetSave, true);
        assert.equal(res.headers['x-cryptoid-backend'], 'testnet-local');
        assert.equal(calls.at(-1).network, 'testnet');
      }
    }
  }
  assert.equal(forwarded.mock.callCount(), 0);
});

test('enabled account deletion blocks previous tokens before proxying and keeps Mainnet outside this guard', async t=>{
 const prior=process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION;process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION='enabled';t.after(()=>{if(prior===undefined)delete process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION;else process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION=prior;});
 let forwarded=0,checked=0;t.mock.method(globalThis,'fetch',async()=>{forwarded++;return Response.json({});});
 const {backend,calls}=backendFixture();backend.proxyAccountAllowed=async req=>{checked++;return req.headers.authorization!=='Bearer deleted'&&req.body?.authResult?.accessToken!=='deleted';};
 const gateway=createApiGateway(async()=>backend,()=>({VERCEL_ENV:'production',VERCEL_PROJECT_PRODUCTION_URL:'cryptoid-evolution-testnet.vercel.app'}));
 for(const [path,authorization,body,expected]of [['hangar/start','Bearer deleted',{},410],['user/signin',undefined,{authResult:{accessToken:'deleted'}},410],['user/signin','Bearer new',{authResult:{accessToken:'deleted'}},410],['progress/me','Bearer fresh',{},200]]){
  const res=response();await gateway({method:'POST',url:`/api/index?path=${path}`,headers:{host:'cryptoid-evolution-testnet.vercel.app',authorization},body},res);assert.equal(res.code,expected);
 }
 assert.equal(checked,4);assert.equal(forwarded,1);assert.equal(calls.filter(c=>'start'in c).length,1);
 const main=createApiGateway(async()=>backend,()=>({VERCEL_ENV:'production'}));await main({url:'/api/index?path=progress/me',headers:{host:'cryptoid-evolution.vercel.app',authorization:'Bearer deleted'}},response());assert.equal(checked,4);
});
