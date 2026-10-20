import { ANIMATION_TARGET_HZ, nativeFrameEasing } from './nativeFrameEasing.ts';

type ControlledAnimation = { original: string; paced: string; done: EventListener };
let registerAnimation: ((animation: Animation) => void) | null = null;
let readStats = () => ({ mode: 'native-unavailable', targetHz: ANIMATION_TARGET_HZ, active: 0, configured: 0, fallbacks: 0, jsFrameWrites: 0 });

export function cssFramePacingStats() { return readStats(); }

// Element.animate() has no CSS animationstart event. Explicit callers register
// once; CSS animations/transitions are discovered by their native events.
export function paceAnimation(animation: Animation) {
  registerAnimation?.(animation);
  return animation;
}

export function startCssFramePacing(root: HTMLElement) {
  const view = root.ownerDocument?.defaultView;
  if (typeof root.getAnimations !== 'function' || !view) return () => {};
  const controlled = new Map<Animation, ControlledAnimation>();
  let stopped = false;
  let configured = 0;
  let fallbacks = 0;
  const stats = () => ({ mode: stopped ? 'native-stopped' : 'native-easing', targetHz: ANIMATION_TARGET_HZ, active: controlled.size, configured, fallbacks, jsFrameWrites: 0 });
  const release = (animation: Animation, state: ControlledAnimation) => {
    controlled.delete(animation);
    animation.removeEventListener('finish', state.done);
    animation.removeEventListener('cancel', state.done);
    try {
      if (animation.effect?.getTiming().easing === state.paced) animation.effect.updateTiming({ easing: state.original });
    } catch { /* An already removed effect needs no restoration. */ }
  };
  const register = (animation: Animation) => {
    if (stopped || controlled.has(animation) || animation.playState === 'finished' || animation.playState === 'idle') return;
    try {
      const target = (animation.effect as KeyframeEffect | null)?.target;
      if (!target?.isConnected || !root.contains(target)) return;
      const curve = nativeFrameEasing(animation, view);
      if (!curve) { fallbacks++; return; }
      const state: ControlledAnimation = { ...curve, done: () => release(animation, state) };
      animation.effect!.updateTiming({ easing: state.paced });
      // Browsers serialize equivalent easing syntax differently (steps(n,end)
      // becomes steps(n)). Compare against the installed canonical value later.
      state.paced = animation.effect!.getTiming().easing ?? state.paced;
      controlled.set(animation, state);
      animation.addEventListener('finish', state.done);
      animation.addEventListener('cancel', state.done);
      configured++;
    } catch { fallbacks++; /* Keep native playback if optional timing APIs fail. */ }
  };
  const discover = (event: Event) => {
    const target = event.target as Element | null;
    if (!target || typeof target.getAnimations !== 'function') return;
    // Pseudo-element animations are included only with subtree discovery.
    // Inspect just the event target, never the whole document on every frame.
    try { for (const animation of target.getAnimations({ subtree: true })) register(animation); }
    catch { /* A disappearing/unsupported target keeps native playback. */ }
  };
  root.addEventListener('animationstart', discover, true);
  root.addEventListener('transitionrun', discover, true);
  try { for (const animation of root.getAnimations({ subtree: true })) register(animation); }
  catch { /* Discovery is optional; future animation events can still register. */ }
  registerAnimation = register;
  readStats = stats;
  return () => {
    stopped = true;
    if (registerAnimation === register) registerAnimation = null;
    root.removeEventListener('animationstart', discover, true);
    root.removeEventListener('transitionrun', discover, true);
    for (const [animation, state] of controlled) release(animation, state);
  };
}
