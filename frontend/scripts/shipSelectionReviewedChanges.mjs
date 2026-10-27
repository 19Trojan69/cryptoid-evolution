import { restoreBalanceAccountChanges } from './balanceReloadReviewedChanges.mjs';
import { restoreWeaponMenuGameChanges } from './weaponMenuReviewedChanges.mjs';
// Only these exact reviewed loadout/auth changes. Every other controller byte stays pinned.
export const shipSelectionChanges = [
  {
    "before": "import { openingKillPickup } from \"./pickupOrigin\";\nimport { ownedShipStage, projectileGuardForStage, projectileImpact, stageWeaponLevel, type ShipStage } from \"./shipEvolution\";\nimport { GameAudio, hasPrimedGameAudio, takePrimedGameAudio } from \"./gameAudio\";\n",
    "after": "import { openingKillPickup } from \"./pickupOrigin\";\nimport { projectileGuardForStage, projectileImpact, stageWeaponLevel, selectedShipStage, type ShipStage } from \"./shipEvolution\";\nimport { GameAudio, hasPrimedGameAudio, takePrimedGameAudio } from \"./gameAudio\";\n"
  },
  {
    "before": "\nconst createInitialState = (): GameState => ({ rocks: [], rockEffects: [], damageCount: 0, comboTotal: 0, bossHullLight: 0, combo: createDoubleKillCombo(), asteroids: [], bonusTargets: [], bonusHits: 0, bonusResult: \"\", chainBlocks: 0, chainResult: \"\", rewardNotice: \"\", boss: null, encounter: \"normal\", shots: [], enemyShots: [], player: { x: .5, y: shipStartHeight[readShipStart()] }, thrust: 0, effects: [], powerUps: [], powerUpTypes: [], pickupNotice: null, score: 0, shardBase: shardBalance(localStorage.getItem(SHARD_BALANCE_KEY)), shards: 0, hearts: 3, maxHearts: 3, projectileGuard: 0, shieldCharges: 0, shieldMs: 0, purchasedShieldMs: 0, shieldActive: true, overdriveMs: 0, overdriveTotalMs: POWER_UP_DURATION_MS, rapidFireMs: 0, rapidFireTotalMs: POWER_UP_DURATION_MS, empMs: 0, pendingStartPower: null, weaponLevel: 1, weaponSource: \"standard\", weaponCap: 1, paidWeaponLevel: 1, paidWeaponMs: 0, pickupWeaponLevel: 1, pickupWeaponMs: 0, unlockedWeapons: [1], weaponTimers: [0, 0, 0, 0, 0, 0], destroyed: 0, sector: 1, section: 1, phase: \"SECTOR_INTRO\", status: localStorage.getItem(\"cryptoid_pi_session\") || sessionStorage.getItem(ADMIN_MODE_KEY) === \"1\" ? \"loading\" : \"playing\" });\n\n",
    "after": "\nconst createInitialState = (authenticated = false): GameState => ({ rocks: [], rockEffects: [], damageCount: 0, comboTotal: 0, bossHullLight: 0, combo: createDoubleKillCombo(), asteroids: [], bonusTargets: [], bonusHits: 0, bonusResult: \"\", chainBlocks: 0, chainResult: \"\", rewardNotice: \"\", boss: null, encounter: \"normal\", shots: [], enemyShots: [], player: { x: .5, y: shipStartHeight[readShipStart()] }, thrust: 0, effects: [], powerUps: [], powerUpTypes: [], pickupNotice: null, score: 0, shardBase: shardBalance(localStorage.getItem(SHARD_BALANCE_KEY)), shards: 0, hearts: 3, maxHearts: 3, projectileGuard: 0, shieldCharges: 0, shieldMs: 0, purchasedShieldMs: 0, shieldActive: true, overdriveMs: 0, overdriveTotalMs: POWER_UP_DURATION_MS, rapidFireMs: 0, rapidFireTotalMs: POWER_UP_DURATION_MS, empMs: 0, pendingStartPower: null, weaponLevel: 1, weaponSource: \"standard\", weaponCap: 1, paidWeaponLevel: 1, paidWeaponMs: 0, pickupWeaponLevel: 1, pickupWeaponMs: 0, unlockedWeapons: [1], weaponTimers: [0, 0, 0, 0, 0, 0], destroyed: 0, sector: 1, section: 1, phase: \"SECTOR_INTRO\", status: authenticated || sessionStorage.getItem(ADMIN_MODE_KEY) === \"1\" ? \"loading\" : \"playing\" });\n\n"
  },
  {
    "before": "\nconst GamePage = ({ ownerDiagnostics = false }: { ownerDiagnostics?: boolean }) => {\n  const { t, lives, locale } = useLocale();\n",
    "after": "\nconst GamePage = ({ ownerDiagnostics = false, authenticated = false }: { ownerDiagnostics?: boolean; authenticated?: boolean }) => {\n  const { t, lives, locale } = useLocale();\n"
  },
  {
    "before": "  const stateRef = useRef<GameState>(null!);\n  if (!stateRef.current) stateRef.current = createInitialState();\n  const projectilesRef = useRef<ReturnType<typeof createProjectilePresentation> | null>(null);\n",
    "after": "  const stateRef = useRef<GameState>(null!);\n  if (!stateRef.current) stateRef.current = createInitialState(authenticated);\n  const projectilesRef = useRef<ReturnType<typeof createProjectilePresentation> | null>(null);\n"
  },
  {
    "before": "  const [extraLifeVisible,setExtraLifeVisible]=useState(false);\n  const [game, setGame] = useState<GameState>(createInitialState);\n  useEffect(() => { wakeGameLoopRef.current?.(); }, [game.status]);\n",
    "after": "  const [extraLifeVisible,setExtraLifeVisible]=useState(false);\n  const [game, setGame] = useState<GameState>(() => createInitialState(authenticated));\n  useEffect(() => { wakeGameLoopRef.current?.(); }, [game.status]);\n"
  },
  {
    "before": "      shipSelectionRef.current = selected;\n      shipStageRef.current = adminRunRef.current ? data.shipStage ?? 1 : ownedShipStage(selected.skin.sprite, data.ownedShipUpgrades);\n      setShipStage(shipStageRef.current);\n",
    "after": "      shipSelectionRef.current = selected;\n      shipStageRef.current = adminRunRef.current ? data.shipStage ?? 1 : selectedShipStage(selected.skin.sprite, data.ownedShipUpgrades, data.shipStage ?? data.profile?.shipStage);\n      setShipStage(shipStageRef.current);\n"
  },
  {
    "before": "        syncSelectedWeapon(stateRef.current);\n        if (data.combat) restoreCombat(data.combat);\n        else varietyRef.current = createCombatVariety(true);\n",
    "after": "        syncSelectedWeapon(stateRef.current);\n        if (data.combat) {\n          restoreCombat(data.combat);\n          stateRef.current.projectileGuard = Math.min(stateRef.current.projectileGuard, projectileGuardForStage(shipStageRef.current));\n        }\n        else varietyRef.current = createCombatVariety(true);\n"
  },
  {
    "before": "    gameOverTimerRef.current = null;\n    stateRef.current = createInitialState();\n    weaponSpentRef.current = null; setWeaponSpent(null);\n",
    "after": "    gameOverTimerRef.current = null;\n    stateRef.current = createInitialState(authenticated);\n    weaponSpentRef.current = null; setWeaponSpent(null);\n"
  },
  {
    "before": "function GameEntry() {\n  const { authReady, isLoading, authError, signIn, canAdmin } = useAuth();\n  // Decide guest/account ownership only after authentication has settled.\n",
    "after": "function GameEntry() {\n  const { authReady, isLoading, authError, signIn, canAdmin, isAuthenticated } = useAuth();\n  // Decide guest/account ownership only after authentication has settled.\n"
  },
  {
    "before": "  return <GameRoute>{authReady && !isLoading && !authError\n    ? <GamePage ownerDiagnostics={canAdmin} />\n    : <GameAccessGate pending={!authReady || isLoading} error={authError} onRetry={() => { void signIn(); }} />}</GameRoute>;\n",
    "after": "  return <GameRoute>{authReady && !isLoading && !authError\n    ? <GamePage ownerDiagnostics={canAdmin} authenticated={isAuthenticated} />\n    : <GameAccessGate pending={!authReady || isLoading} error={authError} onRetry={() => { void signIn(); }} />}</GameRoute>;\n"
  }
];
export function restoreShipSelectionGameChanges(source) {
 source=restoreWeaponMenuGameChanges(source);
 for (const {before,after} of [...shipSelectionChanges].reverse()) {
  if (source.split(after).length !== 2) throw Error('Expected one exact ship-selection change');
  source=source.replace(after,before);
 }
 return source;
}

const accountBefore = "export type AccountSave = Pick<PlayerSave, \"cardReveals\" | \"usedShipSkins\" | \"version\" | \"balance\" | \"fleet\" | \"skin\" | \"color\" | \"mission\" | \"highestSector\" | \"totalDestroyed\" | \"totalShardsEarned\" | \"totalShardsSpent\" | \"legacyImported\" | \"updatedAt\">;";
const accountAfter = "export type AccountSave = Pick<PlayerSave, \"cardReveals\" | \"usedShipSkins\" | \"version\" | \"balance\" | \"fleet\" | \"skin\" | \"color\" | \"shipStage\" | \"mission\" | \"highestSector\" | \"totalDestroyed\" | \"totalShardsEarned\" | \"totalShardsSpent\" | \"legacyImported\" | \"updatedAt\">;";
export function restoreShipSelectionAccountChanges(source) {
 source=restoreBalanceAccountChanges(source);
 if (source.split(accountAfter).length !== 2) throw Error('Expected one exact selected-stage account type change');
 return source.replace(accountAfter,accountBefore);
}
