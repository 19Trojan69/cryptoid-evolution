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
import { translate } from "../i18n";

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
    ? new Date(value).toLocaleString("de-AT", { timeZone: "Europe/Vienna" })
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
  ["Overdrive", "pickup-overdrive"],
  ["Rapid", "pickup-rapid"],
  ["Bombe", "pickup-bomb"],
  ["EMP", "pickup-emp"],
  ["Boss-Sirene", "boss-warning-siren"],
  ["Boss-Explosion", "boss-destroy-v3"],
  ["Boss-Sieg", "boss-victory-v2"],
  ["Home-Musik", "home-galactic-chain"],
  ["Spielmusik", "battle-orbit"],
  ["Boss-Musik", "dreadnought-duel"],
] as const;

export default function AdminPage() {
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
        if (active) setLedger(data);
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
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cryptoid-pi-zahlungen-${network}-${status}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 15_000);
      setMessage("CSV-Download gestartet.");
    });
  };

  const refreshPayment = (payment: Payment, target: "mainnet" | "testnet") => {
    void perform(async () => {
      const { data } = await axiosClient.post<{ payment: Payment; receiptFound: boolean }>(
        `/admin/payments/${encodeURIComponent(payment.id)}/refresh`,
        { network: target }
      );
      setSelectedPayment(data.payment);
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
      setSelectedPayment(data.payment);
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
          <span className="admin-kicker">CRYPTOID EVOLUTION</span>
          <h1>Admin-Zentrale</h1>
        </div>
        <Link className="admin-button" to="/" state={{ openQuickMenu: true }}>← Schnellzugriff</Link>
        {allowed ? (
          <button className="admin-button" onClick={leaveAdmin} disabled={busy}>
            Zum normalen Spiel
          </button>
        ) : (
          <Link className="admin-button" to="/">
            Startseite
          </Link>
        )}
      </header>
      {!auth.authReady ? (
        <section className="admin-panel" role="status">
          <h2>Pi-Zugriff wird geprüft …</h2>
        </section>
      ) : !allowed ? (
        <section className="admin-panel admin-access">
          <h2>{auth.user ? "Kein Admin-Zugriff" : "Mit deinem Pi-Konto anmelden"}</h2>
          <p>
            {auth.user
              ? `@${auth.user.username} ist für diesen Admin-Bereich nicht freigeschaltet.`
              : "Die Admin-Zentrale ist nur für dein verifiziertes Eigentümerkonto zugänglich."}
          </p>
          {auth.authError && <p role="alert">{translate("de", auth.authError)}</p>}
          <div className="admin-actions">
            <button
              className="admin-button admin-primary"
              onClick={() => {
                void auth.signIn();
              }}
              disabled={auth.isLoading}
            >
              Mit Pi anmelden
            </button>
            <button
              className="admin-button"
              onClick={() => {
                void perform(async () => {
                  await auth.refreshSession();
                });
              }}
              disabled={busy}
            >
              Sitzung erneut prüfen
            </button>
            {auth.user && (
              <button
                className="admin-button"
                onClick={() => {
                  void auth.signOut();
                }}
              >
                Abmelden
              </button>
            )}
          </div>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
        </section>
      ) : (
        <>
          <div className="admin-owner">
            <span>@{auth.user?.username}</span>
            <span>Geschützter Eigentümerzugriff</span>
          </div>
          <nav className="admin-nav" aria-label="Admin-Seiten">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                className={view === key ? "active" : ""}
                aria-current={view === key ? "page" : undefined}
                onClick={() => openView(key)}
              >
                {label}
              </button>
            ))}
          </nav>
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          {auth.authError && (
            <p className="admin-error" role="alert">
              {translate("de", auth.authError)}
            </p>
          )}
          {message && (
            <p className="admin-message" role="status">
              {message}
            </p>
          )}
          {view === "usage" && <AdminUsage />}
          {view === "overview" && (
            <>
              <section className="admin-shortcuts" aria-label="Schnellzugriff">
                {[
                  ["ships", "Raumschiffe testen", "Alle 20 Modelle · Standard, Advanced und Elite"],
                  ["levels", "Level oder Boss starten", "Block, Bosskampf und Bonusrunde direkt öffnen"],
                  ["payments", "Zahlungseingänge ansehen", "Echte Pi, Test-Pi, Details und CSV-Download"],
                  ["scores", "Eigene Rekorde", "Karrierepunkte und Best Run nur für dieses Netzwerk zurücksetzen"],
                ].map(([key, title, description]) => (
                  <button key={key} onClick={() => openView(key as AdminView)}>
                    <strong>{title}</strong>
                    <span>{description}</span>
                    <b>Öffnen</b>
                  </button>
                ))}
              </section>
              <section className="admin-panel">
                <h2>Bereit zum Testen</h2>
                <div className="admin-metrics">
                  <div>
                    <strong>20</strong>
                    <span>Schiffsmodelle</span>
                  </div>
                  <div>
                    <strong>60</strong>
                    <span>Schiffsstufen</span>
                  </div>
                  <div>
                    <strong>50</strong>
                    <span>Bosse</span>
                  </div>
                  <div>
                    <strong>500</strong>
                    <span>Spielabschnitte</span>
                  </div>
                </div>
                <p>
                  Der aktuelle Ablauf umfasst {levelCount} angezeigte Level mit jeweils neun Blocks, Boss und
                  Bonusrunde.
                </p>
                <p>Admin-Testläufe schreiben keine Rekorde, Shards, Käufe oder Belohnungen gut.</p>
              </section>
              <section className="admin-panel">
                <h2>Bestätigte Zahlungseingänge</h2>
                {ledgerLoading ? (
                  <p role="status">Zahlungen werden geladen …</p>
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
                            setPage(1);
                            openView("payments");
                          }}
                        >
                          <strong>
                            {amount(summary?.confirmedPi ?? 0)}{" "}
                            {key === "testnet" ? "Test-Pi" : key === "mainnet" ? "Pi" : ""}
                          </strong>
                          <span>
                            {networkNames[key]} · {summary?.confirmed ?? 0} bestätigt
                            {summary?.missingAmounts ? ` · ${summary.missingAmounts} Beträge fehlen` : ""}
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
                  <span>{stageNames[stage - 1]}</span>
                </div>
                <div className="admin-test-options">
                  <h2>Testauswahl</h2>
                  <div className="admin-field-grid">
                    <label>
                      Raumschiff
                      <select aria-label="Raumschiff" value={skinId} onChange={event => setSkinId(event.target.value as PlayerSkinId)}>
                        {playerSkins.map(skin => (
                          <option key={skin.id} value={skin.id}>
                            {skin.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Schiffsstufe
                      <select aria-label="Schiffsstufe" value={stage} onChange={event => setStage(Number(event.target.value) as ShipStage)}>
                        {stageNames.map((name, index) => (
                          <option key={name} value={index + 1}>
                            {index + 1} · {name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Waffe
                      <select aria-label="Waffe" value={weapon} onChange={event => setWeapon(Number(event.target.value))}>
                        {weaponNames.map((name, index) => (
                          <option key={name} value={index + 1}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Start-Power-up
                      <select aria-label="Start-Power-up" value={power} onChange={event => setPower(event.target.value)}>
                        <option value="">Keines</option>
                        {hangarCatalog
                          .filter(offer => offer.kind === "power")
                          .map(offer => (
                            <option key={offer.id} value={offer.id}>
                              {offer.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  <fieldset className="admin-colors">
                    <legend>Schiffsfarbe</legend>
                    {playerColors.map(color => (
                      <button
                        key={color.id}
                        type="button"
                        aria-label={color.name}
                        title={color.name}
                        aria-pressed={colorId === color.id}
                        style={{ backgroundColor: color.glow }}
                        onClick={() => setColorId(color.id)}
                      />
                    ))}
                  </fieldset>
                  <p>Alle Modelle, Stufen und Waffen stehen im Test zur Verfügung.</p>
                </div>
              </section>
              {view === "ships" ? (
                <section className="admin-panel">
                  <div className="admin-section-head">
                    <h2>Alle Raumschiffe</h2>
                    <button className="admin-button admin-primary" onClick={() => startTest("normal")} disabled={busy}>
                      Ausgewähltes Schiff testen
                    </button>
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
                        <span>{stageNames[stage - 1]}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : (
                <>
                  <section className="admin-panel">
                    <h2>Direkt starten</h2>
                    <div className="admin-field-grid">
                      <label>
                        Level
                        <select aria-label="Level" value={level} onChange={event => setLevel(Number(event.target.value))}>
                          {Array.from({ length: levelCount }, (_, index) => (
                            <option key={index} value={index + 1}>
                              Level {index + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Block
                        <select aria-label="Block" value={block} onChange={event => setBlock(Number(event.target.value))}>
                          {Array.from({ length: 9 }, (_, index) => (
                            <option key={index} value={index + 1}>
                              Block {index + 1}/9
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
                        Block starten
                      </button>
                      <button className="admin-button" onClick={() => startTest("boss")} disabled={busy}>
                        Boss starten
                      </button>
                      <button className="admin-button" onClick={() => startTest("bonus")} disabled={busy}>
                        Bonusrunde starten
                      </button>
                    </div>
                  </section>
                  <section className="admin-panel">
                    <h2>Alle 50 Bosse</h2>
                    <p>Ein Button startet den jeweiligen Boss mit deiner Testauswahl.</p>
                    <div className="admin-bosses">
                      {Array.from({ length: 50 }, (_, index) => (
                        <button
                          className="admin-button"
                          key={index}
                          onClick={() => startTest("boss", index + 1)}
                          disabled={busy}
                        >
                          Boss {String(index + 1).padStart(2, "0")}
                        </button>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </>
          )}
          {view === "scores" && <section className="admin-panel admin-score-reset">
            <h2>Eigene Rekorde zurücksetzen</h2>
            {!ownScores ? !error && <p role="status">Rekorde werden geladen …</p> : <>
              <p>Netzwerk: <strong>{ownScores.network === "testnet" ? "Testnet" : "Mainnet"}</strong> · Konto: <strong>@{auth.user?.username}</strong></p>
              <p>Karrierepunkte: {ownScores.careerScore.toLocaleString("de-AT")} · Bester Lauf: {ownScores.bestRun.score.toLocaleString("de-AT")} (Level {ownScores.bestRun.level ?? "—"}) · Bisheriger V2-Rekord: {ownScores.bestScore.toLocaleString("de-AT")}</p>
              <p>Nur deine Score-Werte in diesem Netzwerk werden auf null gesetzt. Spielstand, Shards, Käufe und das andere Netzwerk bleiben erhalten. Der ältere gemeinsame Archivrekord bleibt unverändert.</p>
              <label>Zur Bestätigung deinen Pi-Namen eingeben: <input type="text" value={resetName} onChange={event => setResetName(event.target.value)} autoComplete="off" /></label>
              <label className="admin-score-confirm"><input type="checkbox" checked={resetChecked} onChange={event => setResetChecked(event.target.checked)} /> Ich möchte meine Rekorde in diesem Netzwerk zurücksetzen.</label>
              <div className="admin-actions"><button className="admin-button" type="button" disabled={busy || !resetChecked || resetName !== auth.user?.username} onClick={resetOwnScores}>Eigene Rekorde zurücksetzen</button></div>
            </>}
          </section>}
          {view === "payments" && (
            <section className="admin-panel">
              <div className="admin-section-head">
                <h2>Zahlungseingänge</h2>
                <button className="admin-button" onClick={() => setReload(value => value + 1)} disabled={ledgerLoading}>
                  Aktualisieren
                </button>
              </div>
              <p>
                App-Käufe und ihre Zahlungseingänge. Andere Überweisungen in deine private Wallet sind hier nicht
                enthalten.
              </p>
              <div className="admin-network-switch" aria-label="Zahlungsnetzwerk">
                {(["mainnet", "testnet", "unknown"] as const).map(key => (
                  <button
                    key={key}
                    aria-pressed={network === key}
                    onClick={() => {
                      setNetwork(key);
                      setPage(1);
                      setSelectedPayment(null);
                    }}
                  >
                    {networkNames[key]}
                  </button>
                ))}
              </div>
              <div className="admin-payment-tools">
                <label>
                  Status
                  <select aria-label="Status"
                    value={status}
                    onChange={event => {
                      setStatus(event.target.value as Status);
                      setPage(1);
                      setSelectedPayment(null);
                    }}
                  >
                    <option value="all">Alle Vorgänge</option>
                    <option value="confirmed">Bestätigte Eingänge</option>
                    <option value="pending">Offen</option>
                    <option value="cancelled">Storniert</option>
                  </select>
                </label>
                <button className="admin-button admin-primary" disabled={busy} onClick={exportPayments}>
                  CSV herunterladen
                </button>
              </div>
              {selectedPayment ? (
                <div className="admin-payment-detail">
                  <div className="admin-section-head">
                    <h3>Zahlungsdetails</h3>
                    <button className="admin-button" onClick={() => setSelectedPayment(null)}>
                      Zur Liste
                    </button>
                  </div>
                  <dl>
                    {[
                      ["Produkt", selectedPayment.productName],
                      ["Status", statusNames[selectedPayment.status]],
                      ["Netzwerk", selectedPayment.network],
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
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p>
                    Wallet-Eingang = bestätigter Blockchain-Zeitpunkt. Der App-Abschluss wird getrennt angezeigt. Alle
                    Uhrzeiten: Wien.
                  </p>
                  {selectedPayment.receiptSource && (
                    <a href={selectedPayment.receiptSource} target="_blank" rel="noreferrer" className="admin-button">
                      Blockchain-Nachweis öffnen
                    </a>
                  )}
                  <div className="admin-actions">
                    {selectedPayment.network !== "Pi Testnet" && (
                      <button
                        className="admin-button"
                        disabled={busy}
                        onClick={() => refreshPayment(selectedPayment, "mainnet")}
                      >
                        Mit Mainnet abgleichen
                      </button>
                    )}
                    {selectedPayment.network !== "Pi Network" && (
                      <button
                        className="admin-button"
                        disabled={busy}
                        onClick={() => refreshPayment(selectedPayment, "testnet")}
                      >
                        Mit Testnet abgleichen
                      </button>
                    )}
                  </div>
                  {selectedPayment.network === "Pi Network" && selectedPayment.status === "confirmed" && (
                    <div className="admin-valuation">
                      <h3>EUR-Bewertung am Wallet-Eingang</h3>
                      {selectedPayment.receivedAt ? (
                        <form
                          key={`${selectedPayment.id}:${selectedPayment.valuation?.recordedAt || ""}`}
                          onSubmit={event => saveValuation(event, selectedPayment)}
                        >
                          <p>
                            Bewertungszeitpunkt: {date(selectedPayment.receivedAt)}. Trage den belegten Kurs dieses
                            Zeitpunkts ein.
                          </p>
                          <div className="admin-field-grid">
                            <label>
                              EUR je Pi
                              <input
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
                              Kursquelle
                              <input
                                name="source"
                                maxLength={500}
                                required
                                defaultValue={selectedPayment.valuation?.source}
                                placeholder="Quelle oder Beleg zum historischen Kurs"
                              />
                            </label>
                            <label>
                              Belegnummer
                              <input
                                name="receipt"
                                maxLength={100}
                                defaultValue={selectedPayment.valuation?.receiptNumber}
                              />
                            </label>
                          </div>
                          {selectedPayment.valuation && (
                            <p>
                              Gespeicherter Gegenwert:{" "}
                              {selectedPayment.valuation.eurAmount.toLocaleString("de-AT", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </p>
                          )}
                          <button className="admin-button" disabled={busy}>
                            Bewertung speichern
                          </button>
                        </form>
                      ) : (
                        <p>
                          Bitte zuerst den Wallet-Eingang mit Mainnet abgleichen. Ein aktueller Kurs wird nicht als
                          historischer Eingangskurs verwendet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : ledgerLoading ? (
                <p role="status">Zahlungen werden geladen …</p>
              ) : ledgerError ? (
                <p role="alert" className="admin-error">
                  {ledgerError}
                </p>
              ) : !ledger?.payments.length ? (
                <div className="admin-empty">
                  <h3>Keine Einträge für diese Auswahl</h3>
                  <p>
                    {network === "unknown"
                      ? "Ältere Vorgänge ohne gesicherte Netzwerkangabe erscheinen hier."
                      : `Noch keine ${networkNames[network]}-Zahlungen für diesen Filter gespeichert.`}
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
                              ? `Wallet-Eingang: ${date(payment.receivedAt)}`
                              : `App-Vorgang: ${date(payment.completedAt || payment.createdAt)}`}
                          </span>
                        </div>
                        <div>
                          <strong>
                            {amount(payment.amountPi)}
                            {payment.amountPi === null ? "" : network === "testnet" ? " Test-Pi" : " Pi"}
                          </strong>
                          <span className={`admin-payment-status ${payment.status}`}>
                            {statusNames[payment.status]}
                          </span>
                        </div>
                        <b>Details</b>
                      </button>
                    ))}
                  </div>
                  <div className="admin-pagination">
                    <button
                      className="admin-button"
                      disabled={page <= 1 || ledgerLoading}
                      onClick={() => setPage(value => value - 1)}
                    >
                      Vorherige
                    </button>
                    <span>
                      Seite {page} / {Math.max(1, Math.ceil(ledger.total / ledger.pageSize))} · {ledger.total} Einträge
                    </span>
                    <button
                      className="admin-button"
                      disabled={page * ledger.pageSize >= ledger.total || ledgerLoading}
                      onClick={() => setPage(value => value + 1)}
                    >
                      Nächste
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
          {view === "checks" && (
            <>
              <section className="admin-panel">
                <div className="admin-section-head">
                  <h2>Zugriff & Verbindung</h2>
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
                    Sitzung prüfen
                  </button>
                </div>
                <dl className="admin-checks">
                  <div>
                    <dt>Eigentümerkonto</dt>
                    <dd>@{auth.user?.username} · verifiziert</dd>
                  </div>
                  <div>
                    <dt>Datenbank</dt>
                    <dd>
                      {services ? (services.services.database ? "Erreichbar" : "Nicht bereit") : "Wird geprüft …"}
                    </dd>
                  </div>
                  <div>
                    <dt>Mainnet-Zahlungsanbindung</dt>
                    <dd>
                      {services
                        ? services.services.mainnetPayments
                          ? "Konfiguriert"
                          : "Nicht eingerichtet"
                        : "Wird geprüft …"}
                    </dd>
                  </div>
                  <div>
                    <dt>Testnet-Zahlungsanbindung</dt>
                    <dd>
                      {services
                        ? services.services.testnetPayments
                          ? "Konfiguriert"
                          : "Nicht eingerichtet"
                        : "Wird geprüft …"}
                    </dd>
                  </div>
                </dl>
                <p>Die Prüfung bestätigt den Zugriff und die Konfiguration. Sie führt keinen Kauf durch.</p>
              </section>
              <section className="admin-panel">
                <div className="admin-section-head">
                  <h2>Sounds & Musik testen</h2>
                  <button
                    className="admin-button"
                    onClick={() => {
                      audioRef.current?.pause();
                      setPlayingAudio("");
                    }}
                  >
                    Ton stoppen
                  </button>
                </div>
                <p role="status">
                  {playingAudio ? `Wiedergabe: ${playingAudio}` : "Tippe auf einen Ton, um ihn abzuspielen."}
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
                      {name}
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
