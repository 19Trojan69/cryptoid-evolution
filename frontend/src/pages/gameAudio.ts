export type GameSound = "laser" | "enemyHit" | "explosion" | "collision" | "shield" | "pickup" | "boss";

// Original, synthesized arcade sounds: no third-party recordings or music assets.
export class GameAudio {
  private context: AudioContext | null = null;
  private musicTimer: number | null = null;
  private beat = 0;
  private paused = false;
  private sector = 1;

  async start() {
    if (typeof AudioContext === "undefined") return false;
    if (!this.context) this.context = new AudioContext();
    try { await this.context.resume(); } catch { return false; }
    this.paused = false;
    this.startMusic();
    return this.context.state === "running";
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
    oscillator.connect(envelope).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + duration + .01);
  }

  play(sound: GameSound) {
    switch (sound) {
      case "laser": this.tone(920, 330, .085, .025, "sawtooth"); break;
      case "enemyHit": this.tone(440, 170, .11, .06, "triangle"); break;
      case "explosion": this.tone(240, 55, .26, .085, "sawtooth"); this.tone(115, 42, .34, .065, "triangle"); break;
      case "collision": this.tone(180, 45, .38, .13, "sawtooth"); break;
      case "shield": this.tone(420, 1050, .28, .08, "sine"); break;
      case "pickup": [620, 830, 1240].forEach((note, step) => this.tone(note, note * 1.07, .14, .065, "sine", step * .085)); break;
      case "boss": [150, 130, 110].forEach((note, step) => this.tone(note, note * .75, .3, .085, "triangle", step * .22)); break;
    }
  }

  setSector(sector: number) { this.sector = sector; }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (paused && this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    } else if (!paused) this.startMusic();
  }

  private startMusic() {
    if (this.musicTimer !== null || this.paused) return;
    const phrase = [0, 7, 3, 10, 0, 7, 5, 3, 0, 10, 7, 3, 5, 7, 3, 10];
    this.musicTimer = window.setInterval(() => {
      if (document.hidden) return;
      const step = this.beat++ % phrase.length;
      const root = 110 * Math.pow(2, ((this.sector - 1) % 6) / 12);
      const note = root * Math.pow(2, phrase[step] / 12);
      this.tone(note * 2, note * 2, .22, .012, "triangle");
      if (step % 4 === 0) this.tone(root, root, .42, .018, "sine");
    }, 260);
  }

  close() {
    this.setPaused(true);
    void this.context?.close();
    this.context = null;
  }
}
