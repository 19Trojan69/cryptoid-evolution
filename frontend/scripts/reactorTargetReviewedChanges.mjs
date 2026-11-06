// Only these reviewed reactor hunks differ from d005c99b.
// Existing historical whole-source guards still see every unrelated byte.
export const reactorTargetChanges = [
{"before": "import BossHullView from './BossHullView';\n", "after": "import BossHullView from './BossHullView';\nimport { BOSS_DEFEAT_MS } from './bossDefeatTiming';\n"},
{"before": "const BOSS_FALL_DURATION_MS = 5_000;", "after": "const BOSS_FALL_DURATION_MS = BOSS_DEFEAT_MS;"},
  { before: '            if (fired.events.length) bossMuzzleRef.current = time;\n',
    after: '            // Gun muzzle flashes stay on the existing individual weapon canvas.\n' },
  { before: 'import { bossHitTarget } from "./bossHitTarget";\n',
    after: 'import { bossHitTarget } from "./bossHitTarget";\nimport { recordBossHullImpact } from \'./bossReactorTarget\';\n' },
  { before: '          const enemy = state.asteroids.find(item => shotHitsEnemy(shot, item));\n',
    after: '          if (state.encounter === "boss-fight" && state.boss && bossVulnerable(state.boss)) {\n            recordBossHullImpact(state.boss, previous, shot);\n          }\n          const enemy = state.asteroids.find(item => shotHitsEnemy(shot, item));\n' },
  { before: '            if (pulses.length) { bossMuzzleRef.current = time; soundRef.current?.playBossWeapon("pulse", 8, pulses.length, 0); }\n',
    after: '            if (pulses.length) { soundRef.current?.playBossWeapon("pulse", 8, pulses.length, 0); }\n' },
];
export function restoreReactorTargetChanges(source) {
  if (!source.includes(reactorTargetChanges[0].after)) return source;
  for (const {before, after} of [...reactorTargetChanges].reverse()) {
    if (source.split(after).length !== 2) throw Error('Expected one exact reactor target change');
    source = source.replace(after, before);
  }
  return source;
}
