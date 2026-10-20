export const FRAME_INTERVAL_MS = 1000 / 60;

type FrameHost = {
  request: (callback: FrameRequestCallback) => number;
  cancel: (id: number) => void;
  report: (error: unknown) => void;
};

// All application frame clients share one native RAF and one phase. Callbacks
// receive the real timestamp: skipping a display frame never slows the clock.
export function createFrameScheduler(host: FrameHost) {
  const callbacks = new Map<number, FrameRequestCallback>();
  let serial = 0;
  let nativeFrame: number | null = null;
  let deadline: number | null = null;
  let dispatching = false;
  const schedule = () => {
    if (!dispatching && nativeFrame === null && callbacks.size) nativeFrame = host.request(frame);
  };
  const frame = (time: number) => {
    nativeFrame = null;
    if (deadline !== null && time + 1 < deadline) { schedule(); return; }
    const previous = deadline ?? time;
    deadline = previous + (Math.floor(Math.max(0, time - previous) / FRAME_INTERVAL_MS) + 1) * FRAME_INTERVAL_MS;
    dispatching = true;
    try {
      // A callback requested from this batch belongs to the next tick. A client
      // may still cancel a later callback from the current batch.
      for (const id of [...callbacks.keys()]) {
        const callback = callbacks.get(id);
        if (!callback) continue;
        callbacks.delete(id);
        try { callback(time); } catch (error) { host.report(error); }
      }
    } finally { dispatching = false; schedule(); }
  };
  return {
    request(callback: FrameRequestCallback) {
      const id = ++serial;
      callbacks.set(id, callback);
      schedule();
      return id;
    },
    cancel(id: number) {
      callbacks.delete(id);
      if (!callbacks.size && nativeFrame !== null) {
        host.cancel(nativeFrame);
        nativeFrame = null;
      }
    },
  };
}

const frames = createFrameScheduler({
  request: callback => requestAnimationFrame(callback),
  cancel: id => cancelAnimationFrame(id),
  report: error => {
    if (typeof reportError === 'function') reportError(error);
    else setTimeout(() => { throw error; }, 0);
  },
});
export const requestGameFrame = frames.request;
export const cancelGameFrame = frames.cancel;
