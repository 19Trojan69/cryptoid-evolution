import { hangarCatalog } from "./hangarCatalog";

const productionBackendOrigin = "https://cryptoid-evolution.vercel.app";

type Backend = { app: (req: any, res: any) => unknown; start: (listen: boolean) => Promise<void> };
type GatewayEnvironment = {
  VERCEL_ENV?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  CRYPTOID_TESTNET_BACKEND?: string;
};

const localTestnetEnabled = (env: GatewayEnvironment) =>
  env.VERCEL_ENV === "preview" && env.CRYPTOID_TESTNET_BACKEND === "local";

const isTestnetDeployment = (req: any, env: GatewayEnvironment) => {
  const host = String(req.headers?.host || "").split(":")[0].toLowerCase();
  const projectURL = String(env.VERCEL_PROJECT_PRODUCTION_URL || "").toLowerCase();
  return localTestnetEnabled(env) || host === "cryptoid-evolution-testnet.vercel.app" ||
    projectURL === "cryptoid-evolution-testnet.vercel.app";
};

// Preview credentials only provide MongoDB. Keep operations requiring the
// existing Pi application keys on the verified payment service.
const needsPiApplicationKey = (path: string) =>
  /^(?:payments|notifications)(?:\/|$)/.test(path) || /^admin\/payments\/[^/]+\/refresh$/.test(path) || path === "admin/status";

const proxyToProduction = async (req: any, res: any, path: string, requestURL: URL) => {
  const target = new URL(`/api/${path}`, productionBackendOrigin);
  target.search = requestURL.searchParams.toString();
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers || {})) {
    if (["host", "content-length", "connection", "transfer-encoding",
      "x-vercel-protection-bypass", "x-vercel-set-bypass-cookie", "x-vercel-trusted-oidc-idp-token"]
      .includes(name.toLowerCase()) || value == null) continue;
    headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
  }

  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    if (req.body != null) {
      body = typeof req.body === "string" || Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      body = Buffer.concat(chunks);
    }
  }
  headers.set("x-cryptoid-app-network", "testnet");
  const upstream = await fetch(target, { method: req.method, headers, body, redirect: "manual" });
  upstream.headers.forEach((value, name) => {
    if (!["content-encoding", "content-length", "transfer-encoding", "set-cookie"].includes(name.toLowerCase())) {
      res.setHeader(name, value);
    }
  });
  const setCookies = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
  if (setCookies?.length) res.setHeader("set-cookie", setCookies);
  else if (upstream.headers.get("set-cookie")) res.setHeader("set-cookie", upstream.headers.get("set-cookie"));
  res.setHeader("x-cryptoid-backend", "production-proxy");
  return res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
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
      // The public catalog must match this deployment's Shop, even while
      // account and payment requests use the established Pi service.
      if (testnet && path === "hangar/catalog" && ["GET", "HEAD"].includes(req.method || "GET")) {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("x-cryptoid-backend", "testnet-catalog");
        return res.status(200).json({ offers: hangarCatalog });
      }
      if (testnet && (!localTestnet || needsPiApplicationKey(path))) {
        return await proxyToProduction(req, res, path, url);
      }
      if (localTestnet) {
        req.headers ??= {};
        req.headers["x-cryptoid-app-network"] = "testnet";
      }
      ready ??= loadBackend().then(async backend => {
        await backend.start(false);
        return backend;
      });
      const backend = await ready;
      const query = url.searchParams.toString();
      req.url = "/" + path + (query ? "?" + query : "");
      res.setHeader("x-cryptoid-backend", localTestnet ? "testnet-local" : "local");
      res.setHeader("x-cryptoid-score-api", "5");
      return backend.app(req, res);
    } catch (error) {
      ready = undefined;
      console.error("API error:", error);
      return res.status(500).json({ error: "Backend unavailable" });
    }
  };
};
