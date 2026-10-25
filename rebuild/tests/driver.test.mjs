import test from 'node:test';
import assert from 'node:assert/strict';
import { CoreSession } from '../core/session.ts';
import { createFrameDriver } from '../core/frameDriver.ts';

function fixture(render = () => {}) {
  const session = new CoreSession('clock-fixture', { distance: 0 }, (state, input, dt) => ({ state: { distance: state.distance + dt } }));
  session.loaded(session.loadingTicket()); session.start();
  let now = 0, nextId = 1, visible = true, interval;
  const frames = new Map(), watchers = new Map(), lifecycle = [];
  const driver = createFrameDriver(session, { now: () => now, visible: () => visible, input: () => ({}), render, events() {},
    lifecycle: status => lifecycle.push(status),
    requestFrame: cb => { const id = nextId++; frames.set(id, cb); return id; }, cancelFrame: id => frames.delete(id),
    watch: (cb, ms) => { interval = ms; const id = nextId++; watchers.set(id, cb); return id; }, unwatch: id => watchers.delete(id) });
  return { session, driver, frames, watchers, lifecycle, get interval() { return interval; }, setVisible: value => { visible = value; },
    frame(time) { now = time; assert.equal(frames.size, 1); const [id, cb] = frames.entries().next().value; frames.delete(id); cb(time); },
    watch(time) { now = time; for (const cb of watchers.values()) cb(); } };
}

test('the driver owns one RAF and one 500 ms watcher; all callbacks stop after disposal', () => {
  const f = fixture(); assert.equal(f.interval, 500);
  f.frame(0); f.frame(16); f.frame(32);
  assert.equal(f.frames.size, 1); assert.equal(f.watchers.size, 1);
  assert.equal(f.session.snapshot().state.distance, 32);
  const stale = [...f.frames.values()][0];
  f.driver.dispose(); stale(48);
  assert.equal(f.frames.size, 0); assert.equal(f.watchers.size, 0);
  assert.equal(f.session.snapshot().state.distance, 32);
  assert.equal(f.session.lifecycle, 'disposed');
});

test('watchdog remains strict >2500 ms and an already queued callback cannot fork the loop', () => {
  const f = fixture(); f.frame(0);
  const stale = [...f.frames.values()][0];
  f.watch(2500); assert.equal(f.session.lifecycle, 'playing');
  f.watch(2501); assert.equal(f.session.snapshot().pausedBy, 'loop-stall');
  stale(2502); assert.equal(f.frames.size, 1);
  f.frame(2510); assert.equal(f.session.snapshot().state.distance, 0);
  f.driver.dispose();
});

test('Resume discards background duration even if pause and resume occur between frames', () => {
  const f = fixture(); f.frame(0); f.frame(16);
  f.driver.pause(); f.watch(60_000); assert.equal(f.driver.resume(), true);
  f.frame(60_016); f.frame(60_032);
  assert.equal(f.session.lifecycle, 'playing'); assert.equal(f.session.snapshot().state.distance, 32);
  f.setVisible(false); f.driver.hide(); f.frame(120_000);
  assert.equal(f.driver.resume(), false);
  f.setVisible(true); f.frame(120_016);
  assert.equal(f.session.lifecycle, 'paused');
  f.driver.resume(); f.frame(120_032); f.frame(120_048);
  assert.equal(f.session.snapshot().state.distance, 48); f.driver.dispose();
});

test('a failed renderer is not retried every frame; explicit Resume is required', () => {
  let calls = 0;
  const f = fixture(() => { calls++; throw new Error('lost rendering context'); });
  f.frame(0); f.frame(16); f.frame(32);
  assert.equal(calls, 1); assert.equal(f.session.snapshot().pausedBy, 'renderer-lost');
  assert.equal(f.frames.size, 1); f.driver.resume(); f.frame(48);
  assert.equal(calls, 2); assert.equal(f.session.snapshot().runId, 'clock-fixture'); f.driver.dispose();
});
