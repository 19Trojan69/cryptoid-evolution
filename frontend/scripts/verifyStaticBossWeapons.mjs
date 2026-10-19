// Actual React effects + original boss atlases + native Canvas rasterization.
// This does not reproduce WebKit GPU memory, iPhone FPS or the document restart.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";

const root = new URL("../", import.meta.url).pathname;
const qa = createRequire(path.join(process.env.CRYPTOID_SCENE_QA || "/tmp/cryptoid-scene-qa", "package.json"));
const React = qa("react"),
  Renderer = qa("react-test-renderer"),
  jsx = qa("react/jsx-runtime");
const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + "/@napi-rs/canvas");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// Only suppress this known deprecation notice; component errors still fail act.
const originalError = console.error;
console.error = (...args) => {
  if (!String(args[0]).startsWith("react-test-renderer is deprecated")) originalError(...args);
};
const official = "66eb357cc08a6b5f9b32a9242d6875ed475532fa";
const base = [official, "92f392e2efe5608a7d589e2d14c2593a2626c5bb"].find(ref => {
  try {
    execFileSync("git", ["cat-file", "-e", ref + "^{commit}"], { cwd: root, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
});
assert.ok(base);
assert.equal(
  execFileSync("git", ["rev-parse", base + "^{tree}"], { cwd: root, encoding: "utf8" }).trim(),
  "cec8743f06146e3b2e1d292219917e9ff24dae8d"
);
const at = (ref, file) =>
  ref
    ? execFileSync("git", ["show", ref + ":frontend/src/pages/" + file], { cwd: root, encoding: "utf8" })
    : fs.readFileSync(root + "src/pages/" + file, "utf8");
const candidateRef = process.env.CRYPTOID_STATIC_WEAPONS_CANDIDATE_REF || null;
const rendererBefore = at(base, "bossWeaponRenderer.ts"),
  rendererAfter = at(candidateRef, "bossWeaponRenderer.ts");
const approvedRenderer = rendererBefore
  .replace("const c=canvas.getContext('2d');if(!c)return;", "const c=canvas.getContext('2d');if(!c)return false;")
  .replace(
    "base=layer.getContext('2d');if(!base)return;",
    "base=layer.getContext('2d');if(!base){layer.width=layer.height=0;return false;}"
  )
  .replace(/\n};\s*$/, "\n return true;\n};\n");
// Only a success result and failed temporary-surface release are added.
assert.ok(
  rendererAfter === rendererBefore || rendererAfter === approvedRenderer,
  "renderer artwork/geometry/drawing preserved"
);

async function runtime(ref) {
  const source = at(ref, "BossWeaponsView.tsx"),
    renderSource = at(ref, "bossWeaponRenderer.ts");
  const state = { texture: null, failAux: false, owned: [], surfaces: [], lifecycle: [] };
  function canvas(main = false) {
    const c = createCanvas(1, 1),
      native = c.getContext("2d"),
      listeners = new Map();
    // Model HTML Canvas zero dimensions. This native backend otherwise silently
    // substitutes its default width for zero; positive raster sizes stay exact.
    for (const key of ["width", "height"]) {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(c), key);
      let logical = 1;
      Object.defineProperty(c, key, {
        get: () => logical,
        set(value) {
          logical = value;
          descriptor.set.call(c, Math.max(1, value));
        },
      });
    }
    let clears = 0;
    const context = new Proxy(native, {
      get(target, key) {
        if (key === "clearRect")
          return (...args) => {
            clears++;
            return target.clearRect(...args);
          };
        const value = target[key];
        return typeof value === "function" ? value.bind(target) : value;
      },
      set(target, key, value) {
        target[key] = value;
        return true;
      },
    });
    c.getContext = () => {
      if (c.failOnce) {
        c.failOnce = false;
        return null;
      }
      return context;
    };
    c.addEventListener = (name, fn) => {
      assert.ok(!listeners.has(name));
      listeners.set(name, fn);
    };
    c.removeEventListener = (name, fn) => {
      assert.equal(listeners.get(name), fn);
      listeners.delete(name);
    };
    c.dispatch = name => listeners.get(name)?.();
    c.listeners = listeners;
    c.clears = () => clears;
    c.pixels = () => Buffer.from(native.getImageData(0, 0, c.width, c.height).data);
    if (!main && state.failAux) {
      state.failAux = false;
      c.failOnce = true;
    }
    state.owned.push(c);
    if (main) state.surfaces.push(c);
    return c;
  }
  const scope = {
    module: { exports: {} },
    exports: {},
    console,
    window: { devicePixelRatio: 1 },
    __bossQA: state,
    document: { createElement: () => canvas() },
    require: name => (name === "react" ? React : name === "react/jsx-runtime" ? jsx : qa(name)),
  };
  scope.exports = scope.module.exports;
  const bundle = await build({
    absWorkingDir: root,
    stdin: {
      contents:
        "export {default} from './src/pages/BossWeaponsView';export {createSectorBoss,moveSectorBoss} from './src/pages/sectorBoss';",
      resolveDir: root,
      loader: "tsx",
    },
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    external: ["react", "react/jsx-runtime"],
    logLevel: "silent",
    plugins: [
      {
        name: "native-boss-host",
        setup(b) {
          b.onLoad({ filter: /\/BossWeaponsView\.tsx$/ }, () => ({ loader: "tsx", contents: source }));
          b.onLoad({ filter: /\/bossWeaponRenderer\.ts$/ }, () => ({ loader: "ts", contents: renderSource }));
          b.onResolve({ filter: /\/bossWeaponTextures$/ }, () => ({ path: "atlas", namespace: "qa" }));
          b.onResolve({ filter: /\/bossResourceDiagnostics$/ }, () => ({ path: "diagnostics", namespace: "qa" }));
          b.onLoad({ filter: /.*/, namespace: "qa" }, a => ({
            loader: "js",
            contents:
              a.path === "atlas"
                ? "export const preloadBossWeapons=()=>globalThis.__bossQA.pending??Promise.resolve(globalThis.__bossQA.texture);"
                : "export const reportBossResource=(...args)=>globalThis.__bossQA.lifecycle.push(args);",
          }));
        },
      },
    ],
  });
  vm.runInNewContext(bundle.outputFiles[0].text, scope);
  return { state, scope, canvas, ...scope.module.exports };
}

const before = await runtime(base),
  after = await runtime(candidateRef);
let compared = 0,
  cases = 0,
  staticPhase;
const compare = (a, b, label) => {
  assert.equal(b.canvas.width, a.canvas.width, label + " width");
  assert.equal(b.canvas.height, a.canvas.height, label + " height");
  assert.ok(b.canvas.pixels().equals(a.canvas.pixels()), "exact RGBA: " + label);
  const clean = tree => JSON.stringify(tree.toJSON(), (key, value) => (key === "ref" ? undefined : value));
  assert.equal(clean(b.tree), clean(a.tree), "unchanged host elements: " + label);
  compared++;
};
const mount = async (r, boss, atlas, dpr, delayed = false) => {
  let finish;
  r.state.pending = delayed
    ? new Promise(resolve => {
        finish = resolve;
      })
    : null;
  r.scope.window.devicePixelRatio = dpr;
  r.state.texture = atlas;
  const surface = r.canvas(true);
  let tree;
  await Renderer.act(async () => {
    tree = Renderer.create(React.createElement(r.default, { boss }), {
      createNodeMock: element => (element.type === "canvas" ? surface : null),
    });
  });
  return {
    tree,
    canvas: surface,
    r,
    ready: async () => {
      r.state.pending = null;
      if (finish) await Renderer.act(async () => finish(atlas));
    },
  };
};
const update = async (host, boss, frozen = false) => {
  await Renderer.act(async () => host.tree.update(React.createElement(host.r.default, { boss, frozen })));
};

for (let id = 1; id <= 50; id++) {
  const original = before.moveSectorBoss(before.createSectorBoss(id * 10, 430, 96, 825), 10000, 430, 825);
  const atlas = await loadImage(fs.readFileSync(root + "public" + original.config.weaponImage));
  for (const dpr of [1, 1.5, 2, 3]) {
    const startA = before.state.owned.length,
      startB = after.state.owned.length;
    let boss = { ...original, weaponClock: 10000, turrets: original.turrets.map(t => ({ ...t, lastFired: 0 })) };
    const delayed = id === 1 && dpr === 1;
    const a = await mount(before, boss, atlas, dpr, delayed),
      b = await mount(after, boss, atlas, dpr, delayed);
    if (delayed) {
      compare(a, b, "loading-fallback");
      await a.ready();
      await b.ready();
    }
    const both = async (label, frozen = false) => {
      await update(a, boss, frozen);
      await update(b, boss, frozen);
      compare(a, b, id + "/" + dpr + "/" + label);
    };
    compare(a, b, id + "/" + dpr + "/initial-live");
    boss = {
      ...boss,
      weaponClock: 10050,
      turrets: boss.turrets.map((t, i) => ({
        ...t,
        a: 0.25 + i * 0.1,
        health: t.maxHealth * 0.4,
        lastFired: 10000,
        firedBarrels: [0],
      })),
    };
    await both("live-heat-recoil");
    boss = {
      ...boss,
      weaponClock: 10300,
      turrets: boss.turrets.map((t, i) => ({ ...t, health: i === 0 ? 0 : t.health, a: t.a + 0.1 })),
    };
    await both("partial-destruction");
    boss = { ...boss, turrets: boss.turrets.map(t => ({ ...t, health: 0 })) };
    const redrawA = a.canvas.clears(),
      redrawB = b.canvas.clears();
    await both("all-destroyed");
    const staticSurfaces = after.state.owned.length;
    const updates = id === 7 && dpr === 3 ? 600 : 5;
    for (let frame = 0; frame < updates; frame++) {
      boss = {
        ...boss,
        x: boss.x + 0.05,
        y: boss.y + 0.03,
        weaponClock: boss.weaponClock + 33,
        turrets: boss.turrets.map(t => ({ ...t, a: t.a + 0.01 })),
      };
      await update(a, boss);
      await update(b, boss);
    }
    compare(a, b, id + "/" + dpr + "/retained-static");
    assert.equal(after.state.owned.length, staticSurfaces, "static reuse creates no additional canvas");
    assert.equal(a.canvas.clears() - redrawA, updates + 1);
    assert.equal(b.canvas.clears() - redrawB, 1, "one draw when the last turret falls; no repeated static draws");
    if (id === 7 && dpr === 3)
      staticPhase = {
        updates,
        baselineRedraws: a.canvas.clears() - redrawA,
        candidateRedraws: b.canvas.clears() - redrawB,
      };
    await both("falling-frozen", true);
    boss = { ...boss, width: boss.width + 0.00001 };
    await both("fractional-geometry");
    before.scope.window.devicePixelRatio = after.scope.window.devicePixelRatio = dpr === 1 ? 2 : 1;
    await both("DPR-change");
    for (const event of ["contextlost", "contextrestored"]) {
      a.canvas.width = a.canvas.width;
      b.canvas.width = b.canvas.width;
      a.canvas.dispatch(event);
      b.canvas.dispatch(event);
      boss = { ...boss };
      await both(event + "-retry");
    }
    a.canvas.width = a.canvas.width;
    b.canvas.width = b.canvas.width;
    a.canvas.dispatch("contextrestored");
    b.canvas.dispatch("contextrestored");
    a.canvas.failOnce = b.canvas.failOnce = true;
    boss = { ...boss };
    await both("null-main-context");
    boss = { ...boss };
    await both("main-context-retry");
    before.state.failAux = after.state.failAux = true;
    boss = { ...boss, width: boss.width + 2 };
    await both("null-temporary-context");
    boss = { ...boss };
    await both("temporary-context-retry");
    boss = { ...boss, turrets: boss.turrets.map((t, i) => ({ ...t, health: i === 0 ? 1 : 0 })) };
    await both("live-again");
    boss = { ...boss, turrets: boss.turrets.map(t => ({ ...t, health: 0 })), config: { ...boss.config } };
    await both("config-texture-refresh");
    await Renderer.act(async () => {
      a.tree.unmount();
      b.tree.unmount();
    });
    assert.equal(a.canvas.listeners.size, 0);
    assert.equal(b.canvas.listeners.size, 0);
    assert.equal(a.canvas.width, 0);
    assert.equal(b.canvas.width, 0);
    for (const c of after.state.owned.slice(startB))
      assert.equal(c.width * c.height, 0, "every candidate surface, including a failed temporary layer, is released");
    // The official source leaves its failed temporary layer to GC; other owned
    // layers are already covered by the existing disposal tests.
    before.state.owned.splice(startA);
    after.state.owned.splice(startB);
    cases++;
  }
}
const result = {
  passed: true,
  officialCommit: official,
  bosses: 50,
  DPR: [1, 1.5, 2, 3],
  cases,
  exactPixelComparisons: compared,
  staticPhase,
  checks: [
    "real React effects and original atlases",
    "live/heat/recoil, partial and full destruction",
    "static and frozen output retained without another surface",
    "fractional geometry and DPR invalidation",
    "context lost/restored retries",
    "null main/temporary context retries",
    "live/config/texture changes invalidate static output",
    "listeners and every candidate canvas released on unmount",
  ],
  limits:
    "Native raster and React host; not Safari/Pi Browser, physical iPhone FPS, GPU/process memory or proof of the whitescreen cause.",
};
fs.writeFileSync(
  process.env.CRYPTOID_STATIC_WEAPONS_REPORT || "/tmp/cryptoid-static-boss-weapons.json",
  JSON.stringify(result, null, 2) + "\n"
);
console.log(JSON.stringify(result, null, 2));
