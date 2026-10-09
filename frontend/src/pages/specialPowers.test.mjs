import test from 'node:test';
import assert from 'node:assert/strict';
import { createSectorBoss, bossHullExposed } from './sectorBoss.ts';
import { bombTurretDamage, detonateBossBomb, disableEnemyWeapons, EMP_DURATION_MS } from './specialPowers.ts';
import { bossHitTarget } from './bossHitTarget.ts';
import { bossWeapons } from './bossWeapons.ts';
import { gunPosition, advanceBossTurrets } from './bossTurrets.ts';
import { languages, translate } from '../i18n.ts';
import { package3Translations } from '../locales/package3.ts';

test('one blast destroys the first boss battery, pays every gun once and leaves its hull alive', () => {
  const boss = createSectorBoss(10, 390, 90, 760); boss.elapsed = 2000;
  const before = boss.health;
  const blast = detonateBossBomb(boss, 2000);
  assert.equal(blast.impacts.length, boss.turrets.length);
  assert(blast.impacts.every(impact => impact.destroyed && impact.bonus > 0));
  assert(bossHullExposed(boss));
  assert.equal(blast.hullDamage, 36);
  assert.equal(boss.health, before - 36);
  assert.equal(detonateBossBomb(boss, 2300).impacts.length, 0);
  assert(boss.health > 0);
});

test('later batteries scale across all fifty bosses and a bomb never ends the encounter', () => {
  for (let id = 2; id <= 50; id++) {
    const boss = createSectorBoss(id * 10, 390, 90, 760); boss.elapsed = 2000;
    const blast = detonateBossBomb(boss, 2000);
    assert(boss.health > 0, `boss ${id}`);
    assert.equal(blast.impacts.length, boss.turrets.length);
    if (id >= 30) assert(blast.impacts.some(impact => !impact.destroyed), `boss ${id} needs surviving turret`);
    for (const gun of boss.turrets) {
      assert(gun.health >= 0 && gun.health <= gun.maxHealth);
    }
    boss.turrets.forEach(turret => { turret.health = 0; });
    boss.health = 2;
    assert.equal(detonateBossBomb(boss, 3000).hullDamage, 1);
    assert.equal(boss.health, 1);
    assert.equal(detonateBossBomb(boss, 3200).hullDamage, 0);
  }
  assert(bombTurretDamage(50) > bombTurretDamage(1));
});

test('EMP changes only weapon suppression: shots, enemies and boss remain intact and moving', () => {
  const boss = createSectorBoss(10, 390, 90, 760); boss.elapsed = 2000;
  const enemies = [{ id: 1, x: 100, health: 5 }], shots = [{ id: 2, x: 200, vy: .2 }];
  const state = { empMs: 0, asteroids: enemies, enemyShots: shots, boss, score: 200 };
  disableEnemyWeapons(state);
  assert.equal(state.empMs, EMP_DURATION_MS);
  assert.equal(state.asteroids, enemies); assert.equal(state.enemyShots, shots);
  assert.equal(state.boss, boss); assert.equal(state.score, 200);
  assert.equal(shots[0].x + shots[0].vy * 20, 204);
  assert.equal(boss.turrets[0].health, boss.turrets[0].maxHealth);
});

test('shop, guide and combat labels describe the new mechanics in every supported language', () => {
  for (const locale of Object.keys(languages)) {
    if (locale === 'en') continue;
    const entries = package3Translations[locale];
    assert.equal(Object.keys(entries).length, 8, locale);
    for (const [source, translated] of Object.entries(entries)) {
      assert(translated.length > 5, `${locale}: ${source}`);
      assert.equal(translate(locale, source), translated);
    }
  }
});

test('gun intersection remains reachable and bounded over all bosses after long fights', () => {
  for (let id = 1; id <= 50; id++) {
    const boss = createSectorBoss(id * 10, 390, 90, 760); boss.elapsed = 2000;
    let nextId = 0, active = [], fired = 0;
    for (let time = 0; time < 120000; time += 32) {
      active = active.map(shot => ({ ...shot, x: shot.x + shot.vx * 32, y: shot.y + shot.vy * 32 })).filter(shot => shot.y < 770 && shot.x > -30 && shot.x < 420);
      const out = advanceBossTurrets(boss, { x: .5, y: .85 }, 390, 760, 32, 6 - active.length, nextId);
      nextId += out.shots.length;
      fired += out.shots.length;
      active.push(...out.shots);
      assert(active.length <= 6);
      if (time % 256 === 0) bossHitTarget(boss, { x: boss.x, y: boss.y + boss.height }, { x: boss.x, y: boss.y - boss.height });
    }
    assert(fired > 0, `boss ${id} fires during the long encounter`);
    boss.turrets.forEach((turret, index) => {
      if (index > 0) turret.health = 0;
    });
    const gun = bossWeapons[id - 1][0], pos = gunPosition(boss, gun);
    assert.equal(bossHitTarget(boss, { x: pos.x, y: pos.y + 60 }, pos)?.index, 0, `boss ${id}`);
  }
});
