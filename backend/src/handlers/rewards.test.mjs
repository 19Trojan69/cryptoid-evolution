import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const mountRewardEndpoints = require('../../build/handlers/rewards.js').default;

const routes = {};
mountRewardEndpoints({ get: (path, handler) => { routes[`GET ${path}`] = handler; }, post: (path, handler) => { routes[`POST ${path}`] = handler; } });

test('signed-in rewards follow mission order and Testnet stays separate from Mainnet', async () => {
  const users = new Map([
    ['pilot-a', { uid: 'pilot-a', rewardRunId: { testnet: 'run-a' }, rewardEventKeys: { testnet: [] } }],
    ['pilot-b', { uid: 'pilot-b', rewardRunId: { testnet: 'run-b' }, rewardEventKeys: { testnet: [] } }],
  ]);
  const collection = {
    async findOne({ uid }) { return structuredClone(users.get(uid) ?? null); },
    async updateOne(filter, update) {
      const user = users.get(filter.uid);
      const network = Object.keys(filter).find(key => key.startsWith('rewardRunId.')).split('.')[1];
      if (!user || user.rewardRunId?.[network] !== filter[`rewardRunId.${network}`] || user.rewardEventKeys?.[network]?.includes(filter[`rewardEventKeys.${network}`].$ne)) return { modifiedCount: 0 };
      const version = filter[`rewardVersion.${network}`];
      if (version?.$exists === false ? user.rewardVersion?.[network] !== undefined : user.rewardVersion?.[network] !== version) return { modifiedCount: 0 };
      user.rewardsByNetwork ??= {};
      user.rewardVersion ??= {};
      user.rewardEventKeys ??= {};
      user.rewardsByNetwork[network] = structuredClone(update.$set[`rewardsByNetwork.${network}`]);
      user.rewardVersion[network] = update.$set[`rewardVersion.${network}`];
      user.rewardEventKeys[network] ??= [];
      user.rewardEventKeys[network].push(update.$addToSet[`rewardEventKeys.${network}`]);
      return { modifiedCount: 1 };
    },
  };
  const call = async (uid, runId, body, method = 'POST', network = 'testnet') => {
    const req = { session: { currentUser: { uid }, scoreRun: { id: runId, startedAt: Date.now() }, adminMode: false }, body, get: name => name === 'x-cryptoid-app-network' ? network : undefined, app: { locals: { userCollection: collection } } };
    const res = { code: 200, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
    await routes[`${method} ${method === 'POST' ? '/event' : '/me'}`](req, res);
    return res;
  };

  assert.equal((await call('pilot-a', 'run-a', { runId: 'run-a', kind: 'boss', level: 1, stage: 10 })).code, 409);
  for (let stage = 1; stage <= 9; stage++) {
    const block = await call('pilot-a', 'run-a', { runId: 'run-a', kind: 'block', level: 1, stage });
    assert.equal(block.body.progress.linkedBlocks[1], stage);
  }
  assert.equal((await call('pilot-a', 'run-a', { runId: 'run-a', kind: 'chain', level: 1, stage: 9 })).body.awarded, true);
  assert.equal((await call('pilot-a', 'run-a', { runId: 'run-a', kind: 'chain', level: 1, stage: 9 })).body.awarded, false);
  const boss = await call('pilot-a', 'run-a', { runId: 'run-a', kind: 'boss', level: 1, stage: 10 });
  assert.equal(boss.body.progress.bossWins[1], 1);
  assert.equal(boss.body.rank, 'Pilot');
  assert.equal((await call('pilot-a', 'run-a', { runId: 'run-b', kind: 'bonus', level: 1, stage: 10, hits: 12 })).code, 403);
  assert.equal((await call('pilot-a', 'run-a', { runId: 'run-a', kind: 'bonus', level: 1, stage: 10, hits: 12 })).body.progress.bonusMedals[1], 'gold');
  assert.equal((await call('pilot-a', 'run-a', null, 'GET')).body.progress.perfectBonuses, 1);
  assert.equal((await call('pilot-b', 'run-b', null, 'GET')).body.progress.bossWins[1], undefined);
  const mainnet = await call('pilot-a', 'run-a', null, 'GET', 'mainnet');
  assert.equal(mainnet.body.network, 'mainnet');
  assert.equal(mainnet.body.progress.highestLevel, 1);
  assert.deepEqual(mainnet.body.progress.bossWins, {});
  assert.equal((await call('pilot-a', 'run-a', { runId: 'run-a', kind: 'block', level: 1, stage: 1 }, 'POST', 'mainnet')).code, 403);
  users.get('pilot-a').rewardRunId.mainnet = 'mainnet-run';
  users.get('pilot-a').rewardEventKeys.mainnet = [];
  assert.equal((await call('pilot-a', 'mainnet-run', { runId: 'mainnet-run', kind: 'block', level: 1, stage: 1 }, 'POST', 'mainnet')).body.progress.linkedBlocks[1], 1);
  assert.equal((await call('pilot-a', 'run-a', null, 'GET')).body.progress.bonusMedals[1], 'gold');
});
