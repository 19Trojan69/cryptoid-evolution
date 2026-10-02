import { getBaseURL } from "./axiosClient";

type BrowserKind = "pi" | "external" | "unknown";
let started = false;
// Only fixed categories leave the device. No IDs, cookies, login data or URLs.
async function browserKind(): Promise<BrowserKind> {
  if (/pibrowser|pi-browser/i.test(navigator.userAgent)) return "pi";
  for (let attempt = 0; attempt < 8; attempt++) {
    if (window.Pi?.getPiHostAppInfo) {
      try {
        const info = await Promise.race([window.Pi.getPiHostAppInfo(), new Promise<null>(resolve => setTimeout(() => resolve(null), 1500))]);
        if (info?.hostApp === "pi-browser") return "pi";
        if (info?.hostApp === "web") return "external";
      } catch { /* Missing host info remains unknown, not a guessed Pi login. */ }
      return "unknown";
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return "unknown";
}

export async function startAggregateUsage() {
  if (started) return;
  started = true;
  const browser = await browserKind();
  const endpoint = `${getBaseURL().replace(/\/$/, "")}/usage/collect`;
  const send = (body: object) => {
    void fetch(endpoint, { method: "POST", credentials: "omit", referrerPolicy: "no-referrer", keepalive: true,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ browser, ...body }) }).catch(() => {});
  };
  let counted = false, last = performance.now(), interacted = last, previousPath = location.pathname;
  const eligible = () => !document.hidden && !/^\/(admin|privacy|terms)(\/|$)/.test(location.pathname);
  const count = () => { if (!counted && eligible()) { counted = true; send({ kind: "visit" }); } };
  const activity = () => {
    interacted = performance.now();
    if (previousPath !== location.pathname) { previousPath = location.pathname; last = interacted; }
    count();
  };
  const tick = () => {
    const now = performance.now();
    if (previousPath !== location.pathname) { previousPath = location.pathname; last = now; count(); return; }
    // Hidden, idle (>60s) and throttled-away time is excluded. Never backfill it.
    const seconds = Math.floor(Math.max(0, Math.min(now, interacted + 60_000) - last) / 1000);
    if (eligible() && now - last <= 35_000 && seconds > 0) {
      const game = document.querySelector(".game-shell");
      count(); send({ kind: "active", seconds: Math.min(30, seconds), playing: location.pathname === "/game" && !!game && game.getAttribute("data-effects-paused") !== "true" });
    }
    last = now;
  };
  count();
  setInterval(tick, 30_000);
  document.addEventListener("visibilitychange", () => { last = performance.now(); if (!document.hidden) activity(); });
  window.addEventListener("pageshow", activity);
  for (const event of ["pointerdown", "pointermove", "keydown", "touchmove"]) document.addEventListener(event, activity, { passive: true });
}
