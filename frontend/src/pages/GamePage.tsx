import { useLocale } from "../i18n";
import { memo, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { attackDuration, attackGroupSize, attackPosition, chooseAttackPattern, type AttackPattern } from "./attackPatterns";
import { entryPatternForSector, entryPosition, entryStartX, type EntryPattern } from "./entryPatterns";
import { ENTRY_GAP_MS, FORMATION_SETTLE_MS, SECTION_CLEAR_MS, SECTION_INTRO_MS, arrangeFormationBySize, campaignLevel, formationLayout, formationReady, formationSlotsForCount, reinforcementCount, sectionInSector, sectionPhase, sectorInChapter, sectorName, type SectorPhase } from "./sectorManager";
import { chooseCryptoid, cryptoidDisplayName, isGhostCloaked, type CryptoidClass, type CryptoidType, type FactionCode } from "./cryptoidRoster";
import { collectPowerUp as applyPowerUp, createPowerUpDrop, movePowerUps, powerUpDescriptions, powerUpNames, powerUpSymbols, PURCHASED_POWER_UP_DURATION_MS, resolvePlayerDamage, type PowerUp } from "./powerUps";
import { readControlHand, readControlSensitivity, readControlZone, readShipStart, sensitivityMultiplier, zoneFraction, shipStartHeight } from "./controlPreferences";
import { activeWeaponLevel, advanceShot, contactWithEnemy, MAX_PLAYER_SHOTS, movePlayer, placePlayer, placePlayerFromPointer, PURCHASED_WEAPON_DURATION_MS, shipCollisionOutcome, shotHitsEnemy, type PlayerPosition, type PlayerShot } from "./playerCombat";
import { advanceEnemyShot, createEnemyShot, enemyShotHitsPlayer, enemyShotLimit, type EnemyShot } from "./enemyFire";
import SectorBackdrop from "./SectorBackdrop";
import Starfield from "./Starfield";
import { BONUS_FLIGHT_MS, BONUS_TARGET_COUNT, bonusEntryGap, bonusHeartReward, bonusPosition, bonusReward, bonusShowcaseShip, type BonusTarget } from "./bonusChallenge";
import { appendSectionBlock, bonusChainReward, BLOCKS_PER_CHAIN } from "./networkChain";
import { advanceAfterClear, BOSS_WARNING_MS, damageSectorBoss, bossFireInterval, bossVulnerable, createSectorBoss, moveSectorBoss, type SectorBoss } from "./sectorBoss";
import { enemyAppearance, selectedShip, shardBalance, ADMIN_MODE_KEY, ADMIN_SHIP_STAGE_KEY, ADMIN_START_SECTOR_KEY, SHARD_BALANCE_KEY, shipHullStyle, shipNozzleStyles, spriteStyle, spriteVisualOffset, type PlayerColorId } from "./shipFleet";
import PaintedShip from "./PaintedShip";
import { useShipVisualOffset } from "./paintedShip";
import { ownedShipStage, projectileGuardForStage, projectileImpact, shipEvolutionAsset, stageWeaponLevel, type ShipStage } from "./shipEvolution";
import { GameAudio, hasPrimedGameAudio, takePrimedGameAudio } from "./gameAudio";
import { EFFECTS_VOLUME_KEY, MUSIC_STORAGE_KEY, MUSIC_VOLUME_KEY, readEffectsVolume, readMusicVolume, resetAudioVolumeDefaults } from "./musicPreferences";
import { MusicPlayer, takeHandoffGameMusic } from "./musicPlayback";
import MusicVolumeSlider from "./MusicVolumeSlider";
import { axiosClient } from "../lib/axiosClient";
import { fireInterval, makeVolley } from "./playerCombat";
import { activateCollectedPower } from "./collectedPower";
import { leaveGameFullscreen, requestGameFullscreen } from "./gameFullscreen";
import { levelDifficulty } from "./levelDifficulty";
import { balanceAfterMission, BONUS_TARGET_SHARD_REWARD, bossPoints, bossShardReward, creditDefeat, creditReward } from "./shardEarnings";
import { addPersistentHullFire, hullFireAtImpact, spriteFireSites, type HullFire } from "./hullFires";
import { bossExplosionSize, bossFireSite, bossHullContains, bossVolley } from "./bossCombat";
import { awardBonusMedal, awardBossSticker, awardChain, readRewardProgress, REWARD_PROGRESS_KEY, rewardRank, type RewardProgress } from "./rewardProgress";

const BEST_SCORE_KEY = "cryptoid_best_score";
const HIGHEST_SECTOR_KEY = "cryptoid_highest_sector";
const TOTAL_DESTROYED_KEY = "cryptoid_total_destroyed";
const RETURN_DURATION_MS = 3_500;
const IMPACT_COOLDOWN_MS = 1_500;
const GAME_OVER_REVEAL_MS = 1_750;
const ENTRY_HUD_GAP_PX = 8;
const BOSS_VICTORY_VOLUME_BOOST = 1.6;
// Let the deep impact lead before its long tail overlaps the victory cue.
const BOSS_CLEAR_DURATION_MS = 5_100;
const FORMATION_DATA_ROWS = [
  "1011010001101001110001010011011010101100",
  "0010110111010010010011111011000101100110",
  "1110001001011011100101000110110111001010",
  "0101011110100011001110101101010001101001",
  "1001100101110100110010110010011010110101",
] as const;

type AsteroidSize = "small" | "medium" | "large";
type GameStatus = "loading" | "playing" | "paused" | "destroying" | "game-over";

type Asteroid = {
  id: number;
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
  collidedThisAttack: boolean;
};

type Effect = {
  id: number;
  x: number;
  y: number;
  kind: "shield" | "explosion" | "boss-explosion" | "player-crash" | "player-explosion" | "shatter" | "bomb-wave" | "emp-wave";
  startedAt: number;
  target?: "player";
  sprite?: number;
  debrisSize?: number;
  bossImage?: string;
  explosionStages?: number;
  finalDelayMs?: number;
  debrisRotation?: number;
  shipClass?: CryptoidClass;
  debrisColor?: PlayerColorId;
  shipStage?: ShipStage;
};
type GameState = { asteroids: Asteroid[]; bonusTargets: BonusTarget[]; bonusHits: number; bonusResult: string; chainBlocks: number; chainResult: string; rewardNotice: string; boss: SectorBoss | null; encounter: "normal" | "boss-intro" | "boss-fight" | "boss-clear" | "bonus"; shots: PlayerShot[]; enemyShots: EnemyShot[]; player: PlayerPosition; thrust: number; effects: Effect[]; powerUps: PowerUp[]; score: number; shards: number; hearts: number; maxHearts: number; projectileGuard: number; shieldCharges: number; shieldMs: number; shieldActive: boolean; overdriveMs: number; rapidFireMs: number; empMs: number; pendingStartPower: "shield" | "overdrive" | "rapid" | "bomb" | "emp" | null; weaponLevel: number; weaponCap: number; paidWeaponLevel: number; paidWeaponMs: number; pickupWeaponLevel: number; pickupWeaponMs: number; unlockedWeapons: number[]; weaponTimers: number[]; destroyed: number; sector: number; section: number; phase: SectorPhase; status: GameStatus };

const CockpitIcon = ({ kind }: { kind: "home" | "play" | "pause" }) => <svg className="game-control-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === "home" ? <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10M10 20v-6h4v6" /></> : kind === "play" ? <path d="M8 5 19 12 8 19Z" fill="currentColor" stroke="none" /> : <><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /></>}</svg>;

const CHAIN_BINARY = FORMATION_DATA_ROWS[0].repeat(4);

const BlockchainProgress = ({ blocks, saved = false }: { blocks: number; saved?: boolean }) => (
  <div className={`blockchain-progress${saved ? " blockchain-progress-saved" : ""}`} role="img" aria-label={`${blocks} of ${BLOCKS_PER_CHAIN} network blocks linked`}>
    <div className="blockchain-halo" aria-hidden="true" />
    <div className="blockchain-route" aria-hidden="true">
      {[0, 1].map(row => <div className={`blockchain-block-row blockchain-row-${row ? "bottom" : "top"}`} key={row}>
        {Array.from({ length: row ? 4 : 5 }, (_, offset) => {
          const index = offset + (row ? 5 : 0);
          return <div className="blockchain-step" key={index}>
            <i className={`blockchain-node${index < blocks ? " active" : ""}${index === blocks - 1 ? " newest" : ""}`}>
            <svg className="blockchain-cube" viewBox="0 0 64 70.4" aria-hidden="true">
              <polygon className="cube-top" points="32,4 59,19.6 32,35.2 5,19.6" />
              <polygon className="cube-left" points="5,19.6 32,35.2 32,66.4 5,50.8" />
              <polygon className="cube-right" points="32,35.2 59,19.6 59,50.8 32,66.4" />
              <path className="cube-spark cube-spark-first" d="M14 25v8m-4-4h8" />
              <path className="cube-spark cube-spark-second" d="M49 34v6m-3-3h6" />
            </svg>
            </i>
            {offset < (row ? 3 : 4) && <span className={`blockchain-link${index + 1 < blocks ? " active" : ""}`}><i /></span>}
          </div>;
        })}
      </div>)}
      <span className={`blockchain-vertical-link${blocks > 5 ? " active" : ""}`} />
    </div>
    <div className="blockchain-binary" aria-hidden="true"><div className="blockchain-binary-track"><span>{CHAIN_BINARY}</span><span>{CHAIN_BINARY}</span></div></div>
  </div>
);

const createInitialState = (): GameState => ({ asteroids: [], bonusTargets: [], bonusHits: 0, bonusResult: "", chainBlocks: 0, chainResult: "", rewardNotice: "", boss: null, encounter: "normal", shots: [], enemyShots: [], player: { x: .5, y: shipStartHeight[readShipStart()] }, thrust: 0, effects: [], powerUps: [], score: 0, shards: 0, hearts: 3, maxHearts: 3, projectileGuard: 0, shieldCharges: 0, shieldMs: 0, shieldActive: true, overdriveMs: 0, rapidFireMs: 0, empMs: 0, pendingStartPower: null, weaponLevel: 1, weaponCap: 1, paidWeaponLevel: 1, paidWeaponMs: 0, pickupWeaponLevel: 1, pickupWeaponMs: 0, unlockedWeapons: [1], weaponTimers: [0, 0, 0, 0, 0, 0], destroyed: 0, sector: 1, section: 1, phase: "SECTOR_INTRO", status: localStorage.getItem("cryptoid_pi_session") || sessionStorage.getItem(ADMIN_MODE_KEY) === "1" ? "loading" : "playing" });

const readRecord = (key: string) => Number(window.localStorage.getItem(key) || 0);

const saveRecords = (state: GameState) => {
  window.localStorage.setItem(BEST_SCORE_KEY, String(Math.max(readRecord(BEST_SCORE_KEY), state.score)));
  window.localStorage.setItem(HIGHEST_SECTOR_KEY, String(Math.max(readRecord(HIGHEST_SECTOR_KEY), state.sector)));
  window.localStorage.setItem(TOTAL_DESTROYED_KEY, String(readRecord(TOTAL_DESTROYED_KEY) + state.destroyed));
  // Earned Shards persist between runs; the current run starts at zero.
  window.localStorage.setItem(SHARD_BALANCE_KEY, String(balanceAfterMission(shardBalance(window.localStorage.getItem(SHARD_BALANCE_KEY)), state)));
};

const createFormationSlots = (section: number, sector: number, width: number, height: number, count?: number, offset = 0) => {
  const slots = formationSlotsForCount(formationLayout(section, width, height, sector), count ?? 6);
  return arrangeFormationBySize(slots, slots.map((_, index) => chooseCryptoid(sector, index + offset).radius));
};

const alignedSpritePosition = (x: number, y: number, sprite: number, renderedSize: number) => {
  const offset = spriteVisualOffset(sprite, renderedSize, true);
  return { left: x - offset.x, top: y - offset.y };
};

const spawnAsteroid = (id: number, width: number, visibleTop: number, formationIndex: number, sector: number, slots: ReturnType<typeof formationLayout>, offset = 0): Asteroid => {
  const profile = chooseCryptoid(sector, formationIndex + offset);
  const size: AsteroidSize = profile.radius === 25 ? "small" : profile.radius === 36 ? "medium" : "large";
  const target = slots[formationIndex];
  const entrySide = target.entrySide;
  const entryPattern = entryPatternForSector(sector);
  const startX = entryStartX(entryPattern, formationIndex, width, profile.radius, entrySide);
  const entryStartY = visibleTop + profile.radius + ENTRY_HUD_GAP_PX;
  return { id, x: startX, y: entryStartY, size, ...profile, ...enemyAppearance(sector, formationIndex + offset), entryDuration: Math.max(4_100, Math.round(profile.entryDuration * .85)), health: profile.health, maxHealth: profile.health, cloaked: false, rotation: 0, rotationSpeed: 0, entryElapsed: 0, entryStartX: startX, entryStartY, entryTargetX: target.x, entryTargetY: target.y, entrySide, entryPattern, entryIndex: formationIndex, formationSlot: target.index, formationSlotCount: slots.length, formationElapsed: 0, formationDuration: FORMATION_SETTLE_MS, attackPattern: null, attackDelay: 0, attackLane: 0, attackElapsed: 0, returnElapsed: 0, firedThisAttack: false, collidedThisAttack: false };
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
  const columns = count === 14 ? 4 : count === 8 ? 4 : 2;
  const rows = count === 14 ? 4 : 2;
  const targetColumns = count === 14 ? 7 : columns;
  const targetRows = 2;
  let seed = Math.imul(effect.id, 0x9e3779b1) >>> 0;
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const targets = Array.from({ length: count }, (_, index) => index);
  for (let index = count - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [targets[index], targets[swap]] = [targets[swap], targets[index]];
  }
  return targets.map((target, index) => {
    const x = index % columns;
    const y = Math.floor(index / columns);
    const left = x * 100 / columns;
    const top = y * 100 / rows;
    const right = (x + 1) * 100 / columns;
    const bottom = (y + 1) * 100 / rows;
    const jag = Math.min(7, 18 / columns);
    const shape = `polygon(${left + random() * jag}% ${top}%, ${right - random() * jag}% ${top}%, ${right}% ${top + random() * jag}%, ${right}% ${bottom - random() * jag}%, ${right - random() * jag}% ${bottom}%, ${left + random() * jag}% ${bottom}%, ${left}% ${bottom - random() * jag}%, ${left}% ${top + random() * jag}%)`;
    const destinationX = ((target % targetColumns) + .2 + random() * .6) * 100 / targetColumns;
    const destinationY = (Math.floor(target / targetColumns) + .18 + random() * .64) * 100 / targetRows;
    const spin = (random() > .5 ? 1 : -1) * (180 + Math.floor(random() * 440));
    const pieceStyle = {
      clipPath: shape,
      "--fragment-x": `calc(${destinationX.toFixed(2)}vw - ${effect.x}px)`,
      "--fragment-y": `calc(${destinationY.toFixed(2)}dvh - ${effect.y}px)`,
      "--fragment-spin": `${spin}deg`,
      "--fragment-delay": `${Math.floor(random() * 180)}ms`,
    } as CSSProperties;
    return <em key={index} className="scattered-debris-piece" style={pieceStyle}>
      {effect.kind === "boss-explosion" ? <b className="boss-fragment-hull" /> : effect.debrisColor ? <PaintedShip className="scattered-debris-sprite" sprite={sprite} color={effect.debrisColor} stage={effect.shipStage} /> : <b style={spriteStyle(sprite)} />}
    </em>;
  });
};

const shipDebris = (effect: Effect) => {
  const sprite = effect.sprite;
  const style = {
    "--debris-size": `${effect.debrisSize ?? 58}px`,
    "--debris-rotation": `${180 + (effect.debrisRotation ?? 0)}deg`,
  } as CSSProperties;
  if (effect.kind === "boss-explosion") return <div className="ship-debris scattered-debris boss-debris-field" style={style} aria-hidden="true">{scatteredPieces(effect, 14, 0)}</div>;
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

const bossFireBursts = (effect: Effect) => effect.kind === "boss-explosion" ? <div className="boss-fire-sequence" aria-hidden="true">{Array.from({ length: effect.explosionStages ?? 2 }, (_, index) => <i key={index} style={{ animationDelay: `${.07 + index * .37}s` }} />)}</div> : null;

// Effects keep their object identity until they expire. Keep the fragments and
// their animations mounted instead of rebuilding the entire debris tree on every paint.
const ImpactEffectView = memo(({ effect }: { effect: Effect }) => <div className={`impact-effect ${effect.kind}`} style={{ left: effect.x, top: effect.y, ...(effect.kind === "boss-explosion" ? { "--boss-explosion-size": `${effect.debrisSize ?? 240}px`, "--boss-image": `url('${effect.bossImage}')`, "--boss-final-delay": `${effect.finalDelayMs ?? 900}ms` } : {}) } as CSSProperties} aria-hidden="true"><span />{bossFireBursts(effect)}{shipDebris(effect)}</div>);

const GamePage = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const fieldRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLElement>(null);
  const visibleTopRef = useRef(96);
  const playerShipRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const nextIdRef = useRef(1);
  const formationIndexRef = useRef(0);
  const formationStartedRef = useRef(false);
  const reinforcementLaunchedRef = useRef(false);
  const formationOffsetRef = useRef(0);
  const bonusIndexRef = useRef(0);
  const sectionSlotsRef = useRef<ReturnType<typeof formationLayout> | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const lastPaintRef = useRef(0);
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
  const lastPlayerRef = useRef<PlayerPosition>({ x: .5, y: .86 });
  const [game, setGame] = useState<GameState>(createInitialState);
  const [startError, setStartError] = useState(false);
  const [audioNeedsTap, setAudioNeedsTap] = useState(false);
  const [homePrompt, setHomePrompt] = useState(false);
  const [shipSelection] = useState(selectedShip);
  const [shipStage, setShipStage] = useState<ShipStage>(1);
  const shipVisualOffset = useShipVisualOffset(shipSelection.skin.sprite, shipStage);
  const shipStageRef = useRef<ShipStage>(1);
  const recordsSavedRef = useRef(false);
  const scoreRunRef = useRef<string | null>(null);
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
  const bossVictoryPendingRef = useRef(false);
  const bossVictoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bossDestroyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRequestRef = useRef(false);
  const [weaponMenuOpen, setWeaponMenuOpen] = useState(false);
  const weaponHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const weaponLongPressRef = useRef(false);

  const activateLoadout = async () => {
    if (startRequestRef.current || stateRef.current.status !== "loading") return;
    startRequestRef.current = true;
    try {
      if (pendingScoreRef.current) await pendingScoreRef.current;
      const adminRequested = sessionStorage.getItem(ADMIN_MODE_KEY) === "1";
      const requestedSector = adminRequested ? Number(sessionStorage.getItem(ADMIN_START_SECTOR_KEY) || 1) : 1;
      const requestedStage = adminRequested ? Number(sessionStorage.getItem(ADMIN_SHIP_STAGE_KEY) || 1) : 1;
      const { data } = await axiosClient.post<{ weaponLevel: number; unlockedWeaponLevels: number[]; ownedShipUpgrades: string[]; powerUp: "shield" | "overdrive" | "rapid" | "bomb" | "emp" | null; armorBonus: number; scoreRunId: string | null; startSector: number; shipStage?: ShipStage; adminPreview: boolean }>("/hangar/start", { sector: requestedSector, shipStage: requestedStage });
      if (adminRequested && !data.adminPreview) throw new Error("Admin preview session expired");
      adminRunRef.current = data.adminPreview === true;
      scoreRunRef.current = data.scoreRunId;
      if (adminRunRef.current) {
        stateRef.current.sector = data.startSector;
        stateRef.current.section = data.startSector;
        stateRef.current.chainBlocks = (data.startSector - 1) % 10;
        if (data.startSector % 10 === 0 && data.startSector <= 500) {
          stateRef.current.encounter = "boss-intro";
          stateRef.current.boss = createSectorBoss(data.startSector, fieldRef.current?.clientWidth || 390, visibleTopRef.current, fieldRef.current?.clientHeight || 700);
        }
      }
      shipStageRef.current = adminRunRef.current ? data.shipStage ?? 1 : ownedShipStage(shipSelection.skin.sprite, data.ownedShipUpgrades);
      setShipStage(shipStageRef.current);
      stateRef.current.projectileGuard = projectileGuardForStage(shipStageRef.current);
      const armorBonus = Number.isInteger(data.armorBonus) ? Math.max(0, Math.min(3, data.armorBonus)) : 0;
      stateRef.current.maxHearts = 3 + armorBonus;
      stateRef.current.hearts = stateRef.current.maxHearts;
      checkpointAtRef.current = 0;
      checkpointScoreRef.current = 0;
      stateRef.current.weaponLevel = 1;
      stateRef.current.paidWeaponLevel = 1;
      stateRef.current.paidWeaponMs = 0;
      stateRef.current.unlockedWeapons = Array.isArray(data.unlockedWeaponLevels) ? [...new Set([1, ...data.unlockedWeaponLevels.filter(level => Number.isInteger(level) && level >= 1 && level <= 5)])].sort((a, b) => a - b) : [1];
      stateRef.current.weaponTimers = [0, 0, 0, 0, 0, 0];
      for (const level of stateRef.current.unlockedWeapons) if (level > 1) stateRef.current.weaponTimers[level] = -1;
      stateRef.current.weaponCap = Math.max(...stateRef.current.unlockedWeapons);
      if (data.powerUp) stateRef.current.pendingStartPower = data.powerUp;
    } catch (error) {
      console.error("Could not load paid loadout", error);
      if (sessionStorage.getItem(ADMIN_MODE_KEY) === "1") {
        setStartError(true);
        startRequestRef.current = false;
        return;
      }
    }
    stateRef.current.status = "playing";
    setGame({ ...stateRef.current });
  };
  useEffect(() => { if (stateRef.current.status === "loading") void activateLoadout(); }, []);

  useEffect(() => {
    const field = fieldRef.current;
    const hud = hudRef.current;
    if (!field || !hud) return;
    const measureVisibleTop = () => {
      const fieldBounds = field.getBoundingClientRect();
      visibleTopRef.current = Math.max(0, hud.getBoundingClientRect().bottom - fieldBounds.top);
    };
    measureVisibleTop();
    const observer = new ResizeObserver(measureVisibleTop);
    observer.observe(field);
    observer.observe(hud);
    return () => observer.disconnect();
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
    pendingScoreRef.current = axiosClient.post("/leaderboard/score", { runId, score: state.score })
      .then(() => setScoreSync("saved"))
      .catch(() => setScoreSync("failed"));
  };

  useEffect(() => {
    if (!musicEnabled) return;
    void fetch("/audio/boss-victory-v2.mp3").catch(() => {});
    const track = takeHandoffGameMusic() ?? new MusicPlayer("/audio/battle-orbit.mp3", readMusicVolume());
    musicRef.current = track;
    const resume = () => {
      if (document.visibilityState === "hidden" || stateRef.current.status !== "playing") return;
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
      track.close();
      if (musicRef.current === track) musicRef.current = null;
    };
  }, [musicEnabled]);
  useEffect(() => {
    const track = musicRef.current;
    if (!track) return;
    const normalSource = "/audio/battle-orbit.mp3";
    const waitingForExplosion = game.encounter === "boss-clear" && bossVictoryPendingRef.current;
    const desiredSource = game.encounter === "boss-clear"
      ? waitingForExplosion ? "/audio/dreadnought-duel.mp3" : "/audio/boss-victory-v2.mp3"
      : game.encounter === "boss-intro" || game.encounter === "boss-fight"
        ? "/audio/dreadnought-duel.mp3"
        : normalSource;
    track.audio.loop = game.encounter !== "boss-clear";
    if (track.currentSource !== desiredSource) {
      if (track.currentSource === normalSource) regularMusicPositionRef.current = track.audio.currentTime || 0;
      track.setSource(desiredSource, desiredSource === normalSource ? regularMusicPositionRef.current : 0);
    }
    if (game.status === "playing" && !waitingForExplosion) void track.play().then(ok => { if (!ok) setAudioNeedsTap(true); });
    else if (game.status !== "loading") track.pause();
  }, [game.status, game.encounter, musicEnabled]);
  useEffect(() => {
    const volume = game.encounter === "boss-clear"
      ? Math.min(100, musicVolume * BOSS_VICTORY_VOLUME_BOOST)
      : musicVolume;
    musicRef.current?.setVolume(volume);
  }, [musicVolume, game.encounter]);
  const startBossVictory = (leadMs: number) => {
    if (bossVictoryTimerRef.current !== null) return;
    bossVictoryPendingRef.current = true;
    musicRef.current?.pause();
    bossVictoryTimerRef.current = window.setTimeout(() => {
      bossVictoryTimerRef.current = null;
      bossVictoryPendingRef.current = false;
      if (stateRef.current.encounter !== "boss-clear") return;
      const track = musicRef.current;
      if (!track) return;
      track.audio.loop = false;
      track.setSource("/audio/boss-victory-v2.mp3");
      if (stateRef.current.status === "playing") void track.play();
    }, leadMs);
  };
  const saveReward = (award: (progress: RewardProgress) => { progress: RewardProgress; notice: string }) => {
    if (adminRunRef.current) return "";
    const result = award(readRewardProgress(window.localStorage.getItem(REWARD_PROGRESS_KEY)));
    window.localStorage.setItem(REWARD_PROGRESS_KEY, JSON.stringify(result.progress));
    return result.notice;
  };
  const destroyBoss = (state: GameState, time: number) => {
    const boss = state.boss;
    if (!boss) return;
    const finalDelayMs = 250 + boss.config.explosionStages * 350;
    state.effects.push({ id: nextIdRef.current++, x: boss.x, y: boss.y, kind: "boss-explosion", startedAt: time, debrisSize: bossExplosionSize(boss.config, boss.width), bossImage: boss.config.image, explosionStages: boss.config.explosionStages, finalDelayMs, shipClass: "heavy" });
    if (bossDestroyTimerRef.current !== null) window.clearTimeout(bossDestroyTimerRef.current);
    bossDestroyTimerRef.current = window.setTimeout(() => { bossDestroyTimerRef.current = null; soundRef.current?.play("bossDestroy"); }, finalDelayMs);
    startBossVictory(finalDelayMs + 850);
    state.score += bossPoints(state.sector);
    creditDefeat(state, bossShardReward(state.sector));
    state.rewardNotice = saveReward(progress => {
      const previousRank = rewardRank(progress);
      const result = awardBossSticker(progress, boss.config.id);
      const rank = rewardRank(result.progress);
      return { progress: result.progress, notice: `BOSS-STICKER ${boss.config.id}/50 · ${result.stars}★${rank !== previousRank ? ` · NEUER RANG ${rank.toUpperCase()}` : ""}` };
    });
    state.encounter = "boss-clear";
    state.enemyShots = [];
    state.boss = null;
  };
  useEffect(() => () => {
    if (bossVictoryTimerRef.current !== null) window.clearTimeout(bossVictoryTimerRef.current);
    if (bossDestroyTimerRef.current !== null) window.clearTimeout(bossDestroyTimerRef.current);
  }, []);
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
    soundRef.current?.setPaused(game.status === "loading" || game.status === "paused" || game.status === "game-over");
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
      if (!controls.has(event.code) || (event.target as HTMLElement)?.closest("input, textarea, select")) return;
      event.preventDefault();
      void startEffects();
      keysRef.current.add(event.code);
    };
    const keyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    const blur = () => keysRef.current.clear();
    window.addEventListener("keydown", keyDown);
    const resumeAudio = () => {
      if (document.visibilityState === "hidden" || stateRef.current.status !== "playing") return;
      retryAudio();
    };
    document.addEventListener("pointerup", resumeAudio, true);
    document.addEventListener("touchend", resumeAudio, true);
    document.addEventListener("visibilitychange", resumeAudio);
    window.addEventListener("pageshow", resumeAudio);
    window.addEventListener("focus", resumeAudio);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); window.removeEventListener("blur", blur); document.removeEventListener("pointerup", resumeAudio, true); document.removeEventListener("touchend", resumeAudio, true); document.removeEventListener("visibilitychange", resumeAudio); window.removeEventListener("pageshow", resumeAudio); window.removeEventListener("focus", resumeAudio); };
  }, []);

  useEffect(() => {
    const loop = (time: number) => {
      const state = stateRef.current;
      const delta = Math.min(34, time - (lastFrameRef.current || time));
      lastFrameRef.current = time;
      if (state.status === "playing") {
        const field = fieldRef.current;
        const width = field?.clientWidth || 800;
        const height = field?.clientHeight || 600;
        const visibleTop = visibleTopRef.current;
        const slots = sectionSlotsRef.current ?? createFormationSlots(state.section, state.sector, width, height);
        sectionSlotsRef.current = slots;
        const bonus = state.encounter === "bonus";
        const normal = state.encounter === "normal";
        const readyCount = state.asteroids.filter(asteroid => asteroid.entryElapsed >= asteroid.entryDuration && asteroid.formationElapsed >= asteroid.formationDuration).length;
        const formationIsReady = normal && formationReady({ spawned: formationIndexRef.current, total: slots.length, alive: state.asteroids.length, ready: readyCount });
        if (formationIsReady) formationStartedRef.current = true;
        const transitionPaused = state.phase === "SECTOR_INTRO" || state.phase === "SECTOR_CLEAR" || (normal && !formationStartedRef.current);
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
        const distance = Math.hypot((state.player.x - lastPlayerRef.current.x) * width, (state.player.y - lastPlayerRef.current.y) * height);
        const acceleration = distance > 1 ? 1 : 0;
        state.thrust += (acceleration - state.thrust) * Math.min(1, delta / 150);
        lastPlayerRef.current = state.player;
        if (!transitionPaused) elapsedRef.current += delta;
        impactCooldownRef.current = Math.max(0, impactCooldownRef.current - delta);
        state.overdriveMs = Math.max(0, state.overdriveMs - (transitionPaused ? 0 : delta));
        state.rapidFireMs = Math.max(0, state.rapidFireMs - (transitionPaused ? 0 : delta));
        state.empMs = Math.max(0, state.empMs - (transitionPaused ? 0 : delta));
        state.shieldMs = Math.max(0, state.shieldMs - (transitionPaused ? 0 : delta));
        if (state.shieldMs === 0) state.shieldCharges = 0;
        const playerRecovering = state.effects.some(effect => effect.target === "player" && (effect.kind === "player-crash" || effect.kind === "player-explosion"));
        const strongerPickupActive = state.pickupWeaponMs > 0 && state.pickupWeaponLevel > state.paidWeaponLevel;
        const purchasedWeaponDelta = transitionPaused || playerRecovering || strongerPickupActive ? 0 : delta;
        const pickupWeaponDelta = transitionPaused ? 0 : delta;
        state.weaponTimers = state.weaponTimers.map((remaining, level) => level > 1 && remaining > 0 ? Math.max(0, remaining - purchasedWeaponDelta) : remaining);
        if (state.paidWeaponLevel > 1) {
          state.paidWeaponMs = Math.max(0, state.weaponTimers[state.paidWeaponLevel] ?? 0);
          if (state.paidWeaponMs === 0) state.paidWeaponLevel = 1;
        } else {
          state.paidWeaponMs = 0;
        }
        state.pickupWeaponMs = Math.max(0, state.pickupWeaponMs - pickupWeaponDelta);
        if (state.pickupWeaponMs === 0) state.pickupWeaponLevel = 1;
        state.weaponLevel = activeWeaponLevel(state.paidWeaponLevel, state.paidWeaponMs, state.pickupWeaponLevel, state.pickupWeaponMs, state.weaponCap);
        sectionElapsedRef.current += delta;
        if (state.phase === "SECTOR_CLEAR") {
          clearTimerRef.current += delta;
          if (clearTimerRef.current >= (state.encounter === "boss-clear" ? BOSS_CLEAR_DURATION_MS : SECTION_CLEAR_MS)) {
            const clearEncounter = state.encounter === "boss-clear" ? "boss-clear" : state.encounter === "bonus" ? "bonus" : "normal";
            const next = advanceAfterClear(state.section, clearEncounter);
            state.section = next.section;
            state.sector = next.sector;
            state.encounter = next.encounter;
            if (next.encounter === "boss-intro") {
              state.boss = createSectorBoss(state.sector, width, visibleTop, height);
              soundRef.current?.play("boss");
            } else {
              state.boss = null;
            }
            if (next.resetChain) state.chainBlocks = 0;
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
            reinforcementLaunchedRef.current = false;
            formationOffsetRef.current = 0;
            bonusIndexRef.current = 0;
            sectionSlotsRef.current = createFormationSlots(state.section, state.sector, width, height);
            spawnTimerRef.current = 0;
            sectionElapsedRef.current = 0;
            clearTimerRef.current = 0;
            attackCooldownRef.current = 0;
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
            state.asteroids.push(spawnAsteroid(nextIdRef.current++, width, visibleTop, formationIndexRef.current++, state.sector, slots, formationOffsetRef.current));
          }
        }
        const ready = state.asteroids.filter(asteroid => asteroid.entryElapsed >= asteroid.entryDuration && asteroid.formationElapsed >= asteroid.formationDuration);
        const formationComplete = normal && formationReady({ spawned: formationIndexRef.current, total: slots.length, alive: state.asteroids.length, ready: ready.length });
        if (formationComplete && !state.asteroids.some(asteroid => asteroid.attackPattern !== null)) attackCooldownRef.current += delta;
        else if (!state.asteroids.some(asteroid => asteroid.attackPattern !== null)) attackCooldownRef.current = 0;
        if (state.empMs === 0 && formationComplete && !state.asteroids.some(asteroid => asteroid.attackPattern !== null) && attackCooldownRef.current >= levelDifficulty(state.sector).attackCooldownMs) {
            let pattern = chooseAttackPattern(attackNumberRef.current++, elapsedRef.current, state.sector);
            if (ready.length < attackGroupSize(pattern)) pattern = "curve";
            const groupSize = attackGroupSize(pattern);
            const selectedIds = ready.slice(0, groupSize).map(asteroid => asteroid.id);
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
        let shieldImpactsRemaining = state.shieldActive && state.shieldMs > 0 ? state.shieldCharges : 0;
        state.asteroids.forEach(asteroid => {
          let next = moveAsteroid(asteroid, state.empMs > 0 ? 0 : delta, width, height);
          if (asteroid.attackPattern !== null && next.attackPattern === null) attackCooldownRef.current = 0;
          if (next.attackPattern !== null && next.attackDelay === 0 && !next.firedThisAttack && next.attackElapsed < attackTime(next) && next.attackElapsed >= attackTime(next) * .28 && state.enemyShots.length < enemyShotLimit(width, elapsedRef.current, state.sector)) {
            const bullet = createEnemyShot(nextIdRef.current, next.x, next.y + next.radius * .4, state.player, width, height);
            if (bullet) {
              nextIdRef.current += 1;
              state.enemyShots.push(bullet);
              next = { ...next, firedThisAttack: true };
            }
          }
          const activeAttack = next.attackPattern !== null && next.attackDelay === 0;
          const contact = contactWithEnemy(state.player, width, height, next, !next.cloaked && next.x >= 0 && next.x <= width && next.y >= 0 && next.y <= height, activeAttack && next.collidedThisAttack, impactCooldownRef.current, asteroid);
          if (contact.connected) {
            if (contact.damage) {
              if (activeAttack) next = { ...next, collidedThisAttack: true };
              const collision = shipCollisionOutcome(state.shieldActive, shieldImpactsRemaining, state.shieldMs);
              // A contact is one impact: the shield absorbs it, otherwise one heart is lost.
              heartsLost = Math.max(heartsLost, 1);
              impactCooldownRef.current = IMPACT_COOLDOWN_MS;
              if (collision.absorbedByShield) {
                shieldImpactsRemaining -= 1;
              } else {
                const sprite = next.sprite;
                state.effects.push({ id: nextIdRef.current++, x: next.x, y: next.y, kind: next.type === "etherCrystal" ? "shatter" : "explosion", startedAt: time, sprite, debrisSize: next.radius * 2, debrisRotation: next.rotation, shipClass: next.shipClass });
                state.score += next.points;
                if (collision.destroysEnemy) creditDefeat(state, next.reward);
                soundRef.current?.play("explosion");
                if (next.attackPattern !== null) attackCooldownRef.current = 0;
                if (collision.destroysEnemy) return;
              }
            }
          }
          if (next.y >= -next.radius) nextAsteroids.push({ ...next, cloaked: isGhostCloaked(next.type, next.attackPattern === null && next.entryElapsed >= next.entryDuration && next.formationElapsed >= next.formationDuration, elapsedRef.current) });
        });
        state.asteroids = nextAsteroids;
        state.bonusTargets = state.bonusTargets.map(target => {
          const elapsed = target.elapsed + delta;
          return { ...target, elapsed, ...bonusPosition(target.index, elapsed, width, height) };
        }).filter(target => target.elapsed < BONUS_FLIGHT_MS);
        if (state.encounter === "boss-fight" && state.boss) {
          const previousBoss = state.boss;
          state.boss = moveSectorBoss(state.boss, state.empMs > 0 ? 0 : delta, width, height);
          const bossContact = contactWithEnemy(state.player, width, height, state.boss, true, false, impactCooldownRef.current, previousBoss);
          if (bossContact.damage) {
            heartsLost = Math.max(heartsLost, 1);
            impactCooldownRef.current = IMPACT_COOLDOWN_MS;
          }
          if (state.empMs === 0 && bossVulnerable(state.boss) && state.boss.fireElapsed >= bossFireInterval(state.boss, state.sector) && state.enemyShots.length < enemyShotLimit(width, elapsedRef.current, state.sector)) {
            const bullets = bossVolley(state.boss, state.player, width, height, enemyShotLimit(width, elapsedRef.current, state.sector) - state.enemyShots.length, nextIdRef.current);
            if (bullets.length) { nextIdRef.current += bullets.length; state.enemyShots.push(...bullets); state.boss.volley += 1; state.boss.fireElapsed = 0; }
          }
        }
        const incomingShots: EnemyShot[] = [];
        for (const shot of state.enemyShots) {
          const moved = advanceEnemyShot(shot, state.empMs > 0 ? 0 : delta);
          if (moved.y > height + 12 || moved.x < -12 || moved.x > width + 12) continue;
          if (enemyShotHitsPlayer(moved, state.player, width, height)) {
            if (impactCooldownRef.current === 0) {
              const shielded = state.shieldActive && state.shieldCharges > 0 && state.shieldMs > 0;
              const impact = projectileImpact(state.projectileGuard, shielded);
              state.projectileGuard = impact.guard;
              heartsLost += impact.damage;
              if (impact.blockedByHull) {
                state.effects.push({ id: nextIdRef.current++, x: state.player.x * width, y: state.player.y * height, kind: "shield", startedAt: time, target: "player" });
                soundRef.current?.play("shield");
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
          Object.assign(state, resolvePlayerDamage(state, heartsLost, state.shieldActive && state.shieldMs > 0));
          const damaged = state.hearts < previousHearts;
          damageTaken = damaged;
          const destroyed = damaged && state.hearts === 0;
          state.effects.push({ id: nextIdRef.current++, x: state.player.x * width, y: state.player.y * height, kind: destroyed ? "player-explosion" : damaged ? "player-crash" : "shield", startedAt: time, target: "player", sprite: damaged ? shipSelection.skin.sprite : undefined, debrisSize: damaged ? 86 : undefined, debrisColor: damaged ? shipSelection.color.id : undefined, shipStage: shipStageRef.current });
          if (damaged) {
            soundRef.current?.play(destroyed ? "playerDestroy" : "collision");
            state.projectileGuard = destroyed ? 0 : projectileGuardForStage(shipStageRef.current);
            state.weaponCap = Math.max(1, state.weaponCap - 1);
            // Paid weapon time is protected from life loss. Only collected weapon
            // tiers are reduced; an active paid tier remains available until its timer expires.
            state.pickupWeaponLevel = Math.min(state.pickupWeaponLevel, state.weaponCap);
            state.weaponLevel = activeWeaponLevel(state.paidWeaponLevel, state.paidWeaponMs, state.pickupWeaponLevel, state.pickupWeaponMs, state.weaponCap);
          }
          else soundRef.current?.play("shield");
        }
        state.powerUps = movePowerUps(state.powerUps, delta, height);
        state.powerUps = state.powerUps.filter(pickup => {
          if (Math.hypot(pickup.x - state.player.x * width, pickup.y - state.player.y * height) > 34) return true;
          Object.assign(state, activateCollectedPower(state, pickup.type));
          soundRef.current?.play(pickup.type === "shield" ? "shield" : "pickup");
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
            creditDefeat(state, BONUS_TARGET_SHARD_REWARD);
            state.score += 150;
            state.effects.push({ id: nextIdRef.current++, x: bonusTarget.x, y: bonusTarget.y, kind: "explosion", startedAt: time, sprite: bonusTarget.sprite, debrisSize: 50 });
            soundRef.current?.play("explosion");
            continue;
          }
          if (state.encounter === "boss-fight" && state.boss && bossVulnerable(state.boss) && bossHullContains(state.boss, shot.x, shot.y)) {
            if (!damageSectorBoss(state.boss, shot.damage, time)) continue;
            state.boss.hit = { x: (shot.x - state.boss.x) / state.boss.width * 100 + 50, y: (shot.y - state.boss.y) / state.boss.height * 100 + 50 };
            if (state.boss.health === 0) destroyBoss(state, time);
            else {
              const location = bossFireSite(state.boss, shot.x, shot.y, state.boss.hullFires ?? []);
              const maxFires = state.boss.health <= state.boss.maxHealth * .25 ? 8 : state.boss.health <= state.boss.maxHealth * .5 ? 5 : 2;
              state.boss.hullFires = addPersistentHullFire(state.boss.hullFires, { id: shot.id, ...location }, maxFires);
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
            enemy.hullFires = addPersistentHullFire(enemy.hullFires, hullFireAtImpact(shot, enemy, enemy.radius * 2, spriteFireSites[sprite], enemy.hullFires, enemy.rotation, spriteVisualOffset(sprite, enemy.radius * 2, true)));
          }
          if (enemy.health === 0) state.effects.push({ id: nextIdRef.current++, x: enemy.x, y: enemy.y, kind: enemy.type === "etherCrystal" ? "shatter" : "explosion", startedAt: time, sprite: enemy.sprite, debrisSize: enemy.radius * 2, debrisRotation: enemy.rotation, shipClass: enemy.shipClass });
          soundRef.current?.play(enemy.health > 0 ? "enemyHit" : "explosion");
          if (enemy.health > 0) continue;
          state.score += enemy.points * (enemy.attackPattern !== null && enemy.attackDelay === 0 ? 2 : 1);
          creditDefeat(state, enemy.reward);
          state.asteroids = state.asteroids.filter(item => item.id !== enemy.id);
          if (enemy.attackPattern !== null) attackCooldownRef.current = 0;
          const drop = createPowerUpDrop({ id: nextIdRef.current, x: enemy.x, y: enemy.y, width, height, threats: state.asteroids, activeCount: state.powerUps.length, chanceRoll: Math.random(), kindRoll: Math.random(), destroyed: state.destroyed, dropsCreated: dropsCreatedRef.current });
          const usefulDrop = drop?.type === "weapon" && state.weaponLevel >= 5 ? null : drop;
          if (usefulDrop) { nextIdRef.current += 1; dropsCreatedRef.current += 1; state.powerUps.push(usefulDrop); }
        }
        state.shots = remainingShots;
        // The later-level escort flight arrives after the first formation is defeated.
        if (normal && !reinforcementLaunchedRef.current && reinforcementCount(state.sector) > 0
          && formationIndexRef.current === slots.length && state.asteroids.length === 0) {
          reinforcementLaunchedRef.current = true;
          formationOffsetRef.current = slots.length;
          sectionSlotsRef.current = createFormationSlots(state.section, state.sector, width, height, reinforcementCount(state.sector), formationOffsetRef.current);
          formationIndexRef.current = 0;
          formationStartedRef.current = false;
          sectionElapsedRef.current = 0;
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
          const link = appendSectionBlock(state.chainBlocks, state.sector);
          state.chainBlocks = link.blocks;
          creditReward(state, link.shards);
          state.chainResult = link.linked ? "CHAIN COMPLETE" : "BLOCK LINKED";
          if (link.linked) state.rewardNotice = saveReward(progress => {
            const result = awardChain(progress, campaignLevel(state.sector));
            return { progress: result.progress, notice: result.milestone ? `CHAIN-ABZEICHEN · ${result.milestone} CHAINS` : "" };
          });
        }
        if (bonus && state.phase === "SECTOR_CLEAR" && previousPhase !== "SECTOR_CLEAR") {
          const reward = bonusReward(state.bonusHits, state.sector);
          const chainShards = bonusChainReward(state.chainBlocks, state.bonusHits, state.sector);
          const recoveredHeart = bonusHeartReward(state.bonusHits, state.hearts, state.maxHearts);
          state.bonusResult = `${reward.label} · +${reward.shards} BONUS SHARDS${chainShards ? ` · +${chainShards} CHAIN SHARDS` : ""}${recoveredHeart ? " · +1 HEART" : ""}${reward.powerUps.length ? ` · ${reward.powerUps.map(() => "SHIELD").join(" + ")}` : ""}`;
          state.score += reward.points;
          creditReward(state, reward.shards + chainShards);
          state.hearts = Math.min(state.maxHearts, state.hearts + recoveredHeart);
          for (const power of reward.powerUps) {
            Object.assign(state, activateCollectedPower(state, power));
          }
          if (reward.powerUps.length || recoveredHeart) soundRef.current?.play("pickup");
          state.rewardNotice = saveReward(progress => {
            const result = awardBonusMedal(progress, campaignLevel(state.sector), state.bonusHits);
            return { progress: result.progress, notice: result.improved && result.medal ? `BONUS-MEDAILLE · ${result.medal.toUpperCase()}` : "" };
          });
        }
        if (!adminRunRef.current && state.score > bestThisDeviceRef.current) {
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
        if (state.phase === "SECTOR_CLEAR") state.enemyShots = [];
        state.effects = state.effects.filter(effect => time - effect.startedAt < (effect.kind === "bomb-wave" || effect.kind === "emp-wave" ? 850 : effect.kind === "boss-explosion" ? 4_800 : effect.kind === "player-explosion" ? 2_250 : effect.kind === "player-crash" ? 1_350 : effect.kind === "explosion" || effect.kind === "shatter" ? 2_250 : 390));
        if (state.hearts === 0) {
          state.status = "destroying";
          state.enemyShots = [];
          state.shots = [];
          if (!recordsSavedRef.current) {
            if (!adminRunRef.current) saveRecords(state);
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
        const paintInterval = width > 700 ? 16 : 32;
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
    touchOriginRef.current = event.pointerType === "touch" ? { x: event.clientX, y: event.clientY, player: placePlayerFromPointer(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height, true) } : null;
    if (event.pointerType !== "touch") event.currentTarget.setPointerCapture(event.pointerId);
    positionFromPointer(event);
  };

  const activateStartPower = () => {
    const state = stateRef.current;
    if (state.status !== "playing" || !state.pendingStartPower) return;
    const power = state.pendingStartPower;
    if ((power === "shield" && state.shieldCharges > 0 && state.shieldMs > 0) || (power === "rapid" && state.rapidFireMs > 0) || (power === "overdrive" && state.overdriveMs > 0)) return;
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
          creditDefeat(state, enemy.reward);
          state.effects.push({ id: nextIdRef.current++, x: enemy.x, y: enemy.y, kind: "explosion", startedAt: now, sprite: enemy.sprite, debrisSize: enemy.radius * 2, shipClass: enemy.shipClass });
        }
        const destroyedIds = new Set(visible.map(enemy => enemy.id));
        state.asteroids = state.asteroids.filter(enemy => !destroyedIds.has(enemy.id));
        if (state.boss && state.encounter === "boss-fight") {
          state.boss.health = Math.max(0, state.boss.health - 18);
          if (state.boss.health === 0) {
            destroyBoss(state, now);
          }
        }
        attackCooldownRef.current = 0;
      }
    } else {
      Object.assign(state, applyPowerUp(state, power, PURCHASED_POWER_UP_DURATION_MS));
      if (power === "shield") state.shieldActive = true;
    }
    state.pendingStartPower = null;
    soundRef.current?.play(power === "bomb" ? "nova" : power === "emp" ? "emp" : power === "overdrive" ? "boost" : "pickup");
    setGame({ ...state });
  };
  const weaponNames = ["", "Standard", "Twin", "Rapid Twin", "Triple", "Plasma"];
  const weaponGlyphs = ["", "I", "II", "III", "IV", "V"];
  const formatWeaponTime = (ms: number) => {
    const seconds = Math.max(0, Math.ceil(ms / 1_000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  };
  const selectWeaponLevel = (level: number) => {
    const state = stateRef.current;
    if (state.status !== "playing" || !state.unlockedWeapons.includes(level)) return;
    if (level === 1) {
      state.paidWeaponLevel = 1;
      state.paidWeaponMs = 0;
    } else {
      let remaining = state.weaponTimers[level] ?? 0;
      if (remaining === 0) return;
      if (remaining < 0) {
        remaining = PURCHASED_WEAPON_DURATION_MS;
        state.weaponTimers[level] = remaining;
      }
      state.paidWeaponLevel = level;
      state.paidWeaponMs = remaining;
    }
    state.weaponLevel = activeWeaponLevel(state.paidWeaponLevel, state.paidWeaponMs, state.pickupWeaponLevel, state.pickupWeaponMs, state.weaponCap);
    setWeaponMenuOpen(false);
    setGame({ ...state, weaponTimers: [...state.weaponTimers] });
  };
  const cycleWeapon = () => {
    const state = stateRef.current;
    const available = state.unlockedWeapons
      .filter(level => level === 1 || (state.weaponTimers[level] ?? 0) !== 0)
      .sort((a, b) => a - b);
    if (!available.length) return;
    const current = state.paidWeaponLevel > 1 ? state.paidWeaponLevel : 1;
    const index = available.indexOf(current);
    selectWeaponLevel(available[(index + 1 + available.length) % available.length]);
  };
  const startWeaponHold = () => {
    if (weaponHoldTimerRef.current !== null) window.clearTimeout(weaponHoldTimerRef.current);
    weaponLongPressRef.current = false;
    weaponHoldTimerRef.current = window.setTimeout(() => {
      weaponHoldTimerRef.current = null;
      weaponLongPressRef.current = true;
      setWeaponMenuOpen(true);
    }, 420);
  };
  const finishWeaponHold = () => {
    if (weaponHoldTimerRef.current !== null) {
      window.clearTimeout(weaponHoldTimerRef.current);
      weaponHoldTimerRef.current = null;
    }
  };
  useEffect(() => () => {
    if (weaponHoldTimerRef.current !== null) window.clearTimeout(weaponHoldTimerRef.current);
  }, []);

  const restart = () => {
    if (bossVictoryTimerRef.current !== null) window.clearTimeout(bossVictoryTimerRef.current);
    bossVictoryTimerRef.current = null;
    if (bossDestroyTimerRef.current !== null) window.clearTimeout(bossDestroyTimerRef.current);
    bossDestroyTimerRef.current = null;
    bossVictoryPendingRef.current = false;
    if (gameOverTimerRef.current !== null) window.clearTimeout(gameOverTimerRef.current);
    gameOverTimerRef.current = null;
    stateRef.current = createInitialState();
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
    reinforcementLaunchedRef.current = false;
    formationOffsetRef.current = 0;
    bonusIndexRef.current = 0;
    sectionSlotsRef.current = null;
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
    pointerRef.current = null;
    touchOriginRef.current = null;
    lastPlayerRef.current = stateRef.current.player;
    lastFrameRef.current = 0;
    lastPaintRef.current = 0;
    setGame(stateRef.current);
    if (stateRef.current.status === "loading") void activateLoadout();
  };

  const goHome = () => {
    if (!recordsSavedRef.current) {
      if (!adminRunRef.current) saveRecords(stateRef.current);
      recordsSavedRef.current = true;
      submitScore(stateRef.current);
    }
    leaveGameFullscreen();
    navigate("/");
  };

  const levelLabel = String(campaignLevel(game.sector));
  const sectorLabel = sectorInChapter(game.sector);
  const round = sectionInSector(game.section);
  const levelComplete = game.encounter === "bonus" && game.phase === "SECTOR_CLEAR";
  const sectorIntro = game.encounter === "normal" && game.phase === "SECTOR_INTRO" && round === 1;
  const levelIntro = sectorIntro && sectorLabel === 1;
  const transitionHeadline = levelComplete
    ? <><b>{t("LEVEL")} {levelLabel}</b><i>{t("COMPLETE")}</i></>
    : levelIntro
      ? `${t("LEVEL")} ${levelLabel}`
      : sectorIntro
        ? `${t("Block")} ${sectorLabel} / ${BLOCKS_PER_CHAIN}`
      : game.encounter === "bonus"
        ? game.phase === "SECTOR_CLEAR" ? game.bonusResult.split(" · ")[0] : t("BONUS CHALLENGE")
        : game.encounter !== "normal"
          ? game.encounter === "boss-clear" ? t("BOSS DEFEATED") : t("WARNING · SECTOR BOSS")
          : game.phase === "SECTOR_CLEAR"
            ? `${t("Block")} ${sectorLabel} ${t("COMPLETE")}`
            : `${t("Block")} ${sectorLabel} / ${BLOCKS_PER_CHAIN}`;

  return (
    <main className="game-shell" onPointerDownCapture={event => { retryAudio(); if (pointerRef.current === null && !(event.target as HTMLElement).closest("button, .touch-controls") && !document.fullscreenElement) requestGameFullscreen(); }}>
      <div ref={fieldRef} className="game-field" onContextMenu={event => event.preventDefault()} onDoubleClick={event => event.preventDefault()} onDragStart={event => event.preventDefault()} onPointerDown={startDrag} onPointerMove={event => { if (pointerRef.current === event.pointerId) positionFromPointer(event); }} onPointerUp={event => { if (pointerRef.current === event.pointerId) { pointerRef.current = null; touchOriginRef.current = null; } }} onPointerCancel={event => { if (pointerRef.current === event.pointerId) { pointerRef.current = null; touchOriginRef.current = null; } }}>
        <Starfield sector={game.sector} player={game.player} paused={game.status !== "playing"} showNebula={game.encounter === "boss-fight"} showTwinkles={game.encounter === "normal"} />
        <SectorBackdrop sector={game.sector} player={game.player} paused={game.status !== "playing"} />
        <header ref={hudRef} className="game-hud">
          <div className="hud-actions"><button className="game-control home-control" type="button" disabled={game.status === "loading" || game.status === "destroying"} onClick={() => setHomePrompt(true)} aria-label={t("Go home")}><CockpitIcon kind="home" /></button></div>
          <div className={`hud-stat hearts-stat${game.effects.some(effect => effect.target === "player" && effect.kind === "player-crash") ? " hearts-stat-hit" : ""}`}><span className="hud-heart-label" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.2 3.4 13.1C-1.1 8.8 5.3 1.7 10.2 5.9L12 7.5l1.8-1.6c4.9-4.2 11.3 2.9 6.8 7.2L12 21.2Z" /></svg></span><strong className="hearts" role="status" aria-live="polite" aria-label={`${game.hearts} / ${game.maxHearts} ${t('Hearts')}`}>{game.hearts}/{game.maxHearts}</strong></div>
          <div className="hud-stat game-level-hud" aria-label={`${t("Game level")} ${levelLabel}`}><span>{t("Level")}</span><strong>{levelLabel}</strong></div>
          <div className="hud-stat score-hud" aria-label={`${t("Shards")} ${game.shards}, ${t("Score")} ${game.score}`}><span className="shard-line"><b>◆ {game.shards}</b><small>{t("Shards")}</small></span><span className="score-line"><b>{game.score}</b><small>{t("Score")}</small></span></div>
          <div className="hud-stat weapon-hud" aria-label={`${t("Weapon level")} ${stageWeaponLevel(shipStage, game.weaponLevel)} / 5; ${t("Projectile hits left")}: ${game.projectileGuard}`}><span>{t("Weapon")}</span><strong>{stageWeaponLevel(shipStage, game.weaponLevel)}<small>/5</small></strong>{shipStage > 1 && <small className="hull-hits">✦ {game.projectileGuard}/{projectileGuardForStage(shipStage)}</small>}</div>
          <div className="hud-stat round-hud chain-hud" aria-label={`${t("Block")} ${game.chainBlocks}/${BLOCKS_PER_CHAIN}`}><span>{t("Block")}</span><strong>{game.chainBlocks}<small>/{BLOCKS_PER_CHAIN}</small></strong></div>
          <button className="game-control pause-control" type="button" disabled={game.status === "loading" || game.status === "destroying" || game.status === "game-over"} onClick={() => { const resuming = game.status === "paused"; stateRef.current.status = resuming ? "playing" : "paused"; setGame({ ...stateRef.current }); if (resuming) window.setTimeout(retryAudio, 0); }} aria-label={t(game.status === "paused" ? "Resume" : "Pause")}><CockpitIcon kind={game.status === "paused" ? "play" : "pause"} /></button>
        </header>
        <div className="game-label">{t("LEVEL")} {levelLabel} <span>· {sectorName(game.sector)} · {game.encounter === "normal" ? `${t("Block")} ${sectorLabel}/${BLOCKS_PER_CHAIN}` : game.encounter === "bonus" ? t("BONUS CHALLENGE") : t("CORE WARDEN")}</span></div>
        {audioNeedsTap && game.status === "playing" && <button className="audio-retry" type="button" onClick={retryAudio}>Ton aktivieren</button>}
        {game.encounter === "bonus" && game.phase !== "SECTOR_CLEAR" && <div className="bonus-counter" aria-live="polite">{t("BONUS TARGETS")} {game.bonusHits} / {BONUS_TARGET_COUNT} · {t("NO ENEMY FIRE")}</div>}
        {(game.shieldCharges > 0 || game.overdriveMs > 0 || game.rapidFireMs > 0 || game.empMs > 0 || game.paidWeaponMs > 0 || game.pickupWeaponMs > 0) && <div className="power-status" aria-live="polite">{game.shieldCharges > 0 && <span>{powerUpSymbols.shield} {t("SHIELD")} {t(game.shieldActive ? "ON" : "OFF")} · {game.shieldCharges} · {Math.ceil(game.shieldMs / 1_000)}s</span>}{game.overdriveMs > 0 && <span>{powerUpSymbols.overdrive} OVERDRIVE {Math.ceil(game.overdriveMs / 1_000)}s</span>}{game.rapidFireMs > 0 && <span>{powerUpSymbols.rapid} {t("RAPID")} {Math.ceil(game.rapidFireMs / 1_000)}s</span>}{game.empMs > 0 && <span>{powerUpSymbols.emp} EMP {Math.ceil(game.empMs / 1_000)}s</span>}{game.paidWeaponMs > 0 && <span>◆ {t("BOUGHT SHOTS")} {Math.ceil(game.paidWeaponMs / 1_000)}s</span>}{game.pickupWeaponMs > 0 && <span>{powerUpSymbols.weapon} {t("PICKUP SHOTS")} {Math.ceil(game.pickupWeaponMs / 1_000)}s</span>}</div>}
        {game.status === "loading" && <div className="game-overlay"><div className="game-modal"><h1>{startError ? "Admin-Test konnte nicht gestartet werden" : t('Preparing mission')}</h1><p>{startError ? "Bitte die Pi-Sitzung prüfen und erneut versuchen." : t('Checking your saved hangar loadout.')}</p>{startError && <><button type="button" onClick={() => { setStartError(false); void activateLoadout(); }}>Erneut versuchen</button><button type="button" onClick={() => navigate("/")}>Zurück</button></>}</div></div>}
        {game.status === "playing" && (game.phase === "SECTOR_INTRO" || game.phase === "SECTOR_CLEAR") && <div className={`sector-banner${game.phase === "SECTOR_INTRO" ? " sector-transition" : " sector-clear-message"}${game.encounter === "boss-intro" ? " boss-intro-banner" : ""}${levelIntro ? " level-intro-banner" : ""}${levelComplete ? " level-complete-banner" : ""}`} aria-live="polite">
          <span>{levelComplete || levelIntro ? sectorName(game.sector) : game.encounter === "bonus" ? game.phase === "SECTOR_CLEAR" ? t("BONUS COMPLETE") : `${t("LEVEL")} ${levelLabel} · ${sectorName(game.sector)}` : game.encounter !== "normal" ? `${t("LEVEL")} ${levelLabel} · ${sectorName(game.sector)}` : game.phase === "SECTOR_CLEAR" ? t("BLOCK LINKED") : `${t("LEVEL")} ${levelLabel} · ${sectorName(game.sector)}`}</span>
          <strong>{transitionHeadline}</strong>
          {game.phase === "SECTOR_INTRO" && game.encounter === "bonus" && <small>{t("HIT THE FLYING TARGETS")}</small>}
          {game.phase === "SECTOR_CLEAR" && game.encounter === "normal" && <><small className="chain-result">{t("Block")} {game.chainBlocks}/{BLOCKS_PER_CHAIN} · {t(game.chainResult)}</small><BlockchainProgress blocks={game.chainBlocks} /></>}
          {levelComplete && <><small className="chain-result">{t("Block")} {BLOCKS_PER_CHAIN}/{BLOCKS_PER_CHAIN}</small><small className="chain-saved-label">CHAIN SAVED</small><BlockchainProgress blocks={BLOCKS_PER_CHAIN} saved /></>}
          {game.phase === "SECTOR_CLEAR" && game.encounter === "bonus" && <><small className="chain-result">{`${game.bonusHits}/${BONUS_TARGET_COUNT} TARGETS · ${game.bonusResult.split(" · ").slice(1).join(" · ")}`}</small><small className="crypto-explainer">1 Shard per target · completion bonus added immediately.</small></>}
          {game.phase === "SECTOR_CLEAR" && game.rewardNotice && <small className="reward-unlock" role="status">✦ {game.rewardNotice}</small>}
        </div>}
        {game.status === "playing" && game.encounter === "normal" && !formationStartedRef.current && (game.phase === "SECTOR_INTRO" || game.phase === "ENTRY" || game.phase === "FORMATION") && <div className="formation-data-stream" aria-hidden="true">{FORMATION_DATA_ROWS.map((row, index) => <div className="formation-data-row" key={index}><span>{row.repeat(4)}</span><span>{row.repeat(4)}</span></div>)}</div>}
        {game.encounter === "normal" && (game.phase === "ENTRY" || game.phase === "FORMATION" || game.phase === "REFORM") && game.asteroids.map(asteroid => { const locked = asteroid.entryElapsed >= asteroid.entryDuration && asteroid.formationElapsed >= asteroid.formationDuration; const diameter = asteroid.radius * 2 + 8; return <div key={`formation-${asteroid.id}`} className={`formation-target${locked ? " formation-target-locked" : ""}`} style={{ left: asteroid.entryTargetX, top: asteroid.entryTargetY, width: diameter, height: diameter }} aria-hidden="true"><span /></div>; })}
        {game.boss && game.encounter === "boss-fight" && <div className={`asteroid sector-boss${game.boss.fireElapsed >= bossFireInterval(game.boss, game.sector) - 550 ? " boss-warning" : ""}${game.boss.health <= game.boss.maxHealth / 2 ? " boss-enraged" : ""}${game.boss.health <= game.boss.maxHealth * .25 ? " boss-critical" : ""}${performance.now() - game.boss.lastDamageAt < 240 ? " boss-hit" : ""}`} style={{ left: game.boss.x, top: game.boss.y, width: game.boss.width, height: game.boss.height, transform: "translate(-50%, -50%)", "--boss-image": `url('${game.boss.config.image}')`, "--boss-thrust": `${10 + Math.abs(Math.cos(game.boss.elapsed * .00075)) * 12}px` } as CSSProperties} title={`${t("CORE WARDEN")} · ${t("Sector")} boss`}>
          {game.boss.config.engineAnchors.map(([x, y], index) => <i key={index} className="boss-engine-flame" style={{ left: `${x * 100}%`, top: `${y * 100}%` }} aria-hidden="true" />)}
          <img className="boss-hull" src={game.boss.config.image} alt="" draggable={false} />
          <div className="boss-damage-layer" aria-hidden="true">
            {!!game.boss.hullFires?.length && game.boss.hullFires.map(fire => <i key={fire.id} className="hull-fire" style={{ left: `${fire.x}%`, top: `${fire.y}%`, animationDelay: `${-(fire.id % 7) * .07}s` }} />)}
            {performance.now() - game.boss.lastDamageAt < 240 && game.boss.hit && <i className="boss-impact-flash" style={{ left: `${game.boss.hit.x}%`, top: `${game.boss.hit.y}%` }} />}
          </div>
          <span className="health-bar" data-critical={game.boss.health / game.boss.maxHealth <= .3} role="progressbar" aria-label={t("Boss hull")} aria-valuenow={Math.ceil(game.boss.health / game.boss.maxHealth * 100)} aria-valuemin={0} aria-valuemax={100}><b style={{ width: `${game.boss.health / game.boss.maxHealth * 100}%` }} /><small className="boss-health-readout">{Math.ceil(game.boss.health / game.boss.maxHealth * 100)}%</small></span>
        </div>}
        {game.bonusTargets.map(target => <div key={target.id} className="asteroid asteroid-small cryptoid bonus-ship cryptoid-boost" style={{ ...alignedSpritePosition(target.x, target.y, target.sprite, 50), transform: "translate(-50%, -50%)" }}><div className="ship-visual"><PaintedShip className="fleet-sprite" sprite={target.sprite} color={target.color} />{engineTrails(target.sprite, "exhaust")}</div></div>)}
        {game.asteroids.map(asteroid => { const sprite = asteroid.sprite; const maskImage = `url('${shipEvolutionAsset(sprite, 1)}')`; return <div key={asteroid.id} className={`asteroid asteroid-${asteroid.size} cryptoid${game.empMs > 0 ? " cryptoid-emp" : ""} cryptoid-${asteroid.type} cryptoid-${asteroid.shipClass}${asteroid.hitUntil && asteroid.hitUntil > performance.now() ? " cryptoid-hit" : ""}${asteroid.attackPattern !== null && asteroid.attackDelay > 0 ? " asteroid-preparing" : ""}${asteroid.cloaked ? " cryptoid-cloaked" : ""}${cryptoidMotionClass(asteroid)}`} title={`${cryptoidDisplayName[asteroid.type]} · ${asteroid.shipClass} · ${asteroid.faction}`} style={{ ...alignedSpritePosition(asteroid.x, asteroid.y, sprite, asteroid.radius * 2), transform: `translate(-50%, -50%) rotate(${asteroid.rotation}deg)`, ...shipHullStyle(sprite, true) }}><div className="ship-visual"><PaintedShip className="fleet-sprite" sprite={sprite} color={asteroid.color} />{engineTrails(sprite, "exhaust")}{!!asteroid.hullFires?.length && <div className="hull-fire-layer" style={{ WebkitMaskImage: maskImage, maskImage, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }} aria-hidden="true">{asteroid.hullFires.map(fire => <i key={fire.id} className="hull-fire" style={{ left: `${100 - fire.x}%`, top: `${100 - fire.y}%`, animationDelay: `${-(fire.id % 7) * .07}s` }} />)}</div>}</div><span className="health-bar" data-critical={asteroid.health / asteroid.maxHealth <= .3} role="progressbar" aria-label={t("Enemy hull")} aria-valuenow={Math.ceil(asteroid.health / asteroid.maxHealth * 100)} aria-valuemin={0} aria-valuemax={100}><b style={{ width: `${asteroid.health / asteroid.maxHealth * 100}%` }} /></span></div>; })}
        {game.powerUps.map(pickup => {
          const pickupLabel = `${t(powerUpNames[pickup.type])} · ${t(powerUpDescriptions[pickup.type])}`;
          return <div key={pickup.id} className={`power-up power-up-${pickup.type}`} role="img" aria-label={pickupLabel} title={pickupLabel} style={{ left: pickup.x, top: pickup.y }}><span aria-hidden="true">{powerUpSymbols[pickup.type]}</span></div>;
        })}
        {game.shots.map(shot => <div key={shot.id} className={`player-laser${shot.empowered ? " player-laser-overdrive" : ""}`} style={{ left: shot.x, top: shot.y }} />)}
        {game.enemyShots.map(shot => <div key={shot.id} className={`enemy-laser${shot.bossKind ? ` boss-projectile boss-projectile-${shot.bossKind}` : ""}`} style={{ left: shot.x, top: shot.y }} />)}
        {game.effects.map(effect => <ImpactEffectView key={effect.id} effect={effect} />)}
        {game.hearts > 0 && <div ref={playerShipRef} className={`player-ship shielded-ship${shipSelection.color.id === "grey" || shipSelection.color.id === "white" ? ` player-ship-${shipSelection.color.id}` : ""}${game.shieldActive && game.shieldCharges > 0 && game.shieldMs > 0 ? " player-ship-shield-active" : ""}${game.effects.some(effect => effect.target === "player" && effect.kind === "player-crash") ? " player-ship-respawn" : ""}${game.effects.some(effect => effect.target === "player" && effect.kind === "shield") ? " player-ship-shielded" : ""}`} style={{ left: `${game.player.x * 100}%`, top: `${game.player.y * 100}%`, "--ship-glow": shipSelection.color.glow, "--flame-length": `${5 + game.thrust * 13}%`, ...shipVisualOffset } as CSSProperties} aria-label={t('Your Cryptoid ship')}><div className="ship-visual"><PaintedShip className="fleet-sprite" sprite={shipSelection.skin.sprite} color={shipSelection.color.id} stage={shipStage} />{engineTrails(shipSelection.skin.sprite, "player-engine")}</div></div>}
        <div className={`touch-controls touch-controls-${readControlHand()}`}>
          <div className="edge-actions" role="group" aria-label={t('Available equipment')}>
            <div className="weapon-control-wrap" data-active={game.paidWeaponLevel > 1 && game.paidWeaponMs > 0 ? "true" : "false"} style={{ "--weapon-progress": `${game.paidWeaponLevel > 1 && game.paidWeaponMs > 0 ? Math.max(0, Math.min(360, game.paidWeaponMs / PURCHASED_WEAPON_DURATION_MS * 360)) : 0}deg` } as CSSProperties}>
              {weaponMenuOpen && <div className="weapon-wheel" role="menu" aria-label="Weapon selection">
                {[1, 2, 3, 4, 5].map(level => {
                  const owned = game.unlockedWeapons.includes(level);
                  const remaining = game.weaponTimers[level] ?? 0;
                  const expired = level > 1 && owned && remaining === 0;
                  const selected = level === (game.paidWeaponLevel > 1 ? game.paidWeaponLevel : 1);
                  const status = level === 1 ? "FREE" : !owned ? "LOCKED" : remaining < 0 ? formatWeaponTime(PURCHASED_WEAPON_DURATION_MS) : expired ? "USED" : formatWeaponTime(remaining);
                  return <button key={level} type="button" role="menuitem" className={`weapon-wheel-option weapon-wheel-option-${level}${selected ? " selected" : ""}${!owned ? " locked" : ""}`} disabled={!owned || expired} onClick={() => selectWeaponLevel(level)} aria-label={`${weaponNames[level]} · ${status}`}><b>{weaponGlyphs[level]}</b><span>{weaponNames[level]}</span><small>{status}</small></button>;
                })}
              </div>}
              <button type="button" className="edge-action edge-action-weapon weapon-cycle" disabled={game.status !== "playing"} onPointerDown={startWeaponHold} onPointerUp={finishWeaponHold} onPointerCancel={finishWeaponHold} onPointerLeave={finishWeaponHold} onClick={() => { if (weaponLongPressRef.current) { weaponLongPressRef.current = false; return; } cycleWeapon(); }} aria-label="Tap to switch weapon. Hold for weapon menu.">
                <span className="weapon-cycle-glyph" aria-hidden="true">{weaponGlyphs[game.paidWeaponLevel > 1 ? game.paidWeaponLevel : 1]}</span>
                <small>{game.paidWeaponLevel > 1 ? weaponNames[game.paidWeaponLevel] : "WEAPON"}</small>
                {game.paidWeaponLevel > 1 && game.paidWeaponMs > 0 && <em>{formatWeaponTime(game.paidWeaponMs)}</em>}
              </button>
            </div>
            {game.pendingStartPower && <button type="button" className={`edge-action edge-action-${game.pendingStartPower} edge-action-purchased`} disabled={game.status !== "playing" || (game.pendingStartPower === "shield" && game.shieldCharges > 0 && game.shieldMs > 0) || (game.pendingStartPower === "rapid" && game.rapidFireMs > 0) || (game.pendingStartPower === "overdrive" && game.overdriveMs > 0) || (game.pendingStartPower === "emp" && game.empMs > 0)} aria-label={`${t("Tap to activate")} ${t(powerUpNames[game.pendingStartPower])}`} onClick={activateStartPower}><span aria-hidden="true">{powerUpSymbols[game.pendingStartPower]}</span><small>{t(powerUpNames[game.pendingStartPower])}</small><em>{t("Tap to activate")}</em></button>}
          </div>
        </div>
        {game.status === "paused" && <div className="game-overlay"><div className="game-modal"><p className="eyebrow">{t('MISSION PAUSED')}</p><h1>{t('Hold the line.')}</h1><p>{t('The asteroids are waiting.')}</p><MusicVolumeSlider id="pause-music-volume" label={t('Music volume')} value={musicVolume} onChange={changeMusicVolume} /><MusicVolumeSlider id="pause-effects-volume" label={t('Effects volume')} value={effectsVolume} onChange={changeEffectsVolume} /><button className="button button-primary" type="button" onClick={() => { stateRef.current.status = "playing"; setGame({ ...stateRef.current }); window.setTimeout(retryAudio, 0); }}>Resume mission <span className="resume-icon"><CockpitIcon kind="play" /></span></button></div></div>}
        {game.status === "game-over" && <div className="game-overlay game-over-overlay"><div className="game-modal game-over-modal"><h1>{t("Game Over")}</h1><div className="game-over-details"><p className="eyebrow">{t("MISSION FAILED")}</p><p className="game-over-hearts">{t('Hearts')}: {game.hearts}/{game.maxHearts}</p><div className="game-over-stats"><span><b>{game.score}</b>{t('Score')}</span><span><b>{game.destroyed}</b>{t('Destroyed')}</span><span><b>{game.sector}</b>{t('Sector')}</span></div>{scoreSync !== "idle" && <p role="status">{t(scoreSync === "saving" ? "Saving personal best…" : scoreSync === "saved" ? "Personal best saved." : "Could not sync personal best. Local best is saved.")}</p>}<div className="modal-actions"><button className="button button-primary" type="button" onClick={restart}>{t("Play Again")} <span className="resume-icon"><CockpitIcon kind="play" /></span></button><button className="button button-secondary" type="button" onClick={goHome}>{t('Home')}</button></div></div></div></div>}
        {homePrompt && <div className="game-overlay"><div className="game-modal"><p className="eyebrow">{t('LEAVE MISSION?')}</p><h2>{t('Return to base?')}</h2><p>{t('Your current mission will end. Your records will be saved locally.')}</p><div className="modal-actions"><button className="button button-primary" type="button" onClick={goHome}>{t('Leave game')}</button><button className="button button-secondary" type="button" onClick={() => setHomePrompt(false)}>{t('Keep playing')}</button></div></div></div>}
      </div>
    </main>
  );
};

export { BEST_SCORE_KEY, HIGHEST_SECTOR_KEY, TOTAL_DESTROYED_KEY };
export default GamePage;
