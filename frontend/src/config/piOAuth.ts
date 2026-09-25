export const PI_OAUTH_CLIENT_ID = "ZfkjTYFcCeN1oRNBodCzY7GZhAk_k6Owfuk4QEfSLJA";
export const PI_OAUTH_ORIGIN = "https://cryptoid-evolution-testnet.vercel.app";
export const PI_OAUTH_REDIRECT_URI = `${PI_OAUTH_ORIGIN}/signin/callback`;
export const PI_OAUTH_STATE_KEY = "cryptoid_pi_oauth_state";

export const createPiOAuthState = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
};
