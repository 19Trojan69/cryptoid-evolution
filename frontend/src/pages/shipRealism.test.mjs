import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceShipMotion, idleShipMotion, explosionDiameter, fragmentFlight, hullIllumination } from './shipRealism.ts';

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
