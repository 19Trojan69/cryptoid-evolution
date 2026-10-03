import { test } from "node:test";
import assert from "node:assert/strict";
import { bossManifest, bossForLevel } from "./bossManifest.ts";
import { bossAnchorPosition, bossExplosionSize, bossFallTargetY, bossFireSite, bossHullContains, bossVolley } from "./bossCombat.ts";
import { createSectorBoss, moveSectorBoss, BOSS_ENTRY_MS } from "./sectorBoss.ts";

test("fifty distinct art files, assigned to the fifty levels with per-hull coordinates", () => {
  assert.equal(bossManifest.length, 50);
  assert.equal(new Set(bossManifest.map(boss => boss.image)).size, 50);
  assert.equal(bossForLevel(9), undefined);
  assert.equal(bossForLevel(501), undefined);
  bossManifest.forEach((config, index) => {
    assert.equal(config.id, index + 1);
    assert.equal(config.level, (index + 1) * 10);
    assert.equal(bossForLevel(config.level), config);
    assert.ok(config.aspectRatio > 2);
    assert.ok(config.engineAnchors.length >= 2 && config.engineAnchors.length <= 6);
    assert.ok(config.weaponAnchors.length >= 2);
    assert.ok(config.fireSites.length >= 5);
    assert.ok(config.projectilePool.length >= 5);
    for (const anchor of [...config.engineAnchors, ...config.weaponAnchors]) assert.ok(anchor.every(value => value >= 0 && value <= 1));
  });
  assert.ok(new Set(bossManifest.map(boss => JSON.stringify(boss.engineAnchors))).size > 45);
  assert.ok(new Set(bossManifest.map(boss => JSON.stringify(boss.weaponAnchors))).size > 45);
});

test("pixel mask excludes transparent wings and gaps while burns stay on the hull", () => {
  for (const { level } of bossManifest) {
    const boss = createSectorBoss(level, 390, 90, 760);
    assert.equal(bossHullContains(boss, boss.x - boss.width / 2, boss.y - boss.height / 2), false);
    const sites = boss.config.fireSites;
    for (const site of sites) {
      const point = bossAnchorPosition(boss, [site[0] / 100, site[1] / 100]);
      assert.equal(bossHullContains(boss, point.x, point.y), true, `Boss ${boss.config.id} burn site ${site}`);
      const fire = bossFireSite(boss, point.x, point.y, []);
      assert.ok(Math.abs(fire.x - site[0]) < 1e-10 && Math.abs(fire.y - site[1]) < 1e-10);
      assert.deepEqual(bossFireSite(boss, point.x, point.y, [fire]), fire);
    }
  }
});

test("phone and desktop bosses remain inside their safe region", () => {
  for (const config of bossManifest) for (const [width, height] of [[375, 700], [390, 844], [1200, 800]]) {
    let boss = createSectorBoss(config.level, width, 92, height);
    for (let step = 0; step < 100; step++) boss = moveSectorBoss(boss, step ? 100 : BOSS_ENTRY_MS, width, height);
    assert.ok(boss.x - boss.width / 2 >= 12 && boss.x + boss.width / 2 <= width - 12);
    assert.ok(boss.y + boss.height / 2 < height * .5);
    assert.ok(bossExplosionSize(config, width) > 0);
    assert.ok(bossFallTargetY(boss, height) >= height * .5);
    assert.ok(bossFallTargetY(boss, height) <= height * .58);
    assert.ok(bossFallTargetY(boss, height) > boss.y);
  }
  assert.ok(bossExplosionSize(bossManifest[49], 390) > bossExplosionSize(bossManifest[0], 390));
});

test("boss salvos originate at listed weapon muzzles and rotate predictable kinds", () => {
  const boss = createSectorBoss(500, 390, 92, 760);
  boss.y = 210;
  const player = { x: .5, y: .85 };
  const seen = new Set();
  for (let volley = 0; volley < 8; volley++) {
    boss.volley = volley;
    const shots = bossVolley(boss, player, 390, 760, 4, 10);
    assert.ok(shots.length >= 1 && shots.length <= 3);
    for (const shot of shots) {
      assert.ok(boss.config.weaponAnchors.some(anchor => {
        const position = bossAnchorPosition(boss, anchor);
        return Math.abs(shot.x - position.x) < .01 && Math.abs(shot.y - position.y) < .01;
      }));
      seen.add(shot.bossKind);
    }
  }
  assert.ok(seen.size >= 7);
});
