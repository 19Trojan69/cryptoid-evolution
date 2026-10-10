type PaymentEvidence = { network: string; txid: string | null; receiptSource: string | null };

export const paymentEvidenceLinks = ({ network, txid, receiptSource }: PaymentEvidence) => {
  const chain = network === "Pi Testnet" ? "testnet" : network === "Pi Network" ? "mainnet" : null;
  const hash = txid && /^[a-f0-9]{64}$/i.test(txid) ? txid.toLowerCase() : null;
  const explorer = chain && hash ? `https://blockexplorer.minepi.com/${chain}/transactions/${hash}` : null;
  let api: string | null = null;
  if (receiptSource) {
    try {
      const url = new URL(receiptSource);
      if (url.protocol === "https:" && !url.username && !url.password &&
          /^api\.(testnet|mainnet)\.minepi\.com$/.test(url.hostname) &&
          /^\/transactions\/[a-f0-9]{64}$/i.test(url.pathname) &&
          (!chain || url.hostname === `api.${chain}.minepi.com`)) api = receiptSource;
    } catch { /* Preserve the stored value; do not expose a malformed navigation target. */ }
  }
  return { explorer, api, chain };
};
