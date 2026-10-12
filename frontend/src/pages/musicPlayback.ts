import { musicGain } from "./musicPreferences.ts";

const closeContext = (context: AudioContext | null) => {
  try { void context?.close().catch(() => {}); } catch { /* A retired audio host cannot interrupt cleanup. */ }
};

// A GainNode controls music on iOS, where HTMLMediaElement.volume can be ignored.
export class MusicPlayer {
  readonly audio: HTMLAudioElement;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private metadataListener: (() => void) | null = null;
  private volume: number;
  private source: string;
  private closed = false;
  private wantsPlayback = false;

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
    let context: AudioContext | null = null;
    let source: MediaElementAudioSourceNode | null = null;
    let gain: GainNode | null = null;
    try {
      context = new AudioContext();
      source = context.createMediaElementSource(this.audio);
      gain = context.createGain();
      gain.gain.value = musicGain(this.volume);
      source.connect(gain).connect(context.destination);
      this.context = context;
      this.gain = gain;
      this.mediaSource = source;
      // The media element is part of this Web Audio graph. Its own volume
      // would otherwise attenuate the signal a second time.
      this.audio.volume = 1;
    } catch {
      try { source?.disconnect(); } catch { /* Partially initialized graph. */ }
      try { gain?.disconnect(); } catch { /* Partially initialized graph. */ }
      closeContext(context);
    }
  }

  private clearMetadataListener() {
    if (!this.metadataListener) return;
    this.audio.removeEventListener("loadedmetadata", this.metadataListener);
    this.metadataListener = null;
  }

  get currentSource() { return this.source; }
  get playing() { return !this.closed && !this.audio.paused && (!this.context || this.context.state === "running"); }

  // Switching sources on the unlocked media element retains its iOS playback permission
  // and the existing AudioContext/GainNode. A new Audio() here would need a fresh gesture.
  setSource(src: string, resumeAt = 0) {
    if (this.closed || this.source === src) return;
    this.clearMetadataListener();
    this.audio.pause();
    this.source = src;
    this.audio.src = src;
    this.audio.load();
    if (resumeAt > 0) {
      const loaded = () => {
        if (this.metadataListener !== loaded) return;
        this.clearMetadataListener();
        if (!this.closed && this.source === src) this.audio.currentTime = Math.min(resumeAt, this.audio.duration || resumeAt);
      };
      this.metadataListener = loaded;
      this.audio.addEventListener("loadedmetadata", loaded, { once: true });
    }
  }

  setVolume(percent: number) {
    this.volume = percent;
    if (this.context && this.gain) {
      this.audio.volume = 1;
      this.gain.gain.setTargetAtTime(musicGain(percent), this.context.currentTime, .015);
    } else {
      this.audio.volume = musicGain(percent);
    }
  }

  async play(): Promise<boolean> {
    if (this.closed) return false;
    this.wantsPlayback = true;
    this.prepare();
    try {
      // Start both while still inside the user gesture on mobile Safari.
      const resume = this.context && this.context.state !== "running" ? this.context.resume() : Promise.resolve();
      const playback = this.audio.paused ? this.audio.play() : Promise.resolve();
      await Promise.all([resume, playback]);
      // A pending play may resolve after mute, pause, route change or a track switch.
      if (this.closed || !this.wantsPlayback) { this.audio.pause(); return false; }
      return this.playing;
    } catch {
      return false;
    }
  }

  pause() { this.wantsPlayback = false; this.audio.pause(); }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.wantsPlayback = false;
    this.clearMetadataListener();
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    try { this.mediaSource?.disconnect(); } catch { /* Host already disconnected. */ }
    try { this.gain?.disconnect(); } catch { /* Host already disconnected. */ }
    closeContext(this.context);
    this.context = null;
    this.gain = null;
    this.mediaSource = null;
  }
}

// Preserve the media element and its unlocked AudioContext across the route
// transition. Mobile Safari may reject a brand-new player's autoplay.
let primedGameMusic: MusicPlayer | null = null;
export const handoffGameMusic = (player: MusicPlayer) => {
  if (primedGameMusic && primedGameMusic !== player) primedGameMusic.close();
  primedGameMusic = player;
  player.setSource("/audio/battle-orbit.mp3");
  void player.play();
};
export const takeHandoffGameMusic = () => {
  const player = primedGameMusic;
  primedGameMusic = null;
  return player;
};

