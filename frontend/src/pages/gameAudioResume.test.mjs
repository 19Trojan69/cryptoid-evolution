import {weaponResumeStepMs} from './weaponReloadTiming.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the real UI handlers, preserving the distinction between the gesture
// and subsequent account requests/countdown timers. No device audio is claimed.
const source = fs.readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const file = ts.createSourceFile('GamePage.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const variables = new Map();
let savedResume, windowLifecycle;
function visit(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) variables.set(node.name.text, node.initializer);
  if (ts.isCallExpression(node) && node.expression.getText(file) === 'useEffect') {
    const effect = node.arguments[0];
    if (effect?.getText(file).includes('window.addEventListener("blur"')) windowLifecycle = effect;
  }
  if (ts.isJsxAttribute(node) && node.name.getText(file) === 'onClick' && node.initializer && ts.isJsxExpression(node.initializer)) {
    const expression = node.initializer.expression;
    if (expression && (expression.getText(file).includes('saveChoiceRef.current = "resume"') || expression.getText(file) === 'resumeSavedMission')) savedResume = expression;
  }
  ts.forEachChild(node, visit);
}
visit(file);
function evaluate(node, context) {
  assert.ok(node, 'actual GamePage callback exists');
  const js = ts.transpileModule('(' + node.getText(file) + ')', { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  return vm.runInNewContext(js, context);
}
function host(musicEnabled = true) {
  const events = [];
  let gesture = false;
  const pending = new Promise(() => {});
  const attempt = kind => {
    assert.equal(gesture, true, kind + ' resumes within the original user gesture');
    events.push(kind);
    return pending;
  };
  const context = {
    document: { visibilityState: 'visible' },
    weaponResumeStepMs, weaponMenuOpen:false, weaponShopPaymentBusy:false, technicalPause:false,
    stateRef:{current:{weaponSource:'standard',paidWeaponMs:0,pickupWeaponMs:0}},
    setWeaponCountdownStep:value=>assert.equal(value,1000),
    bossSummaryRef: { current: null },
    musicEnabled,
    startEffects: () => attempt('effects'),
    musicRef: { current: { unlock: () => attempt('music') } },
    clearControls: () => events.push('controls'),
    setTechnicalPause: value => assert.equal(value, false),
    setWeaponMenuOpen: value => assert.equal(value, false),
    setWeaponCountdown: value => events.push('countdown:' + value),
    saveChoiceRef: { current: null },
    setResumeOffer: value => assert.equal(value, null),
    activateLoadout: () => { events.push('account-request'); return pending; },
  };
  if (variables.has('unlockAudioForResume')) context.unlockAudioForResume = evaluate(variables.get('unlockAudioForResume'), context);
  if (variables.has('resumeSavedMission')) context.resumeSavedMission = evaluate(variables.get('resumeSavedMission'), context);
  return { context, events, tap: handler => { gesture = true; try { handler(); } finally { gesture = false; } } };
}

test('paused mission unlocks effects and music within Resume before its delayed countdown', () => {
  const h = host();
  h.tap(evaluate(variables.get('resumeWeaponSelection'), h.context));
  assert.deepEqual(h.events, ['effects', 'music', 'controls', 'countdown:3']);
});

test('a pending Pi purchase keeps the mission paused', () => {
  const h = host();
  h.context.weaponShopPaymentBusy = true;
  h.tap(evaluate(variables.get('resumeWeaponSelection'), h.context));
  assert.deepEqual(h.events, []);
});

test('saved-account Resume unlocks audio before waiting for the account request', () => {
  const h = host();
  h.tap(evaluate(savedResume, h.context));
  assert.equal(h.context.saveChoiceRef.current, 'resume');
  assert.deepEqual(h.events, ['effects', 'music', 'account-request']);
});

test('resuming respects disabled music and never waits for a pending audio promise', () => {
  const h = host(false);
  h.tap(evaluate(variables.get('resumeWeaponSelection'), h.context));
  assert.deepEqual(h.events, ['effects', 'controls', 'countdown:3']);
});

test('a hidden page does not unlock audio from a stale Resume callback', () => {
  const h = host();
  h.context.document.visibilityState = 'hidden';
  h.tap(evaluate(variables.get('resumeWeaponSelection'), h.context));
  assert.deepEqual(h.events, ['controls', 'countdown:3']);
});

test('an effects-host rejection cannot cancel Resume or become an unhandled rejection', async () => {
  const h = host();
  h.context.startEffects = () => Promise.reject(new Error('audio host unavailable'));
  h.tap(evaluate(variables.get('resumeWeaponSelection'), h.context));
  assert.deepEqual(h.events, ['music', 'controls', 'countdown:3']);
  await new Promise(resolve => setImmediate(resolve));
});

test('the actual armed menu Resume halves its steps after the original audio gesture',()=>{
 const h=host();let step;
 Object.assign(h.context,{weaponMenuOpen:true,stateRef:{current:{weaponSource:'paid',paidWeaponMs:45000}},setWeaponCountdownStep:value=>{step=value;}});
 h.tap(evaluate(variables.get('resumeWeaponSelection'),h.context));
 assert.equal(step,500);assert.deepEqual(h.events,['effects','music','controls','countdown:3']);
});
test('a genuine technical pause keeps full Resume steps even when a timed weapon is selected',()=>{
 const h=host();Object.assign(h.context,{technicalPause:true,weaponMenuOpen:true,stateRef:{current:{weaponSource:'paid',paidWeaponMs:45000}}});
 h.tap(evaluate(variables.get('resumeWeaponSelection'),h.context));
 assert.deepEqual(h.events,['effects','music','controls','countdown:3']);
});

function lifecycleHost(status = 'playing') {
  const h = host();
  let now = 1_000;
  let nextTimer = 0;
  const timers = new Map();
  const window = Object.assign(new EventTarget(), {
    setTimeout: (callback, delay) => {
      timers.set(++nextTimer, { callback, at: now + delay });
      return nextTimer;
    },
    clearTimeout: id => timers.delete(id),
  });
  const document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const state = { status, effects: [{ startedAt: 700 }] };
  Object.assign(h.context, {
    window, document, stateRef: { current: state }, backgroundHiddenAtRef: { current: null },
    Date: { now: () => now }, performance: { now: () => now },
    lastFrameRef: { current: 990 }, slowFramesRef: { current: 5 },
    wakeGameLoopRef: { current: () => h.events.push('wake') },
    soundRef: { current: { setPaused: paused => h.events.push('sound:' + paused) } },
    musicRef: { current: { pause: () => h.events.push('music paused') } },
    saveCombatRef: { current: async () => h.events.push('save') },
    retryAudioRef: { current: () => h.events.push('retry audio') },
    setGame: game => h.events.push(game.status),
  });
  const dispose = evaluate(windowLifecycle, h.context)();
  return { ...h, state, timers, dispose,
    emit: name => window.dispatchEvent(new Event(name)),
    visibility: value => { document.visibilityState = value; document.dispatchEvent(new Event('visibilitychange')); },
    advance(ms, runTimers = true) {
      now += ms;
      if (!runTimers) return;
      for (const [id, { callback, at }] of timers) {
        if (at <= now) { timers.delete(id); callback(); }
      }
    },
  };
}

test('focus loss clears controls and a brief hidden interval keeps the mission playing', () => {
  const h = lifecycleHost();
  h.emit('blur');
  assert.deepEqual(h.events, ['controls']);
  h.visibility('hidden');
  h.advance(100);
  h.visibility('hidden');
  assert.equal(h.timers.size, 1);
  h.advance(899);
  assert.equal(h.state.status, 'playing');
  h.visibility('visible');
  assert.equal(h.state.status, 'playing');
  assert.equal(h.state.effects[0].startedAt, 1709);
  assert.equal(h.context.lastFrameRef.current, 0);
  assert.equal(h.context.slowFramesRef.current, 0);
  assert.equal(h.timers.size, 0);
  assert.deepEqual(h.events, ['controls', 'controls', 'wake', 'save', 'music paused', 'retry audio']);
  h.dispose();
});

test('a sustained background pauses once and still pauses if the browser suspends timers', () => {
  for (const runTimers of [true, false]) {
    const h = lifecycleHost();
    h.visibility('hidden');
    h.advance(1_000, runTimers);
    assert.equal(h.state.status, runTimers ? 'paused' : 'playing');
    h.visibility('visible');
    h.emit('pageshow');
    assert.equal(h.state.status, 'paused');
    assert.equal(h.timers.size, 0);
    assert.deepEqual(h.events, ['controls', 'wake', 'save', 'music paused', 'sound:true', 'paused']);
    h.dispose();
  }
});

test('pagehide saves promptly and shares the visibility interval without duplicate saves', () => {
  for (const duration of [120, 1_100]) {
    const h = lifecycleHost();
    h.emit('pagehide');
    assert.deepEqual(h.events, ['controls', 'wake', 'save', 'music paused']);
    h.visibility('hidden');
    h.advance(duration, false);
    h.visibility('visible');
    assert.equal(h.timers.size, 0);
    assert.equal(h.events.filter(event => event === 'save').length, 1);
    assert.equal(h.state.status, duration < 1_000 ? 'playing' : 'paused');
    h.dispose();
  }
});

test('a manually paused mission stays paused and unmount cancels any pending background timer', () => {
  const paused = lifecycleHost('paused');
  paused.visibility('hidden');
  paused.advance(1_500);
  paused.visibility('visible');
  assert.equal(paused.state.status, 'paused');
  assert.deepEqual(paused.events, ['controls', 'wake']);
  paused.dispose();

  const playing = lifecycleHost();
  playing.visibility('hidden');
  playing.dispose();
  playing.advance(1_500);
  playing.emit('blur');
  assert.equal(playing.state.status, 'playing');
  assert.equal(playing.timers.size, 0);
  assert.deepEqual(playing.events, ['controls', 'wake', 'save', 'music paused']);
});
