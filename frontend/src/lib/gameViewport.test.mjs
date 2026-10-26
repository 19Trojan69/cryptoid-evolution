import test from 'node:test';
import assert from 'node:assert/strict';
import { lockGameViewport } from './gameViewport.ts';

function fixture() {
  class Element extends EventTarget {
    constructor(parent, menu = false) { super(); this.parentElement = parent; this.menu = menu; }
    classes = new Set();
    classList = { contains: name => this.classes.has(name), add: name => this.classes.add(name), remove: name => this.classes.delete(name) };
    scrollTop = 0; scrollHeight = 0; clientHeight = 0; overflow = 'visible';
    closest(selector) { return selector.includes('game-modal') && this.menu ? this : this.parentElement?.closest(selector) ?? null; }
  }
  const root = new Element(), menu = new Element(root, true), target = new Element(menu);
  const doc = { documentElement: new Element(), body: new Element() };
  const restored = [];
  const win = { Element, scrollX: 0, scrollY: 83, scrollTo: (...args) => restored.push(args), getComputedStyle: el => ({ overflowY: el.overflow }) };
  doc.defaultView = win; root.ownerDocument = doc;
  const touch = (type, y, element = root) => {
    const event = new Event(type, { cancelable: true });
    Object.defineProperties(event, { target: { value: element }, touches: { value: [{ clientY: y }] } });
    root.dispatchEvent(event); return event.defaultPrevented;
  };
  return { root, menu, target, doc, restored, touch };
}
test('the route blocks page pulls, permits menu scrolling in both directions and stops at menu edges', () => {
  const f = fixture(), stop = lockGameViewport(f.root);
  assert.ok(f.doc.body.classes.has('game-viewport-locked'));
  f.touch('touchstart', 100); assert.equal(f.touch('touchmove', 150), true);
  f.menu.overflow = 'auto'; f.menu.clientHeight = 300; f.menu.scrollHeight = 900;
  f.touch('touchstart', 300, f.target);
  assert.equal(f.touch('touchmove', 250, f.target), false, 'menu can scroll down');
  f.menu.scrollTop = 600;
  assert.equal(f.touch('touchmove', 200, f.target), true, 'bottom pull does not escape');
  assert.equal(f.touch('touchmove', 250, f.target), false, 'menu can scroll back up');
  f.menu.scrollTop = 0;
  assert.equal(f.touch('touchmove', 300, f.target), true, 'top pull does not escape');
  stop();
  assert.equal(f.doc.body.classes.size, 0); assert.deepEqual(f.restored, [[0,83]]);
  assert.equal(f.touch('touchmove', 400), false, 'leaving the route removes gesture interception');
});
test('setup/cleanup/setup preserves pre-existing document ownership and has no leftover listeners', () => {
  const f = fixture(); f.doc.documentElement.classes.add('game-viewport-locked');
  lockGameViewport(f.root)(); const stop = lockGameViewport(f.root);
  assert.equal(f.touch('touchmove', 180), true); stop();
  assert.ok(f.doc.documentElement.classes.has('game-viewport-locked'));
  assert.equal(f.doc.body.classes.size, 0); assert.equal(f.touch('touchmove', 200), false);
});
