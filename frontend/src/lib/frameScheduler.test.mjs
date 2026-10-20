import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createFrameScheduler } from './frameScheduler.ts';
import { startGuardedGameLoop } from '../pages/gameLoop.ts';
import { movePlayer, advanceShot, PLAYER_SPEED_PX_MS, SHOT_SPEED_PX_MS } from '../pages/playerCombat.ts';

function host() {
  let serial = 0;
  const native = new Map(), errors = [], times = [];
  const frames = createFrameScheduler({request: callback => {native.set(++serial, callback); return serial;}, cancel: id => native.delete(id), report: error => errors.push(error)});
  const tick = time => {
    times.push(time);
    for (const [id, callback] of [...native]) { native.delete(id); callback(time); }
    assert.ok(native.size <= 1, 'all clients share a single native RAF');
  };
  return {frames, native, errors, tick, times};
}

for (const hz of [20, 30, 59.94, 60, 90, 120, 144, 240]) test(`${hz} Hz keeps wall time and caps actual guarded simulation work at 60 Hz`, () => {
  const h = host(), calls = [];
  let now = 0;
  const stop = startGuardedGameLoop({step: time => calls.push(time), fault: error => {throw error;}, active: () => true, visible: () => true, now: () => now,
    requestFrame: h.frames.request, cancelFrame: h.frames.cancel, watch: () => 1, unwatch: () => {}});
  for (let i = 0; i < Math.ceil(hz * 2); i++) { now = 100 + i * 1000 / hz; if (now < 2100) h.tick(now); }
  assert.equal(calls.length, Math.min(120, Math.ceil(hz * 2)));
  assert.ok(calls.every(time => h.times.includes(time)), 'timestamps are never fabricated');
  assert.ok(calls.at(-1) - calls[0] > 1900, 'skipping frames does not slow elapsed time');
  stop(); assert.equal(h.native.size, 0);
});

test('rounded and jittered 60 Hz clocks do not lose every other frame', () => {
  for (const stamp of [Math.round, Math.floor, Math.ceil, (time, i) => time + (i % 2 ? .6 : -.6)]) {
    const h = host(); let calls = 0;
    const loop = () => { calls++; h.frames.request(loop); };
    h.frames.request(loop);
    for (let i = 0; i < 120; i++) h.tick(stamp(100 + i * 1000 / 60, i));
    assert.equal(calls, 120);
  }
});

test('clients share each tick; nested requests wait and cancellation wins within a batch', () => {
  const h = host(), calls = [];
  let canceled;
  h.frames.request(time => {calls.push(['game', time]); h.frames.cancel(canceled); h.frames.request(next => calls.push(['next', next]));});
  canceled = h.frames.request(time => calls.push(['canceled', time]));
  h.frames.request(time => calls.push(['css', time]));
  h.tick(100); assert.deepEqual(calls, [['game', 100], ['css', 100]]);
  h.tick(108.333); assert.equal(calls.length, 2);
  h.tick(116.667); assert.deepEqual(calls.at(-1), ['next', 116.667]);
  assert.equal(h.native.size, 0);
});

test('real movement/projectile functions keep their speed at 60/120/144 Hz', () => {
  for (const hz of [60,120,144]) {
    const h=host(); let last=100, position={x:.5,y:.75}, shot={id:1,x:50000,y:10000,speedX:0,damage:1,empowered:false};
    const step=time=>{const delta=Math.min(34,time-last);last=time;position=movePlayer(position,1,0,delta,100000,100000);shot=advanceShot(shot,delta);h.frames.request(step);};
    h.frames.request(step);
    for(let i=0;i<Math.ceil(hz*2);i++)h.tick(100+i*1000/hz);
    const elapsed=last-100;
    assert.ok(Math.abs(position.x*100000-(50000+PLAYER_SPEED_PX_MS*elapsed))<.00001);
    assert.ok(Math.abs(shot.y-(10000-SHOT_SPEED_PX_MS*elapsed))<.00001);
  }
});

test('failure in one frame client cannot abandon another client or duplicate RAF', () => {
  const h = host(); let ran = false;
  h.frames.request(() => {throw new Error('fixture');});
  h.frames.request(() => {ran = true;});
  h.tick(100); assert.equal(ran, true); assert.equal(h.errors.length, 1); assert.equal(h.native.size, 0);
});

test('long gaps never replay a catch-up burst; canceled idle requests retain the frame budget', () => {
  const h = host(); let calls = 0;
  const loop = () => {calls++; h.frames.request(loop);};
  h.frames.request(loop); h.tick(100); h.tick(5100); assert.equal(calls, 2);
  const idle = host(); idle.frames.request(() => calls++); idle.tick(100);
  const canceled = idle.frames.request(() => calls++); idle.frames.cancel(canceled);
  idle.frames.request(() => calls++); idle.tick(108.333); assert.equal(calls, 3);
  idle.tick(116.667); assert.equal(calls, 4);
});

test('no application component bypasses the shared native RAF adapter', () => {
  const root = new URL('../', import.meta.url);
  const scan = directory => fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => entry.isDirectory() ? scan(new URL(entry.name + '/', directory)) : /\.(tsx?|jsx?)$/.test(entry.name) ? [new URL(entry.name, directory)] : []);
  for (const file of scan(root)) {
    if (file.pathname.endsWith('/lib/frameScheduler.ts')) continue;
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /\b(?:requestAnimationFrame|cancelAnimationFrame)\s*\(/, file.pathname);
  }
});
