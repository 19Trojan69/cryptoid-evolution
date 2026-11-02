import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFailureState, classifyFailureState, captureFailureState } from './failureObservation.mjs';
const first = { timeOrigin: 100, clock: { latest: { id: 'run-1' } } };
function fixture() {
  let reads = 0;
  const scene = { status: 'paused', phase: 'FORMATION', encounter: 'boss-fight', sector: 20,
    technicalPause: true, coreVolley: 285, frameAt: 802000, score: 999, shards: 999, token: 'private', player: { x: .1 } };
  const host = { performance: { now: () => 805000, timeOrigin: 100 },
    document: { hidden: false, hasFocus: () => true, querySelector: selector => selector === '.game-shell' },
    __crossDeviceTest: { inspect: () => { reads++; return scene; } },
    localStorage: { getItem: () => JSON.stringify({ latest: { id: 'run-1', source: 'a'.repeat(40), mode: 'paused',
      elapsedMs: 802000, unobservedGaps: 1, token: 'private', previous: 'private' } }) } };
  return { host, scene, reads: () => reads };
}
test('the one-shot collector retains a technical pause, frame age and clock gap without input, account or storage payloads', () => {
  const f = fixture(), state = readFailureState('key', f.host), result = classifyFailureState(state, first);
  assert.equal(f.reads(), 1); assert.equal(state.scene.observedFrameAgeMs, 3000);
  assert.equal(result.classification, 'observed-technical-pause'); assert.equal(result.sameDocument, true);
  assert.equal(result.sameClockRun, true); assert.equal(result.pauseCauseEstablished, false);
  assert.doesNotMatch(JSON.stringify(state), /private|score|shards|player|previous|token/);
  assert.ok(JSON.stringify(state).length < 4096);
});
test('document replacement, lost scene, visibility and clock observations stay distinct from any claimed native cause', () => {
  const base = readFailureState('key', fixture().host);
  for (const [change, expected] of [
    [s => s.timeOrigin = 200, 'observed-document-change'],
    [s => { s.mounted = false; s.scene = null; }, 'observed-scene-unmounted'],
    [s => s.hidden = true, 'observed-hidden-document'],
    [s => s.scene.technicalPause = false, 'observed-pause'],
    [s => s.scene.status = 'playing', 'observed-clock-gap'],
    [s => { s.scene.status = 'playing'; s.clock.unobservedGaps = 0; s.clock.mode = 'stalled'; }, 'observed-stalled-clock'],
    [s => { s.scene.status = 'playing'; s.clock.unobservedGaps = 0; }, 'observed-playing-after-failure'],
  ]) {
    const s = structuredClone(base); change(s); const r = classifyFailureState(s, first);
    assert.equal(r.classification, expected); assert.equal(r.nativeTerminationCauseMeasured, false);
    assert.equal(r.pauseCauseEstablished, false); assert.equal(r.whiteScreenFixed, false);
  }
});
test('oversized or unavailable storage and invalid scalar values cannot expand the failure report', () => {
  const f = fixture(); f.host.localStorage.getItem = () => 'x'.repeat(2049);
  f.scene.frameAt = Infinity; f.scene.status = 'x'.repeat(101);
  let s = readFailureState('key', f.host); assert.equal(s.clock, null);
  assert.equal(s.scene.frameAt, null); assert.equal(s.scene.status, null); assert.equal(s.scene.observedFrameAgeMs, null);
  f.host.localStorage.getItem = () => { throw Error('opaque origin'); };
  assert.equal(readFailureState('key', f.host).clock, null);
});
test('read failure, a closed page and timeout are bounded unavailable evidence, never a replacement observation or retry', async () => {
  let attempts = 0;
  const page = { isClosed: () => false, evaluate: async fn => { attempts++; return fn('key', fixture().host); } };
  const success = await captureFailureState({ page, key: 'key', first });
  assert.equal(success.available, true); assert.equal(attempts, 1);
  page.evaluate = async () => { attempts++; throw Error('page destroyed'); };
  assert.deepEqual(await captureFailureState({ page, first }), { available: false, attempts: 1, reason: 'failure-read-unavailable' });
  page.evaluate = () => { attempts++; return new Promise(() => {}); };
  assert.deepEqual(await captureFailureState({ page, first, timeoutMs: 2 }), { available: false, attempts: 1, reason: 'failure-read-timeout' });
  assert.equal(attempts, 3); page.isClosed = () => true;
  assert.deepEqual(await captureFailureState({ page, first }), { available: false, attempts: 0, reason: 'page-unavailable' });
  assert.equal(attempts, 3);
});
test('the real collector reads only after failure and preserves the six historical captures unchanged', () => {
  const source = readFileSync(new URL('profileLifetime.mjs', import.meta.url), 'utf8');
  assert.equal(source.split('await captureFailureState(').length, 2);
  const call = source.indexOf('await captureFailureState(');
  assert.ok(call > source.indexOf('} catch (error) {'));
  assert.ok(call < source.indexOf('} finally {', call));
  const manifest = JSON.parse(readFileSync(new URL('../local-boss-style-20261102/evidence/manifest.json', import.meta.url)));
  assert.equal(manifest.captures.length, 6); assert.equal(manifest.status, 'finished-with-protocol-failure');
});
