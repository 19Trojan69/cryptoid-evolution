export const isSmartphonePlayfield = (fieldWidth: number, screenWidth: number, coarsePointer: boolean) =>
  coarsePointer && fieldWidth <= 600 && screenWidth <= 600;

export const smartphoneEnemyCount = (level: number) => {
  if (level < 40) return 6;
  if (level < 80) return 7;
  if (level < 120) return 8;
  if (level < 180) return 9;
  if (level < 260) return 10;
  if (level < 360) return 11;
  return 12;
};

export const smartphoneShipScale = (enemyCount: number) => enemyCount <= 6 ? 1 : enemyCount <= 9 ? .82 : .63;

export const smartphoneAttackLimit = (level: number, attackNumber: number) =>
  level < 30 ? 1 : level < 180 ? 2 : attackNumber % 9 === 0 ? 3 : 2;

export const smartphoneSpecialty = (level: number, formationIndex: number) => ({
  shield: level >= 150 && formationIndex === 3,
  armed: level >= 260 && formationIndex === 8,
});
