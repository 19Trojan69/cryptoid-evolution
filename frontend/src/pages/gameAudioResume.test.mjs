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
let savedResume;
function visit(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) variables.set(node.name.text, node.initializer);
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
