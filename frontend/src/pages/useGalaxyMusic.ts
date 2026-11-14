import { useCallback, useEffect, useRef, useState } from 'react';
import { MusicPlayer } from './musicPlayback';
import { DEFAULT_MUSIC_VOLUME, MUSIC_STORAGE_KEY, readMusicVolume } from './musicPreferences';

const source = '/audio/keep-a-light-on.mp3';
const fadeMs = 220;

function readVolume() {
  try { return readMusicVolume() * 0.4; }
  catch { return DEFAULT_MUSIC_VOLUME * 0.4; }
}

export function useGalaxyMusic(active: boolean) {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(MUSIC_STORAGE_KEY) !== 'off'; }
    catch { return true; }
  });
  const [playing, setPlaying] = useState(false);
  const enabledRef = useRef(enabled);
  const player = useRef<MusicPlayer | null>(null);
  const leaving = useRef(false);

  const start = useCallback((fromGesture = false) => {
    if (!active || !enabledRef.current || leaving.current || document.hidden) return;
    const volume = readVolume();
    if (!volume) return;
    try {
      const music = player.current ??= new MusicPlayer(source, volume);
      music.setVolume(volume);
      if (!music.playing) {
        if (fromGesture) void music.unlock(true);
        void music.play().then(() => {
          if (player.current === music && enabledRef.current && !leaving.current) setPlaying(music.playing);
        });
      }
    } catch { /* Audio availability must never prevent exploring the map. */ }
  }, [active]);

  const stop = useCallback(() => {
    player.current?.pause();
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onGesture = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('[data-galaxy-music]')) return;
      start(true);
    };
    const onVisibility = () => { if (document.hidden) stop(); else start(); };
    const onShow = () => { leaving.current = false; start(); };
    document.addEventListener('click', onGesture, true);
    document.addEventListener('touchend', onGesture, true);
    document.addEventListener('keydown', onGesture, true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', onShow);
    start();
    return () => {
      document.removeEventListener('click', onGesture, true);
      document.removeEventListener('touchend', onGesture, true);
      document.removeEventListener('keydown', onGesture, true);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', stop);
      window.removeEventListener('pageshow', onShow);
      player.current?.close();
      player.current = null;
    };
  }, [active, start, stop]);

  const toggle = () => {
    const next = !player.current?.playing;
    enabledRef.current = next;
    setEnabled(next);
    try { localStorage.setItem(MUSIC_STORAGE_KEY, next ? 'on' : 'off'); } catch { /* Session only. */ }
    if (next) start(true);
    else stop();
  };

  const resume = useCallback(() => {
    leaving.current = false;
    player.current?.setVolume(readVolume());
    start();
  }, [start]);

  const fadeOut = useCallback(async (signal: AbortSignal) => {
    if (signal.aborted) return;
    leaving.current = true;
    const music = player.current;
    if (music?.playing && readVolume()) {
      music.setVolume(0);
      await new Promise<void>(resolve => {
        const finish = () => {
          window.clearTimeout(timer);
          signal.removeEventListener('abort', finish);
          resolve();
        };
        const timer = window.setTimeout(finish, fadeMs);
        signal.addEventListener('abort', finish, { once: true });
      });
    }
    if (signal.aborted) resume();
    else stop();
  }, [resume, stop]);

  return { enabled, playing, toggle, fadeOut, resume };
}
