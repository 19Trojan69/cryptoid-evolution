import { effectsGain, readEffectsVolume } from "./musicPreferences.ts";
import type { PowerUpType } from "./powerUps.ts";

export type GameSound = "laser" | "enemyHit" | "explosion" | "collision" | "playerDestroy" | "shield" | "pickup" | "boost" | "boss" | "bossDestroy" | "nova" | "emp";

const sampleNames = ["shot-single", "shot-twin", "shot-rapid", "shot-triple", "shot-plasma", "enemy-hit", "enemy-destroy", "enemy-destroy-alt", "player-collision", "shield", "boost", "boss-warning-siren", "boss-destroy", "boss-destroy-v3", "pickup-shield", "pickup-overdrive", "pickup-weapon", "pickup-rapid", "pickup-bomb", "pickup-emp"] as const;
type SampleName = typeof sampleNames[number];
const pickupSamples: Record<PowerUpType, SampleName> = {
  shield: "pickup-shield", overdrive: "pickup-overdrive", weapon: "pickup-weapon",
  rapid: "pickup-rapid", bomb: "pickup-bomb", emp: "pickup-emp",
};

// Calibrated from the source files' average levels: one-off effects share a
// common level, while frequently repeated shots sit slightly lower.
const sampleGains: Record<SampleName, number> = {
  "shot-single": .342,
  "shot-twin": .096,
  "shot-rapid": .192,
  "shot-triple": .210,
  "shot-plasma": .240,
  "enemy-hit": .480,
  "enemy-destroy": .276,
  "enemy-destroy-alt": .372,
  "player-collision": .452,
  "shield": .213,
  "boost": .348,
  "boss-warning-siren": .72,
  "boss-destroy": .321,
  // Long, deeper boss impact with enough presence to carry on phone speakers.
  "boss-destroy-v3": .9,
  "pickup-shield": .8,
  "pickup-overdrive": .8,
  "pickup-weapon": .8,
  "pickup-rapid": .8,
  "pickup-bomb": .8,
  "pickup-emp": .8,
};

// Game effects only; audio starts after a player gesture on browsers that require one.
export class GameAudio {
  private context: AudioContext | null = null;
  private effectsBus: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private paused = false;
  private effectsVolume = readEffectsVolume();
  private samples = new Map<SampleName, AudioBuffer>();
  private sampleRequest: Promise<void> | null = null;
  private lastShotAt = 0;
  private destroyCount = 0;

  get running() { return this.context?.state === "running"; }

  async start() {
    if (typeof AudioContext === "undefined") return false;
    if (!this.context) {
      this.context = new AudioContext();
      this.effectsBus = this.context.createGain();
      this.effectsBus.gain.value = effectsGain(this.effectsVolume);
      if (typeof this.context.createDynamicsCompressor === "function") {
        this.limiter = this.context.createDynamicsCompressor();
        this.limiter.threshold.value = -12;
        this.limiter.knee.value = 12;
        this.limiter.ratio.value = 8;
        this.limiter.attack.value = .003;
        this.limiter.release.value = .2;
        this.effectsBus.connect(this.limiter).connect(this.context.destination);
      } else {
        this.effectsBus.connect(this.context.destination);
      }
    }
    const context = this.context;
    // Start decoding immediately, even if iOS delays resume() until a gesture.
    if (!this.sampleRequest && typeof context.decodeAudioData === "function") this.sampleRequest = this.loadSamples(context);
    try { await context.resume(); } catch { return false; }
    if (this.context !== context) return false;
    return context.state === "running";
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

  private sample(name: SampleName, rate = 1) {
    const context = this.context;
    const buffer = this.samples.get(name);
    if (!context || context.state !== "running" || this.paused || !buffer || !this.effectsBus || typeof context.createBufferSource !== "function") return false;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    gain.gain.value = sampleGains[name];
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
    envelope.gain.exponentialRampToValueAtTime(Math.min(.5, gain * 3), at + .008);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(envelope).connect(this.effectsBus!);
    oscillator.start(at);
    oscillator.stop(at + duration + .01);
  }

  playPickup(type: PowerUpType) {
    if (!this.sample(pickupSamples[type])) this.play("pickup");
  }

  play(sound: GameSound, weaponLevel = 1) {
    if (sound === "laser") {
      const now = Date.now();
      if (now - this.lastShotAt < 90) return;
      this.lastShotAt = now;
      const name = sampleNames[Math.max(0, Math.min(4, weaponLevel - 1))];
      if (this.sample(name)) return;
    } else {
      const name: Partial<Record<Exclude<GameSound, "laser">, SampleName>> = {
        enemyHit: "enemy-hit", explosion: this.destroyCount++ % 2 ? "enemy-destroy-alt" : "enemy-destroy",
        collision: "player-collision", playerDestroy: "boss-destroy", shield: "shield", boost: "boost", boss: "boss-warning-siren", bossDestroy: "boss-destroy-v3",
      };
      const chosen = name[sound];
      if (chosen && this.sample(chosen)) return;
    }
    switch (sound) {
      case "laser": this.tone(920, 330, .085, .025, "sawtooth"); break;
      case "enemyHit": this.tone(440, 170, .11, .06, "triangle"); break;
      case "explosion": this.tone(260, 105, .18, .035, "triangle"); break;
      case "collision": this.tone(180, 65, .28, .065, "triangle"); break;
      case "shield": this.tone(420, 1050, .28, .08, "sine"); break;
      case "pickup": [620, 830, 1240].forEach((note, step) => this.tone(note, note * 1.07, .14, .065, "sine", step * .085)); break;
      case "boost": this.tone(270, 860, .42, .08, "sawtooth"); break;
      // The boss uses only its dedicated recording; do not replay the old dull tones.
      case "boss": break;
      case "playerDestroy": this.tone(150, 60, .48, .055, "triangle"); break;
      case "bossDestroy": this.tone(150, 60, .48, .09, "triangle"); break;
      case "nova": [440, 220, 90].forEach((note, step) => this.tone(note, 55, .56, .09, "sawtooth", step * .05)); break;
      case "emp": [980, 730, 490].forEach((note, step) => this.tone(note, 150, .32, .045, "sine", step * .09)); break;
    }
  }

  setEffectsVolume(percent: number) {
    this.effectsVolume = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 100));
    if (this.effectsBus) this.effectsBus.gain.value = effectsGain(this.effectsVolume);
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
    this.limiter = null;
    this.samples.clear();
  }
}

// Keep the instance available immediately. On iOS, resume() can remain pending
// through a fullscreen/navigation transition until another user gesture.
let primedAudio: GameAudio | null = null;
export const primeGameAudio = () => {
  if (!primedAudio) {
    primedAudio = new GameAudio();
    void primedAudio.start();
  }
};
export const takePrimedGameAudio = () => {
  const audio = primedAudio;
  primedAudio = null;
  return audio;
};
export const hasPrimedGameAudio = () => primedAudio !== null;
