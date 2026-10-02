// Visual-only motion. These values never participate in steering or collisions.
export type ShipMotion = { speed: number; bank: number; thrust: number; vx: number; vy: number };
export const idleShipMotion = (): ShipMotion => ({ speed: 0, bank: 0, thrust: 0, vx: 0, vy: 0 });
export const engineFlamePercent = (thrust: number, phase: "idle" | "launch" | "boost" | "return" = "idle") => {
  const floor = { idle: 7, launch: 16, boost: 20, return: 11 }[phase];
  return Math.max(floor, 7 + Math.max(0, Math.min(1, thrust)) * 24);
};
export function advanceShipMotion(previous: ShipMotion, dx: number, dy: number, delta: number): ShipMotion {
  const seconds = Math.max(1, delta) / 1000;
  const speed = Math.min(900, Math.hypot(dx, dy) / seconds);
  const acceleration = Math.max(0, speed - previous.speed) / 900;
  const braking = speed < previous.speed * .75;
  const response = 1 - Math.exp(-delta / 110);
  const bankTarget = Math.tanh(dx / seconds / 240) * 8;
  const thrustTarget = Math.min(1, speed / 650 + acceleration * .65) * (braking ? .35 : 1);
  return { speed, vx: dx / seconds, vy: dy / seconds, bank: previous.bank + (bankTarget - previous.bank) * response, thrust: previous.thrust + (thrustTarget - previous.thrust) * response };
}
export const explosionDiameter = (hullSize: number) => Math.max(24, Math.min(480, hullSize * 1.25));
export function fragmentFlight(x: number, y: number, impactX: number, impactY: number, hullSize: number, random: number, vx = 0, vy = 0) {
  const angle = Math.atan2(y - impactY, x - impactX) + (random - .5) * .45;
  const distance = hullSize * (.65 + random * .8);
  const momentum = (v: number) => Math.max(-hullSize * .5, Math.min(hullSize * .5, v * .18));
  return { x: Math.cos(angle) * distance + momentum(vx), y: Math.sin(angle) * distance + momentum(vy), spin: (random > .5 ? 1 : -1) * (100 + random * 360) };
}
export type LightSource = { x: number; y: number; startedAt: number; kind: string; debrisSize?: number; finalDelayMs?: number };
export function hullIllumination(x: number, y: number, now: number, muzzleAt: number, effects: readonly LightSource[]) {
  let light = muzzleAt > 0 ? Math.max(0, 1 - (now - muzzleAt) / 115) * .65 : 0;
  for (const effect of effects) {
    if (!['explosion', 'shatter', 'player-explosion', 'boss-explosion'].includes(effect.kind)) continue;
    const age = now - effect.startedAt - (effect.kind === 'boss-explosion' ? effect.finalDelayMs ?? 1450 : 0);
    if (age < 0 || age > 360) continue;
    const reach = (effect.debrisSize ?? 58) * 2.5;
    light = Math.max(light, Math.max(0, 1 - Math.hypot(x - effect.x, y - effect.y) / reach) * (1 - age / 360) * .85);
  }
  return light;
}
