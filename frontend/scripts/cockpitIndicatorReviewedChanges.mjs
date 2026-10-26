// Exact owner-requested markup, indicator placement and reload feedback/timing.
const changes = [
  {
    "before": "import GameAccessGate from '../components/GameAccessGate';",
    "after": "import GameAccessGate from '../components/GameAccessGate';\nimport LoadingStripes from '../components/LoadingStripes';\nimport { enemyHealthClearance } from './enemyHealthClearance';\nimport { weaponResumeStepMs } from './weaponReloadTiming';\nimport WeaponReloadNotice from './WeaponReloadNotice';"
  },
  {
    "before": "  const [weaponCountdown, setWeaponCountdown] = useState<number | null>(null);",
    "after": "  const [weaponCountdown, setWeaponCountdown] = useState<number | null>(null);\n  const [weaponCountdownStep, setWeaponCountdownStep] = useState(1000);"
  },
  {
    "before": "      if (document.visibilityState === 'hidden') { setWeaponCountdown(3); return; }",
    "after": "      if (document.visibilityState === 'hidden') { setWeaponCountdownStep(1000); setWeaponCountdown(3); return; }"
  },
  {
    "before": "    }, 1000);\n    return () => window.clearInterval(timer);\n  }, [weaponCountdown, clearControls]);",
    "after": "    }, weaponCountdownStep);\n    return () => window.clearInterval(timer);\n  }, [weaponCountdown, weaponCountdownStep, clearControls]);"
  },
  {
    "before": "  const resumeWeaponSelection = () => { if (bossSummaryRef.current && !bossSummaryRef.current.accepted) return; unlockAudioForResume(); clearControls(); setTechnicalPause(false); setWeaponMenuOpen(false); setWeaponCountdown(3); };",
    "after": "  const resumeWeaponSelection = () => {\n    if (bossSummaryRef.current && !bossSummaryRef.current.accepted) return;\n    unlockAudioForResume(); clearControls();\n    const state = stateRef.current;\n    setWeaponCountdownStep(weaponResumeStepMs(weaponMenuOpen && !technicalPause, state.weaponSource,\n      state.weaponSource === 'pickup' ? state.pickupWeaponMs : state.paidWeaponMs));\n    setTechnicalPause(false); setWeaponMenuOpen(false); setWeaponCountdown(3);\n  };"
  },
  {
    "before": "reloadNoticeTimerRef.current = window.setTimeout(() => setAutoReloading(null), 1_250);",
    "after": "reloadNoticeTimerRef.current = window.setTimeout(() => setAutoReloading(null), 3_000);"
  },
  {
    "before": "          <p>{(startError && t(startError)) || (resumeOffer ? t(\"Combat progress is saved to your Pi account. Older saves resume at the last completed Block.\") : t('Checking your saved hangar loadout.'))}</p>",
    "after": "          <p>{(startError && t(startError)) || (resumeOffer ? t(\"Combat progress is saved to your Pi account. Older saves resume at the last completed Block.\") : t('Checking your saved hangar loadout.'))}</p>\n          {!resumeOffer && !startError && <LoadingStripes />}"
  },
  {
    "before": "...shipHullStyle(sprite, true), \"--visual-bank\"",
    "after": "...shipHullStyle(sprite, true), ...enemyHealthClearance(sprite), \"--visual-bank\""
  },
  {
    "before": "        {autoReloading !== null && <div className=\"weapon-reloading\" role=\"status\" aria-live=\"polite\">{t('Reloading weapon\u2026')} \u00b7 {weaponNames[autoReloading]}</div>}",
    "after": "        {game.status === \"playing\" && autoReloading !== null && <WeaponReloadNotice layoutKey={`${game.encounter}:${game.phase}:${game.section}:${game.destroyed}:${reinforcementIntro}`}>{t('Reloading weapon\u2026')} \u00b7 {weaponNames[autoReloading]}</WeaponReloadNotice>}"
  },
  {
    "before": "        {weaponError && !weaponMenuOpen && <div className=\"weapon-reload-error\" role=\"alert\">{t(weaponError)}</div>}",
    "after": "        {game.status === \"playing\" && weaponError && !weaponMenuOpen && <WeaponReloadNotice error layoutKey={`${game.encounter}:${game.phase}:${game.section}:${game.destroyed}:${reinforcementIntro}`}>{t(weaponError)}</WeaponReloadNotice>}"
  }
];
export function restoreCockpitIndicatorGameChanges(source) {
  for (const {before, after} of [...changes].reverse()) {
    if (source.split(after).length !== 2) throw Error('Expected one exact cockpit indicator change');
    source = source.replace(after, before);
  }
  return source;
}
