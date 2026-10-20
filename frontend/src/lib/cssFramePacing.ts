import { requestGameFrame, cancelGameFrame } from './frameScheduler.ts';

type ControlledAnimation = { rate: number; last: number };
let registerAnimation: ((animation: Animation) => void) | null = null;

// Element.animate() has no CSS animationstart event. Explicit callers register
// with the same clock; CSS animations/transitions are discovered by their events.
export function paceAnimation(animation: Animation) {
  registerAnimation?.(animation);
  return animation;
}

export function startCssFramePacing(root: HTMLElement) {
  if (typeof root.getAnimations !== 'function') return () => {};
  const doc = root.ownerDocument;
  const controlled = new Map<Animation, ControlledAnimation>();
  let frame = 0;
  let stopped = false;
  const release = (animation: Animation, state: ControlledAnimation) => {
    controlled.delete(animation);
    try { animation.playbackRate = state.rate; } catch { /* Already removed. */ }
  };
  const schedule = () => {
    if (!stopped && !doc.hidden && controlled.size && !frame) frame = requestGameFrame(tick);
  };
  const tick = (time: number) => {
    frame = 0;
    for (const [animation, state] of controlled) {
      try {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        if (!target?.isConnected || !root.contains(target) || animation.playState === 'idle' || animation.playState === 'finished') {
          release(animation, state);
          continue;
        }
        const elapsed = Math.max(0, time - state.last);
        state.last = time;
        // playbackRate=0 keeps CSS in control of animation-play-state. Using
        // pause() here would override the game's existing pause/resume rules.
        if (animation.playState === 'paused' || animation.pending || animation.currentTime === null) continue;
        const current = Number(animation.currentTime);
        const end = Number(animation.effect?.getComputedTiming().endTime);
        const next = current + elapsed * state.rate;
        if ((state.rate > 0 && Number.isFinite(end) && next >= end) || (state.rate < 0 && next <= 0)) {
          // Restore the authored rate before finish(): zero-rate finish throws.
          // Native finish/animationend/transitionend and fill modes stay native.
          release(animation, state);
          animation.finish();
        } else animation.currentTime = next;
      } catch {
        // Optional Web Animations support must never strand a visible element.
        release(animation, state);
      }
    }
    schedule();
  };
  const register = (animation: Animation) => {
    if (stopped || controlled.has(animation) || animation.playState === 'finished' || animation.playState === 'idle') return;
    const rate = animation.playbackRate;
    if (!Number.isFinite(rate) || rate === 0) return;
    try {
      const state = { rate, last: performance.now() };
      animation.playbackRate = 0;
      controlled.set(animation, state);
      schedule();
    } catch { /* Keep native playback on browsers without this capability. */ }
  };
  const discover = (event: Event) => {
    const target = event.target as Element | null;
    if (!target || typeof target.getAnimations !== 'function') return;
    // Pseudo-element animations are included only with subtree discovery.
    // Inspect just the event target, never the whole document on every frame.
    try { for (const animation of target.getAnimations({ subtree: true })) register(animation); }
    catch { /* A disappearing/unsupported target keeps native playback. */ }
  };
  const visibility = () => {
    if (frame) cancelGameFrame(frame);
    frame = 0;
    const now = performance.now();
    for (const state of controlled.values()) state.last = now;
    schedule();
  };
  root.addEventListener('animationstart', discover, true);
  root.addEventListener('transitionrun', discover, true);
  doc.addEventListener('visibilitychange', visibility);
  try { for (const animation of root.getAnimations({ subtree: true })) register(animation); }
  catch { /* Discovery is optional; future animation events can still register. */ }
  registerAnimation = register;
  return () => {
    stopped = true;
    if (registerAnimation === register) registerAnimation = null;
    if (frame) cancelGameFrame(frame);
    root.removeEventListener('animationstart', discover, true);
    root.removeEventListener('transitionrun', discover, true);
    doc.removeEventListener('visibilitychange', visibility);
    for (const [animation, state] of controlled) release(animation, state);
  };
}
