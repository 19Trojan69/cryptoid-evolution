import type { PlayerShot } from './playerCombat.ts';
import { enemyProjectileProfiles, type EnemyShot } from './enemyFire.ts';

type ShotState = { shots: readonly PlayerShot[]; enemyShots: readonly EnemyShot[] };
type Entry = { node: HTMLDivElement; position: string; appearance: string; seen: number };

// This empty React-owned mount reserves its children for the game loop. Keep
// projectile motion on that existing <=60-Hz clock, independently of the heavier
// scene's compact-phone backpressure. No extra RAF, extrapolation or collision
// state: each position is the final simulated position for the current frame.
export function createProjectilePresentation(mount: HTMLDivElement) {
  const document = mount.ownerDocument;
  const groups = [document.createElement('div'), document.createElement('div')];
  const entries = [new Map<number, Entry>(), new Map<number, Entry>()];
  let revision = 0;
  for (const group of groups) { group.style.display = 'contents'; mount.appendChild(group); }
  const place = (group: number, shot: PlayerShot | EnemyShot, className: string, properties: readonly (readonly [string, string])[]) => {
    const cache = entries[group];
    let entry = cache.get(shot.id);
    if (!entry) {
      const node = document.createElement('div');
      node.style.left = '0px'; node.style.top = '0px';
      entry = { node, position: '', appearance: '', seen: revision };
      cache.set(shot.id, entry); groups[group].appendChild(node);
    }
    entry.seen = revision;
    const appearance = className + properties.map(([key, value]) => `;${key}:${value}`).join('');
    if (appearance !== entry.appearance) {
      entry.node.className = className;
      for (const [key, value] of properties) entry.node.style.setProperty(key, value);
      entry.appearance = appearance;
    }
    const position = `${shot.x}px ${shot.y}px`;
    if (position !== entry.position) {
      // Independent translation preserves every authored centering/rotation,
      // gradient, trail and boss projectile shape without moving layout boxes.
      entry.node.style.translate = position;
      entry.position = position;
    }
  };
  return {
    present(state: ShotState) {
      revision++;
      for (const shot of state.shots) place(0, shot,
        `player-laser player-laser-tier-${shot.visualLevel ?? 1}${shot.empowered && shot.visualLevel !== 5 ? ' player-laser-overdrive' : ''}`, []);
      for (const shot of state.enemyShots) place(1, shot,
        `enemy-laser${shot.enemyClass ? ` enemy-projectile-${shot.enemyClass}` : ''}${shot.bossKind ? ` boss-projectile boss-projectile-${shot.bossKind}` : ''}${shot.weaponKind ? ` boss-evolved-shot boss-evolved-${shot.weaponKind}` : ''}`, [
          ['width', shot.enemyClass ? `${shot.radius * 2}px` : ''],
          ['height', shot.enemyClass === 'medium' || shot.enemyClass === 'heavy' ? `${shot.radius * 2}px` : ''],
          ['--enemy-shot-color', shot.enemyClass ? enemyProjectileProfiles[shot.enemyClass].color : ''],
          ['--shot-angle', `${-Math.atan2(shot.vx, shot.vy) * 180 / Math.PI}deg`],
          ['--boss-shot-color', shot.weaponKind ? shot.weaponColor ?? '' : ''],
          ['--boss-shot-width', shot.weaponKind ? `${shot.weaponWidth}px` : ''],
          ['--boss-shot-diameter', shot.weaponKind ? `${shot.radius * 2}px` : ''],
        ]);
      for (const cache of entries) for (const [id, entry] of cache) if (entry.seen !== revision) {
        entry.node.remove(); cache.delete(id);
      }
    },
    dispose() {
      for (const cache of entries) cache.clear();
      for (const group of groups) group.remove();
    },
    get size() { return entries[0].size + entries[1].size; },
  };
}
