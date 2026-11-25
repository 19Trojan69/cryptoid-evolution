export type PiAuthNetwork = "mainnet" | "testnet";
export type PiOAuthConfiguration = { clientId: string; origin: string; redirectUri: string; network: PiAuthNetwork };
export const PI_OAUTH_STATE_KEY = "cryptoid_pi_oauth_state_v2";
export const PI_AUTH_ATTEMPT_KEY = "cryptoid_pi_auth_attempt_v1";
export const PI_OAUTH_MAX_AGE_MS = 10 * 60_000;
const returnPaths = new Set(["/", "/admin", "/game", "/galaxy"]);

// Only exact local routes can be returned to. Query parameters, fragments,
// encoded paths and external/protocol-relative URLs are never carried through.
export const safePiReturnPath = (value: unknown): string =>
  typeof value === "string" && returnPaths.has(value) ? value : "/";

export function resolvePiOAuthConfiguration(origin: string, network: PiAuthNetwork, settings: Record<string, unknown>): PiOAuthConfiguration | null {
  if (settings.VITE_PI_OAUTH_NETWORK !== network || typeof settings.VITE_PI_OAUTH_CLIENT_ID !== "string"
    || !settings.VITE_PI_OAUTH_CLIENT_ID.trim() || typeof settings.VITE_PI_OAUTH_ORIGIN !== "string") return null;
  try {
    const url = new URL(settings.VITE_PI_OAUTH_ORIGIN);
    const localhost = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.origin !== origin || url.origin !== settings.VITE_PI_OAUTH_ORIGIN || url.username || url.password
      || (url.protocol !== "https:" && !(localhost && url.protocol === "http:"))) return null;
    if ((url.hostname === "cryptoid-evolution-testnet.vercel.app" && network !== "testnet")
      || (["cryptoid-evolution.app", "www.cryptoid-evolution.app", "cryptoid-evolution.vercel.app"].includes(url.hostname) && network !== "mainnet")) return null;
    return { clientId: settings.VITE_PI_OAUTH_CLIENT_ID.trim(), origin, network, redirectUri: `${origin}/signin/callback` };
  } catch { return null; }
}

export const getPiOAuthConfiguration = (origin: string, network: PiAuthNetwork) =>
  resolvePiOAuthConfiguration(origin, network, import.meta.env);

export const createPiOAuthState = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
};
export const beginPiAuthAttempt = (storage: Pick<Storage, "setItem">) => {
  const attempt = createPiOAuthState();
  storage.setItem(PI_AUTH_ATTEMPT_KEY, attempt);
  return attempt;
};
export type PiOAuthTransaction = { version: 1; state: string; origin: string; network: PiAuthNetwork; redirectUri: string; returnTo: string; createdAt: number };
export function storePiOAuthTransaction(storage: Pick<Storage, "setItem">, config: PiOAuthConfiguration, state: string, returnTo: unknown, now = Date.now()) {
  const transaction: PiOAuthTransaction = { version: 1, state, origin: config.origin, network: config.network, redirectUri: config.redirectUri,
    returnTo: safePiReturnPath(returnTo), createdAt: now };
  storage.setItem(PI_OAUTH_STATE_KEY, JSON.stringify(transaction));
  return transaction;
}
export function validatePiOAuthTransaction(raw: string | null, state: string | null, config: PiOAuthConfiguration | null, attempt: string | null, now = Date.now()): PiOAuthTransaction | null {
  if (!config || !raw || !state || !/^[a-f0-9]{64}$/.test(state) || attempt !== state) return null;
  try {
    const value = JSON.parse(raw) as PiOAuthTransaction;
    if (value.version !== 1 || value.state !== state || value.origin !== config.origin || value.network !== config.network
      || value.redirectUri !== config.redirectUri || !Number.isSafeInteger(value.createdAt) || value.createdAt > now
      || now - value.createdAt > PI_OAUTH_MAX_AGE_MS || !returnPaths.has(value.returnTo)) return null;
    return value;
  } catch { return null; }
}
