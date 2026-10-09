export type PiNetwork = "Pi Network" | "Pi Testnet" | "Ungeklärt";

// The Platform API is the source of truth. Never infer a network from the host, API key or deployment.
export const piNetwork = (value: unknown): PiNetwork =>
  value === "Pi Network" || value === "Pi Testnet" ? value : "Ungeklärt";

export const paymentSnapshot = (payment: any, productName: string) => ({
  payment_network: piNetwork(payment.network),
  payment_amount_pi: payment.amount,
  payment_memo: typeof payment.memo === "string" ? payment.memo : "",
  product_name: productName,
  pi_created_at:
    typeof payment.created_at === "string" ? payment.created_at : null,
  from_address:
    typeof payment.from_address === "string" ? payment.from_address : "",
  to_address: typeof payment.to_address === "string" ? payment.to_address : "",
});

export const paymentRecordHeaders = [
  "Netzwerk",
  "Status",
  "Pi-Zahlungs-ID",
  "Blockchain-TXID",
  "Pi-Konto-ID",
  "Produkt-ID",
  "Produktname",
  "Betrag Pi",
  "Pi erstellt UTC",
  "Freigabe UTC",
  "Abschluss UTC",
  "Wallet-Eingang UTC",
  "Eingangsquelle",
  "Storno UTC",
  "Sender-Wallet",
  "Empfaenger-Wallet",
  "Zahlungsbeschreibung",
  "EUR je Pi",
  "EUR Gegenwert",
  "Kursquelle",
  "Bewertungszeitpunkt UTC",
  "Beleg-/Rechnungsnummer",
  "Benutzername", "Stueckzahl", "Zahlungsart", "Kaufzeitpunkt UTC",
  "Historischer USD je Pi", "Historischer EUR je Pi", "Kaufgegenwert USD", "Kaufgegenwert EUR",
  "Kaufkursquelle", "Kaufkurszeitpunkt UTC", "Kaufkursverfuegbarkeit", "Kurserfassung UTC",
  "EUR-Methode", "USD-EUR Wechselkurs", "Wechselkursquelle", "Wechselkurszeitpunkt UTC",
];

const safeCell = (value: unknown): string => {
  let data =
    value instanceof Date
      ? value.toISOString()
      : value == null
        ? ""
        : String(value);
  // Spreadsheet programs can execute formula-looking cells even inside quoted CSV fields.
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(data)) data = `'${data}`;
  return `"${data.replace(/"/g, '""')}"`;
};

export const csvRow = (cells: unknown[]) =>
  `${cells.map(safeCell).join(";")}\r\n`;

export const purchasePriceView = (order: any) => {
  const quote = order.purchaseQuote;
  const usable = order.payment_network === "Pi Network" && quote?.availability === "available";
  return {
    availability: order.payment_network === "Pi Testnet" ? "test_payment" : usable ? "available" : "unavailable",
    purchaseAt: quote?.purchaseAt || order.pi_created_at || null,
    usdPerPi: usable ? quote.usdPerPi : null, eurPerPi: usable ? quote.eurPerPi : null,
    usdAmount: usable && typeof order.payment_amount_pi === "number" ? order.payment_amount_pi * quote.usdPerPi : null,
    eurAmount: usable && typeof order.payment_amount_pi === "number" ? order.payment_amount_pi * quote.eurPerPi : null,
    source: usable ? quote.source : null, quotedAt: usable ? quote.quotedAt : null,
    recordedAt: quote?.recordedAt || null, eurMethod: usable ? quote.eurMethod : null,
    fxRate: usable ? quote.fxRate || null : null, fxSource: usable ? quote.fxSource || null : null,
    fxAt: usable ? quote.fxAt || null : null,
  };
};
export const paymentRecord = (order: any): unknown[] => { const price = purchasePriceView(order); return [
  piNetwork(order.payment_network),
  order.cancelled ? "Storniert" : order.paid ? "Bestaetigt" : "Offen",
  order.pi_payment_id,
  order.txid,
  order.user,
  order.product_id,
  order.product_name || "",
  order.payment_amount_pi ?? "",
  order.pi_created_at,
  order.approved_at ?? order.created_at,
  order.completed_at,
  order.wallet_received_at,
  order.receipt_source,
  order.cancelled_at,
  order.from_address,
  order.to_address,
  order.payment_memo,
  order.payment_network === "Pi Network" ? order.valuation?.eurPerPi : null,
  order.payment_network === "Pi Network" ? order.valuation?.eurAmount : null,
  order.valuation?.source,
  order.valuation?.at,
  order.valuation?.receiptNumber,
  order.username || "nicht erfasst", order.quantity ?? "nicht erfasst",
  order.payment_network === "Pi Testnet" ? "Testzahlung - kein Geldwert" : "Pi-Zahlung",
  price.purchaseAt, price.usdPerPi, price.eurPerPi, price.usdAmount, price.eurAmount,
  price.source, price.quotedAt, price.availability === "test_payment" ? "Testzahlung - kein Geldwert" : price.availability === "available" ? "verfuegbar" : "nicht verfuegbar",
  price.recordedAt, price.eurMethod, price.fxRate, price.fxSource, price.fxAt,
]; };

export type LedgerNetwork = "mainnet" | "testnet" | "unknown" | "all";
export type LedgerStatus = "all" | "confirmed" | "pending" | "cancelled";
export const ledgerFilter = (
  network: LedgerNetwork,
  status: LedgerStatus = "all",
) => ({
  ...(network === "mainnet"
    ? { payment_network: "Pi Network" }
    : network === "testnet"
      ? { payment_network: "Pi Testnet" }
      : network === "unknown"
        ? { payment_network: { $nin: ["Pi Network", "Pi Testnet"] } }
        : {}),
  ...(status === "confirmed"
    ? { paid: true, cancelled: { $ne: true } }
    : status === "cancelled"
      ? { cancelled: true }
      : status === "pending"
        ? { paid: { $ne: true }, cancelled: { $ne: true } }
        : {}),
});

export const paymentView = (order: any) => ({
  id: order.pi_payment_id,
  txid: typeof order.txid === "string" ? order.txid : null,
  network: piNetwork(order.payment_network),
  status: order.cancelled ? "cancelled" : order.paid ? "confirmed" : "pending",
  productId: order.product_id,
  productName: order.product_name || order.product_id || "Unbekanntes Produkt",
  userUid: order.user,
  username: order.username || null, quantity: order.quantity ?? null, purchasePrice: purchasePriceView(order),
  amountPi:
    typeof order.payment_amount_pi === "number" &&
    Number.isFinite(order.payment_amount_pi)
      ? order.payment_amount_pi
      : null,
  createdAt: order.pi_created_at || order.created_at || null,
  approvedAt: order.approved_at || null,
  completedAt: order.completed_at || null,
  receivedAt: order.wallet_received_at || null,
  receiptSource: order.receipt_source || null,
  fromAddress: order.from_address || null,
  toAddress: order.to_address || null,
  memo: order.payment_memo || "",
  valuation: order.valuation || null,
});
