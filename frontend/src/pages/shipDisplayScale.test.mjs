import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { enemyVisualDiameter } from './shipDisplayScale.ts';
import { chooseCryptoid } from './cryptoidRoster.ts';
import {normalEnemyVisualDiameter,normalEnemyLayoutScale,strengthVisualDiameter} from './shipDisplayScale.ts';
import {enemyHullSpan} from './shipHullBounds.ts';

test('visible hulls retain exact strength ratios across all 20 transparent sprites and viewport sizes',()=>{
 for(const [height,hud,player] of [[659,64,94],[568,64,94],[844,80,104],[1024,94,132],[600,80,112]]){
  const scale=normalEnemyLayoutScale(height,hud,player);
  for(const [kind,ratio] of [['light',1],['medium',1.5],['heavy',2],['elite',2.5]])for(let sprite=0;sprite<20;sprite++){
   const visible=normalEnemyVisualDiameter(kind,player,sprite,scale)*enemyHullSpan(sprite);
   const light=strengthVisualDiameter('light',player)*scale;
   assert.ok(Math.abs(visible-light*ratio)<1e-8,'transparent margins cannot flatten the actual size hierarchy');
  }
 }
});

test('normal opponents keep the same proportions to the player on phones and tablets', () => {
  for (const radius of [25, 36, 50]) {
    const ratio = enemyVisualDiameter(radius, 94) / 94;
    for (const player of [104, 112, 132, 160]) assert.ok(Math.abs(enemyVisualDiameter(radius, player) / player - ratio) < 1e-9);
  }
  assert.ok(enemyVisualDiameter(25, 132) > 77);
  assert.ok(enemyVisualDiameter(36, 132) > 110);
  assert.ok(enemyVisualDiameter(50, 132) > 150);
});

test('light, medium, heavy and escorts retain their size order and combat definitions', () => {
  assert.ok(enemyVisualDiameter(18, 132) < enemyVisualDiameter(25, 132));
  assert.ok(enemyVisualDiameter(25, 132) < enemyVisualDiameter(36, 132));
  assert.ok(enemyVisualDiameter(36, 132) < enemyVisualDiameter(50, 132));
  const profile = chooseCryptoid(1, 0), original = { ...profile };
  enemyVisualDiameter(profile.radius, 160);
  assert.deepEqual(profile, original);
  assert.equal(profile.radius, 25);
  assert.ok(Math.abs(enemyVisualDiameter(25, 94) - 55) < 1e-9);
});

test('the actual game measures the player on resize and passes that size into the renderer', () => {
  const game = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
  assert.match(game, /playerShipRef\.current\?\.clientWidth/);
  assert.match(game, /if \(playerWidth\) setPlayerDisplayDiameter\(playerWidth\)/);
  assert.match(game, /new ResizeObserver\(measureVisibleTop\)/);
  assert.match(game, /enemyVisualDiameter\(asteroid\.radius, playerDisplayDiameter, combatVarietyEnabled && asteroid\.size === "small"\)/);
});


test('Testnet small opponents are 25 percent smaller than the doubled version, preserving physics and other sizes', () => {
  for (const player of [94, 104, 112, 132, 160]) {
    for (const radius of [18, 25]) assert.equal(enemyVisualDiameter(radius, player, true), 1.5 * enemyVisualDiameter(radius, player));
    for (const radius of [36, 50]) assert.equal(enemyVisualDiameter(radius, player, false), enemyVisualDiameter(radius, player));
  }
  const profile = chooseCryptoid(1, 0), before = {...profile};
  enemyVisualDiameter(profile.radius, 132, true);
  assert.deepEqual(profile, before);
});
