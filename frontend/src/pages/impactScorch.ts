export type ScorchMark = { id: number; x: number; y: number };

export const scorchAtImpact = (
  shot: { id: number; x: number; y: number },
  target: { x: number; y: number },
  size: number,
  rotation = 0,
  offset = { x: 0, y: 0 },
): ScorchMark => {
  const angle = rotation * Math.PI / 180;
  const dx = shot.x - target.x + offset.x;
  const dy = shot.y - target.y + offset.y;
  // Store the impact in ship coordinates so damage follows its flight and rotation.
  const x = dx * Math.cos(angle) + dy * Math.sin(angle);
  const y = -dx * Math.sin(angle) + dy * Math.cos(angle);
  return { id: shot.id, x: Math.max(20, Math.min(80, 50 + x / size * 100)), y: Math.max(20, Math.min(80, 50 + y / size * 100)) };
};
