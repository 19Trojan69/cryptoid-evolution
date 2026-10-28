export type SpentWeaponNotice = {
  source: 'paid' | 'pickup'; level: number; shown: boolean;
  remainingMs: number;
  reload?: 'pending' | 'complete' | 'failed';
};

export const WEAPON_EXPIRY_NOTICE_MS = 3_000;

// A paid expiry waits without a deadline until a safe existing block break.
// Pickup upgrades and a permanent hull weapon never queue an expiry message.
export function createWeaponSpentNotice(source: string, level: number, beforeMs: number, afterMs: number): SpentWeaponNotice | null {
  if (source !== 'paid' || !Number.isInteger(level)
    || level < 2 || level > 5 || !Number.isFinite(beforeMs) || beforeMs <= 0 || afterMs !== 0) return null;
  return { source, level, shown: false, remainingMs: WEAPON_EXPIRY_NOTICE_MS };
}

export type WeaponNoticeWindow = {
  status: string; encounter: string; phase: string;
  enemies: number; enemyShots: number; clearRemainingMs: number;
};

export function canShowWeaponSpentNotice(notice: SpentWeaponNotice | null, window: WeaponNoticeWindow) {
  return notice?.source === 'paid' && notice.remainingMs > 0
    && (window.status === 'playing' || window.status === 'paused' && notice.shown)
    && window.encounter === 'normal' && window.phase === 'SECTOR_CLEAR'
    && window.enemies === 0 && window.enemyShots === 0
    && (notice.shown || window.clearRemainingMs >= WEAPON_EXPIRY_NOTICE_MS);
}

// Called by the existing playing step only. Pauses do not advance this clock.
// The first actual component commit starts it; pending notices retain all 3s.
export function advanceWeaponSpentNotice(notice: SpentWeaponNotice | null, delta: number, quiet: boolean) {
  if (!notice?.shown) return false;
  if (!quiet) return true;
  notice.remainingMs = Math.max(0, notice.remainingMs - Math.max(0, delta));
  return notice.remainingMs === 0;
}

// A late response can update only its still-pending notice; it cannot recreate
// feedback already consumed by an earlier binary window or a manual choice.
export function updateWeaponReloadNotice(notice: SpentWeaponNotice | null, level: number, result: 'complete' | 'failed') {
  if (notice?.source === 'paid' && notice.level === level && notice.reload === 'pending') notice.reload = result;
}
