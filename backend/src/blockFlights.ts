// A finite plan is chosen before the block starts. Internal stages remain
// 1..500; each existing visible level contains nine blocks and one boss.
export const REINFORCEMENT_WARNING_MS = 1_000;
export const GROUP_CLEAR_POINTS = 50;

export function blockFlights(stage: number, rulesVersion = 2): number[] {
  if (stage < 1 || stage > 500 || stage % 10 === 0) return [];
  const block = (stage - 1) % 10 + 1;
  if (rulesVersion === 1) {
    const level = Math.floor((stage - 1) / 10) + 1;
    return level >= 10 && block >= 7 ? [6, Math.min(6, 4 + Math.floor((level - 10) / 10))] : [6];
  }
  const start = Math.floor((stage - 1) / 10) * 10 + 1;
  const count = start < 11 ? 1 : start < 31 ? 3 : start < 51 ? 4
    : start < 101 ? 5 : start < 151 ? 6 : start < 251 ? 7 : start < 351 ? 8 : 9;
  // Quiet blocks 1, 3 and 5 remain short. Later finales can have three flights.
  const order = [9, 4, 6, 7, 8, 2, 9, 8, 6];
  return Array(1 + order.slice(0, count).filter(b => b === block).length).fill(6);
}

export function nextBlockFlight(stage: number, group: number, spawned: number, alive: number, rulesVersion = 2) {
  const plan = blockFlights(stage, rulesVersion);
  if (!plan.length || spawned !== plan[group] || alive !== 0) return null;
  return group + 1 < plan.length ? {
    group: group + 1, count: plan[group + 1],
    offset: plan.slice(0, group + 1).reduce((a, b) => a + b, 0),
  } : null;
}

export const blockFinished = (stage: number, group: number, spawned: number, alive: number, rulesVersion = 2) => {
  const plan = blockFlights(stage, rulesVersion);
  return plan.length > 0 && group === plan.length - 1 && spawned === plan[group] && alive === 0;
};
