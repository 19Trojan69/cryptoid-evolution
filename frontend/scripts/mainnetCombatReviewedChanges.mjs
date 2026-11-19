// Undo only the reviewed Mainnet combat release for historical controller hashes.
const before = 'const combatVarietyEnabled = shipSaveNetwork === "testnet";';
const after = 'const combatVarietyEnabled = true;';
export function restoreMainnetCombatChange(source) {
  if (source.split(before).length === 2 && !source.includes(after)) return source;
  if (source.split(after).length !== 2 || source.includes(before)) throw Error('Expected one exact Mainnet combat release change');
  return source.replace(after, before);
}
