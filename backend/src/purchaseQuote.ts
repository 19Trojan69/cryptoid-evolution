import axios from "axios";

export type PurchaseQuote = {
  availability: "available" | "unavailable" | "test_payment";
  purchaseAt: string | null;
  usdPerPi?: number; eurPerPi?: number;
  source?: string; quotedAt?: string; recordedAt: string;
  eurMethod?: "provider_quote";
};
const source = "https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=usd,eur&include_last_updated_at=true&precision=full";
export const quoteFromResponse = (network: string, purchaseAt: string | null, data: any, now = Date.now()): PurchaseQuote => {
  const base = { purchaseAt, recordedAt: new Date(now).toISOString() };
  if (network === "Pi Testnet") return { ...base, availability: "test_payment" };
  const at = purchaseAt ? Date.parse(purchaseAt) : NaN;
  const price = data?.["pi-network"];
  const quoted = Number(price?.last_updated_at) * 1000;
  // Only a contemporaneous, timestamped quote may become a purchase snapshot.
  // Never backfill an old purchase with today's quote; never use a future quote.
  if (network !== "Pi Network" || !Number.isFinite(at) || !Number.isFinite(quoted) ||
      quoted > at || at - quoted > 300_000 || now - at > 300_000 || at > now ||
      ![price?.usd, price?.eur].every(value => typeof value === "number" && Number.isFinite(value) && value > 0))
    return { ...base, availability: "unavailable" };
  return { ...base, availability: "available", usdPerPi: price.usd, eurPerPi: price.eur,
    source, quotedAt: new Date(quoted).toISOString(), eurMethod: "provider_quote" };
};
export const capturePurchaseQuote = async (payment: any): Promise<PurchaseQuote> => {
  const at = typeof payment.created_at === "string" ? payment.created_at : null;
  const fallback = quoteFromResponse(payment.network, at, null);
  if (payment.network !== "Pi Network" || !at || Date.now() - Date.parse(at) > 300_000) return fallback;
  try {
    const { data } = await axios.get(source, { timeout: 4000, maxRedirects: 0 });
    return quoteFromResponse(payment.network, at, data);
  } catch { return fallback; }
};
