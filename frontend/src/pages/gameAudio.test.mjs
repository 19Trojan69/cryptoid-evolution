import { test } from "node:test";
import assert from "node:assert/strict";
import { GameAudio, hasPrimedGameAudio, primeGameAudio, takePrimedGameAudio } from "./gameAudio.ts";
import { DEFAULT_EFFECTS_VOLUME } from "./musicPreferences.ts";

test("game audio plays effects without scheduling background music", async () => {
  const previous = { AudioContext: globalThis.AudioContext, window: globalThis.window };
  let nextTimer = 0;
  const intervals = new Set();
  let playedTones = 0;
  const buses = [];
  let limiter;
  globalThis.window = {
    setInterval: () => { intervals.add(++nextTimer); return nextTimer; },
    clearInterval: timer => intervals.delete(timer),
  };
  globalThis.AudioContext = class {
    state = "running";
    currentTime = 0;
    destination = {};
    async resume() {}
    async close() {}
    createOscillator() {
      playedTones++;
      return { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: output => output, start() {}, stop() {} };
    }
    createGain() {
      const bus = { gain: { value: 1, setValueAtTime(value) { this.value = value; }, exponentialRampToValueAtTime() {} }, connect: output => output };
      buses.push(bus);
      return bus;
    }
    createDynamicsCompressor() {
      limiter = { threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 0 }, attack: { value: 0 }, release: { value: 0 }, connect: output => output };
      return limiter;
    }
  };
  const audio = new GameAudio();
  try {
    assert.equal(await audio.start(), true);
    assert.equal(intervals.size, 0);
    assert.equal(buses.length, 1);
    assert.equal(limiter.threshold.value, -12);
    assert.equal(limiter.ratio.value, 8);
    assert.equal(buses[0].gain.value, DEFAULT_EFFECTS_VOLUME / 50);
    audio.setEffectsVolume(25);
    assert.equal(buses[0].gain.value, .5);
    audio.setEffectsVolume(0);
    assert.equal(buses[0].gain.value, 0);
    audio.setEffectsVolume(100);
    assert.equal(buses[0].gain.value, 2);
    audio.play("laser");
    audio.play("collision");
    assert.equal(playedTones, 2);
    audio.play('extraLife');assert.equal(playedTones,9,'extra life has its own arpeggio and resolving chord');
    assert.equal(intervals.size, 0);
  } finally {
    audio.close();
    globalThis.AudioContext = previous.AudioContext;
    globalThis.window = previous.window;
  }
});

test("boss warning uses only the recorded alarm, without the old synthesized tones", async () => {
  const previous = { AudioContext: globalThis.AudioContext, fetch: globalThis.fetch };
  const samples = [];
  let oscillators = 0;
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
  globalThis.AudioContext = class {
    state = "running";
    currentTime = 0;
    destination = {};
    async resume() {}
    async close() {}
    async decodeAudioData() { return { duration: 4.83 }; }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: output => output }; }
    createOscillator() {
      oscillators++;
      return { connect: output => output, start() {}, stop() {} };
    }
    createBufferSource() { return { playbackRate: { value: 1 }, connect: output => output, start: () => samples.push(true) }; }
  };
  const audio = new GameAudio();
  try {
    assert.equal(await audio.start(), true);
    audio.play("boss");
    assert.equal(oscillators, 0);
    await new Promise(resolve => setImmediate(resolve));
    audio.play("boss");
    assert.equal(samples.length, 1);
    assert.equal(oscillators, 0);
  } finally {
    audio.close();
    globalThis.AudioContext = previous.AudioContext;
    globalThis.fetch = previous.fetch;
  }
});

test("boss explosion is louder than player destruction while both obey the effects slider", async () => {
  const previous = { AudioContext: globalThis.AudioContext, fetch: globalThis.fetch };
  const gains = [];
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
  globalThis.AudioContext = class {
    state = "running";
    destination = {};
    async resume() {}
    async close() {}
    async decodeAudioData() { return { duration: 1 }; }
    createGain() {
      const node = { gain: { value: 1 }, connect: output => output, disconnect() {} };
      gains.push(node);
      return node;
    }
    createBufferSource() { return { playbackRate: { value: 1 }, connect: output => output, start() {}, disconnect() {} }; }
  };
  const audio = new GameAudio();
  try {
    assert.equal(await audio.start(), true);
    await new Promise(resolve => setImmediate(resolve));
    audio.setEffectsVolume(35);
    audio.play("playerDestroy");
    audio.play("bossDestroy");
    assert.equal(gains[0].gain.value, .7);
    assert.equal(gains[1].gain.value, .321);
    assert.equal(gains[2].gain.value, .9);
    assert.ok(gains[2].gain.value > gains[1].gain.value);
    audio.setEffectsVolume(0);
    assert.equal(gains[0].gain.value, 0);
  } finally {
    audio.close();
    globalThis.AudioContext = previous.AudioContext;
    globalThis.fetch = previous.fetch;
  }
});

test("effects remain recoverable when the initial fullscreen audio resume never settles", async () => {
  const previous = globalThis.AudioContext;
  let starts = 0;
  let tones = 0;
  globalThis.AudioContext = class {
    state = "suspended";
    currentTime = 0;
    destination = {};
    resume() {
      starts++;
      if (starts === 1) return new Promise(() => {});
      this.state = "running";
      return Promise.resolve();
    }
    async close() {}
    createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: output => output }; }
    createOscillator() {
      tones++;
      return { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: output => output, start() {}, stop() {} };
    }
  };
  try {
    primeGameAudio();
    assert.equal(hasPrimedGameAudio(), true);
    const audio = takePrimedGameAudio();
    assert.ok(audio instanceof GameAudio);
    assert.equal(hasPrimedGameAudio(), false);
    assert.equal(await audio.start(), true);
    audio.play("laser");
    assert.equal(tones, 1);
    audio.close();
  } finally {
    globalThis.AudioContext = previous;
  }
});

test("mobile effects decode no more than three samples concurrently", async () => {
  const previous = { AudioContext: globalThis.AudioContext, fetch: globalThis.fetch };
  let active = 0;
  let maximum = 0;
  let decoded = 0;
  const releases = [];
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
  globalThis.AudioContext = class {
    state = "running";
    destination = {};
    async resume() {}
    async close() {}
    decodeAudioData() {
      active++;
      maximum = Math.max(maximum, active);
      return new Promise(resolve => releases.push(() => { active--; decoded++; resolve({ duration: 1 }); }));
    }
    createGain() { return { gain: { value: 1 }, connect: output => output }; }
  };
  const audio = new GameAudio();
  try {
    assert.equal(await audio.start(), true);
    assert.equal(maximum, 3);
    while (decoded < 20) {
      const release = releases.shift();
      if (release) release();
      await new Promise(resolve => setImmediate(resolve));
    }
    assert.equal(decoded, 20);
    assert.equal(maximum, 3);
  } finally {
    audio.close();
    globalThis.AudioContext = previous.AudioContext;
    globalThis.fetch = previous.fetch;
  }
});

test('boss voices reuse eighteen boss buffers plus eight enemy single/double buffers, obey mute and pause, and stay below twenty voices',async()=>{
 const previous=globalThis.AudioContext;let buffers=0,started=0,stopped=0;
 globalThis.AudioContext=class{
  state='running';currentTime=0;sampleRate=48000;destination={};
  async resume(){} async close(){}
  createBuffer(ch,length,rate){buffers++;return {copyToChannel(pcm){assert.equal(pcm.length,length);assert.equal(rate,48000);}};}
  createGain(){return {gain:{value:1,setValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}},connect(){},disconnect(){}};}
  createBufferSource(){return {playbackRate:{value:1},connect(){},disconnect(){},start(){started++;},stop(){stopped++;}};}
 };
 const audio=new GameAudio();try{
  await audio.start();assert.equal(buffers,26);await audio.start();assert.equal(buffers,26);
  audio.setEffectsVolume(0);assert.equal(audio.playBossWeapon('laser',6),false);
  audio.setEffectsVolume(35);for(let i=0;i<30;i++)assert.equal(audio.playBossWeapon('siege',28),true);
  assert.equal(started,30);assert.equal(stopped,10);
  audio.setPaused(true);assert.equal(stopped,30);assert.equal(audio.playBossWeapon('plasma',12),false);
  audio.setPaused(false);assert.equal(audio.playBossWeapon('plasma',12),true);
 }finally{audio.close();globalThis.AudioContext=previous;}
});

test('enemy shots use their own cached buffer and share the boss voice cap, slider and pause', async () => {
  const previous = { AudioContext: globalThis.AudioContext, fetch: globalThis.fetch };
  const buffers = [], sources = [], gains = [], pans = [];
  let stopped = 0;
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
  globalThis.AudioContext = class {
    state = 'running'; currentTime = 0; sampleRate = 48000; destination = {};
    async resume() {} async close() {}
    async decodeAudioData() { return { playerRecording: true }; }
    createBuffer(ch, length, rate) { const buffer = { copyToChannel() {}, length, rate }; buffers.push(buffer); return buffer; }
    createGain() { const gain = { gain: { value: 1, cancelScheduledValues() {}, setTargetAtTime() {} }, connect(output) { return output; }, disconnect() {} }; gains.push(gain); return gain; }
    createStereoPanner() { const pan = { pan: { value: 0 }, connect() {}, disconnect() {} }; pans.push(pan); return pan; }
    createBufferSource() { const source = { playbackRate: { value: 1 }, connect(output) { return output; }, disconnect() {}, start() { sources.push(this); }, stop() { stopped++; } }; return source; }
  };
  const audio = new GameAudio();
  try {
    await audio.start();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(buffers.length, 26);
    audio.play('laser');
    assert.equal(sources[0].buffer.playerRecording, true);
    audio.playBossWeapon('laser', 6);
    audio.playEnemyShot(-1);
    assert.notEqual(sources[2].buffer, sources[0].buffer);
    assert.notEqual(sources[2].buffer, sources[1].buffer);
    assert.equal(sources[2].buffer.length, 6720);
    assert.equal(pans.at(-1).pan.value, -.65);
    const enemyBuffer = sources[2].buffer;
    for (let i = 0; i < 25; i++) audio.playEnemyShot();
    assert.equal(buffers.length, 26);
    assert.ok(sources.slice(2).every(source => source.buffer === enemyBuffer));
    assert.deepEqual(sources.slice(2, 5).map(source => source.playbackRate.value), [.96, 1, 1.04]);
    assert.equal(stopped, 7); // 27 shared weapon voices, only 20 can remain active.
    audio.setEffectsVolume(25);
    assert.equal(gains[0].gain.value, .5);
    audio.setEffectsVolume(0);
    const count = sources.length;
    assert.equal(audio.playEnemyShot(), false);
    assert.equal(sources.length, count);
    audio.setEffectsVolume(35);
    audio.setPaused(true);
    assert.equal(stopped, 28); // Pausing also releases the player's active recording.
    assert.equal(audio.playEnemyShot(), false);
    audio.setPaused(false);
    assert.equal(audio.playEnemyShot(), true);
    audio.close();
    assert.equal(audio.playEnemyShot(), false);
  } finally { audio.close(); globalThis.AudioContext = previous.AudioContext; globalThis.fetch = previous.fetch; }
});

test('hostile volleys reserve mix headroom including fading voices, while warning recordings bypass the weapon bus', async () => {
  const previous = { AudioContext: globalThis.AudioContext, fetch: globalThis.fetch };
  const gains = [], sources = [];
  let failStart = false;
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
  globalThis.AudioContext = class {
    state = 'running'; currentTime = 0; sampleRate = 48000; destination = {};
    async resume() {} async close() {}
    async decodeAudioData() { return { recording: true }; }
    createBuffer(ch, length) { return { length, copyToChannel() {} }; }
    createGain() { const node = { gain: { value: 1, cancelScheduledValues() {}, setTargetAtTime() {} }, connect(output) { this.output = output; return output; }, disconnect() {} }; gains.push(node); return node; }
    createBufferSource() { const source = { playbackRate: { value: 1 }, connect(output) { this.output = output; return output; }, disconnect() {}, start() { if (failStart) throw new Error('Audio source unavailable'); sources.push(this); }, stop() { this.stopped = true; } }; return source; }
  };
  const audio = new GameAudio();
  try {
    await audio.start(); await new Promise(resolve => setImmediate(resolve));
    for (const shipClass of ['light', 'medium', 'heavy', 'elite']) assert.equal(audio.playEnemyShot(0, shipClass), true);
    assert.deepEqual(sources.map(source => source.buffer.length), [6720, 9120, 12480, 10080]);
    const weaponBus = gains[1];
    const assertBudget = () => {
      const peakBound = sources.filter(source => !source.buffer.recording && !source.ended)
        .reduce((sum, source) => sum + source.output.gain.value * .72, 0) * weaponBus.gain.value;
      assert.ok(peakBound <= .620001, `hostile peak budget ${peakBound}`);
    };
    assert.ok(sources[0].output.gain.value > .3);
    for (let i = 0; i < 45; i++) { audio.playBossWeapon('siege', 28, 4); assertBudget(); }
    assert.equal(sources.filter(source => !source.stopped).length, 20);
    assert.ok(weaponBus.gain.value < 1);
    audio.play('boss');
    const warning = sources.at(-1);
    assert.equal(warning.buffer.recording, true);
    assert.equal(warning.output.gain.value, .72);
    assert.equal(warning.output.output, gains[0]);
    for (const source of sources.filter(source => !source.buffer.recording)) { source.ended = true; source.onended(); assertBudget(); }
    assert.equal(weaponBus.gain.value, 1);
    failStart = true;
    assert.equal(audio.playEnemyShot(), false);
    assert.equal(weaponBus.gain.value, 1);
    failStart = false;
    assert.equal(audio.playEnemyShot(), true);
    audio.setPaused(true);
    for (const shipClass of ['light', 'medium', 'heavy', 'elite']) assert.equal(audio.playEnemyShot(0, shipClass), false);
    audio.setPaused(false); audio.setEffectsVolume(0);
    assert.equal(audio.playBossWeapon('siege', 28), false);
  } finally { audio.close(); globalThis.AudioContext = previous.AudioContext; globalThis.fetch = previous.fetch; }
});

test('simultaneous doubles reuse their layered buffers and obey the same mute, headroom and pause controls', async () => {
  const previous = {AudioContext: globalThis.AudioContext, fetch: globalThis.fetch};
  let buffers = 0;
  const sources = [], gains = [];
  globalThis.fetch = async () => ({ok: false});
  globalThis.AudioContext = class {
    state = 'running'; currentTime = 0; sampleRate = 48000; destination = {};
    async resume() {} async close() {}
    createBuffer(ch, length) { buffers++; return {length, copyToChannel() {}}; }
    createGain() { const g = {gain: {value: 1, cancelScheduledValues() {}, setTargetAtTime() {}}, connect(output) {return output;}, disconnect() {}}; gains.push(g); return g; }
    createBufferSource() { return {playbackRate: {value: 1}, connect(output) {this.output = output;}, disconnect() {}, start() {sources.push(this);}, stop() {this.stopped = true;}}; }
  };
  const audio = new GameAudio();
  try {
    await audio.start(); assert.equal(buffers, 26);
    audio.playEnemyShot(0, 'heavy', 'single');
    const single = sources.at(-1);
    audio.playEnemyShot(0, 'heavy', 'double');
    const double = sources.at(-1);
    assert.notEqual(single.buffer, double.buffer);
    assert.equal(double.buffer.length, single.buffer.length + 576);
    assert.ok(double.output.gain.value > single.output.gain.value);
    for (let i = 0; i < 40; i++) audio.playEnemyShot(0, 'heavy', 'double');
    assert.equal(buffers, 26); assert.equal(sources.filter(s => !s.stopped).length, 20);
    const sum = sources.reduce((n, s) => n + s.output.gain.value * .72, 0);
    assert.ok(sum * gains[1].gain.value <= .620001);
    audio.setEffectsVolume(25); assert.equal(gains[0].gain.value, .5);
    audio.setEffectsVolume(0); const count = sources.length;
    assert.equal(audio.playEnemyShot(0, 'heavy', 'double'), false); assert.equal(sources.length, count);
    audio.setEffectsVolume(100); assert.equal(gains[0].gain.value, 2);
    assert.ok(sum * gains[1].gain.value * gains[0].gain.value <= .620001, 'headroom survives the maximum effects slider');
    audio.setPaused(true); assert.equal(audio.playEnemyShot(0, 'heavy', 'double'), false);
    audio.setPaused(false); assert.equal(audio.playEnemyShot(0, 'heavy', 'double'), true);
  } finally {audio.close(); globalThis.AudioContext = previous.AudioContext; globalThis.fetch = previous.fetch;}
});

test('one-off tones disconnect, preserve all overlapping voices and allocate nothing while muted',async()=>{
 const previous=globalThis.AudioContext;const sources=[];let disconnected=0;
 globalThis.AudioContext=class{
  state='running';currentTime=0;destination={};async resume(){}async close(){}
  createGain(){return {gain:{value:1,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect:out=>out,disconnect(){disconnected++;}};}
  createOscillator(){const source={frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect:out=>out,disconnect(){disconnected++;},start(){},stop(){}};sources.push(source);return source;}
 };
 const audio=new GameAudio();try{
  await audio.start();for(let i=0;i<100;i++)audio.play('extraLife');assert.equal(audio.activeVoiceCount,700);
  for(const source of sources)source.onended?.();assert.equal(audio.activeVoiceCount,0);assert.equal(disconnected,1400);
  audio.setEffectsVolume(0);const count=sources.length;audio.play('extraLife');assert.equal(sources.length,count);
  audio.setEffectsVolume(35);audio.play('extraLife');audio.close();assert.equal(audio.activeVoiceCount,0);
 }finally{audio.close();globalThis.AudioContext=previous;}
});

