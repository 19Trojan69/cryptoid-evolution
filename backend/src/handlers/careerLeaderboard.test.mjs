import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const mount = require('../../build/handlers/leaderboard.js').default;
const routes = {};
mount({ get(path, handler) { routes[path] = handler; }, post() {} });

test('career top 100 sorts by network career total and labels best-run versus profile level', async () => {
  const entries = [
    { uid: 'a', username: 'A', careerScoreByNetwork: { testnet: 300, mainnet: 2 }, bestRunByNetwork: { testnet: { score: 200, level: 2 } }, rewardsByNetwork: { testnet: { highestLevel: 180 } }, bestScoreV2: { testnet: 180 } },
    { uid: 'b', username: 'B', careerScoreByNetwork: { testnet: 450, mainnet: 10 }, bestRunByNetwork: { testnet: { score: 180, level: 1 } }, rewardsByNetwork: { testnet: { highestLevel: 10 } }, bestScoreV2: { testnet: 180 } },
  ];
  let query, projection, order, limit;
  const users = { find(filter) { query = filter; return { project(value) { projection = value; return this; }, sort(value) { order = value; return this; }, limit(value) { limit = value; return this; }, async toArray() { return entries.filter(e => e.careerScoreByNetwork.testnet > 0).sort((a,b) => b.careerScoreByNetwork.testnet - a.careerScoreByNetwork.testnet); } }; } };
  const req = { query: { sort: 'career' }, get: () => 'testnet', app: { locals: { userCollection: users } } };
  const res = { json(value) { this.body = value; return this; }, status(value) { this.code = value; return this; } };
  await routes['/top'](req, res);
  assert.deepEqual(query, { 'careerScoreByNetwork.testnet': { $gt: 0 } });
  assert.deepEqual(order, { 'careerScoreByNetwork.testnet': -1, uid: 1 });
  assert.equal(projection['bestRunByNetwork.testnet'], 1);
  assert.equal(limit, 100);
  assert.equal(res.body.leaders[0].username, 'B');
  assert.deepEqual(res.body.leaders[1].bestRun, { score: 200, level: 2 });
  assert.equal(res.body.leaders[1].profileLevel, 18);
  assert.equal(res.body.leaders[1].score, 300);
});

test('expanded record level belongs to its exact score; historical and unmatched levels stay unknown', async () => {
  const entries = [
    { username: 'known', bestScore: 99, bestScoreV2: { testnet: 200 }, bestRunByNetwork: { testnet: { score: 200, level: 2 } }, rewardsByNetwork: { testnet: { highestLevel: 400 } } },
    { username: 'old', bestScore: 90, bestScoreV2: { testnet: 250 }, bestRunByNetwork: { testnet: { score: 200, level: 2 } }, rewardsByNetwork: { testnet: { highestLevel: 490 } } },
  ];
  const users = { find() { return { project() { return this; }, sort() { return this; }, limit() { return this; }, async toArray() { return entries; } }; } };
  for (const rules of ['2', '1']) {
    const req = { query: { rules }, get: () => 'testnet', app: { locals: { userCollection: users } } };
    const res = { json(value) { this.body = value; return this; }, status() { return this; } };
    await routes['/top'](req, res);
    assert.equal(res.body.leaders[0].runLevel, rules === '2' ? 2 : null);
    assert.equal(res.body.leaders[1].runLevel, null);
    assert.equal(res.body.leaders[1].profileLevel, 49);
  }
});
