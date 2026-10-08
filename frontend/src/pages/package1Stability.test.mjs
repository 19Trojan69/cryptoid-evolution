import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceEnemyShot, enemyShotHitsPlayer, enemyShotOutsideField } from './enemyFire.ts';
import { missionShardBase, missionShardTotal, uncreditedGuestShards } from './shardEarnings.ts';
import { createSectorBoss, BOSS_ENTRY_MS } from './sectorBoss.ts';
import { advanceBossTurrets } from './bossTurrets.ts';
import { advanceBossCore } from './bossCore.ts';
import { projectileImpact } from './shipEvolution.ts';
import { resolvePlayerDamage } from './powerUps.ts';

const player = { x: .5, y: .85 }, width = 390, height = 760;
const hit = (shot) => enemyShotHitsPlayer(shot, player, width, height);
test('continuous collision catches crossing shots and fast player movement, but not near misses', () => {
  const before = { id: 1, x: 195, y: 500, vx: 0, vy: 1, radius: 3 };
  const after = advanceEnemyShot(before, 250);
  assert.equal(hit(before), false); assert.equal(hit(after), false);
  assert.equal(enemyShotHitsPlayer(after, player, width, height, before), true);
  const stationary = { ...before, x: 195, y: player.y * height, vx: 0, vy: 0 };
  assert.equal(enemyShotHitsPlayer(stationary, { x: .8, y: .85 }, width, height, stationary, { x: .2, y: .85 }), true);
  assert.equal(enemyShotHitsPlayer({ ...after, x: 245 }, player, width, height, { ...before, x: 245 }), false);
});
test('laser solid tip collides; its glow and a broadside near miss do not', () => {
  const laser = { id: 1, x: 195, y: player.y * height - 32, vx: 0, vy: .24, radius: 2, weaponKind: 'laser', weaponWidth: 3 };
  assert.equal(hit(laser), true);
  assert.equal(hit({ ...laser, y: laser.y - 5 }), false);
  assert.equal(hit({ ...laser, x: 222, y: player.y * height }), false);
});
test('spent projectiles leave through every edge including upward boss fire', () => {
  const shot = { id: 1, x: 195, y: 500, vx: 0, vy: -.2, radius: 4 };
  assert.equal(enemyShotOutsideField(shot, width, height), false);
  for (const p of [{ x: -100, y: 50 }, { x: 500, y: 50 }, { x: 50, y: -100 }, { x: 50, y: 900 }]) assert.equal(enemyShotOutsideField({ ...shot, ...p }, width, height), true);
});
test('all 50 bosses and all 392 stations produce damaging shots with consistent shield/armor behavior', () => {
  let guns = 0; const kinds = new Set();
  for (let id = 1; id <= 50; id++) {
    const boss = createSectorBoss(id * 10, width, 90, height); boss.elapsed = BOSS_ENTRY_MS + 100;
    boss.weaponClock = 100000;
    const seen = new Set();
    for (let frame = 0; frame < 400 && seen.size < boss.turrets.length; frame++) {
      const result = advanceBossTurrets(boss, player, width, height, 34, 100, frame * 100);
      for (const shot of result.shots) {
        seen.add(shot.sourceGun); kinds.add(shot.weaponKind);
        const contact = { ...shot, x: player.x * width, y: player.y * height };
        assert.equal(hit(contact), true, `boss ${id}, gun ${shot.sourceGun}`);
        assert.equal(projectileImpact(0, false).damage, 1);
        assert.equal(projectileImpact(1, false).damage, 0);
        const shield = projectileImpact(1, true);
        const resolved = resolvePlayerDamage({ hearts: 3, shieldCharges: 1, shieldMs: 1000 }, shield.damage, true);
        assert.equal(resolved.hearts, 3); assert.equal(resolved.shieldCharges, 0);
      }
    }
    assert.equal(seen.size, boss.turrets.length, `all guns fired for boss ${id}`); guns += seen.size;
    boss.turrets.forEach(g => { g.health = 0; });
    let coreShots = [];
    for (let i = 0; i < 100 && !coreShots.length; i++) coreShots = advanceBossCore(boss, player, width, height, 34, 8, 10000);
    assert.ok(coreShots.length, `reactor ${id}`);
    for (const shot of coreShots) assert.equal(hit({ ...shot, x: 195, y: player.y * height }), true);
  }
  assert.equal(guns, 392);
  assert.deepEqual([...kinds].sort(), ['heavy', 'laser', 'plasma', 'pulse', 'rocket', 'siege']);
});
test('new mission and resume preserve wallet totals without crediting earned shards twice', () => {
  assert.equal(missionShardTotal(missionShardBase(1250), 20), 1270);
  assert.equal(missionShardTotal(missionShardBase(1270, 20), 20), 1270);
  assert.equal(missionShardTotal(missionShardBase(1270, 20), 35), 1285);
  // A purchase can leave a wallet below already credited run earnings.
  assert.equal(missionShardTotal(missionShardBase(5, 20), 22), 7);
  let wallet = 1250, credited = 0;
  for (const earned of [20, 20, 35, 35]) { wallet += uncreditedGuestShards(earned, credited); credited = earned; }
  assert.equal(wallet, 1285);
});
