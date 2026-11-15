import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { createApiGateway } = require('../build/apiGateway.js');
const { default: mountAdminEndpoints } = require('../build/handlers/admin.js');
const { BOSS_NFT_PREVIEW_ART_REVISION } = require('../build/handlers/bossNftPreview.js');
const { arcadeRankIds } = require('../build/galaxyArcadeStickerSchema.js');
const { retroNftScenes } = require('../build/retroNftScenes.js');
const { shipNftCatalog } = require('../build/shipNftEligibility.js');
const testnet = 'cryptoid-evolution-testnet.vercel.app';
const mainnet = 'cryptoid-evolution.vercel.app';
const testnetEnv = { VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: testnet };
const artworkPath = 'admin/nft-collection';
const bossExample = artworkPath + '/bosses/1/victory';

function fixture(t, env = testnetEnv) {
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
      req.app = { locals: { bossNftPreviewCollection: {
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
