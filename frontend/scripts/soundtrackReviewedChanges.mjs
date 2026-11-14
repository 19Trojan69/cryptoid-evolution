// Restore only the soundtrack changes against the published Testnet controller.
const soundtrackChanges = [
  {
    "before": "const BOSS_VICTORY_VOLUME_BOOST = 1.6;\n// Let the deep impact lead before its long tail overlaps the victory cue.\n",
    "after": "const BOSS_VICTORY_VOLUME_BOOST = 1.6;\nconst BONUS_MUSIC_SOURCE = \"/audio/bonus-orbit.mp3\";\nconst COMPLETION_MUSIC_SOURCE = \"/audio/level-complete.mp3\";\n// Let the deep impact lead before its long tail overlaps the victory cue.\n"
  },
  {
    "before": "  const regularMusicPositionRef = useRef(0);\n  const soundRef = useRef<GameAudio | null>(null);\n",
    "after": "  const regularMusicPositionRef = useRef(0);\n  const hasBonusMusic = shipSaveNetwork === \"testnet\" && game.encounter === \"bonus\";\n  const bonusMusicEnding = hasBonusMusic && game.phase === \"SECTOR_CLEAR\"\n    && (game.status === \"playing\" || game.status === \"paused\");\n  const hasCompletionMusic = shipSaveNetwork === \"testnet\" && bossSummary !== null;\n  const completionMusicVisible = hasCompletionMusic && !rewardCards.length && !homePrompt;\n  const completionMusicVisibleRef = useRef(completionMusicVisible);\n  completionMusicVisibleRef.current = completionMusicVisible;\n  const soundRef = useRef<GameAudio | null>(null);\n"
  },
  {
    "before": "    const resume = () => {\n      if (document.visibilityState === \"hidden\" || (backgroundHiddenAtRef.current && Date.now() - backgroundHiddenAtRef.current > 1_000) || ![\"playing\", \"game-over\", \"victory\"].includes(stateRef.current.status)) return;\n      void track.play();\n    };\n",
    "after": "    const resume = () => {\n      if (document.visibilityState === \"hidden\" || (backgroundHiddenAtRef.current && Date.now() - backgroundHiddenAtRef.current > 1_000)) return;\n      const status = stateRef.current.status;\n      const canResume = track.currentSource === COMPLETION_MUSIC_SOURCE\n        ? completionMusicVisibleRef.current && status === \"paused\" && !track.audio.ended\n        : [\"playing\", \"game-over\", \"victory\"].includes(status);\n      if (!canResume) return;\n      void track.play();\n    };\n    const pauseCompletionMusic = () => {\n      if (track.currentSource === COMPLETION_MUSIC_SOURCE) track.pause();\n    };\n    const onVisibilityChange = () => {\n      if (document.hidden) pauseCompletionMusic();\n      else resume();\n    };\n"
  },
  {
    "before": "    document.addEventListener(\"keydown\", resume, true);\n    document.addEventListener(\"visibilitychange\", resume);\n    window.addEventListener(\"pageshow\", resume);\n",
    "after": "    document.addEventListener(\"keydown\", resume, true);\n    document.addEventListener(\"visibilitychange\", onVisibilityChange);\n    window.addEventListener(\"pagehide\", pauseCompletionMusic);\n    window.addEventListener(\"pageshow\", resume);\n"
  },
  {
    "before": "      document.removeEventListener(\"keydown\", resume, true);\n      document.removeEventListener(\"visibilitychange\", resume);\n      window.removeEventListener(\"pageshow\", resume);\n",
    "after": "      document.removeEventListener(\"keydown\", resume, true);\n      document.removeEventListener(\"visibilitychange\", onVisibilityChange);\n      window.removeEventListener(\"pagehide\", pauseCompletionMusic);\n      window.removeEventListener(\"pageshow\", resume);\n"
  },
  {
    "before": "    const waitingForExplosion = game.encounter === \"boss-clear\" && bossVictoryPendingRef.current;\n    const desiredSource = game.status === \"game-over\" ? \"/audio/last-signal.mp3\"\n      : game.status === \"victory\" ? \"/audio/beyond-the-last-star.mp3\"\n      : game.encounter === \"boss-clear\"\n",
    "after": "    const waitingForExplosion = game.encounter === \"boss-clear\" && bossVictoryPendingRef.current;\n    if (bonusMusicEnding && !hasCompletionMusic\n      && (bossSummaryRef.current?.accepted || track.currentSource !== BONUS_MUSIC_SOURCE)) {\n      track.pause();\n      return;\n    }\n    const desiredSource = game.status === \"game-over\" ? \"/audio/last-signal.mp3\"\n      : game.status === \"victory\" ? \"/audio/beyond-the-last-star.mp3\"\n      : hasCompletionMusic ? COMPLETION_MUSIC_SOURCE\n      : hasBonusMusic ? BONUS_MUSIC_SOURCE\n      : game.encounter === \"boss-clear\"\n"
  },
  {
    "before": "        : normalSource;\n    track.audio.loop = game.status === \"playing\" && (game.encounter !== \"boss-clear\" || waitingForExplosion || bossVictoryFinishedRef.current);\n    if (track.currentSource !== desiredSource) {\n",
    "after": "        : normalSource;\n    track.audio.loop = !hasCompletionMusic && game.status === \"playing\"\n      && (game.encounter !== \"boss-clear\" || waitingForExplosion || bossVictoryFinishedRef.current);\n    if (track.currentSource !== desiredSource) {\n"
  },
  {
    "before": "    }\n    if (game.status === \"playing\" || game.status === \"game-over\" || game.status === \"victory\") void track.play();\n    else if (game.status !== \"loading\") track.pause();\n  }, [game.status, game.encounter, musicEnabled]);\n  useEffect(() => {\n    const volume = game.status === \"playing\" && game.encounter === \"boss-clear\"\n      ? Math.min(100, musicVolume * BOSS_VICTORY_VOLUME_BOOST)\n      : musicVolume;\n    musicRef.current?.setVolume(volume);\n  }, [musicVolume, game.encounter, game.status]);\n  const startBossVictory = () => {\n",
    "after": "    }\n    const playCompletion = completionMusicVisible && !document.hidden && !track.audio.ended;\n    if (playCompletion || game.status === \"playing\" || game.status === \"game-over\" || game.status === \"victory\") void track.play();\n    else if (game.status !== \"loading\") track.pause();\n  }, [game.status, game.encounter, musicEnabled, hasBonusMusic, bonusMusicEnding, hasCompletionMusic, completionMusicVisible]);\n  useEffect(() => {\n    const fadeBonus = bonusMusicEnding && !hasCompletionMusic;\n    const volume = game.status === \"playing\" && game.encounter === \"boss-clear\"\n      ? Math.min(100, musicVolume * BOSS_VICTORY_VOLUME_BOOST)\n      : fadeBonus ? 0 : musicVolume;\n    musicRef.current?.setVolume(volume, fadeBonus ? .12 : undefined);\n  }, [musicVolume, game.encounter, game.status, bonusMusicEnding, hasCompletionMusic]);\n  const startBossVictory = () => {\n"
  },
  {
    "before": "    const current = () => weaponMountedRef.current && generation === bossPreparationRef.current && bossSummaryRef.current === pending && scoreRunRef.current === runId;\n    unlockAudioForResume(); setBossSummaryContinuing(true); setBossSummaryFailed(false); setBossSummaryContinueFailed(false);\n",
    "after": "    const current = () => weaponMountedRef.current && generation === bossPreparationRef.current && bossSummaryRef.current === pending && scoreRunRef.current === runId;\n    musicRef.current?.pause();\n    unlockAudioForResume(); setBossSummaryContinuing(true); setBossSummaryFailed(false); setBossSummaryContinueFailed(false);\n"
  },
  {
    "before": "    void startEffects();\n    if (musicEnabled && musicRef.current) void musicRef.current.play();\n  };\n",
    "after": "    void startEffects();\n    if (musicEnabled && musicRef.current && musicRef.current.currentSource !== COMPLETION_MUSIC_SOURCE) void musicRef.current.play();\n  };\n"
  }
];

export function restoreSoundtrackChanges(source) {
  if (!source.includes('const BONUS_MUSIC_SOURCE = "/audio/bonus-orbit.mp3";')) return source;
  for (const { before, after } of [...soundtrackChanges].reverse()) {
    if (source.split(after).length !== 2) throw Error('Expected one exact soundtrack change');
    source = source.replace(after, () => before);
  }
  return source;
}
