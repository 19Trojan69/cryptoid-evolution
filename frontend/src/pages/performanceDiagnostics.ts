// The developer probe stays disabled in ordinary builds. A separately armed,
// server-verified owner capture can use these existing hooks for 90 seconds.
// Neither mode owns a game timer, RAF or input handler.
import type { BossResourceKind, BossResourceDetails } from './bossResourceDiagnostics';
export const PERFORMANCE_TRACE_KEY = "cryptoid_developer_trace_v1";
export const PERFORMANCE_SAMPLE_LIMIT = 90;
export type ProbeContext = {
  width?: number; height?: number;
  sector: number;
  flight: number;
  phase: string;
  encounter: string;
  status: string;
  enemies: number;
  attackers: number;
  returning: number;
  playerShots: number;
  enemyShots: number;
  effects: number;
  rocks: number;
  rockEffects: number;
  pickups: number;
  bossHealth?: number;
  liveTurrets?: number;
  bossHeartCollected?: boolean;
  clearMs?: number;
  hearts?: number;
};
type Work = { count: number; totalMs: number; maxMs: number };
type Runtime = {
  heapBytes?: number;
  animations?: number;
  particles?: number;
  domNodes?: number;
  painted?: number;
  estimatedBytes?: number;
  sources?: number;
  pending?: number;
  audioVoices?: number;
  audioBufferBytes?: number;
  knownTimers?: number;
  knownListeners?: number;
  longTasksSupported?: boolean;
  jobsStarted?: number; jobsFinished?: number; queueWaitMaxMs?: number;
  materialTotalMs?: number; materialMaxMs?: number; encodeTotalMs?: number; decodeTotalMs?: number;
  sourceWorkTotalMs?: number; sourceWorkMaxMs?: number;
  rockPaints?: number; rockPaintTotalMs?: number; rockPaintMaxMs?: number; blockchainRenders?: number;
  effectPaints?: number; effectPaintTotalMs?: number; effectPaintMaxMs?: number;
  bossPaints?: number; bossPaintTotalMs?: number; bossPaintMaxMs?: number;
};
export type Pacing = { frameGap: number; delta: number; slowFrames: number; paintInterval: number; requested: boolean; forced: boolean };
const emptyPacing = () => ({ frames: 0, wallMs: 0, simulatedMs: 0, discardedMs: 0, interval16: 0, interval32: 0, interval50: 0,
  decisionFrames: 0, slowFramesMax: 0, skippedRequests: 0, forcedRequests: 0 });
type Sample = ProbeContext &
  Runtime & {
    atMs: number;
    fps: number;
    frameP50Ms: number;
    frameP95Ms: number;
    frameMaxMs: number;
    simulationP95Ms: number;
    simulationMaxMs: number;
    frames: number;
    volleys: number;
    volleyGapP95Ms: number;
    capBlocked: number;
    longTasks: number;
    longTaskMaxMs: number;
    work: Record<string, Work>;
    sampleDurationMs: number;
    sceneRequests: number;
    sceneCommits: number;
    sceneCommitWaitP95Ms: number;
    sceneRenderToCommitP95Ms: number;
    runtimeAgeMs: number;
    runtimeSampleMs: number;
    pacing: ReturnType<typeof emptyPacing>;
  };
type Event = Partial<BossResourceDetails> & {
  atMs: number;
  kind: string;
  sector: number;
  flight: number;
  phase: string;
  encounter: string;
  status: string;
  durationMs?: number;
  file?: string;
  line?: number;
  column?: number;
  hearts?: number;
};
type Options = {
  now?: () => number;
  runtime?: () => Runtime;
  persist?: (serialized: string) => void;
  backup?: (trace: unknown) => void;
  environment?: 'developer-only' | 'owner-admin';
  publishGlobal?: boolean;
  maxDurationMs?: number;
  metadata?: Record<string, unknown>;
  onFinish?: (started: boolean) => void;
  onStart?: () => void;
};
const bounded = <T>(items: T[], item: T, limit: number) => {
  if (items.length >= limit) items.shift();
  items.push(item);
};
const percentile = (items: number[], p: number) => {
  if (!items.length) return 0;
  const sorted = items.slice().sort((a, b) => a - b);
  return Math.round(sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)] * 1000) / 1000;
};
// A URL/query flag alone cannot enable this in an ordinary release.
export const developerProbeEnabled = () =>
  import.meta.env?.VITE_CRYPTOID_DIAGNOSTICS === "1" &&
  (window as Window & { __cryptoidProbeOptOut?: boolean }).__cryptoidProbeOptOut !== true;
// Module-scoped lease, never enabled by a URL, local flag or ordinary player.
let ownerResourceUntil = 0;
export const retainOwnerResourceTiming = (until: number) => {
  ownerResourceUntil = until;
  return () => { if (ownerResourceUntil === until) ownerResourceUntil = 0; };
};
export const resourceTimingEnabled = () => developerProbeEnabled() ||
  ownerResourceUntil > 0 && performance.now() < ownerResourceUntil;

export function errorSite(error: unknown) {
  try {
    const stack = error instanceof Error ? error.stack : "";
    const match = stack?.match(/\/assets\/([\w.-]+\.m?js):(\d+):(\d+)/);
    return match ? { file: match[1], line: Number(match[2]), column: Number(match[3]) } : {};
  } catch {
    return {};
  }
}

export function createPerformanceProbe(options: Options = {}) {
  const now = options.now ?? (() => performance.now());
  const origin = now();
  const samples: Sample[] = [],
    events: Event[] = [];
  let context: ProbeContext | null = null;
  let gaps: number[] = [],
    workTimes: number[] = [],
    volleyGaps: number[] = [];
  let work: Record<string, Work> = {};
  let previousFrame = 0,
    windowStart = 0,
    frameStart = 0,
    markAt = 0;
  let phaseStart = origin,
    signature = "",
    lastVolley = 0,
    lastPersist = -Infinity;
  let frames = 0,
    volleys = 0,
    capBlocked = 0,
    longTasks = 0,
    longTaskMaxMs = 0;
  let finished = false;
  let sceneRequests = 0, sceneCommits = 0;
  let sceneCommitWaits: number[] = [], sceneRenderTimes: number[] = [];
  let pendingSceneAt: number | undefined;
  let cachedRuntime: Runtime = {}, runtimeAt = -Infinity, runtimeSampleMs = 0;
  let persistence = "not-yet-written";
  let captureStartedAt: number | undefined;
  let pacing = emptyPacing();
  const diagnosticWork = { completedWrites: 0, persistTotalMs: 0, persistMaxMs: 0 };
  const event = (kind: string, at: number, extra: Partial<Event> = {}) => {
    if (!context) return;
    bounded(
      events,
      {
        atMs: Math.round(at - origin),
        kind,
        sector: context.sector,
        flight: context.flight,
        phase: context.phase,
        encounter: context.encounter,
        status: context.status,
        hearts: context.hearts,
        ...extra,
      },
      64
    );
  };
  const exportTrace = () => ({
    version: 2,
    environment: options.environment ?? "developer-only",
    ...(options.metadata ? { metadata: options.metadata } : {}),
    finished,
    diagnosticWork: { ...diagnosticWork },
    persistence,
    samples: samples.slice(),
    events: events.slice(),
    coverage: {
      timers: "loop watchdog, game-over and reload-notice timers only",
      listeners: "five diagnostic lifecycle listeners only; total browser listeners unavailable",
      particles: "rendered fragment nodes; not a simulation particle system",
      heap: "JS heap only when supported; excludes GPU/WebView memory",
      cpu: "instrumented simulation sections; rendering and audio work may occur outside them",
      scene: "GamePage render start to layout effect and request-to-commit; includes reconciliation/scheduling, excludes browser paint/GPU",
      pacing: "Observed existing request thresholds and capped simulation delta; RAF callbacks and scene commits are not presented FPS",
      preparation: "Cumulative synchronous source/material work and asynchronous encode/decode elapsed waits; waits are not CPU time",
      diagnosticWork: "Completed persistence costs before this snapshot, including serialization/storage; the write of this snapshot is not included",
      longTasks: "zero counts are meaningful only when longTasksSupported is true",
      runtime: "DOM/animation/cache/audio counters sampled at most once per 2 seconds; runtimeAgeMs indicates age, runtimeSampleMs measures that diagnostic work",
      boss: "model/texture/first Canvas-call milestones; first draw means drawing routine returned, not GPU presentation",
      audio: "audioBufferBytes estimates retained effect PCM data; excludes streamed music and internal browser audio memory",
    },
  });
  const persist = (force = false) => {
    const time = now();
    if (!force && time - lastPersist < 10_000) return;
    if (force && options.environment === 'owner-admin' && !finished && time - lastPersist < 2_000) return;
    lastPersist = time;
    const trace = exportTrace();
    if (options.publishGlobal !== false && typeof window !== "undefined")
      (window as Window & { __cryptoidLatestTrace?: unknown }).__cryptoidLatestTrace = trace;
    try {
      if (options.persist) {
        persistence = "custom";
        options.persist(JSON.stringify(exportTrace()));
      } else {
        persistence = "localStorage";
        window["localStorage"].setItem(PERFORMANCE_TRACE_KEY, JSON.stringify(exportTrace()));
      }
    } catch {
      persistence = "sessionStorage";
      try {
        window["sessionStorage"].setItem(PERFORMANCE_TRACE_KEY, JSON.stringify(exportTrace()));
      } catch {
        persistence = "memory-only";
      }
    }
    if (options.publishGlobal !== false && typeof window !== "undefined")
      (window as Window & { __cryptoidLatestTrace?: unknown }).__cryptoidLatestTrace = exportTrace();
    try { options.backup?.(exportTrace()); } catch { /* Backup cannot interrupt play. */ }
    const elapsed = Math.max(0, now() - time);
    diagnosticWork.completedWrites++;
    diagnosticWork.persistTotalMs += elapsed;
    diagnosticWork.persistMaxMs = Math.max(diagnosticWork.persistMaxMs, elapsed);
  };
  const flush = (at: number) => {
    if (!context || !frames) return;
    if (at - runtimeAt >= 2_000) {
      const started = now();
      try { cachedRuntime = options.runtime?.() ?? {}; }
      catch { cachedRuntime = {}; } // Optional browser APIs.
      runtimeSampleMs = Math.max(0, now() - started);
      runtimeAt = at;
    }
    bounded(
      samples,
      {
        ...context,
        ...cachedRuntime,
        runtimeAgeMs: Math.max(0, Math.round(at - runtimeAt)), runtimeSampleMs,
        atMs: Math.round(at - origin),
        fps: gaps.length ? Math.round(((gaps.length * 1000) / Math.max(1, gaps.reduce((sum, gap) => sum + gap, 0))) * 100) / 100 : 0,
        sampleDurationMs: Math.max(0, Math.round(at - windowStart)),
        frameP50Ms: percentile(gaps, 0.5),
        frameP95Ms: percentile(gaps, 0.95),
        frameMaxMs: Math.max(0, ...gaps),
        simulationP95Ms: percentile(workTimes, 0.95),
        simulationMaxMs: Math.max(0, ...workTimes),
        frames,
        volleys,
        volleyGapP95Ms: percentile(volleyGaps, 0.95),
        capBlocked,
        longTasks,
        longTaskMaxMs,
        work,
        sceneRequests, sceneCommits,
        sceneCommitWaitP95Ms: percentile(sceneCommitWaits, 0.95),
        sceneRenderToCommitP95Ms: percentile(sceneRenderTimes, 0.95),
        pacing,
      },
      PERFORMANCE_SAMPLE_LIMIT
    );
    gaps = [];
    workTimes = [];
    volleyGaps = [];
    work = {};
    frames = volleys = capBlocked = longTasks = longTaskMaxMs = 0;
    sceneRequests = sceneCommits = 0;
    sceneCommitWaits = []; sceneRenderTimes = [];
    pacing = emptyPacing();
    windowStart = at;
    persist();
  };
  return {
    begin(at: number, next: ProbeContext) {
      if (finished) return;
      if (captureStartedAt !== undefined && options.maxDurationMs !== undefined && now() - captureStartedAt >= options.maxDurationMs) {
        this.finish(); return;
      }
      if (next.status !== "playing") {
        this.suspend(at);
        const changed = context?.status !== next.status;
        context = next;
        if (changed) { event("status-change", at); persist(true); }
        return;
      }
      if (captureStartedAt === undefined) { captureStartedAt = now(); options.onStart?.(); }
      if (context && context.status !== next.status) {
        context = next; event("status-change", at); persist(true);
      }
      const nextSignature = `${next.sector}:${next.flight}:${next.encounter}:${next.phase}`;
      if (signature !== nextSignature) {
        if (signature) {
          event("phase-complete", at, { durationMs: Math.round(at - phaseStart) });
          flush(at);
        }
        context = next;
        event("phase-start", at);
        signature = nextSignature;
        phaseStart = at;
        persist(next.encounter.startsWith('boss') || next.phase === 'SECTOR_CLEAR' && (next.sector + 1) % 10 === 0);
      }
      context = next;
      if (previousFrame) bounded(gaps, Math.max(0, at - previousFrame), 256);
      else windowStart = at;
      previousFrame = at;
      frameStart = markAt = now();
    },
    checkpoint(kind: BossResourceKind | 'boss-model-start' | 'boss-model-ready', details: Partial<ProbeContext> & Partial<BossResourceDetails> = {}) {
      if (finished) return;
      event(kind, now(), details);
      persist(true);
    },
    mark(label: string) {
      if (!frameStart || finished) return;
      const at = now(),
        elapsed = Math.max(0, at - markAt);
      const entry = (work[label] ??= { count: 0, totalMs: 0, maxMs: 0 });
      entry.count++;
      entry.totalMs += elapsed;
      entry.maxMs = Math.max(entry.maxMs, elapsed);
      markAt = at;
    },
    end(at: number) {
      if (!frameStart || finished) return;
      bounded(workTimes, Math.max(0, now() - frameStart), 256);
      frames++;
      frameStart = 0;
      if (at - windowStart >= 2_000) flush(at);
    },
    volley(at: number, blocked: boolean) {
      if (finished) return;
      if (blocked) {
        capBlocked++;
        return;
      }
      if (lastVolley) bounded(volleyGaps, Math.max(0, at - lastVolley), 256);
      lastVolley = at;
      volleys++;
    },
    longTask(duration: number) {
      if (!finished && Number.isFinite(duration)) {
        longTasks++;
        longTaskMaxMs = Math.max(longTaskMaxMs, duration);
      }
    },
    sceneRequested() {
      if (finished) return;
      sceneRequests++;
      pendingSceneAt ??= now();
    },
    sceneRenderBegin() { return finished ? undefined : now(); },
    simulationStep(frameGap: number, delta: number) {
      if (finished || !frameStart) return;
      pacing.frames++;
      pacing.wallMs += Math.max(0, frameGap);
      pacing.simulatedMs += Math.max(0, delta);
      pacing.discardedMs += Math.max(0, frameGap - delta);
    },
    pacing(value: Pacing) {
      if (finished || !frameStart) return;
      pacing.decisionFrames++;
      if (value.paintInterval === 16) pacing.interval16++;
      if (value.paintInterval === 32) pacing.interval32++;
      if (value.paintInterval === 50) pacing.interval50++;
      pacing.slowFramesMax = Math.max(pacing.slowFramesMax, value.slowFrames);
      if (!value.requested) pacing.skippedRequests++;
      if (value.requested && value.forced) pacing.forcedRequests++;
    },
    sceneCommitted(started: number | undefined) {
      if (finished || started === undefined) return;
      const at = now(); sceneCommits++;
      bounded(sceneRenderTimes, Math.max(0, at - started), 256);
      if (pendingSceneAt !== undefined) bounded(sceneCommitWaits, Math.max(0, at - pendingSceneAt), 256);
      pendingSceneAt = undefined;
    },
    hit(source: "boss-hull" | "enemy-hull" | "projectile") {
      if (finished) return;
      event("damage-" + source, now());
      persist(true);
    },
    lifecycle(
      kind:
        | "pagehide"
        | "pageshow"
        | "error"
        | "rejection"
        | "unmount"
        | "home-intent"
        | "saved-exit-intent"
        | "start-back-intent"
        | "frame-error"
        | "loop-stall"
        | "input-error"
        | "javascript-error"
        | "unhandled-rejection"
        | "render-error"
        | "boss-defeat-start"
        | "boss-defeat-complete"
        | "boss-final-blast"
        | "boss-victory-start",
      error?: unknown
    ) {
      if (finished) return;
      event(kind, now(), errorSite(error));
      persist(true);
    },
    suspend(at: number) {
      if (finished) return;
      flush(at);
      previousFrame = frameStart = lastVolley = 0;
      signature = "";
      pendingSceneAt = undefined;
    },
    finish() {
      if (finished) return;
      this.suspend(now());
      this.lifecycle("unmount");
      finished = true;
      persist(true);
      options.onFinish?.(captureStartedAt !== undefined);
    },
    export: exportTrace,
  };
}

export function browserProbeRuntime(): Runtime {
  const runtime: Runtime = {};
  try {
    runtime.heapBytes = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize;
  } catch {
    /* WebKit has no memory API. */
  }
  try {
    runtime.animations = document.getAnimations?.().filter(a => a.playState === "running").length;
  } catch {
    /* Older WebViews. */
  }
  try {
    runtime.particles = document.querySelectorAll(
      ".scattered-debris-piece, .boss-shedding i, .boss-fall-bursts i, .rock-effect i"
    ).length;
    runtime.domNodes = document.getElementsByTagName("*").length;
  } catch {
    /* Sampling needs no DOM in the simulation host. */
  }
  return runtime;
}
