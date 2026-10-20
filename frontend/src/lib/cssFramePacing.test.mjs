import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startCssFramePacing, paceAnimation, cssFramePacingStats } from './cssFramePacing.ts';
import { frameEasing, nativeFrameEasing } from './nativeFrameEasing.ts';

// Controlled host: lifecycle/ownership proof, not native compositor/iPhone proof.
function host() {
  const root = new EventTarget();
  const probes = [];
  const view = {
    CSS: { supports: () => true },
    KeyframeEffect: class {
      constructor(target, keyframes, timing) { this.target = target; this.timing = timing; }
      getComputedTiming() { return { progress: this.time ** 2 }; }
    },
    Animation: class {
      constructor(effect, timeline) { assert.equal(effect.target, null); assert.equal(timeline, null); this.effect = effect; probes.push(this); }
      set currentTime(value) { this.effect.time = value; }
      cancel() { this.canceled = true; }
    },
  };
  root.ownerDocument = { defaultView: view };
  root.contains = target => target.isConnected;
  const animations = [];
  root.getAnimations = () => animations;
  function animation({ duration = 1000, rate = 1, easing = 'linear', ...options } = {}) {
    const a = new EventTarget();
    const timing = { duration, easing, delay: 70, endDelay: 20, iterations: Infinity, direction: 'alternate', fill: 'both', ...options };
    const updates = [];
    a.playState = 'running'; a.playbackRate = rate;
    // Any visible clock/rate write is a regression. Native owns both.
    Object.defineProperty(a, 'currentTime', { get: () => 123, set: () => assert.fail('visible animation clock sought') });
    Object.defineProperty(a, 'playbackRate', { get: () => rate, set: () => assert.fail('visible animation rate changed') });
    a.finish = a.pause = a.play = () => assert.fail('native playback overridden');
    a.effect = {
      target: { isConnected: true },
      getTiming: () => ({ ...timing }),
      getComputedTiming: () => ({ duration }),
      updateTiming: change => { updates.push(change); Object.assign(timing, change); },
    };
    animations.push(a);
    return Object.assign(a, { timing, updates });
  }
  return { root, view, animation, animations, probes };
}

test('all visible clocks stay native; duration, easing inside keyframes and playback controls are preserved', () => {
  const h = host(), a = h.animation(), before = { ...a.timing }, stop = startCssFramePacing(h.root);
  assert.deepEqual(a.timing, { ...before, easing: 'steps(60, end)' });
  assert.equal(a.playbackRate, 1);
  assert.equal(a.currentTime, 123);
  assert.deepEqual(cssFramePacingStats(), { mode: 'native-easing', targetHz: 60, active: 1, configured: 1, fallbacks: 0, jsFrameWrites: 0 });
  stop(); assert.deepEqual(a.timing, before); assert.equal(cssFramePacingStats().active, 0);
});

test('configured progress spacing never exceeds 60 steps per real second at positive/negative authored rates', () => {
  for (const duration of [17, 23, 180, 250, 1100, 3300, 42000]) {
    for (const rate of [0.5, 1, 2, -1]) {
      const h = host(), a = h.animation({ duration, rate });
      const result = nativeFrameEasing(a, h.view);
      if (duration / Math.abs(rate) < 1000 / 60) { assert.equal(result, null); continue; }
      const count = Number(result.paced.match(/^steps\((\d+), end\)$/)[1]);
      assert.ok(count / (duration / Math.abs(rate) / 1000) <= 60 + 1e-9);
      assert.equal(a.updates.length, 0);
    }
  }
});

test('nonlinear curve samples the original easing before quantization, including overshoot', () => {
  const samples = [];
  const curve = frameEasing(4, 'authored-ease', p => { samples.push(p); return p * 2 - .3; });
  assert.deepEqual(samples, [0, .25, .5, .75, 1]);
  assert.equal(curve, 'linear(-0.3 0% 25%,0.2 25% 50%,0.7 50% 75%,1.2 75% 100%,1.7 100%)');
  assert.equal(frameEasing(5000, 'ease', () => assert.fail('unbounded sampling')), null);
  assert.equal(frameEasing(2, 'ease', () => NaN), null);
});

test('nonlinear native sampling uses only a detached, timeline-free temporary probe, then cancels it', () => {
  const h = host(), a = h.animation({ duration: 150, easing: 'cubic-bezier(.2,.4,.6,.8)' });
  const stop = startCssFramePacing(h.root);
  assert.match(a.timing.easing, /^linear\(/);
  assert.equal(h.probes.length, 1); assert.equal(h.probes[0].canceled, true);
  stop(); assert.equal(a.timing.easing, 'cubic-bezier(.2,.4,.6,.8)');
});

test('native finish/cancel releases references once and restores only owned timing', () => {
  const h = host(), a = h.animation(), b = h.animation(), stop = startCssFramePacing(h.root);
  a.dispatchEvent(new Event('finish')); a.dispatchEvent(new Event('finish'));
  assert.equal(a.updates.length, 2); assert.equal(a.timing.easing, 'linear');
  b.effect.updateTiming({ easing: 'ease-in' }); b.dispatchEvent(new Event('cancel'));
  assert.equal(b.timing.easing, 'ease-in'); assert.equal(cssFramePacingStats().active, 0);
  stop(); assert.equal(a.updates.length, 2);
});

test('CSS, transition and late pseudo-element events register only once, including portal descendants', () => {
  const h = host(), stop = startCssFramePacing(h.root), a = h.animation();
  h.root.getAnimations = options => { assert.equal(options.subtree, true); return [a]; };
  h.root.dispatchEvent(new Event('animationstart')); h.root.dispatchEvent(new Event('transitionrun'));
  assert.equal(a.updates.length, 1); assert.equal(cssFramePacingStats().active, 1);
  stop(); assert.equal(a.timing.easing, 'linear');
});

test('explicit Web Animations and paused effects retain native playback ownership', () => {
  const h = host(), stop = startCssFramePacing(h.root), a = h.animation({ rate: -2 });
  a.playState = 'paused'; assert.equal(paceAnimation(a), a);
  assert.equal(a.playState, 'paused'); assert.equal(a.playbackRate, -2);
  assert.equal(a.timing.easing, 'steps(30, end)'); stop();
});

test('unavailable/invalid timing APIs retain native playback and do not strand content', () => {
  assert.doesNotThrow(() => startCssFramePacing({})());
  for (const duration of [0, Infinity, NaN]) {
    const h = host(), a = h.animation({ duration }), stop = startCssFramePacing(h.root);
    assert.equal(a.updates.length, 0); assert.equal(a.playbackRate, 1); assert.equal(cssFramePacingStats().fallbacks, 1); stop();
  }
  const h = host(), a = h.animation(); a.effect.updateTiming = () => { throw new Error('unsupported'); };
  const stop = startCssFramePacing(h.root); assert.equal(a.playbackRate, 1); assert.equal(cssFramePacingStats().active, 0); stop();
});

test('native pacing schedules no JavaScript frame, interval, visibility polling or visible time/rate writes', () => {
  const source = readFileSync(new URL('./cssFramePacing.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /request(?:Animation|Game)Frame|setInterval|setTimeout|visibilitychange|\.currentTime\s*=|\.playbackRate\s*=/);
});
