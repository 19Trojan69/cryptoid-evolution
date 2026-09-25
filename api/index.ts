import { app, start } from "../backend/src/index";

let ready: Promise<void> | undefined;

export default async function handler(req: any, res: any) {
  try {
    ready ??= start(false);
    await ready;

    const url = new URL(req.url || "/", "http://localhost");
    req.url = "/" + (url.searchParams.get("path") || "");

    return app(req, res);
  } catch (error) {
    ready = undefined;
    console.error("API error:", error);
    return res.status(500).json({ error: "Backend unavailable" });
  }
}
