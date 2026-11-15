import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { createApiGateway } = require('../build/apiGateway.js');
const { default: mountAdminEndpoints } = require('../build/handlers/admin.js');
const { BOSS_NFT_PREVIEW_ART_REVISION } = require('../build/handlers/bossNftPreview.js');
const { arcadeRankIds } = require('../build/galaxyArcadeStickerSchema.js');
const { retroNftScenes } = require('../build/retroNftScenes.js');
const { shipNftCatalog } = require('../build/shipNftEligibility.js');
const { premiumBossCard, premiumBossEditions } = require('../build/premiumBossNft.js');
const { shipLiveryAssetPath, shipFactoryPaint } = require('../build/shipLivery.js');
const testnet = 'cryptoid-evolution-testnet.vercel.app';
const mainnet = 'cryptoid-evolution.vercel.app';
const testnetEnv = { VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: testnet };
const artworkPath = 'admin/nft-collection';
const bossExample = artworkPath + '/bosses/1/victory';

function fixture(t, env = testnetEnv, wins = {}) {
  const previous = process.env.ADMIN_PI_TESTNET_UID;
  process.env.ADMIN_PI_TESTNET_UID = 'fixture-owner';
  t.after(() => {
    if (previous === undefined) delete process.env.ADMIN_PI_TESTNET_UID;
    else process.env.ADMIN_PI_TESTNET_UID = previous;
  });
  let ownerCheck;
  let artwork;
  mountAdminEndpoints({
    use(handler) { ownerCheck = handler; },
    post() {},
    get(path, handler) { if (path === '/nft-collection/:collection/:item/:edition') artwork = handler; },
  });
  const started = [];
  const lookedUp = [];
  const backend = {
    async start(listen) { started.push(listen); },
    async app(req, res) {
      const [, , , collection, item, edition] = req.url.split('/');
      req.params = { collection, item, edition };
      req.get = name => req.headers[name];
      req.app = { locals: { userCollection: { async findOne({ uid }) {
        assert.equal(uid, req.session.currentUser.uid);
        return { rewardsByNetwork: { testnet: { bossWins: wins }, mainnet: { bossWins: { 1: 3 } } } };
      } }, bossNftPreviewCollection: {
        async findOne({ _id }) {
          lookedUp.push(_id);
          return { webp: 'UklGRfixture', story: 'Stored English artwork description' };
        },
      } } };
      let authorized = false;
      await ownerCheck(req, res, () => { authorized = true; });
      if (authorized) return artwork(req, res);
    },
  };
  const gateway = createApiGateway(async () => backend, () => env);
  return {
    started, lookedUp,
    async get(path, { uid = 'fixture-owner', method = 'GET', token = 'verified', host = testnet } = {}) {
      const res = {
        code: 200, headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        status(code) { this.code = code; return this; },
        json(body) { this.body = body; return this; },
      };
      await gateway({
        method, url: '/api/index?' + new URLSearchParams({ path }),
        headers: { host, 'x-cryptoid-app-network': 'testnet', ...(token && { authorization: `Bearer ${token}` }) },
        session: { currentUser: uid && { uid, accessToken: 'verified' }, adminMode: true },
      }, res);
      return res;
    },
  };
}

test('artwork is Testnet-only and requires a verified owner bearer; previous player routes are closed', async t => {
  const official = fixture(t);
  assert.equal((await official.get(bossExample, { token: '' })).code, 401);
  assert.equal((await official.get(bossExample, { method: 'PUT' })).code, 405);
  for (const path of ['boss-nft-preview', 'BOSS-NFT-PREVIEW/holo/1/interest', 'testnet-ship-nft-preview/progress']) {
    assert.equal((await official.get(path)).code, 404);
  }
  assert.deepEqual(official.started, []);
  assert.equal((await official.get(bossExample, { uid: '' })).code, 401);
  assert.equal((await official.get(bossExample, { uid: 'ordinary-player' })).code, 403);
  assert.equal((await official.get(bossExample, { token: 'mismatched' })).code, 401);
  assert.deepEqual(official.lookedUp, []);

  for (const env of [{ ...testnetEnv, VERCEL_PROJECT_PRODUCTION_URL: mainnet },
    { ...testnetEnv, VERCEL_ENV: 'preview' }]) {
    const blocked = fixture(t, env);
    assert.equal((await blocked.get(bossExample)).code, 404);
    assert.deepEqual(blocked.started, []);
  }
});

test('the owner can request each of the 400 variants without unlocking or buying any', async t => {
  const f = fixture(t);
  const bossIds = Array.from({ length: 50 }, (_, index) => index + 1);
  const bossVariants = bossIds.flatMap(id => ['victory', 'holo'].map(edition => [id, edition]));
  for (const [id, edition] of bossVariants) {
    const result = await f.get(`${artworkPath}/bosses/${id}/${edition}`);
    assert.equal(result.code, 200);
    assert.equal(result.headers['Cache-Control'], 'private, no-store');
    assert.match(result.body.artwork, /^data:image\/webp;base64,UklGR/);
    assert.equal(result.body.story, 'Stored English artwork description');
  }
  assert.deepEqual(f.lookedUp, bossVariants.map(([id, edition]) => `${BOSS_NFT_PREVIEW_ART_REVISION}:${edition}:${id}`));

  const hash = value => createHash('sha256').update(value).digest('hex');
  const ships = new Set();
  for (const card of shipNftCatalog) {
    const result = await f.get(`${artworkPath}/ships/${card.shipId}/${card.edition.toLowerCase()}`);
    assert.equal(result.code, 200, card.id);
    assert.match(result.body.artwork, /^data:image\/webp;base64,UklGR/);
    assert.equal(result.body.story, card.story);
    ships.add(hash(result.body.artwork));
  }
  assert.equal(ships.size, 60);

  const scenes = new Set();
  let retroVariants = 0;
  for (const level of Object.keys(retroNftScenes)) {
    const ranks = new Set();
    for (const rank of arcadeRankIds) {
      const result = await f.get(`${artworkPath}/retro/${level}/${rank}`);
      assert.equal(result.code, 200, `${level}/${rank}`);
      assert.match(result.body.artwork, /^data:image\/webp;base64,UklGR/);
      ranks.add(hash(result.body.artwork));
      retroVariants++;
    }
    assert.equal(ranks.size, 1);
    scenes.add([...ranks][0]);
  }
  assert.equal(scenes.size, 40);
  assert.equal(retroVariants, 240);
  assert.equal(ships.size + bossVariants.length + retroVariants, 400);

  for (const path of ['bosses/51/victory', 'bosses/1/free', 'ships/grey-scout/invalid', 'retro/205/diamond', 'retro/5/holo']) {
    assert.equal((await f.get(`${artworkPath}/${path}`)).code, 404, path);
  }
});

test('premium catalog contains 100 unique boss editions with verified ship assets and consistent prices', () => {
  const designs = new Set();
  const scenes = new Set();
  const captions = new Set();
  const platinumShips = new Set();
  const diamondShips = new Set();
  for (let boss = 1; boss <= 50; boss++) {
    const platinum = premiumBossCard(boss, 'platinum');
    const diamond = premiumBossCard(boss, 'diamond');
    assert.notEqual(platinum.shipId, 'pi-vanguard');
    assert.notEqual(platinum.shipId, diamond.shipId);
    assert.notEqual(platinum.battle, diamond.battle);
    platinumShips.add(platinum.shipId);
    diamondShips.add(diamond.shipId);
    for (const card of [platinum, diamond]) {
      designs.add(card.id);
      scenes.add(card.battle);
      captions.add(card.story);
      const ship = shipNftCatalog.find(entry => entry.shipId === card.shipId && entry.stage === card.stage);
      assert.ok(ship, card.id);
      const path = shipLiveryAssetPath(ship.sprite, card.stage, shipFactoryPaint(card.shipId).id);
      assert.ok(existsSync(new URL(`../../frontend/public/${path}`, import.meta.url)), card.id);
    }
  }
  assert.equal(designs.size, 100);
  assert.equal(scenes.size, 100);
  assert.equal(captions.size, 100);
  assert.ok(platinumShips.size >= 15 && diamondShips.size >= 15);
  assert.equal(premiumBossCard(1, 'platinum').shipId, 'solar-lance');
  assert.equal(premiumBossCard(1, 'diamond').shipId, 'pi-vanguard');
  assert.equal(premiumBossEditions.platinum.pricePi, 25);
  assert.equal(premiumBossEditions.diamond.pricePi, 50);
  assert.equal(premiumBossEditions.platinum.supply, 628);
  assert.equal(premiumBossEditions.diamond.supply, 314);
});

test('other premium cards remain silhouettes and purchase eligibility requires wins against that boss', async t => {
  const wins = { 1: 3 };
  const f = fixture(t, testnetEnv, wins);
  const preview = async (boss, edition, count, eligible) => {
    const reply = await f.get(`${artworkPath}/bosses/${boss}/${edition}`);
    assert.equal(reply.code, 200);
    assert.deepEqual(reply.body, { wins: count, eligible, design: 'silhouette' });
  };
  for (let boss = 2; boss <= 50; boss++) {
    await preview(boss, 'platinum', 0, false);
    wins[boss] = 2;
    await preview(boss, 'platinum', 2, true);
    await preview(boss, 'diamond', 2, false);
    wins[boss] = 3;
    await preview(boss, 'diamond', 3, true);
  }
  assert.equal((await f.get(artworkPath + '/bosses/51/diamond')).code, 404);
  assert.equal((await f.get(artworkPath + '/bosses/1/platinum', { uid: 'other-player' })).code, 403);
  assert.equal((await f.get(artworkPath + '/bosses/1/diamond', { token: '' })).code, 401);
  assert.equal((await f.get(artworkPath + '/bosses/2/diamond', { method: 'POST' })).code, 405);
});

test('a verified Testnet admin sees both Varneth illustrations even with zero wins', {
  skip: !process.env.PREMIUM_NFT_ART_KEY,
}, async t => {
  const wins = { 2: 3 };
  const f = fixture(t, testnetEnv, wins);
  for (const edition of ['platinum', 'diamond']) {
    const path = `${artworkPath}/bosses/1/${edition}`;
    const reply = await f.get(path);
    assert.equal(reply.code, 200);
    assert.equal(reply.body.design, 'illustration');
    assert.match(reply.body.artwork, /^data:image\/webp;base64,UklGR/);
    assert.equal(reply.body.wins, 0);
    assert.equal(reply.body.eligible, false);
    assert.equal(reply.headers['Cache-Control'], 'private, no-store');
    wins[1] = premiumBossEditions[edition].requiredWins;
    const after = await f.get(path);
    assert.equal(after.code, 200);
    assert.deepEqual(after.body, { ...reply.body, wins: wins[1], eligible: true });
    delete wins[1];
  }
});
