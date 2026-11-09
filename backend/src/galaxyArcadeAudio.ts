import { createDecipheriv } from "node:crypto";
import { galaxyArcadeMusicPayload } from "./galaxyArcadeMusicPayload";
import { arcadeSoundBank, arcadeSoundCues } from "./galaxyArcadeSoundBank";

function openSoundtrack(key: string | undefined) {
  if (!key || !/^[0-9a-f]{64}$/i.test(key)) return "";
  try {
    const sealed = Buffer.from(galaxyArcadeMusicPayload, "base64");
    const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), sealed.subarray(0, 12));
    decipher.setAuthTag(sealed.subarray(12, 28));
    return Buffer.concat([decipher.update(sealed.subarray(28)), decipher.final()]).toString("base64");
  } catch {
    return "";
  }
}

function audioScript(track: string) {
  return `
  // Stream the soundtrack through a media element and decode only the short effects.
  C.arcadeAudio = (() => {
    const track = ${JSON.stringify(track)};
    const clips = ${JSON.stringify(arcadeSoundCues)};
    const voices = new Set();
    const lastCue = new Map();
    let music, buffer, mixer;

    function wakeEffects() {
      try {
        const context = C.audio ||= new (window.AudioContext || window.webkitAudioContext)();
        if (context.state !== 'running') void context.resume().catch(() => {});
        if (mixer) return;
        mixer = context.createDynamicsCompressor();
        mixer.threshold.value = -10;
        mixer.ratio.value = 6;
        mixer.connect(context.destination);
        const bytes = Uint8Array.from(atob('${arcadeSoundBank}'), byte => byte.charCodeAt(0));
        void context.decodeAudioData(bytes.buffer).then(decoded => { buffer = decoded; }).catch(() => {});
      } catch { /* Audio capability must not block a round. */ }
    }

    function play(restart = false) {
      if (!C.soundOn || document.hidden) return;
      // Call play directly from Start, Resume, or the sound toggle's gesture.
      if (track) {
        try {
          if (!music) {
            music = new Audio('data:audio/mpeg;base64,' + track);
            music.loop = true;
          }
          if (restart && music.currentTime > 0) music.currentTime = 0;
          void music.play().catch(() => {});
        } catch { /* A failed media start leaves the controls available. */ }
      }
      wakeEffects();
    }

    function pauseMusic() { music?.pause(); }

    function pause() {
      pauseMusic();
      for (const source of voices) {
        try { source.stop(); } catch { /* The clip may have just ended. */ }
      }
      voices.clear();
      lastCue.clear();
    }

    C.sfx = (name, fallback, length) => {
      const context = C.audio;
      if (!C.soundOn || document.hidden || context?.state !== 'running') return;
      const clip = clips[name];
      if (!buffer || !clip) {
        if (fallback) C.tone(fallback, length);
        return;
      }
      const now = context.currentTime;
      if (voices.size >= 5 || now - (lastCue.get(name) ?? -Infinity) < .09) return;
      const [offset, duration, gain] = clip;
      let source, volume;
      const release = () => {
        voices.delete(source);
        source?.disconnect();
        volume?.disconnect();
      };
      try {
        source = context.createBufferSource();
        volume = context.createGain();
        source.buffer = buffer;
        volume.gain.value = gain;
        source.connect(volume).connect(mixer);
        voices.add(source);
        source.onended = release;
        source.start(0, offset, duration);
        lastCue.set(name, now);
      } catch {
        release();
      }
    };
    window.addEventListener('pagehide', pause);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    return { play, pause, pauseMusic };
  })();
`;
}

const soundEvents = [
  ["C.tone(120,.17)", "C.sfx('collision',120,.17)"],
  ["C.tone(o.gold?1100:760)", "C.sfx('pickup',o.gold?1100:760)"],
  ["C.tone(450,.16)", "C.sfx('boost',450,.16)"],
  ["C.tone(980)", "C.sfx('ring',980)"],
  ["C.tone(920,.16)", "C.sfx('dock',920,.16)"],
  ["C.tone(800)", "C.sfx('ring',800)"],
  ["C.tone(680,.06)", "C.sfx('shot',680,.06)"],
  ["if(t){b.dead=true;if(t.ally)", "if(t){b.dead=true;C.sfx('hit');if(t.ally)"],
  ["C.tone(740,.07)", "C.sfx('missile',740,.07)"],
  ["s.blasts.push({x,y,r:3,max,life:.9,age:0});", "s.blasts.push({x,y,r:3,max,life:.9,age:0});C.sfx('explosion');"],
  ["if(s.v===3)blast(s,b.x,b.y,65);", "if(s.v===3)blast(s,b.x,b.y,65);else C.sfx('hit');"],
  ["C.tone(840,.08)", "C.sfx('pickup',840,.08)"],
  ["C.tone(1060,.12)", "C.sfx('dock',1060,.12)"],
  ["s.fireClock=.28;", "s.fireClock=.28;C.sfx('shot');"],
  ["s.enemyShots++;", "s.enemyShots++;C.sfx('enemy');"],
  ["total:1.2,target,origin};", "total:1.2,target,origin};C.sfx('warning');"],
  ["C.burst(e.x,e.y,'#ffd0a2');", "C.burst(e.x,e.y,'#ffd0a2');C.sfx('explosion');"],
  ["else C.burst(b.x,b.y,'#b4f5f1');", "else{C.burst(b.x,b.y,'#b4f5f1');C.sfx('hit');}"],
  ["C.burst(b.x,b.y,'#9aedf0');", "C.burst(b.x,b.y,'#9aedf0');C.sfx('shield');"],
  ["C.burst(h.f.x,h.f.y,'#ffba97');", "C.burst(h.f.x,h.f.y,'#ffba97');C.sfx(h.f.hp<=0?'explosion':'hit');"],
  ["C.burst(e.x,e.y,'#ffcba5');", "C.burst(e.x,e.y,'#ffcba5');C.sfx('explosion');"],
  ["C.tone(1040,.1)", "C.sfx('pickup',1040,.1)"],
  ["C.tone(220,.12)", "C.sfx('enemy',220,.12)"],
  ["C.tone(510,.12)", "C.sfx('warning',510,.12)"],
] as const;

export function withArcadeAudio(html: string, key: string | undefined) {
  let document = html
    .replace("const input=C.createInput(", () => audioScript(openSoundtrack(key)) + "\nconst input=C.createInput(")
    .replace("C.soundOn=C.storage.get('sound')===1", "C.soundOn=C.storage.get('sound',1)===1")
    .replace("soundLabel();if(C.soundOn)C.tone();", "soundLabel();if(C.soundOn&&C.mode==='running')C.arcadeAudio.play();else C.arcadeAudio.pause();")
    .replace("const token=++startToken;C.mode='loading';", "const token=++startToken;C.mode='loading';C.arcadeAudio.play(true);")
    .replace("if(token!==startToken)return;C.mode='intro';unlock();", "if(token!==startToken)return;C.arcadeAudio.pause();C.mode='intro';unlock();")
    .replace("C.mode='paused';input.clear();", "C.mode='paused';C.arcadeAudio.pause();input.clear();")
    .replace("closeDialog();C.mode='running';$('pause').disabled=false;previous=", "closeDialog();C.mode='running';C.arcadeAudio.play();$('pause').disabled=false;previous=")
    .replace("C.mode='result';input.clear();", "C.mode='result';C.arcadeAudio.pauseMusic();input.clear();")
    .replace("function backToCatalog(){startToken++;detailToken++;", "function backToCatalog(){startToken++;detailToken++;C.arcadeAudio.pause();");

  for (const [before, after] of soundEvents) document = document.replace(before, after);
  return document;
}
