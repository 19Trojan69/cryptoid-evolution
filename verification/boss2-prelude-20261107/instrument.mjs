import assert from 'node:assert/strict';

// Both arms enter Boss 2 with the shipped last-turret fixture. In the prelude
// arm this is applied at the original creation point, before the first draw.
// All prior sectors, Boss 1, the bonus, and all clocks run normally.
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
      } else if (s.encounter === 'normal') {
        const enemy = s.asteroids.find(item => item.y > 0 && item.health > 0 && !item.cloaked);
        if (enemy) {
          const lead = Math.max(0, (y * height - 23 - enemy.y) / .64) + 145;
          const next = moveAsteroid(enemy, lead, width, height);
          aim = { x: (next.x + next.radius * .35 * Math.sin(elapsedRef.current / 420)) / width, y };
        } else {
          aim = { x: .5 + .29 * Math.sin(elapsedRef.current * .0008), y };
        }
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
  const create = '              state.boss = createSectorBoss(state.sector, width, visibleTop, height);';
  const reader = '    (window as any).__cryptoidLabRead=read;';
  const cleanup = '    return ()=>{if((window as any).__cryptoidLabRead===read)delete (window as any).__cryptoidLabRead;};';
  const edits = [
    [trace, ''],
    [preload, '    labBossSteps.current = new Set();\n' + preload],
    [create, create + seedBoss2],
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
