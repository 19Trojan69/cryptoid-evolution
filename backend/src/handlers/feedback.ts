import { createHash, randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { canAdmin } from "../adminAccess";
import { rewardNetwork } from "../rewardNetwork";
import "../types/session";

export const feedbackCategories = ["rating", "idea", "problem"] as const;
export const feedbackStatuses = ["open", "review", "planned", "done"] as const;
const validId = (id: unknown): id is string =>
  typeof id === "string" && /^[a-f0-9]{32}$/.test(id);
const text = (value: unknown, max: number, required = false): value is string =>
  typeof value === "string" &&
  value.length <= max &&
  (!required || value.trim().length > 0);
const safePost = (post: any, ownVote = 0) => ({
  id: post._id,
  category: post.category,
  username: post.username,
  title: post.title,
  description: post.description,
  stars: post.stars,
  status: post.status,
  hidden: post.hidden,
  createdAt: post.createdAt,
  up: post.up || 0,
  down: post.down || 0,
  ownVote,
  replies: (post.replies || []).map((r: any) => ({
    id: r.id,
    text: r.text,
    username: r.username,
    createdAt: r.createdAt,
    developer: true,
  })),
});
const voteKey = (network: string, postId: string, uid: string) =>
  createHash("sha256")
    .update(JSON.stringify([network, postId, uid]))
    .digest("hex");
const fail = (res: Response) =>
  res.status(503).json({ error: "feedback_unavailable" });
const signedIn = (req: Request, res: Response) => {
  const user = req.session.currentUser;
  if (!user?.uid) res.status(401).json({ error: "not_authenticated" });
  return user;
};

export default function mountFeedbackEndpoints(router: Router) {
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  router.get("/posts", async (req, res) => {
    const network = rewardNetwork(req),
      category = req.query.category,
      sort = req.query.sort || "newest",
      page = Number(req.query.page || 1);
    if (
      !feedbackCategories.includes(category as any) ||
      !["newest", "support"].includes(String(sort)) ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > 1000
    )
      return res.status(400).json({ error: "invalid_filter" });
    try {
      const admin = await canAdmin(req),
        showHidden = req.query.hidden === "1";
      if (showHidden && !admin)
        return res.status(403).json({ error: "not_authorized" });
      const match = {
        network,
        category,
        ...(!showHidden ? { hidden: false } : {}),
      };
      const posts = await req.app.locals.feedbackCollection
        .aggregate([
          { $match: match },
          {
            $lookup: {
              from: "feedback_votes",
              let: { post: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$postId", "$$post"] },
                        { $eq: ["$network", network] },
                      ],
                    },
                  },
                },
                {
                  $group: {
                    _id: null,
                    up: { $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] } },
                    down: { $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] } },
                  },
                },
              ],
              as: "counts",
            },
          },
          {
            $set: {
              up: { $ifNull: [{ $arrayElemAt: ["$counts.up", 0] }, 0] },
              down: { $ifNull: [{ $arrayElemAt: ["$counts.down", 0] }, 0] },
            },
          },
          {
            $sort:
              sort === "support"
                ? { up: -1, createdAt: -1, _id: 1 }
                : { createdAt: -1, _id: 1 },
          },
          { $skip: (page - 1) * 30 },
          { $limit: 31 },
          { $project: { uid: 0, network: 0, counts: 0 } },
        ])
        .toArray();
      const shown = posts.slice(0, 30),
        uid = req.session.currentUser?.uid;
      const votes =
        uid && shown.length
          ? await req.app.locals.feedbackVotesCollection
              .find({
                network,
                uid,
                postId: { $in: shown.map((p: any) => p._id) },
              })
              .toArray()
          : [];
      return res.json({
        network,
        admin,
        page,
        hasMore: posts.length > 30,
        posts: shown.map((p: any) =>
          safePost(p, votes.find((v: any) => v.postId === p._id)?.value || 0),
        ),
      });
    } catch {
      return fail(res);
    }
  });
  router.post("/posts", async (req, res) => {
    const user = signedIn(req, res);
    if (!user) return;
    const body = req.body,
      network = rewardNetwork(req);
    if (
      !body ||
      !feedbackCategories.includes(body.category) ||
      !text(
        body.description,
        body.category === "rating" ? 500 : 3000,
        body.category !== "rating",
      ) ||
      (body.category === "rating" &&
        (!Number.isInteger(body.stars) || body.stars < 1 || body.stars > 5)) ||
      (body.category !== "rating" && !text(body.title, 100, true))
    )
      return res.status(400).json({ error: "invalid_post" });
    try {
      const id =
        body.category === "rating"
          ? voteKey(network, "rating", user.uid).slice(0, 32)
          : randomUUID().replace(/-/g, "");
      const post = {
        _id: id,
        network,
        uid: user.uid,
        username: user.username,
        category: body.category,
        title: body.category === "rating" ? "" : body.title.trim(),
        description: body.description.trim(),
        ...(body.category === "rating" ? { stars: body.stars } : {}),
        status: "open",
        hidden: false,
        createdAt: new Date().toISOString(),
        replies: [],
      };
      const posts = req.app.locals.feedbackCollection;
      if (body.category === "rating") {
        // One editable rating per verified account; editing cannot unhide moderation.
        await posts.updateOne(
          { _id: id, network, uid: user.uid },
          {
            $set: {
              username: post.username,
              description: post.description,
              stars: post.stars,
            },
            $setOnInsert: {
              network,
              uid: user.uid,
              category: "rating",
              title: "",
              status: "open",
              hidden: false,
              createdAt: post.createdAt,
              replies: [],
            },
          },
          { upsert: true },
        );
        return res.json({
          post: safePost(
            await posts.findOne({ _id: id, network, uid: user.uid }),
          ),
        });
      }
      await posts.insertOne(post);
      return res.status(201).json({ post: safePost(post) });
    } catch {
      return fail(res);
    }
  });
  router.put("/posts/:id/vote", async (req, res) => {
    const user = signedIn(req, res);
    if (!user) return;
    const id = req.params.id,
      value = req.body?.value,
      network = rewardNetwork(req);
    if (!validId(id) || ![0, 1, -1].includes(value))
      return res.status(400).json({ error: "invalid_vote" });
    try {
      const post = await req.app.locals.feedbackCollection.findOne({
        _id: id,
        network,
        hidden: false,
      });
      if (!post) return res.status(404).json({ error: "not_found" });
      if (
        post.category === "rating" ||
        (post.category === "problem" && value === -1)
      )
        return res.status(400).json({ error: "invalid_vote" });
      const votes = req.app.locals.feedbackVotesCollection,
        _id = voteKey(network, id, user.uid);
      if (value === 0) await votes.deleteOne({ _id });
      else {
        const update = { $set: { network, postId: id, uid: user.uid, value } };
        try {
          await votes.updateOne({ _id }, update, { upsert: true });
        } catch (e: any) {
          if (e?.code !== 11000) throw e;
          await votes.updateOne({ _id }, update);
        }
      }
      return res.json({ ownVote: value });
    } catch {
      return fail(res);
    }
  });
  router.post("/posts/:id/reply", async (req, res) => {
    if (!signedIn(req, res)) return;
    try {
      if (!(await canAdmin(req)))
        return res.status(403).json({ error: "not_authorized" });
      const id = req.params.id;
      if (!validId(id) || !text(req.body?.text, 2000, true))
        return res.status(400).json({ error: "invalid_reply" });
      const reply = {
        id: randomUUID(),
        text: req.body.text.trim(),
        username: req.session.currentUser!.username,
        developer: true,
        createdAt: new Date().toISOString(),
      };
      const result = await req.app.locals.feedbackCollection.updateOne(
        {
          _id: id,
          network: rewardNetwork(req),
          "replies.19": { $exists: false },
        },
        { $push: { replies: reply } },
      );
      if (!result.matchedCount)
        return res
          .status(409)
          .json({ error: "post_unavailable_or_reply_limit" });
      return res.json({ reply });
    } catch {
      return fail(res);
    }
  });
  router.patch("/posts/:id/moderate", async (req, res) => {
    if (!signedIn(req, res)) return;
    try {
      if (!(await canAdmin(req)))
        return res.status(403).json({ error: "not_authorized" });
      const id = req.params.id,
        body = req.body;
      if (
        !validId(id) ||
        !body ||
        (body.status === undefined && body.hidden === undefined) ||
        (body.status !== undefined &&
          !feedbackStatuses.includes(body.status)) ||
        (body.hidden !== undefined && typeof body.hidden !== "boolean")
      )
        return res.status(400).json({ error: "invalid_moderation" });
      const update = {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.hidden !== undefined ? { hidden: body.hidden } : {}),
      };
      const result = await req.app.locals.feedbackCollection.updateOne(
        { _id: id, network: rewardNetwork(req) },
        { $set: update },
      );
      if (!result.matchedCount)
        return res.status(404).json({ error: "not_found" });
      return res.json({ updated: true });
    } catch {
      return fail(res);
    }
  });
}
