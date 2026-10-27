export const WEAPON_SPENT_NOTICE_MS = 8_000;
export type SpentWeaponNotice = {
  source: 'paid' | 'pickup'; level: number; remainingMs: number; visible: boolean;
};

// Called only at a selected weapon's expiry boundary. Stock, auto-selection,
// activation and purchases remain owned by the existing controller/handlers.
export function createWeaponSpentNotice(source: string, level: number, beforeMs: number, afterMs: number, reloading: boolean): SpentWeaponNotice | null {
  if (reloading || (source !== 'paid' && source !== 'pickup') || !Number.isInteger(level)
    || level < 2 || level > 5 || !Number.isFinite(beforeMs) || beforeMs <= 0 || afterMs !== 0) return null;
  return { source, level, remainingMs: WEAPON_SPENT_NOTICE_MS, visible: false };
}
