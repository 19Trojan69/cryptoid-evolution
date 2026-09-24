export type CryptoidClass = "light" | "medium" | "heavy" | "elite";
export type CryptoidType = "solflare" | "etherCrystal" | "bitrock" | "stableCore" | "memeSwarm" | "ghostCoin";
export type FactionCode = "X" | "Z" | "R" | "K" | "V" | "Q" | "XR" | "VX" | "ZX" | "Q7";

export type CryptoidProfile = {
  type: CryptoidType;
  shipClass: CryptoidClass;
  faction: FactionCode;
  health: number;
  reward: number;
  points: number;
  radius: number;
  entryDuration: number;
  attackPace: number;
};

const factionCodes: FactionCode[] = ["X", "Z", "R", "K", "V", "Q", "XR", "VX", "ZX", "Q7"];
const types: Record<CryptoidType, Omit<CryptoidProfile, "type" | "faction">> = {
  solflare: { shipClass: "light", health: 1, reward: 2, points: 10, radius: 25, entryDuration: 5_500, attackPace: 0.9 },
  etherCrystal: { shipClass: "medium", health: 2, reward: 4, points: 25, radius: 36, entryDuration: 7_000, attackPace: 1 },
  bitrock: { shipClass: "heavy", health: 4, reward: 8, points: 60, radius: 50, entryDuration: 9_000, attackPace: 1.18 },
  stableCore: { shipClass: "medium", health: 3, reward: 5, points: 35, radius: 36, entryDuration: 8_000, attackPace: 1.1 },
  memeSwarm: { shipClass: "light", health: 1, reward: 2, points: 12, radius: 25, entryDuration: 6_000, attackPace: 0.94 },
  ghostCoin: { shipClass: "elite", health: 2, reward: 6, points: 70, radius: 36, entryDuration: 7_000, attackPace: 1 },
};

export const cryptoidDisplayName: Record<CryptoidType, string> = {
  solflare: "SolFlare", etherCrystal: "Ether Crystal", bitrock: "BitRock",
  stableCore: "Stable Core", memeSwarm: "Meme Swarm", ghostCoin: "Ghost Coin",
};

export const chooseCryptoid = (sector: number, index: number): CryptoidProfile => {
  const roster: CryptoidType[] = sector <= 1
    ? ["solflare", "etherCrystal", "solflare", "bitrock", "etherCrystal"]
    : sector === 2
      ? ["solflare", "etherCrystal", "stableCore", "bitrock", "solflare"]
      : ["solflare", "memeSwarm", "etherCrystal", "stableCore", "bitrock", "memeSwarm"];
  // Ghost Coin is uncommon even in sectors where it has been introduced.
  const type = sector >= 3 && index % 13 === 12 ? "ghostCoin" : roster[index % roster.length];
  return { type, ...types[type], faction: factionCodes[(index + Math.max(0, sector - 1)) % factionCodes.length] };
};

// Ghosts can phase out only while resting in formation. Every attack is fully visible.
export const isGhostCloaked = (type: CryptoidType, inFormation: boolean, elapsedMs: number) =>
  type === "ghostCoin" && inFormation && Math.floor(elapsedMs / 1_800) % 4 === 1;
