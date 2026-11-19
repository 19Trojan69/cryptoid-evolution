export type IntegrationCheck = {
  id: string;
  label: string;
  status: "ok" | "warning" | "error" | "unknown";
  detail: string;
  responseMs: number;
};

export type IntegrationReport = {
  checkedAt: string;
  checks: IntegrationCheck[];
  nfts: {
    purchasable: boolean;
    ownerReleased: boolean | null;
    walletSigning: string;
    reservationMode: false;
    checks: { id: string; ready: boolean }[];
    explanation: string;
  };
};

export const INTEGRATION_REFRESH_MS = 15_000;
export const RESPONSE_SCALE_MS = 4_000;

// Display guidelines for these read probes, not Pi service-level guarantees.
export function integrationQuality(check: IntegrationCheck, stale = false) {
  if (stale) return { tone: "unknown", label: "Veraltet", responseMs: null } as const;
  if (check.status === "unknown") return { tone: "unknown", label: "Nicht bewertet", responseMs: null } as const;
  const responseMs = Number.isFinite(check.responseMs) && check.responseMs >= 0 ? check.responseMs : null;
  if (check.status === "error") return { tone: "bad", label: "Störung", responseMs } as const;
  if (responseMs === null) return { tone: "unknown", label: "Kein gültiger Messwert", responseMs } as const;
  if (responseMs > 2_500) return { tone: "bad", label: "Sehr langsam", responseMs } as const;
  if (responseMs > 1_000) return { tone: "slow", label: "Langsam", responseMs } as const;
  if (check.status === "warning") return { tone: "slow", label: "Eingeschränkt", responseMs } as const;
  if (responseMs > 500) return { tone: "fair", label: "Normal", responseMs } as const;
  return { tone: "good", label: "Schnell", responseMs } as const;
}

export type IntegrationPollingMode = "live" | "hidden" | "offline" | "blocked";
export type IntegrationPollingHost = {
  isVisible: () => boolean;
  isOnline: () => boolean;
  subscribe: (changed: () => void) => () => void;
  setTimer: (callback: () => void, delay: number) => unknown;
  clearTimer: (timer: unknown) => void;
};

export function browserIntegrationPollingHost(): IntegrationPollingHost {
  let pageActive = true;
  return {
    isVisible: () => pageActive && document.visibilityState !== "hidden",
    isOnline: () => navigator.onLine !== false,
    subscribe(changed) {
      const hide = () => { pageActive = false; changed(); };
      const show = () => { pageActive = true; changed(); };
      document.addEventListener("visibilitychange", changed);
      window.addEventListener("online", changed);
      window.addEventListener("offline", changed);
      window.addEventListener("pagehide", hide);
      window.addEventListener("pageshow", show);
      return () => {
        document.removeEventListener("visibilitychange", changed);
        window.removeEventListener("online", changed);
        window.removeEventListener("offline", changed);
        window.removeEventListener("pagehide", hide);
        window.removeEventListener("pageshow", show);
      };
    },
    setTimer: (callback, delay) => window.setTimeout(callback, delay),
    clearTimer: timer => window.clearTimeout(timer as number),
  };
}

// Exactly one request or next-cycle timeout. Background/offline/unmounted pages
// abort their request; an obsolete response cannot replace a newer report.
export function startIntegrationPolling<T>({ host, request, onResult, onError, onBusy, onMode }: {
  host: IntegrationPollingHost;
  request: (signal: AbortSignal) => Promise<T>;
  onResult: (result: T) => void;
  onError: (error: unknown) => boolean;
  onBusy: (busy: boolean) => void;
  onMode: (mode: IntegrationPollingMode) => void;
}) {
  let disposed = false, blocked = false;
  let controller: AbortController | null = null;
  let timer: unknown = null;
  const clearTimer = () => {
    if (timer !== null) host.clearTimer(timer);
    timer = null;
  };
  const active = () => !disposed && !blocked && host.isVisible() && host.isOnline();
  const run = async () => {
    if (!active() || controller) return;
    clearTimer();
    const current = new AbortController();
    controller = current;
    onBusy(true);
    try {
      const result = await request(current.signal);
      if (!disposed && controller === current && !current.signal.aborted) onResult(result);
    } catch (error) {
      if (!disposed && controller === current && !current.signal.aborted && !onError(error)) {
        blocked = true;
        onMode("blocked");
      }
    } finally {
      if (!disposed && controller === current) {
        controller = null;
        onBusy(false);
        if (active()) timer = host.setTimer(() => { timer = null; void run(); }, INTEGRATION_REFRESH_MS);
      }
    }
  };
  const changed = () => {
    if (disposed) return;
    if (active()) {
      onMode("live");
      void run();
    } else {
      clearTimer();
      const previous = controller;
      controller = null;
      previous?.abort();
      if (previous) onBusy(false);
      onMode(blocked ? "blocked" : host.isOnline() ? "hidden" : "offline");
    }
  };
  const unsubscribe = host.subscribe(changed);
  changed();
  return {
    refresh: () => { blocked = false; changed(); },
    stop: () => {
      disposed = true;
      clearTimer();
      controller?.abort();
      controller = null;
      unsubscribe();
    },
  };
}
