import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { default: mountGalaxyArcadeAccess } = require('../../build/handlers/galaxyArcadeAccess.js');
const { servePublicGalaxyArcade } = require('../../build/galaxyArcade.js');
const { arcadeEquipmentStartup, readArcadeFlightShip } = require('../../build/galaxyArcadeEquipment.js');
const key = 'ac'.repeat(32);
const flightShip = {
  modelId: 'nova-wing', stage: 1, colorId: 'metallic-red', name: 'Nova Wing · Standard',
  artwork: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
};

const response = () => ({
  code: 200, headers: {},
  setHeader(name, value) { this.headers[name] = value; },
  status(code) { this.code = code; return this; },
  json(body) { this.body = body; return this; },
  send(body) { this.body = body; return this; },
});

test('Retro Mini Game names and launches require the reached Testnet level of the verified player', async t => {
  let catalog, launch;
  mountGalaxyArcadeAccess({ get(path, handler) { catalog = handler; }, post(path, handler) { launch = handler; } }, key);
  let account = { playerByNetwork: { testnet: { highestSector: 4 }, mainnet: { highestSector: 500 } } };
  const reads = [];
  const users = { async findOne(query, options) { reads.push({ query, options }); return account; } };
  const check = async (handler, { level = '5', token = 'pilot-token', network = 'testnet', testnetSave = true } = {}) => {
    const req = {
      params: { level }, query: { lang: 'de' }, body: { reachedLevel: 500 }, testnetSave,
      get: name => name === 'authorization' ? `Bearer ${token}` : network,
      session: { currentUser: { uid: 'pilot', accessToken: 'pilot-token' } },
      app: { locals: { userCollection: users } },
    };
    const res = response();
    await handler(req, res);
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
    return res;
  };
  assert.deepEqual((await check(catalog)).body.stations, []);
  assert.equal((await check(launch)).code, 403);
  account.playerByNetwork.testnet.highestSector = 5;
  const first = await check(catalog);
  assert.equal(first.body.owner, 'pilot');
  assert.equal(first.body.levels.length, 40);
  assert.deepEqual(first.body.stations.map(({ level, name }) => [level, name]), [[5, 'Klassischer Sammelflug']]);
  assert.equal((await check(launch, { level: '10' })).code, 403);
  assert.equal((await check(launch, { level: '205' })).code, 404);
  assert.equal((await check(launch, { network: 'mainnet' })).code, 404);
  assert.equal((await check(launch, { testnetSave: false })).code, 404);
  assert.equal((await check(launch, { token: 'other-token' })).code, 401);
  assert.deepEqual((await check(catalog, { token: 'other-token' })).body.stations, []);
  const { body: { ticket } } = await check(launch);
  assert.match(ticket, /^\d{13}\.[a-f0-9]{64}$/);
  const document = (level, ticket, method = 'POST') => {
    const res = response();
    servePublicGalaxyArcade({ method, body: { ticket, ship: JSON.stringify(flightShip) } }, res, `${level}/standalone`, key, undefined, 'de');
    return res;
  };
  assert.equal(document(5, ticket).code, 503); // The fixture has no key to the actual game assets.
  assert.equal(document(10, ticket).code, 403);
  assert.equal(document(5, ticket, 'GET').code, 403);
  const now = t.mock.method(Date, 'now', () => Number(ticket.split('.')[0]));
  assert.equal(document(5, ticket).code, 403);
  now.mock.restore();

  // Older saves may only have reached-stage or completed-block reward records.
  account = { rewardsByNetwork: { testnet: { highestLevel: 1, linkedBlocks: { 9: 9 } } } };
  assert.equal((await check(catalog)).body.stations.at(-1).name, 'Phasenringe');
  assert.equal((await check(launch, { level: '90' })).code, 200);
  assert.equal((await check(launch, { level: '95' })).code, 403);
  assert.ok(reads.every(({ query, options }) => query.uid === 'pilot' &&
    Object.keys(options.projection).every(field => field.includes('.testnet'))));
});

test('arcade equipment accepts a bounded PNG and embeds the ship label as data', () => {
  assert.deepEqual(readArcadeFlightShip(JSON.stringify(flightShip)), flightShip);
  for (const invalid of [{ stage: 4 }, { modelId: 'unknown' }, { colorId: 'unknown' }, { artwork: 'https://example.com/ship.png' }])
    assert.equal(readArcadeFlightShip(JSON.stringify({ ...flightShip, ...invalid })), null);
  const oversized = Buffer.from(flightShip.artwork.split(',')[1], 'base64');
  oversized.writeUInt32BE(49, 16);
  assert.equal(readArcadeFlightShip(JSON.stringify({ ...flightShip, artwork: 'data:image/png;base64,' + oversized.toString('base64') })), null);
  const name = 'Nova Wing </script><script>alert(1)</script>';
  assert.doesNotMatch(arcadeEquipmentStartup({ ...flightShip, name }), /<\/script>/i);
});
