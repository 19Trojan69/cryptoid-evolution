export const ANIMATION_TARGET_HZ = 60;

// Quantize progress, not the animation clock. The browser retains ownership of
// pause, direction, delays, completion events, fill and the finished promise.
export function frameEasing(frames: number, easing: string, sample: (progress: number) => number | null) {
  if (!Number.isInteger(frames) || frames < 1) return null;
  if (easing === 'linear') return `steps(${frames}, end)`;
  if (frames > 4096) return null;
  const points: string[] = [];
  for (let i = 0; i < frames; i++) {
    const value = sample(i / frames);
    if (value === null || !Number.isFinite(value)) return null;
    points.push(`${value} ${i * 100 / frames}% ${(i + 1) * 100 / frames}%`);
  }
  const end = sample(1);
  if (end === null || !Number.isFinite(end)) return null;
  points.push(`${end} 100%`);
  return `linear(${points.join(',')})`;
}

// Bounded across route changes. Most CSS animations have linear effect timing;
// their authored ease-in/out remains in their keyframes and needs no sampling.
const curves = new Map<string, string>();

export function nativeFrameEasing(animation: Animation, view: Window) {
  const effect = animation.effect;
  if (!effect || typeof effect.getTiming !== 'function' || typeof effect.updateTiming !== 'function') return null;
  const original = effect.getTiming().easing ?? 'linear';
  const duration = Number(effect.getComputedTiming().duration);
  const rate = Math.abs(animation.playbackRate);
  if (!Number.isFinite(duration) || !Number.isFinite(rate) || rate === 0 || duration / rate < 1000 / ANIMATION_TARGET_HZ) return null;
  const frames = Math.max(1, Math.floor(duration / rate * ANIMATION_TARGET_HZ / 1000 + 1e-9));
  const key = `${frames}|${original}`;
  let paced = curves.get(key);
  if (!paced) {
    const api = view as Window & typeof globalThis;
    let probe: Animation | undefined;
    try {
      // The temporary probe has no element and no timeline. Sampling happens
      // once here; no visible animation is sought or slowed by JavaScript.
      if (original !== 'linear') probe = new api.Animation(new api.KeyframeEffect(null, [], { duration: 1, fill: 'both', easing: original }), null);
      paced = frameEasing(frames, original, progress => {
        if (!probe) return null;
        probe.currentTime = progress;
        return probe.effect?.getComputedTiming().progress ?? null;
      }) ?? undefined;
      if (!paced || !api.CSS?.supports('animation-timing-function', paced)) return null;
      if (curves.size >= 64) curves.delete(curves.keys().next().value!);
      curves.set(key, paced);
    } finally { probe?.cancel(); }
  }
  return { original, paced };
}
