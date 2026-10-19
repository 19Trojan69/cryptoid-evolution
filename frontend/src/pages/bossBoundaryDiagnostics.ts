import type { SectorBoss } from './sectorBoss.ts';
import { bossVulnerable } from './sectorBoss.ts';
import { coreActive, coreInterval } from './bossCore.ts';

export type BossBoundaryKind = 'reactor-open-observed' | 'reactor-first-shot-before'
  | 'reactor-first-shot-created' | 'reactor-first-shot-audio-returned'
  | 'reactor-first-shot-scene-committed';

// Created only for the verified owner. Observe the existing combat sequence;
// never alter the boss, invoke audio, schedule frames or recover the game.
export function createBossBoundaryDiagnostics(record: (kind: BossBoundaryKind) => void) {
  let bossId = -1, level = -1, elapsed = -1, opened = false, pending = false;
  let created = false, audioReturned = false, committed = false;
  const emit = (kind: BossBoundaryKind) => { try { record(kind); } catch { /* Optional diagnostics. */ } };
  return {
    beforeCore(boss: SectorBoss, sector: number, delta: number, available: number) {
      if (sector !== level || boss.config.id !== bossId || boss.elapsed < elapsed) {
        level = sector; bossId = boss.config.id;
        opened = pending = created = audioReturned = committed = false;
      }
      elapsed = boss.elapsed;
      if (!coreActive(boss) || !bossVulnerable(boss) || delta <= 0) return;
      if (!opened) { opened = true; emit('reactor-open-observed'); }
      // Match advanceBossCore's existing warning/capacity guards. A resumed
      // core with prior volleys must never be labeled as a new first shot.
      if (pending || created || (boss.core?.volley ?? 0) !== 0 || Math.floor(available) < 1) return;
      if ((boss.core?.elapsed ?? 0) + Math.min(80, delta) < coreInterval(boss)) return;
      pending = true;
      emit('reactor-first-shot-before');
    },
    afterCore(shotCount: number) {
      if (!pending || created || shotCount < 1) return false;
      created = true;
      emit('reactor-first-shot-created');
      return true;
    },
    afterAudio(firstShot: boolean) {
      if (!firstShot || !created || audioReturned) return;
      audioReturned = true;
      emit('reactor-first-shot-audio-returned');
    },
    sceneCommitted(boss: SectorBoss | null, sector: number) {
      if (!audioReturned || committed || !boss || sector !== level || boss.config.id !== bossId || !(boss.core?.volley)) return;
      committed = true;
      // A React layout commit is not proof of a completed GPU/browser paint.
      emit('reactor-first-shot-scene-committed');
    },
  };
}
