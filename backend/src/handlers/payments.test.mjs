import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const platform = require('../../build/services/platformAPIClient.js');
const policy = require('../../build/paymentPolicy.js');
const quotes = require('../../build/purchaseQuote.js');
const receipts = require('../../build/paymentReceipt.js');
const mountPayments = require('../../build/handlers/payments.js').default;

function setup(t, enablePermanentPurchases = true) {
  t.mock.method(platform, 'platformAPIClientForRequest', req => req.app.locals.pi);
  t.mock.method(quotes, 'capturePurchaseQuote', async () => undefined);
  t.mock.method(receipts, 'readPaymentReceipt', async () => ({}));
  // The production policy still locks permanent purchases. Exercise the guard
  // independently so it remains enforced when those purchases are enabled.
  if (enablePermanentPurchases) t.mock.method(policy, 'testPiPurchaseAllowed', () => true);
}

function harness(path, priorOrders = [], { productId = 'armor_hull_mk2', paid = false } = {}) {
  const paymentId = 'armor-payment-1';
  const orders = structuredClone(priorOrders);
  if (path !== '/approve') orders.push({ pi_payment_id: paymentId, user: 'pilot-a', product_id: productId, paid });
  const writes = [], posts = [], reads = [];
  const matches = (doc, query) => Object.entries(query).every(([key, value]) =>
    value && typeof value === 'object' && '$ne' in value ? doc[key] !== value.$ne : doc[key] === value);
  const orderCollection = {
    async findOne(query) { return orders.find(doc => matches(doc, query)) || null; },
    async updateOne(query, update, options) {
      writes.push({ query, update });
      let doc = orders.find(item => matches(item, query));
      if (!doc && options?.upsert) {
        doc = { ...query, ...update.$setOnInsert };
        orders.push(doc);
      }
      if (doc) Object.assign(doc, update.$set);
      return { modifiedCount: doc ? 1 : 0 };
    },
  };
  const pi = {
    async get(url) {
      reads.push(url);
      return { data: {
        identifier: paymentId, user_uid: 'pilot-a', direction: 'user_to_app',
        amount: productId === 'armor_hull_mk2' ? 29.9 : 19.9,
        metadata: { productId }, network: 'Pi Testnet',
        status: { developer_approved: path !== '/approve', transaction_verified: true },
        transaction: { txid: 'verified-transaction' },
      } };
    },
    async post(url, body) { posts.push({ url, body }); },
  };
  const routes = {};
  mountPayments({ post: (route, handler) => { routes[route] = handler; } });
  return {
    orders, writes, posts, reads,
    async call() {
      const body = path === '/incomplete' ? { payment: { identifier: paymentId } } : { paymentId, txid: 'verified-transaction' };
      const req = { body, session: { currentUser: { uid: 'pilot-a' } }, headers: {}, app: { locals: { orderCollection, pi } } };
      const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
      await routes[path](req, res);
      return res;
    },
  };
}

for (const path of ['/approve', '/complete', '/incomplete']) {
  test(`${path} rejects Titanium without this pilot's paid, uncancelled Reinforced Hull`, async t => {
    setup(t);
    for (const prior of [
      [],
      [{ user: 'pilot-a', product_id: 'armor_hull_mk1', paid: false }],
      [{ user: 'pilot-b', product_id: 'armor_hull_mk1', paid: true }],
      [{ user: 'pilot-a', product_id: 'armor_hull_mk1', paid: true, cancelled: true }],
      [{ user: 'pilot-a', product_id: 'ship_01_stage_2', paid: true }],
    ]) {
      const h = harness(path, prior);
      const response = await h.call();
      assert.equal(response.code, 403);
      assert.equal(response.body.prerequisite, 'armor_hull_mk1');
      assert.equal(h.posts.length, 0, 'must not approve or complete the Pi payment');
      assert.equal(h.writes.length, 0, 'must not create or credit an order');
    }
  });

  test(`${path} permits Titanium after this pilot's paid Reinforced Hull`, async t => {
    setup(t);
    const h = harness(path, [{ user: 'pilot-a', product_id: 'armor_hull_mk1', paid: true }]);
    const response = await h.call();
    assert.equal(response.code, 200);
    assert.equal(h.posts.length, 1);
    assert.ok(h.posts[0].url.endsWith(path === '/approve' ? '/approve' : '/complete'));
    const titanium = h.orders.find(order => order.product_id === 'armor_hull_mk2');
    assert.equal(titanium.paid, path !== '/approve');
  });
}

test('paid legacy Titanium completion stays idempotent without Reinforced Hull', async t => {
  setup(t);
  for (const path of ['/complete', '/incomplete']) {
    const h = harness(path, [], { paid: true });
    assert.deepEqual((await h.call()).body, { completed: true });
    assert.equal(h.reads.length, 0);
    assert.equal(h.posts.length, 0);
    assert.equal(h.writes.length, 0);
  }
});

test('the release does not enable currently locked permanent Pi purchases', async t => {
  setup(t, false);
  for (const path of ['/approve', '/complete', '/incomplete']) {
    const h = harness(path, [{ user: 'pilot-a', product_id: 'armor_hull_mk1', paid: true }]);
    assert.equal((await h.call()).code, 403);
    assert.equal(h.posts.length, 0);
    assert.equal(h.writes.length, 0);
  }
});

test('Elite still requires the matching Advanced ship rather than armor or another ship', async t => {
  setup(t);
  for (const path of ['/approve', '/complete', '/incomplete']) {
    const h = harness(path, [
      { user: 'pilot-a', product_id: 'armor_hull_mk1', paid: true },
      { user: 'pilot-a', product_id: 'ship_02_stage_2', paid: true },
    ], { productId: 'ship_01_stage_3' });
    assert.equal((await h.call()).code, 403);
    assert.equal(h.posts.length, 0);
    assert.equal(h.writes.length, 0);
  }
});
