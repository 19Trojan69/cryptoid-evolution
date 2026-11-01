import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameScheduler } from '../../frontend/src/lib/frameScheduler.ts';
import { startGuardedGameLoop, GAME_STALL_MS } from '../../frontend/src/pages/gameLoop.ts';
import { ResourceCache } from '../../frontend/src/pages/resourceCache.ts';
import { createProjectilePresentation } from '../../frontend/src/pages/projectilePresentation.ts';

// These run the real source modules with deterministic hosts. Simulated minutes
// are deliberately not represented as real-browser or physical-device uptime.
function host() {
  let time = 0, serial = 0;
  const frames = new Map(), watches = new Map(), faults = [], clientCallbacks = [];
  const scheduler = createFrameScheduler({ request: callback => { frames.set(++serial, callback); return serial; },
    cancel: id => frames.delete(id), report: error => faults.push(error) });
  return { frames, watches, faults, scheduler, clientCallbacks, now: () => time,
    advance(ms) { time += ms; },
    frame() { const next = frames.entries().next().value; assert.ok(next, 'native frame pending');
      frames.delete(next[0]); next[1](time); },
    watch(callback) { watches.set(++serial, callback); return serial; },
    unwatch(id) { watches.delete(id); },
  };
}
function loop(h, step, active = () => true) {
  return startGuardedGameLoop({ step, active, visible: () => true,
    sleepWhenInactive: () => true, now: h.now,
    requestFrame: callback => { h.clientCallbacks.push(callback); return h.scheduler.request(callback); },
    cancelFrame: h.scheduler.cancel,
    watch: h.watch, unwatch: h.unwatch, fault: reason => h.faults.push(reason) });
}
test('30 simulated minutes share one native scheduler across game, effects and HUD clients', () => {
  const h = host(); let steps = 0, paints = 0, hud = 0;
  const stops = [loop(h, () => steps++), loop(h, () => paints++), loop(h, () => hud++)];
  for (let index = 0; index < 216000; index++) {
    h.advance(1000 / 120); h.frame();
    assert.equal(h.frames.size, 1);
    if (index % 60 === 0) for (const watch of [...h.watches.values()]) watch();
  }
  assert.ok(steps >= 107999 && steps <= 108001, '60-Hz steps at 120-Hz delivery');
  assert.equal(paints, steps); assert.equal(hud, steps); assert.deepEqual(h.faults, []);
  for (const stop of stops) stop();
  assert.equal(h.frames.size, 0); assert.equal(h.watches.size, 0);
});
test('2000 mount/pause/stall/unmount cycles retire watchers and reject stale callbacks', () => {
  const h = host(); let steps = 0, active = true;
  for (let cycle = 0; cycle < 2000; cycle++) {
    active = true;
    const stop = loop(h, () => steps++, () => active);
    h.advance(17); h.frame();
    active = false; stop.wake(); assert.equal(h.frames.size, 0);
    h.advance(60000); for (const watch of h.watches.values()) watch();
    active = true; stop.wake(); h.advance(17); h.frame();
    const stale = h.clientCallbacks.at(-1);
    h.advance(GAME_STALL_MS + 1); for (const watch of h.watches.values()) watch();
    const before = steps; stale(h.now()); assert.equal(steps, before, 'retired native callback cannot revive a client');
    stop(); stop(); stale(h.now());
    assert.equal(h.frames.size, 0); assert.equal(h.watches.size, 0);
    h.clientCallbacks.length = 0;
  }
  assert.equal(h.faults.length, 2000); assert.ok(h.faults.every(reason => reason === 'loop-stall'));
});
test('10000 preparation handoffs protect incoming hulls and dispose every retired resource once', () => {
  const disposed = new Set(), cache = new ResourceCache(24, 12 * 1024 * 1024, value => {
    assert.ok(!disposed.has(value)); disposed.add(value);
  }, 6);
  const releasePlayer = cache.retain('player'); cache.set('player', 'player', 1_000_000);
  let previous = [], resources = 1;
  for (let sector = 0; sector < 10000; sector++) {
    const next = [];
    for (let hull = 0; hull < 6; hull++) {
      const key = `${sector}:${hull}`;
      next.push(cache.retain(key)); cache.set(key, key, 750_000); resources++;
    }
    for (const release of previous) { release(); release(); }
    previous = next;
    assert.equal(cache.retainedEntries, 7); assert.equal(cache.retainCount, 7);
    assert.ok(cache.size <= 13); assert.equal(cache.get('player'), 'player');
    assert.ok(!disposed.has('player'));
    for (let hull = 0; hull < 6; hull++) assert.ok(!disposed.has(`${sector}:${hull}`));
  }
  for (const release of previous) release(); releasePlayer(); cache.clearUnused();
  assert.equal(cache.size, 0); assert.equal(cache.bytes, 0); assert.equal(cache.retainCount, 0);
  assert.equal(disposed.size, resources);
});
test('100000 projectile publications retain only live nodes and dispose the complete mount', () => {
  let created = 0, removed = 0;
  const document = { createElement() {
    created++;
    return { ownerDocument: document, children: [], style: { setProperty() {} },
      appendChild(node) { this.children.push(node); node.parent = this; },
      remove() { if (!this.parent) return; const children = this.parent.children;
        children.splice(children.indexOf(this), 1); this.parent = null; removed++; },
    };
  } };
  const mount = document.createElement(), presenter = createProjectilePresentation(mount);
  for (let frame = 0; frame < 100000; frame++) {
    const shots = Array.from({ length: 8 }, (_, index) => ({ id: Math.floor(frame / 20) * 8 + index,
      x: index * 4, y: frame % 825, empowered: false, visualLevel: 2 }));
    const enemyShots = Array.from({ length: 16 }, (_, index) => ({ id: Math.floor(frame / 30) * 16 + index,
      x: index * 8, y: frame % 825, vx: .1, vy: .3, radius: 4 }));
    presenter.present({ shots, enemyShots });
    assert.equal(presenter.size, 24);
    assert.equal(mount.children.reduce((sum, group) => sum + group.children.length, 0), 24);
  }
  presenter.present({ shots: [], enemyShots: [] }); assert.equal(presenter.size, 0);
  presenter.dispose(); assert.equal(mount.children.length, 0);
  assert.equal(created - removed, 1, 'only the caller-owned empty mount remains');
});
