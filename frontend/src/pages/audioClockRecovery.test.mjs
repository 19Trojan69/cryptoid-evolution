import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { AudioClockRecovery } from './audioClockRecovery.ts';
import { GameAudio } from './gameAudio.ts';
import { MusicPlayer } from './musicPlayback.ts';
import * as boss from './bossWeaponSound.ts';
import * as enemy from './enemyWeaponSound.ts';
import * as preferences from './musicPreferences.ts';
import * as audit from './ownerAudioAudit.ts';
import { technicalContext } from './stabilityReport.mjs';
import { reloadTechnicalContext } from './reloadDiagnostics.ts';

// Actual preceding released implementation, under the same controlled host.
function baselineGameAudio() {
  const source = execFileSync('git', ['show', '9087ef938b7b1520357c11eaa34320c33c2eaef4'], { encoding: 'utf8' });
  const exports = {};
  const deps = { './bossWeaponSound.ts': boss, './enemyWeaponSound.ts': enemy,
    './musicPreferences.ts': preferences, './ownerAudioAudit.ts': audit };
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(js, { exports, require: name => { assert.ok(deps[name]); return deps[name]; },
    AudioContext: globalThis.AudioContext, fetch: globalThis.fetch, AbortController, Date, performance });
  return exports.GameAudio;
}

function host(t, recovery = 'works') {
  const previous = { AudioContext: globalThis.AudioContext, Audio: globalThis.Audio, fetch: globalThis.fetch, document: globalThis.document };
  let now = 0, frozen = false, finishSuspend;
  const contexts = [], sources = [], gains = [], elements = [];
  t.mock.method(performance, 'now', () => now);
  globalThis.document = { visibilityState: 'visible' };
  const param = () => ({ value: 1, setValueAtTime(v) { this.value = v; },
    exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime(v) { this.value = v; } });
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
  globalThis.AudioContext = class {
    currentTime = 0; state = 'running'; sampleRate = 48000; destination = {}; suspends = 0; resumes = 0;
    constructor() { contexts.push(this); }
    resume() { this.resumes++; this.state = 'running'; if (recovery === 'works') frozen = false; return Promise.resolve(); }
    suspend() {
      this.suspends++;
      if (recovery === 'reject') return Promise.reject(Error('host unavailable'));
      if (recovery === 'throw') throw Error('host unavailable');
      if (recovery !== 'pending-running') this.state = 'suspended';
      if (recovery === 'pending' || recovery === 'pending-running') return new Promise(resolve => { finishSuspend = resolve; });
      return Promise.resolve();
    }
    close() { this.state = 'closed'; return Promise.resolve(); }
    decodeAudioData() { return Promise.resolve({ duration: .4, length: 19200, numberOfChannels: 1 }); }
    createBuffer(ch, length, rate) { return { length, duration: length / rate, sampleRate: rate, numberOfChannels: ch, copyToChannel() {} }; }
    createGain() {
      const node = { gain: param(), disconnected: false, connect(out) { return out; }, disconnect() { this.disconnected = true; } };
      gains.push(node); return node;
    }
    createMediaElementSource(element) { assert.ok(elements.includes(element)); return { connect: out => out, disconnect() {} }; }
    source(oscillator) {
      const node = { frequency: param(), playbackRate: param(), disconnected: false, stops: 0,
        connect(out) { this.output = out; return out; }, disconnect() { this.disconnected = true; },
        start(at = thisContext.currentTime) { this.startedAt = at; }, stop(at) { this.stops++; this.stopsAt = at; } };
      const thisContext = this;
      sources.push(node); return node;
    }
    createBufferSource() { return this.source(false); }
    createOscillator() { return this.source(true); }
  };
  globalThis.Audio = class {
    paused = true; currentTime = 42; duration = 180; volume = 1; listeners = new Set();
    constructor(src) { this.src = src; elements.push(this); }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    load() {} removeAttribute() {} addEventListener(n, f) { this.listeners.add(f); } removeEventListener(n, f) { this.listeners.delete(f); }
  };
  t.after(() => { Object.assign(globalThis, previous); t.mock.restoreAll(); });
  return { contexts, sources, gains, elements,
    tick(ms) { now += ms; for (const c of contexts) if (!frozen && c.state === 'running') c.currentTime += ms / 1000; },
    freeze() { frozen = true; }, finishSuspend() { finishSuspend?.(); },
    async ready() { await new Promise(resolve => setImmediate(resolve)); } };
}

test('negative control retains 2086 silent sources; frozen-clock candidate stops growth and coalesces recovery', async t => {
  const h = host(t, 'pending');
  const Baseline = baselineGameAudio(), old = new Baseline(), current = new GameAudio();
  await old.start(); await current.start(); await h.ready(); h.freeze();
  let peak = 0;
  for (let i = 0; i < 2086; i++) {
    h.tick(100); old.play('enemyHit'); current.play('enemyHit');
    peak = Math.max(peak, current.activeVoiceCount);
  }
  assert.equal(old.activeVoiceCount, 2086);
  assert.ok(peak <= 21); assert.equal(current.activeVoiceCount, 0);
  const c = h.contexts[1]; assert.equal(c.suspends, 1);
  const stats = current.diagnosticResourceStats;
  assert.equal(stats.audioClockStalls, 1); assert.equal(stats.audioRecoveries, 1);
  assert.ok(stats.audioBlockedSounds > 0);
  old.close(); current.close(); const resumes = c.resumes;
  h.finishSuspend(); await h.ready();
  assert.equal(c.resumes, resumes, 'late suspend completion cannot revive a closed graph');
});

test('advancing audio clock reaps missing-ended effects and fading weapons without cutting live sounds', async t => {
  const h = host(t), audio = new GameAudio(); await audio.start(); await h.ready();
  let peak = 0;
  for (let i = 0; i < 10000; i++) {
    h.tick(100); audio.play('enemyHit'); audio.playEnemyShot(0, 'heavy');
    peak = Math.max(peak, audio.activeVoiceCount);
    for (const voice of h.sources.slice(-32)) {
      if (voice.buffer && h.contexts[0].currentTime < voice.startedAt + voice.buffer.duration / voice.playbackRate.value)
        assert.equal(voice.disconnected, false, 'actual scheduled sound stays connected through its entire duration');
    }
  }
  assert.ok(peak < 40); assert.equal(h.contexts[0].suspends, 0);
  assert.ok(audio.diagnosticResourceStats.audioReapedVoices > 19000);
  audio.close(); assert.equal(audio.activeVoiceCount, 0);
  assert.ok(h.sources.every(s => s.disconnected));
});

test('successful same-context recovery resumes new sounds without replaying queued sources', async t => {
  const h = host(t), audio = new GameAudio(); await audio.start(); await h.ready(); h.freeze();
  for (let i = 0; i < 22; i++) { h.tick(100); audio.play('enemyHit'); }
  await h.ready(); h.tick(100); audio.play('enemyHit'); h.tick(100); audio.play('enemyHit');
  assert.equal(h.contexts.length, 1); assert.equal(h.contexts[0].suspends, 1);
  assert.ok(audio.activeVoiceCount > 0 && audio.activeVoiceCount < 4);
  assert.ok(h.sources.filter(s => s.startedAt === 0).every(s => s.disconnected)); audio.close();
});

for (const mode of ['reject', 'throw']) test(`failed ${mode} recovery remains bounded without repeated suspend calls`, async t => {
  const h = host(t, mode), audio = new GameAudio(); await audio.start(); await h.ready(); h.freeze();
  for (let i = 0; i < 1000; i++) { h.tick(100); audio.play('enemyHit'); await Promise.resolve(); }
  assert.equal(h.contexts[0].suspends, 1); assert.equal(audio.activeVoiceCount, 0);
  audio.close();
});

test('pause releases all weapons including retired fades when ended never arrives', async t => {
  const h = host(t), audio = new GameAudio(); await audio.start(); await h.ready();
  for (let i = 0; i < 100; i++) audio.playEnemyShot();
  audio.play('extraLife'); assert.ok(audio.activeVoiceCount > 100);
  audio.setPaused(true); assert.equal(audio.activeVoiceCount, 0);
  assert.ok(h.sources.every(s => s.disconnected));
  const count = h.sources.length; audio.play('extraLife'); assert.equal(h.sources.length, count);
  audio.setPaused(false); audio.play('extraLife'); assert.equal(audio.activeVoiceCount, 7); audio.close();
});

test('delayed extra-life notes retain their complete original envelope before fallback cleanup', async t => {
  const h = host(t), audio = new GameAudio(); await audio.start(); await h.ready(); audio.play('extraLife');
  const notes = h.sources.slice(); assert.equal(notes.length, 7);
  h.tick(700); audio.play('enemyHit'); assert.ok(notes.every(s => !s.disconnected));
  h.tick(600); audio.play('enemyHit'); assert.ok(notes.slice(4).every(s => !s.disconnected));
  h.tick(1100); audio.play('enemyHit'); assert.ok(notes.every(s => s.disconnected)); audio.close();
});

test('pauses, hidden periods and long gaps never trigger frozen-clock repair', t => {
  const h = host(t), clock = new AudioClockRecovery(), c = new AudioContext(); clock.observe(c);
  for (let i = 0; i < 4; i++) { h.tick(10000); assert.equal(clock.observe(c), true); }
  h.freeze(); document.visibilityState = 'hidden';
  for (let i = 0; i < 50; i++) { h.tick(100); clock.observe(c); }
  document.visibilityState = 'visible'; clock.pause(); assert.equal(clock.observe(c), true);
  assert.equal(clock.stalls, 0); assert.equal(c.suspends, 0);
});

test('music repairs a running frozen graph on its same unlocked element without seeking or changing gain', async t => {
  const h = host(t), player = new MusicPlayer('/audio/battle-orbit.mp3', 25);
  await player.play(); h.freeze();
  for (let i = 0; i < 22; i++) { h.tick(100); await player.play(); }
  h.tick(100); await player.play();
  assert.equal(h.contexts.length, 1); assert.equal(h.elements.length, 1);
  assert.equal(h.contexts[0].suspends, 1); assert.equal(player.audio.currentTime, 42);
  assert.equal(h.gains[0].gain.value, .25); player.close();
});

test('pause silences pending native music start and Resume unlock stays silent until play', async t => {
  const h = host(t), player = new MusicPlayer('/audio/battle-orbit.mp3', 25); let finish;
  player.audio.play = () => new Promise(resolve => { finish = () => { player.audio.paused = false; resolve(); }; });
  const pending = player.play(); player.pause(); assert.equal(h.gains[0].gain.value, 0);
  await player.unlock(); assert.equal(h.gains[0].gain.value, 0);
  finish(); assert.equal(await pending, false); assert.equal(player.audio.paused, true);
  player.audio.play = () => { player.audio.paused = false; return Promise.resolve(); };
  assert.equal(await player.play(), true); assert.equal(h.gains[0].gain.value, .25); player.close();
});

test('owner resource export preserves only bounded audio-clock evidence', () => {
  const raw = { audioClockMs: 42123, audioClockStalls: 1, audioRecoveries: 1, audioBlockedSounds: 2000,
    audioReapedVoices: 6, privateAudioUrl: 'private', audioVoices: 2 };
  const clean = technicalContext(reloadTechnicalContext(raw));
  assert.equal(clean.audioClockMs, raw.audioClockMs); assert.equal(clean.audioBlockedSounds, 2000);
  assert.equal(clean.privateAudioUrl, undefined);
  assert.equal(technicalContext({ audioClockMs: Infinity, audioRecoveries: -1, audioReapedVoices: 1e20 }), null);
});

test('explicit Resume restarts both paused running graphs before delayed gameplay without replacing their resources', async t => {
  const h = host(t), effects = new GameAudio(), music = new MusicPlayer('/audio/battle-orbit.mp3', 25);
  await effects.start(); await music.play(); await h.ready();
  effects.setPaused(true); music.pause(); h.freeze();
  const buffers = effects.diagnosticResourceStats.audioSampleBuffers;
  const effectUnlock = effects.start(true), musicUnlock = music.unlock(true);
  await Promise.all([effectUnlock, musicUnlock]);
  assert.equal(h.contexts.length, 2); assert.ok(h.contexts.every(c => c.suspends === 1));
  assert.equal(h.elements.length, 1); assert.equal(music.audio.currentTime, 42);
  assert.equal(music.audio.paused, true); assert.equal(h.gains[1].gain.value, 0);
  assert.equal(effects.diagnosticResourceStats.audioSampleBuffers, buffers);
  const count = h.sources.length; effects.play('enemyHit'); assert.equal(h.sources.length, count);
  h.tick(100); effects.setPaused(false); effects.play('enemyHit'); await music.play();
  assert.equal(h.sources.length, count + 1); assert.equal(h.gains[1].gain.value, .25);
  effects.close(); music.close();
});

test('healthy completed sounds match preceding runtime parameters and leave no retained voices', async t => {
  const h = host(t), Baseline = baselineGameAudio(), old = new Baseline(), audio = new GameAudio();
  await old.start(); await audio.start(); await h.ready();
  const describe = voice => ({ duration: voice.buffer?.duration, rate: voice.playbackRate.value,
    at: voice.startedAt, stop: voice.stopsAt, gain: voice.output.gain.value });
  for (let i = 0; i < 500; i++) {
    h.tick(100);
    let at = h.sources.length; old.play('enemyHit'); old.playEnemyShot(0, 'elite'); old.play('extraLife');
    const oldVoices = h.sources.slice(at); at = h.sources.length;
    audio.play('enemyHit'); audio.playEnemyShot(0, 'elite'); audio.play('extraLife');
    const newVoices = h.sources.slice(at);
    assert.deepEqual(newVoices.map(describe), oldVoices.map(describe));
    for (const voice of [...oldVoices, ...newVoices]) voice.onended?.();
    assert.equal(audio.activeVoiceCount, 0); assert.equal(old.activeVoiceCount, 0);
  }
  assert.ok(h.contexts.every(c => c.suspends === 0)); old.close(); audio.close();
});

test('stuck running recovery shares one pending music request across further gestures', async t => {
  const h = host(t, 'pending-running'), player = new MusicPlayer('/audio/battle-orbit.mp3', 25);
  await player.play(); h.freeze();
  for (let i = 0; i < 19; i++) { h.tick(100); await player.play(); }
  h.tick(200); const pending = player.play();
  for (let i = 0; i < 2000; i++) { h.tick(100); assert.strictEqual(player.play(), pending); }
  assert.equal(h.contexts[0].suspends, 1); assert.equal(h.elements.length, 1);
  player.close(); const resumes = h.contexts[0].resumes; h.finishSuspend();
  assert.equal(await pending, false); assert.equal(h.contexts[0].resumes, resumes);
});

test('pending initial autoplay can still be retried in a later gesture', async t => {
  const h = host(t), player = new MusicPlayer('/audio/battle-orbit.mp3', 25); let finish, calls = 0;
  player.audio.play = () => ++calls === 1 ? new Promise(resolve => { finish = resolve; })
    : (player.audio.paused = false, Promise.resolve());
  const initial = player.play(); assert.equal(await player.play(), true); assert.equal(calls, 2);
  finish(); await initial; player.close(); assert.equal(h.elements.length, 1);
});
