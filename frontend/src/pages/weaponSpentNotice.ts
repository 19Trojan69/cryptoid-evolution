export type SpentWeaponNotice = {
  source: 'paid' | 'pickup'; level: number; shown: boolean;
  reload?: 'pending' | 'complete' | 'failed';
};

// Queue only a real selected timed-weapon expiry. The next formation's binary
// window owns the entire display lifetime; this record has no reading timer.
export function createWeaponSpentNotice(source: string, level: number, beforeMs: number, afterMs: number): SpentWeaponNotice | null {
  if ((source !== 'paid' && source !== 'pickup') || !Number.isInteger(level)
    || level < 2 || level > 5 || !Number.isFinite(beforeMs) || beforeMs <= 0 || afterMs !== 0) return null;
  return { source, level, shown: false };
}

// A late response can update only its still-pending notice; it cannot recreate
// feedback already consumed by an earlier binary window or a manual choice.
export function updateWeaponReloadNotice(notice: SpentWeaponNotice | null, level: number, result: 'complete' | 'failed') {
  if (notice?.source === 'paid' && notice.level === level && notice.reload === 'pending') notice.reload = result;
}
