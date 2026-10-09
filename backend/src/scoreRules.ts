export const scoreField = (rulesVersion: number, network: string) => rulesVersion === 1 ? "bestScore" : `bestScoreV2.${network}`;
export const scoreValue = (user: any, rulesVersion: number, network: string): number =>
  rulesVersion === 1 ? user?.bestScore ?? 0 : user?.bestScoreV2?.[network] ?? 0;

export const careerField = (network: string) => `careerScoreByNetwork.${network}`;
export const bestRunField = (network: string) => `bestRunByNetwork.${network}`;
export const careerValue = (user: any, network: string): number => user?.careerScoreByNetwork?.[network] ?? 0;
export const bestRunValue = (user: any, network: string): { score: number; level: number | null } => {
  const record = user?.bestRunByNetwork?.[network];
  const score = Number.isSafeInteger(record?.score) && record.score > 0 ? record.score : 0;
  const legacy = Number.isSafeInteger(user?.bestScoreV2?.[network]) && user.bestScoreV2[network] > 0 ? user.bestScoreV2[network] : 0;
  return legacy > score ? { score: legacy, level: null } : { score,
    level: Number.isSafeInteger(record?.level) && record.level >= 1 && record.level <= 50 ? record.level : null };
};

// Mission sector and reward events belong to the active run. The profile's
// highest sector belongs to the entire career and cannot label a Best Run.
export const runLevel = (player: any, eventKeys: unknown): number => {
  const sectors = [player?.lastStart?.startSector, player?.mission?.sector];
  if (Array.isArray(eventKeys)) for (const key of eventKeys) {
    if (typeof key !== "string") continue;
    const match = /^(?:block|chain|boss|bonus):(\d+)$/.exec(key);
    if (!match) continue;
    const value = Number(match[1]);
    sectors.push(key.startsWith("block:") ? value : key.startsWith("chain:") ? value * 10 - 1 : value * 10);
  }
  return Math.ceil(Math.min(500, Math.max(1, ...sectors.filter((sector): sector is number => Number.isSafeInteger(sector) && sector >= 1 && sector <= 500))) / 10);
};
