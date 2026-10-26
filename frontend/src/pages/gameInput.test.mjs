import test from 'node:test';
import assert from 'node:assert/strict';
import { bindGameInput, canStartSteering } from './gameInput.ts';
import { TOUCH_SHIP_OFFSET_PX } from './playerCombat.ts';

function harness({ legacy = false } = {}) {
  const win = new EventTarget(), doc = new EventTarget(), field = new EventTarget();
  if (!legacy) win.PointerEvent = function () {};
  doc.defaultView = win; doc.visibilityState = 'visible'; field.ownerDocument = doc;
  field.closest = () => null;
  let bounds = { left: 10, top: 20, width: 390, height: 760 };
  field.getBoundingClientRect = () => bounds;
  const captures = new Set();
  field.setPointerCapture = id => captures.add(id);
  field.hasPointerCapture = id => captures.has(id);
  field.releasePointerCapture = id => { captures.delete(id); fire(field, 'lostpointercapture', { pointerId: id }); };
  const pointer = { current: null }, origin = { current: null }, moves = [], faults = [];
  let playing = true, sensitivity = 1, area = 'normal', above = true;
  const input = bindGameInput(field, { pointer, origin, playing: () => playing, aboveFinger: () => above,
    sensitivity: () => sensitivity, area: () => area, position: p => moves.push(p), fault: e => faults.push(e) });
  return { win, doc, field, input, pointer, origin, moves, faults, captures,
    down: (data = {}) => fire(field, 'pointerdown', data), move: (data = {}) => fire(field, 'pointermove', data),
    setPlaying: value => playing = value, setSensitivity: value => sensitivity = value,
    setArea: value => area = value, setAbove: value => above = value, setBounds: value => bounds = value };
}
function fire(target, type, data = {}) {
  const event = new Event(type, { cancelable: true });
  const values = { pointerId: 1, pointerType: 'touch', isPrimary: true, buttons: 1, clientX: 300, clientY: 650, ...data };
  for (const [key, value] of Object.entries(values)) Object.defineProperty(event, key, { value, configurable: true });
  target.dispatchEvent(event);
  return event;
}

test('every control size accepts both screen edges; area settings change vertical reach', () => {
  const bounds = { left: 0, top: 0, width: 390, height: 760 };
  for (const area of ['compact', 'normal', 'wide']) {
    for (const x of [1, 100, 290, 389]) assert.equal(canStartSteering(x, 700, bounds, area), true);
  }
  assert.equal(canStartSteering(100, 350, bounds, 'compact'), false);
  assert.equal(canStartSteering(100, 350, bounds, 'normal'), false);
  assert.equal(canStartSteering(100, 350, bounds, 'wide'), true);
});
test('left-side touch starts immediately and preserves above-finger offset and sensitivity', () => {
  const h = harness();
  assert.equal(h.down({ clientX: 60 }).defaultPrevented, true);
  assert.equal(h.moves.at(-1).x, 50 / 390);
  assert.equal(h.moves.at(-1).y, (630 - TOUCH_SHIP_OFFSET_PX) / 760);
  const before = h.moves.at(-1);
  h.setSensitivity(1.3); h.move({ clientX: 110 });
  assert.ok(Math.abs(h.moves.at(-1).x - before.x - 65 / 390) < 1e-10);
  h.input.dispose();
});
test('explicit under-finger mode remains available', () => {
  const h = harness(); h.setAbove(false); h.down();
  assert.equal(h.moves.at(-1).y, 630 / 760); h.input.dispose();
});
test('a fresh primary contact replaces a stale pointer instead of rejecting every new touch', () => {
  const h = harness(); h.down(); h.down({ pointerId: 9, clientX: 60 });
  assert.equal(h.pointer.current, 9); assert.equal(h.captures.has(1), false);
  h.move({ pointerId: 9, clientX: 100 }); assert.equal(h.moves.length, 3);
  fire(h.win, 'pointerup', { pointerId: 1 }); assert.equal(h.pointer.current, 9);
  h.input.dispose();
});
test('second fingers and interactive controls do not steal or move the ship', () => {
  const h = harness(); h.down(); const count = h.moves.length;
  h.down({ pointerId: 2, isPrimary: false });
  h.down({ pointerId: 3, target: { closest: () => ({}) } });
  fire(h.win, 'pointerup', { pointerId: 2 });
  assert.equal(h.pointer.current, 1); assert.equal(h.moves.length, count); h.input.dispose();
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  test(`${event} frees steering and permits the next gesture`, () => {
    const h = harness(); h.down(); fire(event === 'lostpointercapture' ? h.field : h.win, event);
    assert.equal(h.pointer.current, null); assert.equal(h.origin.current, null);
    h.down({ pointerId: 2 }); assert.equal(h.pointer.current, 2); h.input.dispose();
  });
}
for (const event of ['blur', 'pagehide', 'resize', 'fullscreenchange', 'webkitfullscreenchange']) {
  test(`${event} resets captured input without changing progress`, () => {
    const h = harness(); h.down(); fire(event.includes('fullscreen') ? h.doc : h.win, event);
    assert.equal(h.pointer.current, null); assert.equal(h.captures.size, 0); h.input.dispose();
  });
}
test('hidden page and final touch release clear stale contacts', () => {
  const h = harness(); h.down(); h.doc.visibilityState = 'hidden'; fire(h.doc, 'visibilitychange');
  assert.equal(h.pointer.current, null); h.doc.visibilityState = 'visible'; h.down();
  fire(h.win, 'touchcancel', { touches: [] }); assert.equal(h.pointer.current, null); h.input.dispose();
});
test('pause blocks movement, clears the active contact and accepts a new gesture on resume', () => {
  const h = harness(); h.down(); h.setPlaying(false); h.move();
  assert.equal(h.pointer.current, null); const count = h.moves.length;
  h.down(); assert.equal(h.moves.length, count); h.setPlaying(true); h.down({ pointerId: 4 });
  assert.equal(h.pointer.current, 4); h.input.dispose();
});
test('dragging outside the field remains captured and clamps to safe positions', () => {
  const h = harness(); h.down(); h.move({ clientX: -1000, clientY: 4000 });
  assert.equal(h.moves.at(-1).x, 30 / 390); assert.equal(h.moves.at(-1).y, .91);
  assert.equal(h.pointer.current, 1); h.input.dispose();
});
test('zero-size geometry is ignored and later resizing restores input', () => {
  const h = harness(); h.setBounds({ left: 0, top: 0, width: 0, height: 0 }); h.down();
  assert.equal(h.pointer.current, null); assert.equal(h.moves.length, 0);
  h.setBounds({ left: 0, top: 0, width: 320, height: 568 }); h.down({ clientX: 60, clientY: 500 });
  assert.equal(h.pointer.current, 1); h.input.dispose();
});
test('a rejected capture still has global release cleanup', () => {
  const h = harness(); h.field.setPointerCapture = () => { throw new Error('unsupported'); };
  h.down(); assert.equal(h.pointer.current, 1); fire(h.win, 'pointerup');
  assert.equal(h.pointer.current, null); assert.equal(h.faults.length, 0); h.input.dispose();
});
test('an input geometry exception releases the old gesture and reports a recoverable fault', () => {
  const h = harness(); h.down();
  const measure = h.field.getBoundingClientRect;
  h.field.getBoundingClientRect = () => { throw new TypeError('geometry unavailable'); };
  h.move();
  assert.equal(h.pointer.current, null); assert.equal(h.origin.current, null);
  assert.equal(h.captures.size, 0); assert.equal(h.faults.length, 1);
  h.field.getBoundingClientRect = measure; h.down({ pointerId: 2 });
  assert.equal(h.pointer.current, 2); h.input.dispose();
});
test('a single mouse click follows motion after release; a second click turns it off', () => {
  const h = harness(), mouse = { pointerType: 'mouse' };
  h.move({ ...mouse, buttons: 0 }); assert.equal(h.moves.length, 0);
  h.down(mouse); fire(h.win, 'pointerup', { ...mouse, buttons: 0 });
  assert.equal(h.pointer.current, 1); assert.equal(h.captures.size, 0);
  h.move({ ...mouse, buttons: 0, clientX: 100 });
  assert.equal(h.moves.at(-1).x, 90 / 390);
  const count = h.moves.length;
  h.down(mouse); fire(h.win, 'pointerup', { ...mouse, buttons: 0 });
  h.move({ ...mouse, buttons: 0, clientX: 200 });
  assert.equal(h.pointer.current, null); assert.equal(h.moves.length, count);
  h.down(mouse); assert.equal(h.pointer.current, 1); h.input.dispose();
});
test('mouse following can be released above the start zone or by clicking a HUD control', () => {
  for (const data of [{ clientY: 100 }, { target: { closest: () => ({}) } }]) {
    const h = harness(); h.down({ pointerType: 'mouse' });
    h.down({ pointerType: 'mouse', ...data });
    assert.equal(h.pointer.current, null); h.input.dispose();
  }
});
test('mouse hovering over a control or outside the field releases following', () => {
  for (const data of [{ target: { closest: () => ({}) } }, { clientX: 5 }, { clientY: 800 }]) {
    const h = harness(); h.down({ pointerType: 'mouse' }); const count = h.moves.length;
    h.move({ pointerType: 'mouse', buttons: 0, ...data });
    assert.equal(h.pointer.current, null); assert.equal(h.moves.length, count); h.input.dispose();
  }
});
test('leaving the field or Escape releases mouse following until another click', () => {
  for (const stop of [h => fire(h.field, 'pointerleave', { pointerType: 'mouse' }),
    h => fire(h.win, 'keydown', { key: 'Escape' })]) {
    const h = harness(); h.down({ pointerType: 'mouse' });
    fire(h.win, 'pointerup', { pointerType: 'mouse', buttons: 0 }); stop(h);
    const count = h.moves.length; h.move({ pointerType: 'mouse', buttons: 0 });
    assert.equal(h.pointer.current, null); assert.equal(h.moves.length, count);
    h.down({ pointerType: 'mouse' }); assert.equal(h.pointer.current, 1); h.input.dispose();
  }
});
for (const event of ['pointercancel', 'lostpointercapture', 'blur', 'pagehide', 'resize', 'fullscreenchange', 'webkitfullscreenchange']) {
  test(`${event} releases mouse following without rearming on hover`, () => {
    const h = harness(); h.down({ pointerType: 'mouse' });
    fire(h.win, 'pointerup', { pointerType: 'mouse', buttons: 0 });
    fire(event.includes('fullscreen') ? h.doc : event === 'lostpointercapture' ? h.field : h.win, event, { pointerType: 'mouse' });
    const count = h.moves.length; h.move({ pointerType: 'mouse', buttons: 0, clientX: 100 });
    assert.equal(h.pointer.current, null); assert.equal(h.moves.length, count); h.input.dispose();
  });
}
test('pause, hidden page and explicit reset each release mouse following', () => {
  for (const stop of [h => { h.setPlaying(false); h.move({ pointerType: 'mouse', buttons: 0 }); },
    h => { h.doc.visibilityState = 'hidden'; fire(h.doc, 'visibilitychange'); }, h => h.input.reset()]) {
    const h = harness(); h.down({ pointerType: 'mouse' }); stop(h);
    h.setPlaying(true); h.doc.visibilityState = 'visible'; const count = h.moves.length;
    h.move({ pointerType: 'mouse', buttons: 0 });
    assert.equal(h.pointer.current, null); assert.equal(h.moves.length, count); h.input.dispose();
  }
});
test('a touch can replace mouse following and still releases when the finger lifts', () => {
  const h = harness(); h.down({ pointerType: 'mouse' });
  fire(h.win, 'pointerup', { pointerType: 'mouse', buttons: 0 });
  h.down({ pointerId: 9 }); assert.equal(h.pointer.current, 9); assert.equal(h.captures.has(9), true);
  fire(h.win, 'pointerup', { pointerId: 9, buttons: 0 });
  assert.equal(h.pointer.current, null); const count = h.moves.length;
  h.move({ pointerType: 'mouse', buttons: 0 }); assert.equal(h.moves.length, count); h.input.dispose();
});
test('secondary mouse buttons and UI clicks cannot activate following', () => {
  for (const data of [{ buttons: 2 }, { buttons: 4 }, { isPrimary: false }, { target: { closest: () => ({}) } }, { clientY: 100 }]) {
    const h = harness(); h.down({ pointerType: 'mouse', ...data });
    h.move({ pointerType: 'mouse', buttons: 0 });
    assert.equal(h.pointer.current, null); assert.equal(h.moves.length, 0); h.input.dispose();
  }
});
test('disposing active mouse following removes motion and toggle handlers', () => {
  const h = harness(); h.down({ pointerType: 'mouse' }); h.input.dispose();
  const count = h.moves.length; h.down({ pointerType: 'mouse' });
  h.move({ pointerType: 'mouse', buttons: 0, clientX: 100 });
  assert.equal(h.pointer.current, null); assert.equal(h.moves.length, count);
});
test('legacy touch-only WebView can steer, cancel and start again', () => {
  const h = harness({ legacy: true });
  const touch = { identifier: 8, clientX: 60, clientY: 650 };
  fire(h.field, 'touchstart', { touches: [touch], changedTouches: [touch] });
  assert.equal(h.pointer.current, 8);
  fire(h.field, 'touchmove', { touches: [{ ...touch, clientX: 160 }] });
  assert.equal(h.moves.length, 2);
  fire(h.win, 'touchcancel', { touches: [], changedTouches: [touch] });
  assert.equal(h.pointer.current, null);
  fire(h.field, 'touchstart', { touches: [touch], changedTouches: [touch] });
  assert.equal(h.pointer.current, 8); h.input.dispose();
});
test('dispose removes handlers so late events cannot move the ship', () => {
  const h = harness(); h.input.dispose(); h.down(); assert.equal(h.moves.length, 0);
  fire(h.win, 'pointerup'); assert.equal(h.pointer.current, null);
});
