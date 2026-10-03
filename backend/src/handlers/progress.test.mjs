import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { emptyPlayerSave, readSnapshot, legacyInventory } = require('../../build/playerSave.js');
const get = (o, path) => path.split('.').reduce((v, k) => v?.[k], o);
const set = (o, path, value) => { const keys = path.split('.'); const last = keys.pop(); for (const k of keys) o = o[k] ??= {}; o[last] = structuredClone(value); };
const matches = (doc, query) => Object.entries(query).every(([path, expected]) => {
  const actual = get(doc, path);
  if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
    if ('$exists' in expected) return (actual !== undefined) === expected.$exists;
    if ('$ne' in expected) return Array.isArray(actual) ? !actual.includes(expected.$ne) : actual !== expected.$ne;
    if ('$in' in expected) return expected.$in.includes(actual);
  }
  return expected === null ? actual == null : actual === expected;
});
function collection(docs) {
  const apply = (doc, update) => {
    for (const [path, value] of Object.entries(update.$set || {})) set(doc, path, value);
    for (const [path, value] of Object.entries(update.$inc || {})) set(doc, path, (get(doc, path) || 0) + value);
    for (const [path, value] of Object.entries(update.$max || {})) set(doc, path, Math.max(get(doc, path) || 0, value));
    for (const [path, value] of Object.entries(update.$addToSet || {})) set(doc, path, [...new Set([...(get(doc, path) || []), ...(value.$each || [value])])]);
  };
  return {
    async findOne(query) { return structuredClone(docs.find(doc => matches(doc, query)) || null); },
    async updateOne(query, update) { const doc = docs.find(doc => matches(doc, query)); if (!doc) return { matchedCount: 0, modifiedCount: 0 }; apply(doc, update); return { matchedCount: 1, modifiedCount: 1 }; },
    async findOneAndUpdate(query, update) { const doc = docs.find(doc => matches(doc, query)); if (!doc) return null; const before = structuredClone(doc); apply(doc, update); return before; },
    find(query) { return { project() { return this; }, async toArray() { return structuredClone(docs.filter(doc => matches(doc, query))); } }; },
  };
}
function harness() {
  const docs = [{ uid: 'pilot-a' }, { uid: 'pilot-b' }], orders = [];
  const locals = { userCollection: collection(docs), orderCollection: collection(orders) };
  const session = { currentUser: { uid: 'pilot-a' }, adminMode: false };
  const routes = {}, middleware = {};
  for (const name of ['progress', 'hangar', 'rewards', 'leaderboard']) {
    middleware[name] = [];
    require(`../../build/handlers/${name}.js`).default({ use: handler => middleware[name].push(handler), get: (path, handler) => routes[`GET ${name}${path}`] = handler, post: (path, handler) => routes[`POST ${name}${path}`] = handler });
  }
  async function call(name, path, body, options = {}) {
    const req = { body, session: options.session || session, headers: { 'x-cryptoid-app-network': options.network || 'testnet' }, get: () => options.network || 'testnet', app: { locals } };
    let resolve;
    const done = new Promise(r => { resolve = r; });
    const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; resolve(this); return this; } };
    for (const mw of middleware[name]) { let next = false; mw(req, res, () => { next = true; }); if (!next) return done; }
    await routes[`${options.method || 'POST'} ${name}${path}`](req, res);
    return done;
  }
  return { docs, orders, session, call, profile: () => docs[0].playerByNetwork.testnet };
}
const snapshot = (overrides = {}) => ({ score: 0, shards: 0, destroyed: 0, hearts: 3, weaponSource: 'standard', paidWeaponLevel: 1, paidWeaponMs: 0, pickupWeaponLevel: 1, pickupWeaponMs: 0, weaponTimers: [0, -1, 0, 0, 0, 0], shieldCharges: 0, shieldMs: 0, purchasedShieldMs: 0, shieldActive: false, overdriveMs: 0, overdriveTotalMs: 20000, rapidFireMs: 0, rapidFireTotalMs: 20000, empMs: 0, ...overrides });
const start = async (h, action = 'new', startKey = 'start-key-0000000001') => {
  const result = await h.call('hangar', '/start', { action, version: h.profile().version, startKey });
  // Simulate time spent playing without making the test sleep.
  if (result.code === 200) h.session.scoreRun.startedAt -= 10_000;
  return result;
};
const init = h => h.call('progress', '/me', null, { method: 'GET' });

test('cookie-less save requests restore only the authenticated active run and remain idempotent', async () => {
  const h = harness(); await init(h); await start(h);
  const runId = h.session.scoreRun.id;
  h.profile().lastStart.runMeta.startedAt = h.session.scoreRun.startedAt;
  const body = { runId, kind: 'block', level: 1, stage: 1, save: snapshot({ score: 90, shards: 9, destroyed: 9 }) };
  const fresh = () => ({ currentUser: { uid: 'pilot-a' }, adminMode: false });
  assert.equal((await h.call('rewards', '/event', body, { session: fresh() })).code, 200);
  assert.equal((await h.call('rewards', '/event', body, { session: fresh() })).code, 200);
  assert.equal(h.profile().balance, 9);
  assert.equal((await h.call('rewards', '/event', body, { session: { currentUser: { uid: 'pilot-b' } } })).code, 403);
  assert.equal((await h.call('rewards', '/event', body, { session: fresh(), network: 'mainnet' })).code, 403);
  h.profile().lastStart.runMeta.startedAt = Date.now() - 9 * 60 * 60 * 1000;
  assert.equal((await h.call('rewards', '/event', body, { session: fresh() })).code, 403);
  h.profile().lastStart.runMeta.startedAt = Date.now() - 10_000;
  const final = { runId, score: 100, finished: true, save: snapshot({ score: 100, shards: 10, destroyed: 10 }) };
  assert.equal((await h.call('leaderboard', '/score', final, { session: fresh() })).code, 200);
  assert.equal(h.profile().balance, 10);
  assert.equal((await h.call('rewards', '/event', body, { session: fresh() })).code, 403);
  assert.equal((await h.call('progress', '/recover', { runId }, { session: fresh() })).body.finished, true);
});

test('save boundary requires authentication and separates users/networks', async () => {
  const h = harness();
  assert.equal((await h.call('progress', '/me', null, { method: 'GET', session: {} })).code, 401);
  assert.equal((await h.call('progress', '/me', null, { method: 'GET', session: { currentUser: { uid: 'pilot-a' }, adminUid: 'pilot-a', adminMode: true } })).code, 403);
  await init(h);
  await h.call('progress', '/me', null, { method: 'GET', network: 'mainnet' });
  assert.deepEqual(h.docs[0].playerByNetwork.mainnet.fleet, emptyPlayerSave().fleet);
  assert.equal(h.docs[1].playerByNetwork, undefined);
  assert.equal((await h.call('progress', '/inventory', { action: 'select', version: 0, skin: 'nova-wing', color: 'gold', uid: 'pilot-b' })).code, 403);
});

test('explicit import is one-time, strips paid ownership, and purchases use compare-and-swap', async () => {
  const h = harness(); await init(h);
  const body = { action: 'import', version: 0, confirm: true, balance: 1000, fleet: { 'grey-scout': { grey: 1 }, 'nova-wing': { gold: 1 }, 'paid-weapon': { gold: 999 } }, skin: 'nova-wing', color: 'gold' };
  assert.equal((await h.call('progress', '/inventory', { ...body, confirm: false })).code, 400);
  assert.equal((await h.call('progress', '/inventory', body)).code, 200);
  assert.equal(h.profile().fleet['paid-weapon'], undefined);
  assert.equal((await h.call('progress', '/inventory', { ...body, version: 1 })).code, 409);
  const purchase = { action: 'buy', version: 1, skin: 'solar-lance', color: 'gold' };
  const results = await Promise.all([h.call('progress', '/inventory', purchase), h.call('progress', '/inventory', purchase)]);
  assert.deepEqual(results.map(r => r.code).sort(), [200, 409]);
  assert.equal(h.profile().balance, 600);
  assert.equal(h.profile().fleet['solar-lance'].gold, 1);
  assert.equal(h.profile().totalShardsSpent, 400);
  assert.equal(h.docs[0].loadout, undefined);
});

test('repeated and concurrent start keys consume at most one specific power-up', async () => {
  const h = harness(); await init(h);
  const power = require('../../build/hangarCatalog.js').hangarCatalog.find(o => o.kind === 'power');
  h.docs[0].loadout = { weapon: null, power: power.id };
  h.orders.push({ _id: 'order-1', user: 'pilot-a', product_id: power.id, paid: true }, { _id: 'order-2', user: 'pilot-a', product_id: power.id, paid: true });
  const first = await start(h);
  assert.equal(first.code, 200);
  // Simulate a persisted claim whose start response was not yet written.
  h.profile().lastStart = null;
  const retries = await Promise.all([start(h), start(h)]);
  assert.ok(retries.every(r => r.code === 200));
  assert.ok(retries.every(r => r.body.scoreRunId === first.body.scoreRunId));
  assert.ok(retries.every(r => r.body.powerUp === power.powerUp));
  assert.equal(h.orders.filter(o => o.consumed_at).length, 1);
  assert.equal(h.orders[1].consumed_at, undefined);
});

test('checkpoint, automatic chain, device resume, stale writes and final credit are idempotent', async () => {
  const h = harness(); await init(h); assert.equal((await start(h)).code, 200);
  const oldSession = structuredClone(h.session), oldRun = h.session.scoreRun.id;
  for (let stage = 1; stage <= 9; stage++) {
    const event = { runId: oldRun, kind: 'block', stage, level: 1, save: snapshot({ score: stage * 10, shards: stage, destroyed: stage }) };
    assert.equal((await h.call('rewards', '/event', event)).code, 200);
    assert.equal((await h.call('rewards', '/event', event)).body.awarded, false);
  }
  assert.equal(h.profile().balance, 9);
  assert.equal(h.profile().mission.phase, 'boss');
  assert.equal(h.profile().mission.sector, 10);
  assert.ok(h.docs[0].rewardEventKeys.testnet.includes('chain:1'));
  assert.equal((await h.call('rewards', '/event', { runId: oldRun, kind: 'chain', stage: 9, level: 1, save: snapshot({ score: 90, shards: 9, destroyed: 9 }) })).body.awarded, false);
  const resumed = await start(h, 'resume', 'resume-key-0000000002');
  assert.equal(resumed.code, 200);
  assert.equal(resumed.body.checkpoint.score, 90);
  assert.equal(resumed.body.runMeta.scoreBase, 90);
  const runId = resumed.body.scoreRunId;
  assert.notEqual(runId, oldRun);
  assert.equal((await h.call('rewards', '/event', { runId: oldRun, kind: 'boss', stage: 10, level: 1 }, { session: oldSession })).code, 403);
  assert.equal((await h.call('rewards', '/event', { runId, kind: 'boss', stage: 10, level: 1, save: snapshot({ score: 100, shards: 12, destroyed: 10 }) })).code, 200);
  assert.equal(h.profile().mission.phase, 'bonus');
  assert.equal(h.profile().balance, 12);
  assert.equal((await h.call('rewards', '/event', { runId, kind: 'bonus', stage: 10, level: 1, hits: 12, save: snapshot({ score: 110, shards: 14, destroyed: 10 }) })).code, 200);
  assert.equal(h.profile().mission.sector, 11);
  assert.equal(h.profile().mission.phase, 'normal');
  const final = { runId, score: 120, finished: true, save: snapshot({ score: 120, shards: 16, destroyed: 11, hearts: 0 }) };
  assert.equal((await h.call('leaderboard', '/score', final)).code, 200);
  assert.equal(h.profile().balance, 16);
  assert.equal(h.profile().totalShardsEarned, 16);
  assert.equal(h.profile().totalDestroyed, 11);
  assert.equal(h.profile().highestSector, 11);
  assert.equal(h.profile().mission, null);
  assert.equal((await h.call('progress', '/recover', { runId })).body.finished, true);
  assert.equal((await h.call('leaderboard', '/score', final)).code, 403);
  assert.equal(h.profile().balance, 16);
});

test('leaving preserves last completed section without crediting replayable partial shards', async () => {
  const h = harness(); await init(h); await start(h);
  const runId = h.session.scoreRun.id;
  await h.call('rewards', '/event', { runId, kind: 'block', stage: 1, level: 1, save: snapshot({ score: 10, shards: 2 }) });
  assert.equal((await h.call('leaderboard', '/score', { runId, score: 15, finished: false, save: snapshot({ score: 15, shards: 3 }) })).code, 200);
  assert.equal(h.profile().balance, 2);
  assert.equal(h.profile().mission.sector, 2);
  assert.equal((await h.call('progress', '/recover', { runId })).body.recovered, true);
  assert.equal(h.session.scoreRun.id, runId);
});

test('leaving with one life resumes with one, while unfinished rewards stay discarded', async () => {
  const h = harness(); await init(h); await start(h);
  const runId = h.session.scoreRun.id;
  await h.call('rewards', '/event', { runId, kind: 'block', stage: 1, level: 1, save: snapshot({ score: 100, shards: 5, hearts: 2 }) });
  const left = await h.call('progress', '/leave', { runId, hearts: 1 });
  assert.equal(left.code, 200);
  assert.equal(left.body.save.mission.snapshot.hearts, 1);
  assert.equal(left.body.save.mission.snapshot.score, 100);
  assert.equal(left.body.save.mission.snapshot.shards, 5);
  assert.equal(h.profile().balance, 5);
  assert.equal((await h.call('progress', '/leave', { runId, hearts: 2 })).body.save.mission.snapshot.hearts, 1);
  const resumed = await start(h, 'resume', 'resume-key-0000000002');
  assert.equal(resumed.body.checkpoint.hearts, 1);
  assert.equal(resumed.body.startSector, 2);
  assert.equal((await h.call('progress', '/leave', { runId, hearts: 1 })).code, 409);
});

test('leaving before the first block saves only the remaining lives at the start', async () => {
  const h = harness(); await init(h); await start(h);
  const runId = h.session.scoreRun.id;
  assert.equal((await h.call('progress', '/leave', { runId, hearts: 1 })).code, 200);
  assert.equal(h.profile().mission.sector, 1);
  assert.equal(h.profile().mission.snapshot.hearts, 1);
  assert.equal(h.profile().mission.snapshot.score, 0);
  assert.equal(h.profile().mission.snapshot.shards, 0);
  const resumed = await start(h, 'resume', 'resume-key-0000000002');
  assert.equal(resumed.body.checkpoint.hearts, 1);
});

test('snapshot whitelist rejects invalid data and preserves only supported fields', () => {
  assert.equal(readSnapshot(snapshot({ hearts: 100 })), null);
  assert.equal(readSnapshot(snapshot({ score: NaN })), null);
  assert.equal(readSnapshot(snapshot({ weaponTimers: [0] })), null);
  assert.equal(readSnapshot(snapshot({ uid: 'another-player' })).uid, undefined);
  assert.equal(legacyInventory({ balance: -1, fleet: {} }), null);
});

test('new mission keeps inventory and career, closes import and resets only run keys', async () => {
  const h = harness(); await init(h);
  h.profile().balance = 700; h.profile().totalDestroyed = 20;
  h.profile().fleet['nova-wing'] = { gold: 2 };
  await start(h);
  const runId = h.session.scoreRun.id;
  await h.call('rewards', '/event', { runId, kind: 'block', stage: 1, level: 1, save: snapshot({ shards: 2, destroyed: 1 }) });
  assert.equal((await start(h, 'new', 'new-start-key-0000003')).code, 200);
  assert.equal(h.profile().balance, 702);
  assert.equal(h.profile().totalDestroyed, 21);
  assert.equal(h.profile().fleet['nova-wing'].gold, 2);
  assert.equal(h.profile().mission, null);
  assert.deepEqual(h.docs[0].rewardEventKeys.testnet, []);
  assert.equal((await h.call('progress', '/inventory', { action: 'import', version: h.profile().version, confirm: true, balance: 999, fleet: {} })).code, 409);
});
