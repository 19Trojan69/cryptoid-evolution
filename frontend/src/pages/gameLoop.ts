export type GameInterruption = 'frame-error' | 'loop-stall' | 'input-error' | 'javascript-error' | 'unhandled-rejection' | 'render-error' | 'save-pressure';
type LoopOptions = {
  step: (time: number) => void;
  fault: (reason: GameInterruption, error?: unknown) => void;
  active: () => boolean;
  visible: () => boolean;
  now: () => number;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
  watch: (callback: () => void) => number;
  unwatch: (id: number) => void;
};
export const GAME_STALL_MS = 2_500;

// The scheduler owns exactly one RAF. Early returns and thrown simulation
// errors cannot silently abandon it; canceled callbacks cannot fork the loop.
export function startGuardedGameLoop(options: LoopOptions) {
  let running = true;
  let pending: number | null = null;
  let generation = 0;
  let heartbeat = options.now();
  let faulted = false;
  const signal = (reason: GameInterruption, error?: unknown) => {
    if (faulted) return;
    faulted = true;
    try { options.fault(reason, error); } catch { /* Keep the scheduler alive even if reporting fails. */ }
  };
  const schedule = () => {
    if (!running || pending !== null) return;
    const token = ++generation;
    pending = options.requestFrame(time => {
      if (!running || token !== generation) return;
      pending = null;
      const now = options.now();
      if (options.active() && options.visible() && now - heartbeat > GAME_STALL_MS) signal('loop-stall');
      heartbeat = now;
      try { options.step(time); faulted = false; }
      catch (error) { signal('frame-error', error); }
      finally { schedule(); }
    });
  };
  const watcher = options.watch(() => {
    if (!running) return;
    if (!options.active() || !options.visible()) { heartbeat = options.now(); return; }
    if (options.now() - heartbeat <= GAME_STALL_MS) return;
    signal('loop-stall');
    heartbeat = options.now();
    if (pending !== null) options.cancelFrame(pending);
    pending = null;
    generation++;
    schedule();
  });
  schedule();
  return () => {
    running = false;
    generation++;
    if (pending !== null) options.cancelFrame(pending);
    pending = null;
    options.unwatch(watcher);
  };
}
