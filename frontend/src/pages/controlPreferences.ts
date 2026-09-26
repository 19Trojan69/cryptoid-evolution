export const CONTROL_HAND_KEY = "cryptoid_control_hand";
export type ControlHand = "right" | "left";

export const readControlHand = (): ControlHand =>
  localStorage.getItem(CONTROL_HAND_KEY) === "left" ? "left" : "right";
