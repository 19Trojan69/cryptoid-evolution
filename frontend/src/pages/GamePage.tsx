import { useLocale } from "../i18n";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { attackDuration, attackGroupSize, attackPosition, chooseAttackPattern, type AttackPattern } from "./attackPatterns";
import { ENTRY_GAP_MS, FORMATION_SETTLE_MS, SECTION_CLEAR_MS, SECTION_INTRO_MS, arrangeFormationBySize, formationLayout, formationReady, sectionInSector, sectionPhase, sectorForSection, sectorName, type SectorPhase } from "./sectorManager";
import { chooseCryptoid, cryptoidDisplayName, isGhostCloaked, type CryptoidClass, type CryptoidType, type FactionCode } from "./cryptoidRoster";
import { collectPowerUp as applyPowerUp, createPowerUpDrop, movePowerUps, powerUpDescriptions, powerUpNames, powerUpSymbols, POWER_UP_DURATION_MS, PURCHASED_POWER_UP_DURATION_MS, resolvePlayerDamage, type PowerUp, type PowerUpType } from "./powerUps";
import { readControlHand } from "./controlPreferences";
import { canActivatePower, spendPower, storePower, type PowerInventory } from "./powerInventory";
import { activeWeaponLevel, advanceShot, contactWithEnemy, MAX_PLAYER_SHOTS, movePlayer, PICKUP_WEAPON_DURATION_MS, placePlayerFromPointer, PURCHASED_WEAPON_DURATION_MS, shipCollisionOutcome, shotHitsEnemy, type PlayerPosition, type PlayerShot } from "./playerCombat";
import { advanceEnemyShot, createEnemyShot, enemyShotHitsPlayer, enemyShotLimit, type EnemyShot } from "./enemyFire";
import SectorBackdrop from "./SectorBackdrop";
import Starfield from "./Starfield";
import { BONUS_FLIGHT_MS, BONUS_TARGET_COUNT, bonusEntryGap, bonusHeartReward, bonusPosition, bonusReward, bonusShowcaseShip, isBonusSection, type BonusTarget } from "./bonusChallenge";
import { appendSectionBlock, BLOCKS_PER_CHAIN } from "./networkChain";
import { bossFireInterval, bossVulnerable, createSectorBoss, moveSectorBoss, nextAfterClear, type SectorBoss } from "./sectorBoss";
import { bossNozzleStyles, enemySprite, selectedShip, shardBalance, SHARD_BALANCE_KEY, shipHullStyle, shipNozzleStyles, spriteStyle, spriteVisualOffset, type PlayerColorId } from "./shipFleet";
import PaintedShip from "./PaintedShip";
import { GameAudio, hasPrimedGameAudio, takePrimedGameAudio } from "./gameAudio";
import { axiosClient } from "../lib/axiosClient";
import { fireInterval, makeVolley } from "./playerCombat";
import { leaveGameFullscreen, requestGameFullscreen } from "./gameFullscreen";
import { levelDifficulty } from "./levelDifficulty";

const BEST_SCORE_KEY = "cryptoid_best_score";
const HIGHEST_SECTOR_KEY = "cryptoid_highest_sector";
const TOTAL_DESTROYED_KEY = "cryptoid_total_destroyed";
const RETURN_DURATION_MS = 3_500;
const IMPACT_COOLDOWN_MS = 1_500;
const GAME_OVER_REVEAL_MS = 1_750;
const ENTRY_HUD_GAP_PX = 8;
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
  faction: FactionCode;
  radius: number;
  reward: number;
  points: number;
  entryDuration: number;
  attackPace: number;
  cloaked: boolean;
  health: number;
  maxHealth: number;
  rotation: number;
  rotationSpeed: number;
  entryElapsed: number;
  entryStartX: number;
  entryStartY: number;
  entryTargetX: number;
  entryTargetY: number;
  entrySide: number;
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
  kind: "hit" | "shield" | "explosion" | "boss-explosion" | "player-crash" | "player-explosion" | "shatter";
  startedAt: number;
  target?: "player";
  sprite?: number;
  debrisSize?: number;
  debrisRotation?: number;
  shipClass?: CryptoidClass;
  debrisColor?: PlayerColorId;
};
type GameState = { asteroids: Asteroid[]; bonusTargets: BonusTarget[]; bonusHits: number; bonusResult: string; bonusShards: number; chainBlocks: number; chainResult: string; boss: SectorBoss | null; encounter: "normal" | "boss-intro" | "boss-fight" | "boss-clear"; shots: PlayerShot[]; enemyShots: EnemyShot[]; player: PlayerPosition; thrust: number; effects: Effect[]; powerUps: PowerUp[]; powerInventory: PowerInventory; score: number; coins: number; hearts: number; shieldCharges: number; shieldMs: number; shieldActive: boolean; overdriveMs: number; rapidFireMs: number; pendingStartPower: "shield" | "overdrive" | "rapid" | null; weaponLevel: number; weaponCap: number; paidWeaponLevel: number; paidWeaponMs: number; pickupWeaponLevel: number; pickupWeaponMs: number; unlockedWeapons: number[]; destroyed: number; sector: number; section: number; phase: SectorPhase; status: GameStatus };

const createInitialState = (): GameState => ({ asteroids: [], bonusTargets: [], bonusHits: 0, bonusResult: "", bonusShards: 0, chainBlocks: 0, chainResult: "", boss: null, encounter: "normal", shots: [], enemyShots: [], player: { x: .5, y: .86 }, thrust: 0, effects: [], powerUps: [], powerInventory: { shield: 0, overdrive: 0, weapon: 0, rapid: 0 }, score: 0, coins: 0, hearts: 3, shieldCharges: 0, shieldMs: 0, shieldActive: true, overdriveMs: 0, rapidFireMs: 0, pendingStartPower: null, weaponLevel: 1, weaponCap: 1, paidWeaponLevel: 1, paidWeaponMs: 0, pickupWeaponLevel: 1, pickupWeaponMs: 0, unlockedWeapons: [1], destroyed: 0, sector: 1, section: 1, phase: "SECTOR_INTRO", status: localStorage.getItem("cryptoid_pi_session") ? "loading" : "playing" });

const readRecord = (key: string) => Number(window.localStorage.getItem(key) || 0);

const saveRecords = (state: GameState) => {
  window.localStorage.setItem(BEST_SCORE_KEY, String(Math.max(readRecord(BEST_SCORE_KEY), state.score)));
  window.localStorage.setItem(HIGHEST_SECTOR_KEY, String(Math.max(readRecord(HIGHEST_SECTOR_KEY), state.sector)));
  window.localStorage.setItem(TOTAL_DESTROYED_KEY, String(readRecord(TOTAL_DESTROYED_KEY) + state.destroyed));
  // Earned Shards persist between runs; the current run starts at zero.
  window.localStorage.setItem(SHARD_BALANCE_KEY, String(shardBalance(window.localStorage.getItem(SHARD_BALANCE_KEY)) + state.destroyed + state.bonusShards));
};

const createFormationSlots = (section: number, sector: number, width: number, height: number) => {
  const slots = formationLayout(section, width, height);
  return arrangeFormationBySize(slots, slots.map((_, index) => chooseCryptoid(sector, index).radius));
};

const alignedSpritePosition = (x: number, y: number, sprite: number, renderedSize: number) => {
  const offset = spriteVisualOffset(sprite, renderedSize, true);
  return { left: x - offset.x, top: y - offset.y };
};

const spawnAsteroid = (id: number, width: number, visibleTop: number, formationIndex: number, sector: number, slots: ReturnType<typeof formationLayout>): Asteroid => {
  const profile = chooseCryptoid(sector, formationIndex);
  const size: AsteroidSize = profile.radius === 25 ? "small" : profile.radius === 36 ? "medium" : "large";
  const target = slots[formationIndex];
  const entrySide = target.entrySide;
  const availableWidth = Math.max(1, width - profile.radius * 2);
  const entryStartX = entrySide === 1 ? profile.radius + availableWidth * 0.08 : width - profile.radius - availableWidth * 0.08;
  const entryStartY = visibleTop + profile.radius + ENTRY_HUD_GAP_PX;
  return { id, x: entryStartX, y: entryStartY, size, ...profile, entryDuration: Math.max(2_500, Math.round(profile.entryDuration * .5)), health: profile.health, maxHealth: profile.health, cloaked: false, rotation: 0, rotationSpeed: 0, entryElapsed: 0, entryStartX, entryStartY, entryTargetX: target.x, entryTargetY: target.y, entrySide, formationSlot: target.index, formationSlotCount: slots.length, formationElapsed: 0, formationDuration: FORMATION_SETTLE_MS, attackPattern: null, attackDelay: 0, attackLane: 0, attackElapsed: 0, returnElapsed: 0, firedThisAttack: false, collidedThisAttack: false };
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
    if (asteroid.attackPattern === null) return { ...asteroid, rotation };
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
  const curve = asteroid.id % 4 < 2 ? Math.sin(Math.PI * progress) * 0.1 : Math.sin(2 * Math.PI * progress) * 0.07;
  const x = asteroid.entryStartX + (asteroid.entryTargetX - asteroid.entryStartX) * progress + asteroid.entrySide * width * curve;
  return {
    ...asteroid,
    x: keepInField(x),
    y: asteroid.entryStartY + (asteroid.entryTargetY - asteroid.entryStartY) * progress,
    entryElapsed: elapsed,
    formationElapsed: delta - entryDelta,
    rotation,
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

const bossEngineTrails = () =>
  bossNozzleStyles().map((style, index) => <span key={`boss-exhaust-${index}`} className={`exhaust ${index === 1 ? "exhaust-main" : "exhaust-wing"}`} style={style} />);

const shipDebris = (effect: Effect) => {
  const sprite = effect.sprite;
  if (sprite === undefined) return null;
  const style = {
    "--debris-size": `${effect.debrisSize ?? 58}px`,
    "--debris-rotation": `${180 + (effect.debrisRotation ?? 0)}deg`,
  } as CSSProperties;
  if (effect.kind === "boss-explosion") {
    return <div className="ship-debris boss-debris-field ship-debris-heavy" style={style} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6].map(index => <em className={`boss-debris-piece boss-debris-piece-${index + 1}`} key={index}><b style={spriteStyle(sprite)} /></em>)}
    </div>;
  }
  return <div className={`ship-debris${effect.shipClass ? ` ship-debris-${effect.shipClass}` : ""}`} style={style} aria-hidden="true">
    {[0, 1, 2, 3].map(index => <em className={`ship-debris-piece ship-debris-piece-${index + 1}`} key={index}>{effect.debrisColor ? <PaintedShip className="ship-debris-sprite" sprite={sprite} color={effect.debrisColor} /> : <b style={spriteStyle(sprite)} />}</em>)}
  </div>;
};

const bossFireBursts = (effect: Effect) => effect.kind === "boss-explosion" ? <div className="boss-fire-sequence" aria-hidden="true"><i /><i /><i /></div> : null;

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
  const lastPlayerRef = useRef<PlayerPosition>({ x: .5, y: .86 });
  const [game, setGame] = useState<GameState>(createInitialState);
  const [homePrompt, setHomePrompt] = useState(false);
  const [shipSelection] = useState(selectedShip);
  const recordsSavedRef = useRef(false);
  const scoreRunRef = useRef<string | null>(null);
  const pendingScoreRef = useRef<Promise<unknown> | null>(null);
  const bestThisDeviceRef = useRef(readRecord(BEST_SCORE_KEY));
  const checkpointAtRef = useRef(0);
  const checkpointScoreRef = useRef(0);
  const [scoreSync, setScoreSync] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const soundRef = useRef<GameAudio | null>(null);
  const audioStartRef = useRef<Promise<GameAudio | null> | null>(null);
  const audioCleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRequestRef = useRef(false);

  const activateLoadout = async () => {
    if (startRequestRef.current || stateRef.current.status !== "loading") return;
    startRequestRef.current = true;
    try {
      if (pendingScoreRef.current) await pendingScoreRef.current;
      const { data } = await axiosClient.post<{ weaponLevel: number; unlockedWeaponLevels: number[]; powerUp: "shield" | "overdrive" | "rapid" | null; scoreRunId: string }>("/hangar/start");
      scoreRunRef.current = data.scoreRunId;
      checkpointAtRef.current = 0;
      checkpointScoreRef.current = 0;
      stateRef.current.weaponLevel = Math.max(1, Math.min(5, data.weaponLevel));
      stateRef.current.paidWeaponLevel = stateRef.current.weaponLevel;
      stateRef.current.paidWeaponMs = stateRef.current.weaponLevel > 1 ? PURCHASED_WEAPON_DURATION_MS : 0;
      stateRef.current.unlockedWeapons = Array.isArray(data.unlockedWeaponLevels) ? [...new Set([1, ...data.unlockedWeaponLevels.filter(level => Number.isInteger(level) && level >= 1 && level <= 5)])] : [1];
      stateRef.current.weaponCap = Math.max(stateRef.current.weaponLevel, ...stateRef.current.unlockedWeapons);
      if (data.powerUp) stateRef.current.pendingStartPower = data.powerUp;
    } catch (error) {
      console.error("Could not load paid loadout; starting with standard equipment", error);
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
    if (audioCleanupRef.current !== null) window.clearTimeout(audioCleanupRef.current);
    return () => {
      // StrictMode immediately remounts in development; preserve the primed audio across that cycle.
      audioCleanupRef.current = window.setTimeout(() => {
        void audioStartRef.current?.then(audio => audio?.close());
      }, 0);
    };
  }, []);
  useEffect(() => {
    soundRef.current?.setSector(game.sector);
    soundRef.current?.setPaused(game.status === "loading" || game.status === "paused" || game.status === "game-over");
  }, [game.sector, game.status]);

  const startEffects = () => {
    if (!audioStartRef.current) {
      const primed = takePrimedGameAudio();
      const audio = primed ? null : new GameAudio();
      audioStartRef.current = (primed ?? audio!.start().then(started => started ? audio : null)).then(ready => {
        if (!ready) {
          audio?.close();
          audioStartRef.current = null;
          return null;
        }
        ready.setSector(stateRef.current.sector);
        ready.setPaused(stateRef.current.status !== "playing");
        soundRef.current = ready;
        return ready;
      });
    }
    return audioStartRef.current;
  };
  useEffect(() => { if (hasPrimedGameAudio()) void startEffects(); }, []);

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
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); window.removeEventListener("blur", blur); };
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
        const bonus = state.encounter === "normal" && isBonusSection(state.section);
        const normal = state.encounter === "normal" && !bonus;
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
        state.shieldMs = Math.max(0, state.shieldMs - (transitionPaused ? 0 : delta));
        if (state.shieldMs === 0) state.shieldCharges = 0;
        state.paidWeaponMs = Math.max(0, state.paidWeaponMs - (transitionPaused ? 0 : delta));
        state.pickupWeaponMs = Math.max(0, state.pickupWeaponMs - (transitionPaused ? 0 : delta));
        if (state.paidWeaponMs === 0) state.paidWeaponLevel = 1;
        if (state.pickupWeaponMs === 0) state.pickupWeaponLevel = 1;
        state.weaponLevel = activeWeaponLevel(state.paidWeaponLevel, state.paidWeaponMs, state.pickupWeaponLevel, state.pickupWeaponMs, state.weaponCap);
        sectionElapsedRef.current += delta;
        if (state.phase === "SECTOR_CLEAR") {
          clearTimerRef.current += delta;
          if (clearTimerRef.current >= SECTION_CLEAR_MS) {
            if (nextAfterClear(isBonusSection(state.section), state.encounter !== "normal") === "boss") {
              state.encounter = "boss-intro";
              state.boss = createSectorBoss(state.sector, width, visibleTop);
              soundRef.current?.play("boss");
            } else {
              state.section += 1;
              state.sector = sectorForSection(state.section);
              state.encounter = "normal";
              state.boss = null;
              if (sectionInSector(state.section) === 1) state.chainBlocks = 0;
            }
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
            state.asteroids.push(spawnAsteroid(nextIdRef.current++, width, visibleTop, formationIndexRef.current++, state.sector, slots));
          }
        }
        const ready = state.asteroids.filter(asteroid => asteroid.entryElapsed >= asteroid.entryDuration && asteroid.formationElapsed >= asteroid.formationDuration);
        const formationComplete = normal && formationReady({ spawned: formationIndexRef.current, total: slots.length, alive: state.asteroids.length, ready: ready.length });
        if (formationComplete && !state.asteroids.some(asteroid => asteroid.attackPattern !== null)) attackCooldownRef.current += delta;
        else if (!state.asteroids.some(asteroid => asteroid.attackPattern !== null)) attackCooldownRef.current = 0;
        if (formationComplete && !state.asteroids.some(asteroid => asteroid.attackPattern !== null) && attackCooldownRef.current >= levelDifficulty(state.sector).attackCooldownMs) {
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
          let next = moveAsteroid(asteroid, delta, width, height);
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
              heartsLost += contact.damage;
              impactCooldownRef.current = IMPACT_COOLDOWN_MS;
              const collision = shipCollisionOutcome(state.shieldActive, shieldImpactsRemaining, state.shieldMs);
              if (collision.absorbedByShield) {
                shieldImpactsRemaining -= 1;
              } else {
                const sprite = enemySprite(next.shipClass, next.formationSlot);
                state.effects.push({ id: nextIdRef.current++, x: next.x, y: next.y, kind: next.type === "etherCrystal" ? "shatter" : "explosion", startedAt: time, sprite, debrisSize: next.radius * 2, debrisRotation: next.rotation, shipClass: next.shipClass });
                state.score += next.points;
                state.coins += next.reward;
                state.destroyed += 1;
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
          state.boss = moveSectorBoss(state.boss, delta, width, height);
          const bossContact = contactWithEnemy(state.player, width, height, state.boss, true, false, impactCooldownRef.current, previousBoss);
          if (bossContact.damage) {
            heartsLost += bossContact.damage;
            impactCooldownRef.current = IMPACT_COOLDOWN_MS;
          }
          if (bossVulnerable(state.boss) && state.boss.fireElapsed >= bossFireInterval(state.boss, state.sector) && state.enemyShots.length < enemyShotLimit(width, elapsedRef.current, state.sector)) {
            const bullet = createEnemyShot(nextIdRef.current, state.boss.x, state.boss.y + state.boss.radius * .4, state.player, width, height);
            if (bullet) {
              nextIdRef.current += 1;
              state.enemyShots.push(bullet);
              state.boss.fireElapsed = 0;
            }
          }
        }
        const incomingShots: EnemyShot[] = [];
        for (const shot of state.enemyShots) {
          const moved = advanceEnemyShot(shot, delta);
          if (moved.y > height + 12 || moved.x < -12 || moved.x > width + 12) continue;
          if (enemyShotHitsPlayer(moved, state.player, width, height)) {
            if (impactCooldownRef.current === 0) {
              heartsLost += 1;
              impactCooldownRef.current = IMPACT_COOLDOWN_MS;
            }
            continue;
          }
          incomingShots.push(moved);
        }
        state.enemyShots = incomingShots;
        if (heartsLost > 0) {
          const previousHearts = state.hearts;
          Object.assign(state, resolvePlayerDamage(state, heartsLost, state.shieldActive));
          const damaged = state.hearts < previousHearts;
          damageTaken = damaged;
          const destroyed = damaged && state.hearts === 0;
          state.effects.push({ id: nextIdRef.current++, x: state.player.x * width, y: state.player.y * height, kind: destroyed ? "player-explosion" : damaged ? "player-crash" : "shield", startedAt: time, target: "player", sprite: damaged ? shipSelection.skin.sprite : undefined, debrisSize: damaged ? 86 : undefined, debrisColor: damaged ? shipSelection.color.id : undefined });
          if (damaged) { soundRef.current?.play(destroyed ? "bossDestroy" : "collision"); state.weaponCap = Math.max(1, state.weaponCap - 1); state.paidWeaponLevel = Math.min(state.paidWeaponLevel, state.weaponCap); state.pickupWeaponLevel = Math.min(state.pickupWeaponLevel, state.weaponCap); state.weaponLevel = Math.min(state.weaponLevel, state.weaponCap); }
          else soundRef.current?.play("shield");
        }
        state.powerUps = movePowerUps(state.powerUps, delta, height);
        state.powerUps = state.powerUps.filter(pickup => {
          if (Math.hypot(pickup.x - state.player.x * width, pickup.y - state.player.y * height) > 34) return true;
          state.powerInventory = storePower(state.powerInventory, pickup.type);
          soundRef.current?.play("pickup");
          return false;
        });
        if (transitionPaused) fireTimerRef.current = 0;
        else fireTimerRef.current += delta;
        const interval = fireInterval(state.weaponLevel, state.rapidFireMs);
        if (!transitionPaused && fireTimerRef.current >= interval) {
          fireTimerRef.current %= interval;
          if (state.shots.length < MAX_PLAYER_SHOTS) {
            const volley = makeVolley(state.weaponLevel, state.player.x * width, state.player.y * height - 23, state.overdriveMs > 0, () => nextIdRef.current++);
            state.shots.push(...volley.slice(0, MAX_PLAYER_SHOTS - state.shots.length));
            soundRef.current?.play("laser", state.weaponLevel);
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
            state.score += 150;
            state.effects.push({ id: nextIdRef.current++, x: bonusTarget.x, y: bonusTarget.y, kind: "explosion", startedAt: time, sprite: bonusTarget.sprite, debrisSize: 50 });
            soundRef.current?.play("explosion");
            continue;
          }
          if (state.encounter === "boss-fight" && state.boss && bossVulnerable(state.boss) && shotHitsEnemy(shot, { ...state.boss, cloaked: false })) {
            state.boss.health = Math.max(0, state.boss.health - shot.damage);
            state.effects.push({ id: nextIdRef.current++, x: state.boss.health > 0 ? shot.x : state.boss.x, y: state.boss.health > 0 ? shot.y : state.boss.y, kind: state.boss.health > 0 ? "hit" : "boss-explosion", startedAt: time, sprite: state.boss.health > 0 ? undefined : 19, debrisSize: state.boss.health > 0 ? undefined : 124, shipClass: state.boss.health > 0 ? undefined : "heavy" });
            soundRef.current?.play(state.boss.health > 0 ? "enemyHit" : "bossDestroy");
            if (state.boss.health === 0) {
              state.score += 2_000 + state.sector * 100;
              state.destroyed += 1;
              state.encounter = "boss-clear";
              state.enemyShots = [];
              state.boss = null;
            }
            continue;
          }
          const enemy = state.asteroids.find(item => shotHitsEnemy(shot, item));
          if (!enemy) { remainingShots.push(shot); continue; }
          enemy.health = Math.max(0, enemy.health - shot.damage);
          const destroyedSprite = enemySprite(enemy.shipClass, enemy.formationSlot);
          state.effects.push({ id: nextIdRef.current++, x: enemy.x, y: enemy.y, kind: enemy.health > 0 ? "hit" : enemy.type === "etherCrystal" ? "shatter" : "explosion", startedAt: time, sprite: enemy.health > 0 ? undefined : destroyedSprite, debrisSize: enemy.health > 0 ? undefined : enemy.radius * 2, debrisRotation: enemy.health > 0 ? undefined : enemy.rotation, shipClass: enemy.health > 0 ? undefined : enemy.shipClass });
          soundRef.current?.play(enemy.health > 0 ? "enemyHit" : "explosion");
          if (enemy.health > 0) continue;
          state.score += enemy.points * (enemy.attackPattern !== null && enemy.attackDelay === 0 ? 2 : 1);
          state.coins += enemy.reward;
          state.destroyed += 1;
          state.asteroids = state.asteroids.filter(item => item.id !== enemy.id);
          if (enemy.attackPattern !== null) attackCooldownRef.current = 0;
          const drop = createPowerUpDrop({ id: nextIdRef.current, x: enemy.x, y: enemy.y, width, height, threats: state.asteroids, activeCount: state.powerUps.length, chanceRoll: Math.random(), kindRoll: Math.random(), destroyed: state.destroyed, dropsCreated: dropsCreatedRef.current });
          if (drop) { nextIdRef.current += 1; dropsCreatedRef.current += 1; state.powerUps.push(drop); }
        }
        state.shots = remainingShots;
        const previousPhase = state.phase;
        if (state.encounter === "boss-intro") {
          if (sectionElapsedRef.current >= SECTION_INTRO_MS) state.encounter = "boss-fight";
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
          const link = appendSectionBlock(state.chainBlocks, bonus ? state.bonusHits : 0);
          state.chainBlocks = link.blocks;
          state.bonusShards += link.shards;
          state.chainResult = link.linked ? `${t("CHAIN COMPLETE")} · +${link.shards} ${t("Shards")}` : `${t("BLOCK LINKED")} ${link.blocks}/${BLOCKS_PER_CHAIN}`;
        }
        if (bonus && state.phase === "SECTOR_CLEAR" && previousPhase !== "SECTOR_CLEAR") {
          const reward = bonusReward(state.bonusHits);
          const recoveredHeart = bonusHeartReward(state.bonusHits, state.hearts);
          state.bonusResult = `${reward.label} · +${reward.shards} SHARDS${recoveredHeart ? " · +1 HEART" : ""}${reward.powerUps.length ? ` · ${reward.powerUps.map(() => "SHIELD").join(" + ")}` : ""}`;
          state.score += reward.points;
          state.bonusShards += reward.shards;
          state.hearts = Math.min(3, state.hearts + recoveredHeart);
          for (const power of reward.powerUps) {
            state.powerInventory = storePower(state.powerInventory, power);
          }
          if (reward.powerUps.length || recoveredHeart) soundRef.current?.play("pickup");
        }
        if (state.score > bestThisDeviceRef.current) {
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
        state.effects = state.effects.filter(effect => time - effect.startedAt < (effect.kind === "hit" ? 230 : effect.kind === "boss-explosion" ? 2_350 : effect.kind === "player-explosion" ? 1_800 : effect.kind === "player-crash" || effect.kind === "explosion" || effect.kind === "shatter" ? 1_350 : 390));
        if (state.hearts === 0) {
          state.status = "destroying";
          state.enemyShots = [];
          state.shots = [];
          if (!recordsSavedRef.current) {
            saveRecords(state);
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
    const player = placePlayerFromPointer(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height, event.pointerType === "touch");
    stateRef.current.player = player;
    if (playerShipRef.current) {
      playerShipRef.current.style.left = `${player.x * 100}%`;
      playerShipRef.current.style.top = `${player.y * 100}%`;
    }
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (stateRef.current.status !== "playing" || (event.target as HTMLElement).closest("button, .game-hud, .game-overlay, .touch-controls")) return;
    if (pointerRef.current !== null) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientY - bounds.top < bounds.height * .5) return;
    if (event.pointerType === "touch" && (readControlHand() === "right" ? event.clientX - bounds.left < bounds.width * .35 : event.clientX - bounds.left > bounds.width * .65)) return;
    pointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    positionFromPointer(event);
  };

  const selectWeapon = (level: number) => {
    if (stateRef.current.status !== "playing" || level > stateRef.current.weaponCap || (level > 1 && (stateRef.current.paidWeaponMs === 0 || !stateRef.current.unlockedWeapons.includes(level)))) return;
    stateRef.current.paidWeaponLevel = level;
    stateRef.current.weaponLevel = activeWeaponLevel(level, stateRef.current.paidWeaponMs, stateRef.current.pickupWeaponLevel, stateRef.current.pickupWeaponMs, stateRef.current.weaponCap);
    setGame({ ...stateRef.current });
  };
  const activateStartPower = () => {
    const state = stateRef.current;
    if (state.status !== "playing" || !state.pendingStartPower) return;
    const power = state.pendingStartPower;
    if ((power === "shield" && state.shieldCharges > 0 && state.shieldMs > 0) || (power === "rapid" && state.rapidFireMs > 0) || (power === "overdrive" && state.overdriveMs > 0)) return;
    Object.assign(state, applyPowerUp(state, power, PURCHASED_POWER_UP_DURATION_MS));
    if (power === "shield") state.shieldActive = true;
    state.pendingStartPower = null;
    soundRef.current?.play(power === "overdrive" ? "boost" : "pickup");
    setGame({ ...state });
  };
  const activateStoredPower = (power: PowerUpType) => {
    const state = stateRef.current;
    const activeMs = power === "shield" ? (state.shieldCharges > 0 ? state.shieldMs : 0) : power === "rapid" ? state.rapidFireMs : power === "overdrive" ? state.overdriveMs : state.pickupWeaponMs;
    if (state.status !== "playing" || !canActivatePower(state.powerInventory, power, activeMs)) return;
    // A fresh charge waits until the current effect ends, preserving each pickup.
    state.powerInventory = spendPower(state.powerInventory, power);
    if (power === "weapon") {
      state.pickupWeaponLevel = Math.min(5, state.weaponLevel + 1);
      state.pickupWeaponMs = PICKUP_WEAPON_DURATION_MS;
      state.weaponCap = Math.max(state.weaponCap, state.pickupWeaponLevel);
      state.weaponLevel = activeWeaponLevel(state.paidWeaponLevel, state.paidWeaponMs, state.pickupWeaponLevel, state.pickupWeaponMs, state.weaponCap);
    } else {
      Object.assign(state, applyPowerUp(state, power, POWER_UP_DURATION_MS));
      if (power === "shield") state.shieldActive = true;
    }
    soundRef.current?.play(power === "overdrive" ? "boost" : "pickup");
    setGame({ ...state, powerInventory: { ...state.powerInventory } });
  };

  const restart = () => {
    if (gameOverTimerRef.current !== null) window.clearTimeout(gameOverTimerRef.current);
    gameOverTimerRef.current = null;
    stateRef.current = createInitialState();
    recordsSavedRef.current = false;
    scoreRunRef.current = null;
    setScoreSync("idle");
    checkpointAtRef.current = 0;
    checkpointScoreRef.current = 0;
    formationIndexRef.current = 0;
    formationStartedRef.current = false;
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
    lastPlayerRef.current = stateRef.current.player;
    lastFrameRef.current = 0;
    lastPaintRef.current = 0;
    setGame(stateRef.current);
    if (stateRef.current.status === "loading") void activateLoadout();
  };

  const goHome = () => {
    if (!recordsSavedRef.current) {
      saveRecords(stateRef.current);
      recordsSavedRef.current = true;
      submitScore(stateRef.current);
    }
    leaveGameFullscreen();
    navigate("/");
  };

  const levelLabel = String(game.sector);
  const round = sectionInSector(game.section);
  const levelComplete = game.encounter === "boss-clear" && game.phase === "SECTOR_CLEAR";
  const levelIntro = game.encounter === "normal" && game.phase === "SECTOR_INTRO" && round === 1;
  const transitionHeadline = levelComplete
    ? <><b>{t("LEVEL")} {levelLabel}</b><i>{t("COMPLETE")}</i></>
    : levelIntro
      ? `${t("LEVEL")} ${levelLabel}`
      : game.encounter !== "normal"
        ? t("WARNING · SECTOR BOSS")
        : game.phase === "SECTOR_CLEAR"
          ? isBonusSection(game.section)
            ? `${game.bonusResult.split(" · ").map((part, index) => index === 0 ? t(part) : part).join(" · ")} · ${game.bonusHits}/${BONUS_TARGET_COUNT}`
            : `${t("ROUND")} ${round} ${t("COMPLETE")}`
          : isBonusSection(game.section) ? t("BONUS CHALLENGE") : `${t("ROUND")} ${round} / 3`;

  return (
    <main className="game-shell" onPointerDownCapture={() => { void startEffects(); if (pointerRef.current === null && !document.fullscreenElement) requestGameFullscreen(); }}>
      <div ref={fieldRef} className="game-field" onPointerDown={startDrag} onPointerMove={event => { if (pointerRef.current === event.pointerId) positionFromPointer(event); }} onPointerUp={event => { if (pointerRef.current === event.pointerId) pointerRef.current = null; }} onPointerCancel={event => { if (pointerRef.current === event.pointerId) pointerRef.current = null; }}>
        <Starfield sector={game.sector} player={game.player} paused={game.status !== "playing"} />
        <SectorBackdrop sector={game.sector} player={game.player} paused={game.status !== "playing"} />
        <header ref={hudRef} className="game-hud">
          <div className="hud-actions">
            <button className="game-control home-control" type="button" disabled={game.status === "loading" || game.status === "destroying"} onClick={() => setHomePrompt(true)} aria-label={t('Go home')}>⌂ <span>{t('Home')}</span></button>
          </div>
          <div className="hud-stat score-hud"><span>{t('Score')}</span><strong>{game.score}</strong></div>
          <div className="hud-stat coin-stat"><span>{t('Coins')}</span><strong>● {game.coins}</strong></div>
          <div className={`hud-stat hearts-stat${game.effects.some(effect => effect.target === "player" && effect.kind === "hit") ? " hearts-stat-hit" : ""}`}><span>{t('Hearts')}</span><strong className="hearts" role="status" aria-live="polite" aria-label={`${game.hearts} / 3 ${t('Hearts')}`}><span className="heart-icons" aria-hidden="true">{"♥".repeat(game.hearts)}<i>{"♡".repeat(3 - game.hearts)}</i></span><small>{game.hearts}/3</small></strong></div>
          <div className="hud-stat weapon-hud"><span>{t('Weapon level')}</span><strong>{game.weaponLevel}<small>/5</small></strong></div>
          <div className="hud-stat game-level-hud"><span>{t('Game level')}</span><strong>{levelLabel}</strong></div>
          <div className="hud-stat round-hud chain-hud"><span>{t('Round')}</span><strong>{game.encounter === "normal" ? <>{round}<small>/3</small></> : "BOSS"}</strong><div className="chain-blocks" role="img" aria-label={`${t("Network chain")}: ${game.chainBlocks}/${BLOCKS_PER_CHAIN} ${t("blocks linked")}`}>{Array.from({ length: BLOCKS_PER_CHAIN }, (_, index) => <i key={index} className={index < game.chainBlocks ? "linked" : ""} />)}</div></div>
          <button className="game-control pause-control" type="button" disabled={game.status === "loading" || game.status === "destroying" || game.status === "game-over"} onClick={() => { stateRef.current.status = game.status === "paused" ? "playing" : "paused"; setGame({ ...stateRef.current }); }} aria-label={t(game.status === "paused" ? "Resume" : "Pause")}>{game.status === "paused" ? "▶" : "Ⅱ"}</button>
        </header>
        <div className="game-label">{t("LEVEL")} {levelLabel} <span>· {sectorName(game.sector)} · {game.encounter !== "normal" ? t("CORE WARDEN") : isBonusSection(game.section) ? t("BONUS CHALLENGE") : `${t("ROUND")} ${round}`}</span></div>
        {game.encounter === "normal" && isBonusSection(game.section) && game.phase !== "SECTOR_CLEAR" && <div className="bonus-counter" aria-live="polite">{t("BONUS TARGETS")} {game.bonusHits} / {BONUS_TARGET_COUNT} · {t("NO ENEMY FIRE")}</div>}
        {(game.shieldCharges > 0 || game.overdriveMs > 0 || game.rapidFireMs > 0 || game.paidWeaponMs > 0 || game.pickupWeaponMs > 0) && <div className="power-status" aria-live="polite">{game.shieldCharges > 0 && <span>{powerUpSymbols.shield} {t("SHIELD")} {t(game.shieldActive ? "ON" : "OFF")} · {game.shieldCharges} · {Math.ceil(game.shieldMs / 1_000)}s</span>}{game.overdriveMs > 0 && <span>{powerUpSymbols.overdrive} OVERDRIVE {Math.ceil(game.overdriveMs / 1_000)}s</span>}{game.rapidFireMs > 0 && <span>{powerUpSymbols.rapid} {t("RAPID")} {Math.ceil(game.rapidFireMs / 1_000)}s</span>}{game.paidWeaponMs > 0 && <span>◆ {t("BOUGHT SHOTS")} {Math.ceil(game.paidWeaponMs / 1_000)}s</span>}{game.pickupWeaponMs > 0 && <span>{powerUpSymbols.weapon} {t("PICKUP SHOTS")} {Math.ceil(game.pickupWeaponMs / 1_000)}s</span>}</div>}
        {game.status === "loading" && <div className="game-overlay"><div className="game-modal"><h1>{t('Preparing mission')}</h1><p>{t('Checking your saved hangar loadout.')}</p></div></div>}
        {game.status === "playing" && (game.phase === "SECTOR_INTRO" || game.phase === "SECTOR_CLEAR") && <div className={`sector-banner${game.phase === "SECTOR_INTRO" ? " sector-transition" : " sector-clear-message"}${levelIntro ? " level-intro-banner" : ""}${levelComplete ? " level-complete-banner" : ""}`} aria-live="polite"><span>{levelComplete || levelIntro ? sectorName(game.sector) : game.encounter !== "normal" ? `${t("LEVEL")} ${levelLabel} · ${sectorName(game.sector)}` : game.phase === "SECTOR_CLEAR" ? isBonusSection(game.section) ? t("BONUS COMPLETE") : t("ROUND COMPLETE") : `${t("LEVEL")} ${levelLabel} · ${sectorName(game.sector)}`}</span><strong>{transitionHeadline}</strong>{game.phase === "SECTOR_INTRO" && game.encounter === "normal" && isBonusSection(game.section) && <small>{t("HIT THE FLYING TARGETS")}</small>}{game.phase === "SECTOR_CLEAR" && game.encounter === "normal" && <small className="chain-result">{game.chainResult}</small>}</div>}
        {game.status === "playing" && game.encounter === "normal" && !isBonusSection(game.section) && !formationStartedRef.current && (game.phase === "SECTOR_INTRO" || game.phase === "ENTRY" || game.phase === "FORMATION") && <div className="formation-data-stream" aria-hidden="true">{FORMATION_DATA_ROWS.map((row, index) => <div className="formation-data-row" key={index}><span>{row.repeat(4)}</span><span>{row.repeat(4)}</span></div>)}</div>}
        {game.encounter === "normal" && !isBonusSection(game.section) && (game.phase === "ENTRY" || game.phase === "FORMATION" || game.phase === "REFORM") && game.asteroids.map(asteroid => { const locked = asteroid.entryElapsed >= asteroid.entryDuration && asteroid.formationElapsed >= asteroid.formationDuration; return <div key={`formation-${asteroid.id}`} className={`formation-target${locked ? " formation-target-locked" : ""}`} style={{ left: asteroid.entryTargetX, top: asteroid.entryTargetY, width: asteroid.radius * 1.65, height: asteroid.radius * 1.65 }} aria-hidden="true"><span /></div>; })}
        {game.boss && game.encounter === "boss-fight" && <div className={`asteroid cryptoid cryptoid-heavy cryptoid-bitrock sector-boss cryptoid-cruise${game.boss.fireElapsed >= bossFireInterval(game.boss, game.sector) - 550 ? " boss-warning" : ""}${game.boss.health <= game.boss.maxHealth / 2 ? " boss-enraged cryptoid-boost" : ""}`} style={{ left: game.boss.x, top: game.boss.y, transform: "translate(-50%, -50%)", ...shipHullStyle(19, true) }} title={`${t("CORE WARDEN")} · ${t("Sector")} boss`}><div className="ship-visual"><div className="fleet-sprite" style={spriteStyle(19)} />{bossEngineTrails()}</div><span className="health-bar"><b style={{ width: `${game.boss.health / game.boss.maxHealth * 100}%` }} /></span></div>}
        {game.bonusTargets.map(target => <div key={target.id} className="asteroid asteroid-small cryptoid bonus-ship cryptoid-boost" style={{ ...alignedSpritePosition(target.x, target.y, target.sprite, 50), transform: "translate(-50%, -50%)" }}><div className="ship-visual"><PaintedShip className="fleet-sprite" sprite={target.sprite} color={target.color} />{engineTrails(target.sprite, "exhaust")}</div></div>)}
        {game.asteroids.map(asteroid => { const sprite = enemySprite(asteroid.shipClass, asteroid.formationSlot); return <div key={asteroid.id} className={`asteroid asteroid-${asteroid.size} cryptoid cryptoid-${asteroid.type} cryptoid-${asteroid.shipClass}${asteroid.attackPattern !== null && asteroid.attackDelay > 0 ? " asteroid-preparing" : ""}${asteroid.cloaked ? " cryptoid-cloaked" : ""}${cryptoidMotionClass(asteroid)}`} title={`${cryptoidDisplayName[asteroid.type]} · ${asteroid.shipClass} · ${asteroid.faction}`} style={{ ...alignedSpritePosition(asteroid.x, asteroid.y, sprite, asteroid.radius * 2), transform: `translate(-50%, -50%) rotate(${asteroid.rotation}deg)`, ...shipHullStyle(sprite, true) }}><div className="ship-visual"><div className="fleet-sprite" style={spriteStyle(sprite)} />{engineTrails(sprite, "exhaust")}</div><span className="health-bar"><b style={{ width: `${asteroid.health / asteroid.maxHealth * 100}%` }} /></span></div>; })}
        {game.powerUps.map(pickup => {
          const pickupLabel = `${t(powerUpNames[pickup.type])} · ${t(powerUpDescriptions[pickup.type])}`;
          return <div key={pickup.id} className={`power-up power-up-${pickup.type}`} role="img" aria-label={pickupLabel} title={pickupLabel} style={{ left: pickup.x, top: pickup.y }}><span aria-hidden="true">{powerUpSymbols[pickup.type]}</span></div>;
        })}
        {game.shots.map(shot => <div key={shot.id} className={`player-laser${shot.empowered ? " player-laser-overdrive" : ""}`} style={{ left: shot.x, top: shot.y }} />)}
        {game.enemyShots.map(shot => <div key={shot.id} className="enemy-laser" style={{ left: shot.x, top: shot.y }} />)}
        {game.effects.map(effect => <div key={effect.id} className={`impact-effect ${effect.kind}`} style={{ left: effect.x, top: effect.y }}><span />{bossFireBursts(effect)}{shipDebris(effect)}</div>)}
        {game.hearts > 0 && <div ref={playerShipRef} className={`player-ship${shipSelection.color.id === "grey" || shipSelection.color.id === "white" ? ` player-ship-${shipSelection.color.id}` : ""}${game.shieldActive && game.shieldCharges > 0 && game.shieldMs > 0 ? " player-ship-shield-active" : ""}${game.effects.some(effect => effect.target === "player" && effect.kind === "player-crash") ? " player-ship-respawn" : ""}${game.effects.some(effect => effect.target === "player" && effect.kind === "shield") ? " player-ship-shielded" : ""}`} style={{ left: `${game.player.x * 100}%`, top: `${game.player.y * 100}%`, "--ship-glow": shipSelection.color.glow, "--flame-length": `${5 + game.thrust * 13}%` } as CSSProperties} aria-label={t('Your Cryptoid ship')}><div className="ship-visual"><PaintedShip className="fleet-sprite" sprite={shipSelection.skin.sprite} color={shipSelection.color.id} />{engineTrails(shipSelection.skin.sprite, "player-engine")}</div></div>}
        <div className="game-tip">← → ↑ ↓ / {t("THUMB CONTROLS")} · {t("Auto fire")}</div>
        <div className={`touch-controls touch-controls-${readControlHand()}`}>
          <div className="edge-actions" role="group" aria-label={t('Available equipment')}>
            {(["shield", "overdrive", "rapid", "weapon"] as const).map(power => game.powerInventory[power] > 0 && <button key={power} type="button" className={`edge-action edge-action-${power}`} disabled={game.status !== "playing" || (power === "shield" && game.shieldCharges > 0 && game.shieldMs > 0) || (power === "overdrive" && game.overdriveMs > 0) || (power === "rapid" && game.rapidFireMs > 0) || (power === "weapon" && game.pickupWeaponMs > 0)} aria-label={`${t('Activate')} ${t(powerUpNames[power])} · ${game.powerInventory[power]}`} title={`${t(powerUpNames[power])} · ${game.powerInventory[power]}`} onClick={() => activateStoredPower(power)}>{powerUpSymbols[power]}<small>×{game.powerInventory[power]}</small></button>)}
            {game.pendingStartPower && <button type="button" className={`edge-action edge-action-${game.pendingStartPower}`} disabled={game.status !== "playing" || (game.pendingStartPower === "shield" && game.shieldCharges > 0 && game.shieldMs > 0) || (game.pendingStartPower === "rapid" && game.rapidFireMs > 0) || (game.pendingStartPower === "overdrive" && game.overdriveMs > 0)} title={`Activate ${t(powerUpNames[game.pendingStartPower])} · 60s`} aria-label={`Activate ${t(powerUpNames[game.pendingStartPower])} for 60 seconds`} onClick={activateStartPower}>{powerUpSymbols[game.pendingStartPower]}<small>60s</small></button>}
            {game.paidWeaponMs > 0 && <>
              <button type="button" className="edge-action edge-action-weapon" title={t("Single laser")} aria-label={t("Select single laser")} aria-pressed={game.paidWeaponLevel === 1} onClick={() => selectWeapon(1)}>Ⅰ</button>
              {game.unlockedWeapons.filter(level => level > 1 && level <= game.weaponCap).sort((a, b) => a - b).map(level => <button type="button" key={level} className="edge-action edge-action-weapon" title={`${level === 2 ? "Twin" : level === 3 ? "Rapid Twin" : level === 4 ? "Triple" : "Plasma"} · ${Math.ceil(game.paidWeaponMs / 1_000)}s`} aria-label={`Select ${level === 2 ? "Twin" : level === 3 ? "Rapid Twin" : level === 4 ? "Triple" : "Plasma"}`} aria-pressed={game.paidWeaponLevel === level} onClick={() => selectWeapon(level)}>{["", "", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"][level]}</button>)}
            </>}
            {game.pickupWeaponMs > 0 && <span className="edge-action edge-action-pickup" title={`${t("Collected shots")} · ${Math.ceil(game.pickupWeaponMs / 1_000)}s`} aria-label={`${t("Collected shots")} ${Math.ceil(game.pickupWeaponMs / 1_000)} ${t("seconds remaining")}`}>{powerUpSymbols.weapon}<small>{Math.ceil(game.pickupWeaponMs / 1_000)}s</small></span>}
            {game.shieldCharges > 0 && <span className="edge-action edge-action-shield" aria-label={`${t("Shield")} · ${Math.ceil(game.shieldMs / 1_000)} ${t("seconds remaining")}`}>{powerUpSymbols.shield}<small>{Math.ceil(game.shieldMs / 1_000)}s</small></span>}
            {game.rapidFireMs > 0 && <span className="edge-action edge-action-rapid" aria-label={`Rapid Fire ${Math.ceil(game.rapidFireMs / 1_000)} ${t("seconds remaining")}`}>{powerUpSymbols.rapid}<small>{Math.ceil(game.rapidFireMs / 1_000)}s</small></span>}
            {game.overdriveMs > 0 && <span className="edge-action edge-action-overdrive" aria-label={`Overdrive ${Math.ceil(game.overdriveMs / 1_000)} ${t("seconds remaining")}`}>{powerUpSymbols.overdrive}<small>{Math.ceil(game.overdriveMs / 1_000)}s</small></span>}
          </div>
        </div>
        {game.status === "paused" && <div className="game-overlay"><div className="game-modal"><p className="eyebrow">{t('MISSION PAUSED')}</p><h1>{t('Hold the line.')}</h1><p>{t('The asteroids are waiting.')}</p><button className="button button-primary" type="button" onClick={() => { stateRef.current.status = "playing"; setGame({ ...stateRef.current }); }}>Resume mission <span>▶</span></button></div></div>}
        {game.status === "game-over" && <div className="game-overlay game-over-overlay"><div className="game-modal game-over-modal"><h1>GAME OVER</h1><div className="game-over-details"><p className="eyebrow">{t('MISSION COMPLETE')}</p><p className="game-over-hearts">{t('Hearts')}: {game.hearts}/3</p><div className="game-over-stats"><span><b>{game.score}</b>{t('Score')}</span><span><b>{game.destroyed}</b>{t('Destroyed')}</span><span><b>{game.sector}</b>{t('Sector')}</span></div>{scoreSync !== "idle" && <p role="status">{t(scoreSync === "saving" ? "Saving personal best…" : scoreSync === "saved" ? "Personal best saved." : "Could not sync personal best. Local best is saved.")}</p>}<div className="modal-actions"><button className="button button-primary" type="button" onClick={restart}>{t("Play Again")} <span>↗</span></button><button className="button button-secondary" type="button" onClick={goHome}>{t('Home')}</button></div></div></div></div>}
        {homePrompt && <div className="game-overlay"><div className="game-modal"><p className="eyebrow">{t('LEAVE MISSION?')}</p><h2>{t('Return to base?')}</h2><p>{t('Your current round will end. Your records will be saved locally.')}</p><div className="modal-actions"><button className="button button-primary" type="button" onClick={goHome}>{t('Leave game')}</button><button className="button button-secondary" type="button" onClick={() => setHomePrompt(false)}>{t('Keep playing')}</button></div></div></div>}
      </div>
    </main>
  );
};

export { BEST_SCORE_KEY, HIGHEST_SECTOR_KEY, TOTAL_DESTROYED_KEY };
export default GamePage;
