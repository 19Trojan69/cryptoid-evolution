export type SpentWeaponNotice = {
  source: 'paid' | 'pickup'; level: number; shown: boolean;
};

// Queue only a real selected timed-weapon expiry. The next formation's binary
// window owns the entire display lifetime; this record has no reading timer.
export function createWeaponSpentNotice(source: string, level: number, beforeMs: number, afterMs: number): SpentWeaponNotice | null {
  if ((source !== 'paid' && source !== 'pickup') || !Number.isInteger(level)
    || level < 2 || level > 5 || !Number.isFinite(beforeMs) || beforeMs <= 0 || afterMs !== 0) return null;
  return { source, level, shown: false };
}
