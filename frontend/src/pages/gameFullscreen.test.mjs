import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestGameFullscreen, leaveGameFullscreen, toggleGameFullscreen, isGameFullscreen } from './gameFullscreen.ts';

function host() {
  const events = new Map();
  const doc = { documentElement: {}, addEventListener(name, fn) { const set = events.get(name) ?? new Set(); set.add(fn); events.set(name, set); }, removeEventListener(name, fn) { events.get(name)?.delete(fn); } };
  globalThis.document = doc;
  globalThis.window = { matchMedia: () => ({ matches: false }) };
  return { doc, emit: name => [...(events.get(name) ?? [])].forEach(fn => fn()), listeners: () => [...events.values()].reduce((sum, set) => sum + set.size, 0) };
}

test('the standard request runs during the gesture, confirms fullscreen and avoids duplicate entry', async () => {
  const h = host(); let calls = 0;
  h.doc.documentElement.requestFullscreen = options => { calls++; assert.equal(options.navigationUI, 'hide'); h.doc.fullscreenElement = h.doc.documentElement; h.emit('fullscreenchange'); return Promise.resolve(); };
  const pending = requestGameFullscreen();
  assert.equal(calls, 1); // No await or asynchronous preflight before the native call.
  assert.equal(await pending, 'changed');
  assert.equal(await requestGameFullscreen(), 'changed');
  assert.equal(calls, 1); assert.equal(h.listeners(), 0);
});

test('the home toggle enters and exits real fullscreen', async () => {
  const h = host();
  h.doc.documentElement.requestFullscreen = () => { h.doc.fullscreenElement = h.doc.documentElement; h.emit('fullscreenchange'); return Promise.resolve(); };
  h.doc.exitFullscreen = () => { h.doc.fullscreenElement = null; h.emit('fullscreenchange'); return Promise.resolve(); };
  assert.equal(await toggleGameFullscreen(), 'changed'); assert.equal(isGameFullscreen(), true);
  assert.equal(await toggleGameFullscreen(), 'changed'); assert.equal(isGameFullscreen(), false);
  assert.equal(h.listeners(), 0);
});

for (const legacy of [false, true]) test(`void-returning WebKit ${legacy ? 'older spelling' : 'API'} confirms events and exits`, async () => {
  const h = host(), property = legacy ? 'webkitCurrentFullScreenElement' : 'webkitFullscreenElement';
  h.doc.documentElement[legacy ? 'webkitRequestFullScreen' : 'webkitRequestFullscreen'] = function() { assert.equal(this, h.doc.documentElement); queueMicrotask(() => { h.doc[property] = h.doc.documentElement; h.emit('webkitfullscreenchange'); }); };
  h.doc[legacy ? 'webkitCancelFullScreen' : 'webkitExitFullscreen'] = function() { assert.equal(this, h.doc); queueMicrotask(() => { h.doc[property] = null; h.emit('webkitfullscreenchange'); }); };
  assert.equal(await requestGameFullscreen(), 'changed'); assert.equal(isGameFullscreen(), true);
  assert.equal(await leaveGameFullscreen(), 'changed'); assert.equal(isGameFullscreen(), false); assert.equal(h.listeners(), 0);
});

test('old hosts rejecting the optional argument retry synchronously without options', async () => {
  const h = host(); let calls = 0;
  h.doc.documentElement.requestFullscreen = options => { calls++; if (options) throw new TypeError('No options supported'); h.doc.fullscreenElement = h.doc.documentElement; h.emit('fullscreenchange'); return Promise.resolve(); };
  const pending = requestGameFullscreen(); assert.equal(calls, 2);
  assert.equal(await pending, 'changed'); assert.equal(h.listeners(), 0);
});

test('unsupported browsers and an installed app return distinct, truthful results', async () => {
  host(); assert.equal(await requestGameFullscreen(), 'unavailable');
  window.matchMedia = query => ({ matches: query.includes('standalone') });
  assert.equal(await requestGameFullscreen(), 'app-view'); assert.equal(isGameFullscreen(), false);
});

test('native sync and async rejections never block navigation or leak listeners', async () => {
  const h = host();
  h.doc.documentElement.requestFullscreen = () => { throw new Error('denied'); };
  assert.equal(await requestGameFullscreen(), 'denied');
  h.doc.documentElement.requestFullscreen = () => Promise.reject(new Error('denied'));
  assert.equal(await requestGameFullscreen(), 'denied');
  h.doc.fullscreenElement = h.doc.documentElement;
  h.doc.exitFullscreen = () => Promise.reject(new Error('denied'));
  assert.equal(await leaveGameFullscreen(), 'denied'); assert.equal(h.listeners(), 0);
});

test('a bridge that never resolves or emits a transition releases controls within three seconds', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = host(); h.doc.documentElement.requestFullscreen = () => new Promise(() => {});
  const pending = requestGameFullscreen(); t.mock.timers.tick(3_000);
  assert.equal(await pending, 'denied'); assert.equal(h.listeners(), 0);
});

test('a resolved host response without an actual transition is not reported as fullscreen', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = host(); h.doc.documentElement.requestFullscreen = () => Promise.resolve();
  const pending = requestGameFullscreen(); await Promise.resolve(); t.mock.timers.tick(3_000);
  assert.equal(await pending, 'denied'); assert.equal(isGameFullscreen(), false); assert.equal(h.listeners(), 0);
});
