/** Continuous, bounded pressure curve. Health and warning time are not inflated. */
export function bossDifficulty(id: number) {
  const progress = (Math.min(50, Math.max(1, Math.floor(Number.isFinite(id) ? id : 1))) - 1) / 49;
  return {
    projectileScale: 1 + progress * .38,
    trackingScale: 1 + progress * .22,
    cadenceScale: 1 - progress * .24,
    coreSpeed: .12 + progress * .05,
    coreInterval: 2800 - progress * 700,
  };
}
