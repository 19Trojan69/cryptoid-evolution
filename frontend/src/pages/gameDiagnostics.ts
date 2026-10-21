import type { GameInterruption } from './gameLoop.ts';

export const GAME_DIAGNOSTICS_KEY = 'cryptoid_game_diagnostics_v1';
export type GameDiagnostic = {
  reason: GameInterruption | 'performance' | 'unexpected-restart'; errorName: string; sector: number; phase: string;
  encounter: string; status: string; width: number; height: number; browser: string;
  block?: number; enemies?: number; projectiles?: number; effects?: number;
  frameMs?: number; workMs?: number; performanceLevel?: number; lastSavedAt?: number;
  bossId?: number; bossHealth?: number; bossMaxHealth?: number; liveTurrets?: number; totalTurrets?: number;
  reactorOpen?: boolean; bossElapsedMs?: number; coreElapsedMs?: number; bossVolley?: number; coreVolley?: number;
  bossEscortWave?: number; bossEscortSpawned?: number; bossEscortTimerMs?: number; attackCooldownMs?: number;
  spawnTimerMs?: number; clearTimerMs?: number; elapsedMs?: number;
  jsHeapBytes?: number; domNodes?: number; runningAnimations?: number; canvasNodes?: number; imageNodes?: number;
  paintedEntries?: number; paintedBytes?: number; paintedSources?: number; paintedPending?: number;
  paintedRetained?: number; paintedRetainCount?: number; paintedSourceRetained?: number; paintedSourceRetainCount?: number;
  canvasRegisteredEffects?: number; canvasSourceImages?: number; canvasTextureEntries?: number;
  canvasCacheBytes?: number; canvasSurfaceBytes?: number; canvasRetainedHullUsers?: number; canvasFailureCount?: number;
  audioVoices?: number; audioWeaponVoices?: number; audioBossVoices?: number; audioEffectVoices?: number;
  audioSampleBuffers?: number; audioRockBuffers?: number; audioBufferBytes?: number; estimatedResourceBytes?: number;
  audioState?: string;
  audioClockMs?: number; audioClockStalls?: number; audioRecoveries?: number; audioBlockedSounds?: number; audioReapedVoices?: number;
  musicState?: string; musicClockMs?: number; musicMediaMs?: number; musicPaused?: boolean; musicEnded?: boolean;
  musicTrack?: string; bossHeartCollected?: boolean;
  sourceCommit?: string; sourceTree?: string; workingTreeDirty?: boolean;
  targetHz?: number; cssPacingMode?: string; cssPacedActive?: number; cssPacingFallbacks?: number;
  restartHint?: 'foreground-interrupted' | 'background-interrupted' | 'page-reload';
};
// Local bounded technical records only: no account identifiers, raw exception
// text, credentials or automatic network transmission.
export function recordGameDiagnostic(diagnostic: GameDiagnostic, storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const entry = { ...diagnostic, phase: diagnostic.phase.slice(0, 40), encounter: diagnostic.encounter.slice(0, 40), status: diagnostic.status.slice(0, 30), browser: diagnostic.browser.slice(0, 240), errorName: diagnostic.errorName.slice(0, 60), at: new Date().toISOString() };
  try {
    const target = storage ?? window.localStorage;
    let previous: unknown;
    try { previous = JSON.parse(target.getItem(GAME_DIAGNOSTICS_KEY) ?? '[]'); } catch { previous = []; }
    target.setItem(GAME_DIAGNOSTICS_KEY, JSON.stringify([...(Array.isArray(previous) ? previous.slice(-19) : []), entry]));
  } catch { /* Diagnostics must never interrupt play or recovery. */ }
  return entry;
}

export const GAME_SESSION_KEY = 'cryptoid_game_session_v1';
type SessionMarker = { context: GameDiagnostic; active: boolean; hidden: boolean; pageHidden: boolean; at: number };

// The marker is per-tab session storage, avoiding false crashes from another
// open game tab. OS kills cannot be identified conclusively; absence of a
// pagehide callback is only a hint. No account, exception message or stack is saved.
export function createGameSessionDiagnostics(storage?: Pick<Storage, 'getItem' | 'setItem'>,
  report: (entry: GameDiagnostic) => unknown = recordGameDiagnostic, now = Date.now, navigationType = '') {
  // Web Storage access itself may throw in an embedded/private browser.
  // Keep optional diagnostics from failing the owner of the combat state.
  let target = storage;
  if (!target) { try { target = window.sessionStorage; } catch { /* Optional. */ } }
  let lastWrite = 0;
  let context: GameDiagnostic | null = null;
  let pageHidden = false;
  try {
    const previous = JSON.parse(target?.getItem(GAME_SESSION_KEY) ?? 'null') as SessionMarker | null;
    if (previous?.active && previous.context && now() - previous.at < 24 * 60 * 60 * 1000) {
      report({ ...previous.context, reason: 'unexpected-restart', errorName: '',
        restartHint: navigationType === 'reload' ? 'page-reload'
          : previous.hidden || previous.pageHidden ? 'background-interrupted' : 'foreground-interrupted' });
    }
  } catch { /* Missing, malformed or denied storage is harmless. */ }
  return {
    due() { return now() - lastWrite >= 10_000; },
    update(next: GameDiagnostic, active: boolean, hidden: boolean, force = false) {
      context = next;
      if (!force && now() - lastWrite < 10_000) return;
      lastWrite = now();
      try { target?.setItem(GAME_SESSION_KEY, JSON.stringify({ context, active, hidden, pageHidden, at: lastWrite })); } catch { /* Optional. */ }
    },
    pagehide() { pageHidden = true; },
    pageshow() { pageHidden = false; },
    finish() {
      if (context) this.update(context, false, false, true);
    },
  };
}

