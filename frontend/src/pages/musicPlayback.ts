import { musicGain } from "./musicPreferences.ts";
import { ownerAudioDisabled, noteAudioEvent, captureAudioAuditEvents, audioClockMs } from './ownerAudioAudit.ts';

const closeContext = (context: AudioContext | null) => {
  const auditEvent = captureAudioAuditEvents();
  if (context) auditEvent('music-close-request');
  try { void context?.close().then(() => auditEvent('music-close-ok')).catch(() => auditEvent('music-close-failed')); }
  catch { auditEvent('music-close-failed'); /* A retired audio host cannot interrupt cleanup. */ }
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
  get audioAuditSnapshot() {
    const musicTrack = this.source === '/audio/battle-orbit.mp3' ? 'normal' : this.source === '/audio/dreadnought-duel.mp3' ? 'boss'
      : this.source === '/audio/boss-victory-v2.mp3' ? 'victory' : 'other';
    return { musicState: this.context?.state ?? 'none', musicClockMs: audioClockMs(this.context),
      musicMediaMs: Math.round(this.audio.currentTime * 1000), musicVolume: this.volume,
      musicGain: this.gain?.gain.value ?? this.audio.volume, musicPaused: this.audio.paused,
      musicEnded: this.audio.ended, musicMuted: this.audio.muted, musicTrack };
  }

  // Switching sources on the unlocked media element retains its iOS playback permission
  // and the existing AudioContext/GainNode. A new Audio() here would need a fresh gesture.
  setSource(src: string, resumeAt = 0) {
    if (this.closed || this.source === src) return;
    noteAudioEvent('music-source-switch');
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

  // Resume the existing graph during the Resume gesture without starting the
  // paused media element. The countdown/account request can finish afterwards.
  async unlock(): Promise<boolean> {
    const auditEvent = captureAudioAuditEvents();
    if (ownerAudioDisabled()) { noteAudioEvent('music-blocked'); return false; }
    auditEvent('music-unlock-request');
    if (this.closed) return false;
    this.prepare();
    try {
      if (this.context && this.context.state !== "running") await this.context.resume();
      const ready = !this.closed && (!this.context || this.context.state === "running");
      auditEvent(ready ? 'music-unlock-ok' : 'music-unlock-failed');
      return ready;
    } catch {
      auditEvent('music-unlock-failed');
      return false;
    }
  }

  async play(): Promise<boolean> {
    const auditEvent = captureAudioAuditEvents();
    if (ownerAudioDisabled()) { this.pause(); noteAudioEvent('music-blocked'); return false; }
    auditEvent('music-play-request');
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
      const playing = this.playing;
      auditEvent(playing ? 'music-play-ok' : 'music-play-failed');
      return playing;
    } catch {
      auditEvent('music-play-failed');
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

