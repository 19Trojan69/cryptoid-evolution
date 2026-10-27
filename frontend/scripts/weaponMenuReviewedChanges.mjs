import { restoreBalanceReloadGameChanges } from './balanceReloadReviewedChanges.mjs';
// Fixed reviewed hunks only; restores the complete published controller before older guards.
export const weaponMenuChanges = [
  {
    "before": "import { enemyVisualDiameter } from './shipDisplayScale';\nimport { autoReloadKey, nextActiveWeapon, parseAutoReload, shouldAutoReload, type AutoReloadPreferences } from './weaponAutoReload';\nimport { shipSaveNetwork } from './shipFleet';\n",
    "after": "import { enemyVisualDiameter } from './shipDisplayScale';\nimport { automaticStartWeapon, autoReloadKey, nextActiveWeapon, parseAutoReload, shouldAutoReload, type AutoReloadPreferences } from './weaponAutoReload';\nimport { shipSaveNetwork } from './shipFleet';\n"
  },
  {
    "before": "  const reloadRequestRef = useRef<(level: number) => boolean>(() => false);\n  const weaponMountedRef = useRef(true);\n",
    "after": "  const reloadRequestRef = useRef<(level: number) => boolean>(() => false);\n  const automaticStartRunRef = useRef<string | null>(null);\n  const weaponMountedRef = useRef(true);\n"
  },
  {
    "before": "  const changeAutoReload = (level: number, enabled: boolean) => {\n    const next = { ...autoReloadRef.current, [level]: enabled };\n",
    "after": "  const changeAutoReload = (level: number, enabled: boolean) => {\n    automaticStartRunRef.current = null;\n    const next = { ...autoReloadRef.current, [level]: enabled };\n"
  },
  {
    "before": "    try { localStorage.setItem(autoReloadKey(shipSaveNetwork, cardOwnerRef.current), JSON.stringify(next)); } catch { /* Session choice remains usable. */ }\n  };\n",
    "after": "    try { localStorage.setItem(autoReloadKey(shipSaveNetwork, cardOwnerRef.current), JSON.stringify(next)); } catch { /* Session choice remains usable. */ }\n  };\n  const receiveWeaponInventory = async (_owned: string[], stock: Record<string, number>) => {\n    if (hangarCatalog.some(offer => offer.kind === 'weapon' && autoReloadRef.current[offer.level] === true\n      && (stock[offer.id] || 0) > (stockRef.current[offer.id] || 0))) automaticStartRunRef.current = null;\n    stockRef.current = stock; setWeaponStock(stock);\n  };\n"
  },
  {
    "before": "  const [weaponCountdownStep, setWeaponCountdownStep] = useState(1000);\n  useEffect(() => {\n",
    "after": "  const [weaponCountdownStep, setWeaponCountdownStep] = useState(1000);\n  useEffect(() => {\n    const state = stateRef.current, runId = scoreRunRef.current;\n    if (!accountRun || adminRunRef.current || !runId || state.status !== 'playing' || automaticStartRunRef.current === runId) return;\n    automaticStartRunRef.current = runId;\n    if (state.weaponSource !== 'standard' || activationRef.current || weaponBusyRef.current) return;\n    const allowed = hangarCatalog.flatMap(offer => offer.kind === 'weapon' && shipSaveNetwork === 'testnet'\n      && isTestnetWeaponPurchaseEnabled(offer, ownerDiagnostics) ? [offer.level] : []);\n    const level = automaticStartWeapon(state.weaponTimers, autoReloadRef.current, stockRef.current, allowed);\n    if (level !== undefined) reloadRequestRef.current(level);\n  }, [accountRun, game.status, autoReload, weaponStock, ownerDiagnostics]);\n  useEffect(() => {\n"
  },
  {
    "before": "    setWeaponError('');\n    // A collected pickup or a manual selection can take over while the server confirms the charge.\n    if (!automatic || (state.status === 'playing' && state.weaponSource === previousSelection.source && state.weaponLevel === previousSelection.level)) {\n      if (!pickup && level > 1) { state.paidWeaponLevel = level; state.paidWeaponMs = remaining; }\n",
    "after": "    setWeaponError('');\n    if (!automatic) automaticStartRunRef.current = runId;\n    // A collected pickup or a manual selection can take over while the server confirms the charge.\n    if (!automatic || (['playing', 'paused'].includes(state.status) && state.weaponSource === previousSelection.source && state.weaponLevel === previousSelection.level)) {\n      if (!pickup && level > 1) { state.paidWeaponLevel = level; state.paidWeaponMs = remaining; }\n"
  },
  {
    "before": "          <div className=\"weapon-selection-dialog\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"mission-weapon-shop-title\">\n            <MissionWeaponShop autoReload={autoReload} onAutoReload={changeAutoReload} authenticated={accountRun} admin={adminRunRef.current} timers={game.weaponTimers} initialStock={weaponStock} activeLevel={game.weaponLevel} source={game.weaponSource} pickupLevel={game.pickupWeaponLevel} pickupMs={game.pickupWeaponMs} stage={shipStage} selectionBusy={weaponBusy} pendingLevel={activationRef.current?.level} selectionError={weaponError} onSelect={level => { void selectWeaponLevel(level); }} onPickup={selectPickupWeapon} onClose={resumeWeaponSelection} onInventory={async (_owned, stock) => { setWeaponStock(stock); }} />\n          </div>\n",
    "after": "          <div className=\"weapon-selection-dialog\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"mission-weapon-shop-title\">\n            <MissionWeaponShop autoReload={autoReload} onAutoReload={changeAutoReload} authenticated={accountRun} admin={adminRunRef.current} timers={game.weaponTimers} initialStock={weaponStock} activeLevel={game.weaponLevel} source={game.weaponSource} pickupLevel={game.pickupWeaponLevel} pickupMs={game.pickupWeaponMs} stage={shipStage} selectionBusy={weaponBusy} pendingLevel={activationRef.current?.level} selectionError={weaponError} onSelect={level => { void selectWeaponLevel(level); }} onPickup={selectPickupWeapon} onClose={resumeWeaponSelection} onInventory={receiveWeaponInventory} />\n          </div>\n"
  }
];
export function restoreWeaponMenuGameChanges(source) {
 source=restoreBalanceReloadGameChanges(source);
 for (const {before,after} of [...weaponMenuChanges].reverse()) {
  if(source.split(after).length!==2)throw Error("Expected one exact weapon-menu Auto change");
  source=source.replace(after,before);
 }
 return source;
}
