export type PiNetwork = "Pi Network" | "Pi Testnet" | "Ungeklärt";

// The Platform API is the source of truth. Never infer a network from the host, API key or deployment.
export const piNetwork = (value: unknown): PiNetwork =>
  value === "Pi Network" || value === "Pi Testnet" ? value : "Ungeklärt";

export const paymentSnapshot = (payment: any, productName: string) => ({
  payment_network: piNetwork(payment.network),
  payment_amount_pi: payment.amount,
  payment_memo: typeof payment.memo === "string" ? payment.memo : "",
  product_name: productName,
  pi_created_at: typeof payment.created_at === "string" ? payment.created_at : null,
  from_address: typeof payment.from_address === "string" ? payment.from_address : "",
  to_address: typeof payment.to_address === "string" ? payment.to_address : "",
});

export const paymentRecordHeaders = [
  "Netzwerk", "Status", "Pi-Zahlungs-ID", "Blockchain-TXID", "Pi-Konto-ID",
  "Produkt-ID", "Produktname", "Betrag Pi", "Pi erstellt UTC", "Freigabe UTC",
  "Abschluss UTC", "Storno UTC", "Sender-Wallet", "Empfaenger-Wallet",
  "Zahlungsbeschreibung", "EUR je Pi (nachtragen)", "EUR Gegenwert (nachtragen)",
  "Kursquelle und Zeitpunkt (nachtragen)", "Beleg-/Rechnungsnummer (nachtragen)",
];

const safeCell = (value: unknown): string => {
  let data = value instanceof Date ? value.toISOString() : value == null ? "" : String(value);
  // Spreadsheet programs can execute formula-looking cells even inside quoted CSV fields.
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(data)) data = `'${data}`;
  return `"${data.replace(/"/g, '""')}"`;
};

export const csvRow = (cells: unknown[]) => `${cells.map(safeCell).join(";")}\r\n`;

export const paymentRecord = (order: any): unknown[] => [
  piNetwork(order.payment_network),
  order.cancelled ? "Storniert" : order.paid ? "Bestaetigt" : "Offen",
  order.pi_payment_id, order.txid, order.user,
  order.product_id, order.product_name || "",
  order.payment_amount_pi ?? "", order.pi_created_at, order.approved_at ?? order.created_at,
  order.completed_at, order.cancelled_at, order.from_address, order.to_address,
  order.payment_memo, "", "", "", "",
];
