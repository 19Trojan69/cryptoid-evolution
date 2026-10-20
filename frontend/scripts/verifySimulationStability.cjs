// Runs the actual GamePage scheduler/simulation in Node. Presentation, audio
// hardware and account APIs are stubs; no browser/GPU/FPS conclusion is possible.
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const assert = require("node:assert/strict");
const { build } = require("esbuild");
const ts = require("typescript");
const { createHash } = require("node:crypto");
const { webcrypto } = require("node:crypto");
const root = path.resolve(__dirname, "..");
const output =
  process.env.CRYPTOID_SIMULATION_OUT || "/tmp/cryptoid-simulation.json";
const hooks = `
globalThis.__campaignQA = {
 trace:()=>JSON.stringify({state:stateRef.current,refs:Object.fromEntries(Object.entries(combatRefs).map(([k,v])=>[k,v.current]))}),
 sustain:()=>{for(const e of stateRef.current.asteroids)e.health=e.maxHealth=1000000;const b=stateRef.current.boss;if(b){b.health=b.maxHealth=1000000;for(const g of b.turrets)g.health=g.maxHealth=1000000;}},
 info:()=>({attackers:stateRef.current.asteroids.filter(a=>a.attackPattern!==null&&a.attackDelay===0&&a.returnElapsed===0).length,returning:stateRef.current.asteroids.filter(a=>a.returnElapsed>0).length,patterns:stateRef.current.asteroids.filter(a=>a.attackPattern!==null).map(a=>a.attackPattern),sector:stateRef.current.sector,encounter:stateRef.current.encounter,phase:stateRef.current.phase,status:stateRef.current.status,score:stateRef.current.score,shards:stateRef.current.shards,hearts:stateRef.current.hearts,paid:stateRef.current.paidWeaponMs,rapid:stateRef.current.rapidFireMs,enemies:stateRef.current.asteroids.length,shots:stateRef.current.shots.length,hostile:stateRef.current.enemyShots.length,effects:stateRef.current.effects.length}),
 render:()=>{const game=stateRef.current;return /* ACTUAL_SCENE */;},
 arrivals:()=>stateRef.current.asteroids.map(enemy=>({duration:enemy.entryDuration,settle:enemy.formationDuration,shipClass:enemy.shipClass,pattern:enemy.entryPattern})),
 protect:()=>{stateRef.current.hearts=99;adminRunRef.current=true;},
 clearGroup:()=>{stateRef.current.asteroids=[];stateRef.current.shots=[];formationIndexRef.current=blockFlights(stateRef.current.sector,rulesVersionRef.current)[flightRef.current];},
 killBoss:()=>destroyBoss(stateRef.current,performance.now()),
 heart:()=>{stateRef.current.player={...BOSS_HEART_POSITION};lastPlayerRef.current={...stateRef.current.player};},
 clearBonus:()=>{stateRef.current.bonusTargets=[];bonusIndexRef.current=BONUS_TARGET_COUNT;},
 cards:()=>{rewardCardsRef.current=[];pendingBossCardRef.current=null;setRewardCards([]);stateRef.current.status='playing';lastFrameRef.current=0;},
 pause:()=>{stateRef.current.status='paused';setGame({...stateRef.current});},
 resume:()=>{stateRef.current.status='playing';lastFrameRef.current=0;setGame({...stateRef.current});},
 timers:()=>{Object.assign(stateRef.current,{paidWeaponLevel:2,paidWeaponMs:60000,weaponSource:'paid',weaponTimers:[0,0,60000,0,0,0],unlockedWeapons:[1,2],weaponCap:2,rapidFireMs:15000});},
 seedCadence:()=>{const s=stateRef.current;fieldSizeRef.current.height=10000;s.player={x:.8,y:.9};lastPlayerRef.current={...s.player};s.phase='ATTACK_CYCLE';formationStartedRef.current=true;for(const e of s.asteroids)e.health=e.maxHealth=1000000;s.shots=[{id:-1,x:30,y:5000,speedX:.1,damage:1,empowered:false}];s.enemyShots=[{id:-2,x:50,y:1000,vx:.1,vy:.2,radius:3}];s.effects=[];lastFrameRef.current=performance.now();},
 cadence:()=>({shot:stateRef.current.shots.find(s=>s.id===-1),enemyShot:stateRef.current.enemyShots.find(s=>s.id===-2),elapsed:elapsedRef.current,paid:stateRef.current.paidWeaponMs,rapid:stateRef.current.rapidFireMs,status:stateRef.current.status}),
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
  /(?:CardReveal|HullDamage|BlockchainProgress|SectorBackdrop|Starfield|PaintedShip|SystemSettings|MissionWeaponShop|BossWeaponsView|BossHealthView|BossReactorView|BossHullView|GameSceneBoundary|BonusRockLayer|CanvasEffects)$/;
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
      __CRYPTOID_BUILD__: '{"sourceCommit":"controlled-simulation","sourceTree":"controlled-simulation","workingTreeDirty":true}',
      "import.meta.env": process.env.CRYPTOID_PROBE === "1" ? '{"VITE_CRYPTOID_DIAGNOSTICS":"1"}' : "{}",
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
            contents: "export default function Presentation(){return null;}export const CanvasEffectLayer=({children})=>children,CanvasImpact=({original})=>original,canvasEffectResources=()=>({});",
            loader: "js",
          }));
          b.onLoad({ filter: /.*/, namespace: "host" }, (a) => {
            let contents;
            if (a.path === "react")
              contents =
                "export const {useState,useRef,useEffect,useMemo,useCallback,memo}=globalThis.__reactHost;export const createRef=()=>({current:null});export const useLayoutEffect=()=>{};";
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
              contents = "export const useShipVisualOffset=()=>({}),paintedShipResourceStats=()=>({painted:0,estimatedBytes:0,sources:0,pending:0}),useHullSourceReady=()=>true,preloadHullSources=()=>{},retainPreparedHulls=()=>({release(){}});";
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
            const source = fs.readFileSync(process.env.CRYPTOID_GAME_SOURCE || a.path, "utf8"),
              ast = ts.createSourceFile(
                "GamePage.tsx",
                source,
                ts.ScriptTarget.Latest,
                true,
                ts.ScriptKind.TSX,
              );
            let restoreBlock, scene;
            const visit = (node) => {
              if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "GamePage")
                scene = node.initializer.body.statements.findLast(ts.isReturnStatement).expression.getText(ast);
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
            assert.ok(scene);
            return {
              contents:
                source.replace("useRef({ width: 800, height: 600 })", `useRef({ width: ${Number(process.env.CRYPTOID_WIDTH || 800)}, height: ${Number(process.env.CRYPTOID_HEIGHT || 600)} })`).replace(
                  "  const levelLabel =",
                  hooks.replace("/* ACTUAL_RESTORE_BLOCK */", restoreBlock).replace("/* ACTUAL_SCENE */", scene) +
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
    nextId = 0,
    sceneRequests = 0, sceneRequestsPerFrameMax = 0, frameIndex = 0,
    frameInterval = Number(process.env.CRYPTOID_FRAME_MS || 16);
  const jitter = process.env.CRYPTOID_FRAME_PATTERN ? process.env.CRYPTOID_FRAME_PATTERN.split(',').map(Number) : null;
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
    innerWidth: Number(process.env.CRYPTOID_WIDTH || 800),
    innerHeight: Number(process.env.CRYPTOID_HEIGHT || 600),
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
    Image: class {},
    structuredClone,
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
            if (current?.shots && current?.enemyShots) sceneRequests++;
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
  context.__GamePageFactory({ ownerDiagnostics: false });
  for (const effect of effects) {
    const cleanup = effect();
    if (typeof cleanup === "function") cleanups.push(cleanup);
  }
  for (let i = 0; i < 10; i++) await Promise.resolve();
  const qa = context.__campaignQA;
  assert.ok(qa);
  qa.cards();
  qa.protect();
  const peaks = { enemies: 0, shots: 0, hostile: 0, effects: 0, attackers: 0, returning: 0 };
  let sustaining = false, lastTrace = 0, activeAttackFrames = 0, returningFrames = 0;
  const observedAttackPatterns = new Set(), hash = createHash('sha256'), cpu = {};
  const histSample = (label, ms) => { const h = cpu[label] ||= { count: 0, totalMs: 0, maxMs: 0, bins: new Uint32Array(2001) };
    h.count++; h.totalMs += ms; h.maxMs = Math.max(h.maxMs, ms); h.bins[Math.min(2000, Math.floor(ms / .005))]++; };
  const cpuSummary = () => Object.fromEntries(Object.entries(cpu).map(([label,h]) => {
    const q = p => { let n=0; for(let i=0;i<h.bins.length;i++){ n+=h.bins[i]; if(n>=h.count*p)return (i+1)*.005; } return h.maxMs; };
    return [label, {count:h.count, meanMs:h.totalMs/h.count, p50Ms:q(.5), p95Ms:q(.95), maxMs:h.maxMs}]; }));
  const errors = [],
    unhandled = (error) => errors.push(String(error));
  process.on("unhandledRejection", unhandled);
  const advance = async (ms) => {
    const end = clock + ms;
    while (clock < end) {
      clock = Math.min(end, clock + (jitter ? jitter[frameIndex++ % jitter.length] : frameInterval));
      for (const [id, t] of [...timers])
        if (t.at <= clock) {
          if (t.repeat) t.at = clock + t.repeat;
          else timers.delete(id);
          t.fn();
        }
      const ready = [...frames];
      frames.clear();
      const before = qa.info();
      if (sustaining) qa.sustain();
      const cpuStart = process.hrtime.bigint();
      const publishedBeforeFrame = sceneRequests;
      for (const [, fn] of ready) fn(clock);
      sceneRequestsPerFrameMax = Math.max(sceneRequestsPerFrameMax, sceneRequests - publishedBeforeFrame);
      histSample(before.status !== 'playing' ? 'paused' : before.encounter.startsWith('boss') ? before.encounter : before.phase === 'SECTOR_CLEAR' || before.phase === 'SECTOR_INTRO' ? 'transition' : before.attackers ? 'attack' : before.returning ? 'return' : 'formation', Number(process.hrtime.bigint() - cpuStart) / 1e6);
      assert.equal(frames.size, 1, "one RAF owner");
      assert.ok(qa.finite(), "finite coordinates");
      const live = qa.info();
      assert.equal(live.status, before.status === 'playing' ? 'playing' : before.status, 'no unexpected interruption');
      activeAttackFrames += Number(live.attackers > 0); returningFrames += Number(live.returning > 0);
      live.patterns.forEach(p => observedAttackPatterns.add(p));
      if (clock - lastTrace >= 1000) { hash.update(qa.trace()); lastTrace = clock; }
      for (const key of Object.keys(peaks))
        peaks[key] = Math.max(peaks[key], live[key]);
      qa.protect();
    }
    await Promise.resolve();
  };
  const emit = (type) => {
    for (const fn of listeners.get(type) || []) fn({});
  };
  if (process.env.CRYPTOID_CADENCE_ONLY === "1") {
    try {
      await advance(8200);
      qa.seedCadence(); qa.timers();
      sceneRequestsPerFrameMax=0;
      const before = qa.cadence(), publishedBefore = sceneRequests, started = clock;
      await advance(1000);
      const after = qa.cadence();
      const result = { mode: "actual GamePage, hardware/API/presentation stubs", frameMs: frameInterval,
        wallMs: clock-started, simulatedMs: after.elapsed-before.elapsed,
        playerDistance: before.shot.y-after.shot.y, playerHorizontal: after.shot.x-before.shot.x,
        enemyDistance: after.enemyShot.y-before.enemyShot.y, enemyHorizontal: after.enemyShot.x-before.enemyShot.x,
        paidConsumedMs: before.paid-after.paid, rapidConsumedMs: before.rapid-after.rapid,
        sceneRequests: sceneRequests-publishedBefore, sceneRequestsPerFrameMax, framePattern: jitter || null };
      if (process.env.CRYPTOID_EXPECT_REALTIME === "1") {
        for (const [key, expected] of Object.entries({simulatedMs:1000,playerDistance:640,playerHorizontal:100,enemyDistance:200,enemyHorizontal:100,paidConsumedMs:1000,rapidConsumedMs:1000}))
          assert.ok(Math.abs(result[key]-expected)<1e-7, `${key}: ${result[key]} !== ${expected}`);
      }
      assert.ok(result.sceneRequestsPerFrameMax <= 1, "at most one scene request per host frame");
      qa.pause(); const paused=qa.cadence(); await advance(5000);
      assert.equal(qa.cadence().shot.y,paused.shot.y); assert.equal(qa.cadence().paid,paused.paid);
      qa.resume(); await advance(frameInterval);
      assert.equal(qa.cadence().paid,paused.paid,"resume does not consume paused time");
      result.pausePreservesMovementAndTimers=true;
      assert.equal(context.__navigation.length,0); assert.equal(errors.length,0);
      fs.mkdirSync(path.dirname(output),{recursive:true}); fs.writeFileSync(output,JSON.stringify(result,null,2));
      console.log(JSON.stringify(result));
    } finally {
      process.removeListener("unhandledRejection",unhandled);
      for(const cleanup of cleanups.reverse())cleanup();
      assert.equal(frames.size,0);
    }
    return;
  }
  const normal = [],
    bosses = [],
    snapshots = [];
  let turns = 0;
  const arrivalPatterns = new Set();
  let presentationChecks = 0;
  const count = Number(process.env.CRYPTOID_SIMULATION_BLOCKS || 30);
  try {
    while (normal.length < count) {
      assert.ok(++turns < count + Math.ceil(count / 9) * 2 + 5);
      let info = qa.info();
      assert.equal(info.status, "playing", JSON.stringify(info));
      if (info.encounter === "normal") {
        const sector = info.sector;
        const sustainedMs = Number(process.env.CRYPTOID_SUSTAIN_MS || 0);
        if (sustainedMs && [1, 25, 49, 99, 249, 499].includes(sector)) { sustaining = true; await advance(sustainedMs); sustaining = false; }
        for (let group = 0; group < 4; group++) {
          await advance(8200);
          const arrivals = qa.arrivals();
          if (arrivals.length) {
            for (const enemy of arrivals) {
              const expected = sector <= 29 ? 1300 : Math.max(1600, 2400 - Math.floor(sector / 50) * 80);
              assert.equal(enemy.duration, Math.round((expected + (enemy.shipClass === "heavy" ? 600 : 0)) * 1.1), "approved Testnet arrival timing with the requested slight slowdown");
              assert.equal(enemy.settle, 180, "approved Testnet settling timing");
              arrivalPatterns.add(enemy.pattern);
            }
            const nodes = [];
            const walk = value => {
              if (Array.isArray(value)) { value.forEach(walk); return; }
              if (!value || typeof value !== "object") return;
              if (value.props) { nodes.push(value); walk(value.props.children); }
            };
            walk(qa.render());
            assert.equal(nodes.filter(n => /\bformation-target\b/.test(n.props.className || "")).length, 0, "no Testnet positioning-marker DOM");
            const hud = nodes.find(n => n.props.className === "game-hud");
            assert.ok(hud);
            const hudNodes = hud.props.children.flatMap(node => node?.type?.name === 'GameHudStats' ? node.type(node.props).props.children : node);
            assert.deepEqual(Array.from(hudNodes, n => n.props.className.replace(" hearts-stat-hit", "")), ["hud-actions", "hud-stat hearts-stat", "hud-stat game-level-hud", "hud-stat score-hud", "hud-stat round-hud chain-hud", "game-control pause-control"]);
            assert.deepEqual(Array.from(hudNodes[3].props.children, n => n.props.className), ["shard-line", "score-line"]);
            presentationChecks++;
          }
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
        if (process.env.CRYPTOID_SUSTAIN_MS && [10, 50, 100, 250, 500].includes(sector)) { sustaining = true; await advance(Number(process.env.CRYPTOID_SUSTAIN_MS)); sustaining = false; }
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
    if (count >= 25) { assert.ok(presentationChecks >= 25); assert.ok(arrivalPatterns.size >= 6); }
    assert.equal(bosses.length, Math.floor((normal.length - 1) / 9));
    const gameplayHash = hash.copy().digest('hex');
    const developerTrace = host.__cryptoidDiagnostics?.export();
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
      // Checkpoints deliberately serialize timer values as integer milliseconds.
      assert.equal(qa.info()[key], key === 'paid' ? Math.floor(saved[key]) : saved[key]);
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
      viewport: {width:host.innerWidth,height:host.innerHeight},
      randomSeed: 20261012,
      gameplayHash, cpu: cpuSummary(), activeAttackFrames, returningFrames, observedAttackPatterns: [...observedAttackPatterns],
      developerTrace: developerTrace || null,
      approvedTestnetPresentation: { checkedGroups: presentationChecks, arrivalPatterns: [...arrivalPatterns], positioningMarkers: 0, hudOrder: "home hearts level shards-over-score block pause", arrivalMsFirst29: 1430, heavyExtraMs: 660, settleMs: 180, restingSway: "all normal Testnet enemies; original amplitude and rhythm" },
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
