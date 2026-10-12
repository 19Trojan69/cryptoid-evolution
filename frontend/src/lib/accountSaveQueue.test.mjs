import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { appendPendingSave } from './saveOutbox.ts';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('./accountSave.ts', import.meta.url), 'utf8');
const rulesSource = readFileSync(new URL('../../../backend/src/lifeRules.ts', import.meta.url), 'utf8');
function compile(source, requireModule, extras = {}) {
  const module = { exports: {} };
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(output, { module, exports: module.exports, require: requireModule, setTimeout, ...extras });
  return module.exports;
}
const rules = compile(rulesSource, () => { throw Error('Unexpected dependency'); });
const plain = value => JSON.parse(JSON.stringify(value));
function fixture(entries, limit, rejectedRun) {
  const key = 'cryptoid_save_outbox_v1_testnet_pilot-a';
  const stored = new Map([[key, JSON.stringify(entries)]]), writes = [], sent = [];
  const localStorage = { getItem: key => stored.get(key), setItem: (key, value) => { stored.set(key, value); writes.push({key,value}); } };
  const axiosClient = { async post(path, body) {
    sent.push({path,body:plain(body)});
    if (path === '/progress/recover') return { data: { recovered:true, maxHearts:limit } };
    if (rejectedRun === body.runId) throw { response: { status:400 } };
    return { data:{} };
  } };
  const exports = compile(source, id => {
    if (id === './axiosClient') return {axiosClient};
    if (id === '../pages/shipFleet') return {shipSaveNetwork:'testnet'};
    if (id === '../../../backend/src/lifeRules') return rules;
    if (id === './saveOutbox') return { appendPendingSave };
    throw Error(`Unexpected dependency: ${id}`);
  }, {localStorage});
  return {queue:exports.createSaveQueue('pilot-a'),stored,writes,sent,key};
}
const pending = (path = '/rewards/event', runId = 'old-run') => ({path,body:{runId,kind:'boss',level:1,stage:10,save:{hearts:56,shards:120,score:300,destroyed:20,weaponTimers:[0,0,4500,0,0,0]}}});

test('real save queue recovers legacy lives with the server armor limit while preserving earned rewards', async () => {
  for (const limit of [3,4,5,6]) {
    const entries = ['/rewards/event','/progress/checkpoint','/leaderboard/score'].map(path => pending(path));
    const h=fixture(entries,limit);
    await h.queue.recover();
    assert.deepEqual(h.sent[0],{path:'/progress/recover',body:{runId:'old-run'}});
    for (let i=0;i<entries.length;i++) assert.deepEqual(h.sent[i+1],{path:entries[i].path,body:{...entries[i].body,save:{...entries[i].body.save,hearts:limit}}});
    assert.equal(h.stored.get(h.key),'[]');
    assert.equal(entries[0].body.save.hearts,56);
  }
});

test('failed recovery upload retains the capped backup and its unconfirmed earnings', async () => {
  const h=fixture([pending()],3,'old-run');
  await assert.rejects(h.queue.recover());
  const saved=JSON.parse(h.stored.get(h.key));
  assert.equal(saved.length,1);
  assert.deepEqual(saved[0].body.save,{...pending().body.save,hearts:3});
  assert.equal(h.queue.durable,true);
});

test('recovering one run never rewrites pending lives belonging to another run', async () => {
  const h=fixture([pending(),pending('/rewards/event','other-run')],3,'other-run');
  await assert.rejects(h.queue.recover());
  assert.equal(h.sent[1].body.save.hearts,3);
  assert.equal(h.sent[2].body.save.hearts,56);
  assert.equal(JSON.parse(h.stored.get(h.key))[0].body.runId,'other-run');
});
