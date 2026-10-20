import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { MusicPlayer, primeGameMusic, cancelPrimedGameMusic, takeHandoffGameMusic } from './musicPlayback.ts';
import { primeCardSound, closeCardAudioForAudit, cardAudioAuditSnapshot } from './cardSound.ts';

const official = '613b3c7ebaf235d75aab4fdc33eb58897e111e2f';
const current = fs.readFileSync(new URL('./AdminPage.tsx', import.meta.url), 'utf8');
function find(node, predicate) {
  if (predicate(node)) return node;
  let found;
  ts.forEachChild(node, child => { found ??= find(child, predicate); });
  return found;
}
function handler(source) {
  const file = ts.createSourceFile('AdminPage.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  return ts.transpileModule('(' + find(file, n => ts.isVariableDeclaration(n) && n.name.getText(file) === 'startTest').initializer.getText(file) + ')',
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
}
function cleanup(scope) {
  const file = ts.createSourceFile('AdminPage.tsx', current, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const effect = find(file, n => ts.isCallExpression(n) && n.expression.getText(file) === 'useEffect'
    && n.arguments[0]?.getText(file).includes('cancelPrimedGameMusic(pendingGameMusicRef.current)'));
  const js = ts.transpileModule('(' + effect.arguments[0].getText(file) + ')',
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return vm.runInNewContext(js, scope)();
}
function host() {
  const previous = { Audio: globalThis.Audio, AudioContext: globalThis.AudioContext };
  let gesture = false;
  const contexts = [], elements = [];
  globalThis.AudioContext = class {
    state = 'suspended'; currentTime = 0; destination = {}; closes = 0;
    constructor() { contexts.push(this); }
    createMediaElementSource() { return { connect: gain => gain, disconnect() {} }; }
    createGain() { return { gain: { value: 0, setTargetAtTime() {} }, connect() { return this; }, disconnect() {} }; }
    resume() {
      if (this.state === 'running') return Promise.resolve();
      if (!gesture) return new Promise(() => {}); // Like the observed suspended, pending host.
      this.state = 'running'; return Promise.resolve();
    }
    close() { this.closes++; this.state = 'closed'; return Promise.resolve(); }
  };
  globalThis.Audio = class {
    paused = true; currentTime = 0; duration = 180; volume = 1; allowed = false; plays = 0;
    constructor(src) { this.src = src; elements.push(this); }
    load() { if (gesture) this.allowed = true; this.currentTime = 0; }
    play() {
      this.plays++;
      if (!this.allowed && !gesture) return Promise.reject(Error('gesture required'));
      this.allowed = true; this.paused = false; return Promise.resolve();
    }
    pause() { this.paused = true; }
    removeAttribute() { this.src = ''; }
    addEventListener() {} removeEventListener() {}
  };
  return { contexts, elements, click(action) { gesture = true; try { return action(); } finally { gesture = false; } },
    restore() { takeHandoffGameMusic()?.close(); closeCardAudioForAudit(); Object.assign(globalThis, previous); } };
}
function launch(source = current, musicPreference = 'on') {
  let accept, reject, pending, failure, mounted;
  const values = new Map(), paths = [], requests = [];
  const scope = {
    busy: false, level: 3, block: 5, stage: 3, weapon: 5, power: '', skinId: 'same-skin', colorId: 'same-color',
    primeGameAudio() {}, primeCardSound, primeGameMusic, cancelPrimedGameMusic, MUSIC_STORAGE_KEY: 'music',
    localStorage: { getItem: () => musicPreference }, readMusicVolume: () => 50,
    pendingGameMusicRef: { current: null }, audioRequest: { current: 0 }, audioRef: { current: null },
    axiosClient: { post(path, configuration) { requests.push({ path, configuration }); return new Promise((a, r) => { accept = a; reject = r; }); } },
    perform(action) { pending = action().catch(error => { failure = error; }); return pending; },
    sessionStorage: { setItem: (key, value) => values.set(key, value) },
    ADMIN_MODE_KEY: 'admin', ADMIN_TEST_CONFIG_KEY: 'config', ADMIN_SHIP_SKIN_KEY: 'skin',
    ADMIN_SHIP_COLOR_KEY: 'color', ADMIN_SHIP_STAGE_KEY: 'stage', ADMIN_START_SECTOR_KEY: 'sector',
    requestGameFullscreen() {}, navigate(path) {
      paths.push(path);
      mounted = takeHandoffGameMusic() ?? new MusicPlayer('/audio/battle-orbit.mp3', 50);
    },
  };
  return { scope, requests, values, paths, start: vm.runInNewContext(handler(source), scope),
    accept: () => accept(), reject: () => reject(Error('server unavailable')), settle: () => pending,
    get failure() { return failure; }, get mounted() { return mounted; } };
}

test('the official Admin start reproduces a suspended music/card graph after the server boundary', async () => {
  const h = host();
  const baseline = execFileSync('git', ['show', `${official}:frontend/src/pages/AdminPage.tsx`], { encoding: 'utf8' });
  const run = launch(baseline);
  try {
    h.click(() => run.start('normal'));
    run.accept(); await run.settle();
    assert.equal(await run.mounted.play(), false);
    primeCardSound();
    assert.equal(run.mounted.audioAuditSnapshot.musicState, 'suspended');
    assert.equal(cardAudioAuditSnapshot().cardState, 'suspended');
    assert.equal(run.requests[0].configuration.sector, 25);
  } finally { run.mounted?.close(); h.restore(); }
});

test('Admin prepares the same silent music/card graphs in the click and hands music through a delayed request', async () => {
  const h = host(), run = launch();
  try {
    h.click(() => run.start('normal'));
    const prepared = run.scope.pendingGameMusicRef.current;
    assert.equal(prepared.audioAuditSnapshot.musicState, 'running');
    assert.equal(cardAudioAuditSnapshot().cardState, 'running');
    assert.equal(prepared.audio.paused, true, 'the request/loading phase stays silent');
    assert.equal(prepared.audio.plays, 0);
    assert.equal(h.contexts.length, 2);
    await new Promise(resolve => setImmediate(resolve));
    run.accept(); await run.settle();
    assert.strictEqual(run.mounted, prepared);
    assert.equal(run.scope.pendingGameMusicRef.current, null);
    cleanup(run.scope)();
    assert.equal(prepared.audioAuditSnapshot.musicState, 'running', 'leaving Admin does not retire the transferred player');
    assert.equal(await run.mounted.play(), true, 'the unlocked graph and element survive the async boundary');
    assert.equal(h.contexts.length, 2, 'mounting does not allocate a replacement graph');
    assert.equal(run.requests[0].path, '/admin/start');
    assert.equal(run.requests[0].configuration.sector, 25);
    assert.equal(run.values.get('admin'), '1');
    assert.deepEqual(run.paths, ['/game']);
  } finally { run.mounted?.close(); h.restore(); }
});

test('leaving Admin while a launch is pending retires only its unclaimed music', async () => {
  const h = host(), run = launch();
  try {
    h.click(() => run.start('normal'));
    const prepared = run.scope.pendingGameMusicRef.current;
    cleanup(run.scope)();
    assert.equal(prepared.audioAuditSnapshot.musicState, 'none');
    assert.equal(takeHandoffGameMusic(), null);
    run.reject(); await run.settle();
    assert.equal(h.contexts.filter(context => context.closes === 1).length, 1);
    const replacement = h.click(() => primeGameMusic(50));
    cancelPrimedGameMusic(prepared);
    assert.strictEqual(takeHandoffGameMusic(), replacement, 'a stale cancellation cannot close a later launch');
    replacement.close();
  } finally { run.mounted?.close(); h.restore(); }
});

test('failed Admin starts retire the prepared music without accumulating contexts', async () => {
  const h = host();
  try {
    for (let i = 0; i < 20; i++) {
      const run = launch();
      h.click(() => run.start('boss'));
      const prepared = run.scope.pendingGameMusicRef.current;
      run.reject(); await run.settle();
      assert.equal(prepared.audioAuditSnapshot.musicState, 'none');
      assert.equal(run.scope.pendingGameMusicRef.current, null);
      assert.match(run.failure.message, /server unavailable/);
      assert.equal(takeHandoffGameMusic(), null);
      assert.deepEqual(run.paths, []);
    }
    assert.equal(h.contexts.filter(context => context.state === 'running').length, 1, 'only the shared card graph remains');
    assert.equal(h.contexts.filter(context => context.closes === 1).length, 20);
  } finally { h.restore(); }
});

test('saved music-off and busy Admin states do not prepare a soundtrack', async () => {
  const h = host(), run = launch(current, 'off');
  try {
    h.click(() => run.start('bonus'));
    assert.equal(h.elements.length, 0);
    assert.equal(run.scope.pendingGameMusicRef.current, null);
    run.reject(); await run.settle();
    const busy = launch(); busy.scope.busy = true;
    h.click(() => busy.start('normal'));
    assert.equal(busy.requests.length, 0);
    assert.equal(h.elements.length, 0);
  } finally { h.restore(); }
});

test('an unavailable media host cannot prevent the existing Admin request', async () => {
  const h = host(), run = launch();
  globalThis.Audio = class { constructor() { throw Error('host unavailable'); } };
  try {
    h.click(() => run.start('normal'));
    assert.equal(run.requests.length, 1);
    assert.equal(run.scope.pendingGameMusicRef.current, null);
    run.reject(); await run.settle();
    assert.match(run.failure.message, /server unavailable/);
  } finally { h.restore(); }
});
