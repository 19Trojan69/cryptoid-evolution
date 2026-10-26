// Keep ordinary/technical Resume at its existing three one-second steps.
// An equipped timed weapon after the weapon menu uses three half-second steps.
export const weaponResumeStepMs = (fromWeaponMenu: boolean, source: string, remainingMs: number) =>
  fromWeaponMenu && (source === 'paid' || source === 'pickup') && (remainingMs > 0 || remainingMs === -1) ? 500 : 1000;
