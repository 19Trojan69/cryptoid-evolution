import { app, start } from "../backend/src/index";

let ready: Promise<void> | undefined;
const productionBackendOrigin = "https://cryptoid-evolution.vercel.app";

const isTestnetDeployment = (req: any) => {
  const host = String(req.headers?.host || "").split(":")[0].toLowerCase();
  const projectURL = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || "").toLowerCase();
  return host === "cryptoid-evolution-testnet.vercel.app" || projectURL === "cryptoid-evolution-testnet.vercel.app";
};

const proxyToProduction = async (req: any, res: any, path: string, requestURL: URL) => {
  const target = new URL(`/api/${path}`, productionBackendOrigin);
  requestURL.searchParams.delete("path");
  target.search = requestURL.searchParams.toString();

  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers || {})) {
    if (["host", "content-length", "connection", "transfer-encoding"].includes(name.toLowerCase()) || value == null) continue;
    headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
  }

  let body: BodyInit | undefined;
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    if (req.body != null) {
      body = typeof req.body === "string" || Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      body = Buffer.concat(chunks);
    }
  }

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

export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const path = url.searchParams.get("path") || "";

    if (isTestnetDeployment(req)) return await proxyToProduction(req, res, path, url);

    ready ??= start(false);
    await ready;

    req.url = "/" + path;

    return app(req, res);
  } catch (error) {
    ready = undefined;
    console.error("API error:", error);
    return res.status(500).json({ error: "Backend unavailable" });
  }
}
