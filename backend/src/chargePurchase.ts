export const MAX_CHARGE_QUANTITY = 99;

export function chargeQuantity(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1 && value <= MAX_CHARGE_QUANTITY
    ? value : null;
}

export const chargeTotal = (unitPrice: number, quantity: number) =>
  Math.round(unitPrice * quantity * 10_000_000) / 10_000_000;

export function chargePayment(offer: { kind: string; pricePi: number }, metadata?: {
  quantity?: unknown; weaponModel?: unknown; powerModel?: unknown;
}) {
  const weaponBatch = offer.kind === "weapon" && metadata?.weaponModel === 2 && metadata.powerModel === undefined;
  const powerBatch = offer.kind === "power" && metadata?.powerModel === 1 && metadata.weaponModel === undefined;
  const legacy = metadata?.quantity === undefined && metadata?.weaponModel === undefined && metadata?.powerModel === undefined;
  const quantity = weaponBatch || powerBatch ? chargeQuantity(metadata?.quantity) : legacy ? 1 : null;
  return quantity === null ? null : { quantity, amount: chargeTotal(offer.pricePi, quantity) };
}
