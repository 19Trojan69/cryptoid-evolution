import type { SectorBoss } from './sectorBoss.ts';
import { bossVulnerable } from './sectorBoss.ts';
import { coreActive, coreInterval } from './bossCore.ts';

export type BossClearBoundaryKind = 'boss-victory-no-track' | 'boss-victory-source-set'
  | 'boss-victory-play-returned' | 'boss-victory-play-settled' | 'boss-victory-ended'
  | 'boss-music-return-source-set' | 'boss-music-return-play-returned' | 'boss-music-return-play-settled'
  | 'boss-clear-timer-ready' | 'boss-heart-collected' | 'boss-extra-life-audio-returned';
export type BossBoundaryKind = BossClearBoundaryKind | 'reactor-open-observed' | 'reactor-first-shot-before'
  | 'reactor-first-shot-created' | 'reactor-first-shot-audio-returned'
  | 'reactor-first-shot-scene-committed';

// Created only for the verified owner. Observe the existing combat sequence;
// never alter the boss, invoke audio, schedule frames or recover the game.
export function createBossBoundaryDiagnostics(record: (kind: BossBoundaryKind) => void) {
  let bossId = -1, level = -1, elapsed = -1, opened = false, pending = false;
  let created = false, audioReturned = false, committed = false;
  let clearSector = -1, clearGeneration = 0, finished = false;
  const clearSeen = new Set<BossClearBoundaryKind>(), watched = new Set<BossClearBoundaryKind>();
  const emit = (kind: BossBoundaryKind) => { try { record(kind); } catch { /* Optional diagnostics. */ } };
  const clearMark = (sector: number, kind: BossClearBoundaryKind) => {
    if (finished || sector !== clearSector || clearSeen.has(kind)) return;
    clearSeen.add(kind); emit(kind);
  };
  return {
    clearStart(sector: number) {
      if (finished) return;
      clearSector = sector; clearGeneration++; clearSeen.clear(); watched.clear();
    },
    clearMark,
    clearPlayback(sector: number, kind: BossClearBoundaryKind, playback: Promise<boolean>) {
      if (finished || sector !== clearSector || watched.has(kind)) return;
      watched.add(kind);
      const generation = clearGeneration;
      const settled = () => { if (generation === clearGeneration) clearMark(sector, kind); };
      // Observe settlement only; do not invoke, await, retry or alter playback.
      void playback.then(settled, settled);
    },
    clearStop() { clearSector = -1; clearGeneration++; clearSeen.clear(); watched.clear(); },
    finish() { finished = true; record = () => {}; clearGeneration++; clearSeen.clear(); watched.clear(); },
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
