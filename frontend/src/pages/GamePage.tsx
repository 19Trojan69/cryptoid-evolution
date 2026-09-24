import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";

const BEST_SCORE_KEY = "cryptoid_best_score";
const HIGHEST_WAVE_KEY = "cryptoid_highest_wave";
const TOTAL_DESTROYED_KEY = "cryptoid_total_destroyed";
const WAVE_DURATION_MS = 60_000;
const INITIAL_SPAWN_INTERVAL_MS = 2_500;
const MIN_SPAWN_INTERVAL_MS = 1_800;
const ENTRY_DURATION_MS = 7_000;
const ATTACK_DURATION_MS = 5_000;
const RETURN_DURATION_MS = 3_500;

type AsteroidSize = "small" | "medium" | "large";
type GameStatus = "playing" | "paused" | "game-over";

type Asteroid = {
  id: number;
  x: number;
  y: number;
  size: AsteroidSize;
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
  attackElapsed: number;
  returnElapsed: number;
};

type Shot = { id: number; x: number; y: number; targetX: number; targetY: number; progress: number };
type Effect = { id: number; x: number; y: number; kind: "hit" | "explosion"; startedAt: number };
type GameState = { asteroids: Asteroid[]; shots: Shot[]; effects: Effect[]; score: number; coins: number; hearts: number; destroyed: number; wave: number; status: GameStatus };

const sizeData: Record<AsteroidSize, { health: number; reward: number; points: number; radius: number }> = {
  small: { health: 1, reward: 2, points: 10, radius: 25 },
  medium: { health: 2, reward: 4, points: 25, radius: 36 },
  large: { health: 3, reward: 7, points: 50, radius: 50 },
};

const createInitialState = (): GameState => ({ asteroids: [], shots: [], effects: [], score: 0, coins: 30, hearts: 3, destroyed: 0, wave: 1, status: "playing" });

const readRecord = (key: string) => Number(window.localStorage.getItem(key) || 0);

const saveRecords = (state: GameState) => {
  window.localStorage.setItem(BEST_SCORE_KEY, String(Math.max(readRecord(BEST_SCORE_KEY), state.score)));
  window.localStorage.setItem(HIGHEST_WAVE_KEY, String(Math.max(readRecord(HIGHEST_WAVE_KEY), state.wave)));
  window.localStorage.setItem(TOTAL_DESTROYED_KEY, String(readRecord(TOTAL_DESTROYED_KEY) + state.destroyed));
};

const formationTarget = (index: number, width: number, height: number, radius: number, spawnInterval: number) => {
  const compact = width < 620;
  const slotOrder = compact ? [1, 0, 2] : [2, 1, 3, 0, 4];
  const offset = slotOrder[index % slotOrder.length] - (slotOrder.length - 1) / 2;
  const x = width * (0.5 + offset * (compact ? 0.29 : 0.15));
  return {
    x: Math.max(radius, Math.min(width - radius, x)),
    y: height * ((compact ? 0.3 : 0.28) + Math.abs(offset) * (compact ? 0.095 : 0.055)),
    duration: spawnInterval * (slotOrder.length - 1) + 5_000,
    slot: index % slotOrder.length,
    slotCount: slotOrder.length,
  };
};

const spawnAsteroid = (id: number, width: number, height: number, formationIndex: number, spawnInterval: number): Asteroid => {
  const roll = Math.random();
  const size: AsteroidSize = roll < 0.56 ? "small" : roll < 0.86 ? "medium" : "large";
  const data = sizeData[size];
  const entrySide = id % 2 === 0 ? 1 : -1;
  const availableWidth = Math.max(1, width - data.radius * 2);
  const entryStartX = entrySide === 1 ? data.radius + availableWidth * 0.08 : width - data.radius - availableWidth * 0.08;
  const target = formationTarget(formationIndex, width, height, data.radius, spawnInterval);
  return { id, x: entryStartX, y: -data.radius, size, health: data.health, maxHealth: data.health, rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 0.08, entryElapsed: 0, entryStartX, entryTargetX: target.x, entryTargetY: target.y, entrySide, formationSlot: target.slot, formationSlotCount: target.slotCount, formationElapsed: 0, formationDuration: target.duration, attackElapsed: 0, returnElapsed: 0 };
};

const moveAsteroid = (asteroid: Asteroid, delta: number, width: number, height: number, canLaunch: boolean): Asteroid => {
  const rotation = asteroid.rotation + asteroid.rotationSpeed * delta;
  const radius = sizeData[asteroid.size].radius;
  const keepInField = (x: number) => Math.max(radius, Math.min(width - radius, x));
  const diveEndX = asteroid.entryTargetX + (width / 2 - asteroid.entryTargetX) * 0.45;
  const diveEndY = height - 75 + radius;
  if (asteroid.entryElapsed >= ENTRY_DURATION_MS && asteroid.formationElapsed < asteroid.formationDuration) {
    const elapsed = asteroid.formationElapsed + delta;
    return { ...asteroid, x: keepInField(asteroid.entryTargetX), y: asteroid.entryTargetY, formationElapsed: Math.min(asteroid.formationDuration, elapsed), rotation };
  }
  if (asteroid.entryElapsed >= ENTRY_DURATION_MS) {
    if (asteroid.attackElapsed < ATTACK_DURATION_MS) {
      if (asteroid.attackElapsed === 0 && !canLaunch) return { ...asteroid, rotation };
      const elapsed = Math.min(ATTACK_DURATION_MS, asteroid.attackElapsed + delta);
      const progress = elapsed / ATTACK_DURATION_MS;
      const diveX = asteroid.entryTargetX + (width / 2 - asteroid.entryTargetX) * 0.45 * progress + asteroid.entrySide * Math.min(width * 0.12, 110) * Math.sin(Math.PI * progress);
      const diveY = asteroid.entryTargetY + (diveEndY - asteroid.entryTargetY) * progress;
      return { ...asteroid, x: keepInField(diveX), y: diveY, attackElapsed: elapsed, rotation };
    }
    const elapsed = Math.min(RETURN_DURATION_MS, asteroid.returnElapsed + delta);
    const progress = elapsed / RETURN_DURATION_MS;
    if (elapsed === RETURN_DURATION_MS) {
      return { ...asteroid, x: keepInField(asteroid.entryTargetX), y: asteroid.entryTargetY, formationElapsed: 0, attackElapsed: 0, returnElapsed: 0, rotation };
    }
    const returnX = diveEndX + (asteroid.entryTargetX - diveEndX) * progress - asteroid.entrySide * Math.min(width * 0.09, 85) * Math.sin(Math.PI * progress);
    const returnY = diveEndY + (asteroid.entryTargetY - diveEndY) * progress;
    return { ...asteroid, x: keepInField(returnX), y: returnY, returnElapsed: elapsed, rotation };
  }
  const entryDelta = Math.min(delta, ENTRY_DURATION_MS - asteroid.entryElapsed);
  const elapsed = Math.min(ENTRY_DURATION_MS, asteroid.entryElapsed + delta);
  const progress = elapsed / ENTRY_DURATION_MS;
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
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const waveTimerRef = useRef(0);
  const [game, setGame] = useState<GameState>(createInitialState);
  const [homePrompt, setHomePrompt] = useState(false);
  const recordsSavedRef = useRef(false);

  useEffect(() => {
    const loop = (time: number) => {
      const state = stateRef.current;
      const delta = Math.min(34, time - (lastFrameRef.current || time));
      lastFrameRef.current = time;
      if (state.status === "playing") {
        const field = fieldRef.current;
        const width = field?.clientWidth || 800;
        const height = field?.clientHeight || 600;
        waveTimerRef.current += delta;
        if (waveTimerRef.current >= WAVE_DURATION_MS) {
          waveTimerRef.current -= WAVE_DURATION_MS;
          state.wave += 1;
        }
        const spawnInterval = Math.max(MIN_SPAWN_INTERVAL_MS, INITIAL_SPAWN_INTERVAL_MS - (state.wave - 1) * 80);
        spawnTimerRef.current = Math.min(spawnInterval, spawnTimerRef.current + delta);
        const slotCount = width < 620 ? 3 : 5;
        const nextSlot = formationIndexRef.current % slotCount;
        const slotOccupied = state.asteroids.some(asteroid => asteroid.formationSlotCount === slotCount && asteroid.formationSlot === nextSlot);
        if (spawnTimerRef.current >= spawnInterval && !slotOccupied) {
          spawnTimerRef.current = 0;
          state.asteroids = [...state.asteroids, spawnAsteroid(nextIdRef.current++, width, height, formationIndexRef.current++, spawnInterval)];
        }
        const nextAsteroids: Asteroid[] = [];
        let heartsLost = 0;
        let attackInProgress = state.asteroids.some(asteroid => asteroid.attackElapsed > 0);
        state.asteroids.forEach(asteroid => {
          const next = moveAsteroid(asteroid, delta, width, height, !attackInProgress);
          if (next.attackElapsed > 0) attackInProgress = true;
          if (asteroid.attackElapsed < ATTACK_DURATION_MS && next.attackElapsed === ATTACK_DURATION_MS) heartsLost += 1;
          nextAsteroids.push(next);
        });
        state.asteroids = nextAsteroids;
        state.hearts = Math.max(0, state.hearts - heartsLost);
        state.shots = state.shots.map(shot => ({ ...shot, progress: Math.min(1, shot.progress + delta / 260) })).filter(shot => shot.progress < 1);
        state.effects = state.effects.filter(effect => time - effect.startedAt < (effect.kind === "explosion" ? 430 : 230));
        if (state.hearts === 0 || state.coins === 0) {
          state.status = "game-over";
          if (!recordsSavedRef.current) {
            saveRecords(state);
            recordsSavedRef.current = true;
          }
        }
        setGame({ ...state, asteroids: [...state.asteroids], shots: [...state.shots], effects: [...state.effects] });
      }
      animationRef.current = window.requestAnimationFrame(loop);
    };
    animationRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
  }, []);

  const fireAt = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (stateRef.current.status !== "playing" || stateRef.current.coins <= 0) return;
    if (!(event.target as HTMLElement).closest(".asteroid")) return;
    const field = fieldRef.current;
    if (!field) return;
    const bounds = field.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const asteroid = [...stateRef.current.asteroids].reverse().find(item => {
      const radius = sizeData[item.size].radius;
      return Math.hypot(item.x - x, item.y - y) <= radius + 9;
    });
    if (!asteroid) return;
    const state = stateRef.current;
    state.coins -= 1;
    asteroid.health -= 1;
    state.shots.push({ id: nextIdRef.current++, x: bounds.width / 2, y: bounds.height - 55, targetX: asteroid.x, targetY: asteroid.y, progress: 0 });
    state.effects.push({ id: nextIdRef.current++, x: asteroid.x, y: asteroid.y, kind: asteroid.health <= 0 ? "explosion" : "hit", startedAt: performance.now() });
    if (asteroid.health <= 0) {
      state.score += sizeData[asteroid.size].points;
      state.coins += sizeData[asteroid.size].reward;
      state.destroyed += 1;
      state.asteroids = state.asteroids.filter(item => item.id !== asteroid.id);
    }
    setGame({ ...state, asteroids: [...state.asteroids], shots: [...state.shots], effects: [...state.effects] });
  };

  const restart = () => {
    stateRef.current = createInitialState();
    recordsSavedRef.current = false;
    formationIndexRef.current = 0;
    spawnTimerRef.current = 0;
    waveTimerRef.current = 0;
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
      <div ref={fieldRef} className="game-field" onPointerDown={fireAt}>
        <div className="star-layer star-layer-one" /><div className="star-layer star-layer-two" />
        <header className="game-hud">
          <button className="game-control home-control" type="button" onClick={() => setHomePrompt(true)} aria-label="Go home">⌂ <span>Home</span></button>
          <div className="hud-stat"><span>Score</span><strong>{game.score}</strong></div>
          <div className="hud-stat coin-stat"><span>Coins</span><strong>● {game.coins}</strong></div>
          <div className="hud-stat"><span>Hearts</span><strong className="hearts">{"♥".repeat(game.hearts)}<i>{"♥".repeat(3 - game.hearts)}</i></strong></div>
          <div className="hud-stat"><span>Wave</span><strong>{String(game.wave).padStart(2, "0")}</strong></div>
          <button className="game-control pause-control" type="button" onClick={() => { stateRef.current.status = game.status === "paused" ? "playing" : "paused"; setGame({ ...stateRef.current }); }} aria-label={game.status === "paused" ? "Resume" : "Pause"}>{game.status === "paused" ? "▶" : "Ⅱ"}</button>
        </header>
        <div className="game-label">DEFEND EARTH <span>· SECTOR 01</span></div>
        {game.asteroids.map(asteroid => <div key={asteroid.id} className={`asteroid asteroid-${asteroid.size}`} style={{ left: asteroid.x, top: asteroid.y, transform: `translate(-50%, -50%) rotate(${asteroid.rotation}deg)` }}><div className="asteroid-shape" /><span className="health-bar"><b style={{ width: `${(asteroid.health / asteroid.maxHealth) * 100}%` }} /></span></div>)}
        {game.shots.map(shot => <div key={shot.id} className="coin-shot" style={{ left: shot.x + (shot.targetX - shot.x) * shot.progress, top: shot.y + (shot.targetY - shot.y) * shot.progress }}>●</div>)}
        {game.effects.map(effect => <div key={effect.id} className={`impact-effect ${effect.kind}`} style={{ left: effect.x, top: effect.y }}><span /></div>)}
        <div className="earth"><div className="earth-glow" /><div className="earth-body"><span /><span /><span /></div><p>EARTH // PROTECTED</p></div>
        <div className="game-tip">Tap an asteroid to fire a coin</div>
        {game.status === "paused" && <div className="game-overlay"><div className="game-modal"><p className="eyebrow">MISSION PAUSED</p><h1>Hold the line.</h1><p>The asteroids are waiting.</p><button className="button button-primary" type="button" onClick={() => { stateRef.current.status = "playing"; setGame({ ...stateRef.current }); }}>Resume mission <span>▶</span></button></div></div>}
        {game.status === "game-over" && <div className="game-overlay"><div className="game-modal game-over-modal"><p className="eyebrow">MISSION COMPLETE</p><h1>Game Over</h1><div className="game-over-stats"><span><b>{game.score}</b>Score</span><span><b>{game.destroyed}</b>Destroyed</span><span><b>{game.wave}</b>Wave</span></div><div className="modal-actions"><button className="button button-primary" type="button" onClick={restart}>Play Again <span>↗</span></button><button className="button button-secondary" type="button" onClick={goHome}>Home</button></div></div></div>}
        {homePrompt && <div className="game-overlay"><div className="game-modal"><p className="eyebrow">LEAVE MISSION?</p><h2>Return to base?</h2><p>Your current round will end. Your records will be saved locally.</p><div className="modal-actions"><button className="button button-primary" type="button" onClick={goHome}>Leave game</button><button className="button button-secondary" type="button" onClick={() => setHomePrompt(false)}>Keep playing</button></div></div></div>}
      </div>
    </main>
  );
};

export { BEST_SCORE_KEY, HIGHEST_WAVE_KEY, TOTAL_DESTROYED_KEY };
export default GamePage;
