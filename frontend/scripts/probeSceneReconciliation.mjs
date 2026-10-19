// Real React reconciliation of the actual GamePage and its presentation.
// Browser effects, account services and native audio/GPU are deliberately absent.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { build } from "esbuild";
import ts from "typescript";
const root = new URL("../", import.meta.url).pathname;
const qaRequire = createRequire(path.join(process.env.CRYPTOID_SCENE_QA || "/tmp/cryptoid-scene-qa", "package.json"));
const React = qaRequire("react"),
  Renderer = qaRequire("react-test-renderer"),
  runtime = qaRequire("react/jsx-runtime");
assert.equal(
  React.version,
  createRequire(import.meta.url)("react").version,
  "QA uses the installed application React version"
);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const officialCommit = "66eb357cc08a6b5f9b32a9242d6875ed475532fa";
const base = [officialCommit, "92f392e2efe5608a7d589e2d14c2593a2626c5bb"].find(ref => {
  try {
    execFileSync("git", ["cat-file", "-e", ref + "^{commit}"], { cwd: root, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
});
assert.ok(base, "the official commit (or its verified same-tree local transfer) is available");
assert.equal(
  execFileSync("git", ["rev-parse", base + "^{tree}"], { cwd: root, encoding: "utf8" }).trim(),
  "cec8743f06146e3b2e1d292219917e9ff24dae8d",
  "baseline tree matches the verified official deployment"
);
const sourceAt = ref =>
  ref
    ? execFileSync("git", ["show", ref + ":frontend/src/pages/GamePage.tsx"], { cwd: root, encoding: "utf8" })
    : fs.readFileSync(root + "src/pages/GamePage.tsx", "utf8");

// Exact source guard protects event handlers, the entire simulation, save/audio
// paths and pacing, which JSON host snapshots cannot observe. Expand only the
// extracted JSX and canonicalize the five explicitly lazy ref initializers.
function preservedSource(before, after) {
  const parse = s => ts.createSourceFile("GamePage.tsx", s, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (ast, fn) => {
    const walk = n => {
      fn(n);
      ts.forEachChild(n, walk);
    };
    walk(ast);
  };
  const a = parse(before),
    b = parse(after),
    visuals = {},
    hud = [];
  visit(a, n => {
    if (!ts.isJsxElement(n)) return;
    const cls = n.openingElement.attributes.properties
      .find(p => ts.isJsxAttribute(p) && p.name.getText(a) === "className")
      ?.initializer?.getText(a);
    if (cls === '"ship-visual"') {
      const sprite = n.children
        .find(c => ts.isJsxSelfClosingElement(c) && c.tagName.getText(a) === "PaintedShip")
        .attributes.properties.find(p => p.name.getText(a) === "sprite")
        .initializer.expression.getText(a);
      visuals[sprite === "target.sprite" ? "bonus" : sprite === "sprite" ? "enemy" : "player"] = n.getText(a);
    }
    if (cls?.startsWith('"hud-stat ') || cls?.startsWith("{`hud-stat ")) hud.push(n.getText(a));
  });
  assert.equal(Object.keys(visuals).length, 3);
  assert.equal(hud.length, 4);
  const replacements = [];
  visit(b, n => {
    if (!ts.isJsxSelfClosingElement(n)) return;
    const name = n.tagName.getText(b);
    if (name === "GameHudStats") replacements.push([n.getStart(b), n.end, hud.join("\n          ")]);
    if (name === "GameShipVisual") {
      const variant = n.attributes.properties.find(p => p.name.getText(b) === "variant").initializer.text;
      assert.ok(visuals[variant]);
      replacements.push([n.getStart(b), n.end, visuals[variant]]);
    }
  });
  assert.ok(replacements.length === 0 || replacements.length === 4);
  for (const [start, end, text] of replacements.sort((x, y) => y[0] - x[0]))
    after = after.slice(0, start) + text + after.slice(end);
  if (replacements.length)
    after = after.replace(
      "const sprite = asteroid.sprite; const visualSize =",
      "const sprite = asteroid.sprite; const maskImage = `url('${shipEvolutionAsset(sprite, 1)}')`; const visualSize ="
    );
  const names = ["varietyRef", "keysRef", "playerMotionRef", "startKeyRef", "bestThisDeviceRef"];
  const originals = {};
  visit(a, n => {
    if (ts.isVariableDeclaration(n) && names.includes(n.name.getText(a)))
      originals[n.name.getText(a)] = n.initializer.getText(a);
  });
  const canonical = s => {
    const ast = parse(s),
      edits = [];
    visit(ast, n => {
      if (ts.isImportDeclaration(n)) {
        const text = n.getText(ast);
        if (/\.\/(?:GameHudStats|GameShipVisual|useInitialRef|HullDamage)/.test(n.moduleSpecifier.text))
          edits.push([n.getStart(ast), n.end, ""]);
        else {
          // These original imports moved into the extracted presentation files.
          const clean = text
            .replace("useMemo, ", "")
            .replace("shipNozzleStyles, ", "")
            .replace("shipEvolutionAsset, ", "");
          if (clean !== text) edits.push([n.getStart(ast), n.end, clean]);
        }
      }
      if (ts.isVariableStatement(n)) {
        const declaration = n.declarationList.declarations[0];
        if (["engineTrails", "compactNumber", "hudNumber"].includes(declaration.name.getText(ast)))
          edits.push([n.getStart(ast), n.end, ""]);
      }
      if (ts.isVariableDeclaration(n) && names.includes(n.name.getText(ast)))
        edits.push([n.initializer.getStart(ast), n.initializer.end, originals[n.name.getText(ast)]]);
    });
    for (const [start, end, text] of edits.sort((x, y) => y[0] - x[0])) s = s.slice(0, start) + text + s.slice(end);
    return ts.createPrinter({ removeComments: true }).printFile(parse(s));
  };
  const expected = canonical(before),
    actual = canonical(after);
  if (actual !== expected) {
    fs.writeFileSync("/tmp/cryptoid-scene-source-before.tsx", expected);
    fs.writeFileSync("/tmp/cryptoid-scene-source-after.tsx", actual);
    assert.fail(
      "complete GamePage changed outside extracted presentation and lazy refs; compare /tmp/cryptoid-scene-source-{before,after}.tsx"
    );
  }
}
const candidateRef = process.env.CRYPTOID_SCENE_CANDIDATE_REF || null;
preservedSource(sourceAt(base), sourceAt(candidateRef));
const frameCount = 600;
const injection = `
  if (!(globalThis as any).__sceneQA.seeded) {
    const s=stateRef.current,qa=(globalThis as any).__sceneQA;
    const slots=createFormationSlots(1,1,430,825,96,94);
    s.phase='FORMATION';s.status='playing';
    s.asteroids=slots.map((slot,i)=>({...spawnAsteroid(i+1,430,96,i,1,slots),x:slot.x,y:slot.y,entryElapsed:10000,formationElapsed:10000}));
    s.shots=Array.from({length:8},(_,i)=>({id:100+i,x:80+i*30,y:400+i*20,speedX:0,damage:1,empowered:false}));
    qa.seeded=true;
    setGame({...s});
  }
  (globalThis as any).__sceneQA.frame=(frame:number)=>{
    const s=stateRef.current;
    s.asteroids=s.asteroids.map((a,i)=>({...a,x:a.entryTargetX+Math.sin(frame/60+i)*5,y:a.entryTargetY+Math.cos(frame/80+i)*2}));
    s.shots=s.shots.map((shot,i)=>({...shot,y:100+(frame*3+i*20)%600}));
    s.score=Math.floor(frame/120)*250;s.shards=Math.floor(frame/120)*3;
    setGame({...s});
  };
  (globalThis as any).__sceneQA.change=(input:any)=>{
    const s=stateRef.current;
    Object.assign(s,input.state??{});
    if(input.sprite!==undefined){
      setShipSelection({...shipSelection,skin:{...shipSelection.skin,sprite:input.sprite},color:{...shipSelection.color,id:input.color??shipSelection.color.id}});
      s.asteroids=s.asteroids.map(a=>({...a,sprite:input.sprite,color:input.color??a.color}));
      s.bonusTargets=[{id:800,index:0,elapsed:100,x:200,y:220,radius:24,sprite:input.sprite,color:input.color??'gold'}];
    }
    if(input.stage!==undefined)setShipStage(input.stage);
    if(input.locale!==undefined)qaChoose(input.locale);
    if(input.damage!==undefined){
      const next={id:900+input.damage,x:42,y:63,impactPower:input.damage};
      s.playerHit=next;s.playerHullFires=addPersistentHullFire(s.playerHullFires,next,4);
      s.asteroids=s.asteroids.map(a=>({...a,hit:next,hullFires:addPersistentHullFire(a.hullFires,next,4)}));
    }
    if(input.clearDamage){
      s.playerHit=undefined;s.playerHullFires=[];
      s.asteroids=s.asteroids.map(a=>({...a,hit:undefined,hullFires:[]}));
    }
    if(input.bossSector){s.boss=createSectorBoss(input.bossSector,430,96,825);s.boss.elapsed=10000;}
    if(input.openCore){s.boss.turrets=s.boss.turrets.map(t=>({...t,health:0}));}
    setGame({...s});
  };
`;

async function scenario(ref) {
  const source = sourceAt(ref);
  const counters = { jsx: 0, uuid: 0, storageReads: 0, bestReads: 0 };
  let clock = 1000;
  const values = new Map([
    ["cryptoid_language", "de"],
    ["cryptoid_home_music", "off"],
  ]);
  const storage = {
    getItem(key) {
      counters.storageReads++;
      if (key === "cryptoid_best_score_v2") counters.bestReads++;
      return values.get(key) ?? null;
    },
    setItem: (k, v) => values.set(k, String(v)),
    removeItem: k => values.delete(k),
  };
  const qa = { seeded: false },
    errors = [];
  qa.reportError = error => errors.push(String(error));
  const scope = {
    module: { exports: {} },
    exports: {},
    console: {
      ...console,
      error(...args) {
        errors.push(args.map(String).join(" "));
      },
    },
    __sceneQA: qa,
    performance: { now: () => clock },
    crypto: {
      randomUUID() {
        counters.uuid++;
        return "qa-" + counters.uuid;
      },
    },
    window: {
      dispatchEvent() {},
      localStorage: storage,
      sessionStorage: storage,
      __ENV: { appNetwork: "testnet" },
      location: {
        hostname: "cryptoid-evolution-testnet.vercel.app",
        origin: "https://cryptoid-evolution-testnet.vercel.app",
        pathname: "/game",
      },
      innerWidth: 430,
      innerHeight: 825,
      devicePixelRatio: 3,
      matchMedia: q => ({ matches: /max-width/.test(q), addEventListener() {}, removeEventListener() {} }),
    },
    localStorage: storage,
    sessionStorage: storage,
    navigator: { language: "de", languages: ["de"], userAgent: "controlled-scene-host" },
    document: {
      hidden: false,
      visibilityState: "visible",
      documentElement: { dataset: {}, style: { setProperty() {} } },
    },
    URL,
    Blob,
    Event,
    Uint8ClampedArray,
    Image: class {},
    setTimeout,
    clearTimeout,
    TextEncoder,
    TextDecoder,
  };
  scope.exports = scope.module.exports;
  const trackedRuntime = {
    ...runtime,
    jsx(...args) {
      counters.jsx++;
      return runtime.jsx(...args);
    },
    jsxs(...args) {
      counters.jsx++;
      return runtime.jsxs(...args);
    },
  };
  scope.require = name => (name === "qa-react" ? React : name === "qa-runtime" ? trackedRuntime : qaRequire(name));
  const code = await build({
    absWorkingDir: root,
    entryPoints: ["src/pages/GamePage.tsx"],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    external: ["qa-react", "qa-runtime"],
    define: { "import.meta.env": "{}", __CRYPTOID_RELEASE__: '"SCENE RECONCILIATION QA"' },
    logLevel: "silent",
    plugins: [
      {
        name: "controlled-scene",
        setup(b) {
          b.onResolve({ filter: /\/paintedShip$/ }, a => ({ path: path.resolve(a.resolveDir, a.path + ".ts") }));
          b.onResolve({ filter: /^react$/ }, () => ({ path: "react", namespace: "qa" }));
          b.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({ path: "jsx", namespace: "qa" }));
          b.onResolve({ filter: /^react-router-dom$/ }, () => ({ path: "router", namespace: "qa" }));
          b.onResolve({ filter: /^react-dom$/ }, () => ({ path: "portal", namespace: "qa" }));
          b.onResolve({ filter: /\/hooks\/useAuth$/ }, () => ({ path: "auth", namespace: "qa" }));
          b.onResolve({ filter: /\/hooks\/useModalNavigation$/ }, () => ({ path: "modal", namespace: "qa" }));
          b.onLoad({ filter: /.*/, namespace: "qa" }, a => ({
            loader: "js",
            contents:
              a.path === "react"
                ? "import * as R from 'qa-react';export default R;export const {Component,createRef,memo,useState,useRef,useMemo,useCallback,useContext,createContext,useId,useSyncExternalStore}=R;export const useEffect=()=>{},useLayoutEffect=()=>{};"
                : a.path === "jsx"
                  ? "export {jsx,jsxs,Fragment} from 'qa-runtime';"
                  : a.path === "router"
                    ? "export const useNavigate=()=>()=>{},useLocation=()=>({pathname:'/game'});export const Link=({children})=>children;"
                    : a.path === "portal"
                      ? "export const createPortal=children=>children;"
                      : a.path === "auth"
                        ? "export const useAuth=()=>({authReady:true,isLoading:false,isAuthenticated:false,canAdmin:false,user:null});"
                        : "export default ()=>{};",
          }));
          b.onLoad({ filter: /\.css$/ }, () => ({ loader: "js", contents: "" }));
          b.onLoad({ filter: /\/GamePage\.tsx$/ }, () => ({
            loader: "tsx",
            contents: source
              .replace(
                "onError={error => interruptionRef.current('render-error', error)}",
                "onError={error => { (globalThis as any).__sceneQA.reportError(error); interruptionRef.current('render-error', error); }}"
              )
              .replace(
                "const { t, lives, locale } = useLocale();",
                "const { t, lives, locale, choose:qaChoose } = useLocale();"
              )
              .replace("useState<GameState>(createInitialState)", "useState<GameState>(()=>stateRef.current)")
              .replace("  const levelLabel =", injection + "\n  const levelLabel ="),
          }));
        },
      },
    ],
  });
  vm.runInNewContext(code.outputFiles[0].text, scope);
  let tree;
  const durations = [];
  await Renderer.act(() => {
    tree = Renderer.create(
      React.createElement(
        React.Profiler,
        { id: "scene", onRender: (_id, _phase, ms) => durations.push(ms) },
        React.createElement(scope.module.exports.default)
      )
    );
  });
  const hashes = [];
  const snapshot = () =>
    createHash("sha256")
      .update(JSON.stringify(tree.toJSON(), (key, value) => (key === "ref" ? undefined : value)))
      .digest("hex");
  hashes.push(snapshot());
  const initial = { ...counters };
  durations.length = 0;
  const stableNodes = tree.root.findAll(
    node =>
      typeof node.type === "string" &&
      (node.props.className === "ship-visual" ||
        node.props.className?.startsWith("hud-stat ") ||
        node.props.className?.includes("material-hull") ||
        ["exhaust", "player-engine"].includes(node.props.className))
  );
  const started = performance.now();
  for (let frame = 1; frame <= frameCount; frame++) {
    clock += 33.333;
    await Renderer.act(() => qa.frame(frame));
    if ([1, 60, 120, 300, 600].includes(frame)) hashes.push(snapshot());
  }
  const elapsed = performance.now() - started,
    frameCalls = Object.fromEntries(Object.keys(counters).map(k => [k, counters[k] - initial[k]]));
  const frameDurations = [...durations].sort((a, b) => a - b);
  const retainedNodes = tree.root.findAll(
    node =>
      typeof node.type === "string" &&
      (node.props.className === "ship-visual" ||
        node.props.className?.startsWith("hud-stat ") ||
        node.props.className?.includes("material-hull") ||
        ["exhaust", "player-engine"].includes(node.props.className))
  );
  assert.equal(retainedNodes.length, stableNodes.length);
  stableNodes.forEach((node, i) =>
    assert.equal(retainedNodes[i], node, "moving ships, exhausts and HUD cells retain their mounted host instances")
  );
  const updates = [];
  const check = async (name, input) => {
    await Renderer.act(() => qa.change(input));
    updates.push({ name, hash: snapshot() });
  };
  for (const locale of ["de", "en", "es", "zh", "vi", "ar"])
    for (const amount of [0, 999999, 1000000, 123456789])
      await check("hud-" + locale + "-" + amount, {
        locale,
        state: { score: amount, shardBase: amount, shards: amount, hearts: amount === 0 ? 0 : 3, sector: 21 },
      });
  for (let sprite = 0; sprite < 20; sprite++)
    for (const stage of [1, 2, 3])
      await check("hull-" + sprite + "-" + stage, {
        sprite,
        stage,
        color: stage === 1 ? "gold" : stage === 2 ? "red" : "white",
        damage: stage,
        state: { hearts: 3, player: { x: 0.25 + sprite / 80, y: 0.85 }, thrust: stage / 3 },
      });
  await check("clear-damage", { clearDamage: true });
  await check("player-hit", {
    state: {
      hearts: 2,
      effects: [
        {
          id: 777,
          kind: "player-crash",
          target: "player",
          x: 180,
          y: 600,
          startedAt: clock,
          debrisSize: 76,
          sprite: 1,
          debrisColor: "grey",
        },
      ],
    },
  });
  await check("player-hit-end", { state: { effects: [] } });
  for (const sector of [10, 20, 40, 500]) {
    await check("boss-" + sector, {
      bossSector: sector,
      state: { encounter: "boss-fight", phase: "ATTACK_CYCLE", sector },
    });
    await check("boss-core-" + sector, { openCore: true });
  }
  for (const [encounter, phase, sector, chainBlocks] of [
    ["normal", "SECTOR_CLEAR", 9, 9],
    ["boss-intro", "SECTOR_INTRO", 20, 9],
    ["boss-clear", "SECTOR_CLEAR", 20, 9],
    ["bonus", "ENTRY", 20, 9],
    ["bonus", "SECTOR_CLEAR", 20, 9],
    ["normal", "FORMATION", 21, 0],
  ])
    await check(encounter + "-" + phase, { state: { encounter, phase, sector, chainBlocks } });
  for (const status of ["paused", "playing", "destroying", "game-over", "victory"])
    await check("status-" + status, { state: { status } });
  assert.deepEqual(errors, [], "no render errors or warnings were hidden by the scene boundary");
  await Renderer.act(() => tree.unmount());
  return {
    ref: ref ?? "working-tree",
    frames: frameCount,
    frameCalls,
    initialCalls: initial,
    hostElapsedMs: elapsed,
    reactP50Ms: frameDurations[Math.floor(frameDurations.length * 0.5)],
    reactP95Ms: frameDurations[Math.floor(frameDurations.length * 0.95)],
    retainedHostInstances: retainedNodes.length,
    hashes,
    updates,
  };
}
// Separate processes give actual React useId the same initial root counter.
// Keep every SVG id/reference in the exact comparison; do not normalize them.
if (process.argv[2] === "--scene-child") {
  fs.writeFileSync(
    process.argv[4],
    JSON.stringify(await scenario(process.argv[3] === "working-tree" ? null : process.argv[3]))
  );
  process.exit(0);
}
const runScenario = ref => {
  const directory = fs.mkdtempSync(path.join(tmpdir(), "cryptoid-scene-"));
  const output = path.join(directory, "result.json");
  try {
    execFileSync(
      process.execPath,
      ["--experimental-strip-types", import.meta.filename, "--scene-child", ref ?? "working-tree", output],
      { cwd: root, encoding: "utf8", stdio: "pipe" }
    );
    return JSON.parse(fs.readFileSync(output, "utf8"));
  } catch (error) {
    throw new Error("scene subprocess failed: " + (error.stderr?.toString() ?? error.message));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
};
async function verifyInitialRef() {
  const bundle = await build({
    absWorkingDir: root,
    entryPoints: ["src/pages/useInitialRef.ts"],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    external: ["react"],
    logLevel: "silent",
  });
  const module = { exports: {} };
  vm.runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, require: () => React });
  let calls = 0,
    slot;
  function Owner({ tick }) {
    // A new initializer function on every render must not reinitialize the ref.
    slot = module.exports.useInitialRef(() => {
      calls++;
      return { initial: true };
    });
    return React.createElement("output", null, tick);
  }
  let tree;
  await Renderer.act(() => {
    tree = Renderer.create(React.createElement(Owner, { tick: 0 }));
  });
  const first = slot;
  for (const current of [null, undefined, 17]) {
    slot.current = current;
    await Renderer.act(() => tree.update(React.createElement(Owner, { tick: calls })));
    assert.equal(slot, first);
    assert.equal(slot.current, current);
    assert.equal(calls, 1);
  }
  await Renderer.act(() => tree.unmount());
  await Renderer.act(() => {
    tree = Renderer.create(React.createElement(Owner, { tick: 2 }));
  });
  assert.equal(calls, 2, "a genuinely new mission mount gets new initial state");
  assert.notEqual(slot, first);
  await Renderer.act(() => tree.unmount());
  return { initializedOncePerMount: true, assignedNullAndUndefinedPreserved: true, freshOnRemount: true };
}
const initialRefLifecycle = await verifyInitialRef();
const before = runScenario(base),
  after = runScenario(candidateRef);
assert.deepEqual(after.hashes, before.hashes, "actual rendered host trees at changing scores/positions stay identical");
assert.deepEqual(
  after.updates,
  before.updates,
  "locale, quantities, all 20 ship sprites/three stages, colors, heat revisions, hits, clearing, transitions and pause/end states stay identical"
);
assert.equal(
  after.frameCalls.uuid,
  0,
  "scene updates must not call native randomUUID for an already initialized mission key"
);
assert.equal(after.frameCalls.bestReads, 0, "scene updates must not reread an already initialized local best");
assert.ok(after.frameCalls.jsx < before.frameCalls.jsx, "moving scenes construct fewer JSX elements");
const report = {
  passed: true,
  officialCommit,
  fullGamePagePreservation: true,
  initialRefLifecycle,
  baseline: before,
  candidate: after,
  limits:
    "Actual React 19.3.1 and official GamePage presentation with effects disabled. CPU/JSX/host trees only; no DOM style/layout/paint/GPU, iPhone FPS, audio or native-crash inference.",
};
const output = process.env.CRYPTOID_SCENE_REPORT || "/tmp/cryptoid-scene-reconciliation.json";
fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
