import test from 'node:test';
import assert from 'node:assert/strict';
import { startCssFramePacing, paceAnimation } from './cssFramePacing.ts';

// Controlled Web Animations host, not native browser event/compositor proof.
let now = 100, serial = 0;
const frames = new Map();
globalThis.requestAnimationFrame = callback => {frames.set(++serial, callback); return serial;};
globalThis.cancelAnimationFrame = id => frames.delete(id);
globalThis.performance = {now: () => now};
const tick = (ms = 1000 / 60) => {
  now += ms;
  for (const [id, callback] of [...frames]) {frames.delete(id); callback(now);}
  assert.ok(frames.size <= 1);
};
function host() {
  now += 1000;
  const doc = new EventTarget(); doc.hidden = false;
  const root = new EventTarget(); root.ownerDocument = doc; root.contains = target => target.isConnected;
  const animations = [];
  root.getAnimations = () => animations;
  const animation = ({duration = Infinity, rate = 1, current = 0} = {}) => {
    const target = {isConnected: true};
    const a = {currentTime: current, playbackRate: rate, pending: false, playState: 'running', effect: {target, getComputedTiming: () => ({endTime: duration})}, ends: 0,
      finish() {assert.notEqual(this.playbackRate, 0); this.currentTime = this.playbackRate > 0 ? duration : 0; this.playState = 'finished'; this.ends++;}};
    animations.push(a); return a;
  };
  return {root, doc, animations, animation};
}
test('CSS/SVG keeps real time and original effect timing', () => {
  const h = host(), a = h.animation(), effect = a.effect, stop = startCssFramePacing(h.root);
  assert.equal(a.playbackRate, 0); const start = now;
  for (let i = 0; i < 120; i++) tick(1000 / 120);
  assert.ok(Math.abs(a.currentTime - (now - start)) < 9); assert.equal(a.effect, effect);
  stop(); assert.equal(a.playbackRate, 1); assert.equal(frames.size, 0);
});
test('CSS pause/resume does not accumulate paused time', () => {
  const h = host(), a = h.animation(), stop = startCssFramePacing(h.root);
  tick(); a.playState = 'paused'; const before = a.currentTime;
  for (let i = 0; i < 60; i++) tick(); assert.equal(a.currentTime, before);
  a.playState = 'running'; tick(); assert.ok(a.currentTime - before < 18); stop();
});
test('finite forward/reverse effects finish once at the original boundary', () => {
  const h = host(), a = h.animation({duration:250}), b = h.animation({duration:250,rate:-1,current:250}), stop = startCssFramePacing(h.root);
  for (let i = 0; i < 25; i++) tick();
  assert.equal(a.ends,1); assert.equal(b.ends,1); assert.equal(a.currentTime,250); assert.equal(b.currentTime,0);
  assert.equal(a.playbackRate,1); assert.equal(b.playbackRate,-1); assert.equal(frames.size,0); stop();
});
test('CSS and transition events discover new effects and portal descendants', () => {
  const h = host(), stop = startCssFramePacing(h.root);
  const css = h.animation(); h.root.dispatchEvent(new Event('animationstart')); assert.equal(css.playbackRate,0);
  const transition = h.animation({duration:180}); h.root.dispatchEvent(new Event('transitionrun')); assert.equal(transition.playbackRate,0);
  tick(); assert.ok(css.currentTime>0); assert.ok(transition.currentTime>0); stop();
});
test('explicit Web Animations share the clock and retain authored playback rates', () => {
  const h = host(), stop = startCssFramePacing(h.root), a = h.animation({rate:2});
  assert.equal(paceAnimation(a),a); assert.equal(a.playbackRate,0); tick(); assert.ok(a.currentTime>30&&a.currentTime<35);
  stop(); assert.equal(a.playbackRate,2);
});
test('animation events discover pseudo-elements added after startup', () => {
  const h = host(), stop = startCssFramePacing(h.root), pseudo = h.animation();
  h.root.getAnimations = options => options?.subtree ? [pseudo] : [];
  h.root.dispatchEvent(new Event('animationstart'));
  assert.equal(pseudo.playbackRate, 0); tick(); assert.ok(pseudo.currentTime > 0);
  stop(); assert.equal(pseudo.playbackRate, 1);
});
test('hidden document stops work and resumes without replaying hidden time', () => {
  const h = host(), a = h.animation(), stop = startCssFramePacing(h.root);
  tick(); const before=a.currentTime; h.doc.hidden=true; h.doc.dispatchEvent(new Event('visibilitychange')); assert.equal(frames.size,0);
  now+=10000; h.doc.hidden=false; h.doc.dispatchEvent(new Event('visibilitychange')); tick(); assert.ok(a.currentTime-before<18); stop();
});
test('removed/canceled effects release references and stop the idle scheduler', () => {
  const h = host(), a=h.animation(), b=h.animation(), stop=startCssFramePacing(h.root);
  a.effect.target.isConnected=false; b.playState='idle'; tick(); assert.equal(a.playbackRate,1); assert.equal(b.playbackRate,1); assert.equal(frames.size,0); stop();
});
test('unsupported/failed animation APIs preserve native playback instead of freezing content', () => {
  assert.doesNotThrow(()=>startCssFramePacing({getAnimations:undefined})());
  const h=host(), a=h.animation(), stop=startCssFramePacing(h.root); a.effect.getComputedTiming=()=>{throw new Error('removed');}; tick();
  assert.equal(a.playbackRate,1); assert.equal(frames.size,0); stop();
});
