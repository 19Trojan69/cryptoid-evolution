// Only the exact reviewed binary-window UI correction; all other bytes stay pinned.
export const binaryWeaponChanges = [
  {
    "before": "import WeaponReloadNotice from './WeaponReloadNotice';\nimport WeaponSpentNotice from './WeaponSpentNotice';\n",
    "after": "import WeaponSpentNotice from './WeaponSpentNotice';\n"
  },
  {
    "before": "  const [weaponSpent, setWeaponSpent] = useState<Pick<SpentWeaponNotice, 'level' | 'source'> | null>(null);\n  const setWeaponSpentVisible = useCallback((visible: boolean) => {\n    if (weaponSpentRef.current) weaponSpentRef.current.visible = visible;\n",
    "after": "  const [weaponSpent, setWeaponSpent] = useState<number | null>(null);\n  const markWeaponSpentShown = useCallback(() => {\n    if (weaponSpentRef.current) weaponSpentRef.current.shown = true;\n"
  },
  {
    "before": "  const [autoReloading, setAutoReloading] = useState<number | null>(null);\n  const reloadNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);\n  const reloadPendingRef = useRef(false);\n",
    "after": "  const reloadPendingRef = useRef(false);\n"
  },
  {
    "before": "  useEffect(() => { weaponMountedRef.current = true; return () => { weaponMountedRef.current = false; if (reloadNoticeTimerRef.current) window.clearTimeout(reloadNoticeTimerRef.current); }; }, []);\n",
    "after": "  useEffect(() => { weaponMountedRef.current = true; return () => { weaponMountedRef.current = false; }; }, []);\n"
  },
  {
    "before": "      knownTimers: 1 + Number(gameOverTimerRef.current !== null) + Number(reloadNoticeTimerRef.current !== null),\n",
    "after": "      knownTimers: 1 + Number(gameOverTimerRef.current !== null),\n"
  },
  {
    "before": "        if (weaponSpentRef.current?.visible && !transitionPaused) {\n          weaponSpentRef.current.remainingMs = Math.max(0, weaponSpentRef.current.remainingMs - delta);\n          if (weaponSpentRef.current.remainingMs === 0) { weaponSpentRef.current = null; setWeaponSpent(null); forceScene = true; }\n",
    "after": "        // A queued weapon name belongs to one formation-data-stream window.\n        // Pauses keep it queued; finishing that window releases it immediately.\n        if (weaponSpentRef.current?.shown && (state.encounter !== 'normal' || formationStartedRef.current\n          || !['SECTOR_INTRO', 'ENTRY', 'FORMATION'].includes(state.phase))) {\n          weaponSpentRef.current = null; setWeaponSpent(null); forceScene = true;\n"
  },
  {
    "before": "        const autoReloadStarted = shouldAutoReload(expiringLevel, expiringSource, expiringMs, state.weaponTimers[expiringLevel] ?? 0, autoReloadRef.current, stockRef.current, shipSaveNetwork === 'testnet' && isTestnetWeaponPurchaseEnabled(reloadOffer)) && reloadRequestRef.current(expiringLevel);\n",
    "after": "        if (shouldAutoReload(expiringLevel, expiringSource, expiringMs, state.weaponTimers[expiringLevel] ?? 0, autoReloadRef.current, stockRef.current, shipSaveNetwork === 'testnet' && isTestnetWeaponPurchaseEnabled(reloadOffer))) reloadRequestRef.current(expiringLevel);\n"
  },
  {
    "before": "            expiringSource === 'pickup' ? expiringPickupMs : expiringMs, expiringSource === 'pickup' ? state.pickupWeaponMs : state.weaponTimers[expiringLevel] ?? 0, autoReloadStarted);\n          if (notice) { weaponSpentRef.current = notice; setWeaponSpent({ level: notice.level, source: notice.source }); forceScene = true; }\n",
    "after": "            expiringSource === 'pickup' ? expiringPickupMs : expiringMs, expiringSource === 'pickup' ? state.pickupWeaponMs : state.weaponTimers[expiringLevel] ?? 0);\n          if (notice) { weaponSpentRef.current = notice; setWeaponSpent(notice.level); forceScene = true; }\n"
  },
  {
    "before": "    if (!automatic && reloadNoticeTimerRef.current) {\n      window.clearTimeout(reloadNoticeTimerRef.current); reloadNoticeTimerRef.current = null; setAutoReloading(null);\n    }\n    const previousSelection = { source: state.weaponSource, level: state.weaponLevel };\n",
    "after": "    const previousSelection = { source: state.weaponSource, level: state.weaponLevel };\n"
  },
  {
    "before": "        setWeaponError('Not confirmed. Retry the same weapon.');\n        if (automatic) {\n          if (reloadNoticeTimerRef.current) window.clearTimeout(reloadNoticeTimerRef.current);\n          setAutoReloading(null);\n          reloadNoticeTimerRef.current = window.setTimeout(() => setWeaponError(''), 6_000);\n        }\n        return;\n",
    "after": "        setWeaponError('Not confirmed. Retry the same weapon.');\n        return;\n"
  },
  {
    "before": "    setAutoReloading(level);\n    soundRef.current?.play('reload');\n",
    "after": "    soundRef.current?.play('reload');\n"
  },
  {
    "before": "    if (reloadNoticeTimerRef.current) window.clearTimeout(reloadNoticeTimerRef.current);\n    reloadNoticeTimerRef.current = window.setTimeout(() => setAutoReloading(null), 6_000);\n    void selectWeaponLevel(level, true);\n",
    "after": "    void selectWeaponLevel(level, true);\n"
  },
  {
    "before": "    reloadPendingRef.current = false;\n    setAutoReloading(null);\n    setWeaponError('');\n",
    "after": "    reloadPendingRef.current = false;\n    setWeaponError('');\n"
  },
  {
    "before": "    if (reloadNoticeTimerRef.current) window.clearTimeout(reloadNoticeTimerRef.current);\n    adminRunRef.current = false;\n",
    "after": "    adminRunRef.current = false;\n"
  },
  {
    "before": "        {game.status === \"playing\" && game.encounter === \"normal\" && !formationStartedRef.current && (game.phase === \"SECTOR_INTRO\" || game.phase === \"ENTRY\" || game.phase === \"FORMATION\") && <div className=\"formation-data-stream\" aria-hidden=\"true\">{FORMATION_DATA_ROWS.map((row, index) => <div className=\"formation-data-row\" key={index}><span>{row.repeat(4)}</span><span>{row.repeat(4)}</span></div>)}</div>}\n",
    "after": "        {game.status === \"playing\" && game.encounter === \"normal\" && !formationStartedRef.current && (game.phase === \"SECTOR_INTRO\" || game.phase === \"ENTRY\" || game.phase === \"FORMATION\") && <><div className=\"formation-data-stream\" aria-hidden=\"true\">{FORMATION_DATA_ROWS.map((row, index) => <div className=\"formation-data-row\" key={index}><span>{row.repeat(4)}</span><span>{row.repeat(4)}</span></div>)}</div>{weaponSpent && !levelIntro && <WeaponSpentNotice expiredWeaponName={weaponNames[weaponSpent]} weaponName={weaponNames[stageWeaponLevel(shipStage, game.weaponLevel)]} onShown={markWeaponSpentShown} />}</>}\n"
  },
  {
    "before": "        {game.status === \"playing\" && !weaponMenuOpen && autoReloading === null && !weaponError && weaponSpent && <WeaponSpentNotice notice={weaponSpent} weaponName={weaponNames[weaponSpent.level]} layoutKey={`${game.encounter}:${game.phase}:${game.section}:${game.destroyed}:${reinforcementIntro}:${game.combo.remainingMs > 0}:${game.pickupNotice?.id ?? 0}`} onOpen={openWeaponSelection} onVisibleChange={setWeaponSpentVisible} />}\n        {game.status === \"playing\" && autoReloading !== null && <WeaponReloadNotice layoutKey={`${game.encounter}:${game.phase}:${game.section}:${game.destroyed}:${reinforcementIntro}:${game.combo.remainingMs > 0}:${game.pickupNotice?.id ?? 0}`}>{t('Reloading weapon…')} · {weaponNames[autoReloading]}</WeaponReloadNotice>}\n        {game.status === \"playing\" && weaponError && !weaponMenuOpen && <WeaponReloadNotice error layoutKey={`${game.encounter}:${game.phase}:${game.section}:${game.destroyed}:${reinforcementIntro}:${game.combo.remainingMs > 0}:${game.pickupNotice?.id ?? 0}`}>{t(weaponError)}</WeaponReloadNotice>}\n        {weaponCountdown !== null && <div className=\"game-overlay weapon-resume-countdown\" role=\"status\" aria-live=\"polite\"><strong>{weaponCountdown}</strong></div>}\n",
    "after": "        {weaponCountdown !== null && <div className=\"game-overlay weapon-resume-countdown\" role=\"status\" aria-live=\"polite\"><strong>{weaponCountdown}</strong></div>}\n"
  }
];
export function restoreBinaryWeaponGameChanges(source) {
  for (const {before, after} of [...binaryWeaponChanges].reverse()) {
    if (source.split(after).length !== 2) throw Error('Expected one exact binary-weapon notice change');
    source = source.replace(after, before);
  }
  return source;
}
