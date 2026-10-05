import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advancePlayerMotion, advanceShipMotion, idleShipMotion, engineFlamePercent, explosionDiameter, fragmentFlight, hullIllumination } from './shipRealism.ts';

test('engine flames retain launch, attack and return floors and respond to acceleration', () => {
  assert.equal(engineFlamePercent(0), 7);
  assert.equal(engineFlamePercent(0, 'launch'), 16);
  assert.equal(engineFlamePercent(0, 'boost'), 20);
  assert.equal(engineFlamePercent(0, 'return'), 11);
  assert.equal(engineFlamePercent(100), 31);
  assert.equal(engineFlamePercent(-1), 7);
  let motion = idleShipMotion();
  for (let i = 0; i < 20; i++) motion = advanceShipMotion(motion, 7, 0, 16);
  const accelerated = engineFlamePercent(motion.thrust);
  assert.ok(accelerated > 20);
  for (let i = 0; i < 60; i++) motion = advanceShipMotion(motion, 0, 0, 16);
  assert.ok(engineFlamePercent(motion.thrust) < 7.01);
});

test('bank follows direction, remains subtle and settles after stopping', () => {
  let motion = idleShipMotion();
  for (let i = 0; i < 40; i++) motion = advanceShipMotion(motion, 8, 0, 16);
  assert.ok(motion.bank > 5 && motion.bank <= 8);
  assert.ok(motion.thrust > .7);
  for (let i = 0; i < 60; i++) motion = advanceShipMotion(motion, 0, 0, 16);
  assert.ok(Math.abs(motion.bank) < .01);
  assert.ok(motion.thrust < .001);
  assert.ok(advanceShipMotion(idleShipMotion(), -8, 0, 16).bank < 0);
});
test('explosions scale with hull size', () => {
  assert.ok(explosionDiameter(40) < explosionDiameter(80));
  assert.equal(explosionDiameter(80), 100);
});
test('fragments move away from impact, inherit bounded momentum and spin differently', () => {
  const left = fragmentFlight(-20, 0, 0, 0, 80, .2);
  const right = fragmentFlight(20, 0, 0, 0, 80, .8);
  assert.ok(left.x < 0 && right.x > 0);
  assert.notEqual(left.spin, right.spin);
  const drift = fragmentFlight(20, 0, 0, 0, 80, .8, 100000, 0);
  assert.ok(Math.abs(drift.x - right.x - 40) < 1e-9);
});
test('light fades quickly, is local and respects delayed boss burst', () => {
  const source = { x: 0, y: 0, startedAt: 1000, kind: 'explosion', debrisSize: 60 };
  assert.ok(hullIllumination(0, 0, 1000, 0, [source]) > .8);
  assert.equal(hullIllumination(200, 0, 1000, 0, [source]), 0);
  assert.equal(hullIllumination(0, 0, 1400, 0, [source]), 0);
  assert.ok(hullIllumination(0, 0, 1010, 1000, []) > .5);
  assert.equal(hullIllumination(0, 0, 1000, 0, [{ ...source, kind: 'boss-explosion', finalDelayMs: 1450 }]), 0);
});

const trajectory = (velocity, duration = 1000, step = 10) => {
  let motion = idleShipMotion(); const samples = [];
  for (let t = 0; t < duration; t += step) {
    const [x, y] = velocity(t);
    motion = advancePlayerMotion(motion, x * step / 1000, y * step / 1000, step);
    samples.push(motion.bank);
  }
  return { motion, samples };
};
test('player turn strength mirrors direction and levels on a straight course', () => {
  const gentle = trajectory(() => [40, 0]), sharp = trajectory(() => [400, 0]), left = trajectory(() => [-400, 0]);
  assert.ok(Math.max(...sharp.samples) > Math.max(...gentle.samples) + 1);
  assert.ok(Math.max(...sharp.samples) <= 10);
  sharp.samples.forEach((v, i) => assert.ok(Math.abs(v + left.samples[i]) < 1e-9));
  assert.ok(Math.abs(sharp.motion.bank) < .05);
});
test('player follows curves consistently across frame rates and settles smoothly', () => {
  const curve = t => [300 * Math.sin(t / 800), -150 * Math.cos(t / 800)];
  const a = trajectory(curve, 600, 10), b = trajectory(curve, 600, 20);
  assert.ok(a.motion.bank > 1);
  assert.ok(Math.abs(a.motion.bank - b.motion.bank) < .4);
  let stopped = advancePlayerMotion(a.motion, 0, 0, 16);
  assert.ok(stopped.bank > 0 && stopped.bank < a.motion.bank);
  for (let i = 0; i < 60; i++) stopped = advancePlayerMotion(stopped, 0, 0, 16);
  assert.ok(Math.abs(stopped.bank) < .001);
});
test('player banking bounds abrupt touch reversals and ignores paused frames', () => {
  const a = trajectory(t => [t < 300 ? 20000 : -20000, 0], 600);
  assert.ok(a.samples.every(v => Number.isFinite(v) && Math.abs(v) <= 10));
  assert.ok(a.motion.bank < 0);
  assert.equal(advancePlayerMotion(a.motion, 100, 0, 0), a.motion);
});
