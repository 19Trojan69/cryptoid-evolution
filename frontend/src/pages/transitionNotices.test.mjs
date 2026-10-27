import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { TRANSITION_INTRO_MS, BLOCK_CLEAR_MS, reinforcementIntroMs } from './transitionTiming.ts';
import { SECTION_INTRO_MS, SECTION_CLEAR_MS, sectionPhase } from './sectorManager.ts';
import { BOSS_WARNING_MS, BOSS_ENTRY_MS } from './sectorBoss.ts';
import { combatTiming } from './combatVariety.ts';
import { restoreReadableTransitionGameChanges } from '../../scripts/readableTransitionReviewedChanges.mjs';

const source = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const pinned = 'fd1706248bfab3e84170b8e75c11c058fda244f87c04fb16513bcde73f0334de';

test('all 500 phase plans provide several readable seconds without changing flight cadence or reinforcement lead-ins', () => {
  assert.equal(SECTION_INTRO_MS, TRANSITION_INTRO_MS);
  assert.equal(TRANSITION_INTRO_MS, 4800); assert.equal(BLOCK_CLEAR_MS, 5200);
  assert.equal(SECTION_CLEAR_MS, 8500, 'legacy clears are not shortened');
  assert.equal(BOSS_WARNING_MS, 4900); assert.equal(BOSS_ENTRY_MS, 1800);
  for (let stage = 1; stage <= 500; stage++) {
    const timing = combatTiming(stage), early = stage <= 29;
    assert.equal(timing.introMs, TRANSITION_INTRO_MS); assert.equal(timing.clearMs, BLOCK_CLEAR_MS);
    assert.equal(timing.gapMs, early ? 150 : 180);
    assert.equal(timing.entryMs, early ? 1300 : Math.max(1600, 2400 - Math.floor(stage / 50) * 80));
    assert.equal(timing.breathingMs, [1, 3, 5, 6].includes((stage - 1) % 10 + 1) ? 650 : 150);
    const offset = timing.introMs - reinforcementIntroMs(stage);
    assert.equal(timing.introMs - offset, early ? 550 : 850, 'retain the actual released short reinforcement phase');
  }
});

test('the actual section phase retains the title through the full active intro and releases it at the deadline', () => {
  const input = { spawned: 0, total: 6, alive: 0, ready: 0, returning: false, attacking: false };
  for (const introMs of [0, 550, 850, 3200, 4799]) assert.equal(sectionPhase({ ...input, introMs }), 'SECTOR_INTRO');
  assert.equal(sectionPhase({ ...input, introMs: 4800 }), 'ENTRY');
});

test('the actual controller protects paid charges and all active boost clocks throughout the added reading time', () => {
  const predicate = source.slice(source.indexOf('const transitionPaused ='), source.indexOf('        const keys =', source.indexOf('const transitionPaused =')));
  const clocks = source.slice(source.indexOf('        state.overdriveMs ='), source.indexOf('        const selectedExpired ='));
  const run = new Function('state', 'formationStartedRef', 'delta', 'const normal = state.encounter === \"normal\";\n' + predicate + clocks + '\nreturn state;');
  const state = (phase, encounter) => ({ phase, encounter, effects: [], weaponSource: 'paid',
    overdriveMs: 10000, rapidFireMs: 10000, empMs: 10000, shieldMs: 10000, purchasedShieldMs: 10000,
    shieldCharges: 2, paidWeaponLevel: 3, paidWeaponMs: 45000, weaponTimers: [0, 0, 0, 45000, 0, 0], pickupWeaponMs: 20000, pickupWeaponLevel: 2 });
  for (const [phase, encounter, delta] of [['SECTOR_INTRO', 'normal', 4800], ['SECTOR_INTRO', 'bonus', 4800], ['SECTOR_INTRO', 'boss-intro', 4900], ['SECTOR_CLEAR', 'normal', 5200]]) {
    const current = state(phase, encounter), before = structuredClone(current);
    run(current, { current: true }, delta); assert.deepEqual(current, before);
  }
  const active = state('ATTACK_CYCLE', 'normal'); run(active, { current: true }, 100);
  assert.equal(active.paidWeaponMs, 44900); assert.equal(active.pickupWeaponMs, 19900); assert.equal(active.shieldMs, 9900);
});

test('only five exact reviewed controller edits restore the entire game-over candidate; pause or save changes remain rejected', () => {
  assert.equal(hash(restoreReadableTransitionGameChanges(source)), pinned);
  assert.throws(() => restoreReadableTransitionGameChanges(source.replace('|| game.status === "paused") && !levelComplete', '|| game.status === "loading") && !levelComplete')), /one exact/);
  assert.notEqual(hash(restoreReadableTransitionGameChanges(source.replace("stateRef.current.status = 'paused';", "stateRef.current.status = 'playing';"))), pinned);
  assert.notEqual(hash(restoreReadableTransitionGameChanges(source.replace('watch: callback => window.setInterval(callback, 500)', 'watch: callback => window.setInterval(callback, 1000)'))), pinned);
});

// Execute the actual notice-independent event clock, including the released
// short intro allowance. Added reading must not make drops/rocks due sooner.
test('the extra title plateau does not advance the combat-variety event clock', () => {
  const line = source.split('\n').find(value => value.includes('intro.clock += delta;'));
  const run = new Function('state', 'variety', 'intro', 'delta', 'flightRef', 'sectionElapsedRef', 'reinforcementIntroMs', line);
  for (const stage of [1, 55, 499]) for (const phase of ['SECTOR_INTRO', 'ATTACK_CYCLE', 'SECTOR_CLEAR']) {
    const intro = { clock: 0 };
    for (let elapsed = 0; elapsed < 4800; elapsed += 10) run({sector:stage, phase}, true, intro, 10, {current:0}, {current:elapsed}, reinforcementIntroMs);
    assert.equal(intro.clock, phase === 'SECTOR_CLEAR' ? 0 : phase === 'SECTOR_INTRO' ? reinforcementIntroMs(stage) : 4800);
  }
});
