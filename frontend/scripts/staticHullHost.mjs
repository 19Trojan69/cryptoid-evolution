// Execute the actual loader/cache or its preceding source. Native raster work
// is counted; this host does not emulate iPhone/WebKit process memory.
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url).pathname;
export const previousHullSource = 'ab587934596011a05294ead81490ee510efac8a0';
export const turn = () => new Promise(resolve => setImmediate(resolve));
export async function until(check) {
  for (let i = 0; i < 10000; i++) { if (check()) return; await turn(); }
  throw new Error('Image readiness host did not settle');
}

export async function staticHullHost({ before = false, holdLoads = false, holdDecode = false, failLoad = 0, failDecode = 0 } = {}) {
  const source = before ? execFileSync('git', ['show', `${previousHullSource}:frontend/src/pages/paintedShip.ts`], { cwd: root, encoding: 'utf8' })
    : fs.readFileSync(root + 'src/pages/paintedShip.ts', 'utf8');
  const bundle = await build({ absWorkingDir: root, stdin: {
    contents: source + '\nexport const __qaTouchHull = h => cache.get(`${h.sprite}:${h.stage ?? 1}:${h.color}`);',
    resolveDir: root + 'src/pages', loader: 'ts',
  }, bundle: true, write: false, platform: 'node', format: 'cjs', logLevel: 'silent', plugins: [{ name: 'bounded-image-host', setup(b) {
    b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'host' }));
    b.onLoad({ filter: /.*/, namespace: 'host' }, () => ({ loader: 'js', contents: 'export const useState=(...a)=>globalThis.__hooks.state(...a);export const useEffect=(...a)=>globalThis.__hooks.effect(false,...a);' }));
  } }] });
  const urls = new Map(), requested = new Set(), loads = [], decodes = [];
  const counters = { images: 0, canvases: 0, readbacks: 0, encodes: 0, objectURLs: 0, revoked: 0, liveCanvasBytes: 0, maxCanvasBytes: 0 };
  let lastPNG;
  class Image {
    onload = null; onerror = null; native = null;
    constructor() { counters.images++; }
    get naturalWidth() { return this.native?.width ?? 0; }
    get naturalHeight() { return this.native?.height ?? 0; }
    get src() { return this.url; }
    set src(url) {
      this.url = url; requested.add(url);
      if (holdLoads) loads.push(this);
      else void this.load();
    }
    async load() {
      try {
        if (failLoad > 0) { failLoad--; throw new Error('Controlled load failure'); }
        const input = this.url.startsWith('blob:') ? Buffer.from(await urls.get(this.url).arrayBuffer()) : fs.readFileSync(root + 'public' + this.url);
        this.native = await loadImage(input); this.onload?.();
      } catch { this.onerror?.(); }
    }
    decode() {
      if (failDecode > 0) { failDecode--; return Promise.reject(new Error('Controlled decode failure')); }
      return holdDecode ? new Promise((resolve, reject) => decodes.push({ resolve, reject })) : Promise.resolve();
    }
  }
  function makeCanvas() {
    const native = createCanvas(1, 1), context = native.getContext('2d');
    let width = 0, height = 0; counters.canvases++;
    const resized = (w, h) => {
      counters.liveCanvasBytes += (w * h - width * height) * 4;
      counters.maxCanvasBytes = Math.max(counters.maxCanvasBytes, counters.liveCanvasBytes);
      width = w; height = h;
    };
    return {
      get width() { return width; }, set width(w) { resized(w, height); native.width = Math.max(1, w); },
      get height() { return height; }, set height(h) { resized(width, h); native.height = Math.max(1, h); },
      getContext() { return new Proxy(context, { get(target, key) {
        if (key === 'drawImage') return (image, ...args) => target.drawImage(image.native ?? image, ...args);
        if (key === 'getImageData') return (...args) => { counters.readbacks++; return target.getImageData(...args); };
        const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
      }, set(target, key, value) { target[key] = value; return true; } }); },
      toBlob(callback, type) {
        counters.encodes++; lastPNG = native.toBuffer('image/png');
        queueMicrotask(() => callback(new Blob([lastPNG], { type })));
      },
    };
  }
  const scope = { Image, Uint8ClampedArray, Blob, console, performance,
    URL: { createObjectURL(blob) { const url = 'blob:painting-' + ++counters.objectURLs; urls.set(url, blob); return url; },
      revokeObjectURL(url) { counters.revoked++; urls.delete(url); } },
    window: { setTimeout: callback => setImmediate(callback), location: { hostname: 'localhost' }, localStorage: { getItem: () => null } },
    document: { createElement: makeCanvas }, module: { exports: {} }, exports: {},
  };
  scope.module.exports = scope.exports; vm.runInNewContext(bundle.outputFiles[0].text, scope);
  return { api: scope.module.exports, counters, urls, requested, loads, decodes, png: () => lastPNG,
    setHooks(host) { scope.__hooks = host; } };
}
