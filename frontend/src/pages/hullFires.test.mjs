import assert from 'node:assert/strict';
import test from 'node:test';
import { bossFireSites, hullFireAtImpact, spriteFireSites } from './hullFires.ts';

test('rotating and aligned ships ignite their painted hull, not a world-space ring', () => {
  const sites = [[50, 40], [60, 50], [40, 60]];
  const hit = hullFireAtImpact({ id: 7, x: 110, y: 100 }, { x: 100, y: 100 }, 100, sites, [], 90);
  assert.deepEqual(hit, { id: 7, x: 50, y: 40 });
  assert.deepEqual(hullFireAtImpact({ id: 8, x: 96, y: 103 }, { x: 100, y: 100 }, 100, sites, [], 0, { x: 4, y: -3 }), { id: 8, x: 50, y: 40 });
});

test('repeated hits ignite distinct, bounded points of the boss', () => {
  const target = { x: 200, y: 200 };
  const first = hullFireAtImpact({ id: 1, x: 210, y: 210 }, target, 124, bossFireSites);
  const second = hullFireAtImpact({ id: 2, x: 210, y: 210 }, target, 124, bossFireSites, [first]);
  assert.notDeepEqual([first.x, first.y], [second.x, second.y]);
  assert.ok(Math.hypot(first.x - second.x, first.y - second.y) >= 22);
  assert.ok(bossFireSites.some(([x, y]) => x === first.x && y === first.y));
  assert.ok(bossFireSites.some(([x, y]) => x === second.x && y === second.y));
  assert.equal(spriteFireSites.length, 20);
  assert.ok(spriteFireSites.every(sites => sites.length >= 7));
  assert.ok(spriteFireSites.every(sites => Math.max(...sites.map(site => site[0])) - Math.min(...sites.map(site => site[0])) >= 30));
});
