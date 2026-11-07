// Exact controller edits from the long-run iPhone scene. Restore them before the older release checks.
const sceneChanges = [
  {
    "before": "import { showCombatNotice } from './combatNotice';\nimport { advanceBonusRock, spawnBonusRock, hitBonusRock, rockHitsShot, rockInField, nextRockEventMs, MAX_ROCKS, MAX_ROCK_EFFECTS, type BonusRock, type RockEffect } from './bonusRocks';\nimport BonusRockLayer from './BonusRockLayer';\nimport {CanvasEffectLayer,CanvasImpact,canvasEffectResources,releaseIdleCanvasEffects} from './CanvasEffects';\n",
    "after": "import { showCombatNotice } from './combatNotice';\nimport type { BonusRock, RockEffect } from './bonusRocks';\nimport {CanvasEffectLayer,CanvasImpact,canvasEffectResources,releaseIdleCanvasEffects} from './CanvasEffects';\n"
  },
  {
    "before": "      varietyRef.current = readCombatVariety(saved.state.combo.variety) ?? createCombatVariety(saved.stage > 1 || saved.refs.elapsed > 0);\n      stateRef.current.rocks = varietyRef.current.rocks.map(rock => ({ ...rock, x: rock.x * sx, y: rock.y * sy }));\n      stateRef.current.rockEffects = [];\n",
    "after": "      varietyRef.current = readCombatVariety(saved.state.combo.variety) ?? createCombatVariety(saved.stage > 1 || saved.refs.elapsed > 0);\n      varietyRef.current.rocks = [];\n      stateRef.current.rocks = [];\n      stateRef.current.rockEffects = [];\n"
  },
  {
    "before": "          state.effects = advanceGameEffects(state.effects, time);\n          state.rockEffects = state.rockEffects.map(e => ({ ...e, age: e.age + delta })).filter(e => e.age < (e.final ? 750 : 250));\n          clearTimerRef.current = advanceCompletionQuiet(clearTimerRef.current, delta, state.effects.length + state.rockEffects.length);\n",
    "after": "          state.effects = advanceGameEffects(state.effects, time);\n          clearTimerRef.current = advanceCompletionQuiet(clearTimerRef.current, delta, state.effects.length + state.rockEffects.length);\n"
  },
  {
    "before": "        if (variety && state.phase !== \"SECTOR_CLEAR\" && (state.phase !== \"SECTOR_INTRO\" || sectionElapsedRef.current < releasedIntroClockMs(state.sector))) intro.clock += delta;\n        if (variety && intro.asteroidStage !== state.sector) { intro.asteroidStage = state.sector; intro.asteroidStageEvents = 0; }\n        state.rockEffects = state.rockEffects.map(e => ({ ...e, age: e.age + delta })).filter(e => e.age < (e.final ? 750 : 250));\n        const slots = sectionSlotsRef.current ?? createFormationSlots(state.section, state.sector, width, height, visibleTop, playerDiameterRef.current);\n",
    "after": "        if (variety && state.phase !== \"SECTOR_CLEAR\" && (state.phase !== \"SECTOR_INTRO\" || sectionElapsedRef.current < releasedIntroClockMs(state.sector))) intro.clock += delta;\n        const slots = sectionSlotsRef.current ?? createFormationSlots(state.section, state.sector, width, height, visibleTop, playerDiameterRef.current);\n"
  },
  {
    "before": "        performanceProbeRef.current?.mark('hostile-shots-and-damage');\n        const rockAllowed = variety && normal && state.asteroids.length > 0 && formationStartedRef.current && state.phase !== \"SECTOR_INTRO\" && state.phase !== \"SECTOR_CLEAR\";\n        if(!rockAllowed){state.rocks=[];} else {\n          state.rocks=state.rocks.map(r=>advanceBonusRock(r,delta)).filter(r=>rockInField(r,width,height));\n          if(intro.clock>=intro.asteroidDue){\n            intro.asteroidDue=intro.clock+nextRockEventMs(Math.random());\n            const roll=Math.random();\n            if(roll<.72 && intro.asteroidStageEvents < 2 && state.rocks.length<MAX_ROCKS){\n              const rock=spawnBonusRock(nextIdRef.current++,state.sector,width,height,visibleTop,Math.random(),Math.floor(Math.random()*100_000));\n              if(!state.asteroids.some(e=>Math.hypot(e.x-rock.x,e.y-rock.y)<e.radius+rock.radius+30) && !state.powerUps.some(p=>Math.hypot(p.x-rock.x,p.y-rock.y)<70)){state.rocks.push(rock);intro.asteroidEvents++; intro.asteroidStageEvents++;}\n            }\n          }\n          state.rocks=state.rocks.filter(r=>Math.hypot(r.x-state.player.x*width,r.y-state.player.y*height)>r.radius+playerDiameterRef.current*.6 && !state.powerUps.some(p=>Math.hypot(p.x-r.x,p.y-r.y)<r.radius+35));\n        }\n        state.powerUps = state.powerUps.filter(pickup => {\n",
    "after": "        performanceProbeRef.current?.mark('hostile-shots-and-damage');\n        state.powerUps = state.powerUps.filter(pickup => {\n"
  },
  {
    "before": "          if (!enemy) {\n            const rock = state.rocks.find(r => rockHitsShot(r, previous, shot));\n            if (rock) { const hit=hitBonusRock(rock,shot.damage); Object.assign(rock,hit.rock); state.score+=hit.points; state.rockEffects.push({id:nextIdRef.current++,x:rock.x,y:rock.y,radius:rock.radius,seed:rock.seed,age:0,points:hit.points,final:hit.final}); state.rockEffects=state.rockEffects.slice(-MAX_ROCK_EFFECTS); if(hit.final){state.rocks=state.rocks.filter(r=>r.id!==rock.id);soundRef.current?.playRock(rock.radius>20,true);}else soundRef.current?.playRock(rock.radius>20,false); continue; }\n            remainingShots.push(shot); continue; }\n",
    "after": "          if (!enemy) {\n            remainingShots.push(shot); continue; }\n"
  },
  {
    "before": "        <GameSceneBoundary onError={error => interruptionRef.current('render-error', error)} fallback={retry => <div className=\"game-overlay\"><div className=\"game-modal\" role=\"alert\"><h1>{t('MISSION PAUSED')}</h1><p>{t(\"The mission was paused after a technical interruption. Try Resume to continue.\")}</p><button type=\"button\" className=\"button button-primary\" onClick={retry}>{t('Try again')}</button></div></div>}>\n        {combatVarietyEnabled && <BonusRockLayer rocks={game.rocks} effects={game.rockEffects} width={fieldSizeRef.current.width} height={fieldSizeRef.current.height} />}\n        {combatVarietyEnabled && varietyRef.current.noticeMs > 0 && showCombatNotice(varietyRef.current.notice) && <div className=\"combat-variety-notice\" role=\"status\" style={{ top: visibleTopRef.current + 48 }}>{varietyRef.current.notice === \"Heavy attacker incoming\" ? t(\"Heavy attacker incoming\") : t(varietyRef.current.notice)}</div>}\n",
    "after": "        <GameSceneBoundary onError={error => interruptionRef.current('render-error', error)} fallback={retry => <div className=\"game-overlay\"><div className=\"game-modal\" role=\"alert\"><h1>{t('MISSION PAUSED')}</h1><p>{t(\"The mission was paused after a technical interruption. Try Resume to continue.\")}</p><button type=\"button\" className=\"button button-primary\" onClick={retry}>{t('Try again')}</button></div></div>}>\n        {combatVarietyEnabled && varietyRef.current.noticeMs > 0 && showCombatNotice(varietyRef.current.notice) && <div className=\"combat-variety-notice\" role=\"status\" style={{ top: visibleTopRef.current + 48 }}>{varietyRef.current.notice === \"Heavy attacker incoming\" ? t(\"Heavy attacker incoming\") : t(varietyRef.current.notice)}</div>}\n"
  }
];

const directPlayAuth = '  const { authReady, isLoading, authError, signIn, canAdmin, isAuthenticated } = useAuth({ autoSignIn: false });';

export function restoreTestnetLongRunSceneChanges(source) {
  if (source.includes(directPlayAuth)) {
    if (source.split(directPlayAuth).length !== 2) throw Error('Expected one exact Testnet game entry change');
    source = source.replace(directPlayAuth, directPlayAuth.replace('({ autoSignIn: false })', '()'));
  }
  if (!source.includes(sceneChanges[0].after)) return source;
  for (const { before, after } of sceneChanges) {
    if (source.split(after).length !== 2) throw Error('Expected one exact Testnet long-run scene change');
    source = source.replace(after, () => before);
  }
  return source;
}
