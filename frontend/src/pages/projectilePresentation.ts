import type { PlayerShot } from './playerCombat.ts';
import { enemyProjectileProfiles, type EnemyShot } from './enemyFire.ts';

type ShotState = { shots: readonly PlayerShot[]; enemyShots: readonly EnemyShot[] };
type Appearance = Partial<PlayerShot & EnemyShot>;
type Entry = { node: HTMLDivElement; position: string; appearance: Appearance | null; seen: number };
const sameAppearance = (group: number, previous: Appearance, next: Appearance) => group === 0
  ? previous.visualLevel === next.visualLevel && previous.empowered === next.empowered
  : previous.enemyClass === next.enemyClass && previous.bossKind === next.bossKind
    && previous.weaponKind === next.weaponKind && previous.radius === next.radius
    && previous.vx === next.vx && previous.vy === next.vy
    && previous.weaponColor === next.weaponColor && previous.weaponWidth === next.weaponWidth;

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
  const place = (group: number, shot: PlayerShot | EnemyShot) => {
    const cache = entries[group];
    let entry = cache.get(shot.id);
    if (!entry) {
      const node = document.createElement('div');
      node.style.left = '0px'; node.style.top = '0px';
      entry = { node, position: '', appearance: null, seen: revision };
      cache.set(shot.id, entry); groups[group].appendChild(node);
    }
    entry.seen = revision;
    if (!entry.appearance || !sameAppearance(group, entry.appearance, shot)) {
      if (group === 0) {
        const player = shot as PlayerShot;
        entry.node.className = `player-laser player-laser-tier-${player.visualLevel ?? 1}${player.empowered && player.visualLevel !== 5 ? ' player-laser-overdrive' : ''}`;
      } else {
        const enemy = shot as EnemyShot;
        entry.node.className = `enemy-laser${enemy.enemyClass ? ` enemy-projectile-${enemy.enemyClass}` : ''}${enemy.bossKind ? ` boss-projectile boss-projectile-${enemy.bossKind}` : ''}${enemy.weaponKind ? ` boss-evolved-shot boss-evolved-${enemy.weaponKind}` : ''}`;
        for (const [key, value] of [
          ['width', enemy.enemyClass ? `${enemy.radius * 2}px` : ''],
          ['height', enemy.enemyClass === 'medium' || enemy.enemyClass === 'heavy' ? `${enemy.radius * 2}px` : ''],
          ['--enemy-shot-color', enemy.enemyClass ? enemyProjectileProfiles[enemy.enemyClass].color : ''],
          ['--shot-angle', `${-Math.atan2(enemy.vx, enemy.vy) * 180 / Math.PI}deg`],
          ['--boss-shot-color', enemy.weaponKind ? enemy.weaponColor ?? '' : ''],
          ['--boss-shot-width', enemy.weaponKind ? `${enemy.weaponWidth}px` : ''],
          ['--boss-shot-diameter', enemy.weaponKind ? `${enemy.radius * 2}px` : ''],
        ]) entry.node.style.setProperty(key, value);
      }
      // Simulation may replace or mutate its shot. Keep a value snapshot only
      // when appearance changes; position updates need no style reconstruction.
      entry.appearance = { ...shot };
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
      for (const shot of state.shots) place(0, shot);
      for (const shot of state.enemyShots) place(1, shot);
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
