// Exercise the production renderer's allocation/release behavior for every boss.
import assert from 'node:assert/strict';
import { createSectorBoss } from '../src/pages/sectorBoss.ts';
import { drawBossWeapons, disposeBossWeapons, weaponCanvasSize } from '../src/pages/bossWeaponRenderer.ts';
let guns = 0;
for (let id = 1; id <= 50; id++) {
  const surfaces = [];
  let gradients = 0;
  const make = (width, height) => {
    const context = new Proxy({}, {get: (target, name) => name === 'createLinearGradient'
      ? () => { gradients++; return {addColorStop() {}}; }
      : target[name] ?? (() => {})});
    const surface = {width, height, getContext: () => context};
    surfaces.push(surface); return surface;
  };
  const boss = createSectorBoss(id * 10, 430);
  const size = weaponCanvasSize(boss);
  const canvas = make(Math.ceil(size.width), Math.ceil(size.height));
  const draw = () => assert.equal(drawBossWeapons(canvas, boss, {}, false, make), true);
  draw();
  assert.equal(surfaces.length, 2, `boss ${id}: destination and socket layer only`);
  boss.turrets.forEach(g => g.health = g.maxHealth * .500001); draw();
  assert.equal(gradients, 0);
  boss.turrets.forEach(g => g.health = g.maxHealth * .5); draw();
  assert.equal(gradients, boss.turrets.length);
  const heated = surfaces.slice(2);
  for (const fraction of [.499999, .4, .25, .01]) {
    boss.turrets.forEach(g => g.health = g.maxHealth * fraction);
    for (let frame = 0; frame < 20; frame++) draw();
    assert.equal(gradients, boss.turrets.length, `boss ${id}: reuse fixed heat`);
    assert.equal(surfaces.length, 2 + boss.turrets.length);
  }
  boss.turrets.forEach(g => g.health = 0); draw();
  assert.ok(heated.every(c => c.width === 0 && c.height === 0));
  disposeBossWeapons(canvas);
  assert.ok(surfaces.every(c => c.width === 0 && c.height === 0));
  guns += boss.turrets.length;
}
console.log(JSON.stringify({passed:true,bosses:50,guns,framesBelowThresholdPerBoss:80,heatTexturesPerGun:1,released:true}));
