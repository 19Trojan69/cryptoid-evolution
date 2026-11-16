import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { adminText } from '../adminLocale';
import { BOSS_NAMES } from './bossNames';
import { MusicPlayer } from './musicPlayback';
import { MUSIC_STORAGE_KEY, readMusicVolume } from './musicPreferences';
import StoryBriefing from './story/StoryBriefing';
import { bossOutroAtSector, bossStoryAtSector, levelStoryAtSector, storyScenes, type StoryScene } from './story/storyScenes';

const levels = BOSS_NAMES.flatMap((name, index) => {
  const level = index + 1;
  const bossSector = level * 10;
  const briefing = levelStoryAtSector(bossSector - 9);
  const intro = bossStoryAtSector(bossSector);
  const outro = bossOutroAtSector(bossSector);
  return briefing || intro || outro ? [{ level, name, briefing, intro, outro }] : [];
});
const seconds = new Intl.NumberFormat('de-AT', { maximumFractionDigits: 1 });
const ignoreReturn = () => {};

export default function AdminStoryScenes({ onStartPreview }: { onStartPreview: () => void }) {
  const [preview, setPreview] = useState<{ scene: StoryScene; volume: number; unlocked: boolean; playback?: Promise<boolean> } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const playerRef = useRef<MusicPlayer | null>(null);

  useEffect(() => () => playerRef.current?.close(), []);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!preview || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [preview]);

  const start = (scene: StoryScene, unlocked = false) => {
    onStartPreview();
    const volume = localStorage.getItem(MUSIC_STORAGE_KEY) === 'off' ? 0 : readMusicVolume();
    playerRef.current?.close();
    const player = volume > 0 ? new MusicPlayer('/story/' + storyScenes[scene].audio, 0) : null;
    playerRef.current = player;
    if (player) player.audio.loop = false;
    // Keep the playback request made during the tap. The briefing fades in its gain.
    setPreview({ scene, volume, unlocked, playback: player?.play() });
  };
  const prepareAudio = useCallback((source: string) => {
    const player = playerRef.current;
    return player?.currentSource === source ? player : null;
  }, []);
  const finish = useCallback(() => {
    playerRef.current?.close();
    playerRef.current = null;
    setPreview(null);
  }, []);

  const sceneButton = (scene: StoryScene, label: string, unlocked = false) => (
    <button className="admin-button admin-story-scene" type="button" aria-haspopup="dialog" onClick={() => start(scene, unlocked)}>
      <span>{label}</span>
      <strong lang="en">{storyScenes[scene].chapterTitle}</strong>
      <small>{seconds.format(storyScenes[scene].timing.duration)} s</small>
    </button>
  );

  return <section className="admin-panel" aria-labelledby="admin-story-heading">
    <h2 id="admin-story-heading">{adminText('Story-Szenen')}</h2>
    <div className="admin-story-grid">
      {sceneButton('campaign', 'Spieleinleitung · Beim Start')}
    </div>
    {levels.map(({ level, name, briefing, intro, outro }) => (
      <section className="admin-story-level" key={level}>
        <h3>{`${adminText('Level')} ${level} · ${name}`}</h3>
        <div className="admin-story-grid">
          {briefing && sceneButton(briefing, 'Level-Briefing')}
          {intro && sceneButton(intro, 'Boss-Intro')}
          {outro && sceneButton(outro, 'Boss-Outro', true)}
        </div>
      </section>
    ))}
    {preview && <dialog ref={dialogRef} className="admin-story-preview" aria-label={storyScenes[preview.scene].chapterTitle}
      onCancel={event => { event.preventDefault(); finish(); }}>
      <StoryBriefing preview={preview} scene={preview.scene} withAudio={preview.volume > 0} volume={preview.volume}
        unlocked={preview.unlocked} prepareAudio={prepareAudio} onReturn={ignoreReturn} onFinish={finish} />
    </dialog>}
  </section>;
}
