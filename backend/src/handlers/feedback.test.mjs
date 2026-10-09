import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
process.env.ADMIN_PI_TESTNET_UID = "developer";
process.env.ADMIN_PI_UID = "mainnet-developer";
const routes = {},
  middleware = [];
require("../../build/handlers/feedback.js").default({
  use: (h) => middleware.push(h),
  get: (p, h) => (routes["GET " + p] = h),
  post: (p, h) => (routes["POST " + p] = h),
  put: (p, h) => (routes["PUT " + p] = h),
  patch: (p, h) => (routes["PATCH " + p] = h),
});
const matches = (doc, query) =>
  Object.entries(query).every(([k, v]) => {
    const value = k.split(".").reduce((o, k) => o?.[k], doc);
    return v && typeof v === "object"
      ? "$exists" in v
        ? (value !== undefined) === v.$exists
        : "$in" in v
          ? v.$in.includes(value)
          : false
      : value === v;
  });
function harness() {
  const posts = [],
    votes = [],
    pipelines = [];
  const collection = (docs) => ({
    async findOne(q) {
      return structuredClone(docs.find((d) => matches(d, q)) || null);
    },
    async insertOne(doc) {
      if (docs.some((d) => d._id === doc._id))
        throw Object.assign(Error(), { code: 11000 });
      docs.push(structuredClone(doc));
      return { insertedId: doc._id };
    },
    async updateOne(q, update, opts = {}) {
      let doc = docs.find((d) => matches(d, q)),
        inserted = false;
      if (!doc && opts.upsert) {
        if (docs.some((d) => d._id === q._id))
          throw Object.assign(Error(), { code: 11000 });
        doc = { ...q, ...structuredClone(update.$setOnInsert || {}) };
        docs.push(doc);
        inserted = true;
      }
      if (!doc) return { matchedCount: 0, modifiedCount: 0 };
      Object.assign(doc, structuredClone(update.$set || {}));
      for (const [key, value] of Object.entries(update.$push || {}))
        (doc[key] ??= []).push(structuredClone(value));
      return { matchedCount: inserted ? 0 : 1, modifiedCount: 1 };
    },
    async deleteOne(q) {
      const index = docs.findIndex((d) => matches(d, q));
      if (index >= 0) docs.splice(index, 1);
      return { deletedCount: index >= 0 ? 1 : 0 };
    },
    find(q) {
      return {
        async toArray() {
          return structuredClone(docs.filter((d) => matches(d, q)));
        },
      };
    },
  });
  const locals = {
    feedbackCollection: collection(posts),
    feedbackVotesCollection: collection(votes),
  };
  locals.feedbackCollection.aggregate = (pipeline) => ({
    async toArray() {
      pipelines.push(pipeline);
      const match = pipeline[0].$match,
        sort = pipeline.find((p) => p.$sort).$sort,
        skip = pipeline.find((p) => p.$skip !== undefined).$skip,
        limit = pipeline.find((p) => p.$limit).$limit;
      const result = posts
        .filter((p) => matches(p, match))
        .map((p) => ({
          ...p,
          up: votes.filter(
            (v) =>
              v.network === p.network && v.postId === p._id && v.value === 1,
          ).length,
          down: votes.filter(
            (v) =>
              v.network === p.network && v.postId === p._id && v.value === -1,
          ).length,
        }));
      result.sort(
        (a, b) =>
          (sort.up && b.up - a.up) ||
          b.createdAt.localeCompare(a.createdAt) ||
          a._id.localeCompare(b._id),
      );
      return structuredClone(result.slice(skip, skip + limit));
    },
  });
  async function call(method, body = {}, opts = {}) {
    const uid = opts.uid === undefined ? "pilot" : opts.uid,
      network = opts.network || "testnet";
    const req = {
      body,
      params: { id: opts.id },
      query: {
        category: opts.category || "idea",
        sort: opts.sort || "newest",
        page: opts.page || 1,
        ...(opts.hidden ? { hidden: "1" } : {}),
      },
      session: uid ? { currentUser: { uid, username: uid } } : {},
      headers: { "x-cryptoid-app-network": network },
      get: () => network,
      app: { locals },
    };
    const res = {
      code: 200,
      setHeader() {},
      status(code) {
        this.code = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };
    await routes[method](req, res);
    return res;
  }
  return { posts, votes, pipelines, call };
}
const idea = {
  category: "idea",
  title: "Fleet controls",
  description: "Improve small screen controls",
};
test("feedback validates login and fields, separates ratings and scopes all operations to the network", async () => {
  const h = harness();
  assert.equal((await h.call("POST /posts", idea, { uid: null })).code, 401);
  for (const invalid of [
    { ...idea, title: "" },
    { ...idea, description: "x".repeat(3001) },
    { category: "rating", stars: 6, description: "" },
  ])
    assert.equal((await h.call("POST /posts", invalid)).code, 400);
  const created = await h.call("POST /posts", idea);
  assert.equal(created.code, 201);
  assert.equal(created.body.post.uid, undefined);
  const id = created.body.post.id;
  assert.equal(
    (
      await h.call(
        "PUT /posts/:id/vote",
        { value: 1 },
        { id, network: "mainnet" },
      )
    ).code,
    404,
  );
  assert.equal(
    (await h.call("GET /posts", {}, { network: "mainnet" })).body.posts.length,
    0,
  );
  await h.call("POST /posts", {
    category: "rating",
    stars: 4,
    description: "",
  });
  await h.call("POST /posts", {
    category: "rating",
    stars: 5,
    description: "Great",
  });
  assert.equal(h.posts.filter((p) => p.category === "rating").length, 1);
  const rating = h.posts.find((p) => p.category === "rating");
  assert.equal(rating.stars, 5);
  assert.equal(
    (await h.call("PUT /posts/:id/vote", { value: 1 }, { id: rating._id }))
      .code,
    400,
  );
});
test("one vote per account supports change, undo and concurrent retry without counter drift; problems never have downvotes", async () => {
  const h = harness();
  const id = (await h.call("POST /posts", idea)).body.post.id;
  await Promise.all(
    Array.from({ length: 6 }, () =>
      h.call("PUT /posts/:id/vote", { value: 1 }, { id }),
    ),
  );
  assert.equal(h.votes.length, 1);
  await h.call("PUT /posts/:id/vote", { value: -1 }, { id });
  let list = (await h.call("GET /posts")).body.posts;
  assert.equal(list[0].up, 0);
  assert.equal(list[0].down, 1);
  assert.equal(list[0].ownVote, -1);
  await h.call("PUT /posts/:id/vote", { value: 1 }, { id, uid: "second" });
  await h.call("PUT /posts/:id/vote", { value: 0 }, { id });
  list = (await h.call("GET /posts")).body.posts;
  assert.equal(list[0].up, 1);
  assert.equal(list[0].down, 0);
  assert.equal(list[0].ownVote, 0);
  assert.equal(
    (await h.call("PUT /posts/:id/vote", { value: 1 }, { id, uid: null })).code,
    401,
  );
  const problem = (
    await h.call("POST /posts", { ...idea, category: "problem" })
  ).body.post.id;
  assert.equal(
    (await h.call("PUT /posts/:id/vote", { value: -1 }, { id: problem })).code,
    400,
  );
  assert.equal(
    (await h.call("PUT /posts/:id/vote", { value: 1 }, { id: problem })).code,
    200,
  );
});
test("only verified admin can reply, assign status and moderate; editing a rating cannot unhide it", async () => {
  const h = harness();
  const id = (await h.call("POST /posts", idea)).body.post.id;
  for (const [method, body] of [
    ["POST /posts/:id/reply", { text: "Planned" }],
    ["PATCH /posts/:id/moderate", { status: "planned", hidden: true }],
  ]) {
    assert.equal((await h.call(method, body, { id })).code, 403);
    assert.equal((await h.call(method, body, { id, uid: null })).code, 401);
  }
  assert.equal(
    (
      await h.call(
        "POST /posts/:id/reply",
        { text: "We are reviewing this.", developer: false },
        { id, uid: "developer" },
      )
    ).code,
    200,
  );
  assert.equal(h.posts[0].replies[0].developer, true);
  assert.equal(
    (
      await h.call(
        "PATCH /posts/:id/moderate",
        { status: "invented" },
        { id, uid: "developer" },
      )
    ).code,
    400,
  );
  assert.equal(
    (
      await h.call(
        "PATCH /posts/:id/moderate",
        { status: "planned", hidden: true },
        { id, uid: "developer" },
      )
    ).code,
    200,
  );
  assert.equal((await h.call("GET /posts")).body.posts.length, 0);
  assert.equal((await h.call("GET /posts", {}, { hidden: true })).code, 403);
  assert.equal(
    (await h.call("PUT /posts/:id/vote", { value: 1 }, { id })).code,
    404,
  );
  const adminList = (
    await h.call("GET /posts", {}, { hidden: true, uid: "developer" })
  ).body;
  assert.equal(adminList.posts[0].status, "planned");
  assert.equal(adminList.posts[0].replies[0].uid, undefined);
  assert.equal(
    (
      await h.call(
        "PATCH /posts/:id/moderate",
        { hidden: false },
        { id, uid: "developer", network: "mainnet" },
      )
    ).code,
    403,
  );
  await h.call(
    "PATCH /posts/:id/moderate",
    { hidden: false },
    { id, uid: "developer" },
  );
  assert.equal((await h.call("GET /posts")).body.posts.length, 1);
  const rating = (
    await h.call("POST /posts", {
      category: "rating",
      stars: 4,
      description: "",
    })
  ).body.post.id;
  await h.call(
    "PATCH /posts/:id/moderate",
    { hidden: true },
    { id: rating, uid: "developer" },
  );
  await h.call("POST /posts", {
    category: "rating",
    stars: 5,
    description: "Changed",
  });
  assert.equal(h.posts.find((p) => p._id === rating).hidden, true);
});
test("support sorting uses positive votes and paginates, with network constraint inside vote lookup", async () => {
  const h = harness();
  for (let i = 0; i < 32; i++)
    await h.call("POST /posts", { ...idea, title: "Idea " + i });
  const older = h.posts[0];
  older.createdAt = "2020-01-01T00:00:00.000Z";
  await h.call("PUT /posts/:id/vote", { value: 1 }, { id: older._id });
  const list = await h.call("GET /posts", {}, { sort: "support" });
  assert.equal(list.body.posts[0].id, older._id);
  assert.equal(list.body.posts.length, 30);
  assert.equal(list.body.hasMore, true);
  assert.equal(
    (await h.call("GET /posts", {}, { page: 2 })).body.posts.length,
    2,
  );
  const lookup = h.pipelines[0].find((p) => p.$lookup).$lookup;
  assert.equal(lookup.from, "feedback_votes");
  assert.ok(JSON.stringify(lookup.pipeline).includes("testnet"));
  assert.equal((await h.call("GET /posts", {}, { page: -1 })).code, 400);
});
