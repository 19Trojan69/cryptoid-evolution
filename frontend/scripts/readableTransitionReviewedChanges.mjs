import { restoreWeaponSpentGameChanges } from './weaponSpentReviewedChanges.mjs';
// Exact title/phase wiring only. All other controller bytes remain pinned.
export const readableTransitionChanges = [
  {
    "before": "import './combatVariety.css';",
    "after": "import './combatVariety.css';\nimport './transitionNotices.css';\nimport { reinforcementIntroMs } from './transitionTiming';"
  },
  {
    "before": "sectionElapsedRef.current = variety ? Math.max(0, timing.introMs - REINFORCEMENT_WARNING_MS - timing.breathingMs)",
    "after": "sectionElapsedRef.current = variety ? timing.introMs - reinforcementIntroMs(state.sector)"
  },
  {
    "before": "  const bossDestructionActive =",
    "after": "  const transitionDurationMs = game.encounter === \"boss-intro\" ? BOSS_WARNING_MS\n    : game.phase === \"SECTOR_CLEAR\" ? combatVarietyEnabled && game.encounter === \"normal\" ? combatTiming(game.sector).clearMs : SECTION_CLEAR_MS\n      : SECTION_INTRO_MS;\n  const bossDestructionActive ="
  },
  {
    "before": "        {game.status === \"playing\" && !levelComplete && !extraLifeVisible && !bossDestructionActive && !reinforcementIntro && (game.phase === \"SECTOR_INTRO\" || game.phase === \"SECTOR_CLEAR\") && <div className={`sector-banner${game.phase === \"SECTOR_INTRO\" ? \" sector-transition\" : \" sector-clear-message\"}${game.encounter === \"boss-intro\" ? \" boss-intro-banner\" : \"\"}${levelIntro ? \" level-intro-banner\" : \"\"}${levelComplete ? \" level-complete-banner\" : \"\"}`} aria-live=\"polite\">",
    "after": "        {(game.status === \"playing\" || game.status === \"paused\") && !levelComplete && !extraLifeVisible && !bossDestructionActive && !reinforcementIntro && (game.phase === \"SECTOR_INTRO\" || game.phase === \"SECTOR_CLEAR\") && <div key={`${game.section}:${game.encounter}:${game.phase}`} data-encounter={game.encounter} style={{ \"--transition-duration\": `${transitionDurationMs}ms` } as CSSProperties} className={`sector-banner readable-transition${game.phase === \"SECTOR_INTRO\" ? \" sector-transition\" : \" sector-clear-message\"}${game.encounter === \"boss-intro\" ? \" boss-intro-banner\" : \"\"}${levelIntro ? \" level-intro-banner\" : \"\"}${levelComplete ? \" level-complete-banner\" : \"\"}`} aria-live=\"polite\">"
  },
{
  "before": "        if (variety && state.phase !== \"SECTOR_CLEAR\") intro.clock += delta;",
  "after": "        if (variety && state.phase !== \"SECTOR_CLEAR\" && (state.phase !== \"SECTOR_INTRO\" || flightRef.current > 0 || sectionElapsedRef.current < reinforcementIntroMs(state.sector))) intro.clock += delta;"
}
];
export function restoreReadableTransitionGameChanges(source) {
  source = restoreWeaponSpentGameChanges(source);
  for (const { before, after } of [...readableTransitionChanges].reverse()) {
    if (source.split(after).length !== 2) throw Error("Expected one exact readable transition change");
    source = source.replace(after, before);
  }
  return source;
}
