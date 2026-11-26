// Two exact permission expressions only. Confirmed inventory, activation, Auto
// preference, timers, manual pauses and the entire remaining controller stay pinned.
export const mainnetOwnedWeaponChanges = [
  {
    before: "    const allowed = hangarCatalog.flatMap(offer => offer.kind === 'weapon' && shipSaveNetwork === 'testnet'\n      && isTestnetWeaponPurchaseEnabled(offer, ownerDiagnostics) ? [offer.level] : []);\n",
    after: "    const allowed = hangarCatalog.flatMap(offer => offer.kind === 'weapon'\n      && (shipSaveNetwork === 'testnet' ? isTestnetWeaponPurchaseEnabled(offer, ownerDiagnostics) : shipSaveNetwork === 'mainnet') ? [offer.level] : []);\n",
  },
  {
    before: "        if (shouldAutoReload(expiringLevel, expiringSource, expiringMs, state.weaponTimers[expiringLevel] ?? 0, autoReloadRef.current, stockRef.current, shipSaveNetwork === 'testnet' && isTestnetWeaponPurchaseEnabled(reloadOffer, ownerDiagnostics))) reloadRequestRef.current(expiringLevel);\n",
    after: "        if (shouldAutoReload(expiringLevel, expiringSource, expiringMs, state.weaponTimers[expiringLevel] ?? 0, autoReloadRef.current, stockRef.current, shipSaveNetwork === 'testnet' ? isTestnetWeaponPurchaseEnabled(reloadOffer, ownerDiagnostics) : shipSaveNetwork === 'mainnet' && reloadOffer?.kind === 'weapon')) reloadRequestRef.current(expiringLevel);\n",
  },
];

export function restoreMainnetOwnedWeaponChanges(source) {
  for (const { before, after } of mainnetOwnedWeaponChanges) {
    if (source.split(after).length === 2 && !source.includes(before)) source = source.replace(after, () => before);
    else if (source.split(before).length !== 2 || source.includes(after)) throw Error('Expected one exact Mainnet owned-weapon change');
  }
  return source;
}
