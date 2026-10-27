import { restoreBinaryWeaponGameChanges } from './binaryWeaponReviewedChanges.mjs';
// Restore only the reviewed transient spent-ammunition notice.
export const weaponSpentChanges = [
  {
    "before": "import WeaponReloadNotice from './WeaponReloadNotice';",
    "after": "import WeaponReloadNotice from './WeaponReloadNotice';\nimport WeaponSpentNotice from './WeaponSpentNotice';\nimport { createWeaponSpentNotice, type SpentWeaponNotice } from './weaponSpentNotice';"
  },
  {
    "before": "  const [technicalPause, setTechnicalPause] = useState(false);",
    "after": "  const [technicalPause, setTechnicalPause] = useState(false);\n  const weaponSpentRef = useRef<SpentWeaponNotice | null>(null);\n  const [weaponSpent, setWeaponSpent] = useState<Pick<SpentWeaponNotice, 'level' | 'source'> | null>(null);\n  const setWeaponSpentVisible = useCallback((visible: boolean) => {\n    if (weaponSpentRef.current) weaponSpentRef.current.visible = visible;\n  }, []);"
  },
  {
    "before": "        if (!transitionPaused) elapsedRef.current += delta;",
    "after": "        if (!transitionPaused) elapsedRef.current += delta;\n        if (weaponSpentRef.current?.visible && !transitionPaused) {\n          weaponSpentRef.current.remainingMs = Math.max(0, weaponSpentRef.current.remainingMs - delta);\n          if (weaponSpentRef.current.remainingMs === 0) { weaponSpentRef.current = null; setWeaponSpent(null); forceScene = true; }\n        }"
  },
  {
    "before": "        const expiringMs = state.paidWeaponMs;",
    "after": "        const expiringMs = state.paidWeaponMs;\n        const expiringPickupLevel = state.pickupWeaponLevel, expiringPickupMs = state.pickupWeaponMs;"
  },
  {
    "before": "        if (shouldAutoReload(expiringLevel, expiringSource, expiringMs, state.weaponTimers[expiringLevel] ?? 0, autoReloadRef.current, stockRef.current, shipSaveNetwork === 'testnet' && isTestnetWeaponPurchaseEnabled(reloadOffer))) reloadRequestRef.current(expiringLevel);",
    "after": "        const autoReloadStarted = shouldAutoReload(expiringLevel, expiringSource, expiringMs, state.weaponTimers[expiringLevel] ?? 0, autoReloadRef.current, stockRef.current, shipSaveNetwork === 'testnet' && isTestnetWeaponPurchaseEnabled(reloadOffer)) && reloadRequestRef.current(expiringLevel);\n        if (selectedExpired) {\n          const notice = createWeaponSpentNotice(expiringSource, expiringSource === 'pickup' ? expiringPickupLevel : expiringLevel,\n            expiringSource === 'pickup' ? expiringPickupMs : expiringMs, expiringSource === 'pickup' ? state.pickupWeaponMs : state.weaponTimers[expiringLevel] ?? 0, autoReloadStarted);\n          if (notice) { weaponSpentRef.current = notice; setWeaponSpent({ level: notice.level, source: notice.source }); forceScene = true; }\n        }"
  },
  {
    "before": "    stateRef.current.status = 'paused';\n    musicRef.current?.pause();\n    clearControls();\n    setWeaponMenuOpen(true);",
    "after": "    stateRef.current.status = 'paused';\n    weaponSpentRef.current = null; setWeaponSpent(null);\n    musicRef.current?.pause();\n    clearControls();\n    setWeaponMenuOpen(true);"
  },
  {
    "before": "    stateRef.current = createInitialState();",
    "after": "    stateRef.current = createInitialState();\n    weaponSpentRef.current = null; setWeaponSpent(null);"
  },
  {
    "before": "        {game.status === \"playing\" && autoReloading !== null && <WeaponReloadNotice layoutKey={`${game.encounter}:${game.phase}:${game.section}:${game.destroyed}:${reinforcementIntro}`}>{t('Reloading weapon\u2026')} \u00b7 {weaponNames[autoReloading]}</WeaponReloadNotice>}",
    "after": "        {game.status === \"playing\" && !weaponMenuOpen && autoReloading === null && !weaponError && weaponSpent && <WeaponSpentNotice notice={weaponSpent} weaponName={weaponNames[weaponSpent.level]} layoutKey={`${game.encounter}:${game.phase}:${game.section}:${game.destroyed}:${reinforcementIntro}:${game.combo.remainingMs > 0}:${game.pickupNotice?.id ?? 0}`} onOpen={openWeaponSelection} onVisibleChange={setWeaponSpentVisible} />}\n        {game.status === \"playing\" && autoReloading !== null && <WeaponReloadNotice layoutKey={`${game.encounter}:${game.phase}:${game.section}:${game.destroyed}:${reinforcementIntro}:${game.combo.remainingMs > 0}:${game.pickupNotice?.id ?? 0}`}>{t('Reloading weapon\u2026')} \u00b7 {weaponNames[autoReloading]}</WeaponReloadNotice>}"
  },
  {
    "before": "        {game.status === \"playing\" && weaponError && !weaponMenuOpen && <WeaponReloadNotice error layoutKey={`${game.encounter}:${game.phase}:${game.section}:${game.destroyed}:${reinforcementIntro}`}>{t(weaponError)}</WeaponReloadNotice>}",
    "after": "        {game.status === \"playing\" && weaponError && !weaponMenuOpen && <WeaponReloadNotice error layoutKey={`${game.encounter}:${game.phase}:${game.section}:${game.destroyed}:${reinforcementIntro}:${game.combo.remainingMs > 0}:${game.pickupNotice?.id ?? 0}`}>{t(weaponError)}</WeaponReloadNotice>}"
  },
  {
    "before": "reloadNoticeTimerRef.current = window.setTimeout(() => setAutoReloading(null), 3_000);",
    "after": "reloadNoticeTimerRef.current = window.setTimeout(() => setAutoReloading(null), 6_000);"
  },
  {
    "before": "reloadNoticeTimerRef.current = window.setTimeout(() => setWeaponError(''), 2_500);",
    "after": "reloadNoticeTimerRef.current = window.setTimeout(() => setWeaponError(''), 6_000);"
  }
];
export function restoreWeaponSpentGameChanges(source) {
  source = restoreBinaryWeaponGameChanges(source);
  for (const {before, after} of [...weaponSpentChanges].reverse()) {
    if (source.split(after).length !== 2) throw Error("Expected one exact spent-ammunition notice change");
    source = source.replace(after, before);
  }
  return source;
}
