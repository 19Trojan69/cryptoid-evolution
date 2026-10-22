import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBonusBoundaryDiagnostics } from './bonusBoundaryDiagnostics.ts';
import { appendReloadEvent, RELOAD_TRACE_KEY } from './reloadDiagnostics.ts';
import { readStabilityReport } from './stabilityReport.mjs';
import { createOwnerFlightRecorder } from './ownerFlightRecorder.ts';
import { readFlightRecorders } from './flightRecorderReport.mjs';
import { SECTION_CLEAR_MS } from './sectorManager.ts';

const clear = { sector: 40, phase: 'SECTOR_CLEAR', encounter: 'bonus', status: 'playing' };
const kinds = ['bonus-clear-rewards-complete', 'bonus-clear-scene-requested',
  'bonus-clear-scene-committed', 'bonus-clear-frame-after-commit'];
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
function fixture(record) {
  const events = [];
  const probe = createBonusBoundaryDiagnostics(record ?? ((kind, context) => events.push({ kind, context })));
  return { probe, events };
}
function complete(probe, state = clear) {
  probe.observedClear(state); probe.rewardsCompleted(state); probe.sceneRequested(state);
  probe.sceneCommitted(state); probe.frame(state);
}

test('four boundaries remain distinct, ordered and bounded over repeated playing frames', () => {
  const { probe, events } = fixture();
  probe.observedClear(clear);
  probe.sceneRequested(clear); probe.sceneCommitted(clear); probe.frame(clear);
  assert.equal(events.length, 0);
  probe.rewardsCompleted(clear); probe.frame(clear);
  assert.deepEqual(events.map(e => e.kind), kinds.slice(0, 1));
  probe.sceneRequested(clear); probe.frame(clear);
  assert.deepEqual(events.map(e => e.kind), kinds.slice(0, 2));
  probe.sceneCommitted(clear);
  assert.deepEqual(events.map(e => e.kind), kinds.slice(0, 3));
  for (let i = 0; i < 10000; i++) {
    probe.rewardsCompleted(clear); probe.sceneRequested(clear); probe.sceneCommitted(clear); probe.frame(clear);
  }
  assert.deepEqual(events.map(e => e.kind), kinds);
});

test('normal, boss and wrong-level scenes cannot stand in for a bonus completion', () => {
  for (const state of [{ ...clear, encounter: 'normal' }, { ...clear, encounter: 'boss-clear' },
    { ...clear, phase: 'FORMATION' }, { ...clear, status: 'loading' }]) {
    const { probe, events } = fixture(); complete(probe, state); assert.equal(events.length, 0);
  }
  const { probe, events } = fixture();
  probe.observedClear(clear); probe.rewardsCompleted(clear); probe.sceneRequested(clear);
  probe.sceneCommitted({ ...clear, sector: 50 }); probe.frame({ ...clear, sector: 50 });
  assert.deepEqual(events.map(e => e.kind), kinds.slice(0, 2));
});

test('paused and game-over callbacks do not claim an active following frame', () => {
  const { probe, events } = fixture();
  probe.observedClear(clear); probe.rewardsCompleted(clear); probe.sceneRequested(clear);
  probe.sceneCommitted({ ...clear, status: 'paused' }); probe.frame(clear);
  assert.equal(events.length, 2);
  probe.sceneCommitted(clear); probe.frame({ ...clear, status: 'game-over' });
  assert.equal(events.length, 3);
  probe.frame(clear); assert.deepEqual(events.map(e => e.kind), kinds);
});

test('a new round retires old pending commits and the same sector can be retried', () => {
  const { probe, events } = fixture();
  probe.observedClear(clear); probe.rewardsCompleted(clear); probe.sceneRequested(clear);
  const next = { ...clear, sector: 50 };
  probe.observedClear(next); probe.sceneCommitted(clear); probe.frame(clear);
  assert.equal(events.length, 2);
  probe.rewardsCompleted(next); probe.sceneRequested(next); probe.sceneCommitted(next); probe.frame(next);
  assert.deepEqual(events.slice(2).map(e => e.kind), kinds);
  complete(probe, next);
  assert.deepEqual(events.slice(6).map(e => e.kind), kinds);
});

test('diagnostic failures cannot throw into reward, request, layout or RAF work', () => {
  let attempts = 0;
  const { probe } = fixture(() => { attempts++; throw new Error('denied optional storage'); });
  assert.doesNotThrow(() => complete(probe)); assert.equal(attempts, 4);
});

test('only copied technical primitives reach the callback and game state is never retained there', () => {
  const state = Object.freeze({ ...clear, score: 999, account: 'private-account', save: { token: 'private-token' } });
  const { probe, events } = fixture(); complete(probe, state);
  for (const event of events) {
    assert.deepEqual(event.context, clear); assert.notEqual(event.context, state);
    assert.ok(!JSON.stringify(event).includes('private'));
  }
});

test('all fifty bonus boundaries remain four small events and use no browser APIs', () => {
  const { probe, events } = fixture();
  for (let sector = 10; sector <= 500; sector += 10) complete(probe, { ...clear, sector });
  assert.equal(events.length, 200);
  assert.ok(events.every(e => Object.keys(e.context).length === 4));
  const source = readFileSync(new URL('./bonusBoundaryDiagnostics.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(?:window|document|localStorage|sessionStorage|fetch|setTimeout|setInterval|requestAnimationFrame)\b/);
});

test('actual local trace and sanitized report preserve every milestone with no new storage key', () => {
  const host = { localStorage: storage(), sessionStorage: storage(), __cryptoidBootId: 'bonus-proof' };
  let now = 100000;
  const { probe } = fixture((kind, context) => appendReloadEvent(host, kind,
    { ...context, reason: 'performance', username: 'private-user', score: 1234 }, {}, undefined, () => now++));
  complete(probe);
  const report = readStabilityReport(host, now);
  assert.deepEqual(report.reloadTrace.events.map(e => e.kind), kinds);
  assert.ok(host.localStorage.getItem(RELOAD_TRACE_KEY));
  assert.ok(!JSON.stringify(report).includes('private-user'));
  assert.ok(report.reloadTrace.events.every(e => !('score' in e.context)));
});

test('current rolling recorder can persist phase-complete without the new phase-start', () => {
  const host = { localStorage: storage(), sessionStorage: storage(), __cryptoidBootId: 'rolling-boundary' };
  let now = 100;
  const probe = createOwnerFlightRecorder(true, () => host, { now: () => now, wallNow: () => 100000 + now, build: {} });
  const context = { ...clear, phase: 'FORMATION', flight: 0, enemies: 0, playerShots: 2, enemyShots: 0,
    effects: 2, rocks: 0, rockEffects: 0, pickups: 0, attackers: 0, returning: 0 };
  probe.begin(now, context); now++; probe.end(now);
  now = 2200; probe.begin(now, { ...context, phase: 'SECTOR_CLEAR' });
  const saved = readFlightRecorders(host)[0];
  assert.equal(saved.events.at(-1).kind, 'phase-complete');
  assert.equal(saved.events.at(-1).phase, 'FORMATION');
  assert.equal(probe.export().events.at(-1).kind, 'phase-start');
  assert.equal(probe.export().events.at(-1).phase, 'SECTOR_CLEAR');
  probe.finish();
});

test('this report replaces the document before the earliest regular next-sector deadline', () => {
  const observedClearAt = 1792678893513, newDocumentAt = 1792678899859;
  assert.equal(SECTION_CLEAR_MS, 8500);
  assert.equal(newDocumentAt - observedClearAt, 6346);
  assert.ok(newDocumentAt < observedClearAt + SECTION_CLEAR_MS);
});

test('wiring uses existing owner setup, layout hook, game frame and scene request', () => {
  const source = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
  assert.ok(source.includes("const bonusBoundary = ownerDiagnostics && shipSaveNetwork === 'testnet' ? createBonusBoundaryDiagnostics"));
  assert.ok(source.includes('bonusBoundaryRef.current?.sceneCommitted(game);'));
  assert.ok(source.includes('if (bonusBoundaryRef.current === bonusBoundary) bonusBoundaryRef.current = null;'));
  const rewards = source.slice(source.indexOf('if (bonus && state.phase === "SECTOR_CLEAR" && previousPhase !== "SECTOR_CLEAR")'),
    source.indexOf('if (!adminRunRef.current && !scoreRunRef.current && state.score > bestThisDeviceRef.current)'));
  assert.ok(rewards.includes('observedClear(state)'));
  assert.ok(rewards.includes('rewardsCompleted(state)'));
  assert.ok(rewards.indexOf('observedClear(state)') < rewards.indexOf("recordOwnerResourceSnapshot('resource-bonus-clear')"));
  assert.ok(rewards.indexOf('rewardsCompleted(state)') > rewards.indexOf('awardBonusMedal'));
  const step = source.slice(source.indexOf('const step = (time: number) => {'));
  assert.ok(step.includes('bonusBoundaryRef.current?.frame(state)'));
  assert.ok(step.includes('bonusBoundaryRef.current?.sceneRequested(current)'));
  assert.ok(step.indexOf('bonusBoundaryRef.current?.frame(state)') < step.indexOf('simulate(present ?'));
  assert.ok(step.indexOf('bonusBoundaryRef.current?.sceneRequested(current)') < step.indexOf('setGame({ ...current'));
});
