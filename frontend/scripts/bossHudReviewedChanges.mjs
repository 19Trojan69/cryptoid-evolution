// Fixed, exact HUD presentation changes against public97d74b4.
// Restore the complete published controller before all older scope fingerprints.
export const bossHudChanges = [
  {
    "before": "  // Show the active block during formations; the completed chain remains 9/9 at the boss/bonus.\n  const hudBlock = game.encounter === \"normal\" ? sectorLabel : game.chainBlocks;\n",
    "after": "  // Show the active block during formations and the numbered boss during its encounter.\n  const hudBlock = game.encounter === \"normal\" ? sectorLabel : game.chainBlocks;\n  const hudBoss = game.encounter.startsWith(\"boss-\") ? campaignLevel(game.sector) : undefined;\n"
  },
  {
    "before": "          <GameHudStats hearts={game.hearts} heartsHit={game.effects.some(effect => effect.target === \"player\" && effect.kind === \"player-crash\")} levelLabel={levelLabel} shards={totalShards} score={game.score} block={hudBlock} locale={locale}/>\n",
    "after": "          <GameHudStats hearts={game.hearts} heartsHit={game.effects.some(effect => effect.target === \"player\" && effect.kind === \"player-crash\")} levelLabel={levelLabel} shards={totalShards} score={game.score} block={hudBlock} bossNumber={hudBoss} locale={locale}/>\n"
  }
];

export function restoreBossHudGameChanges(source) {
  for (const { before, after } of [...bossHudChanges].reverse()) {
    if (source.split(after).length !== 2) throw Error('Expected one exact boss HUD change');
    source = source.replace(after, before);
  }
  return source;
}

