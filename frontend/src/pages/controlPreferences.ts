export const CONTROL_HAND_KEY = "cryptoid_control_hand";
export type ControlHand = "right" | "left";
export const CONTROL_SENSITIVITY_KEY = "cryptoid_control_sensitivity";
export type ControlSensitivity = "gentle" | "normal" | "fast";
export const CONTROL_ZONE_KEY = "cryptoid_control_zone";
export type ControlZone = "compact" | "normal" | "wide";
export const SHIP_START_KEY = "cryptoid_ship_start";
export type ShipStart = "higher" | "normal" | "lower";

export const readControlHand = (): ControlHand =>
  localStorage.getItem(CONTROL_HAND_KEY) === "left" ? "left" : "right";
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
  return value === "higher" || value === "lower" ? value : "normal";
};
export const sensitivityMultiplier: Record<ControlSensitivity, number> = { gentle: .75, normal: 1, fast: 1.3 };
export const zoneFraction: Record<ControlZone, number> = { compact: .5, normal: .65, wide: .8 };
export const shipStartHeight: Record<ShipStart, number> = { higher: .78, normal: .86, lower: .9 };
