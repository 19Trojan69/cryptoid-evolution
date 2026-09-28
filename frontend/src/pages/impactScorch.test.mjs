import assert from 'node:assert/strict';
import test from 'node:test';
import { scorchAtImpact } from './impactScorch.ts';

test('a hit remains on the same part of the hull as the ship rotates', () => {
  const impact = scorchAtImpact({ id: 7, x: 110, y: 100 }, { x: 100, y: 100 }, 100, 90);
  assert.equal(impact.id, 7);
  assert.ok(Math.abs(impact.x - 50) < 1e-8);
  assert.equal(impact.y, 40);
  // The stored position rotates along with the ship, rather than staying at the old world position.
  const localY = (impact.y - 50) * 100 / 100;
  assert.ok(Math.abs(100 - localY * Math.sin(Math.PI) - 100) < 1e-8);
  assert.equal(100 + localY * Math.cos(Math.PI), 110);
});

test('sprite alignment offsets move the mark and distant hits remain on the hull', () => {
  assert.deepEqual(scorchAtImpact({ id: 1, x: 100, y: 100 }, { x: 100, y: 100 }, 100, 0, { x: 4, y: -3 }), { id: 1, x: 54, y: 47 });
  assert.deepEqual(scorchAtImpact({ id: 2, x: 300, y: -200 }, { x: 100, y: 100 }, 100), { id: 2, x: 80, y: 20 });
});
