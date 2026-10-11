import type { GameInterruption } from './gameLoop.ts';

export const GAME_DIAGNOSTICS_KEY = 'cryptoid_game_diagnostics_v1';
type Diagnostic = {
  reason: GameInterruption; errorName: string; sector: number; phase: string;
  encounter: string; status: string; width: number; height: number; browser: string;
};
// Local bounded technical records only: no account identifiers, raw exception
// text, credentials or automatic network transmission.
export function recordGameDiagnostic(diagnostic: Diagnostic, storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const entry = { ...diagnostic, browser: diagnostic.browser.slice(0, 240), errorName: diagnostic.errorName.slice(0, 60), at: new Date().toISOString() };
  try {
    const target = storage ?? window.localStorage;
    let previous: unknown;
    try { previous = JSON.parse(target.getItem(GAME_DIAGNOSTICS_KEY) ?? '[]'); } catch { previous = []; }
    target.setItem(GAME_DIAGNOSTICS_KEY, JSON.stringify([...(Array.isArray(previous) ? previous.slice(-19) : []), entry]));
  } catch { /* Diagnostics must never interrupt play or recovery. */ }
  return entry;
}
