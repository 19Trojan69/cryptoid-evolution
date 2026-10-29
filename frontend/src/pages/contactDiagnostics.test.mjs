import test from 'node:test';
import assert from 'node:assert/strict';
import { observeContactDiagnostics, CONTACT_LIMITS } from './contactDiagnostics.ts';
import { cleanInputDiagnostic } from './inputDiagnostics.ts';
import { createCrashTail, readCrashTails } from './crashTail.ts';

function fixture() {
  const win = new EventTarget(), doc = new EventTarget(), rows = [], installed = [];
  const add = win.addEventListener.bind(win), remove = win.removeEventListener.bind(win);
  win.addEventListener = (type, handler, config) => { installed.push({ type, config }); add(type, handler, config); };
  win.removeEventListener = (type, handler, config) => { remove(type, handler, config); };
  doc.defaultView = win; doc.visibilityState = 'visible';
  const field = { ownerDocument: doc, contains: target => target === field || target?.inside === true };
  let active = true, clock = 0, steering = false;
  const options = { active: () => active, playing: () => true, steering: () => steering,
    emit: data => rows.push(data), now: () => clock };
  const fire = (type, data = {}, target = field) => {
    const event = new Event(type, { cancelable: true });
    for (const [key, value] of Object.entries({ target, ...data })) Object.defineProperty(event, key, { value });
    (type === 'visibilitychange' ? doc : win).dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
    return event;
  };
  return { field, win, doc, rows, options, fire, installed,
    active: value => { active = value; }, clock: value => { clock = value; }, steering: value => { steering = value; } };
}
const pointer = (id, primary = true) => ({ pointerId: id, pointerType: 'touch', isPrimary: primary });
test('two contacts with no previous steering are observed, including the ignored secondary pointer', () => {
  const f = fixture(), stop = observeContactDiagnostics(f.field, f.options);
  f.fire('pointerdown', pointer(901)); f.fire('touchstart', { touches: { length: 1 } });
  f.fire('pointerdown', pointer(902, false)); f.fire('touchstart', { touches: { length: 2 } });
  assert.deepEqual(f.rows.map(r => r.trackedPointers), [1, 1, 2, 2]);
  assert.equal(f.rows[2].primaryFlag, false); assert.equal(f.rows[2].steeringActive, false);
  assert.deepEqual(f.rows.filter(r => 'reportedTouches' in r).map(r => r.reportedTouches), [1, 2]);
  f.fire('pointerup', pointer(902, false), null); f.fire('pointerup', pointer(901), null);
  assert.equal(f.rows.at(-1).trackedPointers, 0);
  assert.ok(!JSON.stringify(f.rows).includes('901')); assert.ok(!JSON.stringify(f.rows).includes('pointerId'));
  stop();
});
test('disabled observation reads neither event input nor clock or controller state', () => {
  const f = fixture(); f.active(false);
  f.options.now = f.options.playing = f.options.steering = () => assert.fail('inactive read');
  const stop = observeContactDiagnostics(f.field, f.options), event = new Event('pointerdown');
  for (const key of ['target', 'pointerId', 'clientX', 'pointerType']) Object.defineProperty(event, key, { get() { assert.fail('input read'); } });
  f.win.dispatchEvent(event); assert.deepEqual(f.rows, []); stop();
});
test('no coordinates, contact geometry or pressure are read even while authorized', () => {
  const f = fixture(), stop = observeContactDiagnostics(f.field, f.options), event = new Event('pointerdown');
  for (const [key, value] of Object.entries({ target: f.field, ...pointer(7) })) Object.defineProperty(event, key, { value });
  for (const key of ['clientX', 'clientY', 'pressure', 'width', 'height', 'altitudeAngle'])
    Object.defineProperty(event, key, { get() { assert.fail('unnecessary contact detail'); } });
  f.win.dispatchEvent(event); assert.equal(f.rows.length, 1); stop();
});
test('capture loss preserves contact, cancel releases it and lifecycle reset is explicit', () => {
  const f = fixture(), stop = observeContactDiagnostics(f.field, f.options);
  f.fire('pointerdown', pointer(1)); f.steering(true);
  f.fire('lostpointercapture', pointer(1)); assert.equal(f.rows.at(-1).trackedPointers, 1);
  f.fire('pointercancel', pointer(1)); assert.equal(f.rows.at(-1).trackedPointers, 0);
  f.fire('pointerdown', pointer(2)); f.fire('blur', {}, f.win);
  assert.equal(f.rows.at(-1).event, 'blur'); assert.equal(f.rows.at(-1).trackedPointers, 1);
  f.fire('pointerdown', pointer(3)); assert.equal(f.rows.at(-1).trackedPointers, 1);
  f.doc.visibilityState = 'hidden'; f.fire('visibilitychange');
  assert.equal(f.rows.at(-1).event, 'hidden');
  f.fire('pointerdown', pointer(4)); assert.equal(f.rows.at(-1).trackedPointers, 1); stop();
});
test('element blur neither reports a browser interruption nor clears live contacts', () => {
  const f = fixture(), stop = observeContactDiagnostics(f.field, f.options);
  const button = { inside: true, closest: () => null };
  f.fire('pointerdown', pointer(1));
  const count = f.rows.length;
  f.fire('blur', {}, button); f.fire('blur', {}, f.field);
  assert.equal(f.rows.length, count, 'element focus changes are not window interruptions');
  f.fire('pointerdown', pointer(2, false));
  assert.equal(f.rows.at(-1).trackedPointers, 2, 'the first contact survives an element blur');
  f.fire('blur', {}, f.win);
  assert.equal(f.rows.at(-1).event, 'blur'); assert.equal(f.rows.at(-1).trackedPointers, 2);
  f.fire('pointerdown', pointer(3)); assert.equal(f.rows.at(-1).trackedPointers, 1);
  stop();
});
test('native touch counts also work without Pointer Events and no stale count is emitted for gestures', () => {
  const f = fixture(), stop = observeContactDiagnostics(f.field, f.options);
  f.fire('touchstart', { touches: { length: 2 } }); f.fire('gesturestart');
  assert.equal(f.rows[0].reportedTouches, 2); assert.equal(f.rows[0].trackedPointers, 0);
  assert.ok(!('reportedTouches' in f.rows[1]));
  f.fire('touchcancel', { touches: { length: 0 } }, null);
  assert.equal(f.rows.at(-1).reportedTouches, 0);
  const count = f.rows.length; f.fire('gestureend', {}, null); assert.equal(f.rows.length, count); stop();
});
test('only coarse control targets are exported and clicks are pre-handler observations', () => {
  const f = fixture(), stop = observeContactDiagnostics(f.field, f.options);
  const target = { inside: true, closest: selector => selector === '.mission-shop-access' ? target : null };
  f.fire('pointerdown', pointer(1), target); f.fire('click', { pointerType: 'touch' }, target);
  assert.equal(f.rows.at(-1).target, 'weapons'); assert.equal(f.rows.at(-1).playing, true);
  assert.ok(f.installed.every(r => r.config.capture && r.config.passive));
  assert.ok(!f.installed.some(r => /move|gesturechange/.test(r.type))); stop();
});
test('event bursts have separate cancellation capacity and update state even when suppressed', () => {
  const f = fixture(), stop = observeContactDiagnostics(f.field, f.options);
  for (let i = 0; i < 1000; i++) f.fire('pointerdown', pointer(i));
  assert.equal(f.rows.length, CONTACT_LIMITS.ordinaryPerSecond);
  f.fire('pointercancel', pointer(0)); assert.equal(f.rows.at(-1).event, 'pointercancel');
  assert.equal(f.rows.at(-1).trackedPointers, 9); assert.equal(f.rows.at(-1).truncated, true);
  assert.ok(f.rows.at(-1).suppressed > 0);
  for (let i = 0; i < 1000; i++) f.fire('gesturestart');
  assert.equal(f.rows.length, CONTACT_LIMITS.ordinaryPerSecond + CONTACT_LIMITS.criticalPerSecond);
  f.clock(1001); f.fire('touchend', { touches: { length: 0 } });
  assert.equal(f.rows.at(-1).trackedPointers, 0); assert.ok(f.rows.at(-1).suppressed > 0);
  f.fire('pointerdown', pointer(50)); assert.equal(f.rows.at(-1).trackedPointers, 1);
  assert.equal(f.rows.at(-1).truncated, false); stop();
});
test('revocation and disposal drop retained contacts and stop late observations', () => {
  const f = fixture(), stop = observeContactDiagnostics(f.field, f.options);
  f.fire('pointerdown', pointer(1)); f.active(false); f.fire('pointerdown', pointer(2));
  f.active(true); f.fire('pointerdown', pointer(3)); assert.equal(f.rows.at(-1).trackedPointers, 1);
  stop(); stop(); const count = f.rows.length;
  f.fire('pointerdown', pointer(4)); f.fire('pagehide'); f.doc.visibilityState = 'hidden'; f.fire('visibilitychange');
  assert.equal(f.rows.length, count);
});
test('observer installation and emission failures do not escape or leave a partial observer', () => {
  const f = fixture(); f.options.emit = () => { throw Error('storage fault'); };
  const stop = observeContactDiagnostics(f.field, f.options);
  assert.doesNotThrow(() => { f.fire('pointerdown', pointer(1)); f.fire('pointercancel', pointer(1)); }); stop();
  let calls = 0; const add = f.win.addEventListener.bind(f.win);
  f.win.addEventListener = (...args) => { if (++calls === 3) throw Error('unavailable'); add(...args); };
  f.options.emit = row => f.rows.push(row);
  assert.doesNotThrow(() => observeContactDiagnostics(f.field, f.options));
  f.fire('pointerdown', pointer(1)); assert.deepEqual(f.rows, []);
});
test('contact export is strictly bounded, strips raw fields and survives synchronous crash-tail recovery', () => {
  const raw = { operation: 'contact-state', event: 'pointercancel', target: 'weapons', inputSource: 'touch',
    trackedPointers: 2, primaryFlag: false, playing: true, steeringActive: false, cancelable: true, truncated: false,
    pointerId: 777, clientX: 555, width: 100, pressure: .5, token: 'private', targetText: 'private',
    reportedTouches: Infinity, suppressed: -1 };
  const clean = { operation: 'contact-state', event: 'pointercancel', target: 'weapons', inputSource: 'touch',
    trackedPointers: 2, primaryFlag: false, steeringActive: false, playing: true, cancelable: true, truncated: false };
  assert.deepEqual(cleanInputDiagnostic(raw), clean);
  assert.equal(cleanInputDiagnostic({ operation: 'contact-state', event: 'anything' }), null);
  assert.deepEqual(cleanInputDiagnostic({ operation: 'contact-state', event: 'touchstart', trackedPointers: 11,
    reportedTouches: -1, target: 'private', primaryFlag: 'private', suppressed: 60001 }), { operation: 'contact-state', event: 'touchstart' });
  const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const tail = createCrashTail(true, () => ({ localStorage: storage, sessionStorage: storage }), {
    id: 'contact-test', build: {}, now: () => 0, wallNow: () => 1 });
  tail.frame({ status: 'playing' }); tail.record('input', raw);
  const saved = readCrashTails({ localStorage: storage, sessionStorage: storage }).sessions[0].events;
  assert.equal(saved.length, 1); assert.deepEqual(saved[0].data, clean);
  assert.ok(!JSON.stringify(saved).includes('private')); tail.finish();
});
