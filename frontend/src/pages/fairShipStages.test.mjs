import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { transformSync } from 'esbuild';
import { advanceEnemyShot, enemyShotHitsPlayer, enemyShotOutsideField } from './enemyFire.ts';
import { resolvePlayerDamage, POWER_UP_DURATION_MS } from './powerUps.ts';
import { activateCollectedPower } from './collectedPower.ts';
import { powerUpPickupRadius, projectileGuardForStage, projectileImpact, stageWeaponLevel } from './shipEvolution.ts';
import { restoreFairShipStageGameChanges } from '../../scripts/fairShipStagesReviewedChanges.mjs';

const source = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const hash = text => createHash('sha256').update(text).digest('hex');
function sliceBetween(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a, start);
  return source.slice(a, b);
}
function compile(body, parameters, dependencies) {
  const code = transformSync('function replay(' + parameters.join(',') + ') {' + body + '\n}', { loader: 'ts', target: 'es2022' }).code;
  return new Function(...Object.keys(dependencies), code + '; return replay;')(...Object.values(dependencies));
}

const projectileBody = sliceBetween('        let playerImpact:', '        if (heartsLost > 0)');
const cooldownMs = Number(source.match(/const IMPACT_COOLDOWN_MS = ([0-9_]+);/)[1].replaceAll('_', ''));
const impact = compile(`
  const width = 800, height = 800, time = 100, delta = 0, previousPlayer = { ...state.player };
  let heartsLost = 0, sounds = 0;
  const performanceProbeRef = { current: null }, impactCooldownRef = { current: cooldown };
  const nextIdRef = { current: 2 }, soundRef = { current: { play: () => sounds++ } };
  ${projectileBody}
  return { state, heartsLost, sounds, playerImpact, cooldown: impactCooldownRef.current };
`, ['state', 'purchasedShieldActive = false', 'cooldown = 0'], {
  advanceEnemyShot, enemyShotHitsPlayer, enemyShotOutsideField, projectileImpact, IMPACT_COOLDOWN_MS: cooldownMs,
});

const pickupBody = sliceBetween('        state.powerUps = state.powerUps.filter(pickup => {', "        performanceProbeRef.current?.mark('powerups-and-rocks')");
const collect = compile(`
  const width = 800, height = 800, shipStageRef = { current: stage };
  let sounds = 0, selections = 0;
  const soundRef = { current: { playPickup: () => sounds++ } }, syncSelectedWeapon = () => selections++;
  ${pickupBody}
  return { state, sounds, selections };
`, ['state', 'stage'], { powerUpPickupRadius, activateCollectedPower, POWER_UP_DURATION_MS, stageWeaponLevel });

function state(overrides = {}) {
  return {
    player: { x: .5, y: .85 }, hearts: 3, maxHearts: 3,
    projectileGuard: 0, shieldActive: false, shieldCharges: 0, shieldMs: 0, purchasedShieldMs: 0,
    weaponLevel: 1, weaponCap: 1, pickupWeaponLevel: 1, pickupWeaponMs: 0,
    paidWeaponLevel: 1, paidWeaponMs: 0, rapidFireMs: 0, overdriveMs: 0,
    enemyShots: [], effects: [], powerUps: [], bossHeartCollected: false, bonusTargets: [{ id: 7 }],
    ...overrides,
  };
}
const shot = () => ({ id: 1, x: 400, y: 680, vx: 0, vy: 0, radius: 5 });

test('the actual projectile handler costs the same three unshielded hearts at every stage', () => {
  for (const stage of [1, 2, 3]) {
    let s = state({ projectileGuard: projectileGuardForStage(stage) });
    for (let hit = 1; hit <= 3; hit++) {
      s.enemyShots = [shot()];
      const result = impact(s);
      assert.equal(result.heartsLost, 1);
      assert.equal(result.sounds, 0, 'no false shield feedback from a ship stage');
      assert.equal(result.state.effects.length, 0);
      s = resolvePlayerDamage(result.state, result.heartsLost, false);
      assert.equal(s.hearts, 3 - hit);
      assert.equal(s.projectileGuard, 0);
    }
  }
});

test('legacy nonzero guard cannot absorb a hit, while real pickup and purchased shields still protect', () => {
  for (const legacyGuard of [1, 2]) {
    const result = impact(state({ projectileGuard: legacyGuard, enemyShots: [shot()] }));
    assert.equal(result.heartsLost, 1);
    assert.equal(result.state.projectileGuard, 0);
  }
  const pickup = impact(state({ shieldActive: true, shieldCharges: 1, shieldMs: 1000, enemyShots: [shot()] }));
  const protectedState = resolvePlayerDamage(pickup.state, pickup.heartsLost, true);
  assert.equal(protectedState.hearts, 3);
  assert.equal(protectedState.shieldCharges, 0);
  const purchased = impact(state({ purchasedShieldMs: 1000, enemyShots: [shot()] }), true);
  assert.equal(purchased.heartsLost, 0);
  assert.equal(purchased.sounds, 1);
  assert.equal(purchased.state.effects[0].kind, 'shield');
  const disabled = impact(state({ shieldActive: false, shieldCharges: 1, shieldMs: 1000, enemyShots: [shot()] }));
  const hurt = resolvePlayerDamage(disabled.state, disabled.heartsLost, false);
  assert.equal(hurt.hearts, 2);
  assert.equal(hurt.shieldCharges, 1, 'an inactive shield stays owned without protecting');
});

test('the unchanged impact cooldown still prevents simultaneous projectiles from costing several hearts', () => {
  const result = impact(state({ enemyShots: [shot(), { ...shot(), id: 3 }] }));
  assert.equal(result.heartsLost, 1);
  assert.equal(result.cooldown, cooldownMs);
  assert.equal(impact(state({ enemyShots: [shot()] }), false, 500).heartsLost, 0);
});

test('the real normal-power-up collector obeys each circular pickup boundary and activates exactly once', () => {
  for (const stage of [1, 2, 3]) for (const angle of [0, Math.PI / 4, Math.PI / 2, Math.PI]) for (const inside of [true, false]) {
    const distance = powerUpPickupRadius(stage) + (inside ? -.001 : .001);
    const pickup = { id: 10, type: 'shield', x: 400 + Math.cos(angle) * distance, y: 680 + Math.sin(angle) * distance };
    const result = collect(state({ powerUps: [pickup] }), stage);
    assert.equal(result.state.powerUps.length, inside ? 0 : 1);
    assert.equal(result.sounds, inside ? 1 : 0);
    assert.equal(result.selections, inside ? 1 : 0);
    assert.equal(result.state.shieldCharges, inside ? 1 : 0);
    if (inside) {
      assert.equal(result.state.shieldMs, POWER_UP_DURATION_MS);
      assert.equal(result.state.shieldActive, true);
      assert.equal(result.state.pickupNotice.id, pickup.id);
    }
    assert.equal(result.state.hearts, 3);
    assert.equal(result.state.bossHeartCollected, false);
    assert.deepEqual(result.state.bonusTargets, [{ id: 7 }]);
    assert.equal(collect(result.state, stage).sounds, 0, 'a collected drop cannot activate twice');
  }
});

test('the new convenience benefit reaches only drops that the selected stage can actually collect', () => {
  for (const [distance, expected] of [[33, [true, true, true]], [36, [false, true, true]], [39, [false, false, true]], [42, [false, false, false]]]) {
    for (const stage of [1, 2, 3]) {
      const result = collect(state({ powerUps: [{ id: 11, type: 'shield', x: 400 + distance, y: 680 }] }), stage);
      assert.equal(result.state.shieldActive, expected[stage - 1]);
    }
  }
});

test('five exact changes restore the entire published controller and reject a forced Elite pickup radius', () => {
  const expected = '1045319e9c0ce91cd2a3bae0c40c268ab327213c2b5d4bd626daba89d4c421c5';
  assert.equal(hash(restoreFairShipStageGameChanges(source)), expected);
  assert.throws(() => restoreFairShipStageGameChanges(source.replace('powerUpPickupRadius(shipStageRef.current)', 'powerUpPickupRadius(3)')), /one exact/);
  const changed = source.replace('watch: callback => window.setInterval(callback, 500)', 'watch: callback => window.setInterval(callback, 1000)');
  assert.notEqual(changed, source);
  assert.notEqual(hash(restoreFairShipStageGameChanges(changed)), expected);
});
