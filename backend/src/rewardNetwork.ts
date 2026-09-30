import type { Request } from "express";

// The Testnet app proxy stamps this header. Mainnet uses a separate account collection slot.
export const rewardNetwork = (req: Request): "testnet" | "mainnet" =>
  req.get("x-cryptoid-app-network")?.toLowerCase() === "testnet" ? "testnet" : "mainnet";
