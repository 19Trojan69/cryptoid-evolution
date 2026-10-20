import { generateBossSound, bossSoundReferences } from './bossWeaponSound.ts';
import { generateEnemyShotSound, generateEnemyDoubleShotSound, enemySoundProfiles } from './enemyWeaponSound.ts';
import type { CryptoidClass } from './cryptoidRoster.ts';
import type { BossWeaponKind } from './bossWeapons.ts';
import { effectsGain, readEffectsVolume } from "./musicPreferences.ts";
import type { PowerUpType } from "./powerUps.ts";
import { ownerAudioDisabled, audioAuditRecording, noteAudioEvent, captureAudioAuditEvents, noteAudioVoiceStart, noteAudioVoiceEnd, noteAudioVoiceRelease, audioVoiceOverdue, audioClockMs } from './ownerAudioAudit.ts';

export type GameSound = "laser" | "enemyHit" | "explosion" | "collision" | "playerDestroy" | "shield" | "pickup" | "extraLife" | "boost" | "boss" | "bossDestroy" | "nova" | "emp" | "reload";

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

type WeaponVoice = { source: AudioBufferSourceNode; gain: GainNode; pan: StereoPannerNode | null; volume: number };
type EffectVoice = { source: AudioBufferSourceNode | OscillatorNode; gain: GainNode };

// Game effects only; audio starts after a player gesture on browsers that require one.
export class GameAudio {
  private context: AudioContext | null = null;
  private effectsBus: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private paused = false;
  private effectsVolume = readEffectsVolume();
  private samples = new Map<SampleName, AudioBuffer>();
  private sampleRequest: Promise<void> | null = null;
  private bossSamples = new Map<string, AudioBuffer>();
  private enemyShotSamples = new Map<CryptoidClass, AudioBuffer>();
  private enemyDoubleSamples = new Map<CryptoidClass, AudioBuffer>();
  private weaponBus: GainNode | null = null;
  private weaponMixVoices = new Set<WeaponVoice>();
  private enemyShotCycle = 0;
  private bossVoices: WeaponVoice[] = [];
  private lastShotAt = 0;
  private destroyCount = 0;
  private effectVoices = new Set<EffectVoice>();
  private loadController: AbortController | null = null;

  get running() { return this.context?.state === "running"; }

  async start() {
    const auditEvent = captureAudioAuditEvents();
    if (ownerAudioDisabled()) { noteAudioEvent('effects-blocked'); return false; }
    auditEvent('effects-start-request');
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
    if (!this.sampleRequest && typeof context.decodeAudioData === "function") {
      this.loadController = new AbortController();
      this.sampleRequest = this.loadSamples(context, this.loadController.signal);
    }
    auditEvent('effects-resume-request');
    try { const resumed=context.resume();this.prepareBossSounds(context);this.prepareEnemySound(context);await resumed; }
    catch { auditEvent('effects-resume-failed'); return false; }
    if (this.context !== context) return false;
    const running = context.state === "running";
    auditEvent(running ? 'effects-resume-ok' : 'effects-resume-failed');
    return running;
  }

  private prepareBossSounds(context:AudioContext) {
    if(this.bossSamples.size||typeof context.createBuffer!=="function")return;
    for(const kind of Object.keys(bossSoundReferences) as BossWeaponKind[])for(let variant=0;variant<3;variant++){
      const pcm=generateBossSound(kind,variant,context.sampleRate),buffer=context.createBuffer(1,pcm.length,context.sampleRate);
      buffer.copyToChannel(pcm,0);this.bossSamples.set(kind+variant,buffer);
    }
  }

  private prepareEnemySound(context: AudioContext) {
    if (this.enemyShotSamples.size || typeof context.createBuffer !== "function") return;
    for (const shipClass of Object.keys(enemySoundProfiles) as CryptoidClass[]) {
      const pcm = generateEnemyShotSound(context.sampleRate, shipClass);
      const buffer = context.createBuffer(1, pcm.length, context.sampleRate);
      buffer.copyToChannel(pcm, 0);
      this.enemyShotSamples.set(shipClass, buffer);
      const doublePcm = generateEnemyDoubleShotSound(context.sampleRate, shipClass);
      const doubleBuffer = context.createBuffer(1, doublePcm.length, context.sampleRate);
      doubleBuffer.copyToChannel(doublePcm, 0);
      this.enemyDoubleSamples.set(shipClass, doubleBuffer);
    }
  }

  private rockLastAt = -1;
  private rockContext: AudioContext | null = null;
  private rockBuffers = new Map<string, AudioBuffer>();
  playRock(large: boolean, final: boolean) {
    const ctx=this.context;
    if (ctx !== this.rockContext) { this.rockContext = ctx; this.rockBuffers.clear(); this.rockLastAt = -1; }
    if(!ctx||ctx.state!=="running"||this.paused||this.effectsVolume===0||ctx.currentTime-this.rockLastAt<.12)return false;
    this.rockLastAt=ctx.currentTime;
    const key=String(large)+String(final);let buffer=this.rockBuffers.get(key);
    if(!buffer){const duration=final?(large?.25:.18):.065;buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate);const data=buffer.getChannelData(0);let smoothed=0;
      for(let i=0;i<data.length;i++){const t=i/ctx.sampleRate;const noise=Math.random()*2-1;smoothed=smoothed*.58+noise*.42;const cracks=1+.5*Math.sin(t*(large?950:1600))*Math.sin(t*3200);data[i]=(smoothed*.62+noise*.2)*Math.exp(-t/(duration*.23))*cracks;}
      this.rockBuffers.set(key,buffer);}
    return this.playWeaponBuffer(buffer,1,final?.65:.22,0);
  }
  playEnemyShot(pan = 0, shipClass: CryptoidClass = 'light', variant: 'single' | 'double' = 'single') {
    const buffer = (variant === 'double' ? this.enemyDoubleSamples : this.enemyShotSamples).get(shipClass);
    if (!buffer) return false;
    const rate = [.96, 1, 1.04][this.enemyShotCycle++ % 3];
    return this.playWeaponBuffer(buffer, rate, enemySoundProfiles[shipClass].gain * (variant === 'double' ? 1.1 : 1), pan);
  }

  // Every synthesized buffer peaks at <= .72. Reserve headroom for the
  // player's effects/warnings, even while retired voices fade out.
  private updateWeaponMix() {
    if (!this.weaponBus) return;
    let peak = 0;
    for (const voice of this.weaponMixVoices) peak += voice.volume * .72;
    // The effects slider reaches 2x at 100%. Keep the hostile peak budget
    // after that gain as well, before the final shared compressor.
    const budget = .62 / Math.max(1, effectsGain(this.effectsVolume));
    this.weaponBus.gain.value = Math.min(1, budget / Math.max(peak, budget));
  }

  stopBossWeapons(){
    for(const voice of [...this.bossVoices])this.retireBossVoice(voice);
  }
  private retireBossVoice(voice: WeaponVoice){
    const index=this.bossVoices.indexOf(voice);if(index>=0)this.bossVoices.splice(index,1);
    try{const at=this.context!.currentTime;voice.gain.gain.cancelScheduledValues(at);voice.gain.gain.setTargetAtTime(0,at,.003);voice.source.stop(at+.018);}catch{/* Already ended. */}
  }
  playBossWeapon(kind:BossWeaponKind,radius:number,barrels=1,pan=0){
    const context=this.context;if(!context||context.state!=="running"||this.paused||this.effectsVolume===0||!this.effectsBus)return false;
    const relative=radius/bossSoundReferences[kind],variant=relative<.9?0:relative>1.12?2:1,buffer=this.bossSamples.get(kind+variant);
    if(!buffer){this.tone(kind==='laser'?1500:kind==='siege'?85:260,kind==='laser'?430:55,.14,.025);return true;}
    const rate=Math.max(.84,Math.min(1.16,Math.sqrt([.8,1,1.25][variant]/relative)));
    const volume=(kind==='laser'?.4:kind==='pulse'?.48:kind==='plasma'?.57:kind==='heavy'?.68:kind==='siege'?.78:.55)*Math.min(1.15,1+(barrels-1)*.035);
    return this.playWeaponBuffer(buffer,rate,volume,pan);
  }

  private releaseWeaponVoice(voice: WeaponVoice) {
    noteAudioVoiceRelease(voice.source);
    voice.source.onended = null;
    this.weaponMixVoices.delete(voice);
    const index = this.bossVoices.indexOf(voice);
    if (index >= 0) this.bossVoices.splice(index, 1);
    voice.source.disconnect?.();
    voice.gain.disconnect?.();
    voice.pan?.disconnect?.();
    this.updateWeaponMix();
  }

  private playWeaponBuffer(buffer: AudioBuffer, rate: number, volume: number, pan: number) {
    const context = this.context;
    if (!context || context.state !== "running" || this.paused || this.effectsVolume === 0 || !this.effectsBus) return false;
    let voice: WeaponVoice | null = null;
    try {
      if (!this.weaponBus) {
        this.weaponBus = context.createGain();
        this.weaponBus.connect(this.effectsBus);
      }
      while (this.bossVoices.length >= 20) this.retireBossVoice(this.bossVoices[0]);
      const source = context.createBufferSource(), gain = context.createGain();
      const panner = typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null;
      voice = { source, gain, pan: panner, volume };
      source.buffer = buffer;
      source.playbackRate.value = rate;
      gain.gain.value = volume;
      source.connect(gain);
      if (panner) {
        panner.pan.value = Math.max(-.65, Math.min(.65, pan));
        gain.connect(panner);
        panner.connect(this.weaponBus);
      } else gain.connect(this.weaponBus);
      this.bossVoices.push(voice);
      this.weaponMixVoices.add(voice);
      this.updateWeaponMix();
      const playingVoice = voice;
      source.onended = () => { noteAudioVoiceEnd(source); this.releaseWeaponVoice(playingVoice); };
      source.start();
      if (audioAuditRecording()) noteAudioVoiceStart(source, context, context.currentTime + buffer.duration / rate, 'weapons');
      return true;
    } catch {
      // A failed source must not leave a silent voice consuming the mix budget.
      if (voice) this.releaseWeaponVoice(voice);
      return false;
    }
  }

  private async loadSamples(context: AudioContext, signal: AbortSignal) {
    const auditEvent = captureAudioAuditEvents();
    // Decode only a few samples at once. Mobile WebKit and Chromium can stall
    // the game when every compressed effect is fetched and decoded together.
    let next = 0;
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (next < sampleNames.length && this.context === context) {
        const name = sampleNames[next++];
        try {
          const response = await fetch(`/audio/${name}.mp3`, { signal });
          if (!response.ok) { auditEvent('effects-decode-failed'); continue; }
          const sound = await context.decodeAudioData(await response.arrayBuffer());
          if (this.context === context) this.samples.set(name, sound);
        } catch { auditEvent('effects-decode-failed'); /* Keep synthesized fallback if audio cannot load or decode. */ }
      }
    }));
  }

  private releaseEffectVoice(voice: EffectVoice) {
    noteAudioVoiceRelease(voice.source);
    this.effectVoices.delete(voice); voice.source.onended = null;
    voice.source.disconnect?.(); voice.gain.disconnect?.();
  }

  private trackEffect(source: EffectVoice['source'], gain: GainNode) {
    // Track all original sounds; cleanup on ended/pause without truncating voices.
    const voice = { source, gain }; this.effectVoices.add(voice);
    source.onended = () => { noteAudioVoiceEnd(source); this.releaseEffectVoice(voice); };
    return voice;
  }

  private sample(name: SampleName, rate = 1) {
    const context = this.context;
    const buffer = this.samples.get(name);
    if (!context || context.state !== "running" || this.paused || this.effectsVolume === 0 || !buffer || !this.effectsBus || typeof context.createBufferSource !== "function") return false;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    gain.gain.value = sampleGains[name];
    source.connect(gain).connect(this.effectsBus);
    const voice = this.trackEffect(source, gain);
    try { source.start(); } catch { this.releaseEffectVoice(voice); return false; }
    if (audioAuditRecording()) noteAudioVoiceStart(source, context, context.currentTime + buffer.duration / rate, 'effects');
    return true;
  }

  private tone(frequency: number, end: number, duration: number, gain: number, type: OscillatorType = "sine", delay = 0) {
    const context = this.context;
    if (!context || context.state !== "running" || this.paused || this.effectsVolume === 0) return;
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
    const voice = this.trackEffect(oscillator, envelope);
    try { oscillator.start(at); oscillator.stop(at + duration + .01); if (audioAuditRecording()) noteAudioVoiceStart(oscillator, context, at + duration + .01, 'effects'); }
    catch { this.releaseEffectVoice(voice); }
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
      // Distinct major arpeggio and resolving chord, through the effects bus.
      case "extraLife":
        [523.25, 659.25, 783.99, 1046.5].forEach((note, step) => this.tone(note, note, .3, .045, "sine", step * .13));
        [523.25, 659.25, 783.99].forEach(note => this.tone(note, note, .8, .027, "triangle", .58));
        break;
      case "boost": this.tone(270, 860, .42, .08, "sawtooth"); break;
      case "reload":
        this.tone(390, 590, .11, .028, "triangle");
        this.tone(630, 900, .16, .024, "sine", .09);
        break;
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
    this.updateWeaponMix();
  }

  setSector(sector: number) { void sector; /* Reserved for future sector-specific effects. */ }

  setPaused(paused: boolean) {
    this.paused = paused;
    if(paused) {
      this.stopBossWeapons();
      for (const voice of [...this.effectVoices]) {
        try { voice.source.stop(); } catch { /* Already ended. */ }
        this.releaseEffectVoice(voice);
      }
    }
  }

  get activeVoiceCount() { return this.weaponMixVoices.size + this.effectVoices.size; }
  // Polled only by the explicit finite owner audit; no analyser or sound change.
  get audioAuditSnapshot() {
    const effects = audioVoiceOverdue(this.effectVoices), weapons = audioVoiceOverdue(this.weaponMixVoices);
    return { effectsState: this.context?.state ?? 'none', effectsClockMs: audioClockMs(this.context),
      effectsVolume: this.effectsVolume, effectsGain: this.effectsBus?.gain.value ?? 0,
      effectsRegistered: this.effectVoices.size, weaponsRegistered: this.weaponMixVoices.size,
      effectsOverdue: effects.overdue, weaponsOverdue: weapons.overdue, untrackedVoices: effects.untracked + weapons.untracked,
      effectsBuffers: this.samples.size + this.bossSamples.size + this.enemyShotSamples.size + this.enemyDoubleSamples.size,
      effectsBufferBytes: this.diagnosticBufferBytes };
  }
  get diagnosticBufferBytes() {
    let bytes = 0;
    for (const cache of [this.samples, this.bossSamples, this.enemyShotSamples, this.enemyDoubleSamples])
      for (const buffer of cache.values()) bytes += (buffer.length || 0) * (buffer.numberOfChannels || 0) * 4;
    return bytes;
  }
  get diagnosticResourceStats() {
    return {
      audioState: this.context?.state ?? "none",
      audioVoices: this.activeVoiceCount,
      audioWeaponVoices: this.weaponMixVoices.size,
      audioBossVoices: this.bossVoices.length,
      audioEffectVoices: this.effectVoices.size,
      audioSampleBuffers: this.samples.size + this.bossSamples.size + this.enemyShotSamples.size + this.enemyDoubleSamples.size,
      audioRockBuffers: this.rockBuffers.size,
      audioBufferBytes: this.diagnosticBufferBytes,
    };
  }

  close() {
    const auditEvent = captureAudioAuditEvents();
    if (this.context) auditEvent('effects-close-request');
    this.setPaused(true);
    this.loadController?.abort(); this.loadController = null; this.sampleRequest = null;
    for (const voice of [...this.weaponMixVoices]) this.releaseWeaponVoice(voice);
    this.bossVoices = [];
    try { void this.context?.close().then(() => auditEvent('effects-close-ok')).catch(() => auditEvent('effects-close-failed')); }
    catch { auditEvent('effects-close-failed'); /* Host already closed. */ }
    this.effectsBus?.disconnect?.(); this.limiter?.disconnect?.(); this.weaponBus?.disconnect?.();
    this.context = null;
    this.effectsBus = null;
    this.limiter = null;
    this.samples.clear();
    this.bossSamples.clear();
    this.enemyShotSamples.clear();
    this.enemyDoubleSamples.clear();
    this.rockBuffers.clear();
    this.rockContext = null;
    this.rockLastAt = -1;
    this.weaponMixVoices.clear();
    this.weaponBus = null;
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

