import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const mount = require('../../build/handlers/admin.js').default;
let guard, reset;
mount({ use(handler) { guard = handler; }, post(path, handler) { if (path === '/scores/reset') reset = handler; }, get() {} });

const invoke = async (session, network, body, users) => {
  const req = { session, body, headers: { 'x-cryptoid-app-network': network }, get: () => network, app: { locals: { userCollection: users } } };
  let code = 200, payload;
  const res = { setHeader() {}, status(value) { code = value; return this; }, json(value) { payload = value; return this; } };
  let allowed = false;
  await guard(req, res, () => { allowed = true; });
  if (allowed) await reset(req, res);
  return { code, payload };
};

test('owner reset requires typed identity, affects only this network and never touches inventory or other users', async () => {
  const oldMainnet = process.env.ADMIN_PI_UID, oldTestnet = process.env.ADMIN_PI_TESTNET_UID;
  process.env.ADMIN_PI_UID = 'owner-main'; process.env.ADMIN_PI_TESTNET_UID = 'owner-test';
  try {
    const owner = { uid: 'owner-test', username: '19Trojan69', careerScoreByNetwork: { testnet: 350, mainnet: 900 }, bestRunByNetwork: { testnet: { score: 200, level: 2 } }, bestScoreV2: { testnet: 200, mainnet: 800 }, bestScore: 1200, playerByNetwork: { testnet: { activeRunId: null, balance: 99 } } };
    const other = { uid: 'other', careerScoreByNetwork: { testnet: 700 } };
    const users = { async updateOne(filter, update) {
      assert.deepEqual(filter, { uid: owner.uid, 'playerByNetwork.testnet.activeRunId': null });
      if (owner.playerByNetwork.testnet.activeRunId) return { matchedCount: 0 };
      for (const [path, value] of Object.entries(update.$set)) {
        const [key, network] = path.split('.'); owner[key][network] = value;
      }
      return { matchedCount: 1 };
    } };
    const session = { currentUser: { uid: 'owner-test', username: '19Trojan69' } };
    const body = { network: 'testnet', confirmUsername: '19Trojan69', confirm: true };
    assert.equal((await invoke({ currentUser: { uid: 'other', username: '19Trojan69' } }, 'testnet', body, users)).code, 403);
    assert.equal((await invoke(session, 'testnet', { ...body, network: 'mainnet' }, users)).code, 400);
    assert.equal((await invoke(session, 'testnet', { ...body, confirmUsername: 'other' }, users)).code, 400);
    owner.playerByNetwork.testnet.activeRunId = 'run';
    assert.equal((await invoke(session, 'testnet', body, users)).code, 409);
    owner.playerByNetwork.testnet.activeRunId = null;
    assert.equal((await invoke(session, 'testnet', body, users)).code, 200);
    assert.equal(owner.careerScoreByNetwork.testnet, 0);
    assert.deepEqual(owner.bestRunByNetwork.testnet, { score: 0, level: null });
    assert.equal(owner.bestScoreV2.testnet, 0);
    assert.equal(owner.careerScoreByNetwork.mainnet, 900);
    assert.equal(owner.bestScoreV2.mainnet, 800);
    assert.equal(owner.bestScore, 1200);
    assert.equal(owner.playerByNetwork.testnet.balance, 99);
    assert.equal(other.careerScoreByNetwork.testnet, 700);
  } finally {
    if (oldMainnet === undefined) delete process.env.ADMIN_PI_UID; else process.env.ADMIN_PI_UID = oldMainnet;
    if (oldTestnet === undefined) delete process.env.ADMIN_PI_TESTNET_UID; else process.env.ADMIN_PI_TESTNET_UID = oldTestnet;
  }
});
