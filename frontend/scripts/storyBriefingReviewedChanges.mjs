// Restore exact story changes before the historical gameplay fingerprints.
const changes = [
  {
    "before": "",
    "after": "import StoryBriefing from \"./story/StoryBriefing\";\nimport { storyBriefingsEnabled, type StoryScene } from \"./story/storyPreferences\";\n"
  },
  {
    "before": "  useEffect(() => { wakeGameLoopRef.current?.(); }, [game.status]);\n",
    "after": "  const [story, setStory] = useState<StoryScene | null>(() => game.status === 'playing' && storyBriefingsEnabled() ? 'campaign' : null);\n  const storyRef = useRef(story);\n  const queueStory = useCallback((scene: StoryScene) => {\n    if (!storyBriefingsEnabled()) return false;\n    storyRef.current = scene;\n    clearControls();\n    setStory(scene);\n    return true;\n  }, [clearControls]);\n  useEffect(() => { wakeGameLoopRef.current?.(); }, [game.status, story]);\n"
  },
  {
    "before": "",
    "after": "      if (!adminRunRef.current && saveChoiceRef.current === 'new' && data.startSector === 1 && !data.checkpoint) {\n        queueStory('campaign');\n      } else if (adminRunRef.current && data.startSector === 10 && stateRef.current.encounter === 'boss-intro') {\n        queueStory('varneth');\n      }\n"
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
    "after": "    if (story) { track.pause(); return; }\n"
  },
  {
    "before": "  }, [game.status, game.encounter, musicEnabled, hasBonusMusic, bonusMusicEnding, hasCompletionMusic, completionMusicVisible]);\n",
    "after": "  }, [game.status, game.encounter, musicEnabled, hasBonusMusic, bonusMusicEnding, hasCompletionMusic, completionMusicVisible, story]);\n"
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
    "after": "              if (state.sector !== 10 || !queueStory('varneth')) soundRef.current?.play(\"boss\");\n"
  },
  {
    "before": "      active: () => stateRef.current.status === 'playing',\n      sleepWhenInactive: () => stateRef.current.status === 'game-over' || (stateRef.current.status !== 'destroying' && stateRef.current.effects.length === 0),\n",
    "after": "      active: () => stateRef.current.status === 'playing' && !storyRef.current,\n      sleepWhenInactive: () => Boolean(storyRef.current) || stateRef.current.status === 'game-over' || (stateRef.current.status !== 'destroying' && stateRef.current.effects.length === 0),\n"
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
    "before": "",
    "after": "      {story && !rewardCards.length && <StoryBriefing key={story} scene={story}\n        unlocked={story === 'varneth' && (rewardProgressRef.current.bossWins[1] ?? 0) > 0}\n        withAudio={musicEnabled && !ownerAudioDisabled() && musicVolume > 0} volume={musicVolume}\n        onFinish={() => {\n          if (storyRef.current !== story) return;\n          storyRef.current = null;\n          clearControls();\n          lastFrameRef.current = 0;\n          if (story === 'varneth') soundRef.current?.play('boss');\n          setStory(null);\n        }} />}\n"
  },
  {
    "before": "      <div ref={fieldRef} className=\"game-field\" onContextMenu={event => event.preventDefault()} onDoubleClick={event => event.preventDefault()} onDragStart={event => event.preventDefault()}>\n",
    "after": "      <div ref={fieldRef} className=\"game-field\" inert={Boolean(story) && !rewardCards.length} onContextMenu={event => event.preventDefault()} onDoubleClick={event => event.preventDefault()} onDragStart={event => event.preventDefault()}>\n"
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
