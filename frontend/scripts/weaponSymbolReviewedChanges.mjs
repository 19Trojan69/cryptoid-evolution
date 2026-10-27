// Only the reviewed symbol props; the full published controller stays pinned.
const before = "expiredWeaponName={weaponNames[weaponSpent]} weaponName={weaponNames[stageWeaponLevel(shipStage, game.weaponLevel)]}";
const after = "expiredLevel={weaponSpent} level={stageWeaponLevel(shipStage, game.weaponLevel)} expiredWeaponName={weaponNames[weaponSpent]} weaponName={weaponNames[stageWeaponLevel(shipStage, game.weaponLevel)]}";
export function restoreWeaponSymbolGameChanges(source) {
  if (source.split(after).length !== 2) throw Error('Expected one exact weapon-symbol props change');
  return source.replace(after, before);
}
