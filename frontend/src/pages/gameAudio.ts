import { generateBossSound, bossSoundReferences } from './bossWeaponSound.ts';
import { generateEnemyShotSound } from './enemyWeaponSound.ts';
import type { BossWeaponKind } from './bossWeapons.ts';
import { effectsGain, readEffectsVolume } from "./musicPreferences.ts";
import type { PowerUpType } from "./powerUps.ts";

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
  private enemyShotSample: AudioBuffer | null = null;
  private enemyShotCycle = 0;
  private bossVoices:{source:AudioBufferSourceNode;gain:GainNode;pan:StereoPannerNode|null}[]=[];
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
    try { const resumed=context.resume();this.prepareBossSounds(context);this.prepareEnemySound(context);await resumed; } catch { return false; }
    if (this.context !== context) return false;
    return context.state === "running";
  }

  private prepareBossSounds(context:AudioContext) {
    if(this.bossSamples.size||typeof context.createBuffer!=="function")return;
    for(const kind of Object.keys(bossSoundReferences) as BossWeaponKind[])for(let variant=0;variant<3;variant++){
      const pcm=generateBossSound(kind,variant,context.sampleRate),buffer=context.createBuffer(1,pcm.length,context.sampleRate);
      buffer.copyToChannel(pcm,0);this.bossSamples.set(kind+variant,buffer);
    }
  }

  private prepareEnemySound(context: AudioContext) {
    if (this.enemyShotSample || typeof context.createBuffer !== "function") return;
    const pcm = generateEnemyShotSound(context.sampleRate);
    const buffer = context.createBuffer(1, pcm.length, context.sampleRate);
    buffer.copyToChannel(pcm, 0);
    this.enemyShotSample = buffer;
  }

  playEnemyShot(pan = 0) {
    if (!this.enemyShotSample) return false;
    const rate = [.96, 1, 1.04][this.enemyShotCycle++ % 3];
    return this.playWeaponBuffer(this.enemyShotSample, rate, .3, pan);
  }

  stopBossWeapons(){
    for(const voice of [...this.bossVoices])this.retireBossVoice(voice);
  }
  private retireBossVoice(voice:{source:AudioBufferSourceNode;gain:GainNode;pan:StereoPannerNode|null}){
    const index=this.bossVoices.indexOf(voice);if(index>=0)this.bossVoices.splice(index,1);
    try{const at=this.context!.currentTime;voice.gain.gain.cancelScheduledValues(at);voice.gain.gain.setTargetAtTime(0,at,.003);voice.source.stop(at+.018);}catch{/* Already ended. */}
  }
  playBossWeapon(kind:BossWeaponKind,radius:number,barrels=1,pan=0){
    const context=this.context;if(!context||context.state!=="running"||this.paused||this.effectsVolume===0||!this.effectsBus)return false;
    const relative=radius/bossSoundReferences[kind],variant=relative<.9?0:relative>1.12?2:1,buffer=this.bossSamples.get(kind+variant);
    if(!buffer){this.tone(kind==='laser'?1500:kind==='siege'?85:260,kind==='laser'?430:55,.14,.025);return true;}
    const rate=Math.max(.84,Math.min(1.16,Math.sqrt([.8,1,1.25][variant]/relative)));
    const volume=(kind==='laser'?.34:kind==='pulse'?.42:kind==='plasma'?.52:kind==='heavy'?.65:kind==='siege'?.74:.5)*Math.min(1.15,1+(barrels-1)*.035);
    return this.playWeaponBuffer(buffer,rate,volume,pan);
  }

  private playWeaponBuffer(buffer:AudioBuffer,rate:number,volume:number,pan:number) {
    const context=this.context;if(!context||context.state!=="running"||this.paused||this.effectsVolume===0||!this.effectsBus)return false;
    try{
      while(this.bossVoices.length>=20)this.retireBossVoice(this.bossVoices[0]);
      const source=context.createBufferSource(),gain=context.createGain(),panner=typeof context.createStereoPanner==='function'?context.createStereoPanner():null;
      source.buffer=buffer;source.playbackRate.value=rate;
      gain.gain.value=volume/Math.sqrt(1+this.bossVoices.length*.12);
      source.connect(gain);if(panner){panner.pan.value=Math.max(-.65,Math.min(.65,pan));gain.connect(panner);panner.connect(this.effectsBus);}else gain.connect(this.effectsBus);
      const voice={source,gain,pan:panner};this.bossVoices.push(voice);source.onended=()=>{const index=this.bossVoices.indexOf(voice);if(index>=0)this.bossVoices.splice(index,1);source.disconnect();gain.disconnect();panner?.disconnect();};source.start();return true;
    }catch{/* Audio failure must not stop the fight. */return false;}
  }

  private async loadSamples(context: AudioContext) {
    // Decode only a few samples at once. Mobile WebKit and Chromium can stall
    // the game when every compressed effect is fetched and decoded together.
    let next = 0;
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (next < sampleNames.length && this.context === context) {
        const name = sampleNames[next++];
        try {
          const response = await fetch(`/audio/${name}.mp3`);
          if (!response.ok) continue;
          const sound = await context.decodeAudioData(await response.arrayBuffer());
          if (this.context === context) this.samples.set(name, sound);
        } catch { /* Keep synthesized fallback if audio cannot load or decode. */ }
      }
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
  }

  setSector(sector: number) { void sector; /* Reserved for future sector-specific effects. */ }

  setPaused(paused: boolean) {
    this.paused = paused;
    if(paused)this.stopBossWeapons();
  }

  close() {
    this.setPaused(true);
    void this.context?.close();
    this.context = null;
    this.effectsBus = null;
    this.limiter = null;
    this.samples.clear();
    this.bossSamples.clear();
    this.enemyShotSample = null;
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
