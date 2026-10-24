import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { readFileSync } from 'node:fs';
import { collectLifecycleState, captureLifecycleState, captureLifecycleFailure, assertLifecycleState } from './startupLifecycleEvidence.mjs';

const iso = time => new Date(time).toISOString();
const technical = { reason: 'loop-stall', at: iso(4500), phase: 'FORMATION', status: 'paused', sector: 1 };
function collect({ raw = JSON.stringify([technical]), denied = false, hidden = false, overlay = true,
  shell = true, sinceEpochMs = 4000, startedAt = 1000 } = {}) {
  const calls = [];
  const element = (className, text = '', attrs = {}) => ({ tagName: 'DIV', id: '', textContent: text,
    getAttribute(name) { return name === 'class' ? className : attrs[name] ?? null; },
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 430, height: 825 }),
    hasAttribute: name => Object.hasOwn(attrs, name), contains: () => false });
  const pause = element('pause-control', 'Pause');
  const dialog = overlay ? element('game-overlay pause-settings-overlay', 'Technische Pause', { role: 'dialog' }) : null;
  const game = shell ? element('game-shell', '', { 'data-effects-paused': overlay ? 'true' : 'false' }) : null;
  const window = { location: { pathname: '/' }, getComputedStyle: () => ({ display: hidden ? 'none' : 'block', visibility: 'visible', opacity: '1', pointerEvents: 'auto' }) };
  Object.defineProperty(window, 'localStorage', { get() {
    if (denied) { const error = new Error('private value'); error.name = 'SecurityError'; throw error; }
    return { getItem(key) { calls.push(key); return raw; },
      setItem() { throw new Error('Must not write storage'); }, clear() { throw new Error('Must not clear storage'); } };
  } });
  const document = { readyState: 'complete', visibilityState: 'visible', hasFocus: () => true,
    getElementById: () => ({ childElementCount: 1 }),
    querySelector: selector => ({ '.pause-control': pause, '.pause-settings-overlay': dialog, '.game-shell': game })[selector],
    querySelectorAll: () => dialog ? [dialog] : [], elementFromPoint: () => dialog || pause };
  const result = runInNewContext(`(${collectLifecycleState.toString()})({ sinceEpochMs })`, {
    window, document, performance: { timeOrigin: startedAt }, Date: class extends Date { static now() { return 5000; } }, sinceEpochMs,
  });
  return { state: JSON.parse(JSON.stringify(result)), calls };
}
const capture = state => ({ label: 'test', captured: true, ...state });

test('captures the existing key, exact recorded reason, visible overlay and hit interceptor', () => {
  const { state, calls } = collect();
  assert.deepEqual(calls, ['cryptoid_game_diagnostics_v1']);
  assert.equal(state.recordedInterruptions[0].reason, 'loop-stall');
  assert.equal(state.pauseOverlay.text, 'Technische Pause');
  assert.equal(state.pauseHitTarget.insidePauseControl, false);
  assert.equal(state.shell.effectsPaused, 'true');
});
test('does not invent a pause reason when the ring is absent', () => {
  const { state } = collect({ raw: null });
  assert.equal(state.diagnostics.state, 'absent');
  assert.deepEqual(state.recordedInterruptions, []);
  assert.equal(state.pauseOverlay.visible, true);
});
test('excludes old-document, pre-flow, future, performance and restart events from interruptions', () => {
  const entries = [
    { ...technical, at: iso(900) }, { ...technical, at: iso(3999) },
    { ...technical, at: iso(5001) }, { ...technical, reason: 'performance' },
    { ...technical, reason: 'unexpected-restart' }, { ...technical, at: 'not-a-date' },
  ];
  const { state } = collect({ raw: JSON.stringify(entries) });
  assert.equal(state.diagnostics.entries.length, 6);
  assert.deepEqual(state.recordedInterruptions, []);
});
test('no pre-flow baseline falsely assigns a recorded pause to the current flow', () => {
  assert.deepEqual(collect({ sinceEpochMs: null }).state.recordedInterruptions, []);
  assert.deepEqual(collect({ startedAt: 4700 }).state.recordedInterruptions, []);
});
test('denied storage is explicit and raw exception text is not copied', () => {
  const { state } = collect({ denied: true });
  assert.equal(state.diagnostics.state, 'unavailable');
  assert.equal(state.diagnostics.errorName, 'SecurityError');
  assert.equal(JSON.stringify(state).includes('private value'), false);
});
test('malformed, wrong-shaped and oversized storage are distinct from an empty ring', () => {
  assert.equal(collect({ raw: '{' }).state.diagnostics.state, 'invalid');
  assert.equal(collect({ raw: '{}' }).state.diagnostics.state, 'invalid');
  assert.equal(collect({ raw: 'x'.repeat(131073) }).state.diagnostics.state, 'oversized');
  assert.equal(collect({ raw: '[]' }).state.diagnostics.state, 'read');
});
test('bounds the ring and fields and discards account, raw exception and unknown fields', () => {
  const entries = Array.from({ length: 35 }, (_, sector) => ({ ...technical, sector,
    phase: 'P'.repeat(200), account: 'PRIVATE_ACCOUNT', message: 'PRIVATE_ERROR', unknown: 42 }));
  const { state } = collect({ raw: JSON.stringify(entries) });
  assert.equal(state.diagnostics.totalEntries, 35);
  assert.equal(state.diagnostics.entries.length, 20);
  assert.equal(state.diagnostics.entries[0].sector, 15);
  assert.equal(state.diagnostics.entries[0].phase.length, 80);
  assert.equal(JSON.stringify(state).includes('PRIVATE_'), false);
  assert.equal(Object.hasOwn(state.diagnostics.entries[0], 'unknown'), false);
});
test('rejects invalid diagnostic entries without aborting the snapshot', () => {
  const { state } = collect({ raw: JSON.stringify([null, [], 'bad', technical]) });
  assert.equal(state.diagnostics.totalEntries, 4);
  assert.equal(state.diagnostics.entries.length, 1);
});
test('does not report a display:none overlay as visible', () => {
  assert.equal(collect({ hidden: true }).state.pauseOverlay.visible, false);
});
test('captures before teardown without changing storage, navigation or gameplay', async () => {
  const state = collect().state;
  const row = { lifecycleStartedAt: 4000 };
  const page = { evaluate: async (fn, args) => {
    assert.equal(fn, collectLifecycleState); assert.equal(args.sinceEpochMs, 4000); return state;
  } };
  const result = await captureLifecycleState(page, row, 'before-pause');
  assert.equal(result.captured, true);
  assert.equal(row.lifecycleSamples[0], result);
});
test('retains a bounded audit sample ring', async () => {
  const row = {};
  const page = { evaluate: async () => collect().state };
  for (let i = 0; i < 30; i++) await captureLifecycleState(page, row, 'sample-' + i);
  assert.equal(row.lifecycleSamples.length, 24);
  assert.equal(row.lifecycleSamples[0].label, 'sample-6');
});
test('captures evaluation rejection as unavailable evidence, never as an empty diagnostic pass', async () => {
  const row = {};
  const result = await captureLifecycleState({ evaluate: () => Promise.reject(new TypeError('raw')) }, row, 'failed');
  assert.equal(result.captured, false);
  assert.equal(result.errorName, 'TypeError');
  assert.equal(Object.hasOwn(result, 'recordedInterruptions'), false);
});
test('bounds a nonresponsive page evaluation and still attempts a screenshot', async () => {
  const row = { lifecycleStage: 'pause-click' }, calls = [];
  const page = { evaluate: () => new Promise(() => {}), screenshot: async () => calls.push('pixels') };
  await captureLifecycleFailure(page, row, new Error('Original failure'), { screenshotPath: '/tmp/test.png', timeoutMs: 5 });
  assert.equal(row.lifecycleSamples[0].errorName, 'EvidenceTimeout');
  assert.equal(row.failure.message, 'Original failure');
  assert.deepEqual(calls, ['pixels']);
});
test('failure capture preserves stage and original error and takes pixels after the state', async () => {
  const row = { lifecycleStartedAt: 4000, lifecycleStage: 'pause-click' }, calls = [];
  const page = { evaluate: async () => { calls.push('state'); return collect().state; },
    screenshot: async options => { calls.push('pixels'); assert.equal(options.animations, 'allow'); } };
  const error = new Error('Overlay intercepts'); error.name = 'TimeoutError';
  await captureLifecycleFailure(page, row, error, { screenshotPath: '/tmp/test.png' });
  assert.equal(row.passed, false);
  assert.equal(row.failure.stage, 'pause-click');
  assert.equal(row.failure.name, 'TimeoutError');
  assert.equal(row.failure.message, 'Overlay intercepts');
  assert.equal(row.lifecycleSamples[0].recordedInterruptions[0].reason, 'loop-stall');
  assert.deepEqual(calls, ['state', 'pixels']);
  assert.equal(row.failureScreenshot.captured, true);
});
test('screenshot failure does not erase the state or replace the original error', async () => {
  const row = {};
  await captureLifecycleFailure({ evaluate: async () => collect().state, screenshot: async () => { throw new TypeError('capture failed'); } }, row,
    new Error('Original failure'), { screenshotPath: '/tmp/test.png' });
  assert.equal(row.failure.message, 'Original failure');
  assert.equal(row.lifecycleSamples[0].captured, true);
  assert.deepEqual(row.failureScreenshot, { captured: false, errorName: 'TypeError' });
});
test('an unexpected pause with no diagnostic cause still fails, without automatic Resume', () => {
  assert.throws(() => assertLifecycleState(capture(collect({ raw: null }).state), 'active', 1000));
});
test('a recorded technical interruption cannot pass as the requested manual Pause', () => {
  assert.throws(() => assertLifecycleState(capture(collect().state), 'paused', 1000), /interruption/);
});
test('unexpected document replacement and missing capture cannot pass', () => {
  assert.throws(() => assertLifecycleState(capture(collect({ raw: null, overlay: false }).state), 'active', 999), /replacement/);
  assert.throws(() => assertLifecycleState({ captured: false }, 'active'), /captured/);
});
test('ordinary Home, active and explicit paused states pass their own assertions', () => {
  assertLifecycleState(capture(collect({ raw: null, shell: false, overlay: false }).state), 'home', 1000);
  assertLifecycleState(capture(collect({ raw: null, overlay: false }).state), 'active', 1000);
  assertLifecycleState(capture(collect({ raw: null }).state), 'paused', 1000);
});
test('the verifier integrates failure capture before closing the context and saves before browser teardown', () => {
  const source = readFileSync(new URL('./verifyStartupRecovery.mjs', import.meta.url), 'utf8');
  const failureAt = source.indexOf('await captureLifecycleFailure(page, row, error');
  const closeAt = source.indexOf('await context.close()');
  const reportAt = source.indexOf('writeFileSync(process.env.CRYPTOID_STARTUP_REPORT');
  const teardownAt = source.indexOf('await browser?.close()');
  assert.ok(failureAt >= 0 && closeAt > failureAt);
  assert.ok(reportAt >= 0 && teardownAt > reportAt);
  assert.match(source, /verifyCaseErrors\(\);\s*row.startupPassed = true/);
  assert.match(source, /await observe\('before-pause', 'active'\)/);
  assert.match(source, /await observe\('after-pause', 'paused'\)/);
  assert.match(source, /gameLifecyclePassed = false/);
  assert.match(source, /row.startupPassed = true/);
  assert.equal((source.match(/\.pause-resume-button/g) || []).length, 1);
  assert.doesNotMatch(source, /force:\s*true|GAME_STALL_MS\s*=|setItem\(['"]cryptoid_game_diagnostics/);
});
