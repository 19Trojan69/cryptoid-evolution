// Observe the actual rendering clock, not just AudioContext.state. Some hosts
// report "running" after interruption while currentTime never advances.
// Called by existing playback attempts only: no timer, RAF or listener.
export class AudioClockRecovery {
  private context: AudioContext | null = null;
  private clock = 0;
  private lastAt = 0;
  private unchangedSince = 0;
  private observed = false;
  private stalled = false;
  private attempted = false;
  private resumeRequested = false;
  private pending: Promise<boolean> | null = null;
  private generation = 0;
  stalls = 0;
  recoveries = 0;

  observe(context: AudioContext) {
    const now = performance.now(), clock = context.currentTime;
    if (this.context !== context) {
      this.reset(); this.context = context;
    }
    const visible = typeof document === 'undefined' || document.visibilityState !== 'hidden';
    if (!Number.isFinite(clock) || !visible || context.state !== 'running') {
      this.observed = false;
      return !this.stalled && !this.pending;
    }
    if (this.observed && clock > this.clock) {
      this.stalled = false; this.attempted = false; this.unchangedSince = now;
      // Native rendering progress proves recovery even if an old host promise
      // never settles. No later native operation is chained to that promise.
      this.pending = null;
    } else if (!this.observed || now - this.lastAt > 1000 || clock < this.clock) {
      // A pause/background gap is not evidence of a frozen foreground clock.
      this.unchangedSince = now;
    } else if (!this.stalled && now - this.unchangedSince >= 2000) {
      this.stalled = true; this.stalls++;
    }
    this.observed = true; this.clock = clock; this.lastAt = now;
    return !this.stalled && !this.pending;
  }

  resume(context: AudioContext, restartPausedGraph = false): Promise<boolean> {
    this.observe(context);
    if (this.pending) return this.pending;
    // A fresh/never-rendered graph needs its native resume in the actual click,
    // even if the host already claims running. Suspending it first can consume
    // that click and leave its rendering clock at zero throughout the mission.
    const restart = restartPausedGraph && context.state === 'running' && context.currentTime > 0;
    if (!this.stalled && !restart) {
      if (context.state === 'running' && this.resumeRequested && !restartPausedGraph) return Promise.resolve(true);
      this.resumeRequested = true;
      return context.resume().then(() => context.state === 'running');
    }
    if ((this.stalled && this.attempted) || typeof context.suspend !== 'function') return Promise.resolve(false);
    this.attempted = true;
    this.recoveries++;
    const generation = this.generation;
    // Resume on the same unlocked graph. One attempt per frozen-clock episode;
    // a pending/rejected host cannot trigger a growing chain of recovery work.
    try {
      // Queue both native operations now, in order. Waiting for suspend's
      // promise would move resume outside the Resume gesture (or skip it
      // entirely when the native suspend promise never settles).
      const suspension = context.suspend();
      this.resumeRequested = true;
      let resumption: Promise<void>;
      try { resumption = context.resume(); }
      catch (error) { resumption = Promise.reject(error); }
      const pending = Promise.all([suspension, resumption]).then(() =>
        generation === this.generation && context.state === 'running'
      ).catch(() => false).finally(() => {
        if (generation === this.generation && this.pending === pending) this.pending = null;
      });
      this.pending = pending;
      return pending;
    } catch { return Promise.resolve(false); }
  }

  // Do not clear a known stall just because a menu paused playback.
  pause() { this.observed = false; }
  get blocked() { return this.stalled || this.pending !== null; }
  reset() {
    this.generation++; this.context = null; this.observed = false;
    this.stalled = false; this.attempted = false; this.pending = null; this.resumeRequested = false;
  }
}
