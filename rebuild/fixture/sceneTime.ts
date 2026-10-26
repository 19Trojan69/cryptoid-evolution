// Local fixed-scene time attribution, not a playable-game or crash-fix test.
// Keep the same original three images and one renderer for the entire run.
import { createBattle } from '../core/battle.ts';
import { ResourcePool } from '../core/resources.ts';
import { prepareBattleRenderer, shipSpec } from '../browser/renderer.ts';
import { bossImageSpecs } from '../browser/originalBossAssets.ts';
import type { Texture, TextureDecoder } from '../browser/textures.ts';

type Mode = 'held' | 'static' | 'motion';
const parameters = new URLSearchParams(location.search);
const mode = parameters.get('mode') as Mode;
const decoder = parameters.get('decoder') as TextureDecoder;
if (!['held', 'static', 'motion'].includes(mode) || !['image', 'blob-image', 'bitmap'].includes(decoder))
  throw new Error('Explicit time control required');
const field = { width: 367, height: 590, hudBottom: 28, playerDiameter: 94 };
const state = createBattle({ stage: 40, field });
if (!state.boss) throw new Error('Original boss 4 required');
state.phase = 'combat'; state.sectionMs = 4900; state.boss.elapsed = 1800;
for (const gun of state.boss.turrets) gun.health = gun.maxHealth * .5;
const initial = { x: state.boss.x, y: state.boss.y, angles: state.boss.turrets.map(gun => gun.a) };
const specs = [shipSpec(1, 'silver', 1), ...bossImageSpecs(state.boss.config)];
const pool = new ResourcePool<Texture>({ maxBytes: 96 * 1024 * 1024, maxEntries: 64, parallel: 2 });
const canvas = document.createElement('canvas'), projectiles = document.createElement('div');
canvas.width = canvas.height = 0;
canvas.style.cssText = `width:${field.width}px;height:${field.height}px`;
document.body.style.cssText = 'margin:0;background:#041423;overflow:hidden';
document.body.append(canvas, projectiles);
const controller = new AbortController();
let renderer: Awaited<ReturnType<typeof prepareBattleRenderer>> | null = null;
let phase: 'unprepared' | 'prepared' | 'running' | 'finished' | 'failed' | 'closed' = 'unprepared';
let frame: number | null = null, frames = 0, draws = 0, start = 0, elapsedMs = 0, durationMs = 0;
let maximumGapMs = 0, previousFrame = 0, failure = '';
const read = () => ({ mode, decoder, phase, elapsedMs, durationMs, frames, draws, maximumGapMs, failure,
  timeOrigin: performance.timeOrigin, stage: state.stage, bossId: state.boss?.config.id,
  resources: pool.stats(), canvas: { width: canvas.width, height: canvas.height },
  projectileNodes: projectiles.children.length, dom: document.getElementsByTagName('*').length,
  viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio } });
const close = () => {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null; controller.abort(); renderer?.dispose(); renderer = null; phase = 'closed';
  return read();
};
Object.assign(window, { __sceneTime: {
  read, specs: () => specs,
  async prepare() {
    if (phase !== 'unprepared') throw new Error('Exactly one scene preparation permitted');
    renderer = await prepareBattleRenderer(canvas, projectiles, state, pool,
      () => { failure = 'Native context lost'; phase = 'failed'; }, controller.signal, decoder);
    renderer.present(state); draws++; phase = 'prepared'; return read();
  },
  start(milliseconds: number) {
    if (phase !== 'prepared' || !Number.isSafeInteger(milliseconds) || milliseconds < 1000 || milliseconds > 1_200_000)
      throw new Error('Invalid fixed-scene time request');
    durationMs = milliseconds; start = performance.now(); previousFrame = start; phase = 'running';
    const tick = (now: number) => {
      frame = null;
      if (phase !== 'running') return;
      elapsedMs = now - start; maximumGapMs = Math.max(maximumGapMs, now - previousFrame); previousFrame = now; frames++;
      try {
        if (mode === 'motion') {
          // Controlled transforms only, with fixed texture identity/dimensions,
          // health/heat stage and node count; no combat or progress is simulated.
          const seconds = elapsedMs / 1000, boss = state.boss!;
          boss.x = initial.x + Math.sin(seconds * .43) * 28;
          boss.y = initial.y + Math.sin(seconds * .31) * 8;
          state.player.x = .5 + Math.sin(seconds * .73) * .25;
          for (let index = 0; index < boss.turrets.length; index++)
            boss.turrets[index].a = initial.angles[index] + Math.sin(seconds * .61 + index) * .7;
        }
        if (mode !== 'held') { renderer!.present(state); draws++; }
        if (elapsedMs >= durationMs) { phase = 'finished'; return; }
        frame = requestAnimationFrame(tick);
      } catch (error) { failure = String(error); phase = 'failed'; }
    };
    frame = requestAnimationFrame(tick); return read();
  },
  close,
} });
window.addEventListener('pagehide', close, { once: true });
