import { readEffectsVolume } from "./musicPreferences.ts";

export type GameSound = "laser" | "enemyHit" | "explosion" | "collision" | "shield" | "pickup" | "boost" | "boss" | "bossDestroy" | "nova" | "emp";

const sampleNames = ["shot-single", "shot-twin", "shot-rapid", "shot-triple", "shot-plasma", "enemy-hit", "enemy-destroy", "enemy-destroy-alt", "player-collision", "shield", "boost", "boss-destroy"] as const;
type SampleName = typeof sampleNames[number];

// Game effects only; audio starts after a player gesture on browsers that require one.
export class GameAudio {
  private context: AudioContext | null = null;
  private effectsBus: GainNode | null = null;
  private paused = false;
  private effectsVolume = readEffectsVolume();
  private samples = new Map<SampleName, AudioBuffer>();
  private sampleRequest: Promise<void> | null = null;
  private lastShotAt = 0;
  private destroyCount = 0;

  async start() {
    if (typeof AudioContext === "undefined") return false;
    if (!this.context) {
      this.context = new AudioContext();
      this.effectsBus = this.context.createGain();
      this.effectsBus.gain.value = this.effectsVolume / 100;
      this.effectsBus.connect(this.context.destination);
    }
    try { await this.context.resume(); } catch { return false; }
    this.paused = false;
    if (!this.sampleRequest && typeof this.context.decodeAudioData === "function") this.sampleRequest = this.loadSamples(this.context);
    return this.context.state === "running";
  }

  private async loadSamples(context: AudioContext) {
    await Promise.all(sampleNames.map(async name => {
      try {
        const response = await fetch(`/audio/${name}.mp3`);
        if (!response.ok) return;
        const sound = await context.decodeAudioData(await response.arrayBuffer());
        if (this.context === context) this.samples.set(name, sound);
      } catch { /* Keep synthesized fallback if audio cannot load or decode. */ }
    }));
  }

  private sample(name: SampleName, volume: number, rate = 1) {
    const context = this.context;
    const buffer = this.samples.get(name);
    if (!context || context.state !== "running" || this.paused || !buffer || !this.effectsBus || typeof context.createBufferSource !== "function") return false;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    gain.gain.value = volume;
    source.connect(gain).connect(this.effectsBus);
    source.start();
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    return true;
  }

  private tone(frequency: number, end: number, duration: number, gain: number, type: OscillatorType = "sine", delay = 0) {
    const context = this.context;
    if (!context || context.state !== "running" || this.paused) return;
    const at = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, end), at + duration);
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.exponentialRampToValueAtTime(gain, at + .008);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(envelope).connect(this.effectsBus!);
    oscillator.start(at);
    oscillator.stop(at + duration + .01);
  }

  play(sound: GameSound, weaponLevel = 1) {
    if (sound === "laser") {
      const now = Date.now();
      if (now - this.lastShotAt < 90) return;
      this.lastShotAt = now;
      const name = sampleNames[Math.max(0, Math.min(4, weaponLevel - 1))];
      if (this.sample(name, weaponLevel >= 4 ? .17 : .13)) return;
    } else {
      const name: Partial<Record<Exclude<GameSound, "laser">, SampleName>> = {
        enemyHit: "enemy-hit", explosion: this.destroyCount++ % 2 ? "enemy-destroy-alt" : "enemy-destroy",
        collision: "player-collision", shield: "shield", boost: "boost", bossDestroy: "boss-destroy",
      };
      const chosen = name[sound];
      if (chosen && this.sample(chosen, sound === "explosion" ? .15 : sound === "bossDestroy" ? .17 : sound === "collision" ? .2 : .26)) return;
    }
    switch (sound) {
      case "laser": this.tone(920, 330, .085, .025, "sawtooth"); break;
      case "enemyHit": this.tone(440, 170, .11, .06, "triangle"); break;
      case "explosion": this.tone(260, 105, .18, .035, "triangle"); break;
      case "collision": this.tone(180, 65, .28, .065, "triangle"); break;
      case "shield": this.tone(420, 1050, .28, .08, "sine"); break;
      case "pickup": [620, 830, 1240].forEach((note, step) => this.tone(note, note * 1.07, .14, .065, "sine", step * .085)); break;
      case "boost": this.tone(270, 860, .42, .08, "sawtooth"); break;
      case "boss": [150, 130, 110].forEach((note, step) => this.tone(note, note * .75, .3, .085, "triangle", step * .22)); break;
      case "bossDestroy": this.tone(150, 60, .48, .055, "triangle"); break;
      case "nova": [440, 220, 90].forEach((note, step) => this.tone(note, 55, .56, .09, "sawtooth", step * .05)); break;
      case "emp": [980, 730, 490].forEach((note, step) => this.tone(note, 150, .32, .045, "sine", step * .09)); break;
    }
  }

  setEffectsVolume(percent: number) {
    this.effectsVolume = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 100));
    if (this.effectsBus) this.effectsBus.gain.value = this.effectsVolume / 100;
  }

  setSector(_sector: number) { /* Reserved for future sector-specific effects. */ }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  close() {
    this.setPaused(true);
    void this.context?.close();
    this.context = null;
    this.effectsBus = null;
    this.samples.clear();
  }
}

let primedAudio: Promise<GameAudio | null> | null = null;
export const primeGameAudio = () => {
  if (!primedAudio) {
    const audio = new GameAudio();
    primedAudio = audio.start().then(started => {
      if (started) return audio;
      audio.close();
      return null;
    });
  }
};
export const takePrimedGameAudio = () => {
  const audio = primedAudio;
  primedAudio = null;
  return audio;
};
export const hasPrimedGameAudio = () => primedAudio !== null;
