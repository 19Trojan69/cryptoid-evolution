// Internal stages 1..500 correspond to 50 visible campaign levels.
// Returning ships still count towards the cap. No more than three can threaten
// the player at once; quiet blocks keep the original single-wave rhythm.
export const attackPressure = (stage: number) => {
  const bounded = Math.max(1, Math.min(500, stage));
  const progress = Math.sqrt((bounded - 1) / 499);
  const quiet = [1, 3, 5].includes((bounded - 1) % 10 + 1);
  return {
    overlap: bounded >= 4 && !quiet,
    cap: bounded < 11 ? 2 : 3,
    intervalMs: 3400 - progress * 1700,
  };
};

export const attackSlots = (stage: number, active: number, ready: number) => {
  const pressure = attackPressure(stage);
  if (active > 0 && !pressure.overlap) return 0;
  return Math.max(0, Math.min(ready, pressure.cap - active));
};
