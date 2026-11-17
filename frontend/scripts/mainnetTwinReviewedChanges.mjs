const changes = [
  {
    before: "import { isTestnetWeaponPurchaseEnabled } from '../../../backend/src/paymentPolicy';",
    after: "import { weaponChargesSupported } from '../../../backend/src/paymentPolicy';",
  },
  {
    before: "    const allowed = hangarCatalog.flatMap(offer => offer.kind === 'weapon' && shipSaveNetwork === 'testnet'\n      && isTestnetWeaponPurchaseEnabled(offer, ownerDiagnostics) ? [offer.level] : []);",
    after: "    const allowed = hangarCatalog.flatMap(offer => offer.kind === 'weapon'\n      && weaponChargesSupported(offer, shipSaveNetwork, ownerDiagnostics) ? [offer.level] : []);",
  },
  {
    before: "stockRef.current, shipSaveNetwork === 'testnet' && isTestnetWeaponPurchaseEnabled(reloadOffer, ownerDiagnostics)",
    after: "stockRef.current, weaponChargesSupported(reloadOffer, shipSaveNetwork, ownerDiagnostics)",
  },
];

export function restoreMainnetTwinGameChanges(source) {
  if (!changes.some(({ after }) => source.includes(after))) return source;
  for (const { before, after } of changes) {
    if (source.split(after).length !== 2) throw Error('Expected one exact Mainnet Twin Laser change');
    source = source.replace(after, before);
  }
  return source;
}
