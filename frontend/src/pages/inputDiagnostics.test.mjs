import test from 'node:test';
import assert from 'node:assert/strict';
import { createInputDiagnostics, cleanInputDiagnostic, observeInputNavigation } from './inputDiagnostics.ts';
import { cleanFullData, cleanFullRecord } from './fullSessionFormat.ts';

const bounds = { left: 0, top: 0, width: 430, height: 825 };
const touch = (x, y = 700) => ({ clientX: x, clientY: y, pointerType: 'touch' });
test('inactive observers never read coordinates or clock', () => {
  const hidden = { get clientX() { throw Error('not authorized'); } };
  const d = createInputDiagnostics(() => false, () => assert.fail('unexpected evidence'), () => { throw Error('clock read'); });
  d.start(hidden, bounds); d.move(hidden); d.end('cancelled');
});
test('fast interior left swipe keeps only coarse categories and its cancellation', () => {
  let clock = 0; const rows = [];
  const d = createInputDiagnostics(() => true, row => rows.push(row), () => clock);
  d.start(touch(350), bounds); clock = 30; d.move(touch(70)); d.end('cancelled');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.at(-1), { operation: 'gesture-end', inputSource: 'touch', startRegion: 'interior',
    direction: 'left', distanceBand: 'long', speedBand: 'fast', durationBucketMs: 0,
    motionEvents: 1, endReason: 'cancelled', suppressed: 0 });
  assert.ok(!JSON.stringify(rows).includes('clientX'));
});
test('right-edge origin is distinct from interior and contact is retired after ending', () => {
  const rows = []; const d = createInputDiagnostics(() => true, row => rows.push(row), () => 0);
  d.start(touch(425), bounds); d.end('released'); d.end('capture-lost'); d.move(touch(100));
  assert.equal(rows.length, 2); assert.equal(rows[0].startRegion, 'right');
});
test('motion bursts and repeated new contacts have a bounded storage rate', () => {
  let clock = 0; const rows = []; const d = createInputDiagnostics(() => true, row => rows.push(row), () => clock);
  for (let i = 0; i < 10000; i++) { clock = i / 100; d.start(touch(350), bounds); d.move(touch(50)); d.end('released'); }
  assert.equal(rows.length, 8);
  clock = 1001; d.start(touch(300), bounds);
  assert.equal(rows.length, 9); assert.ok(rows.at(-1).suppressed > 0);
});
test('owner revocation drops the active gesture instead of retaining it for later authorization', () => {
  let active = true; const rows = []; const d = createInputDiagnostics(() => active, row => rows.push(row), () => 0);
  d.start(touch(300), bounds); active = false; d.move(touch(70)); active = true; d.end('released');
  assert.equal(rows.length, 1);
});
test('diagnostic listener errors cannot escape into steering', () => {
  const d = createInputDiagnostics(() => true, () => { throw Error('storage failed'); }, () => 0);
  assert.doesNotThrow(() => { d.start(touch(300), bounds); d.move(touch(70)); d.end('fault'); });
});
test('export strips raw coordinates, arbitrary strings, account context and hostile fields', () => {
  const raw = { operation: 'gesture-end', direction: 'left', inputSource: 'touch', startRegion: 'interior',
    clientX: 123, clientY: 456, pointerId: 92, url: 'private', token: 'private', score: 500,
    endReason: 'raw error', durationBucketMs: Infinity, motionEvents: -1 };
  const clean = { operation: 'gesture-end', inputSource: 'touch', startRegion: 'interior', direction: 'left' };
  assert.deepEqual(cleanInputDiagnostic(raw), clean); assert.deepEqual(cleanFullData('input', raw), clean);
  assert.deepEqual(cleanFullRecord({ seq: 1, at: 1, clockMs: 0, kind: 'input', data: raw }).data, clean);
  assert.equal(cleanInputDiagnostic({ operation: 'arbitrary' }), null);
  assert.deepEqual(cleanInputDiagnostic({ operation: 'navigation', navigation: 'popstate', state: { token: 'private' }, direction: 'left' }),
    { operation: 'navigation', navigation: 'popstate' });
});
test('navigation observation has no URL/state reads and removes all listeners', () => {
  const host = new EventTarget(), rows = [];
  const stop = observeInputNavigation(host, row => rows.push(row));
  host.dispatchEvent(new Event('popstate'));
  assert.deepEqual(rows, [{ operation: 'navigation', navigation: 'popstate' }]);
  stop(); host.dispatchEvent(new Event('hashchange')); assert.equal(rows.length, 1);
  assert.doesNotThrow(() => observeInputNavigation({}, () => {})());
});

test('a denied navigation-listener host remains inert and releases a partial registration', () => {
  const removed = [];
  let added = 0;
  const host = { addEventListener() { if (++added === 2) throw Error('host denied'); },
    removeEventListener(type) { removed.push(type); } };
  assert.doesNotThrow(() => observeInputNavigation(host, () => assert.fail('unexpected event')));
  assert.deepEqual(removed, ['popstate']);
});
