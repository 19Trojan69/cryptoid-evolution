import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { attackDuration, attackGroupSize, attackPosition, chooseAttackPattern, type AttackPattern } from "./attackPatterns";
import { ENTRY_GAP_MS, SECTION_CLEAR_MS, SECTION_INTRO_MS, formationLayout, sectionInSector, sectionPhase, sectorForSection, sectorName, type SectorPhase } from "./sectorManager";
import { chooseCryptoid, cryptoidDisplayName, isGhostCloaked, type CryptoidClass, type CryptoidType, type FactionCode } from "./cryptoidRoster";
import { collectPowerUp as applyPowerUp, createPowerUpDrop, movePowerUps, powerUpNames, powerUpSymbols, receiveImpacts, type PowerUp } from "./powerUps";
import { advanceShot, FIRE_INTERVAL_MS, MAX_PLAYER_SHOTS, movePlayer, placePlayer, shipHitsEnemy, shotHitsEnemy, type PlayerPosition, type PlayerShot } from "./playerCombat";
import { advanceEnemyShot, createEnemyShot, enemyShotHitsPlayer, enemyShotLimit, type EnemyShot } from "./enemyFire";
import SectorBackdrop from "./SectorBackdrop";

const BEST_SCORE_KEY = "cryptoid_best_score";
const HIGHEST_SECTOR_KEY = "cryptoid_highest_sector";
const TOTAL_DESTROYED_KEY = "cryptoid_total_destroyed";
const RETURN_DURATION_MS = 3_500;
const IMPACT_COOLDOWN_MS = 1_500;

type AsteroidSize = "small" | "medium" | "large";
type GameStatus = "playing" | "paused" | "game-over";

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
};

type Effect = { id: number; x: number; y: number; kind: "hit" | "explosion" | "shatter"; startedAt: number };
type GameState = { asteroids: Asteroid[]; shots: PlayerShot[]; enemyShots: EnemyShot[]; player: PlayerPosition; effects: Effect[]; powerUps: PowerUp[]; score: number; coins: number; hearts: number; shieldCharges: number; overdriveMs: number; destroyed: number; sector: number; section: number; phase: SectorPhase; status: GameStatus };

const createInitialState = (): GameState => ({ asteroids: [], shots: [], enemyShots: [], player: { x: .5, y: .86 }, effects: [], powerUps: [], score: 0, coins: 30, hearts: 3, shieldCharges: 0, overdriveMs: 0, destroyed: 0, sector: 1, section: 1, phase: "SECTOR_INTRO", status: "playing" });

const readRecord = (key: string) => Number(window.localStorage.getItem(key) || 0);

const saveRecords = (state: GameState) => {
  window.localStorage.setItem(BEST_SCORE_KEY, String(Math.max(readRecord(BEST_SCORE_KEY), state.score)));
  window.localStorage.setItem(HIGHEST_SECTOR_KEY, String(Math.max(readRecord(HIGHEST_SECTOR_KEY), state.sector)));
  window.localStorage.setItem(TOTAL_DESTROYED_KEY, String(readRecord(TOTAL_DESTROYED_KEY) + state.destroyed));
};

const spawnAsteroid = (id: number, width: number, formationIndex: number, sector: number, slots: ReturnType<typeof formationLayout>): Asteroid => {
  const profile = chooseCryptoid(sector, formationIndex);
  const size: AsteroidSize = profile.radius === 25 ? "small" : profile.radius === 36 ? "medium" : "large";
  const target = slots[formationIndex];
  const entrySide = target.entrySide;
  const availableWidth = Math.max(1, width - profile.radius * 2);
  const entryStartX = entrySide === 1 ? profile.radius + availableWidth * 0.08 : width - profile.radius - availableWidth * 0.08;
  return { id, x: entryStartX, y: -profile.radius, size, ...profile, health: profile.health, maxHealth: profile.health, cloaked: false, rotation: 0, rotationSpeed: 0, entryElapsed: 0, entryStartX, entryTargetX: target.x, entryTargetY: target.y, entrySide, formationSlot: target.index, formationSlotCount: slots.length, formationElapsed: 0, formationDuration: 1_200, attackPattern: null, attackDelay: 0, attackLane: 0, attackElapsed: 0, returnElapsed: 0, firedThisAttack: false };
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
      return { ...asteroid, x: keepInField(asteroid.entryTargetX), y: asteroid.entryTargetY, formationElapsed: 0, attackPattern: null, attackDelay: 0, attackLane: 0, attackElapsed: 0, returnElapsed: 0, firedThisAttack: false, rotation };
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
    y: -radius + (asteroid.entryTargetY + radius) * progress,
    entryElapsed: elapsed,
    formationElapsed: delta - entryDelta,
    rotation,
  };
};

const GamePage = () => {
  const navigate = useNavigate();
  const fieldRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const nextIdRef = useRef(1);
  const formationIndexRef = useRef(0);
  const sectionSlotsRef = useRef<ReturnType<typeof formationLayout> | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
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
  const [game, setGame] = useState<GameState>(createInitialState);
  const [homePrompt, setHomePrompt] = useState(false);
  const recordsSavedRef = useRef(false);

  useEffect(() => {
    const controls = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "KeyD", "KeyW", "KeyS"]);
    const keyDown = (event: KeyboardEvent) => {
      if (!controls.has(event.code) || (event.target as HTMLElement)?.closest("input, textarea, select")) return;
      event.preventDefault();
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
        const keys = keysRef.current;
        const horizontal = Number(keys.has("ArrowRight") || keys.has("KeyD")) - Number(keys.has("ArrowLeft") || keys.has("KeyA"));
        const vertical = Number(keys.has("ArrowDown") || keys.has("KeyS")) - Number(keys.has("ArrowUp") || keys.has("KeyW"));
        if (horizontal || vertical) state.player = movePlayer(state.player, horizontal, vertical, delta, width, height);
        elapsedRef.current += delta;
        impactCooldownRef.current = Math.max(0, impactCooldownRef.current - delta);
        state.overdriveMs = Math.max(0, state.overdriveMs - delta);
        sectionElapsedRef.current += delta;
        const slots = sectionSlotsRef.current ?? formationLayout(state.section, width, height);
        sectionSlotsRef.current = slots;
        if (state.phase === "SECTOR_CLEAR") {
          clearTimerRef.current += delta;
          if (clearTimerRef.current >= SECTION_CLEAR_MS) {
            state.section += 1;
            state.sector = sectorForSection(state.section);
            state.phase = "SECTOR_INTRO";
            state.asteroids = [];
            state.shots = [];
            state.enemyShots = [];
            state.effects = [];
            formationIndexRef.current = 0;
            sectionSlotsRef.current = formationLayout(state.section, width, height);
            spawnTimerRef.current = 0;
            sectionElapsedRef.current = 0;
            clearTimerRef.current = 0;
            attackCooldownRef.current = 0;
          }
        }
        if (sectionElapsedRef.current >= SECTION_INTRO_MS && state.phase !== "SECTOR_CLEAR" && formationIndexRef.current < slots.length) {
          spawnTimerRef.current += delta;
          if (spawnTimerRef.current >= ENTRY_GAP_MS) {
            spawnTimerRef.current -= ENTRY_GAP_MS;
            state.asteroids.push(spawnAsteroid(nextIdRef.current++, width, formationIndexRef.current++, state.sector, slots));
          }
        }
        attackCooldownRef.current += delta;
        if (formationIndexRef.current === slots.length && state.asteroids.length > 0 && !state.asteroids.some(asteroid => asteroid.attackPattern !== null) && attackCooldownRef.current >= 1_350) {
          const ready = state.asteroids.filter(asteroid => asteroid.entryElapsed >= asteroid.entryDuration && asteroid.formationElapsed >= asteroid.formationDuration);
          if (ready.length === state.asteroids.length) {
            let pattern = chooseAttackPattern(attackNumberRef.current++, elapsedRef.current);
            if (ready.length < attackGroupSize(pattern)) pattern = "curve";
            const groupSize = attackGroupSize(pattern);
            const selectedIds = ready.slice(0, groupSize).map(asteroid => asteroid.id);
            state.asteroids = state.asteroids.map(asteroid => {
              const index = selectedIds.indexOf(asteroid.id);
              if (index < 0) return asteroid;
              const groupDelay = pattern === "double" ? index * 350 : pattern === "vDive" ? index * 180 : 0;
              return { ...asteroid, attackPattern: pattern, attackDelay: 650 + groupDelay, attackLane: index - (groupSize - 1) / 2, firedThisAttack: false };
            });
            attackCooldownRef.current = 0;
          }
        }
        const nextAsteroids: Asteroid[] = [];
        let heartsLost = 0;
        state.asteroids.forEach(asteroid => {
          let next = moveAsteroid(asteroid, delta, width, height);
          if (asteroid.attackPattern !== null && next.attackPattern === null) attackCooldownRef.current = 0;
          if (next.attackPattern !== null && next.attackDelay === 0 && !next.firedThisAttack && next.attackElapsed < attackTime(next) && next.attackElapsed >= attackTime(next) * .28 && state.enemyShots.length < enemyShotLimit(width, elapsedRef.current)) {
            const bullet = createEnemyShot(nextIdRef.current, next.x, next.y + next.radius * .4, state.player, width, height);
            if (bullet) {
              nextIdRef.current += 1;
              state.enemyShots.push(bullet);
              next = { ...next, firedThisAttack: true };
            }
          }
          if (next.attackPattern !== null && next.attackDelay === 0 && !next.cloaked && shipHitsEnemy(state.player, width, height, next) && impactCooldownRef.current === 0) {
            heartsLost += 1;
            impactCooldownRef.current = IMPACT_COOLDOWN_MS;
            state.effects.push({ id: nextIdRef.current++, x: state.player.x * width, y: state.player.y * height, kind: "hit", startedAt: time });
          }
          if (next.y >= -next.radius) nextAsteroids.push({ ...next, cloaked: isGhostCloaked(next.type, next.attackPattern === null && next.entryElapsed >= next.entryDuration && next.formationElapsed >= next.formationDuration, elapsedRef.current) });
        });
        state.asteroids = nextAsteroids;
        const incomingShots: EnemyShot[] = [];
        for (const shot of state.enemyShots) {
          const moved = advanceEnemyShot(shot, delta);
          if (moved.y > height + 12 || moved.x < -12 || moved.x > width + 12) continue;
          if (enemyShotHitsPlayer(moved, state.player, width, height)) {
            if (impactCooldownRef.current === 0) {
              heartsLost += 1;
              impactCooldownRef.current = IMPACT_COOLDOWN_MS;
              state.effects.push({ id: nextIdRef.current++, x: state.player.x * width, y: state.player.y * height, kind: "hit", startedAt: time });
            }
            continue;
          }
          incomingShots.push(moved);
        }
        state.enemyShots = incomingShots;
        Object.assign(state, receiveImpacts(state, heartsLost));
        state.powerUps = movePowerUps(state.powerUps, delta, height);
        state.powerUps = state.powerUps.filter(pickup => {
          if (Math.hypot(pickup.x - state.player.x * width, pickup.y - state.player.y * height) > 34) return true;
          Object.assign(state, applyPowerUp(state, pickup.type));
          return false;
        });
        fireTimerRef.current += delta;
        if (fireTimerRef.current >= FIRE_INTERVAL_MS) {
          fireTimerRef.current %= FIRE_INTERVAL_MS;
          if (state.shots.length < MAX_PLAYER_SHOTS) state.shots.push({ id: nextIdRef.current++, x: state.player.x * width, y: state.player.y * height - 23, speedX: 0, damage: state.overdriveMs > 0 ? 2 : 1, empowered: state.overdriveMs > 0 });
        }
        const remainingShots: PlayerShot[] = [];
        for (const previous of state.shots) {
          const shot = advanceShot(previous, delta);
          if (shot.y < -10) continue;
          const enemy = state.asteroids.find(item => shotHitsEnemy(shot, item));
          if (!enemy) { remainingShots.push(shot); continue; }
          enemy.health = Math.max(0, enemy.health - shot.damage);
          state.effects.push({ id: nextIdRef.current++, x: enemy.x, y: enemy.y, kind: enemy.health > 0 ? "hit" : enemy.type === "etherCrystal" ? "shatter" : "explosion", startedAt: time });
          if (enemy.health > 0) continue;
          state.score += enemy.points * (enemy.attackPattern !== null && enemy.attackDelay === 0 ? 2 : 1);
          state.coins += enemy.reward;
          state.destroyed += 1;
          state.asteroids = state.asteroids.filter(item => item.id !== enemy.id);
          if (enemy.attackPattern !== null) attackCooldownRef.current = 0;
          const drop = createPowerUpDrop({ id: nextIdRef.current, x: enemy.x, y: enemy.y, width, height, hearts: state.hearts, threats: state.asteroids, activeCount: state.powerUps.length, chanceRoll: Math.random(), kindRoll: Math.random(), destroyed: state.destroyed, dropsCreated: dropsCreatedRef.current });
          if (drop) { nextIdRef.current += 1; dropsCreatedRef.current += 1; state.powerUps.push(drop); }
        }
        state.shots = remainingShots;
        state.phase = sectionPhase({ introMs: sectionElapsedRef.current, spawned: formationIndexRef.current, total: (sectionSlotsRef.current ?? slots).length, alive: state.asteroids.length, ready: state.asteroids.filter(asteroid => asteroid.entryElapsed >= asteroid.entryDuration && (asteroid.formationElapsed >= asteroid.formationDuration || asteroid.attackPattern !== null)).length, returning: state.asteroids.some(asteroid => asteroid.attackPattern !== null && asteroid.attackElapsed >= attackTime(asteroid)), attacking: state.asteroids.some(asteroid => asteroid.attackPattern !== null) });
        if (state.phase === "SECTOR_CLEAR") state.enemyShots = [];
        state.effects = state.effects.filter(effect => time - effect.startedAt < (effect.kind === "hit" ? 230 : 430));
        if (state.hearts === 0) {
          state.status = "game-over";
          if (!recordsSavedRef.current) {
            saveRecords(state);
            recordsSavedRef.current = true;
          }
        }
        setGame({ ...state, asteroids: [...state.asteroids], shots: [...state.shots], enemyShots: [...state.enemyShots], effects: [...state.effects], powerUps: [...state.powerUps] });
      }
      animationRef.current = window.requestAnimationFrame(loop);
    };
    animationRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
  }, []);

  const positionFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const field = fieldRef.current;
    if (!field) return;
    const bounds = field.getBoundingClientRect();
    stateRef.current.player = placePlayer(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height);
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (stateRef.current.status !== "playing" || (event.target as HTMLElement).closest("button, .game-hud, .game-overlay")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientY - bounds.top < bounds.height * .6) return;
    pointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    positionFromPointer(event);
  };

  const restart = () => {
    stateRef.current = createInitialState();
    recordsSavedRef.current = false;
    formationIndexRef.current = 0;
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
    pointerRef.current = null;
    lastFrameRef.current = 0;
    setGame(stateRef.current);
  };

  const goHome = () => {
    if (!recordsSavedRef.current) {
      saveRecords(stateRef.current);
      recordsSavedRef.current = true;
    }
    navigate("/");
  };

  return (
    <main className="game-shell">
      <div ref={fieldRef} className="game-field" onPointerDown={startDrag} onPointerMove={event => { if (pointerRef.current === event.pointerId) positionFromPointer(event); }} onPointerUp={event => { if (pointerRef.current === event.pointerId) pointerRef.current = null; }} onPointerCancel={event => { if (pointerRef.current === event.pointerId) pointerRef.current = null; }}>
        <div className="star-layer star-layer-one" /><div className="star-layer star-layer-two" />
        <SectorBackdrop sector={game.sector} player={game.player} />
        <header className="game-hud">
          <button className="game-control home-control" type="button" onClick={() => setHomePrompt(true)} aria-label="Go home">⌂ <span>Home</span></button>
          <div className="hud-stat"><span>Score</span><strong>{game.score}</strong></div>
          <div className="hud-stat coin-stat"><span>Coins</span><strong>● {game.coins}</strong></div>
          <div className="hud-stat"><span>Hearts</span><strong className="hearts">{"♥".repeat(game.hearts)}<i>{"♥".repeat(3 - game.hearts)}</i></strong></div>
          <div className="hud-stat"><span>Sector</span><strong>{String(game.sector).padStart(2, "0")}</strong></div>
          <div className="hud-stat"><span>Section</span><strong>{sectionInSector(game.section)} / 3</strong></div>
          <button className="game-control pause-control" type="button" onClick={() => { stateRef.current.status = game.status === "paused" ? "playing" : "paused"; setGame({ ...stateRef.current }); }} aria-label={game.status === "paused" ? "Resume" : "Pause"}>{game.status === "paused" ? "▶" : "Ⅱ"}</button>
        </header>
        <div className="game-label">SECTOR {String(game.sector).padStart(2, "0")} <span>· {sectorName(game.sector)} · SECTION {sectionInSector(game.section)}</span></div>
        {(game.shieldCharges > 0 || game.overdriveMs > 0) && <div className="power-status" aria-live="polite">{game.shieldCharges > 0 && <span>◇ SHIELD {game.shieldCharges}</span>}{game.overdriveMs > 0 && <span>ϟ OVERDRIVE {Math.ceil(game.overdriveMs / 1_000)}s</span>}</div>}
        {game.status === "playing" && (game.phase === "SECTOR_INTRO" || game.phase === "SECTOR_CLEAR") && <div className="sector-banner" aria-live="polite"><span>{game.phase === "SECTOR_CLEAR" ? "SECTION CLEAR" : `SECTOR ${String(game.sector).padStart(2, "0")}`}</span><strong>{game.phase === "SECTOR_CLEAR" ? `SECTION ${sectionInSector(game.section)} COMPLETE` : sectorName(game.sector)}</strong></div>}
        {game.asteroids.map(asteroid => <div key={asteroid.id} className={`asteroid asteroid-${asteroid.size} cryptoid cryptoid-${asteroid.type} cryptoid-${asteroid.shipClass}${asteroid.attackPattern !== null && asteroid.attackDelay > 0 ? " asteroid-preparing" : ""}${asteroid.cloaked ? " cryptoid-cloaked" : ""}`} title={`${cryptoidDisplayName[asteroid.type]} · ${asteroid.shipClass} · ${asteroid.faction}`} style={{ left: asteroid.x, top: asteroid.y, transform: `translate(-50%, -50%) rotate(${asteroid.rotation}deg)` }}><i className="ship-engine ship-engine-left" /><i className="ship-engine ship-engine-right" /><div className="asteroid-shape" /><i className="ship-cockpit" /><span className="cryptoid-core"><b>{asteroid.faction}</b></span><span className="health-bar"><b style={{ width: `${(asteroid.health / asteroid.maxHealth) * 100}%` }} /></span></div>)}
        {game.powerUps.map(pickup => <div key={pickup.id} className={`power-up power-up-${pickup.type}`} title={powerUpNames[pickup.type]} style={{ left: pickup.x, top: pickup.y }}><span>{powerUpSymbols[pickup.type]}</span></div>)}
        {game.shots.map(shot => <div key={shot.id} className={`player-laser${shot.empowered ? " player-laser-overdrive" : ""}`} style={{ left: shot.x, top: shot.y }} />)}
        {game.enemyShots.map(shot => <div key={shot.id} className="enemy-laser" style={{ left: shot.x, top: shot.y }} />)}
        {game.effects.map(effect => <div key={effect.id} className={`impact-effect ${effect.kind}`} style={{ left: effect.x, top: effect.y }}><span /></div>)}
        <div className="player-ship" style={{ left: `${game.player.x * 100}%`, top: `${game.player.y * 100}%` }} aria-label="Your Cryptoid ship"><div className="player-wing" /><div className="player-hull" /><div className="player-core">π</div><div className="player-engine player-engine-left" /><div className="player-engine player-engine-right" /></div>
        <div className="game-tip">← → ↑ ↓ / drag to move · Auto fire</div>
        {game.status === "paused" && <div className="game-overlay"><div className="game-modal"><p className="eyebrow">MISSION PAUSED</p><h1>Hold the line.</h1><p>The asteroids are waiting.</p><button className="button button-primary" type="button" onClick={() => { stateRef.current.status = "playing"; setGame({ ...stateRef.current }); }}>Resume mission <span>▶</span></button></div></div>}
        {game.status === "game-over" && <div className="game-overlay"><div className="game-modal game-over-modal"><p className="eyebrow">MISSION COMPLETE</p><h1>Game Over</h1><div className="game-over-stats"><span><b>{game.score}</b>Score</span><span><b>{game.destroyed}</b>Destroyed</span><span><b>{game.sector}</b>Sector</span></div><div className="modal-actions"><button className="button button-primary" type="button" onClick={restart}>Play Again <span>↗</span></button><button className="button button-secondary" type="button" onClick={goHome}>Home</button></div></div></div>}
        {homePrompt && <div className="game-overlay"><div className="game-modal"><p className="eyebrow">LEAVE MISSION?</p><h2>Return to base?</h2><p>Your current round will end. Your records will be saved locally.</p><div className="modal-actions"><button className="button button-primary" type="button" onClick={goHome}>Leave game</button><button className="button button-secondary" type="button" onClick={() => setHomePrompt(false)}>Keep playing</button></div></div></div>}
      </div>
    </main>
  );
};

export { BEST_SCORE_KEY, HIGHEST_SECTOR_KEY, TOTAL_DESTROYED_KEY };
export default GamePage;
