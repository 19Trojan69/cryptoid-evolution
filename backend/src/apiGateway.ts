import { hangarCatalog } from "./hangarCatalog";
import { communityLocale, translateCommunity } from "./communityTranslation";
import { testnetAccountDeletionEnabled } from './playerAdministration';

const productionBackendOrigin = "https://cryptoid-evolution.vercel.app";

type Backend = {
  app: (req: any, res: any) => unknown;
  start: (listen: boolean) => Promise<void>;
  proxyAccountAllowed?: (req: any) => Promise<boolean>;
};
type GatewayEnvironment = {
  VERCEL_ENV?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  CRYPTOID_TESTNET_BACKEND?: string;
};

const localTestnetEnabled = (env: GatewayEnvironment) =>
  env.VERCEL_ENV === "preview" && env.CRYPTOID_TESTNET_BACKEND === "local";

const isTestnetDeployment = (req: any, env: GatewayEnvironment) => {
  const host = String(req.headers?.host || "")
    .split(":")[0]
    .toLowerCase();
  const projectURL = String(
    env.VERCEL_PROJECT_PRODUCTION_URL || "",
  ).toLowerCase();
  return (
    localTestnetEnabled(env) ||
    host === "cryptoid-evolution-testnet.vercel.app" ||
    projectURL === "cryptoid-evolution-testnet.vercel.app"
  );
};

// Preview credentials only provide MongoDB. Keep operations requiring the
// existing Pi application keys on the verified payment service.
const needsPiApplicationKey = (path: string) =>
  /^(?:payments|notifications)(?:\/|$)/.test(path) ||
  /^admin\/payments\/[^/]+\/refresh$/.test(path) ||
  path === "admin/status";

const proxyToProduction = async (
  req: any,
  res: any,
  path: string,
  requestURL: URL,
) => {
  const target = new URL(`/api/${path}`, productionBackendOrigin);
  target.search = requestURL.searchParams.toString();
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers || {})) {
    if (
      [
        "host",
        "content-length",
        "connection",
        "transfer-encoding",
        "x-vercel-protection-bypass",
        "x-vercel-set-bypass-cookie",
        "x-vercel-trusted-oidc-idp-token",
      ].includes(name.toLowerCase()) ||
      value == null
    )
      continue;
    headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
  }

  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    if (req.body != null) {
      body =
        typeof req.body === "string" || Buffer.isBuffer(req.body)
          ? req.body
          : JSON.stringify(req.body);
      if (!headers.has("content-type"))
        headers.set("content-type", "application/json");
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      body = Buffer.concat(chunks);
    }
  }
  headers.set("x-cryptoid-app-network", "testnet");
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
    redirect: "manual",
  });
  upstream.headers.forEach((value, name) => {
    if (
      ![
        "content-encoding",
        "content-length",
        "transfer-encoding",
        "set-cookie",
      ].includes(name.toLowerCase())
    ) {
      res.setHeader(name, value);
    }
  });
  const setCookies = (
    upstream.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie?.();
  if (setCookies?.length) res.setHeader("set-cookie", setCookies);
  else if (upstream.headers.get("set-cookie"))
    res.setHeader("set-cookie", upstream.headers.get("set-cookie"));
  res.setHeader("x-cryptoid-backend", "production-proxy");
  const upstreamId = upstream.headers.get('x-vercel-id');
  if (upstreamId && upstreamId.length <= 200 && /^[a-z0-9:_-]+$/.test(upstreamId))
    res.setHeader('x-cryptoid-upstream-request-id', upstreamId);
  return res
    .status(upstream.status)
    .send(Buffer.from(await upstream.arrayBuffer()));
};

export const createApiGateway = (
  loadBackend: () => Promise<Backend>,
  environment: () => GatewayEnvironment = () => ({
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    CRYPTOID_TESTNET_BACKEND: process.env.CRYPTOID_TESTNET_BACKEND,
  }),
) => {
  let ready: Promise<Backend> | undefined;
  return async (req: any, res: any) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      const path = url.searchParams.get("path") || "";
      url.searchParams.delete("path");
      const env = environment();
      const testnet = isTestnetDeployment(req, env);
      const localTestnet = localTestnetEnabled(env);
      // Add only the new, network-scoped features locally. Existing Testnet
      // accounts/payments keep their established proxy; no Mainnet deployment.
      const localFeature = testnet && (/^progress\/boss-summary\/(?:prepare|continue)$/.test(path)
        || /^admin\/players(?:\/|$)/.test(path));
      // The public catalog must match this deployment's Shop, even while
      // account and payment requests use the established Pi service.
      if (
        testnet &&
        path === "hangar/catalog" &&
        ["GET", "HEAD"].includes(req.method || "GET")
      ) {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("x-cryptoid-backend", "testnet-catalog");
        return res.status(200).json({ offers: hangarCatalog });
      }
      // Testnet reads public Community data from the established backend. Add
      // translation here so that service does not need a Mainnet deployment.
      if (
        testnet &&
        !localTestnet &&
        /^feedback\/posts\/[^/]+\/translation$/.test(path) &&
        req.method === "GET"
      ) {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("x-cryptoid-backend", "testnet-translation");
        const id = path.split("/")[2],
          locale = communityLocale(url.searchParams.get("locale"));
        const replyId = url.searchParams.get("reply"),
          category = url.searchParams.get("category") || "idea";
        const page = Number(url.searchParams.get("page") || "1"),
          sort = url.searchParams.get("sort") || "newest";
        if (
          !/^[a-f0-9]{32}$/.test(id) ||
          !locale ||
          (replyId !== null && !/^[a-f0-9-]{36}$/.test(replyId)) ||
          !["idea", "rating", "problem"].includes(category) ||
          !["newest", "support"].includes(sort) ||
          !Number.isInteger(page) ||
          page < 1 ||
          page > 1000
        )
          return res.status(400).json({ error: "invalid_translation" });
        try {
          const source = new URL(
            "/api/feedback/posts",
            productionBackendOrigin,
          );
          source.search = new URLSearchParams({
            category,
            page: String(page),
            sort,
            hidden: "0",
          }).toString();
          // Public content only: do not forward session cookies or tokens.
          const upstream = await fetch(source, {
            headers: { "x-cryptoid-app-network": "testnet" },
            signal: AbortSignal.timeout(8000),
          });
          if (!upstream.ok) throw new Error("feedback_unavailable");
          const data = (await upstream.json()) as any;
          const post =
            data.network === "testnet" &&
            data.posts?.find(
              (item: any) => item.id === id && item.hidden === false,
            );
          const reply =
            replyId && post?.replies?.find((item: any) => item.id === replyId);
          if (!post || (replyId && !reply))
            return res.status(404).json({ error: "not_found" });
          const fields = reply
            ? [reply.text]
            : [post.title || "", post.description || ""];
          return res.json(await translateCommunity(fields, locale));
        } catch {
          return res.status(503).json({ error: "translation_unavailable" });
        }
      }
      if (testnet && !localFeature && (!localTestnet || needsPiApplicationKey(path))) {
        // A deleted account's previous token must not recreate it through the
        // established proxy. This guard is enabled together with deletion.
        if (testnetAccountDeletionEnabled() && (req.headers?.authorization || path === 'user/signin')) {
          ready ??= loadBackend().then(async backend => { await backend.start(false); return backend; });
          const backend = await ready;
          if (!backend.proxyAccountAllowed) return res.status(503).json({ error: 'account_deletion_guard_unavailable' });
          if (!await backend.proxyAccountAllowed(req)) return res.status(410).json({ error: 'account_deleted' });
        }
        return await proxyToProduction(req, res, path, url);
      }
      if (localTestnet || localFeature) {
        req.headers ??= {};
        req.headers["x-cryptoid-app-network"] = "testnet";
      }
      ready ??= loadBackend().then(async (backend) => {
        await backend.start(false);
        return backend;
      });
      const backend = await ready;
      const query = url.searchParams.toString();
      req.url = "/" + path + (query ? "?" + query : "");
      res.setHeader(
        "x-cryptoid-backend",
        localTestnet || localFeature ? "testnet-local" : "local",
      );
      res.setHeader("x-cryptoid-score-api", "5");
      return backend.app(req, res);
    } catch (error) {
      ready = undefined;
      console.error("API error:", error);
      return res.status(500).json({ error: "Backend unavailable" });
    }
  };
};

