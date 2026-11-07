import assert from 'node:assert/strict';

// Start both arms with the same weakened Boss 1 to reach the real cleanup
// boundary quickly. All turrets draw and each one still takes a normal hit.
const seedBoss1 = `
    if (options?.scene === 'normal') {
      s.sector = 10; s.section = 10; s.chainBlocks = 9;
      s.phase = 'SECTOR_INTRO'; s.encounter = 'boss-intro';
      s.boss = createSectorBoss(10, fieldRef.current?.clientWidth || 390, visibleTopRef.current, fieldRef.current?.clientHeight || 760);
      if (s.boss) {
        s.boss.turrets.forEach(gun => { gun.health = 1; });
        s.boss.health = s.boss.maxHealth * .25;
      }
    }`;

// Both arms enter Boss 2 with the shipped last-turret fixture. In the prelude
// arm this is applied at the original creation point, before the first draw.
const seedBoss2 = `
              if (state.boss?.config.id === 2) {
                state.boss.turrets.forEach((gun, index) => { gun.health = index === 2 ? 1 : 0; });
              }`;

const pilot = `
    const readPilot = () => {
      const s = stateRef.current, boss = s.boss;
      const { width, height } = fieldSizeRef.current;
      const y = .70;
      let aim = { x: .5, y };
      if (s.encounter === 'boss-clear') {
        aim = BOSS_HEART_POSITION;
      } else if (s.encounter === 'bonus' && s.bonusTargets.length) {
        aim = { x: s.bonusTargets[0].x / width, y };
      } else if (s.encounter === 'boss-fight' && boss?.config.id === 1) {
        const index = boss.turrets.findIndex(gun => gun.health > 0);
        const gun = index >= 0 ? bossWeapons[boss.config.id - 1][index] : null;
        const target = gun ? gunPosition(boss, gun) : boss;
        const lead = Math.max(0, (y * height - 23 - target.y) / .64) + 145;
        const next = moveSectorBoss(boss, lead, width, height);
        aim = { x: (gun ? gunPosition(next, gun).x : next.x) / width, y };
      }
      return { aim, steering: pointerRef.current === 11, stage: s.sector, encounter: s.encounter, phase: s.phase, status: s.status,
        activeMs: labCounters.current.activeMs, frames: labCounters.current.frames,
        bossId: boss?.config.id ?? null, liveTurrets: boss?.turrets.filter(gun => gun.health > 0).length ?? null,
        coreVolley: boss?.core?.volley ?? 0, weapon: s.weaponLevel, weaponSource: s.weaponSource,
        hearts: s.hearts, enemies: s.asteroids.length, bossHeartCollected: !!s.bossHeartCollected,
        bossHealth: boss?.health ?? null, bossMaxHealth: boss?.maxHealth ?? null };
    };
    (window as any).__cryptoidPreludeRead = readPilot;`;

export function instrumentPrelude(source) {
  const trace = '        labBossSteps.current = new Set();\n';
  const preload = '    if(options?.protection)impactCooldownRef.current=1e9;';
  const initial = "    const s=stateRef.current;s.status='paused';";
  const advance = '            const next = advanceAfterClear(state.section, clearEncounter);';
  const create = '              state.boss = createSectorBoss(state.sector, width, visibleTop, height);';
  const bonusEnd = '        if (bonus && state.phase === "SECTOR_CLEAR" && previousPhase !== "SECTOR_CLEAR") {';
  const summaryOpen = "    if (ownerDiagnostics) sessionDiagnostic('boundary', { operation: 'boss-summary-open',";
  const beforeCleanup = '      if (!releaseIdleCanvasEffects())';
  const afterBonus = '      releaseUnusedPaintedShips();';
  const continueAccepted = "      if (ownerDiagnostics) sessionDiagnostic('boundary', { operation: 'boss-summary-continue',";
  const reader = '    (window as any).__cryptoidLabRead=read;';
  const cleanup = '    return ()=>{if((window as any).__cryptoidLabRead===read)delete (window as any).__cryptoidLabRead;};';
  const mark = (stage, name) => `if (${stage} === 10) (window as any).__cryptoidLevelBoundary?.('${name}');`;
  const edits = [
    [trace, ''],
    [preload, '    labBossSteps.current = new Set();\n' + preload],
    [initial, initial + seedBoss1],
    [advance, `            const following = advanceAfterClear(state.section, clearEncounter);
            const next = clearEncounter === 'bonus' && state.sector === 10
              ? { ...following, encounter: 'boss-intro' as const, section: 20, sector: 20 }
              : following;`],
    [create, create + seedBoss2],
    [bonusEnd, bonusEnd + '\n          ' + mark('state.sector', 'bonus-end')],
    [summaryOpen, '    ' + mark('state.sector', 'summary-open') + '\n' + summaryOpen],
    [beforeCleanup, '      ' + mark('pending.summary.stage', 'cleanup-before') + '\n' + beforeCleanup],
    [afterBonus, afterBonus + `
      ${mark('pending.summary.stage', 'cleanup-after')}
      if (pending.summary.stage === 10) (window as any).__cryptoidAtlasProbe?.afterBonus();`],
    [continueAccepted, '      ' + mark('pending.summary.stage', 'continue-accepted') + '\n' + continueAccepted],
    [reader, reader + pilot],
    [cleanup, `    return () => {
      if ((window as any).__cryptoidPreludeRead === readPilot) delete (window as any).__cryptoidPreludeRead;
      if ((window as any).__cryptoidLabRead === read) delete (window as any).__cryptoidLabRead;
    };`],
  ];
  let result = source;
  for (const [before, after] of edits) {
    assert.equal(result.split(before).length, 2, 'Unexpected laboratory controller: ' + before);
    result = result.replace(before, after);
  }
  const traceAnchor = '        s.boss.turrets.forEach((gun, index) => { gun.health = index === 2 ? 1 : 0; });\n';
  let restored = result;
  for (const [before, after] of edits.slice(1).reverse()) restored = restored.replace(after, before);
  assert.equal(restored.replace(traceAnchor, traceAnchor + trace), source);
  return result;
}

export function instrumentWeaponAtlas(source) {
  assert.ok(source.includes('const textures = new Map<string, Promise<HTMLImageElement>>()'));
  // Return primitive observations only, so the probe cannot keep an image or
  // Promise alive after removing the original cache entry.
  return source + `
const boss1Atlas = '/ships/bosses/evolved/boss-01-guns.webp';
const boss2Atlas = '/ships/bosses/evolved/boss-02-guns.webp';
let atlasCleanup: { before: boolean; after: boolean; pending: boolean } | undefined;
(window as any).__cryptoidAtlasProbe = {
  afterBonus() {
    if (atlasCleanup) return;
    const before = textures.has(boss1Atlas);
    const loading = pending.has(boss1Atlas);
    if ((window as any).__cryptoidAtlasMode === 'release') textures.delete(boss1Atlas);
    atlasCleanup = { before, after: textures.has(boss1Atlas), pending: loading };
  },
  read() {
    return { cleanup: atlasCleanup ?? null, hasBoss1: textures.has(boss1Atlas), hasBoss2: textures.has(boss2Atlas),
      pendingBoss2: pending.has(boss2Atlas), entries: textures.size };
  },
};
`;
}
