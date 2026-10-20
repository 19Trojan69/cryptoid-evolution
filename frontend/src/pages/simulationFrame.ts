// Keep collision/movement steps within the existing 34 ms bound, but consume
// a late frame in several small steps rather than slowing the whole game down.
export const MAX_SIMULATION_STEP_MS = 34;
export const MAX_SIMULATION_STEPS = 4;

export function simulationFrame(gap: number, playing: boolean) {
  const wallMs = Number.isFinite(gap) ? Math.max(0, gap) : 0;
  // No backlog: a very long foreground stall cannot create an unbounded burst
  // of combat, sound or allocation work on subsequent frames.
  const simulatedMs = playing ? Math.min(wallMs, MAX_SIMULATION_STEP_MS * MAX_SIMULATION_STEPS) : wallMs;
  const steps = playing ? Math.max(1, Math.ceil(simulatedMs / MAX_SIMULATION_STEP_MS)) : 1;
  return { wallMs, simulatedMs, steps, stepMs: simulatedMs / steps };
}
