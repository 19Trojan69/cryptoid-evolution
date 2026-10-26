import test from 'node:test';
import assert from 'node:assert/strict';
import { CoreSession } from '../core/session.ts';
import { campaign, campaignSection } from '../core/campaign.ts';

const integrate = (state, input, delta) => ({ state: { distance: state.distance + input.speed * delta } });
function ready(simulate = integrate, maxEvents) {
  const session = new CoreSession('isolated-run', { distance: 0 }, simulate, maxEvents);
  session.loaded(session.loadingTicket()); session.start();
  return session;
}

test('late loading results cannot start a new generation or revive a closed run', () => {
  const session = new CoreSession('load', { distance: 0 }, integrate);
  const old = session.loadingTicket(), current = session.retryLoading();
  assert.equal(session.loaded(old), false);
  assert.equal(session.loaded(current), true);
  assert.equal(session.snapshot().status, 'ready'); // Gesture/explicit Start still required.
  session.dispose();
  assert.equal(session.loaded(current), false);
  assert.equal(session.start(), false);
  assert.equal(session.resume(), false);
});

test('one clock owner; callbacks from a released lease never advance a run', () => {
  const session = ready(), old = session.acquireClock();
  assert.throws(() => session.acquireClock());
  old.tick(16, { speed: 1 }); old.release();
  const clock = session.acquireClock();
  old.tick(100, { speed: 999 });
  clock.tick(16, { speed: 1 });
  assert.equal(session.snapshot().state.distance, 32);
  session.end(); clock.tick(16, { speed: 1 });
  assert.equal(session.snapshot().state.distance, 32);
});

test('late frames have at most four bounded substeps, with no deferred backlog', () => {
  const deltas = [];
  const session = ready((state, input, delta) => { deltas.push(delta); return integrate(state, input, delta); });
  const clock = session.acquireClock();
  assert.equal(clock.tick(2_500, { speed: 1 }), 4);
  assert.equal(session.snapshot().status, 'playing');
  assert.equal(session.snapshot().elapsedMs, 136);
  clock.tick(16, { speed: 1 });
  assert.equal(session.snapshot().elapsedMs, 152);
  assert.ok(deltas.every(delta => delta <= 34));
});

test('foreground stalls and hidden pages pause the same run until explicit Resume', () => {
  const session = ready(), clock = session.acquireClock();
  clock.tick(16, { speed: 1 });
  clock.tick(2_501, { speed: 1 });
  assert.equal(session.snapshot().pausedBy, 'loop-stall');
  for (let i = 0; i < 100; i++) clock.tick(16, { speed: 1 });
  assert.equal(session.snapshot().elapsedMs, 16);
  session.resume(); clock.tick(16, { speed: 1 }, false);
  assert.equal(session.snapshot().pausedBy, 'hidden');
  assert.equal(session.snapshot().runId, 'isolated-run');
  session.resume(); clock.tick(16, { speed: 1 });
  assert.equal(session.snapshot().elapsedMs, 32);
});

test('invalid clocks pause without corrupting positions or active time', () => {
  for (const gap of [NaN, Infinity, -1]) {
    const session = ready(), clock = session.acquireClock();
    clock.tick(gap, { speed: 1 });
    assert.equal(session.snapshot().elapsedMs, 0);
    assert.equal(session.snapshot().pausedBy, 'invalid-clock');
  }
});

test('a failed simulation retains its last completed substep', () => {
  let count = 0;
  const session = ready((state, input, delta) => {
    if (++count === 3) throw new Error('fixture simulation fault');
    return integrate(state, input, delta);
  });
  assert.equal(session.acquireClock().tick(136, { speed: 1 }), 2);
  assert.equal(session.snapshot().state.distance, 68);
  assert.equal(session.snapshot().elapsedMs, 68);
  assert.equal(session.snapshot().pausedBy, 'simulation-error');
});

test('event pressure pauses before an unaccepted state or reward is committed', () => {
  const session = ready((state) => ({ state: { distance: state.distance + 1 }, events: [{ type: 'checkpoint', key: 'reward', value: state.distance + 1 }] }), 2);
  const clock = session.acquireClock();
  assert.equal(clock.tick(102, {}), 2);
  assert.equal(session.snapshot().state.distance, 2);
  assert.equal(session.snapshot().pausedBy, 'event-overflow');
  assert.equal(session.resume(), false);
  assert.deepEqual(session.drainEvents().map(e => e.value), [1, 2]);
  assert.equal(session.resume(), true);
  clock.tick(16, {});
  assert.deepEqual(session.drainEvents().map(e => e.value), [3]);
});

test('renderer exceptions do not replace the document or reset state', () => {
  const session = ready(); session.acquireClock().tick(20, { speed: 1 });
  assert.equal(session.present(() => { throw new Error('fixture context lost'); }), false);
  const snapshot = session.snapshot();
  assert.equal(snapshot.pausedBy, 'renderer-lost');
  assert.equal(snapshot.runId, 'isolated-run');
  assert.equal(snapshot.state.distance, 20);
  snapshot.state.distance = -500;
  assert.equal(session.snapshot().state.distance, 20);
});

test('all 500 existing internal stage IDs retain their 50 visible levels and bosses', () => {
  assert.equal(campaign.length, 500);
  assert.equal(campaign.filter(section => section.kind === 'boss').length, 50);
  for (const section of campaign) {
    assert.equal(section.level, Math.floor((section.stage - 1) / 10) + 1);
    assert.equal(section.block, (section.stage - 1) % 10 + 1);
    assert.equal(section.kind === 'boss', section.stage % 10 === 0);
  }
  assert.equal(new Set(campaign.filter(s => s.bossId).map(s => s.bossId)).size, 50);
  for (const stage of [0, -1, 501, NaN, 1.5]) assert.throws(() => campaignSection(stage));
});
