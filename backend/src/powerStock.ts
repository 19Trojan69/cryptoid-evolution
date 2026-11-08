import type { ClientSession, Collection, Document, Filter } from "mongodb";
import { chargeQuantity } from "./chargePurchase";

export const testnetPowerOrders = { payment_network: { $in: ["Pi Testnet", null] } };
const available = { paid: true, cancelled: { $ne: true }, consumed_at: null };

export function remainingPowerCharges(order: Document) {
  if (order.consumed_at || order.cancelled) return 0;
  // Only the validated batch model can grant more than one charge.
  const total = order.power_model === 1 ? chargeQuantity(order.quantity) ?? 0 : 1;
  const used = order.consumed_quantity ?? 0;
  return Number.isSafeInteger(used) && used >= 0 ? Math.max(0, total - used) : 0;
}

export async function availablePowerOrder(orders: Collection, scope: Filter<Document>, session?: ClientSession) {
  const candidates = await orders.find({ ...scope, ...available }, { session, sort: { created_at: 1, _id: 1 } }).toArray();
  return candidates.find(order => remainingPowerCharges(order) > 0);
}

export async function consumePowerCharge(orders: Collection, order: Document, receipt: string, runId: string, session?: ClientSession) {
  const remaining = remainingPowerCharges(order);
  if (remaining === 0) return false;
  const result = await orders.updateOne({
    _id: order._id, ...available,
    consumed_quantity: order.consumed_quantity === undefined ? { $exists: false } : order.consumed_quantity,
    power_use_ids: { $ne: receipt },
  }, {
    $set: {
      consumed_quantity: (order.consumed_quantity ?? 0) + 1,
      ...(remaining === 1 ? { consumed_at: new Date(), consumed_run_id: runId } : {}),
    },
    $addToSet: { power_use_ids: receipt },
  }, { session });
  return result.modifiedCount === 1;
}

export async function consumeSelectedStartPower(orders: Collection, scope: Filter<Document>, runId: string) {
  const receipt = `start:${runId}`;
  for (let attempt = 0; attempt < 8; attempt++) {
    const order = await orders.findOne({ ...scope, paid: true });
    if (!order || order.cancelled) return false;
    if (order.power_use_ids?.includes(receipt)
      || (!order.power_use_ids && !order.consumed_activation_id && order.consumed_run_id === runId)) return true;
    if (!remainingPowerCharges(order)) return false;
    if (await consumePowerCharge(orders, order, receipt, runId)) return true;
  }
  throw new Error("Power-up inventory changed during mission start");
}
