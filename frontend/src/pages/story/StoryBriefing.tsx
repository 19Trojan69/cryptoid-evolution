import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { requestGameFrame, cancelGameFrame } from '../../lib/frameScheduler';
import { useLocale } from '../../i18n';
import type { MusicPlayer } from '../musicPlayback';
import { createCinematic } from './cinematic.js';
import { documentLanguage } from '../../locales/config';
import { storyCues, storySubtitle } from './storyCaptions';
import { storyScenes, type StoryScene } from './storyScenes';
import { storyCopy } from './storyCopy';
import { storyFadeMs } from './storyFades';
import './storyBriefing.css';

type Props = {
  scene: StoryScene;
  withAudio: boolean;
  volume: number;
  prepareAudio: (source: string) => MusicPlayer | null;
  unlocked: boolean;
  onReturn: () => void;
  onFinish: () => void;
};
type Phase = 'covering' | 'briefing' | 'leaving' | 'returning';
const fadeStyle = {
  '--story-game-out': `${storyFadeMs.gameOut}ms`,
  '--story-briefing-in': `${storyFadeMs.briefingIn}ms`,
  '--story-briefing-out': `${storyFadeMs.briefingOut}ms`,
  '--story-game-in': `${storyFadeMs.gameIn}ms`,
} as CSSProperties;
const backdrops = ['nebula.webp', 'amber-galaxy.webp', 'ringed-world.webp'];
const backdropKey = 'cryptoid-story-backdrop';
let lastBackdrop: string | undefined;

function chooseAppearance() {
  let previous = lastBackdrop;
  if (previous === undefined) {
    try { previous = sessionStorage.getItem(backdropKey) ?? undefined; } catch { /* Memory alone is enough to vary subsequent briefings. */ }
  }
  const choices = backdrops.filter(name => name !== previous);
  const backdrop = choices[Math.floor(Math.random() * choices.length)];
  lastBackdrop = backdrop;
  try { sessionStorage.setItem(backdropKey, backdrop); } catch { /* In-memory variation still works. */ }
  return { backdrop, variant: backdrops.indexOf(backdrop), seed: Math.floor(Math.random() * 4294967296) };
}

const loadImage = (name: string) => {
  const image = new Image();
  image.src = '/story/' + name;
  return image.decode().then(() => image);
};

export default function StoryBriefing({ scene, withAudio, volume, prepareAudio, unlocked, onReturn, onFinish }: Props) {
  const { locale } = useLocale();
  const dialogRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appearanceRef = useRef<ReturnType<typeof chooseAppearance> | null>(null);
  const returnRef = useRef(onReturn);
  const finishRef = useRef(onFinish);
  const volumeRef = useRef(volume);
  const transitionRef = useRef<{ phase: Phase; startedAt: number } | null>(null);
  const exitRef = useRef<() => void>(() => {});
  const retryAudioRef = useRef<() => void>(() => {});
  const [artReady, setArtReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('covering');
  const [cueIndex, setCueIndex] = useState(-1);
  const [offerAudioRetry, setOfferAudioRetry] = useState(false);
  const [skipLabel, , retryLabel] = storyCopy(locale);
  const definition = storyScenes[scene];
  const cues = useMemo(() => storyCues(scene, definition.timing), [scene, definition]);
  const translation = storySubtitle(scene, locale, cueIndex);
  const caption = translation ?? (!artReady ? cues[cueIndex]?.text : undefined);

  useEffect(() => {
    returnRef.current = onReturn;
    finishRef.current = onFinish;
    volumeRef.current = volume;
  }, [onReturn, onFinish, volume]);
  useEffect(() => { dialogRef.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const source = '/story/' + definition.audio;
    const story = definition.timing;
    const boss = definition.boss;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = () => media.matches || document.documentElement.dataset.motion === 'reduced';
    const transition = transitionRef.current ??= { phase: 'covering', startedAt: performance.now() };
    const enterPhase = (next: Phase, now: number) => {
      transition.phase = next;
      transition.startedAt = now;
      setPhase(next);
    };
    let cinematic: ReturnType<typeof createCinematic> | undefined;
    let disposed = false, finished = false, frame = 0, lastCue = -1;
    let silentMs = 0, silentStart = performance.now();
    let visualMs = 0, lastVisualAt = silentStart;
    let player: MusicPlayer | null = null;
    let followsAudio = false, playPending = false, playGeneration = 0, suspended = false;
    let lastAudioMs = 0, lastAdvanceAt = silentStart, fadeInAt = 0;
    let audioLevel = 0, exitVolume = 0;

    const position = (now: number) => {
      if (suspended) return silentMs;
      if (followsAudio && player) return Math.max(silentMs, player.audio.currentTime * 1000);
      return silentMs + Math.max(0, now - silentStart);
    };
    const setAudioLevel = (level: number) => {
      if (player?.currentSource !== source || Math.abs(audioLevel - level) < .25) return;
      try { player.setVolume(level); audioLevel = level; } catch { /* The host may manage volume itself. */ }
    };
    const pauseAudio = () => {
      ++playGeneration;
      playPending = false;
      if (player?.currentSource === source) player.pause();
    };
    const showCaptions = () => {
      cinematic?.dispose(); cinematic = undefined;
      resizeObserver?.disconnect();
      canvas.width = canvas.height = 0;
      if (!disposed) setArtReady(false);
    };
    const paint = (ms: number) => {
      try { cinematic?.draw(ms / 1000, reduced(), unlocked); } catch { showCaptions(); }
    };
    const resize = () => {
      if (!cinematic) return;
      const { width, height } = canvas.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.round(width * ratio), h = Math.round(height * ratio);
      if (canvas.width === w && canvas.height === h) return;
      try {
        canvas.width = w; canvas.height = h;
        cinematic.resize(w, h);
        const fadeElapsed = transition.phase === 'leaving' ? Math.max(0, performance.now() - transition.startedAt) : 0;
        paint(visualMs + fadeElapsed);
      } catch { showCaptions(); }
    };
    const tick = (now: number) => {
      frame = 0;
      if (disposed || finished || suspended || document.hidden) return;
      const elapsed = Math.max(0, now - transition.startedAt);
      if (transition.phase === 'covering') {
        if (reduced() || elapsed >= storyFadeMs.gameOut) {
          enterPhase('briefing', now);
          silentStart = lastVisualAt = now;
          play(now);
        } else schedule();
        return;
      }
      if (transition.phase === 'leaving') {
        const progress = reduced() ? 1 : Math.min(1, elapsed / storyFadeMs.briefingOut);
        setAudioLevel(exitVolume * (1 - progress) ** 2);
        if (progress >= 1) revealGame(now);
        else {
          paint(visualMs + elapsed);
          schedule();
        }
        return;
      }
      if (transition.phase === 'returning') {
        if (reduced() || elapsed >= storyFadeMs.gameIn) complete();
        else schedule();
        return;
      }
      const ms = position(now);
      if (followsAudio) {
        if (player?.playing && ms !== lastAudioMs) { lastAudioMs = ms; lastAdvanceAt = now; }
        else if (now - lastAdvanceAt >= 3200) { continueSilently(); return; }
        setAudioLevel(volumeRef.current * Math.min(1, Math.max(0, ms - fadeInAt) / 240));
      }
      if (ms >= story.duration * 1000) { exit(); return; }
      const seconds = ms / 1000;
      const cue = cues.findIndex(line => seconds >= line.start && seconds < line.end);
      if (cue !== lastCue) { lastCue = cue; setCueIndex(cue); }
      if (followsAudio && player?.playing) {
        // The media clock may update less often than the frames. Keep the
        // crawl moving between samples and correct its pace within one cue.
        const delta = Math.max(0, now - lastVisualAt);
        const projected = visualMs + delta;
        const limit = delta * .18;
        const correction = Math.max(-limit, Math.min(limit, (ms - projected) * .18));
        visualMs = Math.max(visualMs, Math.min(ms + 56, Math.max(ms - 64, projected + correction)));
      } else visualMs = Math.max(visualMs, ms);
      lastVisualAt = now;
      paint(visualMs);
      schedule();
    };
    const schedule = () => { if (!frame && !suspended && !document.hidden && !disposed && !finished) frame = requestGameFrame(tick); };
    const stop = () => { cancelGameFrame(frame); frame = 0; };
    const complete = () => {
      if (finished || disposed) return;
      finished = true; stop(); finishRef.current();
    };
    const revealGame = (now: number) => {
      pauseAudio();
      enterPhase('returning', now);
      returnRef.current();
      if (reduced()) complete();
      else schedule();
    };
    const exit = () => {
      if (disposed || finished || transition.phase === 'leaving' || transition.phase === 'returning') return;
      const now = performance.now();
      if (playPending) pauseAudio();
      exitVolume = audioLevel;
      if (reduced()) revealGame(now);
      else {
        enterPhase('leaving', now);
        schedule();
      }
    };
    const continueSilently = () => {
      if (disposed || suspended || document.hidden || transition.phase !== 'briefing') return;
      const now = performance.now();
      silentMs = position(now);
      silentStart = now;
      followsAudio = false;
      pauseAudio();
      setOfferAudioRetry(withAudio);
      schedule();
    };
    const play = (now: number, fromGesture = false) => {
      schedule();
      if (!withAudio || suspended || document.hidden || disposed || finished || transition.phase !== 'briefing'
        || playPending || (followsAudio && player?.playing)) return;
      if (!player) {
        player = prepareAudio(source);
        player?.audio.addEventListener('ended', ended);
        player?.audio.addEventListener('error', audioError);
      }
      if (!player) { continueSilently(); return; }
      silentMs = position(now);
      silentStart = lastAdvanceAt = now;
      fadeInAt = lastAudioMs = silentMs;
      followsAudio = true;
      playPending = true;
      const generation = ++playGeneration;
      setAudioLevel(0);
      const played = (ok: boolean) => {
        if (generation !== playGeneration || disposed || transition.phase !== 'briefing') return;
        playPending = false;
        if (ok) setOfferAudioRetry(false);
        else continueSilently();
      };
      try {
        if (player.audio.error) player.audio.load();
        if (silentMs > 0) player.audio.currentTime = silentMs / 1000;
        if (fromGesture) void player.unlock(true);
        void player.play().then(played, () => played(false));
      } catch { played(false); }
    };
    const suspend = () => {
      if (suspended) return;
      if (transition.phase === 'briefing') silentMs = position(performance.now());
      suspended = true;
      followsAudio = false;
      stop();
      pauseAudio();
    };
    const visibility = () => {
      if (document.hidden) { suspend(); return; }
      const now = performance.now();
      if (suspended) {
        suspended = false;
        silentStart = lastVisualAt = now;
      }
      if (transition.phase === 'briefing') play(now);
      else schedule();
    };
    const ended = () => {
      if (followsAudio && player?.currentSource === source && player.audio.ended && transition.phase === 'briefing') exit();
    };
    const audioError = () => { if (player?.currentSource === source && player.audio.error) continueSilently(); };
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize);
    exitRef.current = exit;
    retryAudioRef.current = () => play(performance.now(), true);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', suspend);
    window.addEventListener('pageshow', visibility);
    window.addEventListener('focus', visibility);
    canvas.addEventListener('contextlost', showCaptions);
    const prepare = async () => {
      const appearance = appearanceRef.current ??= chooseAppearance();
      try {
        const backdrop = loadImage(appearance.backdrop);
        const [nebula, outline, ship] = await Promise.all([
          appearance.variant === 0 ? backdrop : backdrop.catch(() => loadImage(backdrops[0])),
          boss ? loadImage(boss.outline) : undefined,
          boss && unlocked ? loadImage(boss.ship) : undefined,
          document.fonts.load('600 20px Barlow'),
        ]);
        if (disposed || transition.phase === 'leaving' || transition.phase === 'returning') return;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        canvas.width = 0;
        cinematic = createCinematic(context, { nebula, outline, ship, muzzles: boss?.muzzles }, story, (width, height) => {
          const surface = document.createElement('canvas');
          surface.width = width; surface.height = height;
          return surface;
        }, appearance, definition);
        resize();
        if (cinematic) { resizeObserver?.observe(canvas); setArtReady(true); }
      } catch { if (!disposed && transition.phase !== 'leaving' && transition.phase !== 'returning') showCaptions(); }
    };
    if (transition.phase === 'covering' || transition.phase === 'briefing') void prepare();
    visibility();
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', suspend);
      window.removeEventListener('pageshow', visibility);
      window.removeEventListener('focus', visibility);
      canvas.removeEventListener('contextlost', showCaptions);
      player?.audio.removeEventListener('ended', ended);
      player?.audio.removeEventListener('error', audioError);
      stop(); resizeObserver?.disconnect();
      pauseAudio();
      cinematic?.dispose();
      canvas.width = canvas.height = 0;
    };
  }, [definition, cues, withAudio, unlocked, prepareAudio]);

  return <section ref={dialogRef} className="story-briefing" role="dialog" aria-modal="true" tabIndex={-1} aria-label={definition.title}
    data-phase={phase} style={fadeStyle}
    onKeyDown={event => { if (event.key === 'Escape') exitRef.current(); }}>
    <div className="story-briefing-content">
      <div className="story-briefing-frame" data-ready={artReady || undefined}>
        <canvas ref={canvasRef} aria-hidden="true" />
        {caption && <p className={artReady ? 'story-briefing-subtitle' : 'story-briefing-caption'}
          data-translated={Boolean(translation) || undefined}
          lang={translation ? documentLanguage(locale) : 'en'}>{caption}</p>}
      </div>
      {withAudio && offerAudioRetry && phase === 'briefing' &&
        <button className="story-briefing-audio" type="button" onClick={() => retryAudioRef.current()}>{retryLabel}</button>}
      <button className="story-briefing-skip" type="button" disabled={phase !== 'briefing'} onClick={() => exitRef.current()}>{skipLabel}</button>
    </div>
  </section>;
}
