import { createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { gunzipSync } from "node:zlib";
import type { Request, Response } from "express";
import { withArcadeAudio } from "./galaxyArcadeAudio";
import { withArcadeTouchControls } from "./galaxyArcadeControls";
import { galaxyArcadeNames, galaxyArcadePayload } from "./galaxyArcadePayload";
import { withArcadeRetroStyle } from "./galaxyArcadeRetro";
import { withArcadeSurvival } from "./galaxyArcadeSurvival";
import { arcadeLocale, arcadeStationCopy, type ArcadeLocale } from "./galaxyArcadeCopy";
import { arcadePanelLabels } from "./galaxyArcadeLanguages";
import { withArcadePublicLocale } from "./galaxyArcadePublicLocale";

const stations = galaxyArcadeNames.map((name, index) => ({ level: (index + 1) * 5, name }));
const previewLevels = stations.map(station => station.level);
export const galaxyArcadeStationIndex = (level?: string) => stations.findIndex(station => String(station.level) === level);
const arcadePolicy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; base-uri 'none'; form-action 'none'";
const previewCookie = "__Secure-cryptoid-arcade";
const playCookie = "__Secure-cryptoid-arcade-play";
const playLifetime = 120;
const hexDigest = /^[0-9a-f]{64}$/i;
const publicArcadeHost = "window.parent !== window && new URLSearchParams(location.hash.slice(1)).get('embed') === '1' ? window.parent : null";
const publicArcadeStartup = `
  const arcadeLaunchMeta = document.querySelector('meta[name="cryptoid-arcade-launch"]');
  const arcadeLaunchOptions = new URLSearchParams(arcadeLaunchMeta ? decodeURIComponent(arcadeLaunchMeta.content) : location.hash.slice(1));
  const arcadeHost = window.parent !== window && arcadeLaunchOptions.get('embed') === '1' ? window.parent : null;
  const arcadeHostOrigin = arcadeLaunchMeta ? arcadeLaunchOptions.get('parent-origin') : location.origin;
  function reportArcadeHost(type, hash) {
    arcadeHost?.postMessage({ type, hash }, arcadeHostOrigin);
  }
`;
const standaloneArcadeStartup = `
  const arcadeLaunchOptions = new URLSearchParams(location.hash.slice(1));
  const arcadeScriptNonce = document.currentScript.nonce;
`;

function standaloneDocument(html: string, nonce: string) {
  const storage = /^C\.storage=\{memory:Object\.create\(null\),available:null,.*\};$/m;
  if (!storage.test(html)) throw new Error("Arcade session storage was not found");
  return html
    .replace(/<script>/g, `<script nonce="${nonce}">`)
    // Only the game's own embedded templates are executable on this page.
    .replace(/\b(\w+)\.textContent=\w+\.textContent;(?=document\.head\.appendChild\(\1\))/g,
      (assignment, script) => `${assignment}${script}.nonce=arcadeScriptNonce;`)
    // Retain the old sandbox's round-local storage. The map owns per-player records.
    .replace(storage, `C.storage = {
      memory: Object.create(null),
      available: false,
      get(key, fallback = 0) { return this.memory[key] ?? fallback; },
      set(key, value) { this.memory[key] = value; return false; },
    };`);
}

const sameDigest = (value: string | undefined, expected: string) =>
  typeof value === "string" && hexDigest.test(value) && timingSafeEqual(Buffer.from(value, "hex"), Buffer.from(expected, "hex"));

const readCookie = (header: string | undefined, name: string) =>
  header?.split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);

function playSignature(key: string, level: string, expires: string) {
  const secret = createHmac("sha256", Buffer.from(key, "hex")).update("cryptoid-arcade-play-cookie-v1").digest();
  return createHmac("sha256", secret).update(`${level}:${expires}`).digest("hex");
}

function canOpenPlayPage(cookie: string | undefined, level: string, key: string) {
  const match = /^(\d{13})\.([a-f0-9]{64})$/.exec(cookie ?? "");
  return !!match && Number(match[1]) > Date.now() && sameDigest(match[2], playSignature(key, level, match[1]));
}

export function publicArcadeTicket(key: string, level: string) {
  const expires = String(Date.now() + playLifetime * 1000);
  return `${expires}.${playSignature(key, `retro/${level}`, expires)}`;
}

export function publicArcadeCatalog(language: string | null, owner: string | null = null, reachedLevel = 0) {
  const locale = arcadeLocale(language);
  return {
    owner,
    levels: previewLevels,
    labels: arcadePanelLabels(locale),
    stations: stations.flatMap(({ level, name }, index) =>
      level <= reachedLevel ? [{ level, ...arcadeStationCopy(locale, index, name) }] : []),
  };
}

function previewInvitation(config: string | undefined, key: string) {
  const match = /^([0-9a-f]{64}):(\d{13})$/.exec(config ?? "");
  if (!match) return undefined;
  const maxAge = Math.floor((Number(match[2]) - Date.now()) / 1000);
  if (maxAge <= 0) return undefined;
  const cookieKey = createHmac("sha256", Buffer.from(key, "hex")).update("cryptoid-arcade-preview-cookie-v1").digest();
  return { digest: match[1], maxAge, session: createHmac("sha256", cookieKey).update(match[0]).digest("hex") };
}

const returnBar = (href: string) => `<nav id="galaxy-arcade-navigation"><a href="${href}">‹ Galaxiekarte</a></nav>`;
const playStyles = `<style>
  :root { --arcade-nav-height: calc(44px + env(safe-area-inset-top, 0px)); }
  body { padding-top: var(--arcade-nav-height); }
  #galaxy-arcade-navigation { position: fixed; inset: 0 0 auto; z-index: 20; box-sizing: border-box; height: var(--arcade-nav-height); display: flex; align-items: stretch; padding: env(safe-area-inset-top, 0px) 10px 0; background: #10192d; border-bottom: 1px solid #4c6078; }
  #galaxy-arcade-navigation a { display: inline-flex; align-items: center; padding: 0 10px; color: #eaf0ff; text-decoration: none; font: 600 15px system-ui, sans-serif; }
  #gameScreen { height: calc(100vh - var(--arcade-nav-height)); height: calc(100dvh - var(--arcade-nav-height)); }
  #overlay { top: var(--arcade-nav-height); }
  #dialog .station-preview { width: min(100%, 320px); height: auto; aspect-ratio: 5 / 2; justify-self: center; border: 1px solid #4c6078; }
  @media (max-height: 620px) { #dialog .station-preview { display: none; } }
  #galaxy-arcade-startup { position: fixed; inset: var(--arcade-nav-height) 0 0; z-index: 19; display: grid; place-items: center; padding: 16px; text-align: center; background: #081222; color: #eaf0ff; }
</style>`;

function stationDocument(index: number, key: string, musicKey: string | undefined, returnHref?: string, locale?: ArcadeLocale, nonce?: string) {
  const payload = Buffer.from(galaxyArcadePayload, "base64");
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));
  const html = gunzipSync(Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()])).toString("utf8");
  const game = Math.floor(index / 5) + 1;
  const variant = index % 5 + 1;
  const mission = returnHref ? withArcadeSurvival(html, game, variant) : html;
  const embedded = locale && !nonce;
  const startup = nonce ? standaloneArcadeStartup : locale ? publicArcadeStartup : "";
  const publicStartup = startup ? `<script>${startup}</script>` : "";
  const document = withArcadeAudio(withArcadeRetroStyle(withArcadeTouchControls(mission)), musicKey)
    .replace("<head>", `<head><meta http-equiv="Content-Security-Policy" content="${arcadePolicy}">${publicStartup}`)
    // A frame queued before Start or Resume can carry an older timestamp.
    // Keep the round clock monotonic so the next frame uses the current baseline.
    .replace("previous=now;if(C.mode==='running'", "previous=Math.max(previous,now);if(C.mode==='running'");
  const start = `CE.app.showDetail(${game}).then(() => CE.app.intro(${variant}))`;
  if (!returnHref) return document.replace("</body></html>", `<script>${start};</script></body></html>`);

  const page = document
    .replace('<main id="selection" class="shell">', '<main id="selection" class="shell" hidden>')
    .replace('<button id="back" class="compact"', '<button id="back" class="compact" hidden')
    .replace("let detailToken=0;\n", "")
    .replace(
      /async function showDetail\(n\)\{[\s\S]+?(?=\nfunction backToCatalog\(\))/,
      `async function showDetail() {
        const station = C.catalog[${game - 1}];
        await C.loadModule(station.id);
        selected = station;
        intro(${variant});
        const preview = $('stationPreview');
        C.graphics.ready.then(() => C.graphics.ensureArt?.()).then(() => {
          if (preview.isConnected) drawPreview(preview, station.number);
        }).catch(() => { preview.hidden = true; });
      }`,
    )
    .replace(
      /function backToCatalog\(\)\{[^\n]*\}/,
      `function backToCatalog() {
        startToken++;
        input.clear();
        C.arcadeAudio.pause();
        document.querySelector('#galaxy-arcade-navigation a').click();
      }`,
    )
    .replace(
      '<p class="briefing-goal">',
      '<canvas id="stationPreview" class="art station-preview" width="450" height="180" role="img" aria-label="Missionsvorschau"></canvas><p class="briefing-goal">',
    )
    .replace('id="cancelIntro">Zur Variantenwahl', 'id="cancelIntro">Zur Galaxiekarte')
    .replace("$('cancelIntro').onclick=()=>{closeDialog();showDetail(selected.number);};", "$('cancelIntro').onclick=backToCatalog;")
    .replace(/(id="(?:pauseBack|loadBack)">)Zur Auswahl/g, "$1Zur Galaxiekarte")
    .replace(
      '<button id="variants">Andere Variante</button><button id="resultBack">Zur Missionsauswahl</button>',
      '<button id="resultBack">Zur Galaxiekarte</button>',
    )
    .replace(
      "$('variants').onclick=()=>{closeDialog();showDetail(selected.number);};",
      "",
    )
    .replace(
      "C.graphics.ready.then(async()=>{await C.graphics.ensureArt?.();$('heroShip').src=C.retro.shipThumbnail(C.graphics.testShip);renderCatalog();}).catch(()=>{$('shipCaption').textContent='Originalgrafik konnte nicht geladen werden.';renderCatalog();});",
      "C.graphics.ready.then(() => C.graphics.ensureArt?.()).catch(() => {});",
    )
    .replace("</head>", `${playStyles}</head>`)
    .replace("<body>", `<body>${returnBar(returnHref)}<p id="galaxy-arcade-startup" role="status">Minispiel wird geladen …</p>${embedded ? "<script>reportArcadeHost('cryptoid:arcade-boot');</script>" : ""}`)
    .replace("</body></html>", `<script>
      (() => {
        const status = document.getElementById('galaxy-arcade-startup');
        const host = ${embedded ? "arcadeHost" : "null"};
        const report = ${embedded ? "reportArcadeHost" : "() => {}"};
        if (host) {
          const link = document.querySelector('#galaxy-arcade-navigation a');
          link.addEventListener('click', event => {
            event.preventDefault();
            report('cryptoid:arcade-exit', link.hash);
          });
        }
        const failed = () => {
          status.textContent = 'Das Minispiel konnte nicht gestartet werden. Kehre zur Galaxiekarte zurück und versuche es erneut.${nonce ? " · AR-04" : ""}';
          status.setAttribute('role', 'alert');
          report('cryptoid:arcade-error');
        };
        const timer = setTimeout(failed, 12000);
        Promise.resolve().then(() => CE.app.showDetail()).then(() => {
          status.remove();
          report('cryptoid:arcade-ready');
        }).catch(failed).finally(() => clearTimeout(timer));
      })();
    </script></body></html>`);
  const localized = locale ? withArcadePublicLocale(page, locale, index, stations[index].name) : page;
  return nonce ? standaloneDocument(localized, nonce) : localized;
}

function sendPlayPage(res: Pick<Response, "setHeader" | "status" | "send">, code: number, html: string, access: "public" | "private" = "private", nonce?: string) {
  const ancestors = access === "public" ? "'self' https://cryptoidevo3025.pinet.com" : "'none'";
  // The standalone public document uses the app's normal origin and frame.
  // Only nonce-tagged code can run and the policy permits no network connections.
  const policy = nonce ? arcadePolicy.replace("script-src 'unsafe-inline'", `script-src 'nonce-${nonce}'`)
    : `${arcadePolicy}; sandbox allow-scripts; frame-ancestors ${ancestors}`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Security-Policy", policy);
  if (access === "private") res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  return res.status(code).send(html);
}

function playError(returnHref: string, message: string) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cryptoid Evolution</title>${playStyles}</head><body>${returnBar(returnHref)}<p id="galaxy-arcade-startup" role="alert">${message}</p></body></html>`;
}

export function servePublicGalaxyArcade(
  req: Pick<Request, "method" | "body">,
  res: Pick<Response, "setHeader" | "status" | "json" | "send">,
  path: string | undefined,
  key: string,
  musicKey: string | undefined,
  language: string | null,
) {
  res.setHeader("Cache-Control", "private, no-store");
  const locale = arcadeLocale(language);
  if (path === undefined) {
    if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
    return res.json(publicArcadeCatalog(language));
  }
  const match = /^(\d+)\/(play|document|standalone)$/.exec(path);
  const index = galaxyArcadeStationIndex(match?.[1]);
  if (index < 0) return res.status(404).json({ error: "not_found" });
  const embeddedDocument = match?.[2] === "document";
  const nonce = match?.[2] === "standalone" ? randomBytes(16).toString("base64") : undefined;
  const returnHref = "/galaxy?arcade-return=1";
  // The play document is a normal same-tab form navigation. It only needs a
  // short-lived ticket for this station, without relying on WebView cookies.
  const ticket = req.method === "POST" && typeof req.body?.ticket === "string" ? req.body.ticket : undefined;
  if (!canOpenPlayPage(ticket, `retro/${stations[index].level}`, key)) {
    if (embeddedDocument) return res.status(403).json({ error: "level_locked" });
    const locked = playError(returnHref, "Das Minispiel ist gerade nicht verfügbar. Versuche es erneut über die Galaxiekarte.");
    return sendPlayPage(res, 403, withArcadePublicLocale(locked, locale, index, stations[index].name), "public", nonce);
  }
  try {
    const html = stationDocument(index, key, musicKey, returnHref, locale, nonce);
    if (embeddedDocument) {
      console.info("Galaxy arcade document prepared", stations[index].level);
      return res.json({ document: html });
    }
    return sendPlayPage(res, 200, html, "public", nonce);
  } catch {
    if (embeddedDocument) return res.status(503).json({ error: "arcade_unavailable" });
    const message = "Das Minispiel ist gerade nicht verfügbar. Versuche es erneut über die Galaxiekarte.";
    const unavailable = nonce ? playError(returnHref, `${message} · AR-02`) : playError(returnHref, message)
      .replace("</body>", `<script>(${publicArcadeHost})?.postMessage({ type: 'cryptoid:arcade-error' }, location.origin);</script></body>`);
    return sendPlayPage(res, 503, withArcadePublicLocale(unavailable, locale, index, stations[index].name), "public", nonce);
  }
}

export async function serveGalaxyArcade(
  req: Pick<Request, "method" | "headers">,
  res: Pick<Response, "setHeader" | "status" | "json" | "send">,
  level: string | undefined,
  key: string | undefined,
  ownerEndpoint: URL,
  invitationConfig?: string,
  musicKey?: string,
) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!key || !hexDigest.test(key)) return res.status(404).json({ error: "not_found" });
  const invitation = previewInvitation(invitationConfig, key);

  if (level === "access") {
    if (!invitation) return res.status(404).json({ error: "not_found" });
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
    const header = req.headers["x-cryptoid-arcade-invitation"];
    const code = typeof header === "string" ? header.replace(/[\s-]/g, "").toUpperCase() : "";
    if (!/^[0-9A-F]{24}$/.test(code) || !sameDigest(createHash("sha256").update(code).digest("hex"), invitation.digest)) {
      return res.status(403).json({ error: "invalid_invitation" });
    }
    res.setHeader("Set-Cookie", `${previewCookie}=${invitation.session}; Max-Age=${invitation.maxAge}; Path=/api/admin/galaxy-minigames; HttpOnly; Secure; SameSite=Strict`);
    return res.json({ stations });
  }

  const playRoute = /^(\d+)\/(launch|play)$/.exec(level ?? "");
  const launching = playRoute?.[2] === "launch";
  const playPage = playRoute?.[2] === "play";
  const stationLevel = playRoute?.[1] ?? level;
  if (req.method !== (launching ? "POST" : "GET")) return res.status(405).json({ error: "method_not_allowed" });
  const previewSession = invitation && sameDigest(readCookie(req.headers.cookie, previewCookie), invitation.session);
  const accessHint = level === undefined && invitation ? { previewAccess: true, previewLevels } : {};
  const returnHref = `/galaxy?arcade-return=1${invitation ? "&amp;admin-test=1" : ""}`;

  if (playRoute?.[2] === "play" && !previewSession && !canOpenPlayPage(readCookie(req.headers.cookie, playCookie), playRoute[1], key)) {
    return sendPlayPage(res, 401, playError(returnHref, "Der private Minispielzugang ist abgelaufen. Öffne das Spiel erneut auf der Galaxiekarte."));
  }

  try {
    if (!playPage && !previewSession) {
      const authorization = req.headers.authorization;
      if (typeof authorization !== "string" || !/^Bearer\s+\S+$/i.test(authorization)) {
        return res.status(401).json({ error: "not_authenticated", ...accessHint });
      }
      // Use the existing Testnet owner binding for Pi sessions. Preview cookies
      // only grant arcade access and are never forwarded to the account service.
      const session = await fetch(ownerEndpoint, {
        headers: { authorization, "x-cryptoid-app-network": "testnet" },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if ([401, 403, 410].includes(session.status)) return res.status(session.status).json({ error: "not_authorized", ...accessHint });
      if (!session.ok) return res.status(503).json({ error: "minigame_unavailable" });
      const { user, canAdmin } = await session.json() as { user?: { uid?: string }; canAdmin?: boolean };
      if (!user?.uid || canAdmin !== true) return res.status(403).json({ error: "not_authorized", ...accessHint });
    }

    if (stationLevel === undefined) return res.json({ stations });
    const index = galaxyArcadeStationIndex(stationLevel);
    if (index === -1) return res.status(404).json({ error: "not_found" });
    if (launching) {
      if (!previewSession) {
        const expires = String(Date.now() + playLifetime * 1000);
        const token = `${expires}.${playSignature(key, stationLevel, expires)}`;
        res.setHeader("Set-Cookie", `${playCookie}=${token}; Max-Age=${playLifetime}; Path=/api/admin/galaxy-minigames/${stationLevel}/play; HttpOnly; Secure; SameSite=Strict`);
      }
      return res.status(204).send("");
    }
    if (playPage) return sendPlayPage(res, 200, stationDocument(index, key, musicKey, returnHref));
    return res.json({ html: stationDocument(index, key, musicKey) });
  } catch {
    if (playPage) return sendPlayPage(res, 503, playError(returnHref, "Das Minispiel ist gerade nicht verfügbar. Versuche es erneut über die Galaxiekarte."));
    return res.status(503).json({ error: "minigame_unavailable" });
  }
}
