import { musicGain } from "./musicPreferences.ts";
import { ownerAudioDisabled, noteAudioEvent, captureAudioAuditEvents, audioClockMs } from './ownerAudioAudit.ts';
import { AudioClockRecovery } from './audioClockRecovery.ts';

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
  private graphReady = false;
  private metadataListener: (() => void) | null = null;
  private volume: number;
  private source: string;
  private closed = false;
  private wantsPlayback = false;
  private clockHealth = new AudioClockRecovery();
  private pauseMuted = false;
  private playRequest: Promise<boolean> | null = null;
  private playbackEpoch = 0;
  private endProgress: { position: number; atMs: number } | null = null;

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
    if (this.graphReady || typeof AudioContext === "undefined") return true;
    if (!this.context) {
      try { this.context = new AudioContext(); }
      catch { return true; /* No media binding: the original HTML fallback is safe. */ }
    }
    const context = this.context;
    let source = this.mediaSource;
    let gain = this.gain;
    try {
      // Allocate/configure the gain before the irreversible media binding.
      // A bound element cannot fall back to HTML output from a closed graph.
      gain ??= context.createGain();
      gain.gain.value = this.pauseMuted ? 0 : musicGain(this.volume);
      source ??= context.createMediaElementSource(this.audio);
      source.connect(gain).connect(context.destination);
      this.gain = gain;
      this.mediaSource = source;
      // The media element is part of this Web Audio graph. Its own volume
      // would otherwise attenuate the signal a second time.
      this.audio.volume = 1;
      this.graphReady = true;
      return true;
    } catch {
      try { source?.disconnect(); } catch { /* Partially initialized graph. */ }
      try { gain?.disconnect(); } catch { /* Partially initialized graph. */ }
      // Keep the same context/nodes so a later gesture can reconnect them
      // without rebinding or replacing the existing unlocked media element.
      this.mediaSource = source;
      this.gain = gain;
      this.audio.pause();
      return false;
    }
  }

  private clearMetadataListener() {
    if (!this.metadataListener) return;
    this.audio.removeEventListener("loadedmetadata", this.metadataListener);
    this.metadataListener = null;
  }

  get currentSource() { return this.source; }
  get playing() { return !this.closed && !this.audio.paused && (!this.context || (this.graphReady && this.context.state === "running")); }
  // The caller supplies active simulation time, so a menu/background pause
  // never consumes the grace period. A host can report playing forever while
  // media time is frozen; that must not hold a completed game transition open.
  waitingForEnd(activeMs: number) {
    if (!this.playing || this.audio.ended) { this.endProgress = null; return false; }
    const position = this.audio.currentTime;
    if (!Number.isFinite(position) || !Number.isFinite(activeMs)) return false;
    if (!this.endProgress) this.endProgress = { position, atMs: activeMs };
    else if (activeMs < this.endProgress.atMs || position !== this.endProgress.position) {
      this.endProgress.position = position; this.endProgress.atMs = activeMs;
    }
    return activeMs - this.endProgress.atMs < 2000;
  }
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
    this.playbackEpoch++; this.playRequest = null;
    this.endProgress = null;
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
      this.gain.gain.setTargetAtTime(this.pauseMuted ? 0 : musicGain(percent), this.context.currentTime, .015);
    } else {
      this.audio.volume = this.pauseMuted ? 0 : musicGain(percent);
    }
  }

  prime(): Promise<boolean> {
    if (ownerAudioDisabled()) { noteAudioEvent('music-blocked'); return Promise.resolve(false); }
    if (this.closed) return Promise.resolve(false);
    // The Admin launch awaits a server request before mounting the game. Load
    // this same media element and unlock its graph while the click is active;
    // neither operation starts the soundtrack during that request.
    try { this.audio.load(); } catch { return Promise.resolve(false); }
    return this.unlock();
  }

  // Resume the existing graph during the Resume gesture without starting the
  // paused media element. The countdown/account request can finish afterwards.
  async unlock(restartPausedGraph = false): Promise<boolean> {
    const auditEvent = captureAudioAuditEvents();
    if (ownerAudioDisabled()) { noteAudioEvent('music-blocked'); return false; }
    auditEvent('music-unlock-request');
    if (this.closed) return false;
    if (!this.prepare()) { auditEvent('music-unlock-failed'); return false; }
    try {
      if (this.context) await this.clockHealth.resume(this.context, restartPausedGraph && this.audio.paused);
      const ready = !this.closed && (!this.context || this.context.state === "running");
      auditEvent(ready ? 'music-unlock-ok' : 'music-unlock-failed');
      return ready;
    } catch {
      auditEvent('music-unlock-failed');
      return false;
    }
  }

  play(): Promise<boolean> {
    if (this.context && this.clockHealth.blocked) this.clockHealth.observe(this.context);
    // A later genuine gesture must still retry an initial autoplay request.
    // Coalesce only the diagnosed/pending frozen-graph recovery path.
    if (this.playRequest && this.clockHealth.blocked) return this.playRequest;
    const request = this.beginPlay();
    this.playRequest = request;
    void request.then(() => { if (this.playRequest === request) this.playRequest = null; });
    return request;
  }

  private async beginPlay(): Promise<boolean> {
    const auditEvent = captureAudioAuditEvents();
    if (ownerAudioDisabled()) { this.pause(); noteAudioEvent('music-blocked'); return false; }
    auditEvent('music-play-request');
    if (this.closed) return false;
    const epoch = this.playbackEpoch;
    this.wantsPlayback = true;
    if (!this.prepare()) { auditEvent('music-play-failed'); return false; }
    if (this.pauseMuted) {
      this.pauseMuted = false;
      if (this.gain) this.gain.gain.value = musicGain(this.volume);
      else this.audio.volume = musicGain(this.volume);
    }
    try {
      // Start both while still inside the user gesture on mobile Safari.
      const resume = this.context ? this.clockHealth.resume(this.context) : Promise.resolve();
      const playback = this.audio.paused ? this.audio.play() : Promise.resolve();
      await Promise.all([resume, playback]);
      // A pending play may resolve after mute, pause, route change or a track switch.
      if (this.closed || !this.wantsPlayback) { this.audio.pause(); return false; }
      if (epoch !== this.playbackEpoch) return false;
      const playing = this.playing;
      auditEvent(playing ? 'music-play-ok' : 'music-play-failed');
      return playing;
    } catch {
      auditEvent('music-play-failed');
      return false;
    }
  }

  pause() {
    this.playbackEpoch++; this.playRequest = null;
    this.endProgress = null;
    this.wantsPlayback = false; this.audio.pause(); this.clockHealth.pause();
    // Also silence the existing graph while a native play() promise is pending.
    // Unlocking during the countdown must not restore this gain until play().
    this.pauseMuted = true;
    if (this.gain) {
      this.gain.gain.cancelScheduledValues?.(this.context!.currentTime);
      this.gain.gain.value = 0;
    } else this.audio.volume = 0;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.graphReady = false;
    this.endProgress = null;
    this.playbackEpoch++; this.playRequest = null;
    this.clockHealth.reset();
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
export const primeGameMusic = (volume: number) => {
  if (ownerAudioDisabled()) { noteAudioEvent('music-blocked'); return null; }
  try {
    const player = primedGameMusic ?? new MusicPlayer('/audio/battle-orbit.mp3', volume);
    primedGameMusic = player;
    player.setVolume(volume);
    void player.prime();
    return player;
  } catch {
    // An unavailable audio host must not prevent the existing game request.
    cancelPrimedGameMusic(primedGameMusic);
    return null;
  }
};
export const cancelPrimedGameMusic = (player: MusicPlayer | null) => {
  if (!player || primedGameMusic !== player) return;
  primedGameMusic = null;
  player.close();
};
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

