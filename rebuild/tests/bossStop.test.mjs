import test from 'node:test';
import assert from 'node:assert/strict';
import { BossStop } from '../core/bossStop.ts';
const identity = { runId: 'same-running-game', stage: 40, stopId: 132 };
const summary = { stage: 40, score: 100, shards: 10, destroyed: 6, hearts: 3, combos: 0 };
const ready = { saved: true, cleaned: true, bonusReady: true };
function visibleTenSeconds(gate) { for (let i = 0; i < 40; i++) gate.advanceVisible(250, true); }
function prepared() { const gate = new BossStop(identity, summary); gate.finishPreparation(gate.beginPreparation(), ready); return gate; }

test('save, cleanup and bonus preparation are all required before the visible countdown can run', () => {
  for (const missing of ['saved', 'cleaned', 'bonusReady']) {
    const gate = new BossStop(identity, summary), operation = gate.beginPreparation();
    visibleTenSeconds(gate); assert.equal(gate.snapshot().visibleMs, 0);
    assert.equal(gate.finishPreparation(operation, { ...ready, [missing]: false }), false);
    visibleTenSeconds(gate); assert.equal(gate.snapshot().visibleMs, 0);
    assert.equal(gate.requestContinue(), null); assert.equal(gate.snapshot().failed, true);
  }
});

test('ten prepared visible seconds enable an explicit button, never automatic continuation', () => {
  const gate = prepared();
  for (let i = 0; i < 100; i++) gate.advanceVisible(1000, false);
  assert.equal(gate.snapshot().visibleMs, 0);
  for (let i = 0; i < 39; i++) gate.advanceVisible(250, true);
  assert.equal(gate.requestContinue(), null);
  gate.advanceVisible(250, true);
  assert.equal(gate.snapshot().canContinue, true); assert.equal(gate.snapshot().accepted, false);
  visibleTenSeconds(gate); assert.equal(gate.snapshot().accepted, false);
  const operation = gate.requestContinue(); assert.ok(operation); assert.equal(gate.requestContinue(), null);
  const permit = gate.finishContinue(operation, true);
  assert.deepEqual(permit, { ...identity, accepted: true });
  assert.equal(gate.finishContinue(operation, true), null); assert.equal(gate.requestContinue(), null);
});

test('late preparation from an earlier attempt cannot accept or fail the current stop', () => {
  const gate = new BossStop(identity, summary), old = gate.beginPreparation(), current = gate.beginPreparation();
  assert.equal(gate.finishPreparation(old, ready), false); assert.equal(gate.snapshot().saving, true);
  assert.equal(gate.finishPreparation(current, ready), true);
  assert.equal(gate.finishPreparation(old, { saved: false, cleaned: false, bonusReady: false }), false);
  assert.equal(gate.snapshot().prepared, true);
});

test('receipts from a different run, stage or stop cannot unlock the gate', () => {
  for (const changed of [{ runId: 'older-run' }, { stage: 30 }, { stopId: 131 }]) {
    const gate = new BossStop(identity, summary), operation = gate.beginPreparation();
    assert.equal(gate.finishPreparation({ ...operation, ...changed }, ready), false);
    assert.equal(gate.snapshot().saving, true); assert.equal(gate.requestContinue(), null);
  }
});

test('failed continuation retains the summary and requires a separate explicit retry', () => {
  const gate = prepared(); visibleTenSeconds(gate);
  const operation = gate.requestContinue(); assert.equal(gate.finishContinue(operation, false), null);
  assert.equal(gate.requestContinue(), null);
  assert.deepEqual(gate.snapshot().summary, summary);
  const retry = gate.requestContinue(true); assert.ok(retry);
  assert.equal(gate.finishContinue(operation, true), null);
  assert.deepEqual(gate.finishContinue(retry, true), { ...identity, accepted: true });
});

test('disposing an intermission invalidates in-flight save and continue operations', () => {
  const loading = new BossStop(identity, summary), operation = loading.beginPreparation(); loading.dispose();
  assert.equal(loading.finishPreparation(operation, ready), false); assert.throws(() => loading.beginPreparation());
  const continuing = prepared(); visibleTenSeconds(continuing); const accepted = continuing.requestContinue(); continuing.dispose();
  assert.equal(continuing.finishContinue(accepted, true), null); assert.equal(continuing.requestContinue(), null);
});

test('a large/invalid clock jump cannot skip the prepared visible countdown', () => {
  const gate = prepared();
  for (const value of [NaN, Infinity, -1]) gate.advanceVisible(value, true);
  assert.equal(gate.snapshot().visibleMs, 0);
  gate.advanceVisible(60_000, true); assert.equal(gate.snapshot().visibleMs, 1000);
  assert.equal(gate.requestContinue(), null);
});
