export const scoreField = (rulesVersion: number, network: string) => rulesVersion === 1 ? "bestScore" : `bestScoreV2.${network}`;
export const scoreValue = (user: any, rulesVersion: number, network: string): number =>
  rulesVersion === 1 ? user?.bestScore ?? 0 : user?.bestScoreV2?.[network] ?? 0;
