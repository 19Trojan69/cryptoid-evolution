// Runs the actual GamePage scheduler/simulation in Node. Presentation, audio
// hardware and account APIs are stubs; no browser/GPU/FPS conclusion is possible.
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const assert = require("node:assert/strict");
const { build } = require("esbuild");
const ts = require("typescript");
const { webcrypto } = require("node:crypto");
const root = path.resolve(__dirname, "..");
const output =
  process.env.CRYPTOID_SIMULATION_OUT || "/tmp/cryptoid-simulation.json";
const hooks = `
globalThis.__campaignQA = {
 info:()=>({sector:stateRef.current.sector,encounter:stateRef.current.encounter,phase:stateRef.current.phase,status:stateRef.current.status,score:stateRef.current.score,shards:stateRef.current.shards,hearts:stateRef.current.hearts,paid:stateRef.current.paidWeaponMs,rapid:stateRef.current.rapidFireMs,enemies:stateRef.current.asteroids.length,shots:stateRef.current.shots.length,hostile:stateRef.current.enemyShots.length,effects:stateRef.current.effects.length}),
 protect:()=>{stateRef.current.hearts=99;adminRunRef.current=true;},
 clearGroup:()=>{stateRef.current.asteroids=[];stateRef.current.shots=[];formationIndexRef.current=blockFlights(stateRef.current.sector,rulesVersionRef.current)[flightRef.current];},
 killBoss:()=>destroyBoss(stateRef.current,performance.now()),
 heart:()=>{stateRef.current.player={...BOSS_HEART_POSITION};lastPlayerRef.current={...stateRef.current.player};},
 clearBonus:()=>{stateRef.current.bonusTargets=[];bonusIndexRef.current=BONUS_TARGET_COUNT;},
 cards:()=>{rewardCardsRef.current=[];pendingBossCardRef.current=null;setRewardCards([]);stateRef.current.status='playing';lastFrameRef.current=0;},
 pause:()=>{stateRef.current.status='paused';setGame({...stateRef.current});},
 resume:()=>{stateRef.current.status='playing';lastFrameRef.current=0;setGame({...stateRef.current});},
 timers:()=>{Object.assign(stateRef.current,{paidWeaponLevel:2,paidWeaponMs:60000,weaponSource:'paid',weaponTimers:[0,0,60000,0,0,0],unlockedWeapons:[1,2],weaponCap:2,rapidFireMs:15000});},
 stress:()=>{const s=stateRef.current,{width,height}=fieldSizeRef.current;const ids=[];for(let i=0;i<80;i++){ids.push(nextIdRef.current);s.shots.push({id:nextIdRef.current++,x:i/80*width,y:height*.4,speedX:0,damage:1,empowered:false});ids.push(nextIdRef.current);s.enemyShots.push({id:nextIdRef.current++,x:i/80*width,y:height*.1,vx:0,vy:-.1,radius:3});}for(let i=0;i<12;i++){ids.push(nextIdRef.current);s.effects.push({id:nextIdRef.current++,kind:'explosion',x:(i%4+.5)*width/4,y:(Math.floor(i/4)+.5)*height/5,startedAt:performance.now(),sprite:i%20,debrisColor:'gold',debrisSize:72});}return ids;},
 remaining:ids=>[...stateRef.current.shots,...stateRef.current.enemyShots,...stateRef.current.effects].filter(x=>ids.includes(x.id)).length,
 finite:()=>[...stateRef.current.asteroids,...stateRef.current.shots,...stateRef.current.enemyShots,...stateRef.current.effects].every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)),
 fault:()=>interruptionRef.current('frame-error',new Error('controlled simulation fault')),
 save:async()=>{const s=stateRef.current;s.hearts=3;adminRunRef.current=false;scoreRunRef.current='simulation-run';saveQueueRef.current={durable:true,enqueue:async entry=>{globalThis.__savedPayload=entry.body;}};await saveCombatRef.current();adminRunRef.current=true;return globalThis.__savedPayload;},
 mutate:()=>{stateRef.current.score=1;stateRef.current.shards=1;stateRef.current.hearts=1;stateRef.current.paidWeaponMs=1;},
 restore:payload=>{const data={checkpoint:payload.save,combat:payload.combat};adminRunRef.current=false;/* ACTUAL_RESTORE_BLOCK */adminRunRef.current=true;},
};
`;
const presentation =
  /(?:CardReveal|HullDamage|BlockchainProgress|SectorBackdrop|Starfield|PaintedShip|SystemSettings|MissionWeaponShop|BossWeaponsView|BossHealthView|BossReactorView|GameSceneBoundary)$/;
(async () => {
  const compiled = await build({
    absWorkingDir: root,
    entryPoints: ["src/pages/GamePage.tsx"],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    target: ["es2022"],
    define: {
      "import.meta.env": "{}",
      __CRYPTOID_RELEASE__: '"SIMULATION QA"',
    },
    plugins: [
      {
        name: "simulation-only-host",
        setup(b) {
          b.onResolve(
            { filter: /^(react|react\/jsx-runtime|react-router-dom|axios)$/ },
            (a) => ({ path: a.path, namespace: "host" }),
          );
          b.onResolve({ filter: presentation }, (a) => ({
            path: a.path,
            namespace: "presentation",
          }));
          b.onResolve(
            {
              filter:
                /(?:hooks\/useAuth|hooks\/useModalNavigation|paintedShip|gameAudio|musicPlayback|bossWeaponTextures)$/,
            },
            (a) => ({ path: a.path, namespace: "host" }),
          );
          b.onLoad({ filter: /.*/, namespace: "presentation" }, () => ({
            contents: "export default function Presentation(){return null;}",
            loader: "js",
          }));
          b.onLoad({ filter: /.*/, namespace: "host" }, (a) => {
            let contents;
            if (a.path === "react")
              contents =
                "export const {useState,useRef,useEffect,useMemo,useCallback,memo}=globalThis.__reactHost;";
            else if (a.path === "react/jsx-runtime")
              contents =
                'export const jsx=(type,props)=>({type,props}),jsxs=jsx,Fragment="fragment";';
            else if (a.path === "react-router-dom")
              contents =
                "export const useNavigate=()=>path=>globalThis.__navigation.push(path);";
            else if (a.path === "axios")
              contents = "export default {isAxiosError:()=>false};";
            else if (a.path.endsWith("useAuth"))
              contents =
                'export const useAuth=()=>({authReady:true,isLoading:false,authError:"",isAuthenticated:false,user:null,signIn:async()=>{}});';
            else if (a.path.endsWith("useModalNavigation"))
              contents = "export default ()=>{};";
            else if (a.path.endsWith("paintedShip"))
              contents = "export const useShipVisualOffset=()=>({});";
            else if (a.path.endsWith("gameAudio"))
              contents =
                "export class GameAudio{};export const hasPrimedGameAudio=()=>false,takePrimedGameAudio=()=>null;";
            else if (a.path.endsWith("musicPlayback"))
              contents =
                "export class MusicPlayer{};export const takeHandoffGameMusic=()=>null;";
            else contents = "export const preloadBossWeapons=async()=>{};";
            return { contents, loader: "js" };
          });
          b.onLoad({ filter: /\.css$/ }, () => ({
            contents: "export {};",
            loader: "js",
          }));
          b.onLoad({ filter: /GamePage\.tsx$/ }, (a) => {
            const source = fs.readFileSync(a.path, "utf8"),
              ast = ts.createSourceFile(
                "GamePage.tsx",
                source,
                ts.ScriptTarget.Latest,
                true,
                ts.ScriptKind.TSX,
              );
            let restoreBlock;
            const visit = (node) => {
              if (
                ts.isIfStatement(node) &&
                node.expression.getText(ast) ===
                  "!adminRunRef.current && data.checkpoint"
              )
                restoreBlock = node.getText(ast);
              ts.forEachChild(node, visit);
            };
            visit(ast);
            assert.ok(restoreBlock);
            return {
              contents:
                source.replace(
                  "  const levelLabel =",
                  hooks.replace("/* ACTUAL_RESTORE_BLOCK */", restoreBlock) +
                    "\n  const levelLabel =",
                ) + "\nglobalThis.__GamePageFactory=GamePage;",
              loader: "tsx",
            };
          });
          b.onResolve({ filter: /axiosClient(?:\.ts)?$/ }, (a) => ({
            path: a.path,
            namespace: "api",
          }));
          b.onLoad({ filter: /.*/, namespace: "api" }, () => ({
            contents:
              'export const axiosClient={get:async()=>({data:{}}),post:async()=>{throw new Error("Account API forbidden in simulation");}};export const getBaseURL=()=>"";export const PI_ACCESS_TOKEN_KEY="unused";',
            loader: "js",
          }));
        },
      },
    ],
  });
  let clock = 1000,
    nextId = 0;
  const frames = new Map(),
    timers = new Map(),
    effects = [],
    cleanups = [],
    listeners = new Map();
  const storage = () => {
    const values = new Map();
    return {
      getItem: (k) => values.get(k) ?? null,
      setItem: (k, v) => values.set(k, String(v)),
      removeItem: (k) => values.delete(k),
    };
  };
  const local = storage(),
    session = storage();
  local.setItem("cryptoid_home_music", "off");
  local.setItem("cryptoid_language", "en");
  const events = {
    addEventListener: (type, fn) => {
      const set = listeners.get(type) || new Set();
      set.add(fn);
      listeners.set(type, set);
    },
    removeEventListener: (type, fn) => listeners.get(type)?.delete(fn),
  };
  const host = {
    ...events,
    __ENV: { appNetwork: "testnet" },
    localStorage: local,
    sessionStorage: session,
    requestAnimationFrame: (fn) => {
      frames.set(++nextId, fn);
      return nextId;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    setTimeout: (fn, ms = 0) => {
      timers.set(++nextId, { fn, at: clock + ms, repeat: 0 });
      return nextId;
    },
    clearTimeout: (id) => timers.delete(id),
    setInterval: (fn, ms) => {
      timers.set(++nextId, { fn, at: clock + ms, repeat: ms });
      return nextId;
    },
    clearInterval: (id) => timers.delete(id),
    matchMedia: () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }),
    location: {
      pathname: "/game",
      hostname: "testnet.localhost",
      origin: "http://testnet.localhost",
    },
    innerWidth: 800,
    innerHeight: 600,
  };
  const document = {
    ...events,
    hidden: false,
    visibilityState: "visible",
    documentElement: { dataset: {}, style: { setProperty() {} } },
    addEventListener: events.addEventListener,
    removeEventListener: events.removeEventListener,
  };
  let randomSeed = 20261012;
  const seededMath = Object.create(Math);
  seededMath.random = () => {
    randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0;
    return randomSeed / 4294967296;
  };
  const context = {
    Math: seededMath,
    window: host,
    document,
    localStorage: local,
    sessionStorage: session,
    navigator: { userAgent: "Node simulation (no rendering)" },
    performance: { now: () => clock, getEntriesByType: () => [] },
    crypto: webcrypto,
    console,
    process: { env: {} },
    URL,
    Error,
    setTimeout: host.setTimeout,
    clearTimeout: host.clearTimeout,
    setInterval: host.setInterval,
    clearInterval: host.clearInterval,
    requestAnimationFrame: host.requestAnimationFrame,
    cancelAnimationFrame: host.cancelAnimationFrame,
    module: { exports: {} },
    exports: {},
    __navigation: [],
    __reactHost: {
      useState: (value) => {
        let current = typeof value === "function" ? value() : value;
        return [
          current,
          (next) => {
            current = typeof next === "function" ? next(current) : next;
          },
        ];
      },
      useRef: (current) => ({ current }),
      useEffect: (fn) => effects.push(fn),
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
      memo: (fn) => fn,
    },
  };
  context.exports = context.module.exports;
  vm.createContext(context);
  vm.runInContext(
    compiled.outputFiles.find(
      (f) => f.path.endsWith(".js") || f.path === "<stdout>",
    ).text,
    context,
  );
  context.__GamePageFactory();
  for (const effect of effects) {
    const cleanup = effect();
    if (typeof cleanup === "function") cleanups.push(cleanup);
  }
  for (let i = 0; i < 10; i++) await Promise.resolve();
  const qa = context.__campaignQA;
  assert.ok(qa);
  qa.cards();
  qa.protect();
  const peaks = { enemies: 0, shots: 0, hostile: 0, effects: 0 };
  const errors = [],
    unhandled = (error) => errors.push(String(error));
  process.on("unhandledRejection", unhandled);
  const advance = async (ms) => {
    const end = clock + ms;
    while (clock < end) {
      clock = Math.min(end, clock + 16);
      for (const [id, t] of [...timers])
        if (t.at <= clock) {
          if (t.repeat) t.at = clock + t.repeat;
          else timers.delete(id);
          t.fn();
        }
      const ready = [...frames];
      frames.clear();
      for (const [, fn] of ready) fn(clock);
      assert.equal(frames.size, 1, "one RAF owner");
      assert.ok(qa.finite(), "finite coordinates");
      const live = qa.info();
      for (const key of Object.keys(peaks))
        peaks[key] = Math.max(peaks[key], live[key]);
      qa.protect();
    }
    await Promise.resolve();
  };
  const emit = (type) => {
    for (const fn of listeners.get(type) || []) fn({});
  };
  const normal = [],
    bosses = [],
    snapshots = [];
  let turns = 0;
  const count = Number(process.env.CRYPTOID_SIMULATION_BLOCKS || 30);
  try {
    while (normal.length < count) {
      assert.ok(++turns < 100);
      let info = qa.info();
      assert.equal(info.status, "playing", JSON.stringify(info));
      if (info.encounter === "normal") {
        const sector = info.sector;
        for (let group = 0; group < 4; group++) {
          await advance(8200);
          if (sector === 25 && group === 0) {
            assert.notEqual(qa.info().phase, "SECTOR_CLEAR");
            qa.timers();
            const ids = qa.stress();
            const injected = qa.info();
            assert.ok(
              injected.shots >= 80 &&
                injected.hostile >= 80 &&
                injected.effects >= 12,
            );
            for (const key of Object.keys(peaks))
              peaks[key] = Math.max(peaks[key], injected[key]);
            await advance(64);
            assert.ok(
              qa.remaining(ids) > 0,
              "stress objects enter actual simulation",
            );
            const before = qa.info();
            qa.pause();
            await advance(30000);
            for (const key of ["paid", "rapid", "score", "shards"])
              assert.equal(qa.info()[key], before[key]);
            qa.resume();
            await advance(5000);
            assert.equal(
              qa.remaining(ids),
              0,
              "expired/offscreen stress objects released",
            );
          }
          qa.clearGroup();
          await advance(64);
          info = qa.info();
          if (info.phase === "SECTOR_CLEAR") break;
        }
        assert.equal(info.phase, "SECTOR_CLEAR", JSON.stringify(info));
        normal.push(sector);
        await advance(8600);
      } else if (
        info.encounter === "boss-intro" ||
        info.encounter === "boss-fight"
      ) {
        const sector = info.sector;
        await advance(6000);
        qa.killBoss();
        await advance(11000);
        qa.heart();
        await advance(2400);
        qa.cards();
        await advance(1000);
        bosses.push(sector);
      } else if (info.encounter === "bonus") {
        await advance(8200);
        qa.clearBonus();
        await advance(100);
        await advance(8600);
      } else throw Error("Unexpected encounter " + JSON.stringify(info));
      if (global.gc) global.gc();
      snapshots.push({
        ...qa.info(),
        heapBytes: process.memoryUsage().heapUsed,
        raf: frames.size,
        timers: timers.size,
      });
      if (turns % 10 === 0)
        console.log(
          JSON.stringify({
            blocks: normal.length,
            bosses: bosses.length,
            sector: qa.info().sector,
          }),
        );
    }
    if (count >= 25) assert.ok(normal.includes(25));
    assert.equal(bosses.length, Math.floor(normal.length / 9));
    const beforeBackground = qa.info();
    document.hidden = true;
    document.visibilityState = "hidden";
    emit("visibilitychange");
    clock += 60000;
    document.hidden = false;
    document.visibilityState = "visible";
    emit("visibilitychange");
    await advance(32);
    assert.equal(qa.info().status, "paused");
    for (const key of ["score", "shards", "paid", "rapid"])
      assert.equal(qa.info()[key], beforeBackground[key]);
    qa.resume();
    const beforeFault = qa.info();
    qa.fault();
    await advance(1000);
    assert.equal(qa.info().status, "paused");
    for (const key of ["score", "shards", "sector", "paid"])
      assert.equal(qa.info()[key], beforeFault[key]);
    const combat = await qa.save(),
      saved = qa.info();
    assert.ok(combat?.combat);
    qa.mutate();
    qa.restore(combat);
    qa.restore(combat);
    for (const key of ["score", "shards", "hearts", "paid"])
      assert.equal(qa.info()[key], saved[key]);
    for (const cleanup of cleanups.reverse()) cleanup();
    assert.equal(frames.size, 0); // Audio close is deliberately deferred one task for Strict Mode remounts.
    for (const [id, t] of [...timers])
      if (!t.repeat && t.at <= clock) {
        timers.delete(id);
        t.fn();
      }
    assert.equal(timers.size, 0);
    assert.equal(context.__navigation.length, 0);
    assert.equal(
      [...listeners.values()].reduce((n, set) => n + set.size, 0),
      0,
    );
    assert.equal(errors.length, 0);
    const result = {
      passed: true,
      mode: "actual GamePage simulation; forced clears and extra lives; presentation/audio hardware/API stubs; no browser or FPS inference",
      normal,
      bosses,
      snapshots,
      peaks,
      simulatedSeconds: (clock - 1000) / 1000,
      randomSeed: 20261012,
      stressObjectsReleased: count >= 25,
      pausePreservesTimers: count >= 25,
      backgroundPreservesTimers: true,
      faultPreservesRun: true,
      checkpointRestoresState: true,
      cleanup: {
        raf: frames.size,
        timers: timers.size,
        listeners: [...listeners.values()].reduce((n, set) => n + set.size, 0),
      },
    };
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(result, null, 2));
    console.log(
      JSON.stringify({
        passed: true,
        blocks: normal.length,
        bosses: bosses.length,
        cleanup: result.cleanup,
      }),
    );
  } finally {
    process.removeListener("unhandledRejection", unhandled);
    if (frames.size) for (const cleanup of cleanups.reverse()) cleanup();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
