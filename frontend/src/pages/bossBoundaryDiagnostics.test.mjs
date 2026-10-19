import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createSectorBoss } from './sectorBoss.ts';
import { advanceBossCore, CORE_WARNING_MS } from './bossCore.ts';
import { createBossBoundaryDiagnostics } from './bossBoundaryDiagnostics.ts';

const player = { x: .5, y: .88 };
function disarmed(id = 2) {
  const boss = createSectorBoss(id * 10, 430, 90, 825);
  boss.elapsed = 5000;
  for (const gun of boss.turrets) gun.health = 0;
  return boss;
}
function step(probe, boss, delta, available = 5) {
  probe.beforeCore(boss, boss.config.id * 10, delta, available);
  const shots = advanceBossCore(boss, player, 430, 825, delta, available, 1);
  const first = probe.afterCore(shots.length);
  probe.afterAudio(first);
  return shots;
}
test('records the reported 1669-to-1800 warning boundary, creation, audio return and React commit once', () => {
  const boss = disarmed(), events = [];
  boss.core = { elapsed: 1669, volley: 0 };
  const probe = createBossBoundaryDiagnostics(kind => events.push({ kind, elapsed: boss.core.elapsed, volley: boss.core.volley }));
  assert.equal(step(probe, boss, 80).length, 0);
  assert.equal(step(probe, boss, 51).length, 1);
  const wrongBoss = disarmed(1);
  probe.sceneCommitted(wrongBoss, 10);
  probe.sceneCommitted(boss, 20);
  probe.sceneCommitted(boss, 20);
  for (let i = 0; i < 200; i++) step(probe, boss, 20);
  assert.deepEqual(events.map(e => e.kind), ['reactor-open-observed', 'reactor-first-shot-before',
    'reactor-first-shot-created', 'reactor-first-shot-audio-returned', 'reactor-first-shot-scene-committed']);
  assert.equal(events[1].volley, 0);
  assert.equal(events[2].volley, 1);
});
test('all 50 real boss models produce identical shots and states with observation enabled', () => {
  for (let id = 1; id <= 50; id++) {
    const control = disarmed(id), observed = structuredClone(control);
    let events = 0;
    const probe = createBossBoundaryDiagnostics(() => events++);
    for (let i = 0; i < 450; i++) {
      const delta = [0, 16, 34, 82][i % 4], capacity = i % 5 ? 5 : 0;
      const expected = advanceBossCore(control, player, 430, 825, delta, capacity, 1);
      assert.deepEqual(step(probe, observed, delta, capacity), expected);
      assert.deepEqual(observed, control);
      probe.sceneCommitted(observed, id * 10);
    }
    assert.equal(events, 5);
  }
});
test('full projectile capacity and resumed prior volleys cannot invent a first shot', () => {
  const boss = disarmed(), events = [];
  boss.core = { elapsed: CORE_WARNING_MS, volley: 0 };
  const probe = createBossBoundaryDiagnostics(kind => events.push(kind));
  step(probe, boss, 16, .5);
  assert.deepEqual(events, ['reactor-open-observed']);
  assert.equal(step(probe, boss, 16, 1).length, 1);
  const resumed = disarmed(), resumeEvents = [];
  resumed.core = { elapsed: 0, volley: 3 };
  const resumeProbe = createBossBoundaryDiagnostics(kind => resumeEvents.push(kind));
  for (let i = 0; i < 200; i++) step(resumeProbe, resumed, 20);
  resumeProbe.sceneCommitted(resumed, 20);
  assert.deepEqual(resumeEvents, ['reactor-open-observed']);
});
test('diagnostic/storage failures do not change core simulation or exception handling', () => {
  const observed = disarmed(), control = structuredClone(observed);
  const probe = createBossBoundaryDiagnostics(() => { throw Error('storage denied'); });
  for (let i = 0; i < 200; i++) {
    assert.deepEqual(step(probe, observed, 20), advanceBossCore(control, player, 430, 825, 20, 5, 1));
    probe.sceneCommitted(observed, 20);
  }
  assert.deepEqual(observed, control);
});
test('an interrupted audio call leaves the scene/audio stages unconfirmed and restarting resets observation', () => {
  const boss = disarmed(), events = [];
  boss.core = { elapsed: CORE_WARNING_MS, volley: 0 };
  const probe = createBossBoundaryDiagnostics(kind => events.push(kind));
  probe.beforeCore(boss, 20, 16, 5);
  const shots = advanceBossCore(boss, player, 430, 825, 16, 5, 1);
  probe.afterCore(shots.length);
  // Simulate a failure before the production call reaches afterAudio.
  probe.sceneCommitted(boss, 20);
  assert.deepEqual(events, ['reactor-open-observed', 'reactor-first-shot-before', 'reactor-first-shot-created']);
  boss.elapsed = 100;
  boss.core = undefined;
  step(probe, boss, 16);
  assert.equal(events.length, 3); // still entering
  boss.elapsed = 5000;
  step(probe, boss, 16);
  assert.equal(events.at(-1), 'reactor-open-observed');
});
test('production only creates the boundary observer for the verified owner', () => {
  const game = fs.readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
  assert.ok(game.includes('ownerDiagnostics ? createBossBoundaryDiagnostics(recordOwnerResourceSnapshot) : null'));
});
