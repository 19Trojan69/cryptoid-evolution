import type { CryptoidClass } from './cryptoidRoster.ts';

// Cached once per device rate. Each class has its own energy discharge;
// midrange harmonics carry the heavier weapons on small phone speakers.
export const enemySoundProfiles: Record<CryptoidClass, { duration: number; base: number; sweep: number; decay: number; grit: number; gain: number }> = {
  light: { duration: .14, base: 410, sweep: 690, decay: 33, grit: .10, gain: .42 },
  medium: { duration: .19, base: 260, sweep: 520, decay: 24, grit: .16, gain: .48 },
  heavy: { duration: .26, base: 115, sweep: 300, decay: 19, grit: .24, gain: .56 },
  elite: { duration: .21, base: 580, sweep: 820, decay: 27, grit: .14, gain: .50 },
};
export const generateEnemyShotSound = (sampleRate = 48000, shipClass: CryptoidClass = 'light') => {
  const { duration, base, sweep, decay, grit: gritLevel } = enemySoundProfiles[shipClass];
  const data = new Float32Array(Math.round(duration * sampleRate));
  let phase = 0;
  let seed = 82471;
  let noiseMemory = 0;
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const frequency = base + sweep * Math.exp(-t * 54);
    phase += 2 * Math.PI * frequency / sampleRate;
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    const noise = (seed >>> 0) / 2147483648 - 1;
    noiseMemory += .16 * (noise - noiseMemory);
    const attack = 1 - Math.exp(-t * 1800);
    const body = (.53 * Math.sin(phase) + .2 * Math.sin(phase * 2 + .35) + .08 * Math.sin(phase * 3 + .7)) * Math.exp(-t * decay);
    const snap = .43 * noise * Math.exp(-t * 185);
    const grit = gritLevel * (noise - noiseMemory) * Math.exp(-t * 42);
    const fade = Math.min(1, (duration - t) / .014);
    data[i] = (body + snap + grit) * attack * Math.max(0, fade);
  }
  let peak = 0;
  for (const value of data) peak = Math.max(peak, Math.abs(value));
  for (let i = 0; i < data.length; i++) data[i] *= .64 / Math.max(peak, 1e-9);
  return data;
};
