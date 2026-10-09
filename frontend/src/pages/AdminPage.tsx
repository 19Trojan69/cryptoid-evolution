import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { axiosClient } from "../lib/axiosClient";
import {
  playerSkins,
  playerColors,
  ADMIN_MODE_KEY,
  ADMIN_TEST_CONFIG_KEY,
  ADMIN_SHIP_SKIN_KEY,
  ADMIN_SHIP_COLOR_KEY,
  ADMIN_SHIP_STAGE_KEY,
  ADMIN_START_SECTOR_KEY,
  type PlayerSkinId,
  type PlayerColorId,
} from "./shipFleet";
import { type ShipStage, shipEvolutionAsset } from "./shipEvolution";
import { MAX_DIFFICULTY_LEVEL } from "./levelDifficulty";
import { campaignLevel } from "./sectorManager";
import PaintedShip from "./PaintedShip";
import { hangarCatalog } from "../../../backend/src/hangarCatalog";
import { primeGameAudio } from "./gameAudio";
import { requestGameFullscreen } from "./gameFullscreen";
import { readEffectsVolume } from "./musicPreferences";
import "./admin.css";
import AdminUsage from "./AdminUsage";
import { useAdminLocale } from "../adminLocale";

const tabs = [
  ["overview", "Übersicht"],
  ["ships", "Raumschiffe"],
  ["levels", "Levels & Bosse"],
  ["payments", "Zahlungseingänge"],
  ["scores", "Eigene Rekorde"],
  ["usage", "Zugriffsstatistik"],
  ["checks", "Audio & Prüfung"],
] as const;
type AdminView = (typeof tabs)[number][0];
type Network = "mainnet" | "testnet" | "unknown";
type Status = "all" | "confirmed" | "pending" | "cancelled";
type Phase = "normal" | "boss" | "bonus";
type Payment = {
  username: string | null; quantity: number | null;
  purchasePrice: { availability: string; purchaseAt: string | null; usdPerPi: number | null; eurPerPi: number | null; usdAmount: number | null; eurAmount: number | null; source: string | null; quotedAt: string | null; eurMethod: string | null };
  id: string;
  txid: string | null;
  network: string;
  status: "confirmed" | "pending" | "cancelled";
  productId: string;
  productName: string;
  userUid: string;
  amountPi: number | null;
  createdAt: string | null;
  approvedAt: string | null;
  completedAt: string | null;
  receivedAt: string | null;
  receiptSource: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  memo: string;
  valuation: {
    eurPerPi: number;
    eurAmount: number;
    source: string;
    at: string;
    receiptNumber: string;
    recordedAt: string;
  } | null;
};
const normalizePayment = (payment: Payment): Payment => ({ ...payment,
  quantity: payment.quantity ?? null, username: payment.username || null,
  purchasePrice: payment.purchasePrice ?? { availability: payment.network === "Pi Testnet" ? "test_payment" : "unavailable", purchaseAt: payment.createdAt, usdPerPi: null, eurPerPi: null, usdAmount: null, eurAmount: null, source: null, quotedAt: null, eurMethod: null },
});
type Summary = { _id: Network; total: number; confirmed: number; confirmedPi: number; missingAmounts: number };
type Ledger = { payments: Payment[]; total: number; page: number; pageSize: number; summary: Summary[] };
type AdminStatus = {
  username: string;
  services: { database: boolean; mainnetPayments: boolean; testnetPayments: boolean };
  game: { sections: number; levels: number; bosses: number; ships: number; stages: number };
};
type AdminScores = { network: "testnet" | "mainnet"; careerScore: number; bestRun: { score: number; level: number | null }; bestScore: number };
const levelCount = campaignLevel(MAX_DIFFICULTY_LEVEL);
const stageNames = ["Standard", "Advanced", "Elite"];
const weaponNames = ["Single Laser", "Twin Laser", "Rapid Twin", "Triple Laser", "Plasma"];
const networkNames: Record<Network, string> = { mainnet: "Echte Pi", testnet: "Test-Pi", unknown: "Ungeklärt" };
const statusNames = { confirmed: "Bestätigt", pending: "Offen", cancelled: "Storniert" };
const date = (value: string | null) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString("de-AT", { timeZone: "Europe/Vienna", timeZoneName: "shortOffset" })
    : "Nicht dokumentiert";
const amount = (value: number | null) =>
  value === null ? "Nicht dokumentiert" : value.toLocaleString("de-AT", { maximumFractionDigits: 7 });
const errorMessage = (error: unknown) => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status === 401) return "Die Pi-Anmeldung ist abgelaufen. Bitte erneut anmelden.";
  if (status === 403) return "Für dieses Pi-Konto ist kein Admin-Zugriff freigeschaltet.";
  if (status === 409)
    return "Die Zahlungsdaten konnten nicht eindeutig bestätigt werden. Bitte den Wallet-Eingang zuerst prüfen.";
  if (status === 400) return "Bitte die Auswahl und Eingaben prüfen.";
  return "Die Anfrage konnte nicht abgeschlossen werden. Bitte erneut versuchen.";
};
const audioTests = [
  ["Single Laser", "shot-single"],
  ["Twin Laser", "shot-twin"],
  ["Rapid Twin", "shot-rapid"],
  ["Triple Laser", "shot-triple"],
  ["Plasma", "shot-plasma"],
  ["Waffen-Upgrade", "pickup-weapon"],
  ["Schild", "pickup-shield"],
  ["Leistungsboost", "pickup-overdrive"],
  ["Schnellfeuer", "pickup-rapid"],
  ["Bombe", "pickup-bomb"],
  ["EMP", "pickup-emp"],
  ["Boss-Sirene", "boss-warning-siren"],
  ["Boss-Explosion", "boss-destroy-v3"],
  ["Boss-Sieg", "boss-victory-v2"],
  ["Startseitenmusik", "home-galactic-chain"],
  ["Spielmusik", "battle-orbit"],
  ["Boss-Musik", "dreadnought-duel"],
] as const;

export default function AdminPage() {
  const { t } = useAdminLocale();
  const auth = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view = (tabs.some(([key]) => key === params.get("view")) ? params.get("view") : "overview") as AdminView;
  const [skinId, setSkinId] = useState<PlayerSkinId>(
    () => playerSkins.find(skin => skin.id === sessionStorage.getItem(ADMIN_SHIP_SKIN_KEY))?.id || playerSkins[0].id
  );
  const [colorId, setColorId] = useState<PlayerColorId>(
    () => playerColors.find(color => color.id === sessionStorage.getItem(ADMIN_SHIP_COLOR_KEY))?.id || "silver"
  );
  const [stage, setStage] = useState<ShipStage>(() => {
    const value = Number(sessionStorage.getItem(ADMIN_SHIP_STAGE_KEY));
    return value === 2 || value === 3 ? value : 1;
  });
  const [level, setLevel] = useState(1);
  const [block, setBlock] = useState(1);
  const [weapon, setWeapon] = useState(1);
  const [power, setPower] = useState("");
  const [network, setNetwork] = useState<Network>("mainnet");
  const [status, setStatus] = useState<Status>("all");
  const [page, setPage] = useState(1);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [services, setServices] = useState<AdminStatus | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ownScores, setOwnScores] = useState<AdminScores | null>(null);
  const [resetName, setResetName] = useState("");
  const [resetChecked, setResetChecked] = useState(false);
  const [reload, setReload] = useState(0);
  const [csvFile, setCsvFile] = useState<{ url: string; file: File } | null>(null);
  useEffect(() => () => { if (csvFile) URL.revokeObjectURL(csvFile.url); }, [csvFile]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudio, setPlayingAudio] = useState("");
  const selectedSkin = playerSkins.find(skin => skin.id === skinId)!;
  const allowed = auth.authReady && auth.canAdmin;

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    axiosClient
      .get<AdminStatus>("/admin/status")
      .then(({ data }) => {
        if (active) setServices(data);
      })
      .catch((err: unknown) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [allowed, reload]);

  useEffect(() => {
    if (!allowed || (view !== "payments" && view !== "overview")) return;
    let active = true;
    setLedgerLoading(true);
    setLedgerError("");
    setLedger(null);
    axiosClient
      .get<Ledger>("/admin/payments", { params: { network, status, page } })
      .then(({ data }) => {
        if (active) setLedger({ ...data, payments: data.payments.map(normalizePayment) });
      })
      .catch((err: unknown) => {
        if (active) setLedgerError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLedgerLoading(false);
      });
    return () => {
      active = false;
    };
  }, [allowed, view, network, status, page, reload]);

  useEffect(() => {
    if (!allowed || view !== "scores") return;
    let active = true;
    setOwnScores(null);
    axiosClient.get<AdminScores>("/leaderboard/me?rules=2")
      .then(({ data }) => { if (active) setOwnScores(data); })
      .catch((err: unknown) => { if (active) setError(errorMessage(err)); });
    return () => { active = false; };
  }, [allowed, view, reload]);

  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    []
  );
  const openView = (next: AdminView) => {
    setParams(next === "overview" ? {} : { view: next });
    setSelectedPayment(null);
    setError("");
    setMessage("");
  };
  const perform = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const startTest = (phase: Phase, chosenLevel = level) => {
    if (busy) return;
    primeGameAudio();
    const configuration = {
      sector: phase === "normal" ? (chosenLevel - 1) * 10 + block : chosenLevel * 10,
      shipStage: stage,
      weaponLevel: weapon,
      power: power || null,
      phase,
    };
    void perform(async () => {
      await axiosClient.post("/admin/start", configuration);
      sessionStorage.setItem(ADMIN_MODE_KEY, "1");
      sessionStorage.setItem(ADMIN_TEST_CONFIG_KEY, JSON.stringify(configuration));
      sessionStorage.setItem(ADMIN_SHIP_SKIN_KEY, skinId);
      sessionStorage.setItem(ADMIN_SHIP_COLOR_KEY, colorId);
      sessionStorage.setItem(ADMIN_SHIP_STAGE_KEY, String(stage));
      sessionStorage.setItem(ADMIN_START_SECTOR_KEY, String(configuration.sector));
      audioRef.current?.pause();
      requestGameFullscreen();
      navigate("/game");
    });
  };

  const leaveAdmin = () => {
    void perform(async () => {
      await auth.setAdminPreview(false);
      sessionStorage.removeItem(ADMIN_TEST_CONFIG_KEY);
      navigate("/");
    });
  };
  const resetOwnScores = () => {
    if (!ownScores || !resetChecked || resetName !== auth.user?.username || busy) return;
    setBusy(true); setError(""); setMessage("");
    void axiosClient.post<AdminScores>("/admin/scores/reset", { network: ownScores.network, confirmUsername: resetName, confirm: true })
      .then(({ data }) => {
        setOwnScores(data); setResetName(""); setResetChecked(false);
        setMessage(`Deine Rekorde im ${data.network === "testnet" ? "Testnet" : "Mainnet"} wurden zurückgesetzt.`);
      })
      .catch((err: unknown) => setError(axios.isAxiosError(err) && err.response?.status === 409
        ? "Eine Mission ist noch aktiv. Beende sie vor dem Zurücksetzen." : errorMessage(err)))
      .finally(() => setBusy(false));
  };
  const exportPayments = () => {
    void perform(async () => {
      const { data } = await axiosClient.get<Blob>("/admin/payments/export", {
        params: { network, status },
        responseType: "blob",
        timeout: 60_000,
      });
      const contents = await data.text();
      if (!contents.startsWith('"Netzwerk"') && !contents.startsWith('\uFEFF"Netzwerk"')) throw new Error("Invalid CSV response");
      const file = new File(["\uFEFF", contents.replace(/^\uFEFF/, "")], `cryptoid-pi-zahlungen-${network}-${status}.csv`, { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(file);
      setCsvFile({ url, file });
      const link = document.createElement("a");
      link.href = url; link.download = file.name;
      document.body.append(link); link.click(); link.remove();
      setMessage(t("CSV ready. Use Save or Share if the download does not start."));
    });
  };

  const refreshPayment = (payment: Payment, target: "mainnet" | "testnet") => {
    void perform(async () => {
      const { data } = await axiosClient.post<{ payment: Payment; receiptFound: boolean }>(
        `/admin/payments/${encodeURIComponent(payment.id)}/refresh`,
        { network: target }
      );
      setSelectedPayment(normalizePayment(data.payment));
      setReload(value => value + 1);
      setMessage(
        data.receiptFound
          ? "Zahlung und Wallet-Eingangszeitpunkt bestätigt."
          : "Zahlungsdaten geprüft. Der Wallet-Eingangszeitpunkt ist noch nicht abrufbar."
      );
    });
  };

  const saveValuation = (event: FormEvent<HTMLFormElement>, payment: Payment) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void perform(async () => {
      const { data } = await axiosClient.post<{ payment: Payment }>(
        `/admin/payments/${encodeURIComponent(payment.id)}/valuation`,
        {
          eurPerPi: Number(form.get("rate")),
          source: String(form.get("source")),
          receiptNumber: String(form.get("receipt") || ""),
        }
      );
      setSelectedPayment(normalizePayment(data.payment));
      setReload(value => value + 1);
      setMessage("EUR-Bewertung zum Wallet-Eingangszeitpunkt gespeichert.");
    });
  };

  const testAudio = async (name: string, file: string) => {
    audioRef.current?.pause();
    setError("");
    const audio = new Audio(`/audio/${file}.mp3`);
    audio.volume = readEffectsVolume();
    audioRef.current = audio;
    audio.onended = () => setPlayingAudio("");
    try {
      await audio.play();
      setPlayingAudio(name);
    } catch {
      setPlayingAudio("");
      setError("Dieser Ton konnte nicht gestartet werden. Bitte erneut antippen.");
    }
  };

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Link className="admin-brand" to="/">
          <img src="/trojan-wolf-games.webp" width="104" height="52" alt="Trojan Wolf Games" />
        </Link>
        <div>
          <span className="admin-kicker">{t("CRYPTOID EVOLUTION")}</span>
          <h1>{t("Admin-Zentrale")}</h1>
        </div>
        <Link className="admin-button" to="/" state={{ openQuickMenu: true }}>{t("← Schnellzugriff")}</Link>
        {allowed ? (
          <button className="admin-button" onClick={leaveAdmin} disabled={busy}>
            {t("Zum normalen Spiel")} </button>
        ) : (
          <Link className="admin-button" to="/">
            {t("Startseite")} </Link>
        )}
      </header>
      {!auth.authReady ? (
        <section className="admin-panel" role="status">
          <h2>{t("Pi-Zugriff wird geprüft …")}</h2>
        </section>
      ) : !allowed ? (
        <section className="admin-panel admin-access">
          <h2>{auth.user ? t("Kein Admin-Zugriff") : t("Mit deinem Pi-Konto anmelden")}</h2>
          <p>
            {auth.user
              ? t("@{value0} ist für diesen Admin-Bereich nicht freigeschaltet.", {value0: auth.user.username})
              : t("Die Admin-Zentrale ist nur für dein verifiziertes Eigentümerkonto zugänglich.")}
          </p>
          {auth.authError && <p role="alert">{t(auth.authError)}</p>}
          <div className="admin-actions">
            <button
              className="admin-button admin-primary"
              onClick={() => {
                void auth.signIn();
              }}
              disabled={auth.isLoading}
            >
              {t("Mit Pi anmelden")} </button>
            <button
              className="admin-button"
              onClick={() => {
                void perform(async () => {
                  await auth.refreshSession();
                });
              }}
              disabled={busy}
            >
              {t("Sitzung erneut prüfen")} </button>
            {auth.user && (
              <button
                className="admin-button"
                onClick={() => {
                  void auth.signOut();
                }}
              >
                {t("Abmelden")} </button>
            )}
          </div>
          {error && (
            <p role="alert" className="admin-error">
              {t(error)}
            </p>
          )}
        </section>
      ) : (
        <>
          <div className="admin-owner">
            <span>@{auth.user?.username}</span>
            <span>{t("Geschützter Eigentümerzugriff")}</span>
          </div>
          <nav className="admin-nav" aria-label={t("Admin-Seiten")}>
            {tabs.map(([key, label]) => (
              <button
                key={key}
                className={view === key ? "active" : ""}
                aria-current={view === key ? "page" : undefined}
                onClick={() => openView(key)}
              >
                {t(label)}
              </button>
            ))}
          </nav>
          {error && (
            <p className="admin-error" role="alert">
              {t(error)}
            </p>
          )}
          {auth.authError && (
            <p className="admin-error" role="alert">
              {t(auth.authError)}
            </p>
          )}
          {message && (
            <p className="admin-message" role="status">
              {t(message)}
            </p>
          )}
          {view === "usage" && <AdminUsage />}
          {view === "overview" && (
            <>
              <section className="admin-shortcuts" aria-label={t("Schnellzugriff")}>
                {[
                  ["ships", "Raumschiffe testen", "Alle 20 Modelle · Standard, Advanced und Elite"],
                  ["levels", "Level oder Boss starten", "Block, Bosskampf und Bonusrunde direkt öffnen"],
                  ["payments", "Zahlungseingänge ansehen", "Echte Pi, Test-Pi, Details und CSV-Download"],
                  ["scores", "Eigene Rekorde", "Karrierepunkte und Best Run nur für dieses Netzwerk zurücksetzen"],
                ].map(([key, title, description]) => (
                  <button key={key} onClick={() => openView(key as AdminView)}>
                    <strong>{t(title)}</strong>
                    <span>{t(description)}</span>
                    <b>{t("Öffnen")}</b>
                  </button>
                ))}
              </section>
              <section className="admin-panel">
                <h2>{t("Bereit zum Testen")}</h2>
                <div className="admin-metrics">
                  <div>
                    <strong>20</strong>
                    <span>{t("Schiffsmodelle")}</span>
                  </div>
                  <div>
                    <strong>60</strong>
                    <span>{t("Schiffsstufen")}</span>
                  </div>
                  <div>
                    <strong>50</strong>
                    <span>{t("Bosse")}</span>
                  </div>
                  <div>
                    <strong>500</strong>
                    <span>{t("Spielabschnitte")}</span>
                  </div>
                </div>
                <p>
                  {t("Der aktuelle Ablauf umfasst")} {levelCount} {t("angezeigte Level mit jeweils neun Blocks, Boss und Bonusrunde.")} </p>
                <p>{t("Admin-Testläufe schreiben keine Rekorde, Shards, Käufe oder Belohnungen gut.")}</p>
              </section>
              <section className="admin-panel">
                <h2>{t("Bestätigte Zahlungseingänge")}</h2>
                {ledgerLoading ? (
                  <p role="status">{t("Zahlungen werden geladen …")}</p>
                ) : ledgerError ? (
                  <p role="alert">{ledgerError}</p>
                ) : (
                  <div className="admin-metrics">
                    {(["mainnet", "testnet", "unknown"] as const).map(key => {
                      const summary = ledger?.summary.find(item => item._id === key);
                      return (
                        <button
                          className="admin-metric-button"
                          key={key}
                          onClick={() => {
                            setNetwork(key);
                      setCsvFile(null);
                            setPage(1);
                            openView("payments");
                          }}
                        >
                          <strong>
                            {amount(summary?.confirmedPi ?? 0)}{" "}
                            {key === "testnet" ? t("Test-Pi") : key === "mainnet" ? "Pi" : ""}
                          </strong>
                          <span>
                            {t(networkNames[key])} · {summary?.confirmed ?? 0} {t("bestätigt")} {summary?.missingAmounts ? t(" · {value0} Beträge fehlen", {value0: summary.missingAmounts}) : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
          {(view === "ships" || view === "levels") && (
            <>
              <section className="admin-panel admin-test-selection">
                <div className="admin-selected-hull">
                  <PaintedShip className="admin-hull" sprite={selectedSkin.sprite} stage={stage} color={colorId} />
                  <strong>{selectedSkin.name}</strong>
                  <span>{t(stageNames[stage - 1])}</span>
                </div>
                <div className="admin-test-options">
                  <h2>{t("Testauswahl")}</h2>
                  <div className="admin-field-grid">
                    <label>
                      {t("Raumschiff")} <select aria-label={t("Raumschiff")} value={skinId} onChange={event => setSkinId(event.target.value as PlayerSkinId)}>
                        {playerSkins.map(skin => (
                          <option key={skin.id} value={skin.id}>
                            {skin.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t("Schiffsstufe")} <select aria-label={t("Schiffsstufe")} value={stage} onChange={event => setStage(Number(event.target.value) as ShipStage)}>
                        {stageNames.map((name, index) => (
                          <option key={name} value={index + 1}>
                            {index + 1} · {t(name)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t("Waffe")} <select aria-label={t("Waffe")} value={weapon} onChange={event => setWeapon(Number(event.target.value))}>
                        {weaponNames.map((name, index) => (
                          <option key={name} value={index + 1}>
                            {t(name)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t("Start-Power-up")} <select aria-label={t("Start-Power-up")} value={power} onChange={event => setPower(event.target.value)}>
                        <option value="">{t("Keines")}</option>
                        {hangarCatalog
                          .filter(offer => offer.kind === "power")
                          .map(offer => (
                            <option key={offer.id} value={offer.id}>
                              {t(offer.name)}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  <fieldset className="admin-colors">
                    <legend>{t("Schiffsfarbe")}</legend>
                    {playerColors.map(color => (
                      <button
                        key={color.id}
                        type="button"
                        aria-label={t(color.name)}
                        title={t(color.name)}
                        aria-pressed={colorId === color.id}
                        style={{ backgroundColor: color.glow }}
                        onClick={() => setColorId(color.id)}
                      />
                    ))}
                  </fieldset>
                  <p>{t("Alle Modelle, Stufen und Waffen stehen im Test zur Verfügung.")}</p>
                </div>
              </section>
              {view === "ships" ? (
                <section className="admin-panel">
                  <div className="admin-section-head">
                    <h2>{t("Alle Raumschiffe")}</h2>
                    <button className="admin-button admin-primary" onClick={() => startTest("normal")} disabled={busy}>
                      {t("Ausgewähltes Schiff testen")} </button>
                  </div>
                  <div className="admin-fleet">
                    {playerSkins.map(skin => (
                      <button
                        key={skin.id}
                        className={skin.id === skinId ? "selected" : ""}
                        aria-pressed={skin.id === skinId}
                        onClick={() => setSkinId(skin.id)}
                      >
                        <img
                          src={shipEvolutionAsset(skin.sprite, stage)}
                          alt=""
                          width="100"
                          height="100"
                          loading="lazy"
                        />
                        <strong>{skin.name}</strong>
                        <span>{t(stageNames[stage - 1])}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : (
                <>
                  <section className="admin-panel">
                    <h2>{t("Direkt starten")}</h2>
                    <div className="admin-field-grid">
                      <label>
                        {t("Level")} <select aria-label={t("Level")} value={level} onChange={event => setLevel(Number(event.target.value))}>
                          {Array.from({ length: levelCount }, (_, index) => (
                            <option key={index} value={index + 1}>
                              {t("Level")} {index + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        {t("Block")} <select aria-label={t("Block")} value={block} onChange={event => setBlock(Number(event.target.value))}>
                          {Array.from({ length: 9 }, (_, index) => (
                            <option key={index} value={index + 1}>
                              {t("Block")} {index + 1}/9
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="admin-actions">
                      <button
                        className="admin-button admin-primary"
                        onClick={() => startTest("normal")}
                        disabled={busy}
                      >
                        {t("Block starten")} </button>
                      <button className="admin-button" onClick={() => startTest("boss")} disabled={busy}>
                        {t("Boss starten")} </button>
                      <button className="admin-button" onClick={() => startTest("bonus")} disabled={busy}>
                        {t("Bonusrunde starten")} </button>
                    </div>
                  </section>
                  <section className="admin-panel">
                    <h2>{t("Alle 50 Bosse")}</h2>
                    <p>{t("Ein Button startet den jeweiligen Boss mit deiner Testauswahl.")}</p>
                    <div className="admin-bosses">
                      {Array.from({ length: 50 }, (_, index) => (
                        <button
                          className="admin-button"
                          key={index}
                          onClick={() => startTest("boss", index + 1)}
                          disabled={busy}
                        >
                          {t("Boss")} {String(index + 1).padStart(2, "0")}
                        </button>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </>
          )}
          {view === "scores" && <section className="admin-panel admin-score-reset">
            <h2>{t("Eigene Rekorde zurücksetzen")}</h2>
            {!ownScores ? !error && <p role="status">{t("Rekorde werden geladen …")}</p> : <>
              <p>{t("Netzwerk:")} <strong>{ownScores.network === "testnet" ? "Testnet" : "Mainnet"}</strong> {t("· Konto:")} <strong>@{auth.user?.username}</strong></p>
              <p>{t("Karrierepunkte:")} {ownScores.careerScore.toLocaleString("de-AT")} {t("· Bester Lauf:")} {ownScores.bestRun.score.toLocaleString("de-AT")} {t("(Level")} {ownScores.bestRun.level ?? "—"}{t(") · Bisheriger V2-Rekord:")} {ownScores.bestScore.toLocaleString("de-AT")}</p>
              <p>{t("Nur deine Score-Werte in diesem Netzwerk werden auf null gesetzt. Spielstand, Shards, Käufe und das andere Netzwerk bleiben erhalten. Der ältere gemeinsame Archivrekord bleibt unverändert.")}</p>
              <label>{t("Zur Bestätigung deinen Pi-Namen eingeben:")} <input type="text" value={resetName} onChange={event => setResetName(event.target.value)} autoComplete="off" /></label>
              <label className="admin-score-confirm"><input type="checkbox" checked={resetChecked} onChange={event => setResetChecked(event.target.checked)} /> {t("Ich möchte meine Rekorde in diesem Netzwerk zurücksetzen.")}</label>
              <div className="admin-actions"><button className="admin-button" type="button" disabled={busy || !resetChecked || resetName !== auth.user?.username} onClick={resetOwnScores}>{t("Eigene Rekorde zurücksetzen")}</button></div>
            </>}
          </section>}
          {view === "payments" && (
            <section className="admin-panel">
              <div className="admin-section-head">
                <h2>{t("Zahlungseingänge")}</h2>
                <button className="admin-button" onClick={() => setReload(value => value + 1)} disabled={ledgerLoading}>
                  {t("Aktualisieren")} </button>
              </div>
              <p>
                {t("App-Käufe und ihre Zahlungseingänge. Andere Überweisungen in deine private Wallet sind hier nicht enthalten.")} </p>
              <div className="admin-network-switch" aria-label={t("Zahlungsnetzwerk")}>
                {(["mainnet", "testnet", "unknown"] as const).map(key => (
                  <button
                    key={key}
                    aria-pressed={network === key}
                    onClick={() => {
                      setNetwork(key);
                      setCsvFile(null);
                      setPage(1);
                      setSelectedPayment(null);
                    }}
                  >
                    {t(networkNames[key])}
                  </button>
                ))}
              </div>
              <div className="admin-payment-tools">
                <label>
                  {t("Status")} <select aria-label={t("Status")}
                    value={status}
                    onChange={event => {
                      setStatus(event.target.value as Status);
                      setCsvFile(null);
                      setPage(1);
                      setSelectedPayment(null);
                    }}
                  >
                    <option value="all">{t("Alle Vorgänge")}</option>
                    <option value="confirmed">{t("Bestätigte Eingänge")}</option>
                    <option value="pending">{t("Offen")}</option>
                    <option value="cancelled">{t("Storniert")}</option>
                  </select>
                </label>
                <button className="admin-button admin-primary" disabled={busy} onClick={exportPayments}>
                  {t("CSV herunterladen")} </button>
              </div>
              {csvFile && <div className="admin-actions" role="status">
                <a className="admin-button admin-primary" href={csvFile.url} download={csvFile.file.name}>{t("Save CSV")}</a>
                <button className="admin-button" type="button" onClick={() => {
                  if (navigator.canShare?.({ files: [csvFile.file] })) void navigator.share({ files: [csvFile.file] }).catch(() => setMessage(t("Save CSV")));
                  else { const link = document.createElement("a"); link.href = csvFile.url; link.target = "_blank"; link.rel = "noopener"; link.click(); setMessage(t("Use your browser menu to save or share the file.")); }
                }}>{t("Share CSV")}</button>
                <p>{t("The export includes all pages for the selected network and status.")}</p>
              </div>}
              {selectedPayment ? (
                <div className="admin-payment-detail">
                  <div className="admin-section-head">
                    <h3>{t("Zahlungsdetails")}</h3>
                    <button className="admin-button" onClick={() => setSelectedPayment(null)}>
                      {t("Zur Liste")} </button>
                  </div>
                  <dl>
                    {[
                      ["Produkt", selectedPayment.productName],
                      ["Product ID", selectedPayment.productId],
                      ["Quantity", amount(selectedPayment.quantity)],
                      ["Username", selectedPayment.username || t("Not recorded")],
                      ["Purchase time", date(selectedPayment.purchasePrice.purchaseAt)],
                      ["Historical Pi price (USD)", amount(selectedPayment.purchasePrice.usdPerPi)],
                      ["Historical Pi price (EUR)", amount(selectedPayment.purchasePrice.eurPerPi)],
                      ["Purchase value (USD)", amount(selectedPayment.purchasePrice.usdAmount)],
                      ["Purchase value (EUR)", amount(selectedPayment.purchasePrice.eurAmount)],
                      ["Price source", selectedPayment.purchasePrice.source || t("Not available")],
                      ["Price timestamp", date(selectedPayment.purchasePrice.quotedAt)],
                      ["Historical price", t(selectedPayment.purchasePrice.availability === "test_payment" ? "Test payment: no monetary value" : selectedPayment.purchasePrice.availability === "available" ? "Available" : "Not available")],
                      ["EUR method", selectedPayment.purchasePrice.eurMethod === "provider_quote" ? t("Direct EUR quote from provider") : t("Not available")],
                      ["Status", statusNames[selectedPayment.status]],
                      ["Netzwerk", selectedPayment.network === "Pi Testnet" ? "Testnetz" : selectedPayment.network === "Pi Network" ? "Hauptnetz" : "Ungeklärt"],
                      [
                        "Betrag",
                        `${amount(selectedPayment.amountPi)}${selectedPayment.amountPi === null ? "" : selectedPayment.network === "Pi Testnet" ? " Test-Pi" : " Pi"}`,
                      ],
                      ["Wallet-Eingang", date(selectedPayment.receivedAt)],
                      ["Zahlung angelegt", date(selectedPayment.createdAt)],
                      ["App-Abschluss", date(selectedPayment.completedAt)],
                      ["Pi-Zahlungs-ID", selectedPayment.id],
                      ["Blockchain-TXID", selectedPayment.txid || "Nicht dokumentiert"],
                      ["Sender-Wallet", selectedPayment.fromAddress || "Nicht dokumentiert"],
                      ["Empfänger-Wallet", selectedPayment.toAddress || "Nicht dokumentiert"],
                      ["Pi-Konto-ID", selectedPayment.userUid],
                      ["Beschreibung", selectedPayment.memo || "—"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{t(label)}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p>
                    {t("Wallet-Eingang = bestätigter Blockchain-Zeitpunkt. Der App-Abschluss wird getrennt angezeigt. Alle Uhrzeiten: Wien.")} </p>
                  {selectedPayment.receiptSource && (
                    <a href={selectedPayment.receiptSource} target="_blank" rel="noreferrer" className="admin-button">
                      {t("Blockchain-Nachweis öffnen")} </a>
                  )}
                  <div className="admin-actions">
                    {selectedPayment.network !== "Pi Testnet" && (
                      <button
                        className="admin-button"
                        disabled={busy}
                        onClick={() => refreshPayment(selectedPayment, "mainnet")}
                      >
                        {t("Mit Mainnet abgleichen")} </button>
                    )}
                    {selectedPayment.network !== "Pi Network" && (
                      <button
                        className="admin-button"
                        disabled={busy}
                        onClick={() => refreshPayment(selectedPayment, "testnet")}
                      >
                        {t("Mit Testnet abgleichen")} </button>
                    )}
                  </div>
                  {selectedPayment.network === "Pi Network" && selectedPayment.status === "confirmed" && (
                    <div className="admin-valuation">
                      <h3>{t("EUR-Bewertung am Wallet-Eingang")}</h3>
                      {selectedPayment.receivedAt ? (
                        <form
                          key={`${selectedPayment.id}:${selectedPayment.valuation?.recordedAt || ""}`}
                          onSubmit={event => saveValuation(event, selectedPayment)}
                        >
                          <p>
                            {t("Bewertungszeitpunkt:")} {date(selectedPayment.receivedAt)}{t(". Trage den belegten Kurs dieses Zeitpunkts ein.")} </p>
                          <div className="admin-field-grid">
                            <label>
                              {t("EUR je Pi")} <input
                                name="rate"
                                type="number"
                                min="0.00000001"
                                max="1000000"
                                step="any"
                                required
                                defaultValue={selectedPayment.valuation?.eurPerPi}
                              />
                            </label>
                            <label>
                              {t("Kursquelle")} <input
                                name="source"
                                maxLength={500}
                                required
                                defaultValue={selectedPayment.valuation?.source}
                                placeholder={t("Quelle oder Beleg zum historischen Kurs")}
                              />
                            </label>
                            <label>
                              {t("Belegnummer")} <input
                                name="receipt"
                                maxLength={100}
                                defaultValue={selectedPayment.valuation?.receiptNumber}
                              />
                            </label>
                          </div>
                          {selectedPayment.valuation && (
                            <p>
                              {t("Gespeicherter Gegenwert:")}{" "}
                              {selectedPayment.valuation.eurAmount.toLocaleString("de-AT", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </p>
                          )}
                          <button className="admin-button" disabled={busy || !!selectedPayment.valuation}>
                            {t("Bewertung speichern")} </button>
                        </form>
                      ) : (
                        <p>
                          {t("Bitte zuerst den Wallet-Eingang mit Mainnet abgleichen. Ein aktueller Kurs wird nicht als historischer Eingangskurs verwendet.")} </p>
                      )}
                    </div>
                  )}
                </div>
              ) : ledgerLoading ? (
                <p role="status">{t("Zahlungen werden geladen …")}</p>
              ) : ledgerError ? (
                <p role="alert" className="admin-error">
                  {ledgerError}
                </p>
              ) : !ledger?.payments.length ? (
                <div className="admin-empty">
                  <h3>{t("Keine Einträge für diese Auswahl")}</h3>
                  <p>
                    {network === "unknown"
                      ? t("Ältere Vorgänge ohne gesicherte Netzwerkangabe erscheinen hier.")
                      : t("Noch keine {value0}-Zahlungen für diesen Filter gespeichert.", {value0: networkNames[network]})}
                  </p>
                </div>
              ) : (
                <>
                  <div className="admin-payments-list">
                    {ledger.payments.map(payment => (
                      <button key={payment.id} onClick={() => setSelectedPayment(payment)}>
                        <div>
                          <strong>{payment.productName}</strong>
                          <span>
                            {payment.receivedAt
                              ? t("Wallet-Eingang: {value0}", {value0: date(payment.receivedAt)})
                              : t("App-Vorgang: {value0}", {value0: date(payment.completedAt || payment.createdAt)})}
                          </span>
                        </div>
                        <div>
                          <strong>
                            {amount(payment.amountPi)}
                            {payment.amountPi === null ? "" : network === "testnet" ? t(" Test-Pi") : " Pi"}
                          </strong>
                          <span className={`admin-payment-status ${payment.status}`}>
                            {t(statusNames[payment.status])}
                          </span>
                        </div>
                        <b>{t("Details")}</b>
                      </button>
                    ))}
                  </div>
                  <div className="admin-pagination">
                    <button
                      className="admin-button"
                      disabled={page <= 1 || ledgerLoading}
                      onClick={() => setPage(value => value - 1)}
                    >
                      {t("Vorherige")} </button>
                    <span>
                      {t("Seite")} {page} / {Math.max(1, Math.ceil(ledger.total / ledger.pageSize))} · {ledger.total} {t("Einträge")} </span>
                    <button
                      className="admin-button"
                      disabled={page * ledger.pageSize >= ledger.total || ledgerLoading}
                      onClick={() => setPage(value => value + 1)}
                    >
                      {t("Nächste")} </button>
                  </div>
                </>
              )}
            </section>
          )}
          {view === "checks" && (
            <>
              <section className="admin-panel">
                <div className="admin-section-head">
                  <h2>{t("Zugriff & Verbindung")}</h2>
                  <button
                    className="admin-button"
                    disabled={busy}
                    onClick={() => {
                      void perform(async () => {
                        await auth.refreshSession();
                        setReload(value => value + 1);
                        setMessage("Pi-Sitzung erneut geprüft.");
                      });
                    }}
                  >
                    {t("Sitzung prüfen")} </button>
                </div>
                <dl className="admin-checks">
                  <div>
                    <dt>{t("Eigentümerkonto")}</dt>
                    <dd>@{auth.user?.username} {t("· verifiziert")}</dd>
                  </div>
                  <div>
                    <dt>{t("Datenbank")}</dt>
                    <dd>
                      {services ? (services.services.database ? "Erreichbar" : "Nicht bereit") : t("Wird geprüft …")}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Mainnet-Zahlungsanbindung")}</dt>
                    <dd>
                      {services
                        ? services.services.mainnetPayments
                          ? t("Konfiguriert")
                          : t("Nicht eingerichtet")
                        : t("Wird geprüft …")}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Testnet-Zahlungsanbindung")}</dt>
                    <dd>
                      {services
                        ? services.services.testnetPayments
                          ? t("Konfiguriert")
                          : t("Nicht eingerichtet")
                        : t("Wird geprüft …")}
                    </dd>
                  </div>
                </dl>
                <p>{t("Die Prüfung bestätigt den Zugriff und die Konfiguration. Sie führt keinen Kauf durch.")}</p>
              </section>
              <section className="admin-panel">
                <div className="admin-section-head">
                  <h2>{t("Sounds & Musik testen")}</h2>
                  <button
                    className="admin-button"
                    onClick={() => {
                      audioRef.current?.pause();
                      setPlayingAudio("");
                    }}
                  >
                    {t("Ton stoppen")} </button>
                </div>
                <p role="status">
                  {playingAudio ? t("Wiedergabe: {value0}", {value0: t(playingAudio)}) : t("Tippe auf einen Ton, um ihn abzuspielen.")}
                </p>
                <div className="admin-sound-grid">
                  {audioTests.map(([name, file]) => (
                    <button
                      className="admin-button"
                      key={file}
                      aria-pressed={playingAudio === name}
                      onClick={() => {
                        void testAudio(name, file);
                      }}
                    >
                      {t(name)}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
