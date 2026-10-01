export const VIBRATION_KEY = "cryptoid_vibration";
export const readVibrationEnabled = () => localStorage.getItem(VIBRATION_KEY) !== "off";
export const supportsVibration = () => typeof navigator.vibrate === "function";

// Short bursts share a cooldown; a boss sequence cannot be cut off by a small explosion.
export class GameHaptics {
  private blockedUntil = 0;
  private output: (pattern: number | number[]) => boolean;
  private allowed: () => boolean;
  private now: () => number;
  constructor(output: (pattern: number | number[]) => boolean,
    allowed: () => boolean, now: () => number = () => performance.now()) {
    this.output = output;
    this.allowed = allowed;
    this.now = now;
  }
  explosion() { return this.pulse(30); }
  boss(pattern: number[]) { return this.pulse(pattern, true); }
  private pulse(pattern: number | number[], priority = false) {
    if (!this.allowed() || (!priority && this.now() < this.blockedUntil)) return false;
    try {
      if (!this.output(pattern)) return false;
      const duration = Array.isArray(pattern) ? pattern.reduce((sum, value) => sum + value, 0) : pattern;
      this.blockedUntil = this.now() + (priority ? duration : 120);
      return true;
    } catch { return false; }
  }
  stop() {
    this.blockedUntil = 0;
    try { this.output(0); } catch { /* Optional hardware. */ }
  }
}
export const gameHaptics = new GameHaptics(
  pattern => supportsVibration() && navigator.vibrate(pattern),
  () => readVibrationEnabled() && !document.hidden &&
    document.documentElement.dataset.motion !== "reduced" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
);
