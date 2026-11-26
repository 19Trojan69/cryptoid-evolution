import axios from "axios";
import type { Request, Router } from "express";
import platformAPIClient, { platformAPIClientForRequest } from "./services/platformAPIClient";
import { inspectMainnetReadiness, readMainnetRelease } from "./mainnetRelease";
import { rewardNetwork } from "./rewardNetwork";

export type IntegrationCheck = {
  id: string;
  label: string;
  status: "ok" | "warning" | "error" | "unknown";
  detail: string;
  responseMs: number;
};

// These are observations, not transactions or an uptime history. No probe writes
// orders, owner settings, NFT claims, health records or wallet authorizations.
export async function integrationCheck(id: string, label: string, probe: () => Promise<Omit<IntegrationCheck, "id" | "label" | "responseMs">>): Promise<IntegrationCheck> {
  const start = Date.now();
  try {
    const result = await probe();
    const responseMs = Date.now() - start;
    return { id, label, ...result, responseMs,
      status: result.status === "ok" && responseMs > 2500 ? "warning" : result.status };
  } catch (error) {
    // Never expose Axios errors: their request configuration contains credentials.
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    return { id, label, status: "error", responseMs: Date.now() - start,
      detail: status === 401 || status === 403 ? "Der Dienst hat den Zugriff abgewiesen. Anmeldung oder Konfiguration prüfen."
        : "Der Dienst konnte bei dieser Abfrage nicht bestätigt werden. Erneut abrufen." };
  }
}

export async function inspectPiIntegration(req: Request) {
  const checks = await Promise.all([
    integrationCheck("database", "MongoDB-Verbindung", async () => {
      const client = req.app.locals.databaseClient;
      if (!client) return { status: "unknown", detail: "Datenbankverbindung noch nicht bereit." };
      await client.db().command({ ping: 1, maxTimeMS: 3000 });
      return { status: "ok", detail: "Die Datenbank antwortet auf eine reine Leseabfrage." };
    }),
    integrationCheck("piAuth", "Pi-Anmeldedienst", async () => {
      const user = req.session.currentUser;
      if (!user?.accessToken) return { status: "unknown", detail: "Bitte mit deinem Pi-Konto erneut anmelden." };
      const { data } = await platformAPIClient.get("/v2/me", {
        headers: { Authorization: `Bearer ${user.accessToken}` }, timeout: 4000, maxRedirects: 0,
      });
      return data?.uid === user.uid
        ? { status: "ok", detail: "Pi bestätigt das aktuell angemeldete Eigentümerkonto." }
        : { status: "error", detail: "Die Pi-Bestätigung stimmt nicht mit dieser Sitzung überein." };
    }),
    integrationCheck("blockchain", "Pi-Mainnet-Blockchain", async () => {
      const { data } = await axios.get("https://api.mainnet.minepi.com/ledgers?order=desc&limit=1", {
        timeout: 4000, maxRedirects: 0,
      });
      const ledger = data?._embedded?.records?.[0];
      const closed = typeof ledger?.closed_at === "string" ? Date.parse(ledger.closed_at) : NaN;
      if (!Number.isFinite(closed)) return { status: "unknown", detail: "Antwort erhalten, aber kein bestätigter aktueller Block verfügbar." };
      const age = Math.max(0, Math.round((Date.now() - closed) / 1000));
      return { status: age <= 120 ? "ok" : "warning", detail: `Letzter gemeldeter Block vor ${age} Sekunden. Das bestätigt die Erreichbarkeit, nicht die NFT-Freigabe.` };
    }),
    integrationCheck("piPayments", "Pi-Zahlungsdienst", async () => {
      if (!process.env.PI_MAINNET_API_KEY?.trim()) return { status: "unknown", detail: "Mainnet-Zahlungszugang nicht bestätigt." };
      const orders = req.app.locals.orderCollection;
      const order = orders && await orders.findOne({ payment_network: "Pi Network", paid: true, txid: { $type: "string" } }, {
        sort: { completed_at: -1 }, projection: { pi_payment_id: 1, txid: 1 },
      });
      if (!order?.pi_payment_id) return { status: "unknown", detail: "Zugang konfiguriert. Noch kein abgeschlossener Mainnet-Kauf für einen reinen Leseabgleich vorhanden." };
      const { data } = await platformAPIClientForRequest(req).get(`/v2/payments/${encodeURIComponent(order.pi_payment_id)}`, {
        timeout: 4000, maxRedirects: 0,
      });
      return data?.identifier === order.pi_payment_id && data?.network === "Pi Network"
        && data?.direction === "user_to_app" && data?.status?.transaction_verified === true
        && data?.status?.developer_completed === true && data?.transaction?.txid === order.txid
        ? { status: "ok", detail: "Der Pi-Zahlungsdienst bestätigt einen vorhandenen abgeschlossenen Mainnet-Beleg." }
        : { status: "warning", detail: "Der vorhandene Mainnet-Beleg konnte nicht vollständig mit Pi abgeglichen werden." };
    }),
  ]);
  const readiness = await inspectMainnetReadiness(req);
  let release: Awaited<ReturnType<typeof readMainnetRelease>> | null = null;
  try { release = await readMainnetRelease(req, readiness); } catch { /* Unavailable remains unknown. */ }
  return {
    checkedAt: new Date().toISOString(), checks,
    nfts: {
      purchasable: Boolean(release?.enabled),
      ownerReleased: release?.released ?? null,
      checks: readiness.checks.filter(check => ["walletCheckout", "nftIssuance", "nftMetadata"].includes(check.id)),
      walletSigning: "not_verified",
      reservationMode: false,
      explanation: "Für dieses Spiel sind Mainnet-NFT-Vertrag, Wallet-Signierung, echte NFT-Ausgabe und Kauf/Lieferung noch nicht vollständig integriert und nachgewiesen. Die allgemeine Verfügbarkeit von Pi-Smart-Contracts allein schaltet keine Käufe frei.",
    },
  };
}

// The parent router authenticates the sole verified Pi owner on every request.
export function mountPiIntegrationHealth(router: Router) {
  router.get("/integration-health", async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (rewardNetwork(req) !== "mainnet") return res.status(403).json({ error: "mainnet_admin_required" });
    try { return res.json(await inspectPiIntegration(req)); }
    catch { return res.status(503).json({ error: "integration_status_unavailable" }); }
  });
}
