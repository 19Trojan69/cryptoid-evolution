import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { hangarCatalog } = require('../../build/hangarCatalog.js');
const { emptyPlayerSave, firstMissionSnapshot, shipPrice, standardShips, shipForSprite } = require('../../build/playerSave.js');
const { canUseOwnerTestnetCatalog } = require('../../build/adminAccess.js');
const platform = require('../../build/services/platformAPIClient.js');
const quotes = require('../../build/purchaseQuote.js');
const receipts = require('../../build/paymentReceipt.js');
const get = (o, path) => path.split('.').reduce((v, k) => v?.[k], o);
const set = (o, path, value) => { const keys = path.split('.'); const last = keys.pop(); for (const k of keys) o = o[k] ??= {}; o[last] = structuredClone(value); };
const matches = (doc, query) => Object.entries(query).every(([path, expected]) => {
  const actual = get(doc, path);
  if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
    if ('$exists' in expected) return (actual !== undefined) === expected.$exists;
    if ('$ne' in expected) return Array.isArray(actual) ? !actual.includes(expected.$ne) : actual !== expected.$ne;
    if ('$in' in expected) return expected.$in.includes(actual);
    if ('$regex' in expected) return typeof actual === 'string' && new RegExp(expected.$regex, expected.$options || '').test(actual);
  }
  return expected === null ? actual == null : actual === expected;
});
function collection(docs) {
  const apply = (doc, update) => {
    for (const path of Object.keys(update.$unset || {})) { const keys = path.split('.'); const last = keys.pop(); const parent = get(doc, keys.join('.')); if (parent) delete parent[last]; }
    for (const [path, value] of Object.entries(update.$set || {})) set(doc, path, value);
    for (const [path, value] of Object.entries(update.$inc || {})) set(doc, path, (get(doc, path) || 0) + value);
    for (const [path, value] of Object.entries(update.$max || {})) set(doc, path, Math.max(get(doc, path) || 0, value));
    for (const [path, value] of Object.entries(update.$addToSet || {})) set(doc, path, [...new Set([...(get(doc, path) || []), ...(value.$each || [value])])]);
  };
  return {
    async findOne(query) { return structuredClone(docs.find(doc => matches(doc, query)) || null); },
    async updateOne(query, update, options) { let doc = docs.find(doc => matches(doc, query)); if (!doc && options?.upsert) { doc = { _id: `fixture-${docs.length + 1}`, ...query, ...update.$setOnInsert }; docs.push(doc); } if (!doc) return { matchedCount: 0, modifiedCount: 0 }; apply(doc, update); return { matchedCount: 1, modifiedCount: 1 }; },
    async findOneAndUpdate(query, update) { const doc = docs.find(doc => matches(doc, query)); if (!doc) return null; const before = structuredClone(doc); apply(doc, update); return before; },
    find(query) { return { project() { return this; }, limit(n) { this.maximum = n; return this; }, async toArray() { return structuredClone(docs.filter(doc => matches(doc, query)).slice(0, this.maximum)); } }; },
  };
}
function harness() {
  const docs = [{ uid: 'pilot-a' }, { uid: 'pilot-b' }], orders = [];
  const locals = { userCollection: collection(docs), orderCollection: collection(orders) };
  const session = { currentUser: { uid: 'pilot-a' }, adminMode: false };
  const routes = {}, middleware = {};
  for (const name of ['progress', 'hangar', 'rewards', 'leaderboard', 'payments']) {
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
  return { docs, orders, session, locals, call, profile: () => docs[0].playerByNetwork.testnet };
}

function owner(t) {
  const previous = process.env.ADMIN_PI_TESTNET_UID;
  process.env.ADMIN_PI_TESTNET_UID = 'pilot-a';
  t.after(() => { if (previous === undefined) delete process.env.ADMIN_PI_TESTNET_UID; else process.env.ADMIN_PI_TESTNET_UID = previous; });
}
function pi(t, h) {
  const posts = [];
  h.locals.payment = null;
  t.mock.method(platform, 'platformAPIClientForRequest', () => ({
    get: async () => ({ data: structuredClone(h.locals.payment) }),
    post: async url => { posts.push(url); },
  }));
  t.mock.method(quotes, 'capturePurchaseQuote', async () => ({ availability: 'test_payment' }));
  t.mock.method(receipts, 'readPaymentReceipt', async () => ({}));
  return posts;
}
async function payment(h, productId, options = {}) {
  const offer = hangarCatalog.find(item => item.id === productId);
  const id = options.id || `payment-${h.orders.length + 1}`;
  h.locals.payment = {
    identifier: id, user_uid: 'pilot-a', direction: 'user_to_app',
    network: options.network || 'Pi Testnet', amount: offer.pricePi,
    metadata: { productId }, status: {}, transaction: { txid: `tx-${id}` },
    ...options.payment,
  };
  const approved = await h.call('payments', '/approve', { paymentId: id, ownerTestnet: true, canAdmin: true }, options.request);
  if (approved.code !== 200) return approved;
  assert.equal(h.orders.find(order => order.pi_payment_id === id).paid, false);
  h.locals.payment.status = { developer_approved: true, transaction_verified: true };
  return h.call('payments', '/complete', { paymentId: id, txid: `tx-${id}` }, options.request);
}
const inventory = h => h.call('hangar', '/inventory', null, { method: 'GET' });

test('catalog authorization requires the verified Testnet owner outside free preview', async t => {
  owner(t);
  const req = (network, uid = 'pilot-a', extra = {}) => ({ headers: { 'x-cryptoid-app-network': network }, session: { currentUser: { uid, username: '19Trojan69' }, ...extra }, app: { locals: {} } });
  assert.equal(await canUseOwnerTestnetCatalog(req('testnet')), true);
  assert.equal(await canUseOwnerTestnetCatalog(req('mainnet')), false);
  assert.equal(await canUseOwnerTestnetCatalog(req('testnet', 'pilot-b')), false);
  assert.equal(await canUseOwnerTestnetCatalog(req('testnet', 'pilot-a', { adminMode: true })), false);
  assert.equal(await canUseOwnerTestnetCatalog(req('testnet', undefined, { currentUser: null })), false);
});

test('owner earns Shards in a saved mission before buying the last Standard ship', async t => {
  owner(t); const h = harness();
  await h.call('progress', '/me', null, { method: 'GET' });
  assert.equal(h.profile().balance, 0);
  assert.deepEqual(Object.keys(h.profile().fleet), ['grey-scout']);
  const buy = () => h.call('progress', '/inventory', { action: 'buy', version: h.profile().version, skin: 'core-carrier', color: 'gold', ownerTestnet: true });
  assert.equal((await buy()).body.error, 'not_enough_shards');
  const started = await h.call('hangar', '/start', { action: 'new', version: h.profile().version, startKey: 'owner-earn-shards-0001', rulesVersion: 2 });
  assert.ok(started.body.scoreRunId); assert.equal(started.body.adminPreview, false);
  h.session.scoreRun.startedAt -= 60_000;
  const save = firstMissionSnapshot(3); Object.assign(save, { score: 1000, shards: 5000, destroyed: 10 });
  assert.equal((await h.call('rewards', '/event', { runId: started.body.scoreRunId, kind: 'block', level: 1, stage: 1, save })).code, 200);
  assert.equal(h.profile().balance, 5000);
  assert.equal((await buy()).code, 200);
  assert.equal(h.profile().balance, 350);
  assert.equal(h.profile().fleet['core-carrier'].gold, 1);
  assert.equal(h.profile().skin, 'grey-scout');
  assert.equal((await h.call('progress', '/me', null, { method: 'GET', network: 'mainnet' })).body.save.fleet['core-carrier'], undefined);
  for (const skin of standardShips) assert.equal(typeof shipPrice(skin, true), 'number');
  assert.equal(shipPrice('core-carrier'), null);
});

test('normal users and Mainnet cannot buy a locked Standard hull by forging flags', async t => {
  owner(t);
  for (const request of [{ session: { currentUser: { uid: 'pilot-b', username: '19Trojan69' }, canAdmin: true } }, { network: 'mainnet' }]) {
    const h = harness();
    const initialized = await h.call('progress', '/me', null, { method: 'GET', ...request });
    const response = await h.call('progress', '/inventory', { action: 'buy', version: initialized.body.save.version, skin: 'core-carrier', color: 'gold', canAdmin: true }, request);
    assert.equal(response.code, 400); assert.equal(response.body.error, 'invalid_ship');
  }
});

test('all paid catalog items require a confirmed Test-Pi payment, not free admin inventory', async t => {
  owner(t); const h = harness(); const posts = pi(t, h);
  await h.call('progress', '/me', null, { method: 'GET' });
  for (const skin of standardShips) h.profile().fleet[skin] = { gold: 1 };
  assert.equal((await inventory(h)).body.testnetCatalogAccess, true);
  assert.deepEqual((await inventory(h)).body.ownedArmor, []);
  for (const offer of hangarCatalog) {
    const result = await payment(h, offer.id);
    assert.equal(result.code, 200, `${offer.id}: ${JSON.stringify(result.body)}`);
  }
  assert.equal(h.orders.length, hangarCatalog.length);
  assert.ok(h.orders.every(order => order.paid && order.owner_testnet_catalog && order.payment_network === 'Pi Testnet'));
  const items = (await inventory(h)).body;
  assert.equal(items.ownedShipUpgrades.length, 40); assert.equal(items.ownedArmor.length, 2);
  assert.equal(items.ownedWeapons.length, 4); assert.ok(items.consumables.every(item => item.count === 1));
  assert.equal(items.weaponStock.weapon_plasma, 2, 'legacy one-item metadata retains its existing two-charge rule');
  const again = await h.call('payments', '/complete', { paymentId: h.orders[0].pi_payment_id, txid: 'ignored-after-confirmation' });
  assert.equal(again.code, 200); assert.equal(posts.length, hangarCatalog.length * 2);
  assert.deepEqual((await inventory(h)).body.weaponStock, items.weaponStock, 'replayed completion cannot credit again');
  const main = await h.call('hangar', '/inventory', null, { method: 'GET', network: 'mainnet' });
  assert.deepEqual(main.body.ownedArmor, []); assert.deepEqual(main.body.ownedShipUpgrades, []);
  assert.deepEqual(main.body.ownedWeapons, []); assert.ok(main.body.consumables.every(item => item.count === 0));
});

test('the owner still needs the base hull, matching Advanced, and Reinforced Hull', async t => {
  owner(t); const h = harness(); const posts = pi(t, h);
  await h.call('progress', '/me', null, { method: 'GET' });
  assert.equal((await payment(h, 'ship_01_stage_2')).body.error, 'standard_ship_required');
  assert.equal((await payment(h, 'ship_02_stage_3')).body.prerequisite, 'ship_02_stage_2');
  assert.equal((await payment(h, 'armor_hull_mk2')).body.prerequisite, 'armor_hull_mk1');
  assert.equal(h.orders.length, 0); assert.equal(posts.length, 0);
  assert.equal(shipForSprite(0), 'nova-wing'); assert.equal(shipForSprite(1), 'grey-scout');
  assert.equal((await payment(h, 'ship_02_stage_2')).code, 200);
  assert.equal((await payment(h, 'ship_02_stage_3')).code, 200);
  assert.equal((await payment(h, 'ship_02_stage_2')).body.error, 'already_owned');
});

test('Mainnet payments, non-owner requests, incorrect totals and unverified completion grant nothing', async t => {
  owner(t);
  for (const options of [
    { network: 'Pi Network' },
    { request: { network: 'mainnet' } },
    { request: { session: { currentUser: { uid: 'pilot-a' }, adminMode: true } } },
    { request: { session: { currentUser: { uid: 'pilot-b', username: '19Trojan69' } } } },
    { payment: { amount: .001 } },
    { payment: { user_uid: 'other' } },
  ]) {
    const h = harness(); const posts = pi(t, h);
    assert.notEqual((await payment(h, 'start_shield', options)).code, 200);
    assert.equal(posts.length, 0); assert.equal(h.orders.length, 0);
  }
  const h = harness(); pi(t, h);
  h.locals.payment = { identifier:'pending-1',user_uid:'pilot-a',direction:'user_to_app',network:'Pi Testnet',amount:.08,metadata:{productId:'start_shield'},status:{developer_approved:true,transaction_verified:false},transaction:{txid:'tx-pending'} };
  h.orders.push({ pi_payment_id:'pending-1',user:'pilot-a',product_id:'start_shield',paid:false });
  assert.equal((await h.call('payments','/complete',{paymentId:'pending-1',txid:'tx-pending'})).code,400);
  assert.equal((await inventory(h)).body.consumables.find(item=>item.id==='start_shield').count,0);
});

test('owner Plasma charges activate for 45 seconds and replay one receipt without another debit', async t => {
  owner(t); const h=harness();pi(t,h);
  await h.call('progress','/me',null,{method:'GET'});
  assert.equal((await payment(h,'weapon_plasma',{payment:{amount:.9,metadata:{productId:'weapon_plasma',quantity:3,weaponModel:2}}})).code,200);
  assert.equal((await inventory(h)).body.weaponStock.weapon_plasma,3);
  const start=await h.call('hangar','/start',{action:'new',version:h.profile().version,startKey:'owner-plasma-run-0001',rulesVersion:2});
  h.profile().mission={sector:1,phase:'normal',snapshot:firstMissionSnapshot(3),combat:{},savedAt:new Date().toISOString()};
  const body={runId:start.body.scoreRunId,level:5,requestId:'owner-plasma-activation-0001'};
  const first=await h.call('hangar','/weapon/activate',body);
  assert.equal(first.code,200);assert.equal(first.body.remainingMs,45_000);assert.equal(first.body.weaponStock.weapon_plasma,2);
  const replay=await h.call('hangar','/weapon/activate',body);
  assert.equal(replay.code,200);assert.equal(replay.body.weaponStock.weapon_plasma,2);
  assert.equal((await h.call('hangar','/weapon/activate',{...body,requestId:'owner-plasma-activation-0002'})).code,409);
  h.profile().mission.snapshot.weaponTimers[5]=0;
  const next=await h.call('hangar','/weapon/activate',{...body,requestId:'owner-plasma-activation-0002'});
  assert.equal(next.code,200);assert.equal(next.body.weaponStock.weapon_plasma,1);
});

test('paid armor and one-mission power enter a normal saved run once and never a Mainnet run', async t => {
  owner(t);const h=harness();pi(t,h);
  await h.call('progress','/me',null,{method:'GET'});
  for(const id of ['armor_hull_mk1','armor_hull_mk2','start_shield'])assert.equal((await payment(h,id)).code,200);
  assert.equal((await h.call('hangar','/equip',{weapon:null,power:'start_shield'})).code,200);
  const body={action:'new',version:h.profile().version,startKey:'owner-shield-run-0001',rulesVersion:2};
  const started=await h.call('hangar','/start',body);
  assert.equal(started.code,200);assert.equal(started.body.armorBonus,3);assert.equal(started.body.powerUp,'shield');
  assert.equal(started.body.adminPreview,false);assert.ok(started.body.scoreRunId);
  const repeat=await h.call('hangar','/start',body);assert.equal(repeat.body.scoreRunId,started.body.scoreRunId);
  assert.equal((await inventory(h)).body.consumables.find(item=>item.id==='start_shield').count,0);
  const main=await h.call('progress','/me',null,{method:'GET',network:'mainnet'});
  const mainStart=await h.call('hangar','/start',{action:'new',version:main.body.save.version,startKey:'owner-mainnet-isolated-1',rulesVersion:2},{network:'mainnet'});
  assert.equal(mainStart.code,200);assert.equal(mainStart.body.armorBonus,0);assert.equal(mainStart.body.powerUp,null);
});
