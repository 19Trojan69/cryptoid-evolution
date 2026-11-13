import { shipSaveNetwork } from "./shipFleet";

export const shipNftMainnetVisible = shipSaveNetwork === "mainnet" &&
  import.meta.env.VITE_CRYPTOID_MAINNET_SHIP_NFTS_ENABLED === "1" &&
  (import.meta.env.DEV || window.location.hostname === "cryptoid-evolution.vercel.app");
