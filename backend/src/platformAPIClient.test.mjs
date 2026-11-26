import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const path = require.resolve('../build/services/platformAPIClient.js');
const env = require('../build/environments.js').default;

function clients(t, { mainnet, testnet = 'testnet-fixture-key', legacy = 'legacy-fixture-key' } = {}) {
  const previous = { mainnet: process.env.PI_MAINNET_API_KEY, testnet: env.pi_testnet_api_key, legacy: env.pi_api_key, module: require.cache[path] };
  if (mainnet === undefined) delete process.env.PI_MAINNET_API_KEY; else process.env.PI_MAINNET_API_KEY = mainnet;
  env.pi_testnet_api_key = testnet; env.pi_api_key = legacy;
  delete require.cache[path];
  t.after(() => {
    if (previous.mainnet === undefined) delete process.env.PI_MAINNET_API_KEY; else process.env.PI_MAINNET_API_KEY = previous.mainnet;
    env.pi_testnet_api_key = previous.testnet; env.pi_api_key = previous.legacy;
    if (previous.module) require.cache[path] = previous.module; else delete require.cache[path];
  });
  return require(path);
}

test('Mainnet operations use the explicit server key while Testnet stays on its separate key', t => {
  const api = clients(t, { mainnet: 'mainnet-fixture-key' });
  const mainnet = api.platformAPIClientForRequest({ headers: {} });
  const testnet = api.platformAPIClientForRequest({ headers: { 'x-cryptoid-app-network': 'testnet' } });
  assert.equal(mainnet.defaults.headers.Authorization, 'Key mainnet-fixture-key');
  assert.equal(testnet.defaults.headers.Authorization, 'Key testnet-fixture-key');
  assert.notEqual(mainnet, testnet);
  assert.equal(api.default.defaults.headers.Authorization, 'Key legacy-fixture-key');
});

test('legacy recovery client remains available without enabling missing Mainnet readiness', async t => {
  const api = clients(t);
  assert.equal(api.platformAPIClientForRequest({ headers: {} }), api.default);
  const { inspectMainnetReadiness } = require('../build/mainnetRelease.js');
  assert.equal((await inspectMainnetReadiness({ app: { locals: {} } })).ready, false);
});

test('missing Testnet key never falls back to the legacy or Mainnet credential', t => {
  const api = clients(t, { mainnet: 'mainnet-fixture-key', testnet: '' });
  assert.throws(() => api.platformAPIClientForRequest({ headers: { 'x-cryptoid-app-network': 'testnet' } }), /not configured/);
});
