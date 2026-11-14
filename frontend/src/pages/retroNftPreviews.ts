import { arcadeRankIds } from '../../../backend/src/galaxyArcadeStickerSchema.ts';

type RetroNftScene = { title: string; artwork: string };

const retroNftScenes: Partial<Record<number, RetroNftScene>> = {
  5: { title: 'Classic Shard Run', artwork: 'classic-shard-run' },
  10: { title: 'Shard Chains', artwork: 'shard-chains' },
  15: { title: 'Magnet Window', artwork: 'magnet-window' },
  20: { title: 'Risky Recovery', artwork: 'risky-recovery' },
  25: { title: 'Delivery Contract', artwork: 'delivery-contract' },
  30: { title: 'Free Flight', artwork: 'free-flight' },
  35: { title: 'Meteor Fronts', artwork: 'meteor-fronts' },
  40: { title: 'Debris Vortex', artwork: 'debris-vortex' },
  45: { title: 'Boost Drive', artwork: 'boost-drive' },
  50: { title: 'Narrow Sector', artwork: 'narrow-sector' },
  55: { title: 'Docking Maneuver', artwork: 'docking-maneuver' },
  60: { title: 'Rotating Station', artwork: 'rotating-station' },
  65: { title: 'Moving Freighter', artwork: 'moving-freighter' },
  70: { title: 'Damaged Controls', artwork: 'damaged-controls' },
  75: { title: 'Multiple Dockings', artwork: 'multiple-dockings' },
  80: { title: 'Ring Sequence', artwork: 'ring-sequence' },
  85: { title: 'Drifting Rings', artwork: 'drifting-rings' },
  90: { title: 'Phase Rings', artwork: 'phase-rings' },
  95: { title: 'Forked Route', artwork: 'forked-route' },
  100: { title: 'Precision Streak', artwork: 'precision-streak' },
  105: { title: 'Target Practice', artwork: 'target-practice' },
  110: { title: 'Moving Drones', artwork: 'moving-drones' },
  115: { title: 'Friend or Foe', artwork: 'friend-or-foe' },
  120: { title: 'Limited Ammo', artwork: 'limited-ammo' },
  125: { title: 'Weak Points', artwork: 'weak-points' },
  130: { title: 'Single Missiles', artwork: 'single-missiles' },
  135: { title: 'Split Salvos', artwork: 'split-salvos' },
  140: { title: 'Chain Intercepts', artwork: 'chain-intercepts' },
  145: { title: 'Decoys', artwork: 'decoys' },
  150: { title: 'Limited Defense', artwork: 'limited-defense' },
  155: { title: 'One-Pod Rescue', artwork: 'one-pod-rescue' },
  160: { title: 'Limited Capacity', artwork: 'limited-capacity' },
  165: { title: 'Low Oxygen', artwork: 'low-oxygen' },
  170: { title: 'Hazardous Return', artwork: 'hazardous-return' },
  175: { title: 'Moving Rescue Base', artwork: 'moving-rescue-base' },
  180: { title: 'Single Transport', artwork: 'single-transport' },
  185: { title: 'Multiple Freighters', artwork: 'multiple-freighters' },
  190: { title: 'Convoy Escort', artwork: 'convoy-escort' },
  195: { title: 'Ambush', artwork: 'ambush' },
  200: { title: 'Damaged Convoy', artwork: 'damaged-convoy' },
};

export const retroNftPreviewCount = Object.keys(retroNftScenes).length * arcadeRankIds.length;

export function retroNftPreviewFor({ level, rank }: { level: number; rank: number }) {
  const rankId = arcadeRankIds[rank - 1];
  const scene = retroNftScenes[level];
  if (!rankId || !scene) return;
  return { title: scene.title, image: `/nft/retro/${scene.artwork}.webp`, rankId };
}
