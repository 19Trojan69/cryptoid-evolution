// Local attribution control only. No CSS, sound, storage, account or network
// adapter is imported. Original assets and the existing renderer are unchanged.
import { bossManifest } from '../../frontend/src/pages/bossManifest.ts';
import { bossImageSpecs } from '../browser/originalBossAssets.ts';
import { shipSpec, prepareBattleRenderer } from '../browser/renderer.ts';
import { loadTexture, imageReservation, type Texture, type TextureDecoder } from '../browser/textures.ts';
import { createBattle } from '../core/battle.ts';
import { ResourcePool } from '../core/resources.ts';

type Mode = 'fetch-only' | 'decode-only' | 'prepare-only' | 'draw-dispose';
const params = new URLSearchParams(location.search);
const mode = params.get('mode') as Mode, decoder = params.get('decoder') as TextureDecoder;
if (!['fetch-only', 'decode-only', 'prepare-only', 'draw-dispose'].includes(mode)
  || !['bitmap', 'blob-image'].includes(decoder)) throw new Error('Explicit matched control required');
const geometry = { width: 367, height: 590, hudBottom: 28, playerDiameter: 94 };
const limits = { maxBytes: 96 * 1024 * 1024, maxEntries: 64, parallel: 2 };
const textures = new ResourcePool<Texture>(limits), encoded = new ResourcePool<Blob>(limits);
const canvas = document.createElement('canvas'), projectiles = document.createElement('div');
canvas.width = canvas.height = 0; canvas.style.width = `${geometry.width}px`; canvas.style.height = `${geometry.height}px`;
document.body.style.cssText = 'margin:0;background:#041423;overflow:hidden';
document.body.append(canvas, projectiles);
let active: { release: () => void } | null = null;
let cycle = -1, drawCalls = 0, decoded = 0, fetched = 0, confirmedImageDecodes = 0, closed = true;
let frames = 0;
const plan = bossManifest.map(config => [shipSpec(1, 'silver', 1), ...bossImageSpecs(config)]);
const receipt = () => ({ cycle, mode, decoder, closed, drawCalls, decoded, fetched, confirmedImageDecodes, frames,
  resources: mode === 'fetch-only' ? encoded.stats() : textures.stats(),
  canvas: { width: canvas.width, height: canvas.height }, dom: document.getElementsByTagName('*').length,
  viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio }, timeOrigin: performance.timeOrigin });

async function prepare(index: number) {
  if (active || !closed) throw new Error('Previous cycle still owns resources');
  if (!Number.isInteger(index) || index < 0) throw new Error('Invalid cycle');
  cycle = index; closed = false;
  const specs = plan[index % plan.length], controller = new AbortController();
  const scope = textures.createScope(), rawScope = encoded.createScope();
  let renderer: Awaited<ReturnType<typeof prepareBattleRenderer>> | null = null;
  const release = () => {
    if (closed) return;
    renderer?.dispose(); renderer = null; scope.close(); rawScope.close(); controller.abort(); closed = true; active = null;
  };
  active = { release };
  try {
    if (mode === 'fetch-only') {
      await Promise.all(specs.map(spec => rawScope.acquire(spec.url, imageReservation(spec, decoder), async signal => {
        const response = await fetch(spec.url, { signal, credentials: 'same-origin' });
        if (!response.ok) throw new Error('Original image unavailable');
        const blob = await response.blob();
        if (blob.size !== spec.maxEncodedBytes && spec.url !== specs[0].url) throw new Error('Original byte size changed');
        if (blob.size > spec.maxEncodedBytes) throw new Error('Encoded reservation exceeded');
        fetched++;
        return { value: blob, bytes: blob.size, dispose() {} };
      })));
    } else {
      // Identical fetch/decode and two producer slots in decode and draw arms.
      // onload alone can leave lazy native decoding pending. Explicit decode()
      // is awaited without drawing or reading pixels in BOTH arms.
      await Promise.all(specs.map(async spec => {
        const lease = await scope.acquire(`${decoder}:${spec.url}`, imageReservation(spec, decoder), async signal => {
          try { return await loadTexture(spec, signal, decoder); }
          catch (error) { throw new Error(`Control load ${spec.url}: ${String(error)}`); }
        });
        fetched++; decoded++;
        if (lease.value.source instanceof HTMLImageElement) {
          if (typeof lease.value.source.decode !== 'function') throw new Error('Image.decode unavailable');
          try { await lease.value.source.decode(); }
          catch (error) { throw new Error(`Control explicit decode ${spec.url}: ${String(error)}`); }
          confirmedImageDecodes++;
        }
      }));
      if (mode === 'draw-dispose' || mode === 'prepare-only') {
        const state = createBattle({ stage: bossManifest[index % plan.length].level, field: geometry });
        if (!state.boss) throw new Error('Expected original boss');
        state.phase = 'combat'; state.sectionMs = 4900; state.boss.elapsed = 1800;
        for (const gun of state.boss.turrets) gun.health = gun.maxHealth * .5;
        renderer = await prepareBattleRenderer(canvas, projectiles, state, textures,
          () => { throw new Error('Native renderer context lost'); }, controller.signal, decoder);
        // Original hull, mounted guns, heat tiles, player, back/visible commit.
        // A fixed frame is enough to exercise native allocation, with no combat
        // clock, screenshot, getImageData, toDataURL or retained frame history.
        for (let frame = 0; frame < 5; frame++) {
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
          if (mode === 'draw-dispose') { renderer.present(state); drawCalls++; }
        }
      } else for (let frame = 0; frame < 5; frame++) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
    if (mode === 'fetch-only') for (let frame = 0; frame < 5; frame++) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    frames += 5;
    return receipt();
  } catch (error) { release(); throw error; }
}

Object.assign(window, { __memoryStages: {
  plan: () => plan, read: receipt, prepare,
  release: () => { active?.release(); return receipt(); },
} });
window.addEventListener('pagehide', () => active?.release(), { once: true });
