import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { projectileSnapshotChange, restoreProjectileSnapshotGameChange } from '../../scripts/projectileSnapshotReviewedChanges.mjs';

const source = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const { before, after } = projectileSnapshotChange;
assert.equal(source.split(after).length, 2, 'exercise the exact current scene publisher');
const publish = statement => new Function('current', 'setGame', 'return ' + statement.trim());
const previous = publish(before), candidate = publish(after);
const state = () => ({ sector: 60, status: 'playing', score: 1000, shards: 25, hearts: 3,
  boss: { health: 200, turrets: [{ health: 4 }] }, asteroids: [{ id: 4, x: 10, y: 30 }],
  bonusTargets: [{ id: 5 }], effects: [{ id: 6 }], powerUps: [{ id: 7 }],
  shots: [{ id: 1, x: 100, y: 200 }], enemyShots: [{ id: 2, x: 100, y: 30 }],
});

test('the actual scene publisher avoids both unused projectile traversals; the released statement reproduces them', () => {
  const current = state(); let traversals = 0, entries = 0;
  for (const key of ['shots', 'enemyShots']) {
    const items = Array.from({ length: key === 'shots' ? 72 : 100 }, (_, id) => ({ id, x: id, y: id + 20 }));
    current[key] = new Proxy(items, { get(target, name, receiver) {
      if (name === Symbol.iterator) return function* () { traversals++; for (const item of target) { entries++; yield item; } };
      return Reflect.get(target, name, receiver);
    } });
  }
  for (let frame = 0; frame < 600; frame++) previous(current, value => value);
  assert.equal(traversals, 1200); assert.equal(entries, 600 * 172);
  traversals = entries = 0;
  for (let frame = 0; frame < 600; frame++) candidate(current, value => value);
  assert.equal(traversals, 0); assert.equal(entries, 0);
});

test('rendered lists and boss snapshots keep their exact existing ownership, values and order', () => {
  for (const encounter of ['normal', 'boss-intro', 'boss-fight', 'boss-clear', 'bonus']) {
    const current = { ...state(), encounter }, control = previous(current, value => value), view = candidate(current, value => value);
    assert.deepEqual(view, control);
    assert.notEqual(view, current); assert.notEqual(view.boss, current.boss);
    for (const key of ['asteroids', 'bonusTargets', 'effects', 'powerUps']) {
      assert.notEqual(view[key], current[key]); assert.deepEqual(view[key], current[key]);
    }
    assert.equal(view.shots, current.shots); assert.equal(view.enemyShots, current.enemyShots);
    assert.equal(view.boss.turrets, current.boss.turrets);
    const oldShots = view.shots;
    current.shots = []; current.enemyShots = [];
    assert.equal(view.shots, oldShots, 'an old scene cannot replace the live simulation lists');
    assert.equal(current.shots.length, 0);
  }
});

test('only the reviewed unused copies change; direct presentation, UI consumers, combat and lifecycle stay released', () => {
  const restored = restoreProjectileSnapshotGameChange(source);
  assert.equal(createHash('sha256').update(restored).digest('hex'), 'aa98bc74c430c87211d081c71ea1ea720aecf7c64a10809b234268ce0f33fd51');
  assert.doesNotMatch(source, /\bgame\.(?:shots|enemyShots)\b/);
  assert.ok(source.indexOf('projectilesRef.current?.present(stateRef.current);', source.indexOf('const step =')) < source.indexOf(after));
  const changed = source.replace('effects: [...current.effects]', 'effects: current.effects');
  assert.throws(() => restoreProjectileSnapshotGameChange(changed), /one exact/);
  const changedPause = source.replace("stateRef.current.status = 'paused';", "stateRef.current.status = 'playing';");
  assert.notEqual(createHash('sha256').update(restoreProjectileSnapshotGameChange(changedPause)).digest('hex'), 'aa98bc74c430c87211d081c71ea1ea720aecf7c64a10809b234268ce0f33fd51');
});
