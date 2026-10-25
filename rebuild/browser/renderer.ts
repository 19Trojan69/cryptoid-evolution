import type { BattleState } from '../core/battle.ts';
import { enemyAppearance } from '../core/appearance.ts';
import { ResourcePool } from '../core/resources.ts';
import { loadTexture, imageReservation, type ImageSpec, type Texture } from './textures.ts';
import { staticHullAsset } from '../../frontend/src/pages/staticHullAssets.ts';
import { shipEvolutionAsset } from '../../frontend/src/pages/shipEvolution.ts';
import { enemyVisualDiameter } from '../../frontend/src/pages/shipDisplayScale.ts';
import { drawBossWeapons, disposeBossWeapons, weaponCanvasSize } from '../../frontend/src/pages/bossWeaponRenderer.ts';
import { bossWeapons } from '../../frontend/src/pages/bossWeapons.ts';
import { createProjectilePresentation } from '../../frontend/src/pages/projectilePresentation.ts';

export const shipSpec = (sprite: number, color: Parameters<typeof staticHullAsset>[1], edition: 1 | 2 | 3): ImageSpec => {
  const asset = staticHullAsset(sprite, color, edition);
  if (!asset) throw new Error('Missing released painted hull');
  return { url: asset.url, maxWidth: 282, maxHeight: 282, maxEncodedBytes: 512_000 };
};
let surfaceSequence = 0;

/** Isolated actor renderer, not yet an appearance-complete replacement. Uses
 * original full-resolution PNGs, original mounted weapons and projectile CSS.
 * The host owns its last frame, technical-pause UI and scene handoff. */
export async function prepareBattleRenderer(canvas: HTMLCanvasElement, projectileMount: HTMLDivElement,
  initial: Readonly<BattleState>, pool: ResourcePool<Texture>, onLost: () => void, signal: AbortSignal) {
  if (signal.aborted) throw new Error('Closed scene preparation');
  const scope = pool.createScope(), textures = new Map<string, Texture>();
  const output = canvas.getContext('2d');
  const back = document.createElement('canvas'), context = back.getContext('2d');
  if (!context || !output) { scope.close(); back.width = back.height = 0; throw new Error('Canvas unavailable'); }
  const lifetime = new AbortController();
  canvas.addEventListener('contextlost', event => { event.preventDefault(); onLost(); }, { signal: lifetime.signal });
  let closed = false;
  const ratio = Math.max(1, Math.min(1.5, window.devicePixelRatio || 1));
  const guns = document.createElement('canvas');
  const projectiles = createProjectilePresentation(projectileMount);
  const add = async (spec: ImageSpec) => {
    if (textures.has(spec.url)) return;
    const lease = await scope.acquire(spec.url, imageReservation(spec), signal => loadTexture(spec, signal));
    if (!closed) textures.set(spec.url, lease.value);
  };
  // Private single-encounter fixture: preload that encounter's complete finite
  // normal flight plan. Dynamic bonus/next-scene handoff remains a later gate.
  const initialSpecs: ImageSpec[] = [shipSpec(1, 'silver', initial.edition)];
  if (initial.boss) {
    const config = initial.boss.config, gunsConfig = bossWeapons[config.id - 1];
    const atlasHeight = Math.max(...gunsConfig.flatMap(gun => [gun.sprite, gun.shadow, gun.socket].map(rect => rect.y + rect.height))) + 2;
    initialSpecs.push({ url: config.image, maxWidth: 1000, maxHeight: 2048, maxEncodedBytes: 2_000_000 },
      { url: config.weaponImage, maxWidth: 2048, maxHeight: atlasHeight, maxEncodedBytes: 2_000_000 });
  } else {
    for (let index = 0; index < 18; index++) {
      const appearance = enemyAppearance(initial.stage, index);
      initialSpecs.push(shipSpec(appearance.sprite, appearance.color, 1));
    }
  }
  const dispose = () => {
    if (closed) return; closed = true; signal.removeEventListener('abort', dispose); lifetime.abort();
    scope.close(); textures.clear(); projectiles.dispose();
    disposeBossWeapons(guns); canvas.width = canvas.height = back.width = back.height = 0;
  };
  signal.addEventListener('abort', dispose, { once: true });
  try {
    const pixelWidth = Math.ceil(initial.field.width * ratio), pixelHeight = Math.ceil(initial.field.height * ratio);
    const size = initial.boss ? weaponCanvasSize(initial.boss) : null;
    const gunWidth = size ? Math.ceil(size.width * ratio) : 0, gunHeight = size ? Math.ceil(size.height * ratio) : 0;
    // Reserve the visible/back surfaces, original weapon base and each gun's
    // one possible heat tile before allocating. This is a managed upper bound,
    // not a measurement of the browser process or GPU memory.
    const heatPixels = initial.boss ? bossWeapons[initial.boss.config.id - 1].reduce((sum, gun) => sum + gun.sprite.width * gun.sprite.height, 0) : 0;
    const surfaceBytes = (pixelWidth * pixelHeight * 2 + gunWidth * gunHeight * 2 + heatPixels) * 4;
    await scope.acquire(`scene-surfaces:${++surfaceSequence}`, surfaceBytes, async () => {
      canvas.width = back.width = pixelWidth; canvas.height = back.height = pixelHeight;
      guns.width = gunWidth; guns.height = gunHeight;
      return { value: { source: back, width: pixelWidth, height: pixelHeight }, bytes: surfaceBytes,
        dispose: () => { disposeBossWeapons(guns); canvas.width = canvas.height = back.width = back.height = 0; } };
    });
    const unique = [...new Map(initialSpecs.map(spec => [spec.url, spec])).values()];
    await Promise.all(unique.map(add));
  } catch (error) { dispose(); throw error; }
  return {
    present(state: Readonly<BattleState>) {
      if (closed) throw new Error('Closed renderer');
      if (state.stage !== initial.stage) throw new Error('Next encounter requires a prepared scene');
      context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, initial.field.width, initial.field.height);
      const draw = (url: string, x: number, y: number, diameter: number, angle = 0) => {
        const image = textures.get(url); if (!image) throw new Error('Unprepared actor texture');
        context.save(); try { context.translate(x, y); context.rotate(angle); context.drawImage(image.source, -diameter / 2, -diameter / 2, diameter, diameter); }
        finally { context.restore(); }
      };
      for (const enemy of state.enemies) {
        if (enemy.cloaked) continue;
        const appearance = enemyAppearance(state.stage, enemy.appearanceIndex), spec = shipSpec(appearance.sprite, appearance.color, 1);
        draw(spec.url, enemy.x, enemy.y, enemyVisualDiameter(enemy.radius, state.field.playerDiameter, enemy.radius === 25), Math.PI + enemy.visualMotion.bank * Math.PI / 180);
      }
      if (state.boss && state.phase !== 'intro') {
        const boss = state.boss, hull = textures.get(boss.config.image), weapon = textures.get(boss.config.weaponImage);
        if (!hull || !weapon) throw new Error('Unprepared boss texture');
        context.drawImage(hull.source, boss.x - boss.width / 2, boss.y - boss.height / 2, boss.width, boss.height);
        if (!drawBossWeapons(guns, boss, weapon.source)) throw new Error('Mounted weapon canvas unavailable');
        const size = weaponCanvasSize(boss);
        context.drawImage(guns, boss.x - boss.width / 2 - size.padX, boss.y - boss.height / 2 - size.padY, size.width, size.height);
      }
      if (state.hearts) draw(shipSpec(1, 'silver', state.edition).url, state.player.x * state.field.width, state.player.y * state.field.height, state.field.playerDiameter);
      projectiles.present({ shots: state.shots, enemyShots: state.enemyShots });
      // Commit only a complete actor frame. A mid-draw failure retains the last
      // visible frame so the host can present its technical pause over it.
      output.setTransform(1, 0, 0, 1, 0, 0); output.clearRect(0, 0, canvas.width, canvas.height); output.drawImage(back, 0, 0);
    },
    stats: () => ({ pool: pool.stats(), visibleAndWorkingCanvasBytes: (canvas.width * canvas.height + back.width * back.height + guns.width * guns.height) * 4,
      projectileNodes: projectiles.size, closed, stage: initial.stage }),
    dispose,
  };
}
