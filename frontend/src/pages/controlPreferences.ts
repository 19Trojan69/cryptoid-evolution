export const CONTROL_HAND_KEY = "cryptoid_control_hand";
export type ControlHand = "right" | "left";
export const CONTROL_SENSITIVITY_KEY = "cryptoid_control_sensitivity";
export type ControlSensitivity = "gentle" | "normal" | "fast";
export const CONTROL_ZONE_KEY = "cryptoid_control_zone";
export type ControlZone = "compact" | "normal" | "wide";
export const SHIP_START_KEY = "cryptoid_ship_start";
export type ShipStart = "higher" | "touch";

let handFallback: ControlHand = 'right';
let handMemoryOnly = false;
export const readControlHand = (): ControlHand => {
  if (handMemoryOnly) return handFallback;
  try { return localStorage.getItem(CONTROL_HAND_KEY) === "left" ? "left" : "right"; }
  catch { return handFallback; }
};
export const saveControlHand = (hand: ControlHand) => {
  handFallback = hand;
  try { localStorage.setItem(CONTROL_HAND_KEY, hand); handMemoryOnly = false; }
  catch { handMemoryOnly = true; }
};
export const readControlSensitivity = (): ControlSensitivity => {
  const value = localStorage.getItem(CONTROL_SENSITIVITY_KEY);
  return value === "gentle" || value === "fast" ? value : "normal";
};
export const readControlZone = (): ControlZone => {
  const value = localStorage.getItem(CONTROL_ZONE_KEY);
  return value === "compact" || value === "wide" ? value : "normal";
};
export const readShipStart = (): ShipStart => {
  const value = localStorage.getItem(SHIP_START_KEY);
  // Only an explicit under-finger choice overrides the visible default.
  return value === "touch" ? "touch" : "higher";
};
export const sensitivityMultiplier: Record<ControlSensitivity, number> = { gentle: .75, normal: 1, fast: 1.3 };
// Area size adjusts vertical reach; either hand can steer across the full width.
export const controlAreaTop: Record<ControlZone, number> = { compact: .65, normal: .5, wide: .4 };
// On a typical phone playfield, the touch position starts about 30 CSS pixels
// (roughly 8 mm) below the established upper position.
export const shipStartHeight: Record<ShipStart, number> = { higher: .78, touch: .82 };
