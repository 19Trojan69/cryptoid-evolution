import { hangarCatalog } from './hangarCatalog';
import { isTestnetWeaponPurchaseEnabled } from './paymentPolicy';

export const WEAPON_CHARGE_MS = 60_000;
export const MAX_WEAPON_QUANTITY = 99;
export function weaponQuantity(value: unknown) {
  return Number.isSafeInteger(value) && Number(value) >= 1 && Number(value) <= MAX_WEAPON_QUANTITY ? Number(value) : null;
}
export function weaponPayment(offer: { kind: string; pricePi: number }, metadata: any) {
  const quantity = metadata?.weaponModel === 2 && offer.kind === 'weapon' ? weaponQuantity(metadata.quantity) : metadata?.quantity === undefined && metadata?.weaponModel === undefined ? 1 : null;
  return quantity === null ? null : { quantity, amount: Math.round(offer.pricePi * quantity * 10_000_000) / 10_000_000 };
}
export type WeaponStock = { revision: number; balances: Record<string, number>; credited: string[]; activations: Record<string, { level: number; runId: string }> };
export const emptyWeaponStock = (): WeaponStock => ({ revision: 0, balances: {}, credited: [], activations: {} });
/** Paid orders are imported once. Old two-minute purchases become two one-minute charges. */
export function creditWeaponOrders(stock: WeaponStock, orders: any[], network: string): WeaponStock {
  const next = structuredClone(stock);
  for (const order of orders) {
    const offer = hangarCatalog.find(item => item.id === order.product_id);
    if (!offer || offer.kind !== 'weapon' || !order.paid || order.cancelled || !order.pi_payment_id) continue;
    if (network !== 'testnet' || !isTestnetWeaponPurchaseEnabled(offer)) continue;
    if (order.payment_network !== 'Pi Testnet') continue;
    if (next.credited.includes(order.pi_payment_id)) continue;
    const quantity = order.weapon_model === 2 ? weaponQuantity(order.quantity) : 2;
    if (!quantity) continue;
    next.credited.push(order.pi_payment_id);
    next.balances[offer.id] = (next.balances[offer.id] || 0) + quantity;
  }
  return next;
}
export async function syncWeaponStock(users: any, orders: any, uid: string, network: string): Promise<WeaponStock> {
  const path = `weaponStockByNetwork.${network}`;
  await users.updateOne({ uid, [path]: { $exists: false } }, { $set: { [path]: emptyWeaponStock() } });
  for (let retry = 0; retry < 8; retry++) {
    const user = await users.findOne({ uid });
    const stock: WeaponStock = user?.weaponStockByNetwork?.[network];
    if (!stock) throw new Error('Missing weapon inventory');
    const paid = await orders.find({ user: uid, paid: true }).toArray();
    const next = creditWeaponOrders(stock, paid, network);
    if (next.credited.length === stock.credited.length) return stock;
    next.revision++;
    const result = await users.updateOne({ uid, [`${path}.revision`]: stock.revision }, { $set: { [path]: next } });
    if (result.modifiedCount) return next;
  }
  throw new Error('Weapon inventory changed; retry');
}
