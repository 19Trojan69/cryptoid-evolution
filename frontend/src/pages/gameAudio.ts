export type GameSound = "laser" | "enemyHit" | "explosion" | "collision" | "shield" | "pickup" | "boost" | "boss" | "bossDestroy";

const sampleNames = ["shot-single", "shot-twin", "shot-rapid", "shot-triple", "shot-plasma", "enemy-hit", "enemy-destroy", "enemy-destroy-alt", "player-collision", "shield", "boost", "boss-destroy"] as const;
type SampleName = typeof sampleNames[number];

// Original, synthesized arcade sounds: no third-party recordings or music assets.
export class GameAudio {
  private context: AudioContext | null = null;
  private effectsBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicTimer: number | null = null;
  private beat = 0;
  private paused = false;
  private musicEnabled = true;
  private sector = 1;
  private samples = new Map<SampleName, AudioBuffer>();
  private sampleRequest: Promise<void> | null = null;
  private lastShotAt = 0;
  private destroyCount = 0;

  async start() {
    if (typeof AudioContext === "undefined") return false;
    if (!this.context) {
      this.context = new AudioContext();
      this.effectsBus = this.context.createGain();
      this.musicBus = this.context.createGain();
      this.effectsBus.connect(this.context.destination);
      this.musicBus.connect(this.context.destination);
      this.musicBus.gain.value = this.musicEnabled ? 1 : 0;
    }
    try { await this.context.resume(); } catch { return false; }
    this.paused = false;
    if (!this.sampleRequest && typeof this.context.decodeAudioData === "function") this.sampleRequest = this.loadSamples(this.context);
    this.startMusic();
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

  private tone(frequency: number, end: number, duration: number, gain: number, type: OscillatorType = "sine", delay = 0, music = false) {
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
    oscillator.connect(envelope).connect(music ? this.musicBus! : this.effectsBus!);
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
      if (chosen && this.sample(chosen, sound === "boss" ? .45 : sound === "explosion" ? .38 : .26)) return;
    }
    switch (sound) {
      case "laser": this.tone(920, 330, .085, .025, "sawtooth"); break;
      case "enemyHit": this.tone(440, 170, .11, .06, "triangle"); break;
      case "explosion": this.tone(240, 55, .26, .085, "sawtooth"); this.tone(115, 42, .34, .065, "triangle"); break;
      case "collision": this.tone(180, 45, .38, .13, "sawtooth"); break;
      case "shield": this.tone(420, 1050, .28, .08, "sine"); break;
      case "pickup": [620, 830, 1240].forEach((note, step) => this.tone(note, note * 1.07, .14, .065, "sine", step * .085)); break;
      case "boost": this.tone(270, 860, .42, .08, "sawtooth"); break;
      case "boss": [150, 130, 110].forEach((note, step) => this.tone(note, note * .75, .3, .085, "triangle", step * .22)); break;
      case "bossDestroy": this.tone(150, 35, .7, .11, "sawtooth"); break;
    }
  }

  setSector(sector: number) { this.sector = sector; }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.context && this.musicBus) this.musicBus.gain.setValueAtTime(enabled ? 1 : 0, this.context.currentTime);
    if (!enabled && this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    } else if (enabled) this.startMusic();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (paused && this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    } else if (!paused) this.startMusic();
  }

  private startMusic() {
    if (this.musicTimer !== null || this.paused || !this.musicEnabled) return;
    const phrase = [0, 7, 3, 10, 0, 7, 5, 3, 0, 10, 7, 3, 5, 7, 3, 10];
    this.musicTimer = window.setInterval(() => {
      if (document.hidden) return;
      const step = this.beat++ % phrase.length;
      const root = 110 * Math.pow(2, ((this.sector - 1) % 6) / 12);
      const note = root * Math.pow(2, phrase[step] / 12);
      this.tone(note * 2, note * 2, .22, .012, "triangle", 0, true);
      if (step % 4 === 0) this.tone(root, root, .42, .018, "sine", 0, true);
    }, 260);
  }

  close() {
    this.setPaused(true);
    void this.context?.close();
    this.context = null;
    this.effectsBus = null;
    this.musicBus = null;
    this.samples.clear();
  }
}

let primedAudio: Promise<GameAudio | null> | null = null;
export const primeGameAudio = () => {
  if (!primedAudio) {
    const audio = new GameAudio();
    audio.setMusicEnabled(false);
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
