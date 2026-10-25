// Local test entry only. Synthetic boss damage/aim; no account or game API.
import React from 'react';
import { createRoot } from 'react-dom/client';
import BossHullView from '../../src/pages/BossHullView';
import BossPortrait from '../../src/pages/BossPortrait';
import { loadBossArtwork } from '../../src/pages/bossArtwork';
import { createSectorBoss, moveSectorBoss } from '../../src/pages/sectorBoss';
import { observeBossResources } from '../../src/pages/bossResourceDiagnostics';
import { startCssFramePacing, cssFramePacingStats } from '../../src/lib/cssFramePacing';
import { createOwnerFlightRecorder } from '../../src/pages/ownerFlightRecorder';
import { sessionDiagnostic } from '../../src/lib/sessionDiagnosticEvents';
import { settleFullSessionWrites } from '../../src/pages/fullSessionStore';

const host = window as any;
const root = createRoot(document.getElementById('root')!);
const surfaces: WeakRef<HTMLCanvasElement>[] = [];
const sharedArtwork = new Set<HTMLCanvasElement>();
const createElement = document.createElement.bind(document);
document.createElement = ((name: string, options?: ElementCreationOptions) => {
  const element = createElement(name, options);
  if (name.toLowerCase() === 'canvas') surfaces.push(new WeakRef(element as HTMLCanvasElement));
  return element;
}) as typeof document.createElement;
const storage = { reads: 0, writes: 0 };
const store = (name: 'sessionStorage' | 'localStorage') => ({
  getItem(key: string) { storage.reads++; return window[name].getItem(key); },
  setItem(key: string, value: string) { storage.writes++; window[name].setItem(key, value); },
  removeItem(key: string) { window[name].removeItem(key); },
});
const recorderHost = { localStorage: store('localStorage'), sessionStorage: store('sessionStorage'), indexedDB,
  performance, navigator, innerWidth, innerHeight, devicePixelRatio };
const frame = () => new Promise<number>(resolve => requestAnimationFrame(resolve));
const inspect = () => {
  const live = surfaces.map(reference => reference.deref()).filter((canvas): canvas is HTMLCanvasElement => !!canvas);
  return { createdSurfaces: surfaces.length, retainedSurfacesWithPixels: live.filter(c => c.width * c.height > 0).length,
    backingBytes: live.reduce((sum, c) => sum + c.width * c.height * 4, 0),
    sharedArtworkBytes: [...sharedArtwork].reduce((sum, c) => sum + c.width * c.height * 4, 0),
    domNodes: document.querySelectorAll('*').length, animationOwners: cssFramePacingStats().active,
    nativeAnimations: document.getAnimations().length, storage: { ...storage } };
};
host.runBossSoak = async ({ cycles, diagnostics }: { cycles: number; diagnostics: boolean }) => {
  const resources: Record<string, number> = {};
  const stopPacing = startCssFramePacing(document.body);
  let context: Record<string, unknown> = {};
  const probe = diagnostics ? createOwnerFlightRecorder(true, () => recorderHost, {
    build: { sourceCommit: 'synthetic-local-resource-test', sourceTree: '', workingTreeDirty: true },
    fullContext: () => context,
  }) : null;
  const stopResources = observeBossResources((kind, details) => {
    resources[kind] = (resources[kind] || 0) + 1;
    probe?.checkpoint(kind, details);
  });
  const checks = [];
  try {
    for (let cycle = 0; cycle < cycles; cycle++) {
      const id = [2, 3, 4][cycle % 3];
      const previouslyDrawn = resources['boss-canvas-first-draw'] || 0;
      let boss = moveSectorBoss(createSectorBoss(id * 10, 430, 96, 825), 6000, 430, 825);
      const started = performance.now(); let previous = started, frames = 0;
      sessionDiagnostic('boundary', { operation: 'transition-before', sector: id * 10 });
      while (performance.now() - started < 1800) {
        const time = await frame(), elapsed = time - started;
        boss = moveSectorBoss(boss, Math.max(0, time - previous), 430, 825); previous = time;
        boss.weaponClock = 6000 + elapsed;
        boss.turrets = boss.turrets.map((gun, index) => ({ ...gun,
          health: index === 0 && elapsed > 1000 ? 0 : gun.maxHealth * (elapsed > 450 ? .45 : 1),
          a: Math.sin(elapsed / 500 + index) * .5,
          lastFired: 6000 + Math.floor(elapsed / 240) * 240, firedBarrels: [0],
        }));
        boss.hit = { id: Math.floor(elapsed / 180), x: 45, y: 50, impactPower: 1 };
        boss.hullFires = [{ id: 1, x: 45, y: 50, born: 0, strength: 1 } as any];
        context = { sector: id * 10, phase: 'ATTACK_CYCLE', encounter: 'boss-fight', status: 'playing',
          bossId: id, liveTurrets: boss.turrets.filter(gun => gun.health > 0).length, enemies: 0,
          projectiles: 10, effects: 1, width: 430, height: 825 };
        probe?.begin(time, context);
        if (frames++ % 2 === 0) {
          probe?.sceneRequested();
          root.render(<React.StrictMode><BossHullView boss={{ ...boss }} ready light={.3}
            now={boss.elapsed} fallDurationMs={5000} title="Local resource test" /></React.StrictMode>);
        }
        probe?.end(time);
      }
      if ((resources['boss-canvas-first-draw'] || 0) !== previouslyDrawn + 1)
        throw new Error('Boss renderer did not draw in the controlled encounter');
      root.render(null); await frame(); await frame();
      // Exercise the real reward portrait between encounters. Only the shared
      // bounded loader result may retain pixels after its view is closed.
      sharedArtwork.add(await loadBossArtwork(id, 1200));
      root.render(<BossPortrait id={id} />);
      const cardStarted = performance.now();
      while (!document.querySelector('.boss-portrait[data-ready="true"]')) {
        if (performance.now() - cardStarted > 10000) throw new Error('Reward portrait never rendered');
        await frame();
      }
      const portrait = document.querySelector<HTMLCanvasElement>('.boss-portrait canvas')!;
      if (!portrait.width || !portrait.height) throw new Error('Empty reward portrait');
      root.render(null); await frame(); await frame();
      if (portrait.width || portrait.height) throw new Error('Closed reward portrait retained its backing store');
      const snapshot = inspect();
      checks.push({ cycle, boss: id, frames, ...snapshot });
      if (snapshot.backingBytes !== snapshot.sharedArtworkBytes || snapshot.animationOwners !== 0)
        throw new Error('Retired boss still owns canvas backing stores or animation entries: ' + JSON.stringify(snapshot));
      if ((cycle + 1) % 3 === 0) console.log('SOAK ' + JSON.stringify({ completed: cycle + 1, diagnostics, ...snapshot }));
    }
  } finally { root.render(null); probe?.finish(); stopResources(); stopPacing(); await settleFullSessionWrites(); }
  return { diagnostics, checks, resources, final: inspect() };
};
host.bossSoakReady = true;
