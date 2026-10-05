import { bossCardAvailable } from './cardAvailability';
import { keepScreenAwake } from './screenWakeLock';
import { introGroupBreathingMs } from './introDifficulty';
import CardReveal from './CardReveal';
import { availableShipCards, firstMissionStarterCards, type CardReward } from './cardRevealRules';
import { mergeCardReveals, rememberCard, hasSeenCard, syncCardReveals } from './cardRevealMemory';
import { primeCardSound } from './cardSound';
import { advanceBossCore } from './bossCore';
import { bossName } from './bossNames';
import { collectBossHeart, BOSS_HEART_POSITION, BOSS_EXTRA_LIFE_MS, type BossRewardState } from './bossReward';
import './bossReward.css';
import { blockFlights, nextBlockFlight, REINFORCEMENT_WARNING_MS, GROUP_CLEAR_POINTS } from "./blockFlights";
import { COMBAT_STATE_KEYS, COMBAT_REF_KEYS, readCombatCheckpoint, type CombatCheckpoint } from "../../../backend/src/combatCheckpoint";
import HullDamage from "./HullDamage";
import BlockchainProgress from "./BlockchainProgress";
import { gameHaptics } from "./gameHaptics";
import { advanceShipMotion, idleShipMotion, engineFlamePercent, explosionDiameter, fragmentFlight, hullIllumination, type ShipMotion } from "./shipRealism";
import { useLocale } from "../i18n";
import { memo, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { attackDuration, attackGroupSize, attackPosition, chooseAttackPattern, type AttackPattern } from "./attackPatterns";
import { entryPatternForSector, entryPosition, entryStartX, type EntryPattern } from "./entryPatterns";
import { ENTRY_GAP_MS, FORMATION_SETTLE_MS, SECTION_CLEAR_MS, SECTION_INTRO_MS, arrangeFormationBySize, campaignLevel, formationBelowHud, formationLayout, formationReady, formationSlotsForCount, sectionInSector, sectionPhase, sectorInChapter, sectorName, type SectorPhase } from "./sectorManager";
import { chooseCryptoid, cryptoidDisplayName, isGhostCloaked, type CryptoidClass, type CryptoidType, type FactionCode } from "./cryptoidRoster";
import { collectPowerUp as applyPowerUp, createPowerUpDrop, movePowerUps, powerUpDescriptions, powerUpNames, powerUpSymbols, POWER_UP_DURATION_MS, PURCHASED_POWER_UP_DURATION_MS, resolvePlayerDamage, type PowerUp, type PowerUpType } from "./powerUps";
import { readControlHand, readControlSensitivity, readControlZone, readShipStart, sensitivityMultiplier, zoneFraction, shipStartHeight } from "./controlPreferences";
import { advanceShot, contactWithEnemy, MAX_PLAYER_SHOTS, movePlayer, placePlayer, placePlayerFromPointer, PICKUP_WEAPON_DURATION_MS, PURCHASED_WEAPON_DURATION_MS, shipCollisionOutcome, shotHitsEnemy, type PlayerPosition, type PlayerShot } from "./playerCombat";
import { advanceEnemyShot, createEnemyShot, enemyShotHitsPlayer, enemyShotLimit, type EnemyShot } from "./enemyFire";
import { attackPressure, attackSlots } from "./attackPressure";
import SectorBackdrop from "./SectorBackdrop";
import Starfield from "./Starfield";
import { BONUS_FLIGHT_MS, BONUS_TARGET_COUNT, bonusEntryGap, bonusHeartReward, bonusPosition, bonusReward, bonusShowcaseShip, type BonusTarget } from "./bonusChallenge";
import { appendSectionBlock, bonusChainReward, BLOCKS_PER_CHAIN } from "./networkChain";
import { advanceAfterClear, BOSS_ENTRY_MS, BOSS_WARNING_MS, damageSectorBoss, bossVulnerable, createSectorBoss, moveSectorBoss, type SectorBoss } from "./sectorBoss";
import { playerSkins, enemyAppearance, selectedShip, shardBalance, ADMIN_MODE_KEY, ADMIN_TEST_CONFIG_KEY, ADMIN_SHIP_STAGE_KEY, ADMIN_START_SECTOR_KEY, SHARD_BALANCE_KEY, shipHullStyle, shipNozzleStyles, spriteStyle, spriteVisualOffset, type PlayerColorId } from "./shipFleet";
import PaintedShip from "./PaintedShip";
import { useShipVisualOffset } from "./paintedShip";
import { ownedShipStage, projectileGuardForStage, projectileImpact, shipEvolutionAsset, stageWeaponLevel, type ShipStage } from "./shipEvolution";
import { GameAudio, hasPrimedGameAudio, takePrimedGameAudio } from "./gameAudio";
import { EFFECTS_VOLUME_KEY, MUSIC_STORAGE_KEY, MUSIC_VOLUME_KEY, readEffectsVolume, readMusicVolume, resetAudioVolumeDefaults } from "./musicPreferences";
import { MusicPlayer, takeHandoffGameMusic } from "./musicPlayback";
import SystemSettings, { applySavedDisplaySettings } from "./SystemSettings";
import MissionWeaponShop from './MissionWeaponShop';
import './weaponSelection.css';
import { axiosClient } from "../lib/axiosClient";
import { accountSelection, createSaveQueue, loadAccountSave, localInventory, mutateAccountInventory, retrySave, snapshotOf, type AccountSave, type Snapshot } from "../lib/accountSave";
import axios from "axios";
import { fireInterval, makeVolley } from "./playerCombat";
import { activateCollectedPower } from "./collectedPower";
import { leaveGameFullscreen, requestGameFullscreen } from "./gameFullscreen";
import { levelDifficulty, MAX_DIFFICULTY_LEVEL } from "./levelDifficulty";
import { createDoubleKillCombo, creditComboDefeat, DOUBLE_KILL_SCORE, DOUBLE_KILL_SHARDS, type DoubleKillCombo } from "./doubleKillCombo";
import { balanceAfterMission, BONUS_TARGET_SHARD_REWARD, bossPoints, bossShardReward, creditReward } from "./shardEarnings";
import { addPersistentHullFire, hullFireAtImpact, hullFireLimit, spriteFireSites, type HullFire } from "./hullFires";
import { bossExplosionSize, bossFallTargetY, bossFireSite } from "./bossCombat";
import { bossHitTarget } from "./bossHitTarget";
import BossWeaponsView, { preloadBossWeapons } from './BossWeaponsView';
import BossHealthView from './BossHealthView';
import BossReactorView from './BossReactorView';
import { advanceBossTurrets, damageBossTurret, gunPosition } from './bossTurrets';
import { bossWeapons } from './bossWeapons';
import { bossEscortAttackInterval, bossEscortCount, bossEscortReinforcements, bossEscortRosterIndex, bossEscortSlots, reactorEscortCount, advanceEscortReserve } from "./bossEscorts";
import { awardBlock, awardBonusMedal, awardBossSticker, awardChain, emptyRewardProgress, reachLevel, rewardRank, type RewardProgress } from "./rewardProgress";

const BEST_SCORE_KEY = "cryptoid_best_score_v2";
const HIGHEST_SECTOR_KEY = "cryptoid_highest_sector";
const TOTAL_DESTROYED_KEY = "cryptoid_total_destroyed";
const RETURN_DURATION_MS = 3_500;
const IMPACT_COOLDOWN_MS = 1_500;
const GAME_OVER_REVEAL_MS = 1_750;
const ENTRY_HUD_GAP_PX = 8;
const BOSS_VICTORY_VOLUME_BOOST = 1.6;
// Let the deep impact lead before its long tail overlaps the victory cue.
const BOSS_FALL_DURATION_MS = 5_000;
const BOSS_VICTORY_START_MS = BOSS_FALL_DURATION_MS + 650;
// The complete victory recording is 3.408 seconds, including its release.
const BOSS_CLEAR_DURATION_MS = BOSS_VICTORY_START_MS + 3_700;
const pickupEffectLabels: Record<PowerUpType, string> = {
  shield: "Blocks the next hit", overdrive: "Double shot damage", weapon: "Weapon level", rapid: "Faster automatic fire", bomb: "Clears enemies and shots", emp: "Freezes enemies for 7s",
};
const FORMATION_DATA_ROWS = [
  "1011010001101001110001010011011010101100",
  "0010110111010010010011111011000101100110",
  "1110001001011011100101000110110111001010",
  "0101011110100011001110101101010001101001",
  "1001100101110100110010110010011010110101",
] as const;

type AsteroidSize = "small" | "medium" | "large";
type GameStatus = "loading" | "playing" | "paused" | "destroying" | "game-over" | "victory";

type Asteroid = {
  id: number;
  escort?: boolean;
  x: number;
  y: number;
  size: AsteroidSize;
  type: CryptoidType;
  shipClass: CryptoidClass;
  sprite: number;
  color: PlayerColorId;
  faction: FactionCode;
  radius: number;
  reward: number;
  points: number;
  entryDuration: number;
  attackPace: number;
  cloaked: boolean;
  health: number;
  maxHealth: number;
  hitUntil?: number;
  hit?: HullFire;
  hullFires?: HullFire[];
  rotation: number;
  rotationSpeed: number;
  entryElapsed: number;
  entryStartX: number;
  entryStartY: number;
  entryTargetX: number;
  entryTargetY: number;
  entrySide: number;
  entryPattern: EntryPattern;
  entryIndex: number;
  formationSlot: number;
  formationSlotCount: number;
  formationElapsed: number;
  formationDuration: number;
  attackPattern: AttackPattern | null;
  attackDelay: number;
  attackLane: number;
  attackElapsed: number;
  returnElapsed: number;
  firedThisAttack: boolean;
  visualMotion?: ShipMotion;
  hullLight?: number;
  muzzleAt?: number;
  collidedThisAttack: boolean;
};

type Effect = {
  id: number;
  x: number;
  y: number;
  kind: "shield" | "explosion" | "boss-fall" | "boss-explosion" | "player-crash" | "player-explosion" | "shatter" | "bomb-wave" | "emp-wave";
  startedAt: number;
  turretBonus?: number;
  target?: "player";
  sprite?: number;
  debrisSize?: number;
  bossImage?: string;
  bossModel?: SectorBoss;
  bossHeight?: number;
  bossShipWidth?: number;
  fieldWidth?: number;
  fieldHeight?: number;
  fallDistance?: number;
  fireSites?: readonly (readonly [number, number])[];
  explosionStages?: number;
  finalDelayMs?: number;
  debrisRotation?: number;
  shipClass?: CryptoidClass;
  debrisColor?: PlayerColorId;
  shipStage?: ShipStage;
  impactX?: number;
  impactY?: number;
  velocityX?: number;
  velocityY?: number;
};
type WeaponSource = "standard" | "paid" | "pickup";
type GameState = BossRewardState & { playerHullFires?: HullFire[]; playerHit?: HullFire; bossHullLight: number; combo: DoubleKillCombo; asteroids: Asteroid[]; bonusTargets: BonusTarget[]; bonusHits: number; bonusResult: string; chainBlocks: number; chainResult: string; rewardNotice: string; boss: SectorBoss | null; encounter: "normal" | "boss-intro" | "boss-fight" | "boss-clear" | "bonus"; shots: PlayerShot[]; enemyShots: EnemyShot[]; player: PlayerPosition; thrust: number; effects: Effect[]; powerUps: PowerUp[]; pickupNotice: { id: number; type: PowerUpType; remainingMs: number; level: number } | null; score: number; shards: number; hearts: number; maxHearts: number; projectileGuard: number; shieldCharges: number; shieldMs: number; purchasedShieldMs: number; shieldActive: boolean; overdriveMs: number; overdriveTotalMs: number; rapidFireMs: number; rapidFireTotalMs: number; empMs: number; pendingStartPower: "shield" | "overdrive" | "rapid" | "bomb" | "emp" | null; weaponLevel: number; weaponSource: WeaponSource; weaponCap: number; paidWeaponLevel: number; paidWeaponMs: number; pickupWeaponLevel: number; pickupWeaponMs: number; unlockedWeapons: number[]; weaponTimers: number[]; destroyed: number; sector: number; section: number; phase: SectorPhase; status: GameStatus };

const syncSelectedWeapon = (state: GameState) => {
  if (state.weaponSource === "pickup" && state.pickupWeaponMs <= 0) state.weaponSource = state.paidWeaponMs > 0 ? "paid" : "standard";
  if (state.weaponSource === "paid" && state.paidWeaponMs <= 0) state.weaponSource = state.pickupWeaponMs > 0 ? "pickup" : "standard";
  state.weaponLevel = state.weaponSource === "pickup" ? Math.min(state.weaponCap, state.pickupWeaponLevel) : state.weaponSource === "paid" ? state.paidWeaponLevel : 1;
};

const CockpitIcon = ({ kind }: { kind: "home" | "play" | "pause" }) => <svg className="game-control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === "home" ? <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10M10 20v-6h4v6" /></> : kind === "play" ? <path d="M8 5 19 12 8 19Z" fill="currentColor" stroke="none" /> : <><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /></>}</svg>;

const TimedRing = ({ remainingMs, durationMs }: { remainingMs: number; durationMs: number }) => {
  const circumference = 2 * Math.PI * 23;
  const progress = Math.max(0, Math.min(1, remainingMs / durationMs));
  return <svg className="timed-ring" viewBox="0 0 52 52" aria-hidden="true"><circle className="timed-ring-track" cx="26" cy="26" r="23" /><circle className="timed-ring-progress" cx="26" cy="26" r="23" strokeDasharray={`${circumference * progress} ${circumference}`} /></svg>;
};


const createInitialState = (): GameState => ({ bossHullLight: 0, combo: createDoubleKillCombo(), asteroids: [], bonusTargets: [], bonusHits: 0, bonusResult: "", chainBlocks: 0, chainResult: "", rewardNotice: "", boss: null, encounter: "normal", shots: [], enemyShots: [], player: { x: .5, y: shipStartHeight[readShipStart()] }, thrust: 0, effects: [], powerUps: [], pickupNotice: null, score: 0, shards: 0, hearts: 3, maxHearts: 3, projectileGuard: 0, shieldCharges: 0, shieldMs: 0, purchasedShieldMs: 0, shieldActive: true, overdriveMs: 0, overdriveTotalMs: POWER_UP_DURATION_MS, rapidFireMs: 0, rapidFireTotalMs: POWER_UP_DURATION_MS, empMs: 0, pendingStartPower: null, weaponLevel: 1, weaponSource: "standard", weaponCap: 1, paidWeaponLevel: 1, paidWeaponMs: 0, pickupWeaponLevel: 1, pickupWeaponMs: 0, unlockedWeapons: [1], weaponTimers: [0, 0, 0, 0, 0, 0], destroyed: 0, sector: 1, section: 1, phase: "SECTOR_INTRO", status: localStorage.getItem("cryptoid_pi_session") || sessionStorage.getItem(ADMIN_MODE_KEY) === "1" ? "loading" : "playing" });

const readRecord = (key: string) => Number(window.localStorage.getItem(key) || 0);

const saveRecords = (state: GameState) => {
  window.localStorage.setItem(BEST_SCORE_KEY, String(Math.max(readRecord(BEST_SCORE_KEY), state.score)));
  window.localStorage.setItem(HIGHEST_SECTOR_KEY, String(Math.max(readRecord(HIGHEST_SECTOR_KEY), state.sector)));
  window.localStorage.setItem(TOTAL_DESTROYED_KEY, String(readRecord(TOTAL_DESTROYED_KEY) + state.destroyed));
  // Earned Shards persist between runs; the current run starts at zero.
  window.localStorage.setItem(SHARD_BALANCE_KEY, String(balanceAfterMission(shardBalance(window.localStorage.getItem(SHARD_BALANCE_KEY)), state)));
};

const createFormationSlots = (section: number, sector: number, width: number, height: number, hudBottom: number, count?: number, offset = 0) => {
  const slots = formationSlotsForCount(formationLayout(section, width, height, sector), count ?? 6);
  const radii = slots.map((_, index) => chooseCryptoid(sector, index + offset).radius);
  return formationBelowHud(arrangeFormationBySize(slots, radii), radii, width, hudBottom);
};

const alignedSpritePosition = (x: number, y: number, sprite: number, renderedSize: number) => {
  const offset = spriteVisualOffset(sprite, renderedSize, true);
  return { left: x - offset.x, top: y - offset.y };
};

const spawnAsteroid = (id: number, width: number, visibleTop: number, formationIndex: number, sector: number, slots: ReturnType<typeof formationLayout>, offset = 0, rulesVersion = 2): Asteroid => {
  const profile = chooseCryptoid(sector, formationIndex + offset);
  const size: AsteroidSize = profile.radius === 25 ? "small" : profile.radius === 36 ? "medium" : "large";
  const target = slots[formationIndex];
  const flightVariation = rulesVersion === 2 ? Math.floor(offset / 6) : 0;
  const entrySide = target.entrySide * (flightVariation % 2 ? -1 : 1);
  const entryPattern = entryPatternForSector(sector + flightVariation * 3);
  const startX = entryStartX(entryPattern, formationIndex, width, profile.radius, entrySide);
  const entryStartY = visibleTop + profile.radius + ENTRY_HUD_GAP_PX;
  return { id, x: startX, y: entryStartY, size, ...profile, ...enemyAppearance(sector, formationIndex + offset), entryDuration: Math.max(4_100, Math.round(profile.entryDuration * .85)), health: profile.health, maxHealth: profile.health, cloaked: false, rotation: 0, rotationSpeed: 0, entryElapsed: 0, entryStartX: startX, entryStartY, entryTargetX: target.x, entryTargetY: target.y, entrySide, entryPattern, entryIndex: formationIndex, formationSlot: target.index, formationSlotCount: slots.length, formationElapsed: 0, formationDuration: FORMATION_SETTLE_MS, attackPattern: null, attackDelay: 0, attackLane: 0, attackElapsed: 0, returnElapsed: 0, firedThisAttack: false, collidedThisAttack: false };
};

const spawnBossEscort = (id: number, width: number, index: number, level: number, slots: ReturnType<typeof bossEscortSlots>, wave: number): Asteroid => {
  const rosterIndex = bossEscortRosterIndex(index, wave);
  const slot = slots[index];
  const enemy = spawnAsteroid(id, width, slot.y - 8, index, level, slots, rosterIndex - index);
  const startX = slot.entrySide === 1 ? 22 : width - 22;
  return { ...enemy, escort: true, size: "small", radius: 18, x: startX, y: slot.y - 8,
    entryStartX: startX, entryStartY: slot.y - 8, entryDuration: 1_850, formationDuration: 300 };
};

const attackTime = (asteroid: Asteroid) => asteroid.attackPattern === null ? 0 : attackDuration(asteroid.attackPattern) * asteroid.attackPace;

const moveAsteroid = (asteroid: Asteroid, delta: number, width: number, height: number): Asteroid => {
  const rotation = asteroid.rotation + asteroid.rotationSpeed * delta;
  const radius = asteroid.radius;
  const keepInField = (x: number) => Math.max(radius, Math.min(width - radius, x));
  const diveEndX = asteroid.entryTargetX + (width / 2 - asteroid.entryTargetX) * 0.45;
  const diveEndY = height - 75 + radius;
  if (asteroid.entryElapsed >= asteroid.entryDuration && asteroid.formationElapsed < asteroid.formationDuration) {
    const elapsed = asteroid.formationElapsed + delta;
    return { ...asteroid, x: keepInField(asteroid.entryTargetX), y: asteroid.entryTargetY, formationElapsed: Math.min(asteroid.formationDuration, elapsed), rotation };
  }
  if (asteroid.entryElapsed >= asteroid.entryDuration) {
    if (asteroid.attackPattern === null) return { ...asteroid, x: keepInField(asteroid.entryTargetX), y: asteroid.entryTargetY, rotation };
    if (asteroid.attackDelay > 0) return { ...asteroid, attackDelay: Math.max(0, asteroid.attackDelay - delta), rotation };
    const duration = attackTime(asteroid);
    if (asteroid.attackElapsed < duration) {
      const elapsed = Math.min(duration, asteroid.attackElapsed + delta);
      const point = attackPosition({ pattern: asteroid.attackPattern, progress: elapsed / duration, startX: asteroid.entryTargetX, startY: asteroid.entryTargetY, width, height, radius, side: asteroid.entrySide, lane: asteroid.attackLane });
      return { ...asteroid, ...point, attackElapsed: elapsed, rotation };
    }
    const elapsed = Math.min(RETURN_DURATION_MS, asteroid.returnElapsed + delta);
    const progress = elapsed / RETURN_DURATION_MS;
    if (elapsed === RETURN_DURATION_MS) {
      return { ...asteroid, x: keepInField(asteroid.entryTargetX), y: asteroid.entryTargetY, formationElapsed: 0, attackPattern: null, attackDelay: 0, attackLane: 0, attackElapsed: 0, returnElapsed: 0, firedThisAttack: false, collidedThisAttack: false, rotation };
    }
    const returnX = diveEndX + (asteroid.entryTargetX - diveEndX) * progress - asteroid.entrySide * Math.min(width * 0.09, 85) * Math.sin(Math.PI * progress);
    const returnY = diveEndY + (asteroid.entryTargetY - diveEndY) * progress;
    return { ...asteroid, x: keepInField(returnX), y: returnY, returnElapsed: elapsed, rotation };
  }
  const entryDelta = Math.min(delta, asteroid.entryDuration - asteroid.entryElapsed);
  const elapsed = Math.min(asteroid.entryDuration, asteroid.entryElapsed + delta);
  const progress = elapsed / asteroid.entryDuration;
  const point = entryPosition({ pattern: asteroid.entryPattern, progress, startX: asteroid.entryStartX, startY: asteroid.entryStartY, targetX: asteroid.entryTargetX, targetY: asteroid.entryTargetY, width, height, radius, side: asteroid.entrySide, index: asteroid.entryIndex });
  const ahead = entryPosition({ pattern: asteroid.entryPattern, progress: Math.min(1, progress + .01), startX: asteroid.entryStartX, startY: asteroid.entryStartY, targetX: asteroid.entryTargetX, targetY: asteroid.entryTargetY, width, height, radius, side: asteroid.entrySide, index: asteroid.entryIndex });
  const behind = entryPosition({ pattern: asteroid.entryPattern, progress: Math.max(0, progress - .01), startX: asteroid.entryStartX, startY: asteroid.entryStartY, targetX: asteroid.entryTargetX, targetY: asteroid.entryTargetY, width, height, radius, side: asteroid.entrySide, index: asteroid.entryIndex });
  const bank = 7 * Math.tanh((ahead.x - behind.x) / (width * .04)) * Math.sin(Math.PI * progress);
  return {
    ...asteroid,
    ...point,
    entryElapsed: elapsed,
    formationElapsed: Math.min(asteroid.formationDuration, delta - entryDelta),
    rotation: bank,
  };
};

const cryptoidMotionClass = (asteroid: Asteroid) => {
  if (asteroid.returnElapsed > 0) return " cryptoid-return";
  if (asteroid.entryElapsed < asteroid.entryDuration) return " cryptoid-launch";
  if (asteroid.attackPattern !== null && asteroid.attackDelay <= 0) return " cryptoid-boost";
  return "";
};

const engineTrails = (sprite: number, className: "exhaust" | "player-engine") =>
  shipNozzleStyles(sprite).map((style, index) => <span key={`${className}-${index}`} className={className} style={style} />);

const scatteredPieces = (effect: Effect, count: number, sprite: number) => {
  const columns = count === 16 || count === 8 ? 4 : 2;
  const rows = count / columns;
  let seed = Math.imul(effect.id, 0x9e3779b1) >>> 0;
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, (_, index) => {
    const x = index % columns;
    const y = Math.floor(index / columns);
    const left = x * 100 / columns;
    const top = y * 100 / rows;
    const right = (x + 1) * 100 / columns;
    const bottom = (y + 1) * 100 / rows;
    const jag = Math.min(7, 18 / columns);
    const shape = `polygon(${left + random() * jag}% ${top}%, ${right - random() * jag}% ${top}%, ${right}% ${top + random() * jag}%, ${right}% ${bottom - random() * jag}%, ${right - random() * jag}% ${bottom}%, ${left + random() * jag}% ${bottom}%, ${left}% ${bottom - random() * jag}%, ${left}% ${top + random() * jag}%)`;
    const hullWidth = effect.bossShipWidth ?? effect.debrisSize ?? 58;
    const hullHeight = effect.kind === "boss-explosion" ? effect.bossHeight ?? 100 : hullWidth;
    const flight = fragmentFlight(((x + .5) / columns - .5) * hullWidth, ((y + .5) / rows - .5) * hullHeight, effect.impactX ?? 0, effect.impactY ?? 0, hullWidth, random(), effect.velocityX, effect.velocityY);
    const pieceStyle = {
      clipPath: shape,
      transformOrigin: `${(x + .5) * 100 / columns}% ${(y + .5) * 100 / rows}%`,
      "--fragment-x": `${flight.x.toFixed(1)}px`,
      "--fragment-y": `${flight.y.toFixed(1)}px`,
      "--fragment-spin": `${flight.spin.toFixed(1)}deg`,
      "--fragment-delay": `${Math.floor(random() * 45)}ms`,
    } as CSSProperties;
    return <em key={index} className="scattered-debris-piece" style={pieceStyle}>
      {effect.kind === "boss-explosion" ? <b className="boss-fragment-hull" /> : effect.debrisColor ? <PaintedShip className="scattered-debris-sprite" sprite={sprite} color={effect.debrisColor} stage={effect.shipStage} /> : <b style={spriteStyle(sprite)} />}
    </em>;
  });
};

const shipDebris = (effect: Effect) => {
  if (effect.turretBonus) return <b className="turret-score-popup">+{effect.turretBonus}</b>;
  const sprite = effect.sprite;
  const style = {
    "--debris-size": `${effect.kind === "boss-explosion" ? effect.bossShipWidth ?? effect.debrisSize ?? 240 : effect.debrisSize ?? 58}px`,
    "--debris-height": `${effect.bossHeight ?? 100}px`,
    "--debris-rotation": `${(effect.target === "player" ? 0 : 180) + (effect.debrisRotation ?? 0)}deg`,
  } as CSSProperties;
  if (effect.kind === "boss-explosion") return <div className="ship-debris scattered-debris boss-debris-field" style={style} aria-hidden="true">{scatteredPieces(effect, 16, 0)}</div>;
  if (sprite === undefined) return null;
  // A collision can damage the player without destroying the ship.
  if (effect.kind === "player-crash") {
    return <div className="ship-debris player-crash-debris" style={style} aria-hidden="true">
      {[0, 1, 2, 3].map(index => <em className={`ship-debris-piece ship-debris-piece-${index + 1}`} key={index}>{effect.debrisColor ? <PaintedShip className="ship-debris-sprite" sprite={sprite} color={effect.debrisColor} stage={effect.shipStage} /> : <b style={spriteStyle(sprite)} />}</em>)}
    </div>;
  }
  const count = effect.shipClass === "heavy" || (effect.debrisSize ?? 0) >= 86 ? 8 : 4;
  return <div className={`ship-debris scattered-debris${effect.shipClass ? ` ship-debris-${effect.shipClass}` : ""}`} style={style} aria-hidden="true">
    {scatteredPieces(effect, count, sprite)}
  </div>;
};

const fallingBoss = (effect: Effect) => <div className="boss-falling-hull" style={{ left: effect.x, top: effect.y, width: effect.bossShipWidth, height: effect.bossHeight, "--boss-fall-distance": `${effect.fallDistance ?? 200}px`, "--boss-fall-quarter": `${(effect.fallDistance ?? 200) * .25}px`, "--boss-fall-half": `${(effect.fallDistance ?? 200) * .5}px`, "--boss-fall-three-quarters": `${(effect.fallDistance ?? 200) * .75}px`, "--boss-fall-duration": `${BOSS_FALL_DURATION_MS}ms` } as CSSProperties} aria-hidden="true">
  <img src={effect.bossImage} alt="" draggable={false} />
  {effect.bossModel && <BossWeaponsView boss={effect.bossModel} frozen/>}
  <div className="boss-fall-bursts">{effect.fireSites?.map(([x, y], index) => <i key={index} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${index * .3}s` }} />)}</div>
  <div className="boss-shedding">{effect.fireSites?.map(([x, y], index) => <i key={index} style={{ left: `${x}%`, top: `${y}%`, backgroundImage: `url('${effect.bossImage}')`, backgroundPosition: `${x}% ${y}%`, "--shed-x": `${(index % 2 ? 1 : -1) * (18 + index * 5)}px`, "--shed-spin": `${(index % 2 ? -1 : 1) * (70 + index * 19)}deg`, animationDelay: `${.35 + index * .43}s` } as CSSProperties} />)}</div>
</div>;

// Effects keep their object identity until they expire. Keep the fragments and
// their animations mounted instead of rebuilding the entire debris tree on every paint.
const ImpactEffectView = memo(({ effect }: { effect: Effect }) => effect.kind === "boss-fall" ? fallingBoss(effect) : <div className={`impact-effect ${effect.kind}`} style={{ left: effect.x, top: effect.y, ...(["explosion", "shatter", "player-explosion"].includes(effect.kind) ? { width: explosionDiameter(effect.debrisSize ?? 58), height: explosionDiameter(effect.debrisSize ?? 58), marginLeft: -explosionDiameter(effect.debrisSize ?? 58) / 2, marginTop: -explosionDiameter(effect.debrisSize ?? 58) / 2 } : {}), ...(effect.kind === "boss-explosion" ? { "--boss-explosion-size": `${effect.debrisSize ?? 240}px`, "--boss-image": `url('${effect.bossImage}')`, "--boss-final-delay": `${effect.finalDelayMs ?? 1_450}ms` } : {}) } as CSSProperties} aria-hidden="true">{effect.kind !== "boss-explosion" && <span />}{shipDebris(effect)}</div>);

const GamePage = () => {
  const { t, lives } = useLocale();
  useEffect(applySavedDisplaySettings, []);
  const navigate = useNavigate();
  const fieldRef = useRef<HTMLDivElement>(null);
  const fieldSizeRef = useRef({ width: 800, height: 600 });
  const hudRef = useRef<HTMLElement>(null);
  const visibleTopRef = useRef(96);
  const playerShipRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const nextIdRef = useRef(1);
  const formationIndexRef = useRef(0);
  const formationStartedRef = useRef(false);
  const flightRef = useRef(0);
  const rulesVersionRef = useRef<1 | 2>(2);
  const combatSequenceRef = useRef(0);
  const combatCheckpointAtRef = useRef(0);
  const formationOffsetRef = useRef(0);
  const bonusIndexRef = useRef(0);
  const sectionSlotsRef = useRef<ReturnType<typeof formationLayout> | null>(null);
  const bossEscortSlotsRef = useRef<ReturnType<typeof bossEscortSlots> | null>(null);
  const bossEscortWaveRef = useRef(0);
  const bossEscortSpawnedRef = useRef(0);
  const bossEscortTimerRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const lastPaintRef = useRef(0);
  const slowFramesRef = useRef(0);
  const backgroundHiddenAtRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const sectionElapsedRef = useRef(0);
  const clearTimerRef = useRef(0);
  const attackCooldownRef = useRef(0);
  const elapsedRef = useRef(0);
  const attackNumberRef = useRef(0);
  const dropsCreatedRef = useRef(0);
  const impactCooldownRef = useRef(0);
  const fireTimerRef = useRef(0);
  const keysRef = useRef(new Set<string>());
  const pointerRef = useRef<number | null>(null);
  const touchOriginRef = useRef<{ x: number; y: number; player: PlayerPosition } | null>(null);
  const lastPlayerRef = useRef<PlayerPosition | null>(null);
  const playerMotionRef = useRef(idleShipMotion());
  const playerMuzzleRef = useRef(0);
  const bossMuzzleRef = useRef(0);
  const [rewardCards,setRewardCards]=useState<CardReward[]>([]);
  const rewardCardsRef=useRef<CardReward[]>([]);
  const cardOwnerRef=useRef('guest');
  const bossLifeRemainingRef=useRef(0);
  const pendingBossCardRef=useRef<CardReward|null>(null);
  const [extraLifeVisible,setExtraLifeVisible]=useState(false);
  const showRewardCards=(cards:CardReward[])=>{
    cards=cards.filter(card=>!hasSeenCard(cardOwnerRef.current,card.key)&&!rewardCardsRef.current.some(queued=>queued.key===card.key));
    if(!cards.length)return;
    rewardCardsRef.current=[...rewardCardsRef.current,...cards];
    setRewardCards([...rewardCardsRef.current]);
    stateRef.current.status='paused'; keysRef.current.clear(); pointerRef.current=null; touchOriginRef.current=null;
    setGame({...stateRef.current});
  };
  const continueRewardCard=()=>{
    rewardCardsRef.current=rewardCardsRef.current.slice(1);setRewardCards([...rewardCardsRef.current]);
    keysRef.current.clear();pointerRef.current=null;touchOriginRef.current=null;
    if(!rewardCardsRef.current.length){stateRef.current.status='playing';lastFrameRef.current=performance.now();setGame({...stateRef.current});}
  };
  const [game, setGame] = useState<GameState>(createInitialState);
  useEffect(()=>{
    if(game.status==='playing')return keepScreenAwake(navigator,document);
  },[game.status]);
  useEffect(()=>{
    const card=rewardCards[0];if(!card)return;
    rememberCard(cardOwnerRef.current,card.key);
    void syncCardReveals(cardOwnerRef.current).catch(()=>{/* Local receipt is retried on the next account start. */});
  },[rewardCards[0]?.key]);
  const [startError, setStartError] = useState("");
  const [audioNeedsTap, setAudioNeedsTap] = useState(false);
  const [homePrompt, setHomePrompt] = useState(false);
  const [shipSelection, setShipSelection] = useState(selectedShip);
  const [resumeOffer, setResumeOffer] = useState<AccountSave | null>(null);
  const [confirmNewRun, setConfirmNewRun] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [saveRetrying, setSaveRetrying] = useState(false);
  const [pauseLeaving, setPauseLeaving] = useState(false);
  const pauseLeaveRef = useRef(false);
  const homePromptWasPlayingRef = useRef(false);
  const [accountRun, setAccountRun] = useState(false);
  const [recoveryError, setRecoveryError] = useState(false);
  const saveChoiceRef = useRef<"new" | "resume" | null>(null);
  const startKeyRef = useRef(crypto.randomUUID());
  const saveQueueRef = useRef<ReturnType<typeof createSaveQueue> | null>(null);
  const saveQueueReadyRef = useRef(false);
  const [shipStage, setShipStage] = useState<ShipStage>(1);
  const shipVisualOffset = useShipVisualOffset(shipSelection.skin.sprite, shipStage);
  const shipStageRef = useRef<ShipStage>(1);
  const recordsSavedRef = useRef(false);
  const scoreRunRef = useRef<string | null>(null);
  const rewardProgressRef = useRef<RewardProgress>(emptyRewardProgress());
  const pendingRewardsRef = useRef<Promise<unknown>>(Promise.resolve());
  const adminRunRef = useRef(false);
  const pendingScoreRef = useRef<Promise<unknown> | null>(null);
  const bestThisDeviceRef = useRef(readRecord(BEST_SCORE_KEY));
  const checkpointAtRef = useRef(0);
  const checkpointScoreRef = useRef(0);
  const [scoreSync, setScoreSync] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [musicEnabled] = useState(() => localStorage.getItem(MUSIC_STORAGE_KEY) !== "off");
  const [musicVolume, setMusicVolume] = useState(readMusicVolume);
  const [effectsVolume, setEffectsVolume] = useState(readEffectsVolume);
  useEffect(() => { resetAudioVolumeDefaults(); }, []);
  const musicRef = useRef<MusicPlayer | null>(null);
  const regularMusicPositionRef = useRef(0);
  const soundRef = useRef<GameAudio | null>(null);
  useEffect(()=>{if(game.boss)void preloadBossWeapons(game.boss.config).catch(()=>{});},[game.boss?.config]);
  const bossVictoryPendingRef = useRef(false);
  const bossVictoryFinishedRef = useRef(false);
  const bossDestroyPlayedRef = useRef(false);
  const audioCleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRequestRef = useRef(false);
  const [weaponMenuOpen, setWeaponMenuOpen] = useState(false);
  const [weaponStock, setWeaponStock] = useState<Record<string, number>>({});
  const [weaponBusy, setWeaponBusy] = useState(false);
  const weaponBusyRef = useRef(false);
  const activationRef = useRef<{ level: number; id: string } | null>(null);
  const [weaponError, setWeaponError] = useState('');
  const [weaponCountdown, setWeaponCountdown] = useState<number | null>(null);
  useEffect(() => {
    if (weaponCountdown === null) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') { setWeaponCountdown(3); return; }
      if (weaponCountdown > 1) setWeaponCountdown(weaponCountdown - 1);
      else { setWeaponCountdown(null); stateRef.current.status = 'playing'; setGame({ ...stateRef.current }); }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [weaponCountdown]);

  const combatRefs = { nextId: nextIdRef, formationIndex: formationIndexRef, formationOffset: formationOffsetRef, flight: flightRef, bonusIndex: bonusIndexRef, bossEscortWave: bossEscortWaveRef, bossEscortSpawned: bossEscortSpawnedRef, bossEscortTimer: bossEscortTimerRef, spawnTimer: spawnTimerRef, sectionElapsed: sectionElapsedRef, clearTimer: clearTimerRef, attackCooldown: attackCooldownRef, elapsed: elapsedRef, attackNumber: attackNumberRef, dropsCreated: dropsCreatedRef, impactCooldown: impactCooldownRef, fireTimer: fireTimerRef };
  const saveCombat = async () => {
    if (activationRef.current) return; // An uncertain activation must not be overwritten with stale local timers.
    const state = stateRef.current, runId = scoreRunRef.current, queue = saveQueueRef.current;
    // The boss reward already saves the extra life and the next bonus phase.
    if(state.encounter==='boss-clear'&&state.bossHeartCollected)return;
    if (!runId || !queue || adminRunRef.current || !["playing", "paused"].includes(state.status) || state.hearts < 1 || (state.phase === "SECTOR_CLEAR" && state.encounter !== "boss-clear")) return;
    if (state.status !== "playing") state.combo.pendingAt = null;
    const combat: CombatCheckpoint = JSON.parse(JSON.stringify({
      version: 1, clock: performance.now(), sequence: ++combatSequenceRef.current, stage: state.sector, encounter: state.encounter,
      width: fieldRef.current?.clientWidth || 800, height: fieldRef.current?.clientHeight || 600,
      state: Object.fromEntries(COMBAT_STATE_KEYS.map(k => [k, state[k]])),
      refs: Object.fromEntries(COMBAT_REF_KEYS.map(k => [k, combatRefs[k].current])),
      formationStarted: formationStartedRef.current, slots: sectionSlotsRef.current, escortSlots: bossEscortSlotsRef.current,
    }, (_key, value) => typeof value === "number" && !Number.isFinite(value) ? -1e9 : value));
    if (!readCombatCheckpoint(combat)) throw new Error("Invalid local combat checkpoint");
    await queue.enqueue({ path: "/progress/checkpoint", body: { runId, combat, save: snapshotOf(state) } });
    setSaveNotice(queue.durable ? "Game saved." : "Game saved. Offline backup unavailable.");
  };
  const restoreCombat = (input: CombatCheckpoint) => {
    const saved = readCombatCheckpoint(input);
    if (!saved) throw new Error("Invalid saved combat checkpoint");
    const width = fieldRef.current?.clientWidth || 800, height = fieldRef.current?.clientHeight || 600;
    const sx = width / saved.width, sy = height / saved.height;
    const project = (item: Record<string, unknown>) => {
      for (const key of ["x", "entryStartX", "entryTargetX", "attackStartX", "returnStartX"]) if (typeof item[key] === "number") item[key] *= sx;
      for (const key of ["y", "startY", "entryStartY", "entryTargetY", "attackStartY", "returnStartY"]) if (typeof item[key] === "number") item[key] *= sy;
      if ("muzzleAt" in item) item.muzzleAt = 0;
      if ("hitUntil" in item) item.hitUntil = 0;
    };
    for (const list of [saved.state.asteroids, saved.state.bonusTargets, saved.state.shots, saved.state.enemyShots, saved.state.powerUps, saved.slots, saved.escortSlots]) list?.forEach(project);
    if (saved.state.boss) {
      project(saved.state.boss);
      saved.state.boss.lastDamageAt = Math.max(-1e9, saved.state.boss.lastDamageAt + performance.now() - saved.clock);
      const model = createSectorBoss(saved.stage, width, visibleTopRef.current, height);
      for (const key of ["radius", "width", "height"] as const) saved.state.boss[key] = model[key];
    }
    if (saved.encounter === "normal" && (sx !== 1 || sy !== 1)) {
      const plan = blockFlights(saved.stage, rulesVersionRef.current);
      saved.slots = createFormationSlots(saved.stage, saved.stage, width, height, visibleTopRef.current, plan[saved.refs.flight], saved.refs.formationOffset);
      for (const enemy of saved.state.asteroids) {
        const slot = saved.slots.find(s => s.index === enemy.formationSlot);
        if (slot) { enemy.entryTargetX = slot.x; enemy.entryTargetY = slot.y; }
        enemy.x = Math.max(enemy.radius, Math.min(width - enemy.radius, enemy.x));
      }
    }
    for (const key of COMBAT_STATE_KEYS) if (saved.state[key] !== undefined) Object.assign(stateRef.current, { [key]: saved.state[key] });
    stateRef.current.sector = saved.stage;
    stateRef.current.section = saved.stage;
    stateRef.current.encounter = saved.encounter;
    for (const key of COMBAT_REF_KEYS) combatRefs[key].current = saved.refs[key];
    formationStartedRef.current = saved.formationStarted;
    sectionSlotsRef.current = saved.slots;
    bossEscortSlotsRef.current = saved.escortSlots;
  };

  const activateLoadout = async () => {
    if (startRequestRef.current || stateRef.current.status !== "loading") return;
    startRequestRef.current = true;
    try {
      if (pendingScoreRef.current) { try { await pendingScoreRef.current; } catch { /* The durable outbox is recovered below. */ } pendingScoreRef.current = null; }
      const adminRequested = sessionStorage.getItem(ADMIN_MODE_KEY) === "1";
      const requestedSector = adminRequested ? Number(sessionStorage.getItem(ADMIN_START_SECTOR_KEY) || 1) : 1;
      const requestedStage = adminRequested ? Number(sessionStorage.getItem(ADMIN_SHIP_STAGE_KEY) || 1) : 1;
      const savedTest = adminRequested ? JSON.parse(sessionStorage.getItem(ADMIN_TEST_CONFIG_KEY) || "null") : null;
      let profile: AccountSave | null = null;
      if (!adminRequested) {
        if (!saveQueueReadyRef.current) {
          const me = await axiosClient.get<{ user: { uid: string } }>("/user/me");
          cardOwnerRef.current=me.data.user.uid;
          saveQueueRef.current ??= createSaveQueue(me.data.user.uid);
          try { await saveQueueRef.current.recover(); }
          catch {
            setRecoveryError(true); setStartError("Save not confirmed. Retry or use the last confirmed save.");
            startRequestRef.current = false; return;
          }
          saveQueueReadyRef.current = true;
        }
        profile = await loadAccountSave();
        const legacy = localInventory();
        const hasLegacy = legacy.balance > 0 || Object.keys(legacy.fleet).length > 1 || Object.keys(legacy.fleet["grey-scout"] || {}).some(c => c !== "grey");
        if (!saveChoiceRef.current && (profile.mission || profile.version === 0 && hasLegacy)) {
          setResumeOffer(profile); startRequestRef.current = false; return;
        }
        saveChoiceRef.current ??= "new";
      }
      const { data } = await retrySave(() => axiosClient.post<{ weaponLevel: number; unlockedWeaponLevels: number[]; ownedShipUpgrades: string[]; powerUp: "shield" | "overdrive" | "rapid" | "bomb" | "emp" | null; armorBonus: number; scoreRunId: string | null; startSector: number; shipStage?: ShipStage; startPhase?: "normal" | "boss" | "bonus"; adminPreview: boolean; rulesVersion?: 1 | 2; combat?: CombatCheckpoint | null; checkpoint?: Snapshot | null; profile?: AccountSave }>(savedTest ? "/admin/start" : "/hangar/start", savedTest || { rulesVersion: 2, sector: requestedSector, shipStage: requestedStage, ...(profile ? { action: saveChoiceRef.current, version: profile.version, startKey: startKeyRef.current } : {}) }));
      if (adminRequested && !data.adminPreview) throw new Error("Admin preview session expired");
      adminRunRef.current = data.adminPreview === true;
      scoreRunRef.current = data.scoreRunId;
      rulesVersionRef.current = data.rulesVersion ?? 2;
      combatSequenceRef.current = 0;
      setAccountRun(!adminRunRef.current && Boolean(data.scoreRunId));
      rewardProgressRef.current = emptyRewardProgress();
      if (!adminRunRef.current && data.scoreRunId) {
        try {
          const rewards = await axiosClient.get<{ progress: RewardProgress }>("/rewards/me");
          rewardProgressRef.current = rewards.data.progress;
        } catch (error) { console.warn("Could not load account rewards", error); }
      }
      if (adminRunRef.current || data.checkpoint) {
        stateRef.current.sector = data.startSector;
        stateRef.current.section = data.startSector;
        stateRef.current.chainBlocks = (data.startSector - 1) % 10;
        if (data.startPhase === "bonus") {
          stateRef.current.encounter = "bonus";
          stateRef.current.chainBlocks = BLOCKS_PER_CHAIN;
          stateRef.current.boss = null;
        } else if (data.startSector % 10 === 0 && data.startSector <= 500) {
          stateRef.current.encounter = "boss-intro";
          stateRef.current.boss = createSectorBoss(data.startSector, fieldRef.current?.clientWidth || 390, visibleTopRef.current, fieldRef.current?.clientHeight || 700);
        }
      }
      const selected = !adminRunRef.current && data.profile ? accountSelection(data.profile) : shipSelection;
      if(!adminRunRef.current&&data.profile){
        // Never replay the existing hangar. Only a pristine account's first free starter
        // is an acquisition; versioned/used/imported accounts retain silent baselining.
        const starterCards = firstMissionStarterCards(profile);
        const baseline = availableShipCards(playerSkins,data.profile.fleet,data.profile.usedShipSkins||[],data.ownedShipUpgrades||[])
          .filter(card=>!starterCards.some(starter=>starter.key===card.key));
        mergeCardReveals(cardOwnerRef.current,[...(profile?.cardReveals||[]),...(data.profile.cardReveals||[]),...baseline.map(card=>card.key)]);
        void syncCardReveals(cardOwnerRef.current).catch(()=>{});
        rewardCardsRef.current=[];setRewardCards([]);
        showRewardCards(starterCards);
      }

      setShipSelection(selected);
      shipStageRef.current = adminRunRef.current ? data.shipStage ?? 1 : ownedShipStage(selected.skin.sprite, data.ownedShipUpgrades);
      setShipStage(shipStageRef.current);
      stateRef.current.projectileGuard = projectileGuardForStage(shipStageRef.current);
      const armorBonus = Number.isInteger(data.armorBonus) ? Math.max(0, Math.min(3, data.armorBonus)) : 0;
      stateRef.current.maxHearts = 3 + armorBonus;
      stateRef.current.hearts = stateRef.current.maxHearts;
      checkpointAtRef.current = 0;
      checkpointScoreRef.current = 0;
      stateRef.current.weaponLevel = 1;
      stateRef.current.weaponSource = "standard";
      stateRef.current.paidWeaponLevel = 1;
      stateRef.current.paidWeaponMs = 0;
      stateRef.current.unlockedWeapons = Array.isArray(data.unlockedWeaponLevels) ? [...new Set([1, ...data.unlockedWeaponLevels.filter(level => Number.isInteger(level) && level >= 1 && level <= 5)])].sort((a, b) => a - b) : [1];
      stateRef.current.weaponTimers = [0, 0, 0, 0, 0, 0];
      if (adminRunRef.current) for (const level of stateRef.current.unlockedWeapons) if (level > 1) stateRef.current.weaponTimers[level] = -1;
      if (adminRunRef.current && data.weaponLevel > 1) {
        stateRef.current.weaponLevel = data.weaponLevel;
        stateRef.current.paidWeaponLevel = data.weaponLevel;
        stateRef.current.weaponSource = "paid";
        stateRef.current.paidWeaponMs = PURCHASED_WEAPON_DURATION_MS;
        stateRef.current.weaponTimers[data.weaponLevel] = PURCHASED_WEAPON_DURATION_MS;
      }
      stateRef.current.weaponCap = Math.max(...stateRef.current.unlockedWeapons);
      if (data.powerUp) stateRef.current.pendingStartPower = data.powerUp;
      if (!adminRunRef.current && data.checkpoint) {
        Object.assign(stateRef.current, data.checkpoint);
        stateRef.current.hearts = data.checkpoint.hearts;
        stateRef.current.weaponTimers = data.checkpoint.weaponTimers.map((timer, level) => stateRef.current.unlockedWeapons.includes(level) ? timer : 0);
        syncSelectedWeapon(stateRef.current);
        if (data.combat) restoreCombat(data.combat);
        setSaveNotice(data.combat ? "Combat restored." : "Last completed section loaded.");
      }
    } catch (error) {
      console.error("Could not load paid loadout", error);
      if (sessionStorage.getItem(ADMIN_MODE_KEY) === "1") {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        setStartError(status === 401 ? "Pi session expired. Sign in again."
          : status === 403 ? "This Pi account has no admin access."
            : "Could not load the test. Retry or sign in again.");
        startRequestRef.current = false;
        return;
      }
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 409) { saveChoiceRef.current = null; startKeyRef.current = crypto.randomUUID(); }
      setStartError(status === 409 ? "Save changed. Reload and choose again." : "Save unavailable. Retry or sign in again. Local data is unchanged.");
      startRequestRef.current = false;
      return;
    }
    stateRef.current.status = rewardCardsRef.current.length ? "paused" : "playing";
    setGame({ ...stateRef.current });
  };
  useEffect(() => { if (stateRef.current.status === "loading") void activateLoadout(); }, []);

  useEffect(() => {
    const field = fieldRef.current;
    const hud = hudRef.current;
    if (!field || !hud) return;
    const measureVisibleTop = () => {
      const fieldBounds = field.getBoundingClientRect();
      fieldSizeRef.current = { width: field.clientWidth || 800, height: field.clientHeight || 600 };
      visibleTopRef.current = Math.max(0, hud.getBoundingClientRect().bottom - fieldBounds.top);
    };
    measureVisibleTop();
    const observer = new ResizeObserver(measureVisibleTop);
    observer.observe(field);
    observer.observe(hud);
    return () => { observer.disconnect(); gameHaptics.stop(); };
  }, []);


  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    let lastTouchEnd = 0;
    const preventGesture = (event: Event) => event.preventDefault();
    const preventDoubleTap = (event: TouchEvent) => {
      if (event.target instanceof Element && event.target.closest("button, .game-hud, .game-overlay, .touch-controls")) return;
      const now = performance.now();
      if (now - lastTouchEnd < 360) event.preventDefault();
      lastTouchEnd = now;
    };
    field.addEventListener("touchend", preventDoubleTap, { passive: false });
    field.addEventListener("gesturestart", preventGesture, { passive: false });
    field.addEventListener("gesturechange", preventGesture, { passive: false });
    return () => {
      field.removeEventListener("touchend", preventDoubleTap);
      field.removeEventListener("gesturestart", preventGesture);
      field.removeEventListener("gesturechange", preventGesture);
    };
  }, []);

  const submitScore = (state: GameState) => {
    const runId = scoreRunRef.current;
    if (!runId) return;
    scoreRunRef.current = null;
    setScoreSync("saving");
    const body = { runId, score: state.score, finished: state.hearts <= 0 || state.sector === 500 && state.encounter === "bonus" && state.phase === "SECTOR_CLEAR", save: snapshotOf(state) };
    pendingScoreRef.current = (saveQueueRef.current ? saveQueueRef.current.enqueue({ path: "/leaderboard/score", body }) : retrySave(() => axiosClient.post("/leaderboard/score", body)))
      .then(() => setScoreSync("saved"))
      .catch(() => setScoreSync("failed"));
  };

  useEffect(() => {
    if (!musicEnabled) return;
    void fetch("/audio/boss-victory-v2.mp3").catch(() => {});
    const track = takeHandoffGameMusic() ?? new MusicPlayer("/audio/battle-orbit.mp3", readMusicVolume());
    musicRef.current = track;
    const finishVictoryMusic = () => {
      if (stateRef.current.encounter !== "boss-clear" || track.currentSource !== "/audio/boss-victory-v2.mp3") return;
      bossVictoryFinishedRef.current = true;
      track.setSource("/audio/battle-orbit.mp3", regularMusicPositionRef.current);
      track.audio.loop = true;
      track.setVolume(readMusicVolume());
      if (stateRef.current.status === "playing") void track.play();
    };
    track.audio.addEventListener("ended", finishVictoryMusic);
    const resume = () => {
      if (document.visibilityState === "hidden" || (backgroundHiddenAtRef.current && Date.now() - backgroundHiddenAtRef.current > 1_000) || !["playing", "game-over", "victory"].includes(stateRef.current.status)) return;
      void track.play().then(ok => { if (ok && (readEffectsVolume() === 0 || soundRef.current?.running)) setAudioNeedsTap(false); });
    };
    document.addEventListener("pointerdown", resume, true);
    document.addEventListener("pointerup", resume, true);
    document.addEventListener("touchend", resume, true);
    document.addEventListener("keydown", resume, true);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pageshow", resume);
    window.addEventListener("focus", resume);
    resume();
    return () => {
      document.removeEventListener("pointerdown", resume, true);
      document.removeEventListener("pointerup", resume, true);
      document.removeEventListener("touchend", resume, true);
      document.removeEventListener("keydown", resume, true);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("focus", resume);
      track.audio.removeEventListener("ended", finishVictoryMusic);
      track.close();
      if (musicRef.current === track) musicRef.current = null;
    };
  }, [musicEnabled]);
  useEffect(() => {
    const track = musicRef.current;
    if (!track) return;
    const normalSource = "/audio/battle-orbit.mp3";
    const waitingForExplosion = game.encounter === "boss-clear" && bossVictoryPendingRef.current;
    const desiredSource = game.status === "game-over" ? "/audio/last-signal.mp3"
      : game.status === "victory" ? "/audio/beyond-the-last-star.mp3"
      : game.encounter === "boss-clear"
      ? waitingForExplosion ? "/audio/dreadnought-duel.mp3" : bossVictoryFinishedRef.current ? normalSource : "/audio/boss-victory-v2.mp3"
      : game.encounter === "boss-intro" || game.encounter === "boss-fight"
        ? "/audio/dreadnought-duel.mp3"
        : normalSource;
    track.audio.loop = game.status === "playing" && (game.encounter !== "boss-clear" || waitingForExplosion || bossVictoryFinishedRef.current);
    if (track.currentSource !== desiredSource) {
      if (track.currentSource === normalSource) regularMusicPositionRef.current = track.audio.currentTime || 0;
      track.setSource(desiredSource, desiredSource === normalSource ? regularMusicPositionRef.current : 0);
    }
    if (game.status === "playing" || game.status === "game-over" || game.status === "victory") void track.play().then(ok => {
      if (game.status === "game-over" || game.status === "victory") setAudioNeedsTap(!ok);
      else if (!ok) setAudioNeedsTap(true);
    });
    else if (game.status !== "loading") track.pause();
  }, [game.status, game.encounter, musicEnabled]);
  useEffect(() => {
    const volume = game.status === "playing" && game.encounter === "boss-clear"
      ? Math.min(100, musicVolume * BOSS_VICTORY_VOLUME_BOOST)
      : musicVolume;
    musicRef.current?.setVolume(volume);
  }, [musicVolume, game.encounter]);
  const startBossVictory = () => {
    bossVictoryPendingRef.current = false;
    const track = musicRef.current;
    if (!track) return;
    track.audio.loop = false;
    track.setSource("/audio/boss-victory-v2.mp3");
    void track.play();
  };
  const saveReward = (award: (progress: RewardProgress) => { progress: RewardProgress; notice: string }, event: { kind: "block" | "boss" | "chain" | "bonus"; level: number; stage: number; hits?: number }) => {
    if (adminRunRef.current) return "";
    const result = award(rewardProgressRef.current);
    rewardProgressRef.current = result.progress;
    const runId = scoreRunRef.current;
    if (runId) {
      setSaveNotice("Saving game…");
      const body = { runId, ...event, save: snapshotOf(stateRef.current) };
      pendingRewardsRef.current = (saveQueueRef.current ? saveQueueRef.current.enqueue({ path: "/rewards/event", body }) : retrySave(() => axiosClient.post("/rewards/event", body)))
        .then(() => setSaveNotice(saveQueueRef.current?.durable === false ? "Game saved. Offline backup unavailable." : "Game saved."))
        .catch(() => setSaveNotice("Save not confirmed. Retry or use the last confirmed save."));
    }
    return result.notice;
  };
  const destroyBoss = (state: GameState, time: number) => {
    soundRef.current?.stopBossWeapons();
    const boss = state.boss;
    if (!boss) return;
    state.bossHeartCollected = false;
    const finalDelayMs = BOSS_FALL_DURATION_MS;
    const fieldWidth = fieldRef.current?.clientWidth || 800;
    const fieldHeight = fieldRef.current?.clientHeight || 700;
    const finalY = bossFallTargetY(boss, fieldHeight);
    const fireSites = Array.from({ length: 8 }, (_, index) => boss.config.fireSites[Math.floor(index * boss.config.fireSites.length / 8)]);
    state.effects.push({ id: nextIdRef.current++, x: boss.x, y: boss.y, kind: "boss-fall", startedAt: time, bossShipWidth: boss.width, bossHeight: boss.height, bossImage: boss.config.image, bossModel:{...boss,turrets:boss.turrets.map(g=>({...g,firedBarrels:[...g.firedBarrels]}))}, fallDistance: finalY - boss.y, fireSites });
    state.effects.push({ id: nextIdRef.current++, x: boss.x, y: finalY, kind: "boss-explosion", startedAt: time, debrisSize: bossExplosionSize(boss.config, boss.width), bossShipWidth: boss.width, bossHeight: boss.height, bossImage: boss.config.wreckImage, finalDelayMs, fieldWidth, fieldHeight, shipClass: "heavy" });
    soundRef.current?.play("explosion");
    gameHaptics.explosion();
    gameHaptics.boss([25, 420, 30, 420, 35, 420, 40, 420, 45, 420, 50]);
    bossDestroyPlayedRef.current = false;
    bossVictoryPendingRef.current = true;
    bossVictoryFinishedRef.current = false;
    clearTimerRef.current = 0;
    state.score += bossPoints(state.sector);
    creditComboDefeat(state, bossShardReward(state.sector), elapsedRef.current);
    state.encounter = "boss-clear";
    state.phase = "SECTOR_CLEAR";
    state.asteroids = [];
    state.enemyShots = [];
    state.shots = [];
    state.powerUps = [];
    state.boss = null;
    void saveCombat().catch(() => setSaveNotice("Save not confirmed. Pending data will be retried."));
  };
  const changeEffectsVolume = (value: number) => {
    localStorage.setItem(EFFECTS_VOLUME_KEY, String(value));
    setEffectsVolume(value);
    soundRef.current?.setEffectsVolume(value);
  };
  const changeMusicVolume = (value: typeof musicVolume) => {
    localStorage.setItem(MUSIC_VOLUME_KEY, String(value));
    setMusicVolume(value);
  };

  useEffect(() => {
    if (audioCleanupRef.current !== null) window.clearTimeout(audioCleanupRef.current);
    return () => {
      // StrictMode immediately remounts in development; preserve the primed audio across that cycle.
      audioCleanupRef.current = window.setTimeout(() => {
        soundRef.current?.close();
      }, 0);
    };
  }, []);
  useEffect(() => {
    soundRef.current?.setSector(game.sector);
    if (game.status !== "playing") { stateRef.current.combo.pendingAt = null; gameHaptics.stop(); }
    soundRef.current?.setPaused(game.status === "loading" || game.status === "paused" || game.status === "game-over" || game.status === "victory");
  }, [game.sector, game.status]);

  const startEffects = () => {
    if (!soundRef.current) {
      const audio = takePrimedGameAudio() ?? new GameAudio();
      audio.setEffectsVolume(readEffectsVolume());
      audio.setSector(stateRef.current.sector);
      audio.setPaused(stateRef.current.status !== "playing");
      soundRef.current = audio;
    }
    // Retry inside each gesture: Safari can interrupt Web Audio after fullscreen.
    return soundRef.current.start();
  };
  useEffect(() => { if (hasPrimedGameAudio()) void startEffects(); }, []);

  useEffect(() => {
    if (game.status !== "playing") return;
    // A suspended context can leave resume() pending on iOS. Offer a gesture
    // instead of allowing an indefinitely silent mission.
    const timer = window.setTimeout(() => {
      if ((readEffectsVolume() > 0 && !soundRef.current?.running) || (musicEnabled && !musicRef.current?.playing)) setAudioNeedsTap(true);
    }, 1_500);
    return () => window.clearTimeout(timer);
  }, [game.status, musicEnabled]);

  const retryAudio = () => {
    void Promise.all([startEffects(), musicEnabled && musicRef.current ? musicRef.current.play() : Promise.resolve(true)]).then(([effects, music]) => {
      setAudioNeedsTap((readEffectsVolume() > 0 && !effects) || (musicEnabled && !music));
    });
  };

  useEffect(() => {
    const controls = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "KeyD", "KeyW", "KeyS"]);
    const keyDown = (event: KeyboardEvent) => {
      if (rewardCardsRef.current.length || !controls.has(event.code) || (event.target as HTMLElement)?.closest("input, textarea, select")) return;
      event.preventDefault();
      void startEffects();
      keysRef.current.add(event.code);
    };
    const keyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    const blur = () => keysRef.current.clear();
    const pauseAfterBackground = () => {
      if (document.visibilityState === "hidden") {
        if (stateRef.current.status === "playing") void saveCombat().catch(() => setSaveNotice("Save not confirmed. Pending data will be retried."));
        if (!backgroundHiddenAtRef.current) backgroundHiddenAtRef.current = Date.now();
        keysRef.current.clear();
        pointerRef.current = null;
        touchOriginRef.current = null;
        return;
      }
      if (backgroundHiddenAtRef.current && Date.now() - backgroundHiddenAtRef.current > 1_000 && stateRef.current.status === "playing") {
        stateRef.current.status = "paused";
        void saveCombat().catch(() => setSaveNotice("Save not confirmed. Pending data will be retried."));
        soundRef.current?.setPaused(true);
        musicRef.current?.pause();
        setGame({ ...stateRef.current });
      }
      backgroundHiddenAtRef.current = 0;
      lastFrameRef.current = 0;
      slowFramesRef.current = 0;
    };
    const markPageHidden = () => {
      if (stateRef.current.status === "playing") void saveCombat().catch(() => {});
      if (!backgroundHiddenAtRef.current) backgroundHiddenAtRef.current = Date.now();
      keysRef.current.clear();
      pointerRef.current = null;
      touchOriginRef.current = null;
    };
    window.addEventListener("keydown", keyDown);
    const resumeAudio = () => {
      if (document.visibilityState === "hidden" || (backgroundHiddenAtRef.current && Date.now() - backgroundHiddenAtRef.current > 1_000) || stateRef.current.status !== "playing") return;
      retryAudio();
    };
    document.addEventListener("pointerup", resumeAudio, true);
    document.addEventListener("touchend", resumeAudio, true);
    document.addEventListener("visibilitychange", resumeAudio);
    document.addEventListener("visibilitychange", pauseAfterBackground);
    window.addEventListener("pagehide", markPageHidden);
    window.addEventListener("pageshow", resumeAudio);
    window.addEventListener("pageshow", pauseAfterBackground);
    window.addEventListener("focus", resumeAudio);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); window.removeEventListener("blur", blur); document.removeEventListener("pointerup", resumeAudio, true); document.removeEventListener("touchend", resumeAudio, true); document.removeEventListener("visibilitychange", resumeAudio); document.removeEventListener("visibilitychange", pauseAfterBackground); window.removeEventListener("pagehide", markPageHidden); window.removeEventListener("pageshow", resumeAudio); window.removeEventListener("pageshow", pauseAfterBackground); window.removeEventListener("focus", resumeAudio); };
  }, []);

  useEffect(() => {
    const loop = (time: number) => {
      const state = stateRef.current;
      const frameGap = time - (lastFrameRef.current || time);
      const delta = Math.min(34, frameGap);
      lastFrameRef.current = time;
      // Preserve destruction effects through a user pause or a backgrounded tab.
      if (state.status !== "playing") {
        for (const effect of state.effects) {
          if (effect.kind === "boss-fall" || effect.kind === "boss-explosion") effect.startedAt += frameGap;
        }
      }
      if (state.status === "playing") {
        if(bossLifeRemainingRef.current>0){
          bossLifeRemainingRef.current=Math.max(0,bossLifeRemainingRef.current-delta);
          if(bossLifeRemainingRef.current===0)setExtraLifeVisible(false);
        }
        // ResizeObserver refreshes geometry only when the field changes size.
        // Reading layout after moving ships every RAF forces needless reflows.
        const { width, height } = fieldSizeRef.current;
        const visibleTop = visibleTopRef.current;
        const slots = sectionSlotsRef.current ?? createFormationSlots(state.section, state.sector, width, height, visibleTop);
        sectionSlotsRef.current = slots;
        const bonus = state.encounter === "bonus";
        const normal = state.encounter === "normal";
        const readyCount = state.asteroids.filter(asteroid => asteroid.entryElapsed >= asteroid.entryDuration && asteroid.formationElapsed >= asteroid.formationDuration).length;
        const formationIsReady = normal && formationReady({ spawned: formationIndexRef.current, total: slots.length, alive: state.asteroids.length, ready: readyCount });
        if (formationIsReady) formationStartedRef.current = true;
        const transitionPaused = state.phase === "SECTOR_INTRO" || state.phase === "SECTOR_CLEAR" || state.encounter === "boss-intro" || state.encounter === "boss-clear" || (normal && !formationStartedRef.current);
        const keys = keysRef.current;
        const horizontal = Number(keys.has("ArrowRight") || keys.has("KeyD")) - Number(keys.has("ArrowLeft") || keys.has("KeyA"));
        const vertical = Number(keys.has("ArrowDown") || keys.has("KeyS")) - Number(keys.has("ArrowUp") || keys.has("KeyW"));
        if (horizontal || vertical) {
          state.player = movePlayer(state.player, horizontal, vertical, delta, width, height);
          // Keep the ship at display cadence without re-rendering every projectile on mobile.
          if (playerShipRef.current) {
            playerShipRef.current.style.left = `${state.player.x * 100}%`;
            playerShipRef.current.style.top = `${state.player.y * 100}%`;
          }
        }
        const previousPlayer = lastPlayerRef.current ?? state.player;
        playerMotionRef.current = advanceShipMotion(playerMotionRef.current, (state.player.x - previousPlayer.x) * width, (state.player.y - previousPlayer.y) * height, delta);
        state.thrust = playerMotionRef.current.thrust;
        playerShipRef.current?.style.setProperty("--flame-length", `${engineFlamePercent(state.thrust)}%`);
        playerShipRef.current?.style.setProperty("--visual-bank", `${playerMotionRef.current.bank}deg`);
        // Muzzle light belongs at the gun, not across the entire ship skin.
        playerShipRef.current?.style.setProperty("--hull-light", String(hullIllumination(state.player.x * width, state.player.y * height, time, 0, state.effects)));
        playerShipRef.current?.style.setProperty("--muzzle-light", String(playerMuzzleRef.current > 0 ? Math.max(0, 1 - (time - playerMuzzleRef.current) / 95) * .75 : 0));
        lastPlayerRef.current = state.player;
        if (!transitionPaused) elapsedRef.current += delta;
        impactCooldownRef.current = Math.max(0, impactCooldownRef.current - delta);
        state.overdriveMs = Math.max(0, state.overdriveMs - (transitionPaused ? 0 : delta));
        state.rapidFireMs = Math.max(0, state.rapidFireMs - (transitionPaused ? 0 : delta));
        state.empMs = Math.max(0, state.empMs - (transitionPaused ? 0 : delta));
        state.shieldMs = Math.max(0, state.shieldMs - (transitionPaused ? 0 : delta));
        state.purchasedShieldMs = Math.max(0, state.purchasedShieldMs - (transitionPaused ? 0 : delta));
        if (state.shieldMs === 0) state.shieldCharges = 0;
        const playerRecovering = state.effects.some(effect => effect.target === "player" && (effect.kind === "player-crash" || effect.kind === "player-explosion"));
        const purchasedWeaponDelta = transitionPaused || playerRecovering || state.weaponSource !== "paid" ? 0 : delta;
        const pickupWeaponDelta = transitionPaused ? 0 : delta;
        state.weaponTimers = state.weaponTimers.map((remaining, level) => level === state.paidWeaponLevel && remaining > 0 ? Math.max(0, remaining - purchasedWeaponDelta) : remaining);
        if (state.paidWeaponLevel > 1) {
          state.paidWeaponMs = Math.max(0, state.weaponTimers[state.paidWeaponLevel] ?? 0);
          if (state.paidWeaponMs === 0) state.paidWeaponLevel = 1;
        } else {
          state.paidWeaponMs = 0;
        }
        state.pickupWeaponMs = Math.max(0, state.pickupWeaponMs - pickupWeaponDelta);
        if (state.pickupWeaponMs === 0) state.pickupWeaponLevel = 1;
        syncSelectedWeapon(state);
        state.combo.remainingMs = Math.max(0, state.combo.remainingMs - delta);
        if (state.pickupNotice) {
          state.pickupNotice.remainingMs -= transitionPaused ? 0 : delta;
          if (state.pickupNotice.remainingMs <= 0) state.pickupNotice = null;
        }
        sectionElapsedRef.current += delta;
        if (state.phase === "SECTOR_CLEAR") {
          clearTimerRef.current += delta;
          if (state.encounter === "boss-clear") {
            if (!bossDestroyPlayedRef.current && clearTimerRef.current >= BOSS_FALL_DURATION_MS) {
              bossDestroyPlayedRef.current = true;
              soundRef.current?.play("bossDestroy");
              gameHaptics.boss([140, 70, 230]);
            }
            if (bossVictoryPendingRef.current && clearTimerRef.current >= BOSS_VICTORY_START_MS) startBossVictory();
          }
          const victoryStillPlaying = state.encounter === "boss-clear" && musicRef.current?.currentSource === "/audio/boss-victory-v2.mp3" && musicRef.current.playing && !musicRef.current.audio.ended;
          const clearFinished = clearTimerRef.current >= (state.encounter === "boss-clear" ? BOSS_CLEAR_DURATION_MS : SECTION_CLEAR_MS) && !victoryStillPlaying;
          if (clearFinished && state.encounter === 'boss-clear' && collectBossHeart(state, state.player, width, height)) {
            soundRef.current?.play('extraLife');
            bossLifeRemainingRef.current=BOSS_EXTRA_LIFE_MS;
            setExtraLifeVisible(true);
            const bossId = Math.floor(state.sector / 10);
            const firstUnlock=!(rewardProgressRef.current.bossWins[bossId]>0);
            state.rewardNotice = saveReward(progress => {
              const previousRank = rewardRank(progress);
              const result = awardBossSticker(progress, bossId);
              const next = reachLevel(result.progress, Math.min(500, state.sector + 1));
              const rank = rewardRank(next);
              return { progress: next, notice: `Boss stickers · ${bossId}/50 · ${result.stars}★${rank !== previousRank ? ` · New rank · ${rank}` : ''}` };
            }, { kind: 'boss', level: bossId, stage: state.sector });
            if(firstUnlock&&!adminRunRef.current&&bossCardAvailable(bossId)&&!hasSeenCard(cardOwnerRef.current,`boss-${bossId}`))
              pendingBossCardRef.current={key:`boss-${bossId}`,boss:bossId,stars:rewardProgressRef.current.bossWins[bossId]||1};

          }
          if(state.encounter==='boss-clear'&&state.bossHeartCollected&&bossLifeRemainingRef.current===0&&pendingBossCardRef.current){
            const card=pendingBossCardRef.current;pendingBossCardRef.current=null;
            showRewardCards([card]);animationRef.current=window.requestAnimationFrame(loop);return;
          }
          if (clearFinished && (state.encounter !== 'boss-clear' || state.bossHeartCollected&&bossLifeRemainingRef.current===0)) {
            if (state.encounter === "bonus" && state.sector === MAX_DIFFICULTY_LEVEL) {
              if (!recordsSavedRef.current) {
                if (!adminRunRef.current && !scoreRunRef.current) saveRecords(state);
                recordsSavedRef.current = true;
                submitScore(state);
              }
              state.status = "victory";
              state.enemyShots = [];
              state.shots = [];
              setGame({ ...state });
              animationRef.current = window.requestAnimationFrame(loop);
              return;
            }
            const clearEncounter = state.encounter === "boss-clear" ? "boss-clear" : state.encounter === "bonus" ? "bonus" : "normal";
            const next = advanceAfterClear(state.section, clearEncounter);
            state.section = next.section;
            state.sector = next.sector;
            state.encounter = next.encounter;
            state.bossHeartCollected = undefined;
            if (next.encounter === "boss-intro") {
              state.boss = createSectorBoss(state.sector, width, visibleTop, height);
              soundRef.current?.play("boss");
            } else {
              state.boss = null;
            }
            state.combo.pendingAt = null;
            if (next.resetChain) { state.chainBlocks = 0; state.combo.level = 0; }
            state.phase = "SECTOR_INTRO";
            state.asteroids = [];
            state.bonusTargets = [];
            state.bonusHits = 0;
            state.bonusResult = "";
            state.chainResult = "";
            state.shots = [];
            state.enemyShots = [];
            state.effects = [];
            formationIndexRef.current = 0;
            formationStartedRef.current = false;
            flightRef.current = 0;
            formationOffsetRef.current = 0;
            bonusIndexRef.current = 0;
            sectionSlotsRef.current = createFormationSlots(state.section, state.sector, width, height, visibleTop);
            bossEscortSlotsRef.current = null;
            bossEscortWaveRef.current = 0;
            bossEscortSpawnedRef.current = 0;
            bossEscortTimerRef.current = 0;
            spawnTimerRef.current = 0;
            sectionElapsedRef.current = 0;
            clearTimerRef.current = 0;
            attackCooldownRef.current = 0;
            setGame({ ...state });
            animationRef.current = window.requestAnimationFrame(loop);
            return;
          }
        }
        if (bonus && sectionElapsedRef.current >= SECTION_INTRO_MS && state.phase !== "SECTOR_CLEAR" && bonusIndexRef.current < BONUS_TARGET_COUNT) {
          spawnTimerRef.current += delta;
          const entryGap = bonusEntryGap(bonusIndexRef.current);
          if (spawnTimerRef.current >= entryGap) {
            spawnTimerRef.current -= entryGap;
            const index = bonusIndexRef.current++;
            state.bonusTargets.push({ id: nextIdRef.current++, index, elapsed: 0, ...bonusPosition(index, 0, width, height), radius: 22, ...bonusShowcaseShip(index, state.sector) });
          }
        }
        if (normal && sectionElapsedRef.current >= SECTION_INTRO_MS && state.phase !== "SECTOR_CLEAR" && formationIndexRef.current < slots.length) {
          spawnTimerRef.current += delta;
          if (spawnTimerRef.current >= ENTRY_GAP_MS) {
            spawnTimerRef.current -= ENTRY_GAP_MS;
            state.asteroids.push(spawnAsteroid(nextIdRef.current++, width, visibleTop, formationIndexRef.current++, state.sector, slots, formationOffsetRef.current, rulesVersionRef.current));
          }
        }
        if (state.encounter === "boss-fight" && state.boss && state.empMs === 0 && state.boss.elapsed >= BOSS_ENTRY_MS + 1_500) {
          const reservePhase = state.boss.turrets.every(gun => gun.health <= 0);
          if (bossEscortSlotsRef.current === null && !reservePhase && bossEscortCount(state.sector) > 0) {
            bossEscortSlotsRef.current = bossEscortSlots(state.sector, width, height, state.boss, bossEscortCount(state.sector));
          }
          let escortSlots = bossEscortSlotsRef.current;
          const pending = escortSlots !== null && bossEscortSpawnedRef.current < escortSlots.length;
          if (reservePhase && !pending) {
            const reserve = advanceEscortReserve(state.boss, state.sector, state.asteroids.length, bossEscortTimerRef.current, delta);
            bossEscortTimerRef.current = reserve.elapsed;
            if (reserve.ready) {
              const nextSlots = bossEscortSlots(state.sector, width, height, state.boss, reactorEscortCount(state.sector));
              if (nextSlots.length) {
                bossEscortWaveRef.current++;
                bossEscortSpawnedRef.current = 0;
                bossEscortTimerRef.current = 360; // First ship enters this frame, including level 50's zero-gap waves.
                escortSlots = nextSlots;
                bossEscortSlotsRef.current = nextSlots;
              }
            }
          } else if (!reservePhase && escortSlots && bossEscortWaveRef.current === 0 && bossEscortSpawnedRef.current === escortSlots.length && state.boss.health <= state.boss.maxHealth * .55
            && state.asteroids.length <= 1 && bossEscortReinforcements(state.sector) > 0) {
            bossEscortWaveRef.current = 1;
            bossEscortSpawnedRef.current = 0;
            bossEscortTimerRef.current = 0;
            escortSlots = bossEscortSlots(state.sector, width, height, state.boss, bossEscortReinforcements(state.sector));
            bossEscortSlotsRef.current = escortSlots;
          }
          if (escortSlots && bossEscortSpawnedRef.current < escortSlots.length) {
            bossEscortTimerRef.current += delta;
            if (bossEscortTimerRef.current >= 360) {
              bossEscortTimerRef.current -= 360;
              state.asteroids.push(spawnBossEscort(nextIdRef.current++, width, bossEscortSpawnedRef.current++, state.sector, escortSlots, bossEscortWaveRef.current));
              if (bossEscortSpawnedRef.current === escortSlots.length) bossEscortTimerRef.current = 0;
            }
          }
        }
        const ready = state.asteroids.filter(asteroid => asteroid.entryElapsed >= asteroid.entryDuration && asteroid.formationElapsed >= asteroid.formationDuration);
        const formationComplete = normal && formationReady({ spawned: formationIndexRef.current, total: slots.length, alive: state.asteroids.length, ready: ready.length });
        const escortComplete = state.encounter === "boss-fight" && !!bossEscortSlotsRef.current && formationReady({ spawned: bossEscortSpawnedRef.current, total: bossEscortSlotsRef.current.length, alive: state.asteroids.length, ready: ready.length });
        const activeAttackers = state.asteroids.filter(enemy => enemy.attackPattern !== null).length;
        const availableAttackers = ready.filter(enemy => enemy.attackPattern === null);
        const pressure = attackPressure(state.sector);
        const slotsAvailable = normal ? attackSlots(state.sector, activeAttackers, availableAttackers.length)
          : activeAttackers === 0 ? availableAttackers.length : 0;
        if (state.empMs === 0 && (formationComplete || escortComplete)) attackCooldownRef.current += delta;
        else if (activeAttackers === 0) attackCooldownRef.current = 0;
        const attackInterval = normal ? activeAttackers > 0 ? pressure.intervalMs : levelDifficulty(state.sector).attackCooldownMs : bossEscortAttackInterval(state.sector);
        if (state.empMs === 0 && (formationComplete || escortComplete) && slotsAvailable > 0
          && attackCooldownRef.current >= attackInterval) {
            let pattern = chooseAttackPattern(attackNumberRef.current++, elapsedRef.current, state.sector);
            if (escortComplete && pattern === "vDive") pattern = "double";
            if (slotsAvailable < attackGroupSize(pattern)) pattern = slotsAvailable >= 2 ? "double" : "curve";
            const groupSize = attackGroupSize(pattern);
            const selectedIds = availableAttackers.slice(0, groupSize).map(asteroid => asteroid.id);
            state.asteroids = state.asteroids.map(asteroid => {
              const index = selectedIds.indexOf(asteroid.id);
              if (index < 0) return asteroid;
              const groupDelay = pattern === "double" ? index * 350 : pattern === "vDive" ? index * 180 : 0;
              return { ...asteroid, attackPattern: pattern, attackDelay: 650 + groupDelay, attackLane: index - (groupSize - 1) / 2, firedThisAttack: false, collidedThisAttack: false };
            });
            attackCooldownRef.current = 0;
        }
        const nextAsteroids: Asteroid[] = [];
        let heartsLost = 0;
        let damageTaken = false;
        const purchasedShieldActive = state.purchasedShieldMs > 0;
        let shieldImpactsRemaining = !purchasedShieldActive && state.shieldActive && state.shieldMs > 0 ? state.shieldCharges : 0;
        state.asteroids.forEach(asteroid => {
          let next = moveAsteroid(asteroid, state.empMs > 0 ? 0 : delta, width, height);
          next.visualMotion = advanceShipMotion(asteroid.visualMotion ?? idleShipMotion(), next.x - asteroid.x, next.y - asteroid.y, delta);
          next.hullLight = hullIllumination(next.x, next.y, time, next.muzzleAt ?? 0, state.effects);
          if (asteroid.attackPattern !== null && next.attackPattern === null && !(normal && pressure.overlap)) attackCooldownRef.current = 0;
          if (next.attackPattern !== null && next.attackDelay === 0 && !next.firedThisAttack && next.attackElapsed < attackTime(next) && next.attackElapsed >= attackTime(next) * .28 && state.enemyShots.length < enemyShotLimit(width, elapsedRef.current, state.sector)) {
            const bullet = createEnemyShot(nextIdRef.current, next.x, next.y + next.radius * .4, state.player, width, height, state.sector);
            if (bullet) {
              nextIdRef.current += 1;
              state.enemyShots.push(bullet);
              soundRef.current?.playEnemyShot(next.x / width * 2 - 1);
              next = { ...next, firedThisAttack: true, muzzleAt: time };
            }
          }
          const activeAttack = next.attackPattern !== null && next.attackDelay === 0;
          const contact = contactWithEnemy(state.player, width, height, next, !next.cloaked && next.x >= 0 && next.x <= width && next.y >= 0 && next.y <= height, activeAttack && next.collidedThisAttack, impactCooldownRef.current, asteroid);
          if (contact.connected) {
            if (contact.damage) {
              if (activeAttack) next = { ...next, collidedThisAttack: true };
              impactCooldownRef.current = IMPACT_COOLDOWN_MS;
              if (purchasedShieldActive) {
                state.effects.push({ id: nextIdRef.current++, x: state.player.x * width, y: state.player.y * height, kind: "shield", startedAt: time, target: "player" });
                soundRef.current?.play("shield");
              } else {
                const collision = shipCollisionOutcome(state.shieldActive, shieldImpactsRemaining, state.shieldMs);
                // A contact is one impact: a collected shield absorbs one charge,
                // otherwise one heart is lost.
                heartsLost = Math.max(heartsLost, 1);
                if (collision.absorbedByShield) {
                  shieldImpactsRemaining -= 1;
                } else {
                  const sprite = next.sprite;
                  state.effects.push({ id: nextIdRef.current++, x: next.x, y: next.y, kind: next.type === "etherCrystal" ? "shatter" : "explosion", startedAt: time, sprite, debrisSize: next.radius * 2, debrisRotation: next.rotation, shipClass: next.shipClass, debrisColor: next.color, velocityX: (next.x - asteroid.x) * 1000 / Math.max(1, delta), velocityY: (next.y - asteroid.y) * 1000 / Math.max(1, delta) });
                  state.score += next.points;
                  if (collision.destroysEnemy) creditComboDefeat(state, next.reward, elapsedRef.current);
                  soundRef.current?.play("explosion");
                  gameHaptics.explosion();
                  if (next.attackPattern !== null) attackCooldownRef.current = 0;
                  if (collision.destroysEnemy) return;
                }
              }
            }
          }
          if (next.y >= -next.radius) nextAsteroids.push({ ...next, cloaked: isGhostCloaked(next.type, next.attackPattern === null && next.entryElapsed >= next.entryDuration && next.formationElapsed >= next.formationDuration, elapsedRef.current) });
        });
        state.asteroids = nextAsteroids;
        state.bonusTargets = state.bonusTargets.map(target => {
          const elapsed = target.elapsed + delta;
          const position = bonusPosition(target.index, elapsed, width, height);
          return { ...target, elapsed, ...position, visualMotion: advanceShipMotion(target.visualMotion ?? idleShipMotion(), position.x - target.x, position.y - target.y, delta) };
        }).filter(target => target.elapsed < BONUS_FLIGHT_MS);
        if (state.encounter === "boss-fight" && state.boss) {
          const previousBoss = state.boss;
          state.bossHullLight = hullIllumination(state.boss.x, state.boss.y, time, bossMuzzleRef.current, state.effects);
          state.boss = moveSectorBoss(state.boss, state.empMs > 0 ? 0 : delta, width, height);
          const bossContact = contactWithEnemy(state.player, width, height, state.boss, true, false, impactCooldownRef.current, previousBoss);
          if (bossContact.damage) {
            heartsLost = Math.max(heartsLost, 1);
            impactCooldownRef.current = IMPACT_COOLDOWN_MS;
          }
          if (state.empMs === 0) {
            const fired = advanceBossTurrets(state.boss, state.player, width, height, delta, enemyShotLimit(width, elapsedRef.current, state.sector) - state.enemyShots.length, nextIdRef.current);
            nextIdRef.current += fired.shots.length;state.enemyShots.push(...fired.shots);
            if (fired.events.length) bossMuzzleRef.current = time;
            for(const event of fired.events)soundRef.current?.playBossWeapon(event.kind,event.radius,event.barrels,event.pan);
            const pulses = advanceBossCore(state.boss, state.player, width, height, delta, enemyShotLimit(width, elapsedRef.current, state.sector) - state.enemyShots.length, nextIdRef.current);
            nextIdRef.current += pulses.length;
            state.enemyShots.push(...pulses);
            if (pulses.length) { bossMuzzleRef.current = time; soundRef.current?.playBossWeapon("pulse", 8, pulses.length, 0); }
          }
        }
        let playerImpact: { x: number; y: number } | undefined;
        const incomingShots: EnemyShot[] = [];
        for (const shot of state.enemyShots) {
          const moved = advanceEnemyShot(shot, state.empMs > 0 ? 0 : delta);
          if (moved.y > height + 12 || moved.x < -12 || moved.x > width + 12) continue;
          if (enemyShotHitsPlayer(moved, state.player, width, height)) {
            if (impactCooldownRef.current === 0) {
              if (purchasedShieldActive) {
                state.effects.push({ id: nextIdRef.current++, x: state.player.x * width, y: state.player.y * height, kind: "shield", startedAt: time, target: "player" });
                soundRef.current?.play("shield");
              } else {
                const shielded = state.shieldActive && state.shieldCharges > 0 && state.shieldMs > 0;
                const impact = projectileImpact(state.projectileGuard, shielded);
                state.projectileGuard = impact.guard;
                heartsLost += impact.damage;
                if (impact.damage > 0) playerImpact = { x: moved.x, y: moved.y };
                if (impact.blockedByHull) {
                  state.effects.push({ id: nextIdRef.current++, x: state.player.x * width, y: state.player.y * height, kind: "shield", startedAt: time, target: "player" });
                  soundRef.current?.play("shield");
                }
              }
              impactCooldownRef.current = IMPACT_COOLDOWN_MS;
            }
            continue;
          }
          incomingShots.push(moved);
        }
        state.enemyShots = incomingShots;
        if (heartsLost > 0) {
          const previousHearts = state.hearts;
          Object.assign(state, resolvePlayerDamage(state, heartsLost, state.shieldActive && state.shieldCharges > 0 && state.shieldMs > 0));
          const damaged = state.hearts < previousHearts;
          damageTaken = damaged;
          const destroyed = damaged && state.hearts === 0;
          state.effects.push({ id: nextIdRef.current++, x: state.player.x * width, y: state.player.y * height, kind: destroyed ? "player-explosion" : damaged ? "player-crash" : "shield", startedAt: time, target: "player", sprite: damaged ? shipSelection.skin.sprite : undefined, debrisSize: damaged ? 86 : undefined, debrisColor: damaged ? shipSelection.color.id : undefined, shipStage: shipStageRef.current });
          if (damaged) {
            const sprite = shipSelection.skin.sprite;
            const shot = { id: nextIdRef.current++, x: playerImpact?.x ?? state.player.x * width, y: playerImpact?.y ?? state.player.y * height - 12 };
            state.playerHit = hullFireAtImpact(shot, { x: state.player.x * width, y: state.player.y * height }, playerShipRef.current?.offsetWidth || 76, spriteFireSites[sprite].map(([x, y]) => [100 - x, 100 - y] as const));
            state.playerHullFires = addPersistentHullFire(state.playerHullFires, state.playerHit, 4);
            soundRef.current?.play(destroyed ? "playerDestroy" : "collision");
            gameHaptics.explosion();
            state.projectileGuard = destroyed ? 0 : projectileGuardForStage(shipStageRef.current);
            state.weaponCap = Math.max(1, state.weaponCap - 1);
            // Paid weapon time is protected from life loss. Only collected weapon
            // tiers are reduced; an active paid tier remains available until its timer expires.
            state.pickupWeaponLevel = Math.min(state.pickupWeaponLevel, state.weaponCap);
            syncSelectedWeapon(state);
            // A life loss is durable mission progress. Persist it immediately instead
            // of relying on pagehide/visibility handlers, which a hard reload may cancel.
            // This prevents Resume from restoring an older checkpoint with more lives.
            if (state.hearts > 0) void saveCombat().catch(() => setSaveNotice("Save not confirmed. Pending data will be retried."));
          }
          else soundRef.current?.play("shield");
        }
        state.powerUps = movePowerUps(state.powerUps, delta, height);
        state.powerUps = state.powerUps.filter(pickup => {
          if (Math.hypot(pickup.x - state.player.x * width, pickup.y - state.player.y * height) > 34) return true;
          Object.assign(state, activateCollectedPower(state, pickup.type));
          if (pickup.type === "overdrive") state.overdriveTotalMs = POWER_UP_DURATION_MS;
          if (pickup.type === "rapid") state.rapidFireTotalMs = POWER_UP_DURATION_MS;
          if (pickup.type === "weapon") state.weaponSource = "pickup";
          syncSelectedWeapon(state);
          state.pickupNotice = { id: pickup.id, type: pickup.type, remainingMs: 3_200, level: stageWeaponLevel(shipStageRef.current, state.weaponLevel) };
          soundRef.current?.playPickup(pickup.type);
          return false;
        });
        if (transitionPaused) fireTimerRef.current = 0;
        else fireTimerRef.current += delta;
        const effectiveWeapon = stageWeaponLevel(shipStageRef.current, state.weaponLevel);
        const interval = fireInterval(effectiveWeapon, state.rapidFireMs);
        if (!transitionPaused && fireTimerRef.current >= interval) {
          fireTimerRef.current %= interval;
          if (state.shots.length < MAX_PLAYER_SHOTS) {
            const volley = makeVolley(effectiveWeapon, state.player.x * width, state.player.y * height - 23, state.overdriveMs > 0, () => nextIdRef.current++, shipStageRef.current === 3);
            state.shots.push(...volley.slice(0, MAX_PLAYER_SHOTS - state.shots.length));
            playerMuzzleRef.current = time;
            soundRef.current?.play("laser", effectiveWeapon);
          }
        }
        const remainingShots: PlayerShot[] = [];
        for (const previous of state.shots) {
          const shot = advanceShot(previous, delta);
          if (shot.y < -10) continue;
          const bonusTarget = state.bonusTargets.find(target => shotHitsEnemy(shot, { ...target, cloaked: false }));
          if (bonusTarget) {
            state.bonusTargets = state.bonusTargets.filter(target => target.id !== bonusTarget.id);
            state.bonusHits += 1;
            creditComboDefeat(state, BONUS_TARGET_SHARD_REWARD, elapsedRef.current);
            state.score += 150;
            state.effects.push({ id: nextIdRef.current++, x: bonusTarget.x, y: bonusTarget.y, kind: "explosion", startedAt: time, sprite: bonusTarget.sprite, debrisSize: 50, debrisColor: bonusTarget.color, impactX: shot.x - bonusTarget.x, impactY: shot.y - bonusTarget.y });
            soundRef.current?.play("explosion");
            gameHaptics.explosion();
            continue;
          }
          const bossTarget = state.encounter === "boss-fight" && state.boss && bossVulnerable(state.boss) ? bossHitTarget(state.boss, previous, shot) : null;
          if (bossTarget && state.boss) {
            if (bossTarget.kind === "turret") {
              const bonus = damageBossTurret(state.boss, bossTarget.index, shot.damage);
              if (bonus > 0) {
                const position = gunPosition(state.boss, bossWeapons[state.boss.config.id - 1][bossTarget.index]);
                state.score += bonus;
                state.effects.push({ id: nextIdRef.current++, ...position, kind: "explosion", startedAt: time, debrisSize: 28, turretBonus: bonus });
                soundRef.current?.play("explosion");
                gameHaptics.explosion();
              } else soundRef.current?.play("enemyHit");
              continue;
            }
            if (!damageSectorBoss(state.boss, shot.damage, time)) continue;
            state.boss.hit = { id: shot.id, x: (shot.x - state.boss.x) / state.boss.width * 100 + 50, y: (shot.y - state.boss.y) / state.boss.height * 100 + 50, impactPower: shot.damage };
            if (state.boss.health === 0) destroyBoss(state, time);
            else {
              const location = bossFireSite(state.boss, shot.x, shot.y, state.boss.hullFires ?? []);
              const maxFires = hullFireLimit(state.boss.health, state.boss.maxHealth, true);
              state.boss.hullFires = addPersistentHullFire(state.boss.hullFires, { id: shot.id, ...location, impactPower: shot.damage }, maxFires);
              soundRef.current?.play("enemyHit");
            }
            continue;
          }
          const enemy = state.asteroids.find(item => shotHitsEnemy(shot, item));
          if (!enemy) { remainingShots.push(shot); continue; }
          enemy.health = Math.max(0, enemy.health - shot.damage);
          enemy.hitUntil = time + 190;
          if (enemy.health > 0) {
            const sprite = enemy.sprite;
            enemy.hit = hullFireAtImpact(shot, enemy, enemy.radius * 2, spriteFireSites[sprite], [], enemy.rotation, spriteVisualOffset(sprite, enemy.radius * 2, true));
            enemy.hullFires = addPersistentHullFire(enemy.hullFires, hullFireAtImpact(shot, enemy, enemy.radius * 2, spriteFireSites[sprite], enemy.hullFires, enemy.rotation, spriteVisualOffset(sprite, enemy.radius * 2, true)), hullFireLimit(enemy.health, enemy.maxHealth));
          }
          if (enemy.health === 0) state.effects.push({ id: nextIdRef.current++, x: enemy.x, y: enemy.y, kind: enemy.type === "etherCrystal" ? "shatter" : "explosion", startedAt: time, sprite: enemy.sprite, debrisSize: enemy.radius * 2, debrisRotation: enemy.rotation, shipClass: enemy.shipClass, debrisColor: enemy.color, velocityX: enemy.visualMotion?.vx, velocityY: enemy.visualMotion?.vy, impactX: shot.x - enemy.x, impactY: shot.y - enemy.y });
          soundRef.current?.play(enemy.health > 0 ? "enemyHit" : "explosion");
          if (enemy.health <= 0) gameHaptics.explosion();
          if (enemy.health > 0) continue;
          state.score += enemy.points * (enemy.attackPattern !== null && enemy.attackDelay === 0 ? 2 : 1);
          creditComboDefeat(state, enemy.reward, elapsedRef.current);
          state.asteroids = state.asteroids.filter(item => item.id !== enemy.id);
          if (enemy.attackPattern !== null) attackCooldownRef.current = 0;
          const drop = enemy.escort ? null : createPowerUpDrop({ id: nextIdRef.current, x: enemy.x, y: enemy.y, width, height, threats: state.asteroids, activeCount: state.powerUps.length, chanceRoll: Math.random(), kindRoll: Math.random(), destroyed: state.destroyed, dropsCreated: dropsCreatedRef.current, level: state.sector });
          const usefulDrop = drop?.type === "weapon" && state.weaponLevel >= 5 ? null : drop;
          if (usefulDrop) { nextIdRef.current += 1; dropsCreatedRef.current += 1; state.powerUps.push(usefulDrop); }
        }
        state.shots = state.encounter === 'boss-clear' ? [] : remainingShots;
        const nextFlight = normal ? nextBlockFlight(state.sector, flightRef.current, formationIndexRef.current, state.asteroids.length, rulesVersionRef.current) : null;
        if (nextFlight && state.phase !== "SECTOR_CLEAR") {
          if (rulesVersionRef.current === 2) state.score += GROUP_CLEAR_POINTS;
          flightRef.current = nextFlight.group;
          formationOffsetRef.current = nextFlight.offset;
          sectionSlotsRef.current = createFormationSlots(state.section, state.sector, width, height, visibleTop, nextFlight.count, nextFlight.offset);
          formationIndexRef.current = 0;
          formationStartedRef.current = false;
          sectionElapsedRef.current = rulesVersionRef.current === 2 ? SECTION_INTRO_MS - REINFORCEMENT_WARNING_MS - introGroupBreathingMs(state.sector) : 0;
          spawnTimerRef.current = 0;
          attackCooldownRef.current = 0;
          state.shots = [];
          state.enemyShots = [];
        }
        const previousPhase = state.phase;
        if (state.encounter === "boss-intro") {
          if (sectionElapsedRef.current >= BOSS_WARNING_MS) state.encounter = "boss-fight";
          state.phase = state.encounter === "boss-fight" ? "ATTACK_CYCLE" : "SECTOR_INTRO";
        } else if (state.encounter === "boss-fight") {
          state.phase = "ATTACK_CYCLE";
        } else if (state.encounter === "boss-clear") {
          state.phase = "SECTOR_CLEAR";
        } else {
          state.phase = bonus
            ? sectionPhase({ introMs: sectionElapsedRef.current, spawned: bonusIndexRef.current, total: BONUS_TARGET_COUNT, alive: state.bonusTargets.length, ready: state.bonusTargets.length, returning: false, attacking: false })
            : sectionPhase({ introMs: sectionElapsedRef.current, spawned: formationIndexRef.current, total: (sectionSlotsRef.current ?? slots).length, alive: state.asteroids.length, ready: state.asteroids.filter(asteroid => asteroid.entryElapsed >= asteroid.entryDuration && (asteroid.formationElapsed >= asteroid.formationDuration || asteroid.attackPattern !== null)).length, returning: state.asteroids.some(asteroid => asteroid.attackPattern !== null && asteroid.attackElapsed >= attackTime(asteroid)), attacking: state.asteroids.some(asteroid => asteroid.attackPattern !== null) });
        }
        if (state.encounter === "normal" && state.phase === "SECTOR_CLEAR" && previousPhase !== "SECTOR_CLEAR") {
          if (rulesVersionRef.current === 2) state.score += GROUP_CLEAR_POINTS;
          const link = appendSectionBlock(state.chainBlocks, state.sector);
          state.chainBlocks = link.blocks;
          creditReward(state, link.shards);
          state.chainResult = link.linked ? "CHAIN COMPLETE" : "BLOCK LINKED";
          saveReward(progress => ({ progress: awardBlock(progress, campaignLevel(state.sector), sectorInChapter(state.sector)), notice: "" }), { kind: "block", level: campaignLevel(state.sector), stage: state.sector });
          if (link.linked) state.rewardNotice = saveReward(progress => {
            const result = awardChain(progress, campaignLevel(state.sector));
            return { progress: result.progress, notice: result.milestone ? `Chain milestones · ${result.milestone} · Chains` : "" };
          }, { kind: "chain", level: campaignLevel(state.sector), stage: state.sector });
        }
        if (bonus && state.phase === "SECTOR_CLEAR" && previousPhase !== "SECTOR_CLEAR") {
          const reward = bonusReward(state.bonusHits, state.sector);
          const chainShards = bonusChainReward(state.chainBlocks, state.bonusHits, state.sector);
          const recoveredHeart = bonusHeartReward(state.bonusHits, state.hearts, state.maxHearts);
          state.bonusResult = `${reward.label} · +${reward.shards} BONUS SHARDS${chainShards ? ` · +${chainShards} CHAIN SHARDS` : ""}${recoveredHeart ? " · +1 HEART" : ""}${reward.powerUps.length ? ` · ${reward.powerUps.map(() => "SHIELD").join(" + ")}` : ""}`;
          state.score += reward.points;
          creditReward(state, reward.shards + chainShards);
          state.hearts += recoveredHeart;
          for (const power of reward.powerUps) {
            Object.assign(state, activateCollectedPower(state, power));
          }
          if (reward.powerUps.length || recoveredHeart) soundRef.current?.play("pickup");
          state.rewardNotice = saveReward(progress => {
            const result = awardBonusMedal(progress, campaignLevel(state.sector), state.bonusHits);
            return { progress: result.progress, notice: result.improved && result.medal ? `Bonus medals · ${result.medal}` : "" };
          }, { kind: "bonus", level: campaignLevel(state.sector), stage: state.sector, hits: state.bonusHits });
        }
        if (!adminRunRef.current && !scoreRunRef.current && state.score > bestThisDeviceRef.current) {
          bestThisDeviceRef.current = state.score;
          window.localStorage.setItem(BEST_SCORE_KEY, String(state.score));
        }
        if (scoreRunRef.current && state.score > checkpointScoreRef.current && elapsedRef.current - checkpointAtRef.current >= 30_000) {
          const runId = scoreRunRef.current;
          const score = state.score;
          checkpointAtRef.current = elapsedRef.current;
          checkpointScoreRef.current = score;
          void axiosClient.post("/leaderboard/checkpoint", { runId, score }).catch(() => {
            if (checkpointScoreRef.current === score) checkpointScoreRef.current = 0;
          });
        }
        if (time - combatCheckpointAtRef.current >= 10_000 && state.hearts > 0 && state.phase !== "SECTOR_CLEAR") {
          combatCheckpointAtRef.current = time;
          void saveCombat().catch(() => setSaveNotice("Save not confirmed. Pending data will be retried."));
        }
        if (state.phase === "SECTOR_CLEAR") state.enemyShots = [];
        state.effects = state.effects.filter(effect => time - effect.startedAt < (effect.kind === "bomb-wave" || effect.kind === "emp-wave" ? 850 : effect.kind === "boss-fall" ? BOSS_FALL_DURATION_MS + 100 : effect.kind === "boss-explosion" ? BOSS_FALL_DURATION_MS + 3_400 : effect.kind === "player-explosion" ? 2_250 : effect.kind === "player-crash" ? 1_350 : effect.kind === "explosion" || effect.kind === "shatter" ? 2_250 : 390));
        if (state.hearts === 0) {
          state.status = "destroying";
          state.enemyShots = [];
          state.shots = [];
          if (!recordsSavedRef.current) {
            if (!adminRunRef.current && !scoreRunRef.current) saveRecords(state);
            recordsSavedRef.current = true;
            submitScore(state);
          }
          if (gameOverTimerRef.current === null) gameOverTimerRef.current = window.setTimeout(() => {
            gameOverTimerRef.current = null;
            if (stateRef.current.status !== "destroying") return;
            stateRef.current.status = "game-over";
            setGame({ ...stateRef.current, effects: [...stateRef.current.effects] });
          }, GAME_OVER_REVEAL_MS);
        }
        // Desktop/tablet motion stays at display cadence; compact phones limit paints.
        // When a compact phone is falling behind, reduce React scene paints
        // while keeping simulation and direct ship movement at RAF cadence.
        slowFramesRef.current = width > 700 ? 0 : frameGap > 48
          ? Math.min(12, slowFramesRef.current + 2)
          : Math.max(0, slowFramesRef.current - 1);
        const paintInterval = width > 700 ? 16 : slowFramesRef.current >= 6 ? 50 : 32;
        if (damageTaken || time - lastPaintRef.current >= paintInterval || state.phase !== previousPhase || state.status !== "playing") {
          lastPaintRef.current = time;
          setGame({ ...state, boss: state.boss ? { ...state.boss } : null, asteroids: [...state.asteroids], bonusTargets: [...state.bonusTargets], shots: [...state.shots], enemyShots: [...state.enemyShots], effects: [...state.effects], powerUps: [...state.powerUps] });
        }
      }
      animationRef.current = window.requestAnimationFrame(loop);
    };
    animationRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      if (gameOverTimerRef.current !== null) window.clearTimeout(gameOverTimerRef.current);
      gameOverTimerRef.current = null;
    };
  }, []);

  const positionFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const field = fieldRef.current;
    if (!field) return;
    const bounds = field.getBoundingClientRect();
    const origin = event.pointerType === "touch" ? touchOriginRef.current : null;
    const player = origin
      ? placePlayer(origin.player.x * bounds.width + (event.clientX - origin.x) * sensitivityMultiplier[readControlSensitivity()], origin.player.y * bounds.height + (event.clientY - origin.y) * sensitivityMultiplier[readControlSensitivity()], bounds.width, bounds.height)
      : placePlayerFromPointer(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height, false);
    stateRef.current.player = player;
    if (playerShipRef.current) {
      playerShipRef.current.style.left = `${player.x * 100}%`;
      playerShipRef.current.style.top = `${player.y * 100}%`;
    }
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (stateRef.current.status !== "playing" || (event.target as HTMLElement).closest("button, .game-hud, .game-overlay, .touch-controls")) return;
    if (event.pointerType === "touch") event.preventDefault();
    if (pointerRef.current !== null) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientY - bounds.top < bounds.height * .5) return;
    const moveFraction = zoneFraction[readControlZone()];
    if (event.pointerType === "touch" && (readControlHand() === "right" ? event.clientX - bounds.left < bounds.width * (1 - moveFraction) : event.clientX - bounds.left > bounds.width * moveFraction)) return;
    pointerRef.current = event.pointerId;
    touchOriginRef.current = event.pointerType === "touch" ? { x: event.clientX, y: event.clientY, player: placePlayerFromPointer(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height, readShipStart() !== "touch") } : null;
    if (event.pointerType !== "touch") event.currentTarget.setPointerCapture(event.pointerId);
    positionFromPointer(event);
  };

  const activateStartPower = () => {
    const state = stateRef.current;
    if (state.status !== "playing" || !state.pendingStartPower) return;
    const power = state.pendingStartPower;
    if ((power === "shield" && state.purchasedShieldMs > 0) || (power === "rapid" && state.rapidFireMs > 0) || (power === "overdrive" && state.overdriveMs > 0)) return;
    if (power === "bomb" || power === "emp") {
      const width = fieldRef.current?.clientWidth || 800;
      const height = fieldRef.current?.clientHeight || 600;
      const now = performance.now();
      state.effects.push({ id: nextIdRef.current++, x: state.player.x * width, y: state.player.y * height, kind: power === "bomb" ? "bomb-wave" : "emp-wave", startedAt: now });
      state.enemyShots = [];
      if (power === "emp") {
        state.empMs = 7_000;
      } else {
        const visible = state.asteroids.filter(enemy => enemy.x >= -enemy.radius && enemy.x <= width + enemy.radius && enemy.y >= -enemy.radius && enemy.y <= height + enemy.radius);
        for (const enemy of visible) {
          state.score += enemy.points;
          creditComboDefeat(state, enemy.reward, elapsedRef.current);
          state.effects.push({ id: nextIdRef.current++, x: enemy.x, y: enemy.y, kind: "explosion", startedAt: now, sprite: enemy.sprite, debrisSize: enemy.radius * 2, shipClass: enemy.shipClass, debrisColor: enemy.color, debrisRotation: enemy.rotation });
        }
        if (visible.length) gameHaptics.explosion();
        const destroyedIds = new Set(visible.map(enemy => enemy.id));
        state.asteroids = state.asteroids.filter(enemy => !destroyedIds.has(enemy.id));
        if (state.boss && state.encounter === "boss-fight") {
          damageSectorBoss(state.boss, 18, now, true);
          if (state.boss.health === 0) {
            destroyBoss(state, now);
          }
        }
        attackCooldownRef.current = 0;
      }
    } else if (power === "shield") {
      state.purchasedShieldMs = PURCHASED_POWER_UP_DURATION_MS;
      state.shieldActive = true;
    } else {
      Object.assign(state, applyPowerUp(state, power, PURCHASED_POWER_UP_DURATION_MS));
      if (power === "overdrive") state.overdriveTotalMs = PURCHASED_POWER_UP_DURATION_MS;
      if (power === "rapid") state.rapidFireTotalMs = PURCHASED_POWER_UP_DURATION_MS;
    }
    state.pendingStartPower = null;
    soundRef.current?.play(power === "bomb" ? "nova" : power === "emp" ? "emp" : power === "overdrive" ? "boost" : "pickup");
    setGame({ ...state });
  };
  const weaponNames = ["", t("Standard"), t("Twin"), t("Rapid"), t("Triple"), t("Plasma")];
  const weaponGlyphs = ["", "I", "II", "III", "IV", "V"];
  const resumeWeaponSelection = () => { setWeaponMenuOpen(false); setWeaponCountdown(3); };
  const openWeaponSelection = () => {
    if (stateRef.current.status !== 'playing' && stateRef.current.status !== 'paused') return;
    stateRef.current.status = 'paused';
    pointerRef.current = null; touchOriginRef.current = null; keysRef.current.clear();
    setWeaponMenuOpen(true); setWeaponError(''); setGame({ ...stateRef.current });

  };
  const selectWeaponLevel = async (level: number) => {
    const state = stateRef.current;
    if (state.status !== 'paused' || !weaponMenuOpen || weaponBusyRef.current || weaponCountdown !== null) return;
    if (level === 1) {
      state.weaponSource = "standard";
    } else {
      let remaining = state.weaponTimers[level] ?? 0;
      if (remaining <= 0) {
        if (adminRunRef.current) remaining = PURCHASED_WEAPON_DURATION_MS;
        else {
          if (!accountRun || !scoreRunRef.current) return;
          weaponBusyRef.current = true; setWeaponBusy(true); setWeaponError('');
          try {
            // A retry uses the original request id and must not overwrite a successful server grant.
            if (!activationRef.current) {
              await saveCombat();
              activationRef.current = { level, id: crypto.randomUUID() };
            }
            if (activationRef.current.level !== level) throw new Error('Finish pending activation first');
            const { data } = await axiosClient.post<{ remainingMs: number; weaponStock: Record<string, number> }>('/hangar/weapon/activate', { runId: scoreRunRef.current, level, requestId: activationRef.current.id });
            remaining = data.remainingMs;
            setWeaponStock(data.weaponStock);
            if (!state.unlockedWeapons.includes(level)) state.unlockedWeapons.push(level);
            activationRef.current = null;
          } catch (error) {
            const status = (error as { response?: { status?: number } }).response?.status;
            if (status && status >= 400 && status < 500) activationRef.current = null;
            setWeaponError('Not confirmed. Retry the same weapon.');
            return;
          } finally { weaponBusyRef.current = false; setWeaponBusy(false); }
        }
        state.weaponTimers[level] = remaining;
      }
      state.paidWeaponLevel = level;
      state.paidWeaponMs = remaining;
      state.weaponSource = "paid";
    }
    syncSelectedWeapon(state);
    setGame({ ...state, weaponTimers: [...state.weaponTimers] });
  };
  const selectPickupWeapon = () => {
    const state = stateRef.current;
    if (state.status !== 'paused' || !weaponMenuOpen || weaponBusyRef.current || activationRef.current || state.pickupWeaponMs <= 0) return;
    state.weaponSource = "pickup";
    syncSelectedWeapon(state);
    setGame({ ...state });
  };

  const restart = () => {
    bossDestroyPlayedRef.current = false;
    bossVictoryPendingRef.current = false;
    bossVictoryFinishedRef.current = false;
    if (gameOverTimerRef.current !== null) window.clearTimeout(gameOverTimerRef.current);
    gameOverTimerRef.current = null;
    stateRef.current = createInitialState();
    bossLifeRemainingRef.current=0;pendingBossCardRef.current=null;setExtraLifeVisible(false);
    shipStageRef.current = 1;
    setShipStage(1);
    recordsSavedRef.current = false;
    scoreRunRef.current = null;
    adminRunRef.current = false;
    setScoreSync("idle");
    setWeaponMenuOpen(false);
    checkpointAtRef.current = 0;
    checkpointScoreRef.current = 0;
    formationIndexRef.current = 0;
    formationStartedRef.current = false;
    flightRef.current = 0;
    formationOffsetRef.current = 0;
    bonusIndexRef.current = 0;
    sectionSlotsRef.current = null;
    bossEscortSlotsRef.current = null;
    bossEscortWaveRef.current = 0;
    bossEscortSpawnedRef.current = 0;
    bossEscortTimerRef.current = 0;
    spawnTimerRef.current = 0;
    sectionElapsedRef.current = 0;
    clearTimerRef.current = 0;
    attackCooldownRef.current = 0;
    elapsedRef.current = 0;
    attackNumberRef.current = 0;
    dropsCreatedRef.current = 0;
    impactCooldownRef.current = 0;
    fireTimerRef.current = 0;
    startRequestRef.current = false;
    saveChoiceRef.current = null;
    startKeyRef.current = crypto.randomUUID();
    saveQueueReadyRef.current = false;
    setResumeOffer(null);
    setSaveNotice("");
    setAccountRun(false);
    setRecoveryError(false);
    pointerRef.current = null;
    touchOriginRef.current = null;
    lastPlayerRef.current = stateRef.current.player;
    playerMotionRef.current = idleShipMotion();
    playerMuzzleRef.current = 0;
    bossMuzzleRef.current = 0;
    lastFrameRef.current = 0;
    lastPaintRef.current = 0;
    slowFramesRef.current = 0;
    setGame(stateRef.current);
    if (stateRef.current.status === "loading") void activateLoadout();
  };

  const goHome = () => {
    if (!recordsSavedRef.current) {
      if (!adminRunRef.current && !scoreRunRef.current) saveRecords(stateRef.current);
      recordsSavedRef.current = true;
      submitScore(stateRef.current);
    }
    leaveGameFullscreen();
    navigate(adminRunRef.current ? "/admin" : "/");
  };

  const leaveSavedMission = async () => {
    if (pauseLeaveRef.current || saveRetrying) return;
    if (!accountRun) { goHome(); return; }
    const queue = saveQueueRef.current;
    if (!queue) return;
    pauseLeaveRef.current = true;
    setPauseLeaving(true);
    setSaveNotice("Checking save…");
    try {
      // Preserve the full active fight. Completed transitions have already queued
      // their next-stage snapshot and must not be overwritten by the old stage.
      await queue.recover();
      const runId = scoreRunRef.current;
      if (!runId) throw new Error("No active run");
      await saveCombat();
      await queue.drain();
      await loadAccountSave();
      leaveGameFullscreen();
      navigate("/");
    } catch {
      setSaveNotice("Save failed. The game stays paused. Please retry.");
    } finally {
      pauseLeaveRef.current = false;
      setPauseLeaving(false);
    }
  };

  const levelLabel = String(campaignLevel(game.sector));
  const sectorLabel = sectorInChapter(game.sector);
  const round = sectionInSector(game.section);
  const levelComplete = game.encounter === "bonus" && game.phase === "SECTOR_CLEAR";
  const reinforcementIntro = game.encounter === "normal" && game.phase === "SECTOR_INTRO" && flightRef.current > 0;
  const sectorIntro = game.encounter === "normal" && game.phase === "SECTOR_INTRO" && round === 1 && !reinforcementIntro;
  const levelIntro = sectorIntro && sectorLabel === 1;
  const translateBonusResult = (result: string) => result.split(" · ").slice(1).map(part => {
    const value = part.match(/^\+(\d+) (BONUS SHARDS|CHAIN SHARDS)$/);
    if (value) return `+${value[1]} ${t(value[2] === "BONUS SHARDS" ? "Bonus Shards" : "Chain Shards")}`;
    if (part === "+1 HEART") return `+1 ${t("Heart")}`;
    return part.split(" + ").map(key => t(key)).join(" + ");
  }).join(" · ");
  const transitionHeadline = reinforcementIntro ? t("Reinforcements incoming") : levelComplete
    ? <><b>{t("LEVEL")} {levelLabel}</b><i>{t("COMPLETE")}</i></>
    : levelIntro
      ? `${t("LEVEL")} ${levelLabel}`
      : sectorIntro
        ? `${t("Block")} ${sectorLabel} / ${BLOCKS_PER_CHAIN}`
      : game.encounter === "bonus"
        ? game.phase === "SECTOR_CLEAR" ? t(game.bonusResult.split(" · ")[0]) : t("BONUS CHALLENGE")
        : game.encounter !== "normal"
          ? game.encounter === "boss-clear" ? t("BOSS DEFEATED") : t("WARNING · SECTOR BOSS")
          : game.phase === "SECTOR_CLEAR"
            ? `${t("Block")} ${sectorLabel} ${t("COMPLETE")}`
            : `${t("Block")} ${sectorLabel} / ${BLOCKS_PER_CHAIN}`;
  const bossDestructionActive = game.encounter === "boss-clear" && clearTimerRef.current < BOSS_FALL_DURATION_MS + 2_500;
  const retryAccountSave = async () => {
    const queue = saveQueueRef.current;
    if (!queue || saveRetrying || pauseLeaveRef.current) return;
    setSaveRetrying(true);
    setSaveNotice("Saving game…");
    try {
      await queue.recover();
      setSaveNotice(queue.durable ? "Game saved." : "Game saved. Offline backup unavailable.");
    } catch {
      setSaveNotice("Save not confirmed. Check your connection and sign-in.");
    } finally { setSaveRetrying(false); }
  };
  const scoreSyncStatus = scoreSync !== "idle" && <p role="status">{accountRun
    ? scoreSync === "saving" ? t("Saving game…") : scoreSync === "saved" ? t("Game saved.") : t("Save not confirmed. Pending data will be retried.")
    : t(scoreSync === "saving" ? "Saving personal best…" : scoreSync === "saved" ? "Personal best saved." : "Could not sync personal best. Local best is saved.")}
    {accountRun && scoreSync === "failed" && <button className="text-button" type="button" onClick={() => {
      setScoreSync("saving");
      void saveQueueRef.current?.recover().then(() => { setScoreSync("saved"); setSaveNotice("Game saved."); }).catch(() => setScoreSync("failed"));
    }}>{t("Retry save")}</button>}</p>;

  return (
    <main className="game-shell" data-effects-paused={game.status !== "playing"} onPointerDownCapture={event => { primeCardSound(); if(rewardCardsRef.current.length)return; retryAudio(); if (pointerRef.current === null && !(event.target as HTMLElement).closest("button, .touch-controls") && !document.fullscreenElement) requestGameFullscreen(); }}>
      {rewardCards[0] && <CardReveal reward={rewardCards[0]} remaining={rewardCards.length} onContinue={continueRewardCard}/>}
      {extraLifeVisible&&<div className="boss-extra-life" role="status" aria-live="polite"><strong>{t('EXTRA LIFE')}</strong><span>+1 ♥</span></div>}
      <div ref={fieldRef} className="game-field" onContextMenu={event => event.preventDefault()} onDoubleClick={event => event.preventDefault()} onDragStart={event => event.preventDefault()} onPointerDown={startDrag} onPointerMove={event => { if (pointerRef.current === event.pointerId) positionFromPointer(event); }} onPointerUp={event => { if (pointerRef.current === event.pointerId) { pointerRef.current = null; touchOriginRef.current = null; } }} onPointerCancel={event => { if (pointerRef.current === event.pointerId) { pointerRef.current = null; touchOriginRef.current = null; } }}>
        <Starfield sector={game.sector} player={game.player} paused={game.status !== "playing"} showNebula={game.encounter === "boss-fight"} />
        <SectorBackdrop sector={game.sector} player={game.player} paused={game.status !== "playing"} />
        <button className="wide-fullscreen-control game-fullscreen-control" type="button" onClick={requestGameFullscreen} aria-label={t("Full screen")} title={t("Full screen")}>⛶</button>
        <header ref={hudRef} className="game-hud">
          <div className="hud-actions"><button className="game-control home-control" type="button" disabled={rewardCards.length > 0 || weaponMenuOpen || weaponCountdown !== null || game.status === "loading" || game.status === "destroying"} onClick={() => { if (game.status === "game-over" || game.status === "victory") { goHome(); return; } homePromptWasPlayingRef.current = stateRef.current.status === "playing"; stateRef.current.status = "paused";
        void saveCombat().catch(() => setSaveNotice("Save not confirmed. Pending data will be retried.")); setGame({ ...stateRef.current }); setHomePrompt(true); }} aria-label={t("Go home")}><CockpitIcon kind="home" /></button></div>
          <div className={`hud-stat hearts-stat${game.effects.some(effect => effect.target === "player" && effect.kind === "player-crash") ? " hearts-stat-hit" : ""}`}><span className="hud-heart-label" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.2 3.4 13.1C-1.1 8.8 5.3 1.7 10.2 5.9L12 7.5l1.8-1.6c4.9-4.2 11.3 2.9 6.8 7.2L12 21.2Z" /></svg></span><strong className="hearts" role="status" aria-live="polite" aria-label={lives(game.hearts)}>/{game.hearts}</strong></div>
          <div className="hud-stat game-level-hud" aria-label={`${t("Game level")} ${levelLabel}`}><span>{t("Level")}</span><strong>{levelLabel}</strong></div>
          <div className="hud-stat score-hud" aria-label={`${t("Shards")} ${game.shards}, ${t("Score")} ${game.score}`}><span className="shard-line"><b>◆ {game.shards}</b><small>{t("Shards")}</small></span><span className="score-line"><b>{game.score}</b><small>{t("Score")}</small></span></div>
          <div className="hud-stat round-hud chain-hud" aria-label={`${t("Block")} ${game.chainBlocks}/${BLOCKS_PER_CHAIN}`}><span>{t("Block")}</span><strong>{game.chainBlocks}<small>/{BLOCKS_PER_CHAIN}</small></strong></div>
          <button className="game-control pause-control" type="button" disabled={rewardCards.length > 0 || weaponMenuOpen || weaponCountdown !== null || pauseLeaving || game.status === "loading" || game.status === "destroying" || game.status === "game-over" || game.status === "victory"} onClick={() => { if (pauseLeaveRef.current) return; const resuming = game.status === "paused"; stateRef.current.status = resuming ? "playing" : "paused"; if (!resuming) void saveCombat().catch(() => setSaveNotice("Save not confirmed. Pending data will be retried.")); setGame({ ...stateRef.current }); if (resuming) window.setTimeout(retryAudio, 0); }} aria-label={t(game.status === "paused" ? "Resume" : "Pause")}><CockpitIcon kind={game.status === "paused" ? "play" : "pause"} /></button>
        </header>
        <div className="game-label">{adminRunRef.current && <strong>{t("Admin center")} · </strong>}{t("LEVEL")} {levelLabel} <span>· <strong className="game-region-name">{sectorName(game.sector)}</strong> · {game.encounter === "normal" ? `${t("Block")} ${sectorLabel}/${BLOCKS_PER_CHAIN}` : game.encounter === "bonus" ? t("BONUS CHALLENGE") : t("CORE WARDEN")}</span></div>
        {game.encounter === "normal" && <span className="flight-indicator" style={{ top: visibleTopRef.current + 25 }}>{t("Group {current}/{total}", { current: flightRef.current + 1, total: blockFlights(game.sector, rulesVersionRef.current).length })}</span>}
        {reinforcementIntro && game.status === "playing" && <div className="reinforcement-notice" role="status">{t("Reinforcements incoming")}</div>}
        {audioNeedsTap && game.status === "playing" && <button className={`audio-retry${game.pickupNotice ? " audio-retry-with-pickup" : ""}`} type="button" onClick={retryAudio}>{t("Enable sound")}</button>}
        {game.encounter === "bonus" && game.phase !== "SECTOR_CLEAR" && <div className="bonus-counter" aria-live="polite">{t("BONUS TARGETS")} {game.bonusHits} / {BONUS_TARGET_COUNT} · {t("NO ENEMY FIRE")}</div>}
        {game.encounter === 'boss-clear' && !game.bossHeartCollected && clearTimerRef.current >= BOSS_CLEAR_DURATION_MS && <div className="boss-heart-pickup" role="status" aria-label={t('Collect the heart to start the bonus round.')} style={{left: `${BOSS_HEART_POSITION.x * 100}%`, top: `${BOSS_HEART_POSITION.y * 100}%`}}>
          <span className="boss-heart-orb" aria-hidden="true"><span className="power-preview-orbit"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.2 3.4 13.1C-1.1 8.8 5.3 1.7 10.2 5.9L12 7.5l1.8-1.6c4.9-4.2 11.3 2.9 6.8 7.2L12 21.2Z" /></svg></i></span></span>
          <small>+1 · {t('Collect the heart to start the bonus round.')}</small>
        </div>}
        
        {game.status === "loading" && <div className="game-overlay"><div className="game-modal mission-start-modal">
          <h1>{resumeOffer ? <><span className="desktop-menu-only">{t("Account save")}</span><span className="mobile-menu-only">{t(confirmNewRun ? "Start from the beginning?" : "Your mission")}</span></> : startError ? t("Start not confirmed") : t('Preparing mission')}</h1>
          <p>{(startError && t(startError)) || (resumeOffer ? t("Combat progress is saved to your Pi account. Older saves resume at the last completed Block.") : t('Checking your saved hangar loadout.'))}</p>
          {resumeOffer && !confirmNewRun && <>
            {resumeOffer.mission && <><p className="desktop-menu-only">{t("Resume at section {section} · {phase} · {lives} · {score} points.", { section: resumeOffer.mission.sector, phase: t(resumeOffer.mission.phase === "normal" ? "Block" : resumeOffer.mission.phase === "boss" ? "Boss" : "Bonus round"), lives: lives(resumeOffer.mission.snapshot.hearts), score: resumeOffer.mission.snapshot.score })}</p><div className="mobile-menu-only mission-resume-summary"><strong>{sectorName(resumeOffer.mission.sector)}</strong><p>{t("Level")} {campaignLevel(resumeOffer.mission.sector)} · {resumeOffer.mission.phase === "normal" ? `${t("Block")} ${sectorInChapter(resumeOffer.mission.sector)}/9` : resumeOffer.mission.phase === "boss" ? t("Boss") : t("Bonus round")} · {lives(resumeOffer.mission.snapshot.hearts)}</p><p>{resumeOffer.mission.snapshot.score} {t("Score")} · {resumeOffer.mission.snapshot.shards} {t("Shards")}</p></div></>}
            {resumeOffer.version === 0 && <p>{t("You can import local Shards and Standard ships once, before your first account game. Pi purchases and records are excluded. Otherwise, local items stay on this device.")}</p>}
            <div className="modal-actions">
              {resumeOffer.mission && <button type="button" className="button button-primary" onClick={() => { saveChoiceRef.current = "resume"; setResumeOffer(null); void activateLoadout(); }}>{t("Resume")}</button>}
              <button type="button" className="button button-secondary" onClick={() => { if (resumeOffer.mission && window.matchMedia("(max-width: 600px)").matches) { setConfirmNewRun(true); return; } saveChoiceRef.current = "new"; setResumeOffer(null); void activateLoadout(); }}>{resumeOffer.mission ? <><span className="desktop-menu-only">{t("New game – replace saved run")}</span><span className="mobile-menu-only">{t("New game")}</span></> : t("Start with account inventory")}</button>
              {resumeOffer.version === 0 && <button type="button" className="button button-secondary" onClick={() => { startRequestRef.current = true; void mutateAccountInventory(resumeOffer, { action: "import", confirm: true, ...localInventory() }).then(() => { startRequestRef.current = false; saveChoiceRef.current = "new"; setResumeOffer(null); void activateLoadout(); }).catch(() => { startRequestRef.current = false; setStartError("Import not confirmed. Check your account inventory in the hangar."); }); }}>{t("Import local inventory and start")}</button>}
            </div>
          </>}
          {resumeOffer && confirmNewRun && <div className="new-run-confirmation"><p>{t("Your current mission will be replaced. Your balance and owned ships remain available.")}</p><div className="modal-actions"><button type="button" className="button button-primary" onClick={() => { setConfirmNewRun(false); saveChoiceRef.current = "new"; setResumeOffer(null); void activateLoadout(); }}>{t("Start new game")}</button><button type="button" className="button button-secondary" onClick={() => setConfirmNewRun(false)}>{t("Keep current mission")}</button></div></div>}
          {startError && <div className="modal-actions"><button className="button button-primary" type="button" onClick={() => { setStartError(""); setRecoveryError(false); void activateLoadout(); }}>{t("Try again")}</button>{recoveryError && <button className="button button-secondary" type="button" onClick={() => { saveQueueRef.current?.archive(); saveQueueReadyRef.current = true; setRecoveryError(false); setStartError(""); setSaveNotice("Pending data set aside. Using the confirmed account save."); void activateLoadout(); }}>{t("Use confirmed save")}</button>}</div>}
          {(startError || resumeOffer) && <button className="button button-secondary mission-back-button" type="button" onClick={() => { leaveGameFullscreen(); navigate(sessionStorage.getItem(ADMIN_MODE_KEY) === "1" ? "/admin" : "/"); }}>{t("Back")}</button>}
        </div></div>}
        {game.status === "playing" && !extraLifeVisible && !bossDestructionActive && !reinforcementIntro && (game.phase === "SECTOR_INTRO" || game.phase === "SECTOR_CLEAR") && <div className={`sector-banner${game.phase === "SECTOR_INTRO" ? " sector-transition" : " sector-clear-message"}${game.encounter === "boss-intro" ? " boss-intro-banner" : ""}${levelIntro ? " level-intro-banner" : ""}${levelComplete ? " level-complete-banner" : ""}`} aria-live="polite">
          <span>{levelComplete || levelIntro ? sectorName(game.sector) : game.encounter === "bonus" ? game.phase === "SECTOR_CLEAR" ? t("BONUS COMPLETE") : `${t("LEVEL")} ${levelLabel} · ${sectorName(game.sector)}` : game.encounter !== "normal" ? `${t("LEVEL")} ${levelLabel} · ${sectorName(game.sector)}` : game.phase === "SECTOR_CLEAR" ? t("BLOCK LINKED") : `${t("LEVEL")} ${levelLabel} · ${sectorName(game.sector)}`}</span>
          <strong>{transitionHeadline}</strong>
          {game.encounter === 'boss-intro' && <small className="boss-callsign">{bossName(Math.ceil(game.sector / 10))}</small>}
          {game.phase === "SECTOR_INTRO" && game.encounter === "bonus" && <small>{t("HIT THE FLYING TARGETS")}</small>}
          {game.phase === "SECTOR_CLEAR" && game.encounter === "normal" && <><small className="chain-result">{t("Block")} {game.chainBlocks}/{BLOCKS_PER_CHAIN} · {t(game.chainResult)}</small><BlockchainProgress blocks={game.chainBlocks} /></>}
          {levelComplete && <><small className="chain-result">{t("Block")} {BLOCKS_PER_CHAIN}/{BLOCKS_PER_CHAIN}</small><small className="chain-saved-label">{t("CHAIN SAVED")}</small><BlockchainProgress blocks={BLOCKS_PER_CHAIN} saved /></>}
          {game.phase === "SECTOR_CLEAR" && game.encounter === "bonus" && <><small className="chain-result">{`${game.bonusHits}/${BONUS_TARGET_COUNT} ${t("BONUS TARGETS")} · ${translateBonusResult(game.bonusResult)}`}</small><small className="crypto-explainer">{t("1 Shard per target. Completion bonus added immediately.")}</small></>}
          {game.phase === "SECTOR_CLEAR" && game.encounter === "bonus" && <small className="combo-summary">{t("Level combo bonus")}: {game.combo.level} × · +{game.combo.level * DOUBLE_KILL_SCORE} {t("Score")} · +{game.combo.level * DOUBLE_KILL_SHARDS} {t("Shards")}</small>}
          {game.phase === "SECTOR_CLEAR" && game.rewardNotice && <small className="reward-unlock" role="status">✦ {game.rewardNotice.split(" · ").map(part => t(part)).join(" · ")}</small>}
        </div>}
        {game.status === "playing" && game.encounter === "normal" && !formationStartedRef.current && (game.phase === "SECTOR_INTRO" || game.phase === "ENTRY" || game.phase === "FORMATION") && <div className="formation-data-stream" aria-hidden="true">{FORMATION_DATA_ROWS.map((row, index) => <div className="formation-data-row" key={index}><span>{row.repeat(4)}</span><span>{row.repeat(4)}</span></div>)}</div>}
        {game.asteroids.filter(asteroid => game.encounter === "normal"
          ? game.phase === "ENTRY" || game.phase === "FORMATION" || game.phase === "REFORM"
          : game.encounter === "boss-fight" && asteroid.escort && asteroid.attackPattern === null
        ).map(asteroid => { const locked = asteroid.entryElapsed >= asteroid.entryDuration && asteroid.formationElapsed >= asteroid.formationDuration; const diameter = asteroid.radius * 2 + 8; return <div key={`formation-${asteroid.id}`} className={`formation-target${locked ? " formation-target-locked" : ""}`} style={{ left: asteroid.entryTargetX, top: asteroid.entryTargetY, width: diameter, height: diameter }} aria-hidden="true"><span /></div>; })}
        {game.boss && game.encounter === "boss-fight" && <div className={`asteroid sector-boss${game.boss.health <= game.boss.maxHealth / 2 ? " boss-enraged" : ""}${game.boss.health <= game.boss.maxHealth * .25 ? " boss-critical" : ""}${performance.now() - game.boss.lastDamageAt < 240 ? " boss-hit" : ""}`} style={{ left: game.boss.x, top: game.boss.y, width: game.boss.width, height: game.boss.height, transform: "translate(-50%, -50%)", "--boss-image": `url('${game.boss.config.image}')`, "--boss-thrust": `${6 + game.boss.height * engineFlamePercent(game.boss.visualMotion?.thrust ?? 0, game.boss.elapsed < BOSS_ENTRY_MS ? "launch" : "idle") / 100}px` } as CSSProperties} title={`${t("CORE WARDEN")} · ${t("Sector")} boss`}>
          {game.boss.config.engineAnchors.map(([x, y], index) => <i key={index} className="boss-engine-flame" style={{ left: `${x * 100}%`, top: `${y * 100}%` }} aria-hidden="true" />)}
          <img className="boss-hull" src={game.boss.config.image} alt="" draggable={false} />
          <BossWeaponsView boss={game.boss}/>
          <BossReactorView boss={game.boss}/>
          <i className="hull-reflection" style={{ maskImage: `url('${game.boss.config.image}')`, WebkitMaskImage: `url('${game.boss.config.image}')`, opacity: game.bossHullLight }} aria-hidden="true" />
          <HullDamage sites={game.boss.hullFires} hit={game.boss.hit} maskImage={`url('${game.boss.config.image}')`} bossDamage={1 - game.boss.health / game.boss.maxHealth} />
          <BossHealthView boss={game.boss}/>
        </div>}
        {game.bonusTargets.map(target => <div key={target.id} className="asteroid asteroid-small cryptoid bonus-ship cryptoid-boost" style={{ ...alignedSpritePosition(target.x, target.y, target.sprite, 50), transform: "translate(-50%, -50%)", "--flame-length": `${engineFlamePercent(target.visualMotion?.thrust ?? 0)}%` } as CSSProperties}><div className="ship-visual"><PaintedShip className="fleet-sprite" sprite={target.sprite} color={target.color} />{engineTrails(target.sprite, "exhaust")}</div></div>)}
        {game.asteroids.map(asteroid => { const sprite = asteroid.sprite; const maskImage = `url('${shipEvolutionAsset(sprite, 1)}')`; return <div key={asteroid.id} className={`asteroid asteroid-${asteroid.size} cryptoid${game.empMs > 0 ? " cryptoid-emp" : ""} cryptoid-${asteroid.type} cryptoid-${asteroid.shipClass}${asteroid.hitUntil && asteroid.hitUntil > performance.now() ? " cryptoid-hit" : ""}${asteroid.attackPattern !== null && asteroid.attackDelay > 0 ? " asteroid-preparing" : ""}${asteroid.cloaked ? " cryptoid-cloaked" : ""}${cryptoidMotionClass(asteroid)}`} title={`${cryptoidDisplayName[asteroid.type]} · ${asteroid.shipClass} · ${asteroid.faction}`} style={{ ...alignedSpritePosition(asteroid.x, asteroid.y, sprite, asteroid.radius * 2), transform: `translate(-50%, -50%) rotate(${asteroid.rotation}deg)`, ...shipHullStyle(sprite, true), "--visual-bank": `${asteroid.visualMotion?.bank ?? 0}deg`, "--flame-length": `${engineFlamePercent(asteroid.visualMotion?.thrust ?? 0, asteroid.returnElapsed > 0 ? "return" : asteroid.entryElapsed < asteroid.entryDuration ? "launch" : asteroid.attackPattern !== null && asteroid.attackDelay <= 0 ? "boost" : "idle")}%`, "--hull-light": asteroid.hullLight ?? 0 } as CSSProperties}><div className="ship-visual"><PaintedShip className="fleet-sprite" sprite={sprite} color={asteroid.color} />{engineTrails(sprite, "exhaust")}<i className="hull-reflection" style={{ maskImage, WebkitMaskImage: maskImage }} aria-hidden="true" /><HullDamage sites={asteroid.hullFires} hit={asteroid.hit} maskImage={maskImage} mirrored /></div><span className="health-bar" data-critical={asteroid.health / asteroid.maxHealth <= .3} role="progressbar" aria-label={t("Enemy hull")} aria-valuenow={Math.ceil(asteroid.health / asteroid.maxHealth * 100)} aria-valuemin={0} aria-valuemax={100}><b style={{ width: `${asteroid.health / asteroid.maxHealth * 100}%` }} /></span></div>; })}
        {game.powerUps.map(pickup => {
          const pickupLabel = `${t(powerUpNames[pickup.type])} · ${t(powerUpDescriptions[pickup.type])}`;
          return <div key={pickup.id} className={`power-up power-up-${pickup.type}`} role="img" aria-label={pickupLabel} title={pickupLabel} style={{ left: pickup.x, top: pickup.y }}><span aria-hidden="true">{powerUpSymbols[pickup.type]}</span></div>;
        })}
        {game.combo.remainingMs > 0 && game.status === "playing" && <div key={`combo-${game.combo.total}`} className={`combo-notice${game.pickupNotice ? " combo-with-pickup" : ""}`} role="status"><b>{t("DOUBLE KILL")}</b><span>+{DOUBLE_KILL_SCORE} {t("Score")} · +{DOUBLE_KILL_SHARDS} {t("Shards")}</span></div>}
        {game.pickupNotice && game.status === "playing" && <div key={game.pickupNotice.id} className={`pickup-notice pickup-notice-${game.pickupNotice.type}`} role="status"><b>{powerUpSymbols[game.pickupNotice.type]} {t(powerUpNames[game.pickupNotice.type])}</b><span>{game.pickupNotice.type === "weapon" ? `${t(pickupEffectLabels.weapon)} ${game.pickupNotice.level} · ${weaponNames[game.pickupNotice.level]}` : t(pickupEffectLabels[game.pickupNotice.type])}</span></div>}
        {game.shots.map(shot => <div key={shot.id} className={`player-laser player-laser-tier-${shot.visualLevel ?? 1}${shot.empowered && shot.visualLevel !== 5 ? " player-laser-overdrive" : ""}`} style={{ left: shot.x, top: shot.y }} aria-hidden="true" />)}
        {game.enemyShots.map(shot => <div key={shot.id} className={`enemy-laser${shot.bossKind ? ` boss-projectile boss-projectile-${shot.bossKind}` : ""}${shot.weaponKind ? ` boss-evolved-shot boss-evolved-${shot.weaponKind}` : ""}`} style={{ left: shot.x, top: shot.y, "--shot-angle": `${-Math.atan2(shot.vx, shot.vy) * 180 / Math.PI}deg`,...(shot.weaponKind?{"--boss-shot-color":shot.weaponColor,"--boss-shot-width":`${shot.weaponWidth}px`,"--boss-shot-diameter":`${shot.radius*2}px`}:{}) } as CSSProperties} aria-hidden="true" />)}
        {game.effects.map(effect => <ImpactEffectView key={effect.id} effect={effect} />)}
        {game.hearts > 0 && <div ref={playerShipRef} className={`player-ship shielded-ship${shipSelection.color.id === "grey" || shipSelection.color.id === "white" ? ` player-ship-${shipSelection.color.id}` : ""}${game.purchasedShieldMs > 0 || (game.shieldActive && game.shieldCharges > 0 && game.shieldMs > 0) ? " player-ship-shield-active" : ""}${game.effects.some(effect => effect.target === "player" && effect.kind === "player-crash") ? " player-ship-respawn" : ""}${game.effects.some(effect => effect.target === "player" && effect.kind === "shield") ? " player-ship-shielded" : ""}`} style={{ left: `${game.player.x * 100}%`, top: `${game.player.y * 100}%`, "--ship-glow": shipSelection.color.glow, "--flame-length": `${engineFlamePercent(game.thrust)}%`, ...shipVisualOffset } as CSSProperties} aria-label={t('Your Cryptoid ship')}><div className="ship-visual"><PaintedShip className="fleet-sprite" sprite={shipSelection.skin.sprite} color={shipSelection.color.id} stage={shipStage} />{engineTrails(shipSelection.skin.sprite, "player-engine")}<i className="hull-reflection" style={{ maskImage: `url('${shipEvolutionAsset(shipSelection.skin.sprite, shipStage)}')`, WebkitMaskImage: `url('${shipEvolutionAsset(shipSelection.skin.sprite, shipStage)}')` }} aria-hidden="true" /><i className="player-muzzle-flash" aria-hidden="true" /><HullDamage sites={game.playerHullFires} hit={game.playerHit} maskImage={`url('${shipEvolutionAsset(shipSelection.skin.sprite, shipStage)}')`} /></div></div>}
        {weaponMenuOpen && <div className="game-overlay weapon-selection-overlay" onPointerDown={event => event.stopPropagation()}>
          <div className="weapon-selection-dialog" role="dialog" aria-modal="true" aria-labelledby="mission-weapon-shop-title">
            <MissionWeaponShop authenticated={accountRun} admin={adminRunRef.current} timers={game.weaponTimers} initialStock={weaponStock} activeLevel={game.weaponLevel} source={game.weaponSource} pickupLevel={game.pickupWeaponLevel} pickupMs={game.pickupWeaponMs} stage={shipStage} selectionBusy={weaponBusy} pendingLevel={activationRef.current?.level} selectionError={weaponError} onSelect={level => { void selectWeaponLevel(level); }} onPickup={selectPickupWeapon} onClose={resumeWeaponSelection} onInventory={async (_owned, stock) => { setWeaponStock(stock); }} />
          </div>
        </div>}
        <div className={`touch-controls touch-controls-${readControlHand()}`}>
          <div className="edge-actions" role="group" aria-label={t('Available equipment')}>
            <div className="weapon-control-wrap" data-source={game.weaponSource}>
              <div className="weapon-slot" data-source={game.weaponSource}>
                {game.weaponSource !== "standard" && <TimedRing remainingMs={game.weaponSource === "paid" ? game.paidWeaponMs : game.pickupWeaponMs} durationMs={game.weaponSource === "paid" ? PURCHASED_WEAPON_DURATION_MS : PICKUP_WEAPON_DURATION_MS} />}
                <button type="button" className="edge-action edge-action-weapon weapon-cycle mission-shop-access" disabled={game.status !== "playing"} onClick={openWeaponSelection} aria-label={`${t("Shop & weapons")} · ${t("Active weapon")}: ${weaponNames[stageWeaponLevel(shipStage, game.weaponLevel)]}, ${t("Weapon level")} ${stageWeaponLevel(shipStage, game.weaponLevel)} / 5. ${t("Tap to choose a weapon and pause. Resume follows a 3–2–1 countdown.")}${shipStage > 1 ? ` ${t("Projectile hits left")}: ${game.projectileGuard}` : ""}`}>
                  <span className="weapon-cycle-glyph" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4h2l3 12h10l3-9H6M10 20h.01M18 20h.01" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                  <small>{t("Shop & weapons")}</small><em>{weaponNames[stageWeaponLevel(shipStage, game.weaponLevel)]}</em>
                </button>
              </div>
              {game.weaponSource !== "pickup" && game.pickupWeaponMs > 0 && <div className="weapon-slot weapon-slot-reserve" data-source="pickup"><TimedRing remainingMs={game.pickupWeaponMs} durationMs={PICKUP_WEAPON_DURATION_MS} /><button type="button" className="edge-action edge-action-weapon weapon-cycle" disabled={game.status !== "playing"} onClick={openWeaponSelection} aria-label={`${t("Select")}: ${weaponNames[stageWeaponLevel(shipStage, game.pickupWeaponLevel)]}`}><span className="weapon-cycle-glyph" aria-hidden="true">{weaponGlyphs[stageWeaponLevel(shipStage, game.pickupWeaponLevel)]}</span><small>{weaponNames[stageWeaponLevel(shipStage, game.pickupWeaponLevel)]}</small></button></div>}
              {game.weaponSource !== "paid" && game.paidWeaponMs > 0 && <div className="weapon-slot weapon-slot-reserve" data-source="paid"><TimedRing remainingMs={game.paidWeaponMs} durationMs={PURCHASED_WEAPON_DURATION_MS} /><button type="button" className="edge-action edge-action-weapon weapon-cycle" disabled={game.status !== "playing"} onClick={openWeaponSelection} aria-label={`${t("Select")}: ${weaponNames[stageWeaponLevel(shipStage, game.paidWeaponLevel)]}`}><span className="weapon-cycle-glyph" aria-hidden="true">{weaponGlyphs[stageWeaponLevel(shipStage, game.paidWeaponLevel)]}</span><small>{weaponNames[stageWeaponLevel(shipStage, game.paidWeaponLevel)]}</small></button></div>}
              {shipStage > 1 && <span className="weapon-hull-hits" aria-label={`${t("Projectile hits left")}: ${game.projectileGuard}`}>✦ {game.projectileGuard}/{projectileGuardForStage(shipStage)}</span>}
            </div>
            {game.purchasedShieldMs > 0 && <div className="shield-control-wrap" data-active="true">
              <TimedRing remainingMs={game.purchasedShieldMs} durationMs={PURCHASED_POWER_UP_DURATION_MS} />
              <div className="edge-action edge-action-shield shield-active-indicator" role="status" aria-label={`${t("BOUGHT SHIELD")} · ${Math.ceil(game.purchasedShieldMs / 1_000)}s`}>
                <span aria-hidden="true">{powerUpSymbols.shield}</span>
                <small>{t("SHIELD")}</small>
              </div>
            </div>}
            {([
              { type: "shield", remainingMs: game.shieldCharges > 0 ? game.shieldMs : 0, durationMs: POWER_UP_DURATION_MS },
              { type: "overdrive", remainingMs: game.overdriveMs, durationMs: game.overdriveTotalMs },
              { type: "rapid", remainingMs: game.rapidFireMs, durationMs: game.rapidFireTotalMs },
            ] as const).filter(power => power.remainingMs > 0).map(power => <div key={power.type} className={`power-timer power-timer-${power.type}`} role="status" aria-label={t(powerUpNames[power.type])}>
              <TimedRing remainingMs={power.remainingMs} durationMs={power.durationMs} />
              <div className="power-timer-face"><span aria-hidden="true">{powerUpSymbols[power.type]}</span><small>{t(powerUpNames[power.type])}</small></div>
            </div>)}
            {game.pendingStartPower && <button type="button" className={`edge-action edge-action-${game.pendingStartPower} edge-action-purchased`} disabled={game.status !== "playing" || (game.pendingStartPower === "shield" && game.purchasedShieldMs > 0) || (game.pendingStartPower === "rapid" && game.rapidFireMs > 0) || (game.pendingStartPower === "overdrive" && game.overdriveMs > 0) || (game.pendingStartPower === "emp" && game.empMs > 0)} aria-label={`${t("Tap to activate")} ${t(powerUpNames[game.pendingStartPower])}`} onClick={activateStartPower}><span aria-hidden="true">{powerUpSymbols[game.pendingStartPower]}</span><small>{t(powerUpNames[game.pendingStartPower])}</small><em>{t("Tap to activate")}</em></button>}
          </div>
        </div>
        {weaponCountdown !== null && <div className="game-overlay weapon-resume-countdown" role="status" aria-live="polite"><strong>{weaponCountdown}</strong></div>}
        {game.status === "paused" && !rewardCards.length && !weaponMenuOpen && weaponCountdown === null && <div className="game-overlay pause-settings-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-settings-title"><div className="game-modal pause-settings-modal">
          <p className="eyebrow" id="pause-settings-title">{t('MISSION PAUSED')}</p><h1><span className="desktop-menu-only">{t('Hold the line.')}</span><span className="mobile-menu-only">{t('A short breather.')}</span></h1><p><span className="desktop-menu-only">{t('The asteroids are waiting.')}</span><span className="mobile-menu-only">{t("Level")} {levelLabel} · {game.encounter === "normal" ? `${t("Block")} ${sectorLabel}/9` : game.encounter === "bonus" ? t("Bonus round") : t("Boss")} · {sectorName(game.sector)}</span></p>
          {accountRun && saveNotice && <section className="pause-save-status" aria-label={t("Account save")}>
            <h2>{t("Account save")}</h2><p role="status">{t(saveNotice)}</p>
            {(saveRetrying || (saveNotice.startsWith("Save not") || saveNotice.startsWith("Save failed"))) && <button className="button button-secondary" type="button" disabled={saveRetrying || pauseLeaving} onClick={() => { void retryAccountSave(); }}>{saveRetrying ? t("Saving game…") : t("Retry save")}</button>}
            <p>{t("Your enemies, remaining groups, lives, weapons and earned rewards are saved so you can continue this fight.")}</p>
            <button className="button button-secondary" type="button" disabled={saveRetrying || pauseLeaving} onClick={() => { void leaveSavedMission(); }}>{pauseLeaving ? t("Checking save…") : t("Go home")}</button>
          </section>}
          <button className="button button-secondary pause-weapon-shop-button" type="button" disabled={pauseLeaving || saveRetrying} onClick={openWeaponSelection}>{t('Shop & weapons')}</button>
          <h2 className="pause-system-title">{t("SYSTEM / SETTINGS")}</h2><SystemSettings compactMobile idPrefix="pause" musicVolume={musicVolume} effectsVolume={effectsVolume} changeMusicVolume={changeMusicVolume} changeEffectsVolume={changeEffectsVolume} onChange={() => { pointerRef.current = null; touchOriginRef.current = null; setGame({ ...stateRef.current }); }} /><button className="button button-primary pause-resume-button" type="button" disabled={pauseLeaving} onClick={() => { if (pauseLeaveRef.current) return; stateRef.current.status = "playing"; pointerRef.current = null; touchOriginRef.current = null; setGame({ ...stateRef.current }); window.setTimeout(retryAudio, 0); }}>{t("Resume")} <span className="resume-icon"><CockpitIcon kind="play" /></span></button>
        </div></div>}
        {game.status === "game-over" && <div className="game-overlay game-over-overlay"><div className="game-modal game-over-modal"><h1>{t("Game Over")}</h1><div className="game-over-details"><p className="eyebrow">{t("MISSION FAILED")}</p><p className="game-over-hearts">{t('Hearts')}: {game.hearts}</p><div className="game-over-stats"><span><b>{game.score}</b>{t('Score')}</span><span><b>{game.destroyed}</b>{t('Destroyed')}</span><span><b>{game.sector}</b>{t('Sector')}</span></div>{game.combo.total > 0 && <p className="combo-summary">{t("Combo bonus")}: {game.combo.total} × · +{game.combo.total * DOUBLE_KILL_SCORE} {t("Score")} · +{game.combo.total * DOUBLE_KILL_SHARDS} {t("Shards")}</p>}{scoreSyncStatus}<div className="modal-actions"><button className="button button-primary" type="button" onClick={restart}>{t("Play Again")} <span className="resume-icon"><CockpitIcon kind="play" /></span></button><button className="button button-secondary" type="button" onClick={goHome}>{t('Home')}</button></div></div></div></div>}
        {game.status === "victory" && <div className="game-overlay game-over-overlay"><div className="game-modal game-over-modal"><p className="eyebrow">{t("CAMPAIGN COMPLETE")}</p><h1>{t("Victory")}</h1><div className="game-over-details"><p>{t("You completed the final bonus challenge.")}</p><div className="game-over-stats"><span><b>{game.score}</b>{t("Score")}</span><span><b>{game.destroyed}</b>{t("Destroyed")}</span><span><b>{game.sector}</b>{t("Sector")}</span></div>{game.combo.total > 0 && <p className="combo-summary">{t("Combo bonus")}: {game.combo.total} × · +{game.combo.total * DOUBLE_KILL_SCORE} {t("Score")} · +{game.combo.total * DOUBLE_KILL_SHARDS} {t("Shards")}</p>}{scoreSyncStatus}<div className="modal-actions"><button className="button button-primary" type="button" onClick={restart}>{t("Play Again")} <span className="resume-icon"><CockpitIcon kind="play" /></span></button><button className="button button-secondary" type="button" onClick={goHome}>{t("Home")}</button></div></div></div></div>}
        {homePrompt && <div className="game-overlay"><div className="game-modal"><p className="eyebrow">{t('LEAVE MISSION?')}</p><h2>{t('Return to base?')}</h2><p>{accountRun ? t("Your enemies, remaining groups, lives, weapons and earned rewards are saved so you can continue this fight.") : t('Your current mission will end. Your records will be saved locally.')}</p>{accountRun && <p role="status">{t(saveNotice)}</p>}<div className="modal-actions"><button className="button button-primary" type="button" disabled={pauseLeaving || saveRetrying} onClick={() => { if (accountRun) void leaveSavedMission(); else goHome(); }}>{pauseLeaving ? t("Saving game…") : t('Leave game')}</button><button className="button button-secondary" type="button" disabled={pauseLeaving} onClick={() => { setHomePrompt(false); if (homePromptWasPlayingRef.current) { stateRef.current.status = "playing"; setGame({ ...stateRef.current }); } }}>{t('Keep playing')}</button></div></div></div>}
      </div>
    </main>
  );
};

export { BEST_SCORE_KEY, HIGHEST_SECTOR_KEY, TOTAL_DESTROYED_KEY };
export default GamePage;
