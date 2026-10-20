// Read-only audit of the released source. These assertions demonstrate existing
// failure paths; this is not a regression suite or a physical iPhone memory test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url).pathname;
const bundle = await build({ absWorkingDir: root, stdin: { contents: `
export {loadBossArtwork} from './bossArtwork.ts';
export {loadShipArtwork} from './shipArtwork.ts';
export {drawBossWeapons,disposeBossWeapons} from './bossWeaponRenderer.ts';
export {createSectorBoss} from './sectorBoss.ts';
export {preloadBossWeapons} from './bossWeaponTextures.ts';`,
  resolveDir: root + 'src/pages', loader: 'ts' }, bundle: true, write: false,
  platform: 'node', format: 'cjs', logLevel: 'silent' });

function runtime({ mode = 'healthy', deferredImages = false } = {}) {
  const surfaces = [], images = [];
  const document = { createElement(tag) {
    assert.equal(tag, 'canvas');
    const index = surfaces.length + 1;
    const c = { width: 300, height: 150, dataset: {}, getContext() {
      if (mode === 'base-context-throws' && index === 2) throw Error('controlled base context failure');
      if (mode === 'boss-combined-null' && index === 3 ||
          mode === 'boss-output-null' && index === 4 ||
          mode === 'ship-source-null' && index === 1 ||
          mode === 'ship-output-null' && index === 2 ||
          mode === 'boss-guns-null' && index === 1) return null;
      return context;
    } };
    const context = new Proxy({
      drawImage() { if (mode === 'base-draw-throws' && index === 2) throw Error('controlled base paint failure'); },
      getImageData(x, y, w, h) {
        if (mode === 'readback-throws') throw Error('controlled readback failure');
        const data = new Uint8ClampedArray(w * h * 4);
        if (mode !== 'empty') data.fill(255);
        return { data };
      },
      createLinearGradient() { return { addColorStop() {} }; },
    }, { get: (target, key) => target[key] ?? (() => {}) });
    surfaces.push(c); return c;
  } };
  class Image {
    constructor() { this.width = this.naturalWidth = 64; this.height = this.naturalHeight = 96; images.push(this); }
    set src(value) { this.url = value; if (!deferredImages) queueMicrotask(() => this.onload?.()); }
  }
  const scope = { module: { exports: {} }, exports: {}, document, Image, console };
  scope.exports = scope.module.exports;
  vm.runInNewContext(bundle.outputFiles[0].text, scope);
  return { api: scope.module.exports, surfaces, images, document,
    nonzero: () => surfaces.map((c, i) => ({ index: i + 1, width: c.width, height: c.height }))
      .filter(c => c.width * c.height > 0) };
}

const results = {};
for (const mode of ['base-context-throws', 'base-draw-throws']) {
  const h = runtime({ mode }), main = h.document.createElement('canvas');
  main.width = 600; main.height = 1200;
  const boss = h.api.createSectorBoss(70, 430, 96, 825);
  assert.throws(() => h.api.drawBossWeapons(main, boss, { width: 1000, height: 1000 }, true), /controlled base/);
  h.api.disposeBossWeapons(main);
  const remainder = h.nonzero();
  assert.equal(remainder.length, 1);
  assert.equal(remainder[0].index, 2);
  results[mode] = { failedBaseSurfacesNotExplicitlyReleasedAfterDispose: remainder.length,
    nominalRGBABytes: remainder[0].width * remainder[0].height * 4 };
}

for (const mode of ['healthy', 'boss-combined-null', 'boss-output-null', 'readback-throws', 'empty', 'boss-guns-null']) {
  const h = runtime({ mode });
  const task = h.api.loadBossArtwork(7, 256);
  if (mode === 'healthy' || mode === 'boss-guns-null') {
    const output = await task;
    const temporary = h.nonzero().filter(s => h.surfaces[s.index - 1] !== output);
    assert.equal(temporary.length, mode === 'healthy' ? 1 : 0);
    results['boss-artwork-' + mode] = { temporarySurfacesNotExplicitlyReleased: temporary,
      returnsArtworkDespiteUnavailableWeapons: mode === 'boss-guns-null' };
  } else {
    await assert.rejects(task, /Canvas unavailable|controlled readback|Empty boss/);
    assert.ok(h.nonzero().length >= 3);
    results['boss-artwork-' + mode] = { failedSurfacesNotExplicitlyReleased: h.nonzero() };
  }
}
for (const mode of ['healthy', 'ship-source-null', 'ship-output-null', 'readback-throws', 'empty']) {
  const h = runtime({ mode });
  const task = h.api.loadShipArtwork('/ships/ship_01_stage1.png');
  if (mode === 'healthy') {
    const output = await task;
    assert.equal(h.surfaces[0].width * h.surfaces[0].height, 0);
    results['ship-artwork-' + mode] = { outputRetainedAsExpected: output.width * output.height > 0 };
  } else {
    await assert.rejects(task, /Canvas unavailable|controlled readback|Empty ship/);
    assert.ok(h.nonzero().length > 0);
    results['ship-artwork-' + mode] = { failedSurfacesNotExplicitlyReleased: h.nonzero() };
  }
}

{
  const h = runtime({ deferredImages: true });
  const config = id => ({ id, weaponImage: `/boss-${id}.webp` });
  const first = h.api.preloadBossWeapons(config(1));
  const second = h.api.preloadBossWeapons(config(2));
  const third = h.api.preloadBossWeapons(config(3));
  const repeated = h.api.preloadBossWeapons(config(1));
  assert.notEqual(first, repeated);
  assert.equal(h.images.length, 4);
  for (const image of h.images) image.onload();
  await Promise.all([first, second, third, repeated]);
  results.pendingBossTextures = { uniqueURLs: 3, imageObjects: 4, samePendingRequestShared: false };
}

{
  // Execute the unchanged private texture function, without React or diagnostics.
  const source = fs.readFileSync(root + 'src/pages/BonusRockLayer.tsx', 'utf8');
  const textureSource = source.slice(source.indexOf('const textures ='), source.indexOf('const BonusRockLayer ='));
  assert.ok(textureSource.includes('function rockTexture('));
  const rockBundle = await build({ stdin: { contents: textureSource + '\nexport {rockTexture};', loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'cjs', logLevel: 'silent' });
  const h = runtime({ mode: 'ship-source-null' });
  const scope = { module: { exports: {} }, exports: {}, document: h.document };
  scope.exports = scope.module.exports;
  vm.runInNewContext(rockBundle.outputFiles[0].text, scope);
  assert.throws(() => scope.module.exports.rockTexture(0), /translate/);
  assert.equal(h.nonzero().length, 1);
  results.bonusRockNullContext = { throwsInsteadOfReportingUnavailable: true,
    failedSurfaceNotExplicitlyReleased: h.nonzero()[0], nominalRGBABytes: 192 * 192 * 4,
    caller: 'Also called by the uncaught setTimeout prewarm callback in BonusRockLayer.' };
}

const report = { sourceCommit: 'b15306f2d22d2196275091c904d068829879efc7',
  runtimeFilesModified: false, demonstratedExistingPaths: results,
  limits: 'Actual source in a controlled Canvas/Image host. Surfaces are deliberately tracked to inspect explicit cleanup; a browser may reclaim them via GC. No observed iPhone allocation denial, permanent leak, native/GPU/process-memory or Whitescreen-cause proof. Duplicate Image objects need not cause duplicate network transfers due to browser caching.' };
if (process.env.CRYPTOID_ADDITIONAL_RESOURCE_REPORT) fs.writeFileSync(process.env.CRYPTOID_ADDITIONAL_RESOURCE_REPORT, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
