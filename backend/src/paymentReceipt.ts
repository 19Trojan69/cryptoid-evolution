import axios from "axios";
import { piNetwork } from "./paymentRecords";

// Use only fixed Pi endpoints, never a URL provided by a browser or payment memo.
export const readPaymentReceipt = async (payment: any) => {
  const network = piNetwork(payment.network);
  const txid = payment.transaction?.txid;
  if (
    network === "Ungeklärt" ||
    typeof txid !== "string" ||
    !/^[a-f0-9]{64}$/i.test(txid) ||
    !payment.status?.transaction_verified
  )
    return {};
  const origin =
    network === "Pi Testnet"
      ? "https://api.testnet.minepi.com"
      : "https://api.mainnet.minepi.com";
  const source = `${origin}/transactions/${txid}`;
  try {
    const { data } = await axios.get(source, {
      timeout: 4000,
      maxRedirects: 0,
    });
    const timestamp =
      typeof data.created_at === "string" ? Date.parse(data.created_at) : NaN;
    if (
      data.hash?.toLowerCase() !== txid.toLowerCase() ||
      data.successful !== true ||
      !Number.isFinite(timestamp)
    )
      return {};
    return { wallet_received_at: new Date(timestamp), receipt_source: source };
  } catch {
    // Payment completion must not fail because a historical ledger is unavailable.
    return {};
  }
};
