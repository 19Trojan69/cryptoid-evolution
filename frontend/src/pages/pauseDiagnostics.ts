import { sessionDiagnostic, sessionDiagnosticsActive } from '../lib/sessionDiagnosticEvents.ts';

export const PAUSE_REASONS = ['manual-pause', 'home-menu', 'weapon-menu', 'reward-cards', 'boss-summary',
  'blur', 'visibility-hidden', 'background-return', 'frame-error', 'loop-stall', 'input-error',
  'javascript-error', 'unhandled-rejection', 'render-error'] as const;
export type PauseReason = typeof PAUSE_REASONS[number];
type State = Readonly<{ status: string; sector: number; phase: string; encounter: string }>;
type Host = { performance: { now(): number }; document: { hidden: boolean; hasFocus?(): boolean } };
export function cleanPauseDiagnostic(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const v = input as Record<string, unknown>;
  if (v.operation !== 'pause-enter' || v.status !== 'playing' || !PAUSE_REASONS.includes(v.pauseReason as PauseReason)) return null;
  const data: Record<string, unknown> = { operation: 'pause-enter', pauseReason: v.pauseReason, status: 'playing', targetStatus: 'paused' };
  if (Number.isInteger(v.sector) && Number(v.sector) >= 1 && Number(v.sector) <= 500) data.sector = v.sector;
  for (const [key, allowed] of Object.entries({ phase: ['SECTOR_INTRO','ENTRY','FORMATION','ATTACK_CYCLE','REFORM','SECTOR_CLEAR'],
    encounter: ['normal','boss-intro','boss-fight','boss-clear','bonus'] })) if (allowed.includes(String(v[key]))) data[key] = v[key];
  if (Number.isSafeInteger(v.frameGapMs) && Number(v.frameGapMs) >= 0 && Number(v.frameGapMs) <= 3_600_000) data.frameGapMs = v.frameGapMs;
  for (const key of ['hidden', 'focused']) if (typeof v[key] === 'boolean') data[key] = v[key];
  if (Number.isSafeInteger(v.suppressed) && Number(v.suppressed) >= 0 && Number(v.suppressed) <= 60_000) data.suppressed = v.suppressed;
  return data;
}

let windowAt = -Infinity, count = 0, suppressed = 0;
// Called immediately before existing assignments, only on a playing -> paused
// branch. No new listeners/timers, no state mutation, no raw error/input data.
export function recordPauseEvidence(verifiedOwner: boolean, reason: PauseReason, state: State, lastFrame: number,
  getHost: () => Host = () => window) {
  if (!verifiedOwner || !sessionDiagnosticsActive()) return;
  try {
    if (state.status !== 'playing') return;
    const host = getHost(), at = host.performance.now();
    if (!Number.isFinite(at)) return;
    if (at < windowAt || at - windowAt >= 1000) { windowAt = at; count = 0; }
    if (count >= 8) { suppressed = Math.min(60_000, suppressed + 1); return; }
    const data = cleanPauseDiagnostic({ operation: 'pause-enter', pauseReason: reason, status: state.status, sector: state.sector, phase: state.phase, encounter: state.encounter,
      frameGapMs: lastFrame > 0 ? Math.min(3_600_000, Math.round(Math.max(0, at - lastFrame))) : undefined,
      hidden: host.document.hidden, focused: host.document.hasFocus?.() });
    if (!data) return;
    count++; sessionDiagnostic('pause', { ...data, suppressed }); suppressed = 0;
  } catch { /* A diagnostic host/storage failure cannot block the existing pause. */ }
}
