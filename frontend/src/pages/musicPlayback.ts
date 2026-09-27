import { musicGain } from "./musicPreferences.ts";

// A GainNode controls music on iOS, where HTMLMediaElement.volume can be ignored.
export class MusicPlayer {
  readonly audio: HTMLAudioElement;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private volume: number;
  private source: string;
  private closed = false;

  constructor(src: string, volume: number) {
    this.audio = new Audio(src);
    this.source = src;
    this.audio.loop = true;
    this.audio.preload = "auto";
    this.volume = volume;
    // Fallback for browsers without Web Audio.
    this.audio.volume = musicGain(volume);
  }

  private prepare() {
    if (this.context || typeof AudioContext === "undefined") return;
    const context = new AudioContext();
    try {
      const source = context.createMediaElementSource(this.audio);
      const gain = context.createGain();
      gain.gain.value = musicGain(this.volume);
      source.connect(gain).connect(context.destination);
      this.context = context;
      this.gain = gain;
    } catch {
      void context.close();
    }
  }

  get currentSource() { return this.source; }

  // Switching sources on the unlocked media element retains its iOS playback permission
  // and the existing AudioContext/GainNode. A new Audio() here would need a fresh gesture.
  setSource(src: string, resumeAt = 0) {
    if (this.closed || this.source === src) return;
    this.audio.pause();
    this.source = src;
    this.audio.src = src;
    this.audio.load();
    if (resumeAt > 0) {
      this.audio.addEventListener("loadedmetadata", () => {
        if (this.source === src) this.audio.currentTime = Math.min(resumeAt, this.audio.duration || resumeAt);
      }, { once: true });
    }
  }

  setVolume(percent: number) {
    this.volume = percent;
    this.audio.volume = musicGain(percent);
    if (this.context && this.gain) this.gain.gain.setTargetAtTime(musicGain(percent), this.context.currentTime, .015);
  }

  async play(): Promise<boolean> {
    if (this.closed) return false;
    this.prepare();
    try {
      // Start both while still inside the user gesture on mobile Safari.
      const resume = this.context && this.context.state !== "running" ? this.context.resume() : Promise.resolve();
      const playback = this.audio.paused ? this.audio.play() : Promise.resolve();
      await Promise.all([resume, playback]);
      return !this.closed && !this.audio.paused && (!this.context || this.context.state === "running");
    } catch {
      return false;
    }
  }

  pause() { this.audio.pause(); }

  close() {
    this.closed = true;
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    void this.context?.close();
    this.context = null;
    this.gain = null;
  }
}
