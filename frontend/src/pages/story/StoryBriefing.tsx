import { useEffect, useMemo, useRef, useState } from 'react';
import { requestGameFrame, cancelGameFrame } from '../../lib/frameScheduler';
import { useLocale } from '../../i18n';
import { createCinematic } from './cinematic.js';
import { documentLanguage } from '../../locales/config';
import { storyCues, storySubtitle } from './storyCaptions';
import { storyScenes, type StoryScene } from './storyScenes';
import { storyCopy } from './storyCopy';
import './storyBriefing.css';

type Props = { scene: StoryScene; withAudio: boolean; volume: number; unlocked: boolean; onFinish: () => void };
const exitFadeMs = 480;
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

export default function StoryBriefing({ scene, withAudio, volume, unlocked, onFinish }: Props) {
  const { locale } = useLocale();
  const dialogRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const appearanceRef = useRef<ReturnType<typeof chooseAppearance> | null>(null);
  const finishRef = useRef(onFinish);
  const volumeRef = useRef(volume);
  const exitAtRef = useRef<number | null>(null);
  const exitRef = useRef<() => void>(() => {});
  finishRef.current = onFinish;
  volumeRef.current = volume;
  const [artReady, setArtReady] = useState(false);
  const [closing, setClosing] = useState(false);
  const [cueIndex, setCueIndex] = useState(-1);
  const [skipLabel] = storyCopy(locale);
  const definition = storyScenes[scene];
  const cues = useMemo(() => storyCues(scene, definition.timing), [scene, definition]);
  const translation = storySubtitle(scene, locale, cueIndex);
  const caption = translation ?? (!artReady ? cues[cueIndex]?.text : undefined);

  useEffect(() => { dialogRef.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const audio = audioRef.current;
    const story = definition.timing;
    const boss = definition.boss;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = () => media.matches || document.documentElement.dataset.motion === 'reduced';
    let cinematic: ReturnType<typeof createCinematic> | undefined;
    let disposed = false, finished = false, frame = 0, lastCue = -1;
    let silentMs = 0, silentStart = performance.now();
    let followsAudio = Boolean(audio), playGeneration = 0;
    let lastAudioMs = 0, lastAdvanceAt = silentStart, exitVolume = audio?.volume ?? 0;

    const position = (now: number) => followsAudio && audio ? audio.currentTime * 1000
      : silentMs + Math.max(0, now - silentStart);
    const setAudioLevel = (level: number) => {
      if (!audio || Math.abs(audio.volume - level) < .004) return;
      try { audio.volume = level; } catch { /* The host may manage volume itself. */ }
    };
    const useCaptions = () => {
      cinematic?.dispose(); cinematic = undefined;
      resizeObserver?.disconnect();
      canvas.width = canvas.height = 0;
      if (!disposed) setArtReady(false);
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
        cinematic.draw(position(performance.now()) / 1000, reduced(), unlocked);
      } catch { useCaptions(); }
    };
    const tick = (now: number) => {
      frame = 0;
      if (disposed || finished || document.hidden) return;
      if (exitAtRef.current !== null) {
        const progress = reduced() ? 1 : Math.min(1, Math.max(0, (now - exitAtRef.current) / exitFadeMs));
        setAudioLevel(exitVolume * (1 - progress) ** 2);
        if (progress >= 1) { complete(); return; }
        schedule();
        return;
      }
      const ms = position(now);
      if (followsAudio) {
        if (ms !== lastAudioMs) { lastAudioMs = ms; lastAdvanceAt = now; }
        else if (now - lastAdvanceAt >= 3200) { continueSilently(); return; }
        setAudioLevel(volumeRef.current / 100 * Math.min(1, ms / 240));
      }
      if (ms >= story.duration * 1000) { exit(); return; }
      const seconds = ms / 1000;
      const cue = cues.findIndex(line => seconds >= line.start && seconds < line.end);
      if (cue !== lastCue) { lastCue = cue; setCueIndex(cue); }
      try { cinematic?.draw(seconds, reduced(), unlocked); } catch { useCaptions(); }
      schedule();
    };
    const schedule = () => { if (!frame && !document.hidden && !disposed && !finished) frame = requestGameFrame(tick); };
    const stop = () => { cancelGameFrame(frame); frame = 0; };
    const complete = () => {
      if (finished || disposed) return;
      finished = true; stop(); audio?.pause(); finishRef.current();
    };
    const exit = () => {
      if (disposed || exitAtRef.current !== null) return;
      exitAtRef.current = performance.now();
      exitVolume = audio?.volume ?? 0;
      if (reduced()) { complete(); return; }
      setClosing(true);
      schedule();
    };
    const continueSilently = () => {
      if (!followsAudio || disposed || exitAtRef.current !== null) return;
      const now = performance.now();
      silentMs = position(now);
      silentStart = now;
      followsAudio = false;
      audio?.pause();
      schedule();
    };
    const play = () => {
      if (document.hidden || disposed || exitAtRef.current !== null || frame) return;
      silentStart = lastAdvanceAt = performance.now();
      schedule();
      if (!audio || !followsAudio) return;
      const generation = ++playGeneration;
      setAudioLevel(volumeRef.current / 100 * Math.min(1, audio.currentTime / .24));
      try {
        void audio.play().catch(() => {
          if (generation === playGeneration && !document.hidden) continueSilently();
        });
      } catch { continueSilently(); }
    };
    const suspend = () => {
      ++playGeneration;
      if (!followsAudio && frame && exitAtRef.current === null) silentMs = position(performance.now());
      stop(); audio?.pause();
    };
    const visibility = () => {
      if (document.hidden) { suspend(); return; }
      if (exitAtRef.current !== null) schedule();
      else play();
    };
    const playing = () => { if (!followsAudio || document.hidden) audio?.pause(); };
    const ended = () => { if (followsAudio) exit(); };
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize);
    exitRef.current = exit;
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', suspend);
    window.addEventListener('pageshow', visibility);
    canvas.addEventListener('contextlost', useCaptions);
    audio?.addEventListener('playing', playing);
    audio?.addEventListener('ended', ended);
    audio?.addEventListener('error', continueSilently);
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
        if (disposed || exitAtRef.current !== null) return;
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
      } catch { if (!disposed && exitAtRef.current === null) useCaptions(); }
    };
    if (exitAtRef.current !== null) schedule();
    else {
      if (audio?.error) continueSilently();
      play();
      void prepare();
    }
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', suspend);
      window.removeEventListener('pageshow', visibility);
      canvas.removeEventListener('contextlost', useCaptions);
      audio?.removeEventListener('playing', playing);
      audio?.removeEventListener('ended', ended);
      audio?.removeEventListener('error', continueSilently);
      stop(); resizeObserver?.disconnect();
      audio?.pause();
      cinematic?.dispose();
      canvas.width = canvas.height = 0;
    };
  }, [definition, cues, withAudio, unlocked]);

  return <section ref={dialogRef} className="story-briefing" role="dialog" aria-modal="true" tabIndex={-1} aria-label={definition.title}
    data-closing={closing || undefined} style={{ transitionDuration: `${exitFadeMs}ms` }}
    onKeyDown={event => { if (event.key === 'Escape') exitRef.current(); }}>
    <div className="story-briefing-frame" data-ready={artReady || undefined}>
      <canvas ref={canvasRef} aria-hidden="true" />
      {caption && <p className={artReady ? 'story-briefing-subtitle' : 'story-briefing-caption'}
        lang={translation ? documentLanguage(locale) : 'en'}>{caption}</p>}
    </div>
    {withAudio && <audio ref={audioRef} preload="auto" src={'/story/' + definition.audio} />}
    <button className="story-briefing-skip" type="button" disabled={closing} onClick={() => exitRef.current()}>{skipLabel}</button>
  </section>;
}
