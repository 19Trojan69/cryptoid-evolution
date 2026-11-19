import { restoreMainnetCombatChange } from './mainnetCombatReviewedChanges.mjs';
// Restore exact story changes before the historical gameplay fingerprints.
const changes = [
  {
    before: "          if (briefingBoss) soundRef.current?.play('boss');\n",
    after: "          if (briefingBoss && stateRef.current.encounter === 'boss-intro') soundRef.current?.play('boss');\n",
  },
  {
    "before": "  useEffect(() => { wakeGameLoopRef.current?.(); }, [game.status, story]);\n  const [bossSummary, setBossSummary] = useState<BossSummary | null>(null);\n  const bossSummaryRef = useRef<{ summary: BossSummary; accepted: boolean; restored: boolean } | null>(null);\n  const [bossSummaryPrepared, setBossSummaryPrepared] = useState(false);\n",
    "after": "  useEffect(() => { wakeGameLoopRef.current?.(); }, [game.status, story]);\n  const [bossSummary, setBossSummary] = useState<BossSummary | null>(null);\n  const [departingSummary, setDepartingSummary] = useState<BossSummary | null>(null);\n  const bossSummaryRef = useRef<{ summary: BossSummary; accepted: boolean; restored: boolean } | null>(null);\n  const [bossSummaryPrepared, setBossSummaryPrepared] = useState(false);\n"
  },
  {
    "before": "      if (gameSource.startsWith(\"/story/\")) return;\n      if (!track.playing) { track.pause(); return; }\n      track.setVolume(0, .10);\n      const pauseAfterFade = window.setTimeout(() => {\n        if (track.currentSource === gameSource) track.pause();\n",
    "after": "      if (gameSource.startsWith(\"/story/\")) return;\n      if (!track.playing) { track.pause(); return; }\n      track.setVolume(0, storyFadeMs.gameOut / 6000);\n      const pauseAfterFade = window.setTimeout(() => {\n        if (track.currentSource === gameSource) track.pause();\n"
  },
  {
    "before": "        track.setVolume(0);\n        void track.play();\n        track.setVolume(readMusicVolume(), .13);\n      } else void track.play();\n    } else if (game.status !== \"loading\") track.pause();\n",
    "after": "        track.setVolume(0);\n        void track.play();\n        track.setVolume(readMusicVolume(), storyFadeMs.gameIn / 4500);\n      } else void track.play();\n    } else if (game.status !== \"loading\") track.pause();\n"
  },
  {
    "before": "    const track = musicRef.current;\n    const nextBriefing = !pending.restored && storyBriefingsEnabled() && levelStoryAtSector(pending.summary.stage + 1);\n    if (nextBriefing && track?.currentSource === COMPLETION_MUSIC_SOURCE) track.setVolume(0, .10);\n    else track?.pause();\n    unlockAudioForResume(); setBossSummaryContinuing(true); setBossSummaryFailed(false); setBossSummaryContinueFailed(false);\n",
    "after": "    const track = musicRef.current;\n    const nextBriefing = !pending.restored && storyBriefingsEnabled() && levelStoryAtSector(pending.summary.stage + 1);\n    if (nextBriefing && track?.currentSource === COMPLETION_MUSIC_SOURCE) track.setVolume(0, storyFadeMs.gameOut / 6000);\n    else track?.pause();\n    unlockAudioForResume(); setBossSummaryContinuing(true); setBossSummaryFailed(false); setBossSummaryContinueFailed(false);\n"
  },
  {
    "before": "      pending.accepted = true;\n      if (pending.restored) bossSummaryRef.current = null;\n      setBossSummary(null); clearControls(); lastFrameRef.current = 0;\n      stateRef.current.status = 'playing'; setGame({ ...stateRef.current });\n",
    "after": "      pending.accepted = true;\n      if (pending.restored) bossSummaryRef.current = null;\n      if (nextBriefing) setDepartingSummary(pending.summary);\n      setBossSummary(null); clearControls(); lastFrameRef.current = 0;\n      stateRef.current.status = 'playing'; setGame({ ...stateRef.current });\n"
  },
  {
    "before": "            const nextBriefing = clearEncounter === 'boss-clear' ? bossOutroAtSector(next.sector)\n              : clearEncounter === 'bonus' ? levelStoryAtSector(next.sector) : undefined;\n            if (nextBriefing) queueStory(nextBriefing);\n            forceScene = true;\n            return;\n",
    "after": "            const nextBriefing = clearEncounter === 'boss-clear' ? bossOutroAtSector(next.sector)\n              : clearEncounter === 'bonus' ? levelStoryAtSector(next.sector) : undefined;\n            if (!(nextBriefing && queueStory(nextBriefing)) && clearEncounter === 'bonus') setDepartingSummary(null);\n            forceScene = true;\n            return;\n"
  },
  {
    "before": "  const briefingBoss = story ? storyScenes[story].boss : undefined;\n  const briefingVisible = Boolean(story) && !rewardCards.length;\n  return (\n    <main className=\"game-shell\" data-campaign-opening={story === 'campaign' && !storyReturning}\n",
    "after": "  const briefingBoss = story ? storyScenes[story].boss : undefined;\n  const briefingVisible = Boolean(story) && !rewardCards.length;\n  const displayedSummary = bossSummary ?? (game.status === 'playing' ? departingSummary : null);\n  return (\n    <main className=\"game-shell\" data-campaign-opening={story === 'campaign' && !storyReturning}\n"
  },
  {
    "before": "        withAudio={musicEnabled && !ownerAudioDisabled() && musicVolume > 0} volume={musicVolume}\n        prepareAudio={prepareStoryAudio}\n        onReturn={() => {\n          if (storyRef.current !== story) return;\n          fadeMusicAfterStoryRef.current = musicRef.current !== null;\n          setGame({ ...stateRef.current });\n",
    "after": "        withAudio={musicEnabled && !ownerAudioDisabled() && musicVolume > 0} volume={musicVolume}\n        prepareAudio={prepareStoryAudio}\n        onCovered={() => setDepartingSummary(null)}\n        onReturn={() => {\n          if (storyRef.current !== story) return;\n          setDepartingSummary(null);\n          fadeMusicAfterStoryRef.current = musicRef.current !== null;\n          setGame({ ...stateRef.current });\n"
  },
  {
    "before": "        }} />}\n      {rewardCards[0] && <CardReveal reward={rewardCards[0]} remaining={rewardCards.length} onContinue={continueRewardCard}/>}\n      {bossSummary && !rewardCards.length && !homePrompt && <LevelCompletion key={bossSummary.stage} summary={bossSummary} name={sectorName(game.sector)} headline={transitionHeadline}\n        bonusHits={game.bonusHits} bonus={bonusReward(game.bonusHits, game.sector)} chainShards={bonusChainReward(game.chainBlocks, game.bonusHits, game.sector)}\n        bonusHeart={game.bonusResult.includes(' · +1 HEART')}\n        saveDestination={accountRun ? 'account' : adminRunRef.current ? 'test' : 'device'}\n        deviceSaved={guestCreditedShardsRef.current >= bossSummary.shards} prepared={bossSummaryPrepared}\n        saving={bossSummarySaving} failed={bossSummaryFailed} continuing={bossSummaryContinuing} failureMessage={bossSummaryFailure}\n        onRetry={() => { if (bossSummaryContinueFailed) void continueBossSummary(true); else void prepareBossSummary(true); }} onContinue={() => { void continueBossSummary(); }} />}\n      {extraLifeVisible&&<div className={`boss-extra-life${game.bossHeartShards ? \" boss-shard-reward\" : \"\"}`} role=\"status\" aria-live=\"polite\"><strong>{t(game.bossHeartShards ? 'FULL HEARTS' : 'HEART RESTORED')}</strong><span>{game.bossHeartShards ? `+${game.bossHeartShards} ◆` : '+1 ♥'}</span></div>}\n",
    "after": "        }} />}\n      {rewardCards[0] && <CardReveal reward={rewardCards[0]} remaining={rewardCards.length} onContinue={continueRewardCard}/>}\n      {displayedSummary && !rewardCards.length && !homePrompt && <LevelCompletion key={displayedSummary.stage} summary={displayedSummary} name={sectorName(game.sector)} headline={transitionHeadline}\n        bonusHits={game.bonusHits} bonus={bonusReward(game.bonusHits, game.sector)} chainShards={bonusChainReward(game.chainBlocks, game.bonusHits, game.sector)}\n        bonusHeart={game.bonusResult.includes(' · +1 HEART')}\n        saveDestination={accountRun ? 'account' : adminRunRef.current ? 'test' : 'device'}\n        deviceSaved={guestCreditedShardsRef.current >= displayedSummary.shards} prepared={bossSummaryPrepared}\n        saving={bossSummarySaving} failed={bossSummaryFailed} continuing={bossSummaryContinuing} departing={bossSummary === null} failureMessage={bossSummaryFailure}\n        onRetry={() => { if (bossSummaryContinueFailed) void continueBossSummary(true); else void prepareBossSummary(true); }} onContinue={() => { void continueBossSummary(); }} />}\n      {extraLifeVisible&&<div className={`boss-extra-life${game.bossHeartShards ? \" boss-shard-reward\" : \"\"}`} role=\"status\" aria-live=\"polite\"><strong>{t(game.bossHeartShards ? 'FULL HEARTS' : 'HEART RESTORED')}</strong><span>{game.bossHeartShards ? `+${game.bossHeartShards} ◆` : '+1 ♥'}</span></div>}\n"
  },
  {
    "before": "    if (bonusMusicEnding && !hasCompletionMusic\n      && (bossSummaryRef.current?.accepted || track.currentSource !== BONUS_MUSIC_SOURCE)) {\n      track.pause();\n      return;\n    }\n",
    "after": "    if (bonusMusicEnding && !hasCompletionMusic\n      && (bossSummaryRef.current?.accepted || track.currentSource !== BONUS_MUSIC_SOURCE)) {\n      if (!bossSummaryRef.current?.accepted || track.currentSource !== COMPLETION_MUSIC_SOURCE) track.pause();\n      return;\n    }\n"
  },
  {
    "before": "    if (storyRef.current) return;\n    const fadeBonus = bonusMusicEnding && !hasCompletionMusic;\n    const volume = game.status === \"playing\" && game.encounter === \"boss-clear\"\n      ? Math.min(100, musicVolume * BOSS_VICTORY_VOLUME_BOOST)\n      : fadeBonus ? 0 : musicVolume;\n    musicRef.current?.setVolume(volume, fadeBonus ? .12 : undefined);\n  }, [musicVolume, game.encounter, game.status, bonusMusicEnding, hasCompletionMusic]);\n  const startBossVictory = () => {\n",
    "after": "    if (storyRef.current) return;\n    const fadeBonus = bonusMusicEnding && !hasCompletionMusic;\n    const fadeBossMusic = game.encounter === \"boss-clear\" && bossVictoryPendingRef.current;\n    const volume = game.status === \"playing\" && game.encounter === \"boss-clear\"\n      ? Math.min(100, musicVolume * BOSS_VICTORY_VOLUME_BOOST)\n      : fadeBonus ? 0 : musicVolume;\n    musicRef.current?.setVolume(fadeBossMusic ? 0 : volume,\n      fadeBossMusic ? BOSS_VICTORY_START_MS / 6000 : fadeBonus ? .12 : undefined);\n  }, [musicVolume, game.encounter, game.status, bonusMusicEnding, hasCompletionMusic]);\n  const startBossVictory = () => {\n"
  },
  {
    "before": "    const track = musicRef.current;\n    if (!track) return;\n    track.audio.loop = false;\n    track.setSource(\"/audio/boss-victory-v2.mp3\");\n    void track.play();\n  };\n  const saveReward = (award: (progress: RewardProgress) => { progress: RewardProgress; notice: string }, event: { kind: \"block\" | \"boss\" | \"chain\" | \"bonus\"; level: number; stage: number; hits?: number; summaryPlacement?: 'level-end' }) => {\n",
    "after": "    const track = musicRef.current;\n    if (!track) return;\n    track.setVolume(0);\n    track.audio.loop = false;\n    track.setSource(\"/audio/boss-victory-v2.mp3\");\n    void track.play();\n    track.setVolume(Math.min(100, readMusicVolume() * BOSS_VICTORY_VOLUME_BOOST), .12);\n  };\n  const saveReward = (award: (progress: RewardProgress) => { progress: RewardProgress; notice: string }, event: { kind: \"block\" | \"boss\" | \"chain\" | \"bonus\"; level: number; stage: number; hits?: number; summaryPlacement?: 'level-end' }) => {\n"
  },
  {
    "before": "    performanceProbeRef.current?.lifecycle('boss-defeat-start');\n    if (ownerDiagnostics) recordReloadEvent('boss-defeat-start');\n    soundRef.current?.stopBossWeapons();\n    const boss = state.boss;\n    if (!boss) return;\n",
    "after": "    performanceProbeRef.current?.lifecycle('boss-defeat-start');\n    if (ownerDiagnostics) recordReloadEvent('boss-defeat-start');\n    const boss = state.boss;\n    if (!boss) return;\n"
  },
  {
    "before": "    soundRef.current?.setSector(game.sector);\n    if (game.status !== \"playing\") { stateRef.current.combo.pendingAt = null; gameHaptics.stop(); }\n    soundRef.current?.setPaused(game.status === \"loading\" || game.status === \"paused\" || game.status === \"game-over\" || game.status === \"victory\");\n  }, [game.sector, game.status]);\n\n  const startEffects = useCallback((restartPausedGraph = false) => {\n",
    "after": "    soundRef.current?.setSector(game.sector);\n    if (game.status !== \"playing\") { stateRef.current.combo.pendingAt = null; gameHaptics.stop(); }\n    const letVoicesFinish = game.status === \"paused\" && Boolean(bossSummary || firstRewardCard?.boss);\n    soundRef.current?.setPaused(game.status === \"loading\" || game.status === \"paused\" || game.status === \"game-over\" || game.status === \"victory\",\n      { letVoicesFinish });\n  }, [game.sector, game.status, bossSummary, firstRewardCard]);\n\n  const startEffects = useCallback((restartPausedGraph = false) => {\n"
  },
  {
    "before": "    bossSummaryRef.current = { summary, accepted: false, restored };\n    state.status = 'paused'; clearControls();\n    soundRef.current?.setPaused(true); musicRef.current?.pause();\n    // Bonus rewards have already been credited before this level-completion stop.\n    state.effects = []; state.shots = []; state.enemyShots = []; state.asteroids = [];\n",
    "after": "    bossSummaryRef.current = { summary, accepted: false, restored };\n    state.status = 'paused'; clearControls();\n    soundRef.current?.setPaused(true, { letVoicesFinish: true }); musicRef.current?.pause();\n    // Bonus rewards have already been credited before this level-completion stop.\n    state.effects = []; state.shots = []; state.enemyShots = []; state.asteroids = [];\n"
  },
  {
    "before": "    const generation = bossPreparationRef.current;\n    const current = () => weaponMountedRef.current && generation === bossPreparationRef.current && bossSummaryRef.current === pending && scoreRunRef.current === runId;\n    musicRef.current?.pause();\n    unlockAudioForResume(); setBossSummaryContinuing(true); setBossSummaryFailed(false); setBossSummaryContinueFailed(false);\n    try {\n",
    "after": "    const generation = bossPreparationRef.current;\n    const current = () => weaponMountedRef.current && generation === bossPreparationRef.current && bossSummaryRef.current === pending && scoreRunRef.current === runId;\n    const track = musicRef.current;\n    const nextBriefing = !pending.restored && storyBriefingsEnabled() && levelStoryAtSector(pending.summary.stage + 1);\n    if (nextBriefing && track?.currentSource === COMPLETION_MUSIC_SOURCE) track.setVolume(0, .10);\n    else track?.pause();\n    unlockAudioForResume(); setBossSummaryContinuing(true); setBossSummaryFailed(false); setBossSummaryContinueFailed(false);\n    try {\n"
  },
  {
    "before": "",
    "after": "import StoryBriefing from \"./story/StoryBriefing\";\nimport { storyBriefingsEnabled } from \"./story/storyPreferences\";\nimport { bossOutroAtSector, bossStoryAtSector, levelStoryAtSector, storyScenes, type StoryScene } from \"./story/storyScenes\";\nimport { storyFadeMs } from \"./story/storyFades\";\n"
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
    "after": "    if (story && !storyReturning) {\n      const gameSource = track.currentSource;\n      if (gameSource.startsWith(\"/story/\")) return;\n      if (!track.playing) { track.pause(); return; }\n      track.setVolume(0, .10);\n      const pauseAfterFade = window.setTimeout(() => {\n        if (track.currentSource === gameSource) track.pause();\n      }, storyFadeMs.gameOut);\n      return () => window.clearTimeout(pauseAfterFade);\n    }\n"
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
    "after": "            }\n            const nextBriefing = clearEncounter === 'boss-clear' ? bossOutroAtSector(next.sector)\n              : clearEncounter === 'bonus' ? levelStoryAtSector(next.sector) : undefined;\n            if (nextBriefing) queueStory(nextBriefing);\n            forceScene = true;\n            return;\n          }\n        }\n        performanceProbeRef.current?.mark('transitions');\n"
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
    "after": "\n  const briefingBoss = story ? storyScenes[story].boss : undefined;\n  const briefingVisible = Boolean(story) && !rewardCards.length;\n  return (\n    <main className=\"game-shell\" data-campaign-opening={story === 'campaign' && !storyReturning}\n      data-effects-paused={briefingVisible || game.status === \"paused\" || game.status === \"loading\"} onPointerDownCapture={() => { primeCardSound(); if(rewardCardsRef.current.length)return; retryAudio(); }}>\n"
  },
  {
    "before": "",
    "after": "      {story && briefingVisible && <StoryBriefing key={story} scene={story}\n        unlocked={briefingBoss !== undefined && (rewardProgressRef.current.bossWins[briefingBoss.id] ?? 0) > 0}\n        withAudio={musicEnabled && !ownerAudioDisabled() && musicVolume > 0} volume={musicVolume}\n        prepareAudio={prepareStoryAudio}\n        onReturn={() => {\n          if (storyRef.current !== story) return;\n          fadeMusicAfterStoryRef.current = musicRef.current !== null;\n          setGame({ ...stateRef.current });\n          setStoryReturning(true);\n        }}\n        onFinish={() => {\n          if (storyRef.current !== story) return;\n          storyRef.current = null;\n          clearControls();\n          lastFrameRef.current = 0;\n          backgroundHiddenAtRef.current = 0;\n          if (briefingBoss) soundRef.current?.play('boss');\n          setStoryReturning(false);\n          setStory(null);\n        }} />}\n"
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
  },
  {
    "before": "",
    "after": "  const prepareStoryAudio = useCallback((source: string) => {\n    const track = musicRef.current;\n    if (!track || ownerAudioDisabled()) return null;\n    try {\n      if (track.currentSource === \"/audio/battle-orbit.mp3\") regularMusicPositionRef.current = track.audio.currentTime || 0;\n      track.pause();\n      const sameRecording = track.currentSource === source;\n      track.setVolume(0);\n      track.setSource(source);\n      track.audio.loop = false;\n      if (sameRecording && track.audio.currentTime > 0) track.audio.currentTime = 0;\n      return track;\n    } catch { return null; }\n  }, []);\n"
  },
  {
    "before": "",
    "after": "    if (storyBriefingsEnabled()) void musicRef.current?.play();\n"
  }
];

export function restoreStoryBriefingChanges(source) {
  source = restoreMainnetCombatChange(source);
  if (!source.includes('import StoryBriefing from "./story/StoryBriefing";')) return source;
  for (const { before, after } of changes) {
    if (source.split(after).length !== 2) throw Error("Expected one exact story briefing change");
    source = source.replace(after, () => before);
  }
  return source;
}
