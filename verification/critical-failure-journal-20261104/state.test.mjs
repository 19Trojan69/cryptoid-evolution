import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrief, readBrief, BRIEF_KEY } from '../boss2-brief-report-20261030/briefState.mjs';
import { createCriticalJournal, readCriticalJournal, CRITICAL_KEY, CRITICAL_KINDS, MAX_CHARACTERS,
  safeErrorName, safeErrorSite } from './criticalState.mjs';
import { browserSource, appSource, proof } from './transform.mjs';

const source = '1'.repeat(40);
function fixture() {
  const data = new Map(), writes = [];
  let at = 1000;
  const storage = { getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { writes.push({ key, at, length: value.length }); data.set(key, value); } };
  const options = { storage, source, now: () => at, documentStartedAt: 100 };
  const clock = (id = 'run-1', elapsedMs = 0, mode = 'running') =>
    ({ id, source, startedAt: 1000, updatedAt: at, elapsedMs, unobservedGaps: 0, mode });
  return { data, writes, storage, options, clock, advance: ms => at += ms };
}
test('a real legacy persistence gap is reproduced and the new first error survives it', () => {
  const f = fixture(), legacy = createBrief(f.options), journal = createCriticalJournal(f.options);
  legacy.checkpoint(f.clock(), {}); journal.checkpoint(f.clock()); f.advance(1);
  const error = { kind: 'error', errorName: 'TypeError', target: 'document', trusted: true, route: 'game' };
  legacy.record(error, true); journal.record(error);
  assert.equal(readBrief(f.storage).latest.events.some(e => e.kind === 'error'), false);
  assert.equal(legacy.snapshot().latest.events.some(e => e.kind === 'error'), true);
  assert.equal(readCriticalJournal(f.storage).latest.events.error.first.errorName, 'TypeError');
  assert.equal(f.writes.filter(w => w.key === CRITICAL_KEY).length, 2);
});
test('gesture throttle and ordinary ring eviction do not remove the first critical error', () => {
  const f = fixture(), legacy = createBrief(f.options), journal = createCriticalJournal(f.options);
  legacy.checkpoint(f.clock(), {}); journal.checkpoint(f.clock()); f.advance(1);
  for (let i = 0; i < 8; i++) legacy.record({ kind: 'pointercancel', target: 'field' }, true);
  legacy.record({ kind: 'error', errorName: 'TypeError' }, true); legacy.flush(true);
  assert.equal(readBrief(f.storage).latest.events.some(e => e.kind === 'error'), false);
  journal.record({ kind: 'error', errorName: 'TypeError', route: 'game' });
  for (let second = 0; second < 10; second++) {
    f.advance(1000);
    for (let i = 0; i < 16; i++) {
      legacy.record({ kind: 'pointerdown', target: 'field' });
      journal.record({ kind: 'pointerdown', target: 'field' });
    }
  }
  assert.equal(readCriticalJournal(f.storage).latest.events.error.count, 1);
  assert.deepEqual(Object.keys(journal.snapshot().latest.events), ['error']);
});
test('repeated errors retain first and last/count, with bounded writes and forced pagehide', () => {
  const f = fixture(), journal = createCriticalJournal(f.options);
  journal.checkpoint(f.clock());
  for (let i = 0; i < 5000; i++) { f.advance(1); journal.record({ kind: 'error', errorName: 'TypeError' }); }
  assert.ok(f.writes.length <= 7, 'No per-error storage flood');
  journal.record({ kind: 'pagehide', persisted: false });
  const run = readCriticalJournal(f.storage).latest;
  assert.equal(run.events.error.count, 5000);
  assert.equal(run.events.error.first.at, 1001); assert.equal(run.events.error.last.at, 6000);
  assert.equal(run.events.pagehide.last.persisted, false);
});
test('normal clock checkpoints add no periodic storage writes; ended is saved', () => {
  const f = fixture(), journal = createCriticalJournal(f.options);
  journal.checkpoint(f.clock());
  for (let i = 1; i <= 1000; i++) { f.advance(1000); journal.checkpoint(f.clock('run-1', i*1000)); }
  assert.equal(f.writes.length, 1);
  assert.equal(readCriticalJournal(f.storage).latest.clock.elapsedMs, 0);
  journal.checkpoint(f.clock('run-1', 1000000, 'ended'));
  assert.equal(f.writes.length, 2);
  journal.record({ kind: 'error' });
  assert.equal(readCriticalJournal(f.storage).latest.clock.mode, 'ended');
  assert.deepEqual(readCriticalJournal(f.storage).latest.events, {});
});
test('a new document cannot resume a saved run or misattribute its initial error', () => {
  const f = fixture(), journal = createCriticalJournal(f.options);
  journal.checkpoint(f.clock()); journal.record({ kind: 'error', errorName: 'RangeError' });
  const next = createCriticalJournal({ ...f.options, documentStartedAt: 2000 });
  next.checkpoint(f.clock()); next.record({ kind: 'pagehide' });
  assert.equal(next.snapshot().latest.documentStartedAt, 100);
  assert.equal(next.snapshot().latest.events.pagehide, undefined);
  next.checkpoint(f.clock('run-2')); next.record({ kind: 'blur' });
  next.checkpoint(f.clock('run-3'));
  assert.equal(next.snapshot().latest.clock.id, 'run-3');
  assert.equal(next.snapshot().previous.clock.id, 'run-2');
});
test('all seven maximum-size event slots for two runs fit the hard character bound', () => {
  const f = fixture(), journal = createCriticalJournal(f.options);
  for (const id of ['a'.repeat(100), 'b'.repeat(100)]) {
    journal.checkpoint({ ...f.clock(id, 600000000), updatedAt: Number.MAX_SAFE_INTEGER });
    for (const kind of CRITICAL_KINDS) {
      const fields = { kind, script: 'a'.repeat(120)+'.js', line: 999999999, column: 999999999,
        errorName: 'QuotaExceededError', persisted: false, trusted: true, route: 'other' };
      journal.record(fields); f.advance(1); journal.record(fields);
    }
    journal.flush(true);
  }
  const raw = f.storage.getItem(CRITICAL_KEY);
  assert.ok(raw.length <= MAX_CHARACTERS); assert.equal(journal.snapshot().storageAvailable, true);
  for (const run of [readCriticalJournal(f.storage).latest, readCriticalJournal(f.storage).previous])
    assert.equal(Object.keys(run.events).length, 7);
});
test('quota, denied storage, missing metadata and opaque rejections do not break recording', () => {
  const f = fixture(), storage = { getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } };
  const journal = createCriticalJournal({ ...f.options, storage });
  assert.doesNotThrow(() => { journal.checkpoint(f.clock()); journal.record({ kind: 'error' }); journal.flush(true); });
  assert.equal(journal.snapshot().storageAvailable, false);
  assert.equal(readCriticalJournal(storage).storage, 'unavailable');
  assert.equal(safeErrorName('private-rejection-text'), 'NonErrorRejection');
  assert.equal(safeErrorName({ get name() { throw Error('getter'); } }), 'UnknownError');
  assert.equal(safeErrorName(new TypeError('private-error-text')), 'TypeError');
});
test('only whitelisted non-sensitive metadata survives; URL query and stack never do', () => {
  const f = fixture(), journal = createCriticalJournal(f.options);
  journal.checkpoint(f.clock());
  journal.record({ kind: 'unhandledrejection', errorName: 'Custom-private-name', message: 'secret-message',
    stack: 'private-stack', filename: 'https://private.example/secret', route: '/private-path', account: 'private-account' });
  const raw = f.storage.getItem(CRITICAL_KEY);
  assert.doesNotMatch(raw, /secret|private|Custom-/);
  const host = { URL, location: { href: 'https://example.test/game?share=secret', origin: 'https://example.test', pathname: '/game' } };
  assert.deepEqual(safeErrorSite({ filename: 'https://example.test/assets/game-abcd.js?share=secret', lineno: 17, colno: 3 }, host),
    { line: 17, column: 3, script: 'game-abcd.js' });
  assert.deepEqual(safeErrorSite({ filename: 'https://private.example/assets/private.js', lineno: 17 }, host), { line: 17 });
  assert.deepEqual(safeErrorSite({ get lineno() { throw Error('getter'); } }, host), {});
});
test('corrupt, oversized and foreign source records cannot create a live attribution', () => {
  const f = fixture(); f.data.set(CRITICAL_KEY, 'x'.repeat(MAX_CHARACTERS+1));
  assert.equal(readCriticalJournal(f.storage).storage, 'invalid');
  const journal = createCriticalJournal(f.options);
  journal.checkpoint({ ...f.clock(), source: '2'.repeat(40) }); journal.record({ kind: 'error' });
  assert.equal(journal.snapshot().latest, null);
  f.data.set(CRITICAL_KEY, '{invalid'); assert.equal(readCriticalJournal(f.storage).storage, 'unavailable');
  assert.equal(f.data.has(BRIEF_KEY), false);
});
test('the exact private-module transforms are reversible and add no listener, clock or timer', () => {
  const browser = readFileSync(new URL('../boss2-brief-report-20261030/briefBrowser.mjs', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../boss2-forensics-20261028/devicePreviewApp.jsx', import.meta.url), 'utf8');
  const b = browserSource(browser), a = appSource(app), p = proof(browser, app);
  assert.equal(p.exactReversalVerified, true);
  assert.equal(b.match(/addEventListener\(/g).length, browser.match(/addEventListener\(/g).length);
  assert.equal(b.match(/removeEventListener\(/g).length, browser.match(/removeEventListener\(/g).length);
  assert.doesNotMatch(b, /setTimeout|setInterval|requestAnimationFrame|preventDefault|stopPropagation/);
  assert.match(a, /criticalMatchesLatestStopwatch/);
  assert.throws(() => browserSource(browser+'\n'));
  assert.throws(() => appSource(app+'\n'));
});
