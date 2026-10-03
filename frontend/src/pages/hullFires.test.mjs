import assert from 'node:assert/strict';
import test from 'node:test';
import { addPersistentHullFire, bossFireSites, hullFireAtImpact, hullFireLimit, hullImpactProfile, spriteFireSites } from './hullFires.ts';

test('rotating and aligned ships ignite their painted hull, not a world-space ring', () => {
  const sites = [[50, 40], [60, 50], [40, 60]];
  const hit = hullFireAtImpact({ id: 7, x: 110, y: 100 }, { x: 100, y: 100 }, 100, sites, [], 90);
  assert.deepEqual(hit, { id: 7, x: 50, y: 40, impactPower: undefined });
  assert.deepEqual(hullFireAtImpact({ id: 8, x: 96, y: 103 }, { x: 100, y: 100 }, 100, sites, [], 0, { x: 4, y: -3 }), { id: 8, x: 50, y: 50, impactPower: undefined });
});

test('repeated impacts stay local instead of spreading into a grid', () => {
  const target = { x: 200, y: 200 };
  const first = hullFireAtImpact({ id: 1, x: 210, y: 210 }, target, 124, bossFireSites);
  const second = hullFireAtImpact({ id: 2, x: 210, y: 210 }, target, 124, bossFireSites, [first]);
  assert.deepEqual([first.x, first.y], [second.x, second.y]);
  assert.equal(addPersistentHullFire([first], second, 8).length, 1);
  const shifted = hullFireAtImpact({ id: 3, x: 212, y: 211 }, target, 124, bossFireSites, [first]);
  assert.notDeepEqual([first.x, first.y], [shifted.x, shifted.y]);
  assert.equal(spriteFireSites.length, 20);
  assert.ok(spriteFireSites.every(sites => sites.length >= 7));
  assert.ok(spriteFireSites.every(sites => Math.max(...sites.map(site => site[0])) - Math.min(...sites.map(site => site[0])) >= 30));
});

test('the first flame survives every later hit until the ship is removed', () => {
  const first = { id: 1, x: 35, y: 42 };
  let fires = addPersistentHullFire([], first, 2);
  for (let id = 2; id <= 20; id++) fires = addPersistentHullFire(fires, { id, x: id * 9 % 100, y: 80 }, id >= 10 ? 8 : 2);
  assert.strictEqual(fires[0], first);
  assert.equal(fires.length, 8);
  assert.deepEqual(addPersistentHullFire([], { id: 21, x: 50, y: 50 }, 4), [{ id: 21, x: 50, y: 50 }]);
});

test('damage permits progressively more sites while keeping bosses and small ships bounded', () => {
  for (const boss of [false, true]) {
    let previous = 0;
    for (let health = 100; health >= 0; health--) {
      const limit = hullFireLimit(health, 100, boss);
      assert.ok(limit >= previous && limit <= (boss ? 8 : 4));
      previous = limit;
    }
    assert.equal(previous, boss ? 8 : 4);
  }
});

test('nearby hits reheat one bounded patch without duplicating it', () => {
  const first = { id: 1, x: 35, y: 42 };
  assert.deepEqual(addPersistentHullFire([first], { id: 2, x: 35, y: 42 }, 8), [{ ...first, revision: 2, impactPower: undefined }]);
  assert.deepEqual(addPersistentHullFire([first], { id: 1, x: 70, y: 70 }, 8), [first]);
});

test('effect variation stays deterministic and bounded across weapon strengths', () => {
  assert.deepEqual(hullImpactProfile(7, 2), hullImpactProfile(7, 2));
  const profiles = Array.from({ length: 100 }, (_, id) => hullImpactProfile(id, 5));
  assert.ok(new Set(profiles.map(p => p.angle)).size > 90);
  assert.ok(new Set(profiles.map(p => p.shape)).size > 90);
  for (const p of profiles) {
    assert.ok(p.size >= .72 && p.size <= 1.64);
    assert.ok(p.sparks.length >= 3 && p.sparks.length <= 5);
    assert.ok(p.cooling >= 1.4 && p.cooling <= 3.3);
    assert.ok(p.sparks.every(s => Math.hypot(s.x, s.y) <= 27));
  }
  assert.ok(hullImpactProfile(7, 5).size > hullImpactProfile(7, 1).size);
});
