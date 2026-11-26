import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { supportedLanguages } from '../locales/config.ts';
import { usageEvidenceKeys, usageEvidenceTranslations } from '../locales/usageEvidence.ts';

async function collector() {
  let now = 0;
  const sent = [], intervals = [], events = new Map();
  const document = {
    hidden: false,
    addEventListener(name, action) { events.set(name, action); },
    querySelector() { return { getAttribute: () => 'false' }; },
  };
  const location = { pathname: '/' };
  const source = fs.readFileSync(new URL('./aggregateUsage.ts', import.meta.url), 'utf8')
    .replace('import { getBaseURL } from "./axiosClient";', 'const getBaseURL = () => "/api";');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports: {}, document, location,
    navigator: { userAgent: 'PiBrowser' }, performance: { now: () => now },
    window: { addEventListener(name, action) { events.set(name, action); } },
    setInterval(action) { intervals.push(action); },
    fetch(url, options) { sent.push({ url, ...options, body: JSON.parse(options.body) }); return Promise.resolve({}); },
  };
  vm.runInNewContext(compiled, context);
  await context.exports.startAggregateUsage();
  return { context, sent, document, location, events, intervals,
    advance(ms) { now += ms; intervals[0](); },
    interactAfter(ms, event = 'pointerdown') { now += ms; events.get(event)(); },
  };
}

test('anonymous usage sends only counters without credentials, identifiers, URLs or storage', async () => {
  const host = await collector();
  await host.context.exports.startAggregateUsage();
  assert.equal(host.intervals.length, 1);
  assert.equal(host.sent.length, 1);
  host.location.pathname = '/game';
  host.advance(30_000); // Changing route discards the partial interval.
  host.events.get('pointerdown')();
  host.advance(30_000);
  assert.equal(host.sent.length, 2);
  for (const request of host.sent) {
    assert.equal(request.url, '/api/usage/collect');
    assert.equal(request.credentials, 'omit');
    assert.equal(request.referrerPolicy, 'no-referrer');
    assert.deepEqual(Object.keys(request.headers), ['Content-Type']);
    assert.deepEqual(Object.keys(request.body).sort(), request.body.kind === 'visit' ? ['browser', 'kind'] : ['browser', 'kind', 'playing', 'seconds']);
  }
  assert.equal(host.sent[1].body.playing, true);
  assert.equal(host.sent[1].body.seconds, 30);
  host.advance(30_000); // Only the last half of the 60-second activity window.
  const beforeIdle = host.sent.length;
  host.advance(30_000);
  assert.equal(host.sent.length, beforeIdle);
  host.document.hidden = true;
  host.events.get('visibilitychange')();
  host.advance(30_000);
  assert.equal(host.sent.length, beforeIdle);
  host.document.hidden = false;
  host.location.pathname = '/admin';
  host.events.get('visibilitychange')();
  host.advance(30_000);
  assert.equal(host.sent.length, beforeIdle);
});

test('resuming input after the idle cutoff does not backfill idle time between ticks', async () => {
  for (const event of ['pointerdown', 'pointermove', 'keydown', 'touchmove', 'pageshow']) {
    const host = await collector();
    host.advance(30_000);
    host.advance(30_000);
    const beforeResume = host.sent.filter(request => request.body.kind === 'active');
    assert.equal(beforeResume.reduce((sum, request) => sum + request.body.seconds, 0), 60);

    host.interactAfter(15_000, event); // Input at t75; t60–75 was beyond the idle cutoff.
    host.advance(15_000); // Existing interval at t90 sees only t75–90 as active.
    const resumed = host.sent.filter(request => request.body.kind === 'active');
    assert.equal(resumed.at(-1).body.seconds, 15, event);
    assert.equal(resumed.reduce((sum, request) => sum + request.body.seconds, 0), 75, event);

    host.advance(30_000);
    assert.equal(host.sent.at(-1).body.seconds, 30, `${event}: later active intervals retain their usual bound`);
  }
});

test('evidence limits are translated for all 19 supported languages', () => {
  assert.equal(Object.keys(supportedLanguages).length, 19);
  for (const locale of Object.keys(supportedLanguages)) {
    assert.deepEqual(Object.keys(usageEvidenceTranslations[locale]), [...usageEvidenceKeys]);
    for (const key of usageEvidenceKeys) assert.equal(typeof usageEvidenceTranslations[locale][key], 'string', `${locale}/${key}`);
  }
});
