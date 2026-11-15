import { useEffect, useRef, useState } from 'react';
import { requestGameFrame, cancelGameFrame } from '../../lib/frameScheduler';
import { useLocale } from '../../i18n';
import { createCinematic } from './cinematic.js';
import { setStoryBriefingsEnabled, type StoryScene } from './storyPreferences';
import { storyCopy } from './storyCopy';
import timing from './storyTiming.json';
import muzzles from './muzzles.json';
import './storyBriefing.css';

type Props = { scene: StoryScene; withAudio: boolean; volume: number; unlocked: boolean; onFinish: () => void };
const loadImage = (name: string) => {
  const image = new Image();
  image.src = '/story/' + name;
  return image.decode().then(() => image);
};

export default function StoryBriefing({ scene, withAudio, volume, unlocked, onFinish }: Props) {
  const { locale } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const [needsPlay, setNeedsPlay] = useState(false);
  const [ready, setReady] = useState(false);
  const [caption, setCaption] = useState('');
  const [playLabel, skipLabel, disableLabel] = storyCopy(locale);
  const title = scene === 'varneth' ? 'Varneth' : 'Cryptoid Evolution';

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [volume]);
  useEffect(() => { skipRef.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const audio = audioRef.current;
    const story = timing[scene];
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false, frame = 0, silentMs = 0, silentStart = 0;
    let cinematic: ReturnType<typeof createCinematic> | undefined;
    let fallback = false, lastCaption = -1;
    let listening = false;
    const resize = () => {
      if (!cinematic) return;
      const { width, height } = canvas.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.round(width * ratio), h = Math.round(height * ratio);
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w; canvas.height = h;
      cinematic.resize(w, h);
      cinematic.draw(audio?.currentTime ?? silentMs / 1000, media.matches, unlocked);
    };
    const tick = (now: number) => {
      if (disposed || document.hidden) { frame = 0; return; }
      const ms = audio ? audio.currentTime * 1000 : silentMs + now - silentStart;
      if (!audio && ms >= story.duration * 1000) { finishRef.current(); return; }
      if (fallback) {
        const next = story.groups.findIndex(group => group.words[0].start > ms / 1000);
        const index = next === -1 ? story.groups.length - 1 : next - 1;
        if (index !== lastCaption) {
          lastCaption = index;
          setCaption(story.groups[index]?.words.map(word => word.text).join(' ') ?? '');
        }
      } else cinematic?.draw(ms / 1000, media.matches, unlocked);
      frame = requestGameFrame(tick);
    };
    const stop = () => { cancelGameFrame(frame); frame = 0; };
    const start = () => {
      if (disposed || document.hidden || frame) return;
      silentStart = performance.now();
      frame = requestGameFrame(tick);
    };
    const play = () => {
      if (document.hidden || disposed) return;
      if (!audio) { start(); return; }
      void audio.play().catch(() => { if (!disposed && !document.hidden) setNeedsPlay(true); });
    };
    const visibility = () => {
      if (!document.hidden) { play(); return; }
      if (!audio && frame) silentMs += performance.now() - silentStart;
      stop(); audio?.pause();
    };
    const playing = () => { setNeedsPlay(false); start(); };
    const finish = () => finishRef.current();
    const resizeObserver = new ResizeObserver(resize);
    const prepare = async () => {
      try {
        const [nebula, outline, ship] = await Promise.all([
          loadImage('nebula.webp'),
          scene === 'varneth' ? loadImage('outline.webp') : undefined,
          scene === 'varneth' && unlocked ? loadImage('ship.webp') : undefined,
          document.fonts.load('600 20px Barlow'),
        ]);
        if (disposed) return;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        canvas.width = 0;
        cinematic = createCinematic(context, { nebula, outline, ship, muzzles }, story, (width, height) => {
          const surface = document.createElement('canvas');
          surface.width = width; surface.height = height;
          return surface;
        });
        resize();
        resizeObserver.observe(canvas);
      } catch { fallback = true; }
      if (disposed) return;
      if (audio?.error) { finish(); return; }
      document.addEventListener('visibilitychange', visibility);
      audio?.addEventListener('playing', playing);
      audio?.addEventListener('pause', stop);
      audio?.addEventListener('waiting', stop);
      audio?.addEventListener('ended', finish);
      audio?.addEventListener('error', finish);
      listening = true;
      setReady(true);
      play();
    };
    void prepare();
    return () => {
      disposed = true;
      if (listening) {
        document.removeEventListener('visibilitychange', visibility);
        audio?.removeEventListener('playing', playing);
        audio?.removeEventListener('pause', stop);
        audio?.removeEventListener('waiting', stop);
        audio?.removeEventListener('ended', finish);
        audio?.removeEventListener('error', finish);
      }
      stop(); resizeObserver.disconnect();
      audio?.pause();
      cinematic?.dispose();
      canvas.width = canvas.height = 0;
    };
  }, [scene, withAudio, unlocked]);

  return <section className="story-briefing" role="dialog" aria-modal="true" aria-label={title}
    onKeyDown={event => { if (event.key === 'Escape') { audioRef.current?.pause(); onFinish(); } }}>
    <canvas ref={canvasRef} aria-hidden="true" />
    {caption && <p className="story-briefing-caption" lang="en">{caption}</p>}
    {withAudio && <audio ref={audioRef} preload="auto" src={scene === 'varneth' ? '/story/varneth-intro.mp3' : '/story/campaign-intro.mp3'} />}
    <footer>
      {ready && needsPlay && <button className="button button-primary" type="button" onClick={() => void audioRef.current?.play().catch(() => {})}>{playLabel}</button>}
      <button ref={skipRef} className="button button-secondary" type="button" onClick={() => { audioRef.current?.pause(); onFinish(); }}>{skipLabel}</button>
      <button className="button button-secondary" type="button" onClick={() => { setStoryBriefingsEnabled(false); audioRef.current?.pause(); onFinish(); }}>{disableLabel}</button>
    </footer>
  </section>;
}
