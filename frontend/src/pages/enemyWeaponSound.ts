// A compact metallic double chirp, distinct from the player's recordings and
// the boss's descending laser sweeps and heavy weapon reports. Cache once.
export const generateEnemyShotSound = (sampleRate = 48000) => {
  const duration = .18;
  const data = new Float32Array(Math.ceil(duration * sampleRate));
  const pulseStart = Math.ceil(.048 * sampleRate);
  let phase = 0;
  let seed = 82471;
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const second = i >= pulseStart;
    const local = (i - (second ? pulseStart : 0)) / sampleRate;
    if (i === pulseStart) phase = 0;
    const frequency = (second ? 890 : 640) + 330 * (1 - Math.exp(-local * 65));
    phase += 2 * Math.PI * frequency / sampleRate;
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    const noise = (seed >>> 0) / 2147483648 - 1;
    const attack = 1 - Math.exp(-local * 1500);
    const envelope = attack * Math.exp(-local * 48) * (second ? .68 : 1);
    // Inharmonic FM gives a small alien emitter a recognisable glassy snap.
    const body = .62 * Math.sin(phase + 1.7 * Math.sin(phase * 2.73) * Math.exp(-local * 75))
      + .19 * Math.sin(phase * 3.41) + .07 * noise * Math.exp(-local * 110);
    // Fade both pulses to avoid clicks at their join and the buffer end.
    const fade = Math.min(1, (duration - t) / .012, second ? 1 : (pulseStart - i) / sampleRate / .006);
    data[i] = body * envelope * Math.max(0, fade);
  }
  let peak = 0;
  for (const value of data) peak = Math.max(peak, Math.abs(value));
  for (let i = 0; i < data.length; i++) data[i] *= .64 / Math.max(peak, 1e-9);
  return data;
};
