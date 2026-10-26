import { simulationFrame } from '../../frontend/src/pages/simulationFrame.ts';
import { GAME_STALL_MS } from '../../frontend/src/pages/gameLoop.ts';

export type SessionStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'disposed';
export type PauseReason = 'user' | 'hidden' | 'loop-stall' | 'invalid-clock' | 'simulation-error' | 'event-overflow' | 'renderer-lost' | 'adapter-error';
export type CoreEvent = { type: 'hud' | 'sound' | 'checkpoint' | 'phase'; key: string; value?: number | string | boolean };
export type StepResult<State> = { state: State; events?: readonly CoreEvent[] };
export type Simulation<State, Input> = (state: Readonly<State>, input: Readonly<Input>, deltaMs: number, atMs: number) => StepResult<State>;
export type LoadingTicket = Readonly<{ runId: string; generation: number }>;

/** Owns one run and one clock lease. No browser, React, routes, audio or storage. */
export class CoreSession<State, Input> {
  private readonly runId: string;
  private readonly simulate: Simulation<State, Input>;
  private readonly maxEvents: number;
  private model: State;
  private status: SessionStatus = 'loading';
  private pausedBy: PauseReason | null = null;
  private elapsedMs = 0;
  private revision = 0;
  private generation = 1;
  private clock: symbol | null = null;
  private events: CoreEvent[] = [];

  constructor(runId: string, initial: State, simulate: Simulation<State, Input>, maxEvents = 256) {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(runId)) throw new TypeError('Invalid local run identity');
    if (!Number.isInteger(maxEvents) || maxEvents < 1) throw new RangeError('Invalid event budget');
    this.runId = runId; this.model = structuredClone(initial); this.simulate = simulate; this.maxEvents = maxEvents;
  }

  loadingTicket(): LoadingTicket { return Object.freeze({ runId: this.runId, generation: this.generation }); }
  get lifecycle(): SessionStatus { return this.status; }
  retryLoading(): LoadingTicket {
    if (this.status !== 'loading') throw new Error('Loading retry outside loading');
    this.generation++; return this.loadingTicket();
  }
  loaded(ticket: LoadingTicket): boolean {
    if (this.status !== 'loading' || ticket.runId !== this.runId || ticket.generation !== this.generation) return false;
    this.status = 'ready'; return true;
  }
  start(): boolean {
    if (this.status !== 'ready') return false;
    this.status = 'playing'; return true;
  }
  pause(reason: PauseReason): boolean {
    if (this.status !== 'playing') return false;
    this.status = 'paused'; this.pausedBy = reason; return true;
  }
  resume(): boolean {
    if (this.status !== 'paused' || this.pausedBy === 'event-overflow' && this.events.length >= this.maxEvents) return false;
    this.status = 'playing'; this.pausedBy = null; return true;
  }
  end(): void {
    if (this.status === 'disposed') return;
    this.status = 'ended'; this.generation++; this.clock = null;
  }
  dispose(): void {
    if (this.status === 'disposed') return;
    this.status = 'disposed'; this.generation++; this.clock = null; this.events = [];
  }
  snapshot() {
    return { runId: this.runId, status: this.status, pausedBy: this.pausedBy, elapsedMs: this.elapsedMs,
      revision: this.revision, pendingEvents: this.events.length, state: structuredClone(this.model) };
  }
  drainEvents(): readonly CoreEvent[] { const events = this.events; this.events = []; return events; }
  present(renderer: (state: Readonly<State>, atMs: number) => void): boolean {
    if (this.status === 'disposed') return false;
    try { renderer(this.model, this.elapsedMs); return true; }
    catch { this.pause('renderer-lost'); return false; }
  }
  acquireClock() {
    if (this.clock || this.status === 'disposed' || this.status === 'ended') throw new Error('Clock already owned or session closed');
    const token = Symbol('clock'); this.clock = token;
    return {
      tick: (gapMs: number, input: Readonly<Input>, visible = true) => {
        if (this.clock !== token || this.status !== 'playing') return 0;
        if (!visible) { this.pause('hidden'); return 0; }
        if (!Number.isFinite(gapMs) || gapMs < 0) { this.pause('invalid-clock'); return 0; }
        if (gapMs > GAME_STALL_MS) { this.pause('loop-stall'); return 0; }
        const plan = simulationFrame(gapMs, true);
        let completed = 0;
        for (let step = 0; step < plan.steps; step++) {
          try {
            const next = this.simulate(this.model, input, plan.stepMs, this.elapsedMs + plan.stepMs);
            const events = next.events ?? [];
            if (this.events.length + events.length > this.maxEvents || events.some(event => !validEvent(event))) {
              this.pause('event-overflow'); break;
            }
            this.model = next.state; this.elapsedMs += plan.stepMs; this.revision++;
            this.events.push(...events.map(event => ({ ...event }))); completed++;
          } catch { this.pause('simulation-error'); break; }
        }
        return completed;
      },
      release: () => { if (this.clock === token) this.clock = null; },
    };
  }
}

function validEvent(event: CoreEvent): boolean {
  return ['hud','sound','checkpoint','phase'].includes(event.type) && typeof event.key === 'string' && event.key.length <= 80
    && (event.value === undefined || typeof event.value === 'boolean' || typeof event.value === 'number' && Number.isFinite(event.value)
      || typeof event.value === 'string' && event.value.length <= 160);
}
