import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';

const require = createRequire(import.meta.url), ts = require('typescript');
const project = new URL('../../', import.meta.url).pathname;
const source = readFileSync(new URL('./accountSave.ts', import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function fixture({ transport, automaticTime = true } = {}) {
  const startedAt = 1_000_000;
  let now = startedAt + 56_000;
  const cache = new Map(), timers = [], waits = [], sent = [], stored = new Map(), writes = [];
  let scheduled;
  const timerScheduled = new Promise(resolve => { scheduled = resolve; });
  class ClockDate extends Date {
    constructor(value) { super(value === undefined ? now : value); }
    static now() { return now; }
  }
  function compile(contents, localRequire, extras = {}) {
    const module = { exports: {} };
    const output = ts.transpileModule(contents, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(output, { module, exports: module.exports, require: localRequire, Date: ClockDate, console, ...extras });
    return module.exports;
  }
  function load(path) {
    if (cache.has(path)) return cache.get(path);
    const exports = compile(readFileSync(path, 'utf8'), id => {
      if (id.startsWith('.')) return load(resolve(dirname(path), id.endsWith('.ts') ? id : id + '.ts'));
      return require(id);
    });
    cache.set(path, exports);
    return exports;
  }
  const backendRoot = resolve(project, '../backend/src');
  const { firstMissionSnapshot, emptyPlayerSave, readSnapshot } = load(resolve(backendRoot, 'playerSave.ts'));
  const { validRunScore } = load(resolve(backendRoot, 'leaderboardRules.ts'));
  const shardRules = load(resolve(project, 'src/pages/shardEarnings.ts'));
  const { bonusReward } = compile(readFileSync(resolve(project, 'src/pages/bonusChallenge.ts'), 'utf8'), id => {
    if (id === './shardEarnings.ts') return shardRules;
    if (id === './shipFleet.ts') return { playerColors: [] }; // Unused graphics data in this scoring-only control.
    throw Error('Unexpected bonus dependency: ' + id);
  });
  const comboRules = load(resolve(project, 'src/pages/doubleKillCombo.ts'));
  const snapshot = firstMissionSnapshot(6);
  const runState = { ...snapshot, combo: comboRules.createDoubleKillCombo() };
  for (let i = 0; i < 12; i++) {
    comboRules.creditComboDefeat(runState, shardRules.BONUS_TARGET_SHARD_REWARD, i * 1_000);
    runState.score += 150;
  }
  const bonus = bonusReward(12, 40);
  runState.score += bonus.points;
  runState.shards += bonus.shards;
  const { combo, ...earned } = runState;
  earned.comboTotal = combo.total;
  const run = { id: 'local-retry-run', startedAt, scoreBase: 0, shardsBase: 0, unlockedWeaponLevels: [1], rulesVersion: 2 };
  const player = { ...emptyPlayerSave(), activeRunId: run.id, lastStart: { armorBonus: 3, runMeta: run },
    mission: { sector: 40, phase: 'bonus', snapshot, savedAt: new ClockDate().toISOString() } };
  const user = { uid: 'local-retry-pilot', playerByNetwork: { testnet: player }, rewardRunId: { testnet: run.id }, rewardEventKeys: { testnet: ['boss:4'] } };
  const get = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
  const set = (object, path, value) => {
    const keys = path.split('.'), key = keys.pop();
    const parent = keys.reduce((value, key) => value[key] ??= {}, object);
    parent[key] = plain(value);
  };
  const collection = {
    async findOne({ uid }) { return uid === user.uid ? plain(user) : null; },
    async updateOne(filter, update) {
      for (const [key, wanted] of Object.entries(filter)) {
        const actual = get(user, key);
        if (wanted && typeof wanted === 'object') {
          if ('$exists' in wanted && (actual !== undefined) !== wanted.$exists) return { modifiedCount: 0 };
          if ('$ne' in wanted && (Array.isArray(actual) ? actual.includes(wanted.$ne) : actual === wanted.$ne)) return { modifiedCount: 0 };
        } else if (actual !== wanted) return { modifiedCount: 0 };
      }
      for (const [key, value] of Object.entries(update.$set || {})) set(user, key, value);
      for (const [key, value] of Object.entries(update.$inc || {})) set(user, key, (get(user, key) || 0) + value);
      for (const [key, value] of Object.entries(update.$max || {})) set(user, key, Math.max(get(user, key) || 0, value));
      for (const [key, value] of Object.entries(update.$addToSet || {})) {
        const values = value?.$each || [value];
        set(user, key, [...new Set([...(get(user, key) || []), ...values])]);
      }
      writes.push(plain(update));
      return { modifiedCount: 1 };
    },
  };
  const routes = {};
  load(resolve(backendRoot, 'handlers/rewards.ts')).default({ get(path, handler) { routes['GET ' + path] = handler; }, post(path, handler) { routes['POST ' + path] = handler; } });
  const endpoint = async body => {
    const req = { session: { currentUser: { uid: user.uid }, scoreRun: run, adminMode: false }, body,
      get: name => name === 'x-cryptoid-app-network' ? 'testnet' : undefined,
      app: { locals: { userCollection: collection } } };
    const res = { statusCode: 200, status(status) { this.statusCode = status; return this; }, json(body) { this.body = body; return this; } };
    await routes['POST /event'](req, res);
    return res;
  };
  const axiosClient = { async post(path, body) {
    sent.push({ path, body: plain(body), now });
    if (transport) return transport(path, body, sent.length);
    assert.equal(path, '/rewards/event');
    const response = await endpoint(body);
    if (response.statusCode >= 400) throw { response: { status: response.statusCode, data: response.body } };
    return { data: response.body };
  } };
  const exports = compile(source, id => {
    if (id === './axiosClient') return { axiosClient };
    if (id === '../pages/shipFleet') return { shipSaveNetwork: 'testnet' };
    if (id === '../../../backend/src/lifeRules') return load(resolve(backendRoot, 'lifeRules.ts'));
    if (id === './saveOutbox') return load(resolve(project, 'src/lib/saveOutbox.ts'));
    if (id === './sessionDiagnosticEvents') return { sessionDiagnostic() {} };
    throw Error('Unexpected save dependency: ' + id);
  }, { localStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) },
    setTimeout(callback, delay) {
      waits.push(delay);
      if (automaticTime) { now += delay; queueMicrotask(callback); }
      else { timers.push({ callback, delay }); scheduled(); }
    } });
  const entry = { path: '/rewards/event', body: { runId: run.id, kind: 'bonus', level: 4, stage: 40, hits: 12, save: earned } };
  const key = 'cryptoid_save_outbox_v1_testnet_local-retry-pilot';
  return { ...exports, queue: exports.createSaveQueue(user.uid), entry, key, stored, sent, waits, writes, user, player,
    readSnapshot, validRunScore, run, endpoint, timers, timerScheduled, advance() { const timer = timers.shift(); assert.ok(timer); now += timer.delay; timer.callback(); } };
}

test('real reward validator rejects a valid unchanged bonus just before its score budget becomes eligible', async () => {
  const f = fixture();
  assert.ok(f.readSnapshot(f.entry.body.save));
  assert.equal(f.entry.body.save.score, 4_800);
  assert.equal(f.validRunScore(4_800, f.run.startedAt, f.run.startedAt + 56_000), false);
  assert.equal(f.validRunScore(4_800, f.run.startedAt, f.run.startedAt + 61_000), true);
  const rejected = await f.endpoint(f.entry.body);
  assert.equal(rejected.statusCode, 400);
  assert.equal(rejected.body.error, 'invalid_save');
  assert.equal(f.writes.length, 0);
});

test('real queue retries the same reward and the real backend credits it exactly once', async () => {
  const f = fixture(), before = JSON.stringify(f.entry.body);
  await f.queue.enqueue(f.entry);
  assert.equal(f.sent.length, 2);
  assert.deepEqual(f.waits, [5_000]);
  assert.equal(JSON.stringify(f.sent[0].body), before);
  assert.equal(JSON.stringify(f.sent[1].body), before);
  assert.equal(JSON.stringify(f.entry.body), before);
  assert.equal(f.writes.length, 1);
  assert.equal(f.user.playerByNetwork.testnet.balance, f.entry.body.save.shards);
  assert.equal(f.user.playerByNetwork.testnet.totalDestroyed, 12);
  assert.equal(f.stored.get(f.key), '[]');
  const repeated = await f.endpoint(f.entry.body);
  assert.equal(repeated.statusCode, 200);
  assert.equal(repeated.body.awarded, false);
  assert.equal(f.writes.length, 1);
});

test('a permanently invalid reward exhausts bounded retries and retains the exact durable outbox', async () => {
  const f = fixture();
  f.entry.body.save.weaponTimers = [0];
  const before = JSON.stringify(f.entry);
  await assert.rejects(f.queue.enqueue(f.entry));
  assert.equal(f.sent.length, 3);
  assert.deepEqual(f.waits, [5_000, 10_000]);
  assert.equal(f.writes.length, 0);
  assert.equal(f.stored.get(f.key), '[' + before + ']');
});

test('authentication, run conflicts and other validation errors fail immediately', async () => {
  for (const [status, data] of [[401, { error: 'invalid_save' }], [403, { error: 'No active signed-in run' }],
    [409, { error: 'run_replaced' }], [400, { error: 'invalid_lives' }], [400, { error: 'invalid_save', reason: 'schema' }]]) {
    const f = fixture({ transport: async () => { throw { response: { status, data } }; } });
    await assert.rejects(f.queue.enqueue(f.entry));
    assert.equal(f.sent.length, 1);
    assert.deepEqual(f.waits, []);
    assert.equal(JSON.parse(f.stored.get(f.key)).length, 1);
  }
});

test('generic requests and combat checkpoints never opt into legacy reward retry', async () => {
  const f = fixture({ transport: async () => { throw { response: { status: 400, data: { error: 'invalid_save' } } }; } });
  await assert.rejects(f.retrySave(() => { throw { response: { status: 400, data: { error: 'invalid_save' } } }; }));
  await assert.rejects(f.queue.enqueue({ ...f.entry, path: '/progress/checkpoint' }));
  assert.equal(f.sent.length, 1);
  assert.deepEqual(f.waits, []);
});

test('existing network retry timing and total attempt bound remain intact', async () => {
  const f = fixture({ transport: async () => { throw { response: { status: 503 } }; } });
  await assert.rejects(f.queue.enqueue(f.entry));
  assert.equal(f.sent.length, 3);
  assert.deepEqual(f.waits, [600, 1_200]);
});

test('a waiting reward remains an immutable ordering barrier while unsent checkpoints coalesce', async () => {
  let first = true;
  const f = fixture({ automaticTime: false, transport: async () => {
    if (first) { first = false; throw { response: { status: 400, data: { error: 'invalid_save' } } }; }
    return { data: {} };
  } });
  const pending = f.queue.enqueue(f.entry);
  await f.timerScheduled;
  assert.equal(f.timers.length, 1);
  const checkpoint = sequence => ({ path: '/progress/checkpoint', body: { runId: f.run.id,
    combat: { stage: 41, encounter: 'normal', sequence }, save: { score: 4_800 + sequence } } });
  const second = f.queue.enqueue(checkpoint(1));
  const third = f.queue.enqueue(checkpoint(2));
  const waiting = JSON.parse(f.stored.get(f.key));
  assert.equal(waiting.length, 2);
  assert.deepEqual(waiting[0], plain(f.entry));
  assert.deepEqual(waiting[1], checkpoint(2));
  f.advance();
  await Promise.all([pending, second, third]);
  assert.deepEqual(f.sent.map(row => row.path), ['/rewards/event', '/rewards/event', '/progress/checkpoint']);
  assert.deepEqual(f.sent[0].body, f.sent[1].body);
  assert.equal(f.sent[2].body.combat.sequence, 2);
  assert.equal(f.stored.get(f.key), '[]');
});
