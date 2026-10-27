// Actual CanvasImpact + paintedShip hook/cache, with browser URL reflection and
// native Skia image/Canvas operations. This is not a WebKit/process-memory host.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { Host } from './canvasHookHost.mjs';

const root = new URL('../', import.meta.url).pathname;
export const canvasUrlBaseline = '4a9941b623225cbc6d66719604122106aa57f17a';
export const documentURL = 'https://cryptoid-evolution-testnet.vercel.app/game';
const compiled = new Map();
const turn = () => new Promise(resolve => setImmediate(resolve));

async function compile(before, overrideHook) {
  const key = `${before}:${overrideHook}`;
  if (compiled.has(key)) return compiled.get(key);
  const source = before
    ? fs.readFileSync(new URL('./fixtures/canvas-static-url-before-20261022.txt', import.meta.url), 'utf8')
    : fs.readFileSync(root + 'src/pages/CanvasEffects.tsx', 'utf8');
  // Portable exact source control: production/shallow build checkouts do not
  // need an old local Git object to execute the negative and pixel controls.
  if (before) assert.equal(createHash('sha256').update(source).digest('hex'),
    'f9f862bad6cc19968c46b13c6045e3317c7a4e10b9080dea7083be8c579fbbd1', canvasUrlBaseline);
  const bundle = await build({ absWorkingDir: root, stdin: {
    contents: "export * from './CanvasEffects'; export {retainPreparedHulls,paintedShipResourceStats,usePaintedShipStyle} from './paintedShip';",
    resolveDir: root + 'src/pages', loader: 'ts',
  }, bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  define: { 'import.meta.env': '{}' }, logLevel: 'silent', plugins: [{ name: 'url-aware-native-hook-host', setup(b) {
    b.onLoad({ filter: /CanvasEffects\.tsx$/ }, () => ({ loader: 'tsx', contents: source }));
    b.onResolve({ filter: /^react(?:\/jsx-runtime)?$/ }, a => ({ path: a.path, namespace: 'hooks' }));
    b.onLoad({ filter: /.*/, namespace: 'hooks' }, a => ({ loader: 'js', contents: a.path.endsWith('jsx-runtime')
      ? 'export const Fragment="fragment";export const jsx=(type,props)=>({type,props});export const jsxs=jsx;'
      : 'export const createContext=value=>({value,Provider:"provider"});export const useContext=context=>globalThis.__availability??context.value;export const useState=(...a)=>globalThis.__hookHost.state(...a);export const useRef=(...a)=>globalThis.__hookHost.ref(...a);export const useMemo=(...a)=>globalThis.__hookHost.memo(...a);export const useEffect=(...a)=>globalThis.__hookHost.effect(false,...a);export const useLayoutEffect=(...a)=>globalThis.__hookHost.effect(true,...a);export default {Children:{toArray:value=>value?Array.isArray(value)?value:[value]:[]}};' }));
    // paintedShip.ts and PaintedShip.tsx are distinct existing modules. Resolve
    // this exact loader import before esbuild's case-insensitive path heuristic.
    b.onResolve({ filter: /\/paintedShip$/ }, a => overrideHook && a.importer.endsWith('CanvasEffects.tsx')
      ? { path: 'control-url', namespace: 'control' } : { path: root + 'src/pages/paintedShip.ts' });
    if (overrideHook) {
      b.onLoad({ filter: /.*/, namespace: 'control' }, () => ({ loader: 'js', contents:
        'export const usePaintedShipStyle=()=>({backgroundImage:"url("+globalThis.__testHullURL+")"});' }));
    }
  } }] });
  const code = bundle.outputFiles[0].text; compiled.set(key, code); return code;
}

export async function canvasStaticUrlHost({ before = false, hookURL, scale = 3, enabled = true, Path2DClass } = {}) {
  const code = await compile(before, hookURL !== undefined);
  const frames = new Map(), timers = new Map(), blobs = new Map(), canvases = [], held = [], requests = [], views = new Set(), observers = [];
  let clock = 100, serial = 0, paused = false, failure = () => false, hold = () => false;
  const counts = { decodes: 0, createdBlobs: 0, revokedBlobs: 0, nativeDraws: 0 };
  const makeCanvas = () => {
    const native = createCanvas(1, 1), context = native.getContext('2d'), listeners = new Map();
    let width = 0, height = 0, writes = 0;
    const canvas = { native, style: {}, listeners, contextAvailable: true,
      get width() { return width; }, set width(value) { width = value; native.width = Math.max(1, value); writes++; },
      get height() { return height; }, set height(value) { height = value; native.height = Math.max(1, value); writes++; },
      get writes() { return writes; },
      parentElement: { clientWidth: 430, clientHeight: 825, closest: () => ({ getAttribute: () => String(paused) }) },
      addEventListener(name, fn) { listeners.set(name, fn); }, removeEventListener(name) { listeners.delete(name); },
      getContext() { return this.contextAvailable ? proxy : null; },
    };
    const proxy = new Proxy(context, { get(target, name) {
      if (name === 'drawImage') return (image, ...args) => { counts.nativeDraws++; return target.drawImage(image.native ?? image, ...args); };
      const value = target[name]; return typeof value === 'function' ? value.bind(target) : value;
    }, set(target, name, value) { target[name] = value; return true; } });
    canvases.push(canvas); return canvas;
  };
  class BrowserImage {
    native = null; onload = null; onerror = null; absolute = ''; requested = '';
    get naturalWidth() { return this.native?.width ?? 0; }
    get naturalHeight() { return this.native?.height ?? 0; }
    get src() { return this.absolute; }
    set src(value) {
      this.requested = value; this.absolute = new URL(value, documentURL).href;
      requests.push(this); if (hold(value)) held.push(this); else void this.load();
    }
    async load() {
      try {
        if (failure(this.requested)) throw new Error('Controlled image load failure');
        const data = this.absolute.startsWith('blob:')
          ? Buffer.from(await blobs.get(this.absolute).arrayBuffer())
          : fs.readFileSync(root + 'public' + new URL(this.absolute).pathname);
        this.native = await loadImage(data); this.onload?.();
      } catch (error) { this.onerror?.(error); }
    }
    decode() { counts.decodes++; return Promise.resolve(); }
  }
  class BrowserURL extends URL {
    static createObjectURL(blob) { const url = `blob:effect-${++serial}`; blobs.set(url, blob); counts.createdBlobs++; return url; }
    static revokeObjectURL(url) { blobs.delete(url); counts.revokedBlobs++; }
  }
  const scope = { Image: BrowserImage, URL: BrowserURL, Blob, Uint8ClampedArray, console, Path2D: Path2DClass,
    performance: { now: () => clock }, __testHullURL: hookURL,
    window: { devicePixelRatio: scale, location: { hostname: 'cryptoid-evolution-testnet.vercel.app' },
      setTimeout(fn, delay) {
        const id = ++serial; timers.set(id, { fn, at: clock + delay });
        if (!delay) queueMicrotask(() => { if (timers.delete(id)) fn(); }); return id;
      }, clearTimeout(id) { timers.delete(id); },
    },
    document: { createElement: makeCanvas },
    ResizeObserver: class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} disconnect() {} },
    requestAnimationFrame(fn) { const id = ++serial; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); }, reportError(error) { throw error; },
    module: { exports: {} }, exports: {},
  };
  scope.module.exports = scope.exports; vm.runInNewContext(code, scope);
  const api = scope.module.exports, surface = makeCanvas();
  const makeHost = (component, props, canvas = null) => new Host(props => {
    scope.__hookHost = globalThis.__hookHost; return component(props);
  }, props, canvas);
  const owner = makeHost(api.CanvasEffectLayer, { enabled, children: null }, surface);
  const sync = () => {
    const availability = owner.render().props.value;
    if (scope.__availability !== availability) for (const view of views) view.dirty = true;
    scope.__availability = availability; owner.passive();
    for (const view of views) { view.render(); view.passive(); }
  };
  sync();
  const stats = () => api.canvasEffectResources();
  const waitFor = async check => {
    const deadline = performance.now() + 5000;
    while (performance.now() < deadline) { sync(); if (check()) return; await turn(); }
    throw new Error('Actual Canvas/style hook integration did not settle');
  };
  const mount = (effect, debris = null) => {
    const original = { type: 'original-css-fallback' }, view = makeHost(api.CanvasImpact, { effect, debris, original });
    view.original = original; views.add(view); sync(); return view;
  };
  const unmount = view => { view.unmount(); views.delete(view); };
  const tick = at => {
    clock = at;
    for (const [id, frame] of [...frames]) { frames.delete(id); frame(clock); }
    assert.ok(frames.size <= 1, 'the actual shared scheduler must not fork'); sync();
  };
  const close = () => {
    for (const view of [...views]) unmount(view); owner.unmount();
    assert.equal(stats().registeredEffects, 0); assert.equal(stats().cacheBytes, 0);
    assert.equal(frames.size, 0); assert.equal(timers.size, 0); assert.equal(surface.listeners.size, 0);
    assert.ok(canvases.every(c => c.width === 0 && c.height === 0));
    assert.equal(api.paintedShipResourceStats().retainCount, 0);
  };
  return { api, surface, stats, requests, held, frames, timers, blobs, counts, mount, unmount, sync, tick, waitFor, close,
    fallback: view => view.output?.props?.children === view.original,
    async prepare(hull) { const plan = api.retainPreparedHulls([hull]); assert.ok((await plan.settled).every(Boolean)); return plan; },
    setHold(fn) { hold = fn; }, setFailure(fn) { failure = fn; }, setPaused(value) { paused = value; },
    setScale(value) { scope.window.devicePixelRatio = value; for (const observer of observers) observer.callback(); sync(); },
    setURL(url) { scope.__testHullURL = url; for (const view of views) view.dirty = true; sync(); },
    async releaseHeld() { await Promise.all(held.splice(0).map(image => image.load())); await turn(); sync(); },
    addBlob(url, data) { blobs.set(url, new Blob([data], { type: 'image/png' })); },
    loseContext() { surface.listeners.get('contextlost')(); sync(); },
    snapshot() { return { width: surface.width, height: surface.height, style: { ...surface.style },
      pixels: Buffer.from(surface.native.getContext('2d').getImageData(0, 0, surface.width, surface.height).data) }; },
  };
}
