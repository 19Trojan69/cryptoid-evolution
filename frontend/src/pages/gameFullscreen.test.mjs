import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestGameFullscreen, leaveGameFullscreen } from './gameFullscreen.ts';

test('fullscreen hides navigation and does not request twice when already active', () => {
  let calls = 0;
  globalThis.document = { documentElement: { requestFullscreen(options) { calls++; assert.equal(options.navigationUI, 'hide'); return Promise.resolve(); } } };
  requestGameFullscreen();
  document.fullscreenElement = document.documentElement;
  requestGameFullscreen();
  assert.equal(calls, 1);
});

test('older tablet fullscreen supports void-returning prefixed enter and exit', () => {
  let entered = 0, exited = 0;
  globalThis.document = { documentElement: { webkitRequestFullscreen() { entered++; } }, webkitExitFullscreen() { exited++; } };
  requestGameFullscreen();
  document.webkitFullscreenElement = document.documentElement;
  requestGameFullscreen();
  leaveGameFullscreen();
  assert.equal(entered, 1);
  assert.equal(exited, 1);
});

test('unsupported APIs and synchronous browser rejection do not block navigation', () => {
  globalThis.document = { documentElement: {} };
  assert.doesNotThrow(requestGameFullscreen);
  assert.doesNotThrow(leaveGameFullscreen);
  document.documentElement.requestFullscreen = () => { throw new Error('denied'); };
  document.fullscreenElement = document.documentElement;
  document.exitFullscreen = () => { throw new Error('denied'); };
  assert.doesNotThrow(leaveGameFullscreen);
  document.fullscreenElement = null;
  assert.doesNotThrow(requestGameFullscreen);
});

test('asynchronous fullscreen rejection is handled on enter and exit', async () => {
  globalThis.document = { documentElement: { requestFullscreen: () => Promise.reject(new Error('denied')) }, exitFullscreen: () => Promise.reject(new Error('denied')) };
  requestGameFullscreen();
  document.fullscreenElement = document.documentElement;
  leaveGameFullscreen();
  await new Promise(resolve => setImmediate(resolve));
});
