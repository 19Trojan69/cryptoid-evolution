export const ownerTestnetGameChanges = [
  {
    "before": "isTestnetWeaponPurchaseEnabled(reloadOffer)",
    "after": "isTestnetWeaponPurchaseEnabled(reloadOffer, ownerDiagnostics)"
  },
  {
    "before": "bossCardAvailable(bossId)",
    "after": "bossCardAvailable(bossId, ownerDiagnostics && shipSaveNetwork === 'testnet')"
  },
  {
    "before": "availableShipCards(playerSkins,data.profile.fleet,data.profile.usedShipSkins||[],data.ownedShipUpgrades||[])",
    "after": "availableShipCards(playerSkins,data.profile.fleet,data.profile.usedShipSkins||[],data.ownedShipUpgrades||[],ownerDiagnostics && shipSaveNetwork === 'testnet')"
  }
];
export function restoreOwnerTestnetGameChanges(source) {
  if (!source.includes(ownerTestnetGameChanges[0].after)) return source;
  for (const { before, after } of ownerTestnetGameChanges) {
    if (source.split(after).length !== 2) throw Error('Expected one exact owner Testnet permission change');
    source = source.replace(after, before);
  }
  return source;
}
