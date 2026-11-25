import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const platform = require('../../build/services/platformAPIClient.js');
const release = require('../../build/mainnetRelease.js');
const quotes = require('../../build/purchaseQuote.js');
const receipts = require('../../build/paymentReceipt.js');
const { findOffer } = require('../../build/hangarCatalog.js');
const mount = require('../../build/handlers/payments.js').default;

function harness(t, { network = 'mainnet', order = true, released = false, user = 'pilot-a' } = {}) {
  t.mock.method(release, 'mainnetPurchasesReleased', async () => released);
  t.mock.method(quotes, 'capturePurchaseQuote', async () => undefined);
  t.mock.method(receipts, 'readPaymentReceipt', async () => ({}));
  const offer = findOffer('weapon_twin');
  let payment = { identifier: 'boundary-payment', user_uid: 'pilot-a', direction: 'user_to_app',
    network: network === 'mainnet' ? 'Pi Network' : 'Pi Testnet', amount: offer.pricePi * 5,
    metadata: { productId: offer.id, weaponModel: 2, quantity: 5 },
    status: { developer_approved: order, transaction_verified: true }, transaction: { txid: 'a'.repeat(64) } };
  const orders = order ? [{ pi_payment_id: payment.identifier, user: 'pilot-a', product_id: offer.id,
    payment_network: payment.network, weapon_model: 2, quantity: 5, paid: false }] : [];
  const writes = [], posts = [], reads = [], routes = {};
  let acknowledge = true, mutateAfter;
  const pi = {
    async get(path) { reads.push(path); return { data: structuredClone(payment) }; },
    async post(path) {
      posts.push(path);
      if (path.endsWith('/complete') && acknowledge) payment.status.developer_completed = true;
      if (path.endsWith('/approve')) payment.status.developer_approved = true;
      mutateAfter?.(payment);
      return { data: {} };
    },
  };
  t.mock.method(platform, 'platformAPIClientForRequest', () => pi);
  const matches = (doc, query) => Object.entries(query).every(([key, value]) =>
    value && typeof value === 'object' && '$ne' in value ? doc[key] !== value.$ne : doc[key] === value);
  const collection = {
    async findOne(query) { return structuredClone(orders.find(o => matches(o, query)) ?? null); },
    async updateOne(query, update, options) {
      let doc = orders.find(o => matches(o, query));
      if (!doc && options?.upsert) { doc = { ...query, ...update.$setOnInsert }; orders.push(doc); }
      if (doc) { Object.assign(doc, update.$set); writes.push(structuredClone(update)); }
      return { matchedCount: doc ? 1 : 0, modifiedCount: doc ? 1 : 0 };
    },
  };
  mount({ post(path, fn) { routes[path] = fn; } });
  const req = { headers: { 'x-cryptoid-app-network': network }, session: { currentUser: user ? { uid: user } : null },
    app: { locals: { orderCollection: collection } } };
  return { orders, writes, reads, posts, req, payment: () => payment,
    noAcknowledgement() { acknowledge = false; }, afterPost(fn) { mutateAfter = fn; },
    async call(path = '/complete') {
      req.body = path === '/incomplete' ? { payment: { identifier: payment.identifier } } : { paymentId: payment.identifier, txid: 'a'.repeat(64) };
      const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
      await routes[path](req, res); return res;
    } };
}

test('unsigned payment requests do not reach Pi', async t => {
  const h = harness(t, { user: null });
  for (const route of ['/approve', '/complete', '/incomplete']) assert.equal((await h.call(route)).code, 401);
  assert.equal(h.reads.length, 0); assert.equal(h.posts.length, 0); assert.equal(h.writes.length, 0);
});

for (const [name, mutate] of [
  ['account', p => { p.user_uid = 'pilot-b'; }],
  ['network', p => { p.network = 'Pi Testnet'; }],
  ['amount', p => { p.amount = .000001; }],
  ['product', p => { p.metadata.productId = 'not-a-product'; }],
  ['quantity', p => { p.metadata.quantity = 6; }],
  ['cancelled', p => { p.status.user_cancelled = true; }],
  ['transaction', p => { p.transaction.txid = 'wrong'; }],
]) test(`wrong ${name} grants no paid order`, async t => {
  const h = harness(t); mutate(h.payment());
  assert.notEqual((await h.call()).code, 200);
  assert.equal(h.orders[0].paid, false); assert.equal(h.writes.length, 0); assert.equal(h.posts.length, 0);
});

test('server release is mandatory for a new Mainnet approval', async t => {
  const h = harness(t, { order: false });
  h.req.body = { ready: true, released: true };
  assert.equal((await h.call('/approve')).code, 403);
  assert.equal(h.orders.length, 0); assert.equal(h.posts.length, 0);
});

test('a successful /complete response without confirmed Pi completion grants nothing', async t => {
  const h = harness(t); h.noAcknowledgement();
  assert.equal((await h.call()).body.error, 'payment_completion_not_confirmed');
  assert.equal(h.orders[0].paid, false); assert.equal(h.writes.length, 0);
});

test('changed Pi response after completion is rejected before credit', async t => {
  const h = harness(t); h.afterPost(p => { p.metadata.productId = 'weapon_plasma'; });
  assert.equal((await h.call()).body.error, 'payment_completion_not_confirmed');
  assert.equal(h.writes.length, 0);
});

test('concurrent and repeated completion credits one receipt and supports recovery while held', async t => {
  const h = harness(t);
  const results = await Promise.all([h.call(), h.call()]);
  assert.ok(results.every(r => r.body.completed));
  assert.equal(h.orders[0].paid, true);
  assert.equal(h.writes.filter(w => w.$set?.paid === true).length, 1);
  const writes = h.writes.length, posts = h.posts.length;
  assert.equal((await h.call('/incomplete')).body.completed, true);
  assert.equal(h.writes.length, writes); assert.equal(h.posts.length, posts);
});

test('an order bound to the other network cannot be replayed into this inventory', async t => {
  const h = harness(t); h.orders[0].payment_network = 'Pi Testnet';
  assert.equal((await h.call()).body.error, 'payment_network_mismatch');
  assert.equal(h.reads.length, 0); assert.equal(h.writes.length, 0);
});

test('even simulated release cannot approve payment to a different Mainnet wallet', async t => {
  const original = process.env.PI_MAINNET_WALLET_ADDRESS;
  process.env.PI_MAINNET_WALLET_ADDRESS = 'G' + 'A'.repeat(55);
  t.after(() => { if (original === undefined) delete process.env.PI_MAINNET_WALLET_ADDRESS; else process.env.PI_MAINNET_WALLET_ADDRESS = original; });
  const h = harness(t, { order: false, released: true });
  h.payment().to_address = 'G' + 'B'.repeat(55);
  assert.equal((await h.call('/approve')).body.error, 'mainnet_wallet_unverified');
  assert.equal(h.orders.length, 0); assert.equal(h.posts.length, 0);
});

test('simulated released Mainnet checkout preserves matching product, quantity, amount and one credit', async t => {
  const original = process.env.PI_MAINNET_WALLET_ADDRESS;
  process.env.PI_MAINNET_WALLET_ADDRESS = 'G' + 'A'.repeat(55);
  t.after(() => { if (original === undefined) delete process.env.PI_MAINNET_WALLET_ADDRESS; else process.env.PI_MAINNET_WALLET_ADDRESS = original; });
  const h = harness(t, { order: false, released: true });
  h.payment().to_address = process.env.PI_MAINNET_WALLET_ADDRESS;
  assert.equal((await h.call('/approve')).code, 200);
  assert.equal(h.orders[0].paid, false);
  assert.equal((await h.call()).code, 200);
  assert.equal(h.orders[0].paid, true);
  assert.equal(h.orders[0].product_id, 'weapon_twin');
  assert.equal(h.orders[0].quantity, 5);
  assert.equal(h.orders[0].payment_amount_pi, h.payment().amount);
  assert.equal(h.orders[0].payment_network, 'Pi Network');
  assert.equal(h.writes.filter(w => w.$set?.paid === true).length, 1);
});
