import { backupTrace } from "./traceBackupFormat.ts";
type State = { status: "checking" | "ready" | "saving" | "saved" | "offline"; savedAt?: number; runId?: string };
type Options = {
  fetch: typeof fetch;
  uuid: () => string;
  onState?: (state: State) => void;
  onRecovered?: (trace: unknown, savedAt: number) => void;
  timeoutMs?: number;
};
export function createRemoteTraceBackup(options: Options) {
  let runId = options.uuid(),
    revision = 0,
    inflight = false,
    scheduled = false;
  let pending: {
    runId: string;
    revision: number;
    clientVersion: string;
    trace: NonNullable<ReturnType<typeof backupTrace>>;
  } | null = null;
  const notify = (state: State) => {
    try {
      options.onState?.(state);
    } catch {
      /* UI cannot affect play. */
    }
  };
  const request = async (url: string, init?: RequestInit) => {
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);
    try {
      const response = await options.fetch(url, {
        ...init,
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw Error("backup");
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };
  const send = async () => {
    scheduled = false;
    if (inflight || !pending) return;
    const packet = pending;
    pending = null;
    inflight = true;
    notify({ status: "saving", runId: packet.runId });
    let failed = false;
    try {
      const ack = await request("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packet),
        keepalive: true,
      });
      if (ack.runId !== packet.runId || !Number.isSafeInteger(ack.revision) || ack.revision < packet.revision || !Number.isFinite(ack.savedAt)) throw Error("ack");
      notify({ status: "saved", runId: packet.runId, savedAt: ack.savedAt });
    } catch {
      failed = true;
      if (!pending) pending = packet;
      notify({ status: "offline", runId: packet.runId });
    } finally {
      inflight = false;
      if (pending && !failed) queueMicrotask(() => void send());
    }
  };
  return {
    startRun() {
      runId = options.uuid();
      revision = 0;
      return runId;
    },
    enqueue(trace: unknown) {
      const clean = backupTrace(trace);
      if (!clean) return;
      pending = { runId, revision: ++revision, clientVersion: "V5", trace: clean };
      if (!inflight && !scheduled) {
        scheduled = true;
        queueMicrotask(() => void send());
      }
    },
    async recover() {
      try {
        const data = await request("/api/diagnostics");
        if (data.ready !== true) throw Error("backup");
        const latest = data.latest;
        if (latest?.trace) {
          const clean = backupTrace(latest.trace);
          if (clean) options.onRecovered?.(clean, latest.savedAt);
        }
        notify(latest ? { status: "saved", savedAt: latest.savedAt, runId: latest.runId } : { status: "ready" });
        return true;
      } catch {
        notify({ status: "offline" });
        return false;
      }
    },
  };
}
