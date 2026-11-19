// Reverse only the reviewed combat switch and removal of obsolete target rings.
// Historical whole-controller fingerprints continue to protect all other code.
export const legacyFormationTargets = "        {!combatVarietyEnabled && game.asteroids.filter(asteroid => game.encounter === \"normal\"\n          ? game.phase === \"ENTRY\" || game.phase === \"FORMATION\" || game.phase === \"REFORM\"\n          : game.encounter === \"boss-fight\" && asteroid.escort && asteroid.attackPattern === null\n        ).map(asteroid => { const locked = asteroid.entryElapsed >= asteroid.entryDuration && asteroid.formationElapsed >= asteroid.formationDuration; const diameter = asteroid.radius * 2 + 8; return <div key={`formation-${asteroid.id}`} className={`formation-target${locked ? \" formation-target-locked\" : \"\"}`} style={{ left: asteroid.entryTargetX, top: asteroid.entryTargetY, width: diameter, height: diameter }} aria-hidden=\"true\"><span /></div>; })}\n";
const targetAnchor = "        <BossHullView boss={game.encounter === \"boss-fight\" ? game.boss : null} fall={fallingBossHull} ready={bossHullReady} light={game.bossHullLight} now={performance.now()} fallDurationMs={BOSS_FALL_DURATION_MS} title={`${t(\"CORE WARDEN\")} · ${t(\"Sector\")} boss`}/>\n";
const before = 'const combatVarietyEnabled = shipSaveNetwork === "testnet";';
const after = 'const combatVarietyEnabled = true;';
export function restoreMainnetCombatChange(source) {
  if (source.includes('formation-target')) {
    if (source.split(legacyFormationTargets).length !== 2) throw Error('Expected one exact legacy formation block');
  } else {
    if (source.split(targetAnchor).length !== 2) throw Error('Expected one exact legacy formation anchor');
    source = source.replace(targetAnchor, () => legacyFormationTargets + targetAnchor);
  }
  if (source.split(before).length === 2 && !source.includes(after)) return source;
  if (source.split(after).length !== 2 || source.includes(before)) throw Error('Expected one exact Mainnet combat release change');
  return source.replace(after, before);
}
