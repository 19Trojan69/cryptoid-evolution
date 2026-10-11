/** Continuous, bounded pressure curve. Health and warning time are not inflated. */
export function bossDifficulty(id: number) {
  const progress = (Math.min(50, Math.max(1, Math.floor(Number.isFinite(id) ? id : 1))) - 1) / 49;
  return {
    // A whole-battery budget avoids abrupt durability jumps when the next
    // boss mounts more guns. Caliber still determines each station's share.
    turretHealthBudget: 36 + progress * 72 + progress * progress * 108,
    projectileScale: 1 + progress * .38,
    trackingScale: 1 + progress * .22,
    cadenceScale: 1 - progress * .24,
    coreSpeed: .12 + progress * .05,
    coreInterval: 2800 - progress * 700,
  };
}
