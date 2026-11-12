import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSectorBoss, moveSectorBoss } from './sectorBoss.ts';
import { advanceBossTurrets, gunMuzzle } from './bossTurrets.ts';
import { bossWeapons } from './bossWeapons.ts';
import { generateBossSound } from './bossWeaponSound.ts';
import { enemyShotLimit } from './enemyFire.ts';

test('all 392 stations fire from every muzzle under the existing phone projectile budget', () => {
  const width = 390, height = 760, step = 20;
  let stationCount = 0, muzzleCount = 0;
  for (let id = 1; id <= 50; id++) {
    const level = id * 10, guns = bossWeapons[id - 1];
    let boss = createSectorBoss(level, width, 90, height), active = [], nextId = 0;
    const fired = guns.map(() => new Set());
    for (const turret of boss.turrets) assert.ok(Math.abs(turret.a) < Math.PI / 2, `boss ${id} entry aim`);
    for (let time = 0; time < 180_000; time += step) {
      boss = moveSectorBoss(boss, step, width, height);
      active = active.map(shot => ({ ...shot, x: shot.x + shot.vx * step, y: shot.y + shot.vy * step }))
        .filter(shot => shot.y < height + 20 && shot.y > 0 && shot.x > -30 && shot.x < width + 30);
      const cap = enemyShotLimit(width, time, level);
      const { shots, events } = advanceBossTurrets(boss, { x: .5, y: .88 }, width, height, step, cap - active.length, nextId);
      nextId += shots.length;
      active.push(...shots);
      assert.ok(active.length <= cap);
      let shotIndex = 0;
      for (const event of events) {
        assert.ok(event.error < .035 && event.lock >= 160);
        const gun = guns[event.gunIndex], turret = boss.turrets[event.gunIndex];
        assert.equal(turret.firedBarrels.length, event.barrels);
        assert.equal(new Set(turret.firedBarrels).size, event.barrels);
        for (const barrel of turret.firedBarrels) {
          fired[event.gunIndex].add(barrel);
          const shot = shots[shotIndex++];
          const muzzle = gunMuzzle(boss, gun, turret, barrel, gun.recoil);
          assert.equal(shot.sourceGun, event.gunIndex);
          assert.deepEqual({ x: shot.x, y: shot.y }, muzzle);
          assert.ok(Number.isFinite(shot.x + shot.y + shot.vx + shot.vy + shot.radius));
        }
      }
      assert.equal(shotIndex, shots.length);
    }
    fired.forEach((barrels, index) => {
      assert.equal(barrels.size, guns[index].barrels.length, `boss ${id} station ${index}`);
      muzzleCount += barrels.size;
    });
    stationCount += fired.length;
  }
  assert.equal(stationCount, 392);
  assert.equal(muzzleCount, 718);
});

test('entry, pause, death and loss of alignment prevent firing including queued salvos',()=>{
 const boss=createSectorBoss(500,390,90,760);
 assert.equal(advanceBossTurrets(boss,{x:.5,y:.88},390,760,80,8,0).shots.length,0);
 boss.elapsed=2000;boss.weaponClock=100000;
 for(const g of boss.turrets){g.a=0;g.lock=200;g.next=0;}
 assert.equal(advanceBossTurrets(boss,{x:.5,y:.88},390,760,0,8,0).shots.length,0);
 boss.health=0;assert.equal(advanceBossTurrets(boss,{x:.5,y:.88},390,760,80,8,0).shots.length,0);
 boss.health=100;for(const g of boss.turrets){g.pendingTotal=4;g.pendingIndex=1;g.pendingAt=0;}
 assert.equal(advanceBossTurrets(boss,{x:0,y:0},390,760,20,8,0).shots.length,0);
});

test('all eighteen caliber sound buffers are finite, bounded and distinct',()=>{
 const signatures=new Set();
 for(const kind of ['laser','pulse','plasma','heavy','siege','rocket'])for(let v=0;v<3;v++){
  const a=generateBossSound(kind,v,48000);let peak=0,hash=0;
  for(let i=0;i<a.length;i++){assert.ok(Number.isFinite(a[i]));peak=Math.max(peak,Math.abs(a[i]));hash+=a[i]*Math.sin(i*.71);}
  assert.ok(peak>.1&&peak<=.73);signatures.add(`${a.length}:${hash}`);
 }
 assert.equal(signatures.size,18);
});
