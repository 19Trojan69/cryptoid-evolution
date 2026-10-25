import { createHash, randomBytes } from 'node:crypto';
import type { Router } from 'express';
import { rewardNetwork } from './rewardNetwork';
import { bestRunField, bestRunValue, careerField, careerValue } from './scoreRules';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const deletedAccountKey = (uid: string) => `deleted-account:${digest(uid)}`;
export const deletedTokenKey = (token: string) => `deleted-token:${digest(token)}`;
export const testnetAccountDeletionEnabled = () => process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION === 'enabled';
export const deletedProxyToken = async (collection: any, token: unknown) => {
  if (!collection || typeof token !== 'string' || !token) return false;
  return Boolean(await collection.findOne({ _id: deletedTokenKey(token), kind: 'deleted-token' }));
};
export const deletedAccessToken = async (collection: any, uid: string, accessToken: string) => {
  if (!collection || !uid) return false;
  const row = await collection.findOne({ _id: deletedAccountKey(uid), kind: 'deleted-account' });
  return Boolean(row && (!row.tokenHash || !accessToken || row.tokenHash === digest(accessToken)));
};
const literal = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const name = (value: unknown) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 80 ? value.trim().replace(/^@/, '') : null;
function otherNetworkData(user: any, network: string) {
  const other = network === 'testnet' ? 'mainnet' : 'testnet';
  return Boolean(user.playerByNetwork?.[other] || user.pilotProfileByNetwork?.[other] || user.rewardsByNetwork?.[other]
    || user.weaponStockByNetwork?.[other] || user.bestScoreV2?.[other] || user.careerScoreByNetwork?.[other]
    || user.bestRunByNetwork?.[other]?.score || network === 'testnet' && user.bestScore);
}
function publicTarget(user: any, network: string) {
  return { uid: user.uid, username: user.username, network, careerScore: careerValue(user, network),
    bestRun: bestRunValue(user, network), activeRun: Boolean(user.playerByNetwork?.[network]?.activeRunId),
    accountDeletionAllowed: !otherNetworkData(user, network) && (network !== 'testnet' || testnetAccountDeletionEnabled()),
    accountDeletionBlockedReason: otherNetworkData(user, network) ? 'other-network' : network === 'testnet' && !testnetAccountDeletionEnabled() ? 'not-configured' : null };
}

// Mounted only after the existing fresh server-side owner middleware.
export function mountAdminPlayerEndpoints(router: Router) {
  router.post('/players/find', async (req, res) => {
    const username = name(req.body?.username), network = rewardNetwork(req);
    if (!username || req.body?.network !== network) return res.status(400).json({ error: 'invalid_player_search' });
    try {
      const found = await req.app.locals.userCollection.find({ username: { $regex: `^${literal(username)}$`, $options: 'i' } })
        .project({ uid: 1, username: 1, playerByNetwork: 1, pilotProfileByNetwork: 1, rewardsByNetwork: 1,
          weaponStockByNetwork: 1, bestScore: 1, bestScoreV2: 1, careerScoreByNetwork: 1, bestRunByNetwork: 1 }).limit(11).toArray();
      if (found.length > 10) return res.status(409).json({ error: 'ambiguous_player_name' });
      return res.json({ network, players: found.map((user: any) => publicTarget(user, network)) });
    } catch { return res.status(503).json({ error: 'player_search_unavailable' }); }
  });
  router.post('/players/prepare', async (req, res) => {
    const network = rewardNetwork(req), body = req.body || {};
    if (body.network !== network || !['scores', 'account'].includes(body.action) || typeof body.uid !== 'string' || !name(body.username))
      return res.status(400).json({ error: 'invalid_player_action' });
    try {
      const user = await req.app.locals.userCollection.findOne({ uid: body.uid, username: body.username });
      if (!user) return res.status(404).json({ error: 'player_not_found' });
      if (body.action === 'account' && network === 'testnet' && !testnetAccountDeletionEnabled()) return res.status(503).json({ error: 'account_deletion_not_enabled' });
      if (body.action === 'account' && (user.uid === req.session.currentUser!.uid || user.username === '19Trojan69'
        || [process.env.ADMIN_PI_UID?.trim(), process.env.ADMIN_PI_TESTNET_UID?.trim()].includes(user.uid)))
        return res.status(403).json({ error: 'owner_account_protected' });
      if (body.action === 'account' && otherNetworkData(user, network)) return res.status(409).json({ error: 'other_network_account_present' });
      if (body.action === 'scores' && user.playerByNetwork?.[network]?.activeRunId) return res.status(409).json({ error: 'finish_active_run_before_reset' });
      const token = randomBytes(24).toString('hex'), expiresAt = new Date(Date.now() + 5 * 60_000);
      await req.app.locals.adminCollection.insertOne({ _id: `player-action:${digest(token)}`, kind: 'player-action',
        ownerUid: req.session.currentUser!.uid, targetUid: user.uid, username: user.username, network, action: body.action,
        playerVersion: user.playerByNetwork?.[network]?.version ?? null, expiresAt, used: false });
      return res.json({ ...publicTarget(user, network), action: body.action, token, expiresAt,
        scope: body.action === 'scores' ? 'current-network-records' : 'server-account-and-personal-game-data',
        paymentReferencesRetainedWithoutPlayer: body.action === 'account' });
    } catch { return res.status(503).json({ error: 'player_action_unavailable' }); }
  });
  router.post('/players/execute', async (req, res) => {
    const network = rewardNetwork(req), body = req.body || {}, ownerUid = req.session.currentUser!.uid;
    if (body.network !== network || body.confirm !== true || typeof body.token !== 'string' || !/^[a-f0-9]{48}$/.test(body.token)
      || typeof body.confirmUsername !== 'string') return res.status(400).json({ error: 'confirm_player_action' });
    const reviews = req.app.locals.adminCollection, users = req.app.locals.userCollection;
    let session: any;
    try {
      const reviewId = `player-action:${digest(body.token)}`;
      const review = await reviews.findOne({ _id: reviewId, kind: 'player-action', ownerUid, network, used: false, expiresAt: { $gt: new Date() } });
      if (!review || review.username !== body.confirmUsername) return res.status(409).json({ error: 'player_review_expired_or_changed' });
      if (review.action === 'account' && body.playerRequestedDeletion !== true) return res.status(400).json({ error: 'player_deletion_request_required' });
      const target = await users.findOne({ uid: review.targetUid, username: review.username });
      if (!target || (target.playerByNetwork?.[network]?.version ?? null) !== review.playerVersion)
        return res.status(409).json({ error: 'player_review_expired_or_changed' });
      if (review.action === 'scores') {
        const claimed = await reviews.findOneAndUpdate({ _id: reviewId, ownerUid, network, used: false, expiresAt: { $gt: new Date() } }, { $set: { used: true } });
        if (!claimed) return res.status(409).json({ error: 'player_review_expired_or_changed' });
        const result = await users.updateOne({ uid: target.uid, username: target.username,
          [`playerByNetwork.${network}.activeRunId`]: null,
          [`playerByNetwork.${network}.version`]: review.playerVersion }, {
          $set: { [careerField(network)]: 0, [bestRunField(network)]: { score: 0, level: null }, [`bestScoreV2.${network}`]: 0,
            ...(network === 'mainnet' ? { bestScore: 0 } : {}) },
        });
        if (!result.matchedCount) return res.status(409).json({ error: 'finish_active_run_before_reset' });
        return res.json({ deleted: true, action: 'scores', network });
      }
      if (review.targetUid === ownerUid || target.username === '19Trojan69'
        || [process.env.ADMIN_PI_UID?.trim(), process.env.ADMIN_PI_TESTNET_UID?.trim()].includes(target.uid))
        return res.status(403).json({ error: 'owner_account_protected' });
      if (otherNetworkData(target, network)) return res.status(409).json({ error: 'other_network_account_present' });
      if (network === 'testnet' && !testnetAccountDeletionEnabled()) return res.status(503).json({ error: 'account_deletion_not_enabled' });
      const client = req.app.locals.databaseClient;
      if (!client?.startSession || !req.app.locals.sessionCollection || !req.app.locals.feedbackCollection
        || !req.app.locals.feedbackVotesCollection || !req.app.locals.feedbackTranslationsCollection || !req.app.locals.orderCollection)
        return res.status(503).json({ error: 'account_deletion_transaction_unavailable' });
      session = client.startSession();
      await session.withTransaction(async () => {
        const opts = { session };
        const claimed = await reviews.findOneAndUpdate({ _id: reviewId, ownerUid, network, used: false, expiresAt: { $gt: new Date() } }, { $set: { used: true } }, opts);
        if (!claimed) throw Error('review_changed');
        const current = await users.findOne({ uid: target.uid, username: target.username }, opts);
        if (!current || (current.playerByNetwork?.[network]?.version ?? null) !== review.playerVersion || otherNetworkData(current, network)) throw Error('target_changed');
        const posts = req.app.locals.feedbackCollection, votes = req.app.locals.feedbackVotesCollection, translations = req.app.locals.feedbackTranslationsCollection;
        const owned = await posts.find({ uid: target.uid }, opts).project({ _id: 1 }).toArray();
        const affected = await posts.find({ 'replies.uid': target.uid }, opts).project({ _id: 1 }).toArray();
        const ownedIds = owned.map((p: any) => p._id), affectedIds = [...ownedIds, ...affected.map((p: any) => p._id)];
        // Old cache rows contain only a hash and translated text. Retire those
        // unassignable copies too; canonical posts are unaffected.
        await translations.deleteMany({ $or: [{ postId: { $in: affectedIds } }, { postId: { $exists: false } }] }, opts);
        await votes.deleteMany({ $or: [{ uid: target.uid }, { postId: { $in: ownedIds } }] }, opts);
        await posts.updateMany({ 'replies.uid': target.uid }, { $pull: { replies: { uid: target.uid } } }, opts);
        await posts.deleteMany({ uid: target.uid }, opts);
        const orders = req.app.locals.orderCollection;
        for await (const order of orders.find({ user: target.uid }, opts)) {
          if (order.paid === true) {
            // Keep only the technical receipt reference to prevent a previously
            // fulfilled payment being credited to a recreated account again.
            const receipt: Record<string, unknown> = { _id: order._id, playerUnlinked: true };
            for (const field of ['pi_payment_id', 'paid', 'product_id', 'quantity', 'weapon_model', 'payment_network', 'payment_amount_pi', 'created_at', 'consumed_at'])
              if (order[field] !== undefined) receipt[field] = order[field];
            await orders.replaceOne({ _id: order._id, user: target.uid }, receipt, opts);
          } else await orders.deleteOne({ _id: order._id, user: target.uid }, opts);
        }
        const uidJson = literal(JSON.stringify(target.uid));
        await req.app.locals.sessionCollection.deleteMany({ $or: [{ 'session.currentUser.uid': target.uid },
          { session: { $regex: `"currentUser"\\s*:\\s*\\{[^}]*"uid"\\s*:\\s*${uidJson}` } }] }, opts);
        await reviews.deleteMany({ kind: 'player-action', targetUid: target.uid }, opts);
        await reviews.updateOne({ _id: deletedAccountKey(target.uid) }, { $set: { kind: 'deleted-account', tokenHash: target.accessToken ? digest(target.accessToken) : null, at: new Date() } }, { ...opts, upsert: true });
        if (target.accessToken) await reviews.updateOne({ _id: deletedTokenKey(target.accessToken) }, { $set: { kind: 'deleted-token', at: new Date() } }, { ...opts, upsert: true });
        const deleted = await users.deleteOne({ _id: target._id, uid: target.uid, username: target.username }, opts);
        if (deleted.deletedCount !== 1) throw Error('target_changed');
      }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
      return res.json({ deleted: true, action: 'account', network, paymentReferencesRetainedWithoutPlayer: true });
    } catch { return res.status(503).json({ error: 'player_action_unavailable' }); }
    finally { try { await session?.endSession(); } catch { /* Transaction outcome has already been handled. */ } }
  });
}
