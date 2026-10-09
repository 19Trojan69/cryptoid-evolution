// Stable sprite identities; no saved color or ownership IDs are changed.
export const namedShipColor = (sprite: number) => ({ 4: "gold", 9: "metallic-red", 7: "metallic-green", 17: "metallic-green" } as const)[sprite as 4 | 9 | 7 | 17];
export const namedShipAccent = (sprite: number): readonly number[] | undefined => ({ 4: [225,183,72], 9: [212,48,62], 7: [68,161,89], 17: [119,137,60] })[sprite];
