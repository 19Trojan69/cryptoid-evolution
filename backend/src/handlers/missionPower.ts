import type { Router, Request } from "express";
import type { ClientSession, Collection, MongoClient } from "mongodb";
import { isAdminMode } from "../adminAccess";
import { rewardNetwork } from "../rewardNetwork";
import { isSingleUseMissionPower, missionPowerOffers, usedMissionPowers, type MissionPowerActivation, type MissionPowerInventory } from "../missionPower";
import type { PlayerSave } from "../playerSave";
import { availablePowerOrder, consumePowerCharge, remainingPowerCharges, testnetPowerOrders } from "../powerStock";

const playerKey = "playerByNetwork.testnet";
const powerIds = missionPowerOffers.map(offer => offer.id);
const paidPowers = (uid: string) => ({ user: uid, paid: true, ...testnetPowerOrders });

async function readInventory(orders: Collection, uid: string, player: PlayerSave, session?: ClientSession): Promise<MissionPowerInventory> {
  const entries = await orders.find({ ...paidPowers(uid), product_id: { $in: powerIds }, consumed_at: null },
    { session, projection: { _id: 0, product_id: 1, quantity: 1, power_model: 1, consumed_quantity: 1, cancelled: 1 } }).toArray();
  const stock = Object.fromEntries(missionPowerOffers.map(({ id, powerUp }) =>
    [powerUp, entries.reduce((sum, order) => sum + (order.product_id === id ? remainingPowerCharges(order) : 0), 0)]));
  return { stock, pending: player.pendingPowerActivation ?? null, used: usedMissionPowers(player) };
}

async function currentPlayer(users: Collection, uid: string, runId: unknown, session?: ClientSession): Promise<PlayerSave | null> {
  if (typeof runId !== "string") return null;
  const user = await users.findOne({ uid, [`${playerKey}.activeRunId`]: runId }, { session, projection: { [playerKey]: 1 } });
  const player: PlayerSave | undefined = user?.playerByNetwork?.testnet;
  const run = player?.lastStart?.runMeta;
  return player && run?.id === runId && Date.now() - run.startedAt <= 8 * 60 * 60 * 1000 ? player : null;
}

function pilot(req: Request) {
  return rewardNetwork(req) === "testnet" && !isAdminMode(req) ? req.session.currentUser?.uid : undefined;
}

export default function mountMissionPowerEndpoints(router: Router) {
  router.get("/power", async (req, res) => {
    const uid = pilot(req);
    if (!uid) return res.status(403).json({ error: "account_required" });
    res.setHeader("Cache-Control", "no-store");
    const { userCollection: users, orderCollection: orders } = req.app.locals;
    try {
      const player = await currentPlayer(users, uid, req.query.runId);
      if (!player) return res.status(409).json({ error: "run_replaced" });
      return res.json(await readInventory(orders, uid, player));
    } catch { return res.status(503).json({ error: "inventory_unavailable" }); }
  });

  router.post("/power/activate", async (req, res) => {
    const uid = pilot(req);
    if (!uid) return res.status(403).json({ error: "account_required" });
    res.setHeader("Cache-Control", "no-store");
    const { runId, power, requestId } = req.body || {};
    const offer = missionPowerOffers.find(item => item.powerUp === power);
    if (!offer || typeof requestId !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) {
      return res.status(400).json({ error: "invalid_activation" });
    }
    const { userCollection: users, orderCollection: orders, databaseClient } = req.app.locals;
    const client: MongoClient | undefined = databaseClient;
    if (!client) return res.status(503).json({ error: "activation_unavailable" });
    const session = client.startSession();
    try {
      const result = await session.withTransaction(async () => {
        const player = await currentPlayer(users, uid, runId, session);
        if (!player) return { status: 409, error: "run_replaced" };
        const paid = { ...paidPowers(uid), product_id: offer.id };
        const receipt = `tap:${requestId}`;
        if (player.pendingPowerActivation || await orders.findOne({
          ...paidPowers(uid), $or: [{ consumed_activation_id: requestId }, { power_use_ids: receipt }],
        }, { session, projection: { _id: 1 } })) {
          return { status: 200, inventory: await readInventory(orders, uid, player, session) };
        }
        if (isSingleUseMissionPower(offer.powerUp) && usedMissionPowers(player).includes(offer.powerUp)) {
          return { status: 409, error: "power_already_used" };
        }
        const charge = await availablePowerOrder(orders, paid, session);
        if (!charge) return { status: 409, error: "power_stock_empty" };
        if (!await consumePowerCharge(orders, charge, receipt, runId, session)) throw new Error("Power-up stock changed");
        const pending: MissionPowerActivation = { id: requestId, power: offer.powerUp };
        // Writing both documents in this transaction also serializes two devices
        // competing for different power-ups in the same live mission.
        const updated = await users.updateOne({ uid, [`${playerKey}.activeRunId`]: runId, [`${playerKey}.version`]: player.version },
          { $set: { [`${playerKey}.pendingPowerActivation`]: pending }, $inc: { [`${playerKey}.version`]: 1 } }, { session });
        if (!updated.modifiedCount) throw new Error("Run changed during activation");
        return { status: 200, inventory: await readInventory(orders, uid, { ...player, pendingPowerActivation: pending }, session) };
      }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
      return res.status(result.status).json(result.inventory ?? { error: result.error });
    } catch { return res.status(503).json({ error: "activation_unavailable" }); }
    finally { await session.endSession(); }
  });
}
