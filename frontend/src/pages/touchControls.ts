export const TOUCH_MODE_KEY = "cryptoid_touch_mode";
export type TouchMode = "left" | "right" | "drag";

export const readTouchMode = (): TouchMode => {
  const saved = localStorage.getItem(TOUCH_MODE_KEY);
  return saved === "right" || saved === "drag" ? saved : "left";
};

export const joystickVector = (x: number, y: number, centerX: number, centerY: number, radius: number) => {
  const dx = (x - centerX) / radius;
  const dy = (y - centerY) / radius;
  const magnitude = Math.max(1, Math.hypot(dx, dy));
  return { x: dx / magnitude, y: dy / magnitude };
};
