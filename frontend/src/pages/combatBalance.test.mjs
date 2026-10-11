import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseCryptoid } from './cryptoidRoster.ts';
import { enemyHealthBonus } from './levelDifficulty.ts';
import { createSectorBoss, damageSectorBoss, BOSS_ENTRY_MS } from './sectorBoss.ts';
import { bossDifficulty } from './bossDifficulty.ts';
import { bossWeapons } from './bossWeapons.ts';
import { damageBossTurret } from './bossTurrets.ts';
import { makeShipVolley, shipBaseFirepower, shipFireInterval } from './shipAttributes.ts';
import { playerSkins } from './shipFleet.ts';
import { stageWeaponLevel } from './shipEvolution.ts';
import { detonateBossBomb } from './specialPowers.ts';
import { auditCombatBalance, simulateBossDamage } from '../../scripts/combat-balance-audit.mjs';

test('all six enemy types retain proportional class durability throughout all 500 stages', () => {
  const base = { solflare: 4, memeSwarm: 4, etherCrystal: 8, stableCore: 8, bitrock: 12, ghostCoin: 10 };
  const seen = new Set();
  for (let level = 1; level <= 500; level++) for (let slot = 0; slot < 26; slot++) {
    const enemy = chooseCryptoid(level, slot);
    const factor = enemy.health / base[enemy.type];
    assert.equal(factor, 1 + enemyHealthBonus(level, slot) / 4);
    assert.ok(factor >= 1 && factor <= 1.5);
    seen.add(enemy.type);
    if (level === 500) assert.equal(factor, 1.5);
  }
  assert.equal(seen.size, 6);
});

test('every battery follows a smooth total health budget with caliber-dependent station shares', () => {
  let previous = 0;
  for (let id = 1; id <= 50; id++) {
    const boss = createSectorBoss(id * 10, 390);
    const total = boss.turrets.reduce((sum, gun) => sum + gun.health, 0);
    assert.ok(Math.abs(total - bossDifficulty(id).turretHealthBudget) < .00002);
    assert.ok(total > previous);
    if (id > 10) assert.ok(total / previous < 1.12, `No large durability jump at boss ${id}`);
    for (let a = 0; a < boss.turrets.length; a++) for (let b = 0; b < boss.turrets.length; b++) {
      if (bossWeapons[id - 1][a].caliber > bossWeapons[id - 1][b].caliber)
        assert.ok(boss.turrets[a].health > boss.turrets[b].health);
    }
    previous = total;
  }
  assert.ok(Math.abs(previous - 216) < .00002);
});

test('every stage and weapon receives its full connected-shot firepower at an exposed core', () => {
  for (const skin of playerSkins) for (const stage of [1, 2, 3]) for (let weapon = 1; weapon <= 5; weapon++) {
    const boss = createSectorBoss(500, 390);
    boss.elapsed = BOSS_ENTRY_MS;
    boss.turrets.forEach(gun => { gun.health = 0; });
    let next = 0;
    const shots = makeShipVolley(skin.id, stage, weapon, 100, 200, false, () => ++next);
    const expected = shots.reduce((sum, shot) => sum + shot.damage, 0) * 2;
    const health = boss.health;
    for (const shot of shots) assert.equal(damageSectorBoss(boss, shot.damage, 1000), true);
    assert.ok(Math.abs(health - boss.health - expected) < 1e-9);
    const interval = shipFireInterval(skin.id, stageWeaponLevel(stage, weapon), 0);
    if (weapon === 1) assert.ok(Math.abs(expected / 2 * 1000 / interval - shipBaseFirepower(skin.id, stage)) < 1e-9);
  }
});

test('reactor protection, independent station damage and fractional resume health still hold', () => {
  for (let id = 1; id <= 50; id++) {
    let boss = createSectorBoss(id * 10, 390);
    boss.elapsed = BOSS_ENTRY_MS;
    const hull = boss.health;
    assert.equal(damageSectorBoss(boss, 10000, 1000), false);
    boss.turrets.forEach((gun, index) => {
      damageBossTurret(boss, index, gun.health - .25);
      assert.ok(Math.abs(gun.health - .25) < 1e-9);
    });
    boss = JSON.parse(JSON.stringify(boss));
    assert.equal(boss.health, hull);
    boss.turrets.forEach((_, index) => { damageBossTurret(boss, index, .25); });
    assert.equal(damageSectorBoss(boss, hull / 2, 1000), true);
    assert.equal(boss.health, 0);
    assert.equal(damageSectorBoss(boss, 1, 1000), false);
  }
});

test('60,000 ideal damage scenarios complete with stage progression and bounded late-boss durations', () => {
  const report = auditCombatBalance();
  assert.equal(report.scenarios, 60000);
  for (const row of report.bosses) {
    assert.ok(row.greyElite < row.greyAdvanced && row.greyAdvanced < row.greyStandard);
    assert.ok(row.redWeapon5 <= row.greyWeapon5);
  }
  for (let level = 10; level <= 500; level += 10) {
    const fullWeapon = simulateBossDamage({ level, weapon: 5 });
    assert.ok(fullWeapon.seconds < 18);
    assert.ok(fullWeapon.seconds > 4);
    const baseline = simulateBossDamage({ level, baseline: true });
    const current = simulateBossDamage({ level });
    assert.ok(current.seconds < 140, 'Base weapon remains viable without buying an upgrade');
    if (level === 10) assert.ok(current.seconds >= baseline.seconds * .95 && current.seconds <= baseline.seconds);
  }
});

test('temporary free weapons expire and permanent stages retain their advantage afterward', () => {
  for (const stage of [1, 2, 3]) {
    const options = { level: 500, stage, weapon: stage === 1 ? 2 : 3 };
    const base = simulateBossDamage({ level: 500, stage });
    const temporary = simulateBossDamage({ ...options, weaponDurationMs: 20000 });
    const permanent = simulateBossDamage(options);
    assert.ok(temporary.seconds <= base.seconds && temporary.seconds >= permanent.seconds);
    assert.ok(temporary.seconds > 20, 'The fight continues after the free weapon expires');
  }
});

test('bomb resistance remains meaningful after station health redistribution and never kills a reactor', () => {
  let previous = 0;
  for (let id = 1; id <= 50; id++) {
    const boss = createSectorBoss(id * 10, 390);
    boss.elapsed = BOSS_ENTRY_MS;
    let blasts = 0;
    while (boss.turrets.some(gun => gun.health > 0) && blasts < 10) {
      detonateBossBomb(boss, ++blasts * 1000);
      assert.ok(boss.health > 0);
    }
    assert.ok(blasts >= previous && blasts <= 4);
    if (id === 1) assert.equal(blasts, 1);
    if (id === 50) assert.equal(blasts, 4);
    previous = blasts;
  }
});
