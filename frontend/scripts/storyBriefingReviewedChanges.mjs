// Restore exact story changes before the historical gameplay fingerprints.
const changes = [
  {
    "before": "",
    "after": "import StoryBriefing from \"./story/StoryBriefing\";\nimport { storyBriefingsEnabled } from \"./story/storyPreferences\";\nimport { bossStoryAtSector, levelStoryAtSector, storyScenes, type StoryScene } from \"./story/storyScenes\";\nimport { storyFadeMs } from \"./story/storyFades\";\n"
  },
  {
    "before": "  useEffect(() => { wakeGameLoopRef.current?.(); }, [game.status]);\n",
    "after": "  const [story, setStory] = useState<StoryScene | null>(() => game.status === 'playing' && storyBriefingsEnabled() ? 'campaign' : null);\n  const [storyReturning, setStoryReturning] = useState(false);\n  const storyRef = useRef(story);\n  const queueStory = useCallback((scene: StoryScene) => {\n    if (!storyBriefingsEnabled()) return false;\n    storyRef.current = scene;\n    clearControls();\n    setStory(scene);\n    return true;\n  }, [clearControls]);\n  useEffect(() => { wakeGameLoopRef.current?.(); }, [game.status, story]);\n"
  },
  {
    "before": "",
    "after": "      if (!adminRunRef.current && saveChoiceRef.current === 'new' && data.startSector === 1 && !data.checkpoint) {\n        queueStory('campaign');\n      } else if (adminRunRef.current) {\n        const encounter = stateRef.current.encounter;\n        const preview = encounter === 'boss-intro' ? bossStoryAtSector(data.startSector)\n          : encounter === 'normal' ? levelStoryAtSector(data.startSector) : undefined;\n        if (preview) queueStory(preview);\n      }\n"
  },
  {
    "before": "",
    "after": "    if (storyRef.current) track.pause();\n"
  },
  {
    "before": "      const status = stateRef.current.status;\n",
    "after": "      if (storyRef.current) return;\n      const status = stateRef.current.status;\n"
  },
  {
    "before": "",
    "after": "    if (story && !storyReturning) {\n      if (!track.playing) { track.pause(); return; }\n      track.setVolume(0, .10);\n      let fading = true;\n      const pauseAfterFade = window.setTimeout(() => { fading = false; track.pause(); }, storyFadeMs.gameOut);\n      return () => { window.clearTimeout(pauseAfterFade); if (fading) track.pause(); };\n    }\n"
  },
  {
    "before": "  }, [game.status, game.encounter, musicEnabled, hasBonusMusic, bonusMusicEnding, hasCompletionMusic, completionMusicVisible]);\n",
    "after": "  }, [game.status, game.encounter, musicEnabled, hasBonusMusic, bonusMusicEnding, hasCompletionMusic, completionMusicVisible, story, storyReturning]);\n"
  },
  {
    "before": "    if (document.visibilityState === \"hidden\" || ![\"playing\", \"game-over\", \"victory\"].includes(stateRef.current.status)) return;\n",
    "after": "    if (storyRef.current) return;\n    if (document.visibilityState === \"hidden\" || ![\"playing\", \"game-over\", \"victory\"].includes(stateRef.current.status)) return;\n"
  },
  {
    "before": "      playing: () => stateRef.current.status === 'playing',\n",
    "after": "      playing: () => stateRef.current.status === 'playing' && !storyRef.current,\n"
  },
  {
    "before": "      if (stateRef.current.status !== 'playing' || rewardCardsRef.current.length || !controls.has(event.code) || (event.target as HTMLElement)?.closest(\"input, textarea, select\")) return;\n",
    "after": "      if (storyRef.current || stateRef.current.status !== 'playing' || rewardCardsRef.current.length || !controls.has(event.code) || (event.target as HTMLElement)?.closest(\"input, textarea, select\")) return;\n"
  },
  {
    "before": "      if (document.visibilityState === \"hidden\") {\n",
    "after": "      if (storyRef.current) return;\n      if (document.visibilityState === \"hidden\") {\n"
  },
  {
    "before": "      const state = stateRef.current;\n",
    "after": "      if (storyRef.current) return;\n      const state = stateRef.current;\n"
  },
  {
    "before": "              soundRef.current?.play(\"boss\");\n",
    "after": "              const briefing = bossStoryAtSector(state.sector);\n              if (!briefing || !queueStory(briefing)) soundRef.current?.play(\"boss\");\n"
  },
  {
    "before": "      active: () => stateRef.current.status === 'playing',\n      sleepWhenInactive: () => stateRef.current.status === 'game-over' || (stateRef.current.status !== 'destroying' && stateRef.current.effects.length === 0),\n",
    "after": "      active: () => stateRef.current.status === 'playing' && !storyRef.current,\n      sleepWhenInactive: () => Boolean(storyRef.current) || stateRef.current.status === 'game-over' || (stateRef.current.status !== 'destroying' && stateRef.current.effects.length === 0),\n"
  },
  {
    "before": "            }\n            forceScene = true;\n            return;\n          }\n        }\n        performanceProbeRef.current?.mark('transitions');\n",
    "after": "            }\n            const levelBriefing = clearEncounter === 'bonus' ? levelStoryAtSector(next.sector) : undefined;\n            if (levelBriefing) queueStory(levelBriefing);\n            forceScene = true;\n            return;\n          }\n        }\n        performanceProbeRef.current?.mark('transitions');\n"
  },
  {
    "before": "  }, [showRewardCards, diagnosticContext, beginBossSummary]);\n",
    "after": "  }, [showRewardCards, diagnosticContext, beginBossSummary, queueStory]);\n"
  },
  {
    "before": "",
    "after": "    if (stateRef.current.status === 'playing') queueStory('campaign');\n"
  },
  {
    "before": "\n  return (\n    <main className=\"game-shell\" data-effects-paused={game.status === \"paused\" || game.status === \"loading\"} onPointerDownCapture={() => { primeCardSound(); if(rewardCardsRef.current.length)return; retryAudio(); }}>\n",
    "after": "\n  const briefingBoss = story ? storyScenes[story].boss : undefined;\n  const briefingVisible = Boolean(story) && !rewardCards.length;\n  return (\n    <main className=\"game-shell\" data-effects-paused={briefingVisible || game.status === \"paused\" || game.status === \"loading\"} onPointerDownCapture={() => { primeCardSound(); if(rewardCardsRef.current.length)return; retryAudio(); }}>\n"
  },
  {
    "before": "",
    "after": "      {story && briefingVisible && <StoryBriefing key={story} scene={story}\n        unlocked={briefingBoss !== undefined && (rewardProgressRef.current.bossWins[briefingBoss.id] ?? 0) > 0}\n        withAudio={musicEnabled && !ownerAudioDisabled() && musicVolume > 0} volume={musicVolume}\n        onReturn={() => {\n          if (storyRef.current !== story) return;\n          fadeMusicAfterStoryRef.current = musicRef.current !== null;\n          setGame({ ...stateRef.current });\n          setStoryReturning(true);\n        }}\n        onFinish={() => {\n          if (storyRef.current !== story) return;\n          storyRef.current = null;\n          clearControls();\n          lastFrameRef.current = 0;\n          backgroundHiddenAtRef.current = 0;\n          if (briefingBoss) soundRef.current?.play('boss');\n          setStoryReturning(false);\n          setStory(null);\n        }} />}\n"
  },
  {
    "before": "      <div ref={fieldRef} className=\"game-field\" onContextMenu={event => event.preventDefault()} onDoubleClick={event => event.preventDefault()} onDragStart={event => event.preventDefault()}>\n",
    "after": "      <div ref={fieldRef} className=\"game-field\" inert={briefingVisible} onContextMenu={event => event.preventDefault()} onDoubleClick={event => event.preventDefault()} onDragStart={event => event.preventDefault()}>\n"
  },
  {
    "before": "  const musicRef = useRef<MusicPlayer | null>(null);\n",
    "after": "  const musicRef = useRef<MusicPlayer | null>(null);\n  const fadeMusicAfterStoryRef = useRef(false);\n"
  },
  {
    "before": "    if (playCompletion || game.status === \"playing\" || game.status === \"game-over\" || game.status === \"victory\") void track.play();\n    else if (game.status !== \"loading\") track.pause();\n",
    "after": "    if (playCompletion || game.status === \"playing\" || game.status === \"game-over\" || game.status === \"victory\") {\n      if (fadeMusicAfterStoryRef.current) {\n        fadeMusicAfterStoryRef.current = false;\n        track.setVolume(0);\n        void track.play();\n        track.setVolume(readMusicVolume(), .13);\n      } else void track.play();\n    } else if (game.status !== \"loading\") track.pause();\n"
  },
  {
    "before": "  useEffect(() => {\n    const fadeBonus = bonusMusicEnding && !hasCompletionMusic;\n",
    "after": "  useEffect(() => {\n    if (storyRef.current) return;\n    const fadeBonus = bonusMusicEnding && !hasCompletionMusic;\n"
  },
  {
    "before": " paused={game.status !== \"playing\"} showNebula={game.encounter === \"boss-fight\"} />\n",
    "after": " paused={briefingVisible || game.status !== \"playing\"} showNebula={game.encounter === \"boss-fight\"} />\n"
  },
  {
    "before": "        <SectorBackdrop sector={game.sector} player={game.player} paused={game.status !== \"playing\"} />\n",
    "after": "        <SectorBackdrop sector={game.sector} player={game.player} paused={briefingVisible || game.status !== \"playing\"} />\n"
  },
  {
    "before": "        if (forceScene || requestScene) {\n",
    "after": "        if ((forceScene || requestScene) && !storyRef.current) {\n"
  },
  {
    "before": "        {(game.status === \"playing\" || game.status === \"paused\") && !levelComplete",
    "after": "        {!briefingVisible && (game.status === \"playing\" || game.status === \"paused\") && !levelComplete"
  }
];

export function restoreStoryBriefingChanges(source) {
  if (!source.includes('import StoryBriefing from "./story/StoryBriefing";')) return source;
  for (const { before, after } of changes) {
    if (source.split(after).length !== 2) throw Error("Expected one exact story briefing change");
    source = source.replace(after, () => before);
  }
  return source;
}
