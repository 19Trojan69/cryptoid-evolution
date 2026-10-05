// Internal stages 1..50 are the first five visible levels (nine blocks + boss).
// Ease out continuously; stage 51 and the later campaign retain their old tuning.
export const introRelief = (stage: number) => {
  const bounded = Math.max(1, Number.isFinite(stage) ? Math.floor(stage) : 1);
  return Math.max(0, 1 - (bounded - 1) / 49);
};
export const introShotSpeed = (stage: number) => 1 - .35 * introRelief(stage);
export const introGroupBreathingMs = (stage: number) => Math.round(650 * introRelief(stage));
