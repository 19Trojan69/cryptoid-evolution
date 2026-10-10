import { test } from 'node:test';
import assert from 'node:assert/strict';
import { watchMenuViewport } from './menuViewport.ts';

test('phone keyboard resize and scrolling update menu bounds, and teardown removes all listeners', () => {
  const saved = Object.fromEntries(['window','document','requestAnimationFrame','cancelAnimationFrame'].map(name => [name, globalThis[name]]));
  const viewport = new EventTarget();
  Object.assign(viewport, { height: 844, offsetTop: 0 });
  const host = new EventTarget();
  Object.assign(host, { visualViewport: viewport, innerHeight: 844 });
  const properties = new Map(), frames = new Map();
  let id = 0;
  globalThis.window = host;
  globalThis.document = { documentElement: { style: { setProperty: (key,value) => properties.set(key,value), removeProperty: key => properties.delete(key) } } };
  globalThis.requestAnimationFrame = callback => { frames.set(++id, callback); return id; };
  globalThis.cancelAnimationFrame = key => frames.delete(key);
  try {
    const stop = watchMenuViewport();
    assert.equal(properties.get('--menu-viewport-height'), '844px');
    viewport.height = 382; viewport.offsetTop = 28;
    viewport.dispatchEvent(new Event('resize'));
    viewport.dispatchEvent(new Event('scroll'));
    assert.equal(frames.size, 1, 'keyboard events are coalesced into a single paint');
    const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback());
    assert.equal(properties.get('--menu-viewport-height'), '382px');
    assert.equal(properties.get('--menu-viewport-top'), '28px');
    host.dispatchEvent(new Event('resize'));
    stop();
    assert.equal(frames.size, 0);
    assert.equal(properties.size, 0);
    viewport.dispatchEvent(new Event('resize')); host.dispatchEvent(new Event('resize'));
    assert.equal(frames.size, 0, 'unmounted app leaves no resize callbacks');
  } finally { for (const [name,value] of Object.entries(saved)) if (value === undefined) delete globalThis[name]; else globalThis[name] = value; }
});
