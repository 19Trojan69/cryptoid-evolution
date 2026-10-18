import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { startGuardedGameLoop, GAME_STALL_MS } from './gameLoop.ts';
import { recordGameDiagnostic, GAME_DIAGNOSTICS_KEY, createGameSessionDiagnostics } from './gameDiagnostics.ts';

function harness(step = () => {}, onFault = () => {}) {
  let clock = 0, next = 0, active = true, visible = true;
  const frames = new Map(), canceled = [], faults = [];
  let watch;
  const stop = startGuardedGameLoop({ step, fault: (...args) => { faults.push(args); onFault(...args); },
    active: () => active, visible: () => visible, now: () => clock,
    requestFrame: cb => { frames.set(++next, cb); return next; },
    cancelFrame: id => { canceled.push(id); frames.delete(id); },
    watch: cb => { watch = cb; return 1; }, unwatch: () => watch = null });
  return { frames, faults, canceled, stop,
    frame: () => { const [id, cb] = frames.entries().next().value; frames.delete(id); cb(clock); },
    advance: ms => clock += ms, check: () => watch?.(),
    active: value => active = value, visible: value => visible = value };
}
test('early returns always schedule exactly one following frame', () => {
  let steps = 0; const h = harness(() => { steps++; return; });
  for (let i = 0; i < 200; i++) { h.advance(16); h.frame(); assert.equal(h.frames.size, 1); }
  assert.equal(steps, 200); assert.equal(h.faults.length, 0); h.stop(); assert.equal(h.frames.size, 0);
});
test('a frame exception pauses through the fault callback and leaves the loop usable', () => {
  let fail = true, steps = 0;
  const h = harness(() => { steps++; if (fail) throw new TypeError('simulated frame failure'); });
  h.frame(); assert.equal(h.faults[0][0], 'frame-error'); assert.equal(h.frames.size, 1);
  fail = false; h.advance(16); h.frame(); assert.equal(steps, 2); assert.equal(h.frames.size, 1); h.stop();
});
test('repeated failure is reported once until a frame succeeds; reporting errors cannot kill RAF', () => {
  const h = harness(() => { throw new Error('failed'); }, () => { throw new Error('report failed'); });
  for (let i = 0; i < 10; i++) { h.advance(16); h.frame(); }
  assert.equal(h.faults.length, 1); assert.equal(h.frames.size, 1); h.stop();
});
test('stalled foreground loop is replaced; a late canceled callback cannot create a second loop', () => {
  let steps = 0; const h = harness(() => steps++);
  const stale = [...h.frames.values()][0]; h.advance(GAME_STALL_MS + 1); h.check();
  assert.equal(h.faults[0][0], 'loop-stall'); assert.equal(h.frames.size, 1); assert.equal(h.canceled.length, 1);
  stale(3000); assert.equal(steps, 0); assert.equal(h.frames.size, 1);
  h.frame(); assert.equal(steps, 1); assert.equal(h.frames.size, 1); h.stop();
});
test('a delayed RAF is detected even when it runs before the monitoring timer', () => {
  const h = harness(); h.advance(GAME_STALL_MS + 1); h.frame();
  assert.equal(h.faults[0][0], 'loop-stall'); h.stop();
});
test('intentional pause and hidden tabs are never treated as a foreground stall', () => {
  const h = harness(); h.active(false); h.advance(10000); h.check(); h.frame();
  h.active(true); h.visible(false); h.advance(10000); h.check(); h.frame();
  assert.equal(h.faults.length, 0); h.stop();
});
test('cleanup invalidates callbacks and monitoring, including Strict Mode remounts', () => {
  let steps = 0; const h = harness(() => steps++), stale = [...h.frames.values()][0];
  h.stop(); stale(16); h.advance(10000); h.check();
  assert.equal(steps, 0); assert.equal(h.faults.length, 0); assert.equal(h.frames.size, 0);
});

test('actual GamePage recovery preserves run, lives, rewards and paid timers even if audio/save fails', async () => {
  const source = fs.readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('GamePage.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let assignment;
  const visit = node => {
    if (ts.isBinaryExpression(node) && node.left.getText(ast) === 'interruptionRef.current') assignment = node.getText(ast);
    ts.forEachChild(node, visit);
  }; visit(ast); assert.ok(assignment);
  const state = { status: 'playing', hearts: 2, maxHearts: 6, score: 565, shards: 191,
    sector: 3, phase: 'FORMATION', encounter: 'normal', player: { x: .2, y: .8 },
    weaponTimers: [0, 0, 12345, 0, 0, 0], shieldCharges: 1, shieldMs: 4000, destroyed: 8 };
  const original = structuredClone(state); const reports = [], updates = [], flags = [], saved = [];
  let notice = '', resets = 0;
  const context = {
    Error, ownerDiagnostics:false, performanceProbeRef: {current:null}, recordReloadEvent:()=>{}, interruptionRef: { current: null }, stateRef: { current: state }, lastFrameRef: { current: 200 },
    clearControls: () => resets++, setTechnicalPause: value => flags.push(value),
    setWeaponCountdown: value => assert.equal(value, null), setWeaponMenuOpen: value => assert.equal(value, false),
    soundRef: { current: { setPaused: () => { throw new Error('audio host unavailable'); } } }, musicRef: { current: null },
    recordGameDiagnostic: value => reports.push(value), fieldSizeRef: { current: { width: 390, height: 760 } },
    navigator: { userAgent: 'test browser' }, setGame: value => updates.push(value),
    sectorInChapter: sector => (sector - 1) % 10 + 1, lastSavedAtRef: { current: 0 }, lastMeasuredFrameRef: { current: 0 },
    saveCombatRef: { current: async () => { saved.push(structuredClone(state)); throw new Error('offline'); } },
    setSaveNotice: value => notice = value,
  };
  vm.runInNewContext(ts.transpileModule(assignment, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  const h = harness(() => { if (state.status === 'playing') throw new Error('simulation failed'); }, context.interruptionRef.current);
  h.frame(); await Promise.resolve(); await Promise.resolve();
  assert.equal(state.status, 'paused'); assert.deepEqual(state, { ...original, status: 'paused' });
  assert.equal(resets, 1); assert.deepEqual(flags, [true]); assert.equal(updates.length, 1);
  assert.equal(saved[0].hearts, 2); assert.equal(saved[0].weaponTimers[2], 12345);
  assert.equal(reports[0].reason, 'frame-error'); assert.ok(notice.startsWith('Save not confirmed'));
  h.advance(16); h.frame(); assert.equal(h.faults.length, 1); h.stop();
});
test('diagnostics stay local and bounded and malformed/unavailable storage cannot break recovery', () => {
  let value = 'invalid'; const storage = { getItem: () => value, setItem: (key, next) => { assert.equal(key, GAME_DIAGNOSTICS_KEY); value = next; } };
  const report = { reason: 'input-error', errorName: 'TypeError', sector: 3, phase: 'FORMATION', encounter: 'normal', status: 'paused', width: 390, height: 760, browser: 'x'.repeat(1000) };
  for (let i = 0; i < 50; i++) recordGameDiagnostic(report, storage);
  const records = JSON.parse(value); assert.equal(records.length, 20); assert.equal(records[0].browser.length, 240);
  assert.equal('account' in records[0], false); assert.equal('message' in records[0], false);
  assert.doesNotThrow(() => recordGameDiagnostic(report, { getItem: () => { throw new Error('storage disabled'); }, setItem: () => {} }));
});


test('denied sessionStorage cannot fail GamePage diagnostics setup or remove its error protection', () => {
  const source = fs.readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('GamePage.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect'
      && node.arguments[0]?.getText(ast).includes('createGameSessionDiagnostics(')) callback = node.arguments[0].getText(ast);
    ts.forEachChild(node, visit);
  }; visit(ast); assert.ok(callback);
  const listeners = new Map(), faults = [], reports = [], state = {status:'playing'};
  const host = {addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
  Object.defineProperty(host,'sessionStorage',{get(){throw new Error('SecurityError: storage denied');}});
  const previousWindow = globalThis.window; globalThis.window = host;
  const context = {window:host,document:{hidden:false,addEventListener:host.addEventListener,removeEventListener:host.removeEventListener},
    performance:{getEntriesByType:()=>[]}, Date, ownerDiagnostics:false, developerProbeEnabled:()=>false, performanceProbeRef:{current:null}, diagnosticsRef:{current:null}, reloadDiagnosticsRef:{current:null},
    installReloadDiagnostics:()=>{throw new Error('non-owner diagnostics must stay disabled');}, createReloadGameMonitor:()=>({finish(){}}),
    stateRef:{current:state}, interruptionRef:{current:(reason,error)=>faults.push({reason,error})},
    recordGameDiagnostic:entry=>reports.push(entry), createGameSessionDiagnostics,
    diagnosticContext:()=>({reason:'performance',errorName:'',sector:25,phase:'FORMATION',encounter:'normal',status:'playing',width:390,height:760,browser:'test'}),
  };
  try {
    vm.runInNewContext(ts.transpileModule('globalThis.installDiagnostics = '+callback,
      {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
    const cleanup = context.installDiagnostics();
    assert.equal(listeners.size,5); assert.ok(context.diagnosticsRef.current);
    assert.doesNotThrow(()=>listeners.get('visibilitychange')());
    const error=new Error('test fault');listeners.get('error')({error});
    assert.deepEqual(faults,[{reason:'javascript-error',error}]);
    cleanup();assert.equal(listeners.size,0);assert.equal(context.diagnosticsRef.current,null);
    assert.equal(reports.length,0);
  } finally {if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;}
});
