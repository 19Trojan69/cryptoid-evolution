import { startGuardedGameLoop } from '../../frontend/src/pages/gameLoop.ts';
import type { CoreSession, CoreEvent, SessionStatus } from './session.ts';

export type FramePorts<State, Input> = {
  now: () => number;
  visible: () => boolean;
  input: () => Readonly<Input>;
  render: (state: Readonly<State>, atMs: number) => void;
  events: (events: readonly CoreEvent[]) => void;
  lifecycle: (status: SessionStatus) => void;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
  watch: (callback: () => void, intervalMs: number) => number;
  unwatch: (id: number) => void;
};

/** The only scheduler. Rendering and input faults cannot abandon the loop or
 * navigate away. Resume resets the measured interval, never the run itself. */
export function createFrameDriver<State, Input>(session: CoreSession<State, Input>, ports: FramePorts<State, Input>) {
  const clock = session.acquireClock();
  let closed = false, dirty = true, rendererBlocked = false, wasPlaying = false;
  let previousTime: number | null = null, previousStatus: SessionStatus | null = null;
  const announce = () => {
    if (previousStatus === session.lifecycle) return;
    previousStatus = session.lifecycle;
    try { ports.lifecycle(previousStatus); } catch { session.pause('adapter-error'); }
  };
  const stop = startGuardedGameLoop({
    active: () => session.lifecycle === 'playing', visible: ports.visible, now: ports.now,
    requestFrame: ports.requestFrame, cancelFrame: ports.cancelFrame,
    watch: callback => ports.watch(callback, 500), unwatch: ports.unwatch,
    fault: reason => { session.pause(reason === 'loop-stall' ? 'loop-stall' : 'adapter-error'); announce(); },
    step: time => {
      const playing = session.lifecycle === 'playing';
      const gap = playing && wasPlaying && previousTime !== null ? time - previousTime : 0;
      previousTime = time; wasPlaying = playing;
      let steps = 0;
      try { steps = clock.tick(gap, ports.input(), ports.visible()); }
      catch { session.pause('adapter-error'); }
      if (!rendererBlocked && (steps > 0 || dirty)) {
        rendererBlocked = !session.present(ports.render); dirty = false;
      }
      try { ports.events(session.drainEvents()); }
      catch { session.pause('adapter-error'); }
      announce();
    },
  });
  return {
    invalidate: () => { dirty = true; },
    pause: () => { const changed = session.pause('user'); previousTime = null; wasPlaying = false; announce(); return changed; },
    resume: () => {
      if (closed || !ports.visible()) return false;
      const changed = session.resume();
      if (changed) { previousTime = null; wasPlaying = false; dirty = true; rendererBlocked = false; announce(); }
      return changed;
    },
    hide: () => { session.pause('hidden'); previousTime = null; wasPlaying = false; announce(); },
    dispose: () => {
      if (closed) return; closed = true; stop(); clock.release(); session.dispose(); announce();
    },
  };
}
