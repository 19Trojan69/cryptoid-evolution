import type { GameInterruption } from './gameLoop.ts';

export const GAME_DIAGNOSTICS_KEY = 'cryptoid_game_diagnostics_v1';
type Diagnostic = {
  reason: GameInterruption | 'performance' | 'unexpected-restart'; errorName: string; sector: number; phase: string;
  encounter: string; status: string; width: number; height: number; browser: string;
  block?: number; enemies?: number; projectiles?: number; effects?: number;
  frameMs?: number; workMs?: number; performanceLevel?: number; lastSavedAt?: number;
  restartHint?: 'foreground-interrupted' | 'background-interrupted' | 'page-reload';
};
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
export function createGameSessionDiagnostics(storage: Pick<Storage, 'getItem' | 'setItem'>,
  report: (entry: Diagnostic) => unknown = recordGameDiagnostic, now = Date.now, navigationType = '') {
  let lastWrite = 0;
  let context: Diagnostic | null = null;
  let pageHidden = false;
  try {
    const previous = JSON.parse(storage.getItem(SESSION_KEY) ?? 'null') as SessionMarker | null;
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
      try { storage.setItem(SESSION_KEY, JSON.stringify({ context, active, hidden, pageHidden, at: lastWrite })); } catch { /* Optional. */ }
    },
    pagehide() { pageHidden = true; },
    pageshow() { pageHidden = false; },
    finish() {
      if (context) this.update(context, false, false, true);
    },
  };
}
