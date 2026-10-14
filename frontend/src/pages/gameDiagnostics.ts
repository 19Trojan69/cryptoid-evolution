import type { GameInterruption } from './gameLoop.ts';

export const GAME_DIAGNOSTICS_KEY = 'cryptoid_game_diagnostics_v1';
export type Diagnostic = {
  reason: GameInterruption | 'performance' | 'unexpected-restart' | 'shooting-sample'; errorName: string; sector: number; phase: string;
  encounter: string; status: string; width: number; height: number; browser: string;
  block?: number; enemies?: number; projectiles?: number; effects?: number;
  frameMs?: number; workMs?: number; performanceLevel?: number; lastSavedAt?: number;
  restartHint?: 'foreground-interrupted' | 'background-interrupted' | 'page-reload';
  build?: string; shooting?: CombatSample;
};

export function isCombatProbeEnabled() {
  try { return (window as unknown as { __ENV?: { combatProbe?: boolean } }).__ENV?.combatProbe === true; }
  catch { return false; }
}

export type PaintProbeStats = {
  painted: number; estimatedBytes: number; sources: number; pending: number;
  jobsStarted?: number; jobsFinished?: number; queueWaitMaxMs?: number;
  materialTotalMs?: number; materialMaxMs?: number; encodeTotalMs?: number; decodeTotalMs?: number;
  sourceWorkTotalMs?: number; sourceWorkMaxMs?: number;
};
export type CombatSample = {
  durationMs: number; frames: number; frameMeanMs: number; frameMaxMs: number;
  slowFrames: number; simulationMs: number; discardedMs: number; stepWorkMaxMs: number;
  attempts: number; volleys: number; emittedProjectiles: number; capBlocks: number;
  expectedIntervalMs: number; intervalChanges: number; gapCount: number; gapMeanMs: number;
  gapMaxMs: number; recentGapsMs: number[]; sceneCommits: number; commitGapMaxMs: number;
  ownShotsPeak: number; hostileShotsPeak: number; effectsPeak: number; enemiesPeak: number;
  resourceAtWorstFrame: PaintProbeStats | null; resources: PaintProbeStats;
  diagnosticWritePreviousMs: number;
};

const safeNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
  ? Math.round(Math.max(0, Math.min(1e15, value)) * 100) / 100 : 0;
const safeResources = (stats: PaintProbeStats): PaintProbeStats => ({
  painted: safeNumber(stats.painted), estimatedBytes: safeNumber(stats.estimatedBytes),
  sources: safeNumber(stats.sources), pending: safeNumber(stats.pending),
  jobsStarted: safeNumber(stats.jobsStarted), jobsFinished: safeNumber(stats.jobsFinished),
  queueWaitMaxMs: safeNumber(stats.queueWaitMaxMs), materialTotalMs: safeNumber(stats.materialTotalMs),
  materialMaxMs: safeNumber(stats.materialMaxMs), encodeTotalMs: safeNumber(stats.encodeTotalMs),
  decodeTotalMs: safeNumber(stats.decodeTotalMs),
  sourceWorkTotalMs: safeNumber(stats.sourceWorkTotalMs), sourceWorkMaxMs: safeNumber(stats.sourceWorkMaxMs),
});

// Reuse the existing 20-record local diagnostic ring. No per-frame storage,
// object history, account data, new scheduler or network transmission.
export function createCombatProbe(options: {
  context: () => Diagnostic; resources: () => PaintProbeStats;
  report?: (entry: Diagnostic) => unknown; now?: () => number;
}) {
  const report = options.report ?? recordGameDiagnostic;
  const now = options.now ?? (() => performance.now());
  let start = 0, frames = 0, totalFrame = 0, maxFrame = 0, slow = 0, simulated = 0, discarded = 0, work = 0;
  let attempts = 0, volleys = 0, emitted = 0, blocks = 0, interval = 0, changes = 0;
  let gaps = 0, gapTotal = 0, gapMax = 0, recent: number[] = [], lastShot: number | null = null;
  let commits = 0, commitMax = 0, lastCommit: number | null = null, active = false;
  let ownPeak = 0, hostilePeak = 0, effectsPeak = 0, enemiesPeak = 0;
  let worst: PaintProbeStats | null = null, previousWriteMs = 0;
  const resources = () => { try { return safeResources(options.resources()); } catch { return safeResources({ painted: 0, estimatedBytes: 0, sources: 0, pending: 0 }); } };
  const flush = (time: number) => {
    if (!frames) { start = time; return; }
    try {
      const context = options.context();
      const sample: CombatSample = {
        durationMs: safeNumber(time - start), frames, frameMeanMs: safeNumber(totalFrame / frames),
        frameMaxMs: safeNumber(maxFrame), slowFrames: slow, simulationMs: safeNumber(simulated),
        discardedMs: safeNumber(discarded), stepWorkMaxMs: safeNumber(work), attempts, volleys,
        emittedProjectiles: emitted, capBlocks: blocks, expectedIntervalMs: safeNumber(interval),
        intervalChanges: changes, gapCount: gaps, gapMeanMs: gaps ? safeNumber(gapTotal / gaps) : 0,
        gapMaxMs: safeNumber(gapMax), recentGapsMs: [...recent], sceneCommits: commits,
        commitGapMaxMs: safeNumber(commitMax), ownShotsPeak: ownPeak, hostileShotsPeak: hostilePeak,
        effectsPeak, enemiesPeak, resourceAtWorstFrame: worst, resources: resources(),
        diagnosticWritePreviousMs: safeNumber(previousWriteMs),
      };
      const before = now();
      report({ reason: 'shooting-sample', errorName: '', sector: safeNumber(context.sector),
        block: safeNumber(context.block), phase: context.phase, encounter: context.encounter,
        status: context.status, width: safeNumber(context.width), height: safeNumber(context.height),
        browser: context.browser, build: (context.build ?? '').slice(0, 120),
        lastSavedAt: safeNumber(context.lastSavedAt), shooting: sample });
      previousWriteMs = Math.max(0, now() - before);
    } catch { /* Optional diagnostics must never interrupt combat or saving. */ }
    start = time; frames = totalFrame = maxFrame = slow = simulated = discarded = work = 0;
    attempts = volleys = emitted = blocks = changes = gaps = gapTotal = gapMax = commits = commitMax = 0;
    ownPeak = hostilePeak = effectsPeak = enemiesPeak = 0; recent = []; worst = null;
  };
  return {
    attempt(expectedInterval: number, atCap: boolean) { attempts++; if (atCap) blocks++; if (interval && interval !== expectedInterval) { changes++; lastShot = null; } interval = expectedInterval; },
    shot(time: number, count: number) {
      volleys++; emitted += count;
      if (lastShot !== null) { const gap = Math.max(0, time - lastShot); gaps++; gapTotal += gap; gapMax = Math.max(gapMax, gap); recent.push(safeNumber(gap)); if (recent.length > 12) recent.shift(); }
      lastShot = time;
    },
    frame(time: number, rawMs: number, deltaMs: number, stepWorkMs: number, playing: boolean,
      eligible: boolean, ownShots: number, hostileShots: number, effects: number, enemies: number) {
      if (!playing) { this.suspend(time); return; }
      if (!active) { active = true; start = time; lastShot = lastCommit = null; }
      if (!eligible) lastShot = null;
      frames++; totalFrame += rawMs; simulated += deltaMs; discarded += Math.max(0, rawMs - deltaMs);
      if (rawMs > 34) slow++;
      if (rawMs > maxFrame) { maxFrame = rawMs; worst = resources(); }
      work = Math.max(work, stepWorkMs); ownPeak = Math.max(ownPeak, ownShots);
      hostilePeak = Math.max(hostilePeak, hostileShots); effectsPeak = Math.max(effectsPeak, effects); enemiesPeak = Math.max(enemiesPeak, enemies);
      if (time - start >= 10_000) flush(time);
    },
    render(time: number) { if (!active) return; commits++; if (lastCommit !== null) commitMax = Math.max(commitMax, time - lastCommit); lastCommit = time; },
    suspend(time: number) { flush(time); active = false; lastShot = lastCommit = null; },
    finish(time: number) { this.suspend(time); },
  };
}
// Local bounded technical records only: no account identifiers, raw exception
// text, credentials or automatic network transmission.
export function recordGameDiagnostic(diagnostic: Diagnostic, storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const entry = { ...diagnostic, phase: diagnostic.phase.slice(0, 40), encounter: diagnostic.encounter.slice(0, 40), status: diagnostic.status.slice(0, 30), browser: diagnostic.browser.slice(0, 240), errorName: diagnostic.errorName.slice(0, 60), at: new Date().toISOString() };
  try {
    const target = storage ?? window.localStorage;
    let previous: unknown;
    try { previous = JSON.parse(target.getItem(GAME_DIAGNOSTICS_KEY) ?? '[]'); } catch { previous = []; }
    target.setItem(GAME_DIAGNOSTICS_KEY, JSON.stringify([...(Array.isArray(previous) ? previous.slice(-19) : []), entry]));
  } catch { /* Diagnostics must never interrupt play or recovery. */ }
  return entry;
}

const SESSION_KEY = 'cryptoid_game_session_v1';
type SessionMarker = { context: Diagnostic; active: boolean; hidden: boolean; pageHidden: boolean; at: number };

// The marker is per-tab session storage, avoiding false crashes from another
// open game tab. OS kills cannot be identified conclusively; absence of a
// pagehide callback is only a hint. No account, exception message or stack is saved.
export function createGameSessionDiagnostics(storage?: Pick<Storage, 'getItem' | 'setItem'>,
  report: (entry: Diagnostic) => unknown = recordGameDiagnostic, now = Date.now, navigationType = '') {
  // Web Storage access itself may throw in an embedded/private browser.
  // Keep optional diagnostics from failing the owner of the combat state.
  let target = storage;
  if (!target) { try { target = window.sessionStorage; } catch { /* Optional. */ } }
  let lastWrite = 0;
  let context: Diagnostic | null = null;
  let pageHidden = false;
  try {
    const previous = JSON.parse(target?.getItem(SESSION_KEY) ?? 'null') as SessionMarker | null;
    if (previous?.active && previous.context && now() - previous.at < 24 * 60 * 60 * 1000) {
      report({ ...previous.context, reason: 'unexpected-restart', errorName: '',
        restartHint: navigationType === 'reload' ? 'page-reload'
          : previous.hidden || previous.pageHidden ? 'background-interrupted' : 'foreground-interrupted' });
    }
  } catch { /* Missing, malformed or denied storage is harmless. */ }
  return {
    due() { return now() - lastWrite >= 10_000; },
    update(next: Diagnostic, active: boolean, hidden: boolean, force = false) {
      context = next;
      if (!force && now() - lastWrite < 10_000) return;
      lastWrite = now();
      try { target?.setItem(SESSION_KEY, JSON.stringify({ context, active, hidden, pageHidden, at: lastWrite })); } catch { /* Optional. */ }
    },
    pagehide() { pageHidden = true; },
    pageshow() { pageHidden = false; },
    finish() {
      if (context) this.update(context, false, false, true);
    },
  };
}

