// A short, gritty energy discharge. The noise attack gives the shot impact,
// while the descending harmonic body stays clear of the player's recordings.
export const generateEnemyShotSound = (sampleRate = 48000) => {
  const duration = .14;
  const data = new Float32Array(Math.round(duration * sampleRate));
  let phase = 0;
  let seed = 82471;
  let noiseMemory = 0;
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const frequency = 410 + 690 * Math.exp(-t * 54);
    phase += 2 * Math.PI * frequency / sampleRate;
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    const noise = (seed >>> 0) / 2147483648 - 1;
    noiseMemory += .16 * (noise - noiseMemory);
    const attack = 1 - Math.exp(-t * 1800);
    const body = (.53 * Math.sin(phase) + .2 * Math.sin(phase * 2 + .35) + .08 * Math.sin(phase * 3 + .7)) * Math.exp(-t * 33);
    const snap = .43 * noise * Math.exp(-t * 185);
    const grit = .1 * (noise - noiseMemory) * Math.exp(-t * 42);
    const fade = Math.min(1, (duration - t) / .014);
    data[i] = (body + snap + grit) * attack * Math.max(0, fade);
  }
  let peak = 0;
  for (const value of data) peak = Math.max(peak, Math.abs(value));
  for (let i = 0; i < data.length; i++) data[i] *= .64 / Math.max(peak, 1e-9);
  return data;
};
