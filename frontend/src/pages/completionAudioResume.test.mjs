import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { AudioClockRecovery } from './audioClockRecovery.ts';
import { GameAudio } from './gameAudio.ts';
import { MusicPlayer } from './musicPlayback.ts';

function host(t, recovery = 'works', gestureGated = false) {
  const previous = { AudioContext: globalThis.AudioContext, Audio: globalThis.Audio, fetch: globalThis.fetch, document: globalThis.document };
  let now = 0, frozen = gestureGated, gesture = false, finishSuspend;
  const contexts = [], sources = [], gains = [], elements = [];
  t.mock.method(performance, 'now', () => now);
  globalThis.document = { visibilityState: 'visible' };
  const param = () => ({ value: 1, setValueAtTime(v) { this.value = v; },
    exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime(v) { this.value = v; } });
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
  globalThis.AudioContext = class {
    currentTime = 0; state = 'running'; sampleRate = 48000; destination = {}; suspends = 0; resumes = 0; nativeCalls = [];
    constructor() { contexts.push(this); }
    resume() {
      this.resumes++; this.nativeCalls.push({ kind: 'resume', gesture });
      if (gestureGated && !gesture) return new Promise(() => {});
      this.state = 'running'; if (recovery === 'works') { frozen = false; if (this.interruptionSuspended) this.interruptedFrozen = false; } return Promise.resolve();
    }
    suspend() {
      this.suspends++; this.nativeCalls.push({ kind: 'suspend', gesture });
      if (this.interruptedFrozen) this.interruptionSuspended = true;
      if (gestureGated) frozen = true;
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
    tap(action) { gesture = true; try { return action(); } finally { gesture = false; } },
    tick(ms) { now += ms; for (const c of contexts) if (!frozen && !c.interruptedFrozen && c.state === 'running') c.currentTime += ms / 1000; },
    interrupt(state = 'interrupted') { frozen = false; for (const c of contexts) { c.state = state; c.interruptedFrozen = c.currentTime > 0; c.interruptionSuspended = false; } },
    freeze() { frozen = true; }, finishSuspend() { finishSuspend?.(); },
    thaw() { frozen = false; },
    async ready() { await new Promise(resolve => setImmediate(resolve)); } };
}

// Controlled counterpart of a rendered, interrupted graph reporting running
// with a frozen rendering clock. This is not physical audibility.
for (const nativeState of ['interrupted', 'suspended']) {
  test(`rendered ${nativeState} graph restores its clock through the explicit Resume cycle`, async t => {
    const h = host(t, 'works', true);
    let Before;
    if (process.env.CRYPTOID_AUDIO_CONTROL === '1') {
    const source = execFileSync('git', ['show', '57a60fdc10e08d6b133ea19f74a8695a8070d5d0:frontend/src/pages/audioClockRecovery.ts'], { encoding: 'utf8' });
    const exports = {};
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,
      { exports, performance, document: globalThis.document });
    Before = exports.AudioClockRecovery;
    }
    for (const [Clock, fixed] of [...(Before ? [[Before, false]] : []), [AudioClockRecovery, true]]) {
      const clock = new Clock(), context = new AudioContext();
      await h.tap(() => clock.resume(context, true)); h.tick(500); clock.pause(); h.interrupt(nativeState);
      const before = context.currentTime;
      await h.tap(() => clock.resume(context, true)); h.tick(500);
      assert.equal(context.state, 'running');
      assert.equal(context.currentTime > before, fixed, 'native state alone is insufficient evidence');
      assert.deepEqual(context.nativeCalls.slice(fixed ? -2 : -1), fixed
        ? [{ kind: 'suspend', gesture: true }, { kind: 'resume', gesture: true }]
        : [{ kind: 'resume', gesture: true }]);
      clock.reset(); await context.close();
    }
  });
  test(`actual effects and music survive repeated rendered ${nativeState} interruptions in Resume`, async t => {
    const h = host(t, 'works', true), effects = new GameAudio(), music = new MusicPlayer('/audio/battle-orbit.mp3', 25);
    await h.tap(() => effects.start(true)); await h.tap(() => music.unlock(true)); await h.ready();
    effects.setPaused(false); await music.play(); h.tick(500);
    const buffers = effects.diagnosticResourceStats.audioSampleBuffers;
    for (let cycle = 1; cycle <= 4; cycle++) {
      effects.setPaused(true); music.pause(); h.interrupt(nativeState);
      const clocks = h.contexts.map(c => c.currentTime), sources = h.sources.length;
      await h.tap(() => Promise.all([effects.start(true), music.unlock(true)]));
      assert.equal(music.audio.paused, true); assert.equal(h.gains[1].gain.value, 0);
      h.tick(500); assert.ok(h.contexts.every((c, i) => c.currentTime > clocks[i] && c.suspends === cycle));
      effects.play('enemyHit'); assert.equal(h.sources.length, sources, 'countdown/summary stays silent');
      effects.setPaused(false); effects.play('enemyHit'); await music.play();
      assert.equal(effects.activeVoiceCount, 1); assert.equal(h.gains[1].gain.value, .25);
      assert.equal(h.contexts.length, 2); assert.equal(h.elements.length, 1);
      assert.equal(music.audio.currentTime, 42); assert.equal(effects.diagnosticResourceStats.audioSampleBuffers, buffers);
    }
    effects.close(); music.close();
  });
}

for (const state of ['interrupted', 'suspended']) test(`never-rendered ${state} graph still resumes directly within the click`, async t => {
  const h = host(t, 'works', true), clock = new AudioClockRecovery(), context = new AudioContext();
  context.state = state;
  assert.equal(await h.tap(() => clock.resume(context, true)), true);
  assert.deepEqual(context.nativeCalls, [{ kind: 'resume', gesture: true }]);
  h.tick(500); assert.equal(context.currentTime, .5); assert.equal(clock.recoveries, 0);
  clock.reset(); await context.close();
});
