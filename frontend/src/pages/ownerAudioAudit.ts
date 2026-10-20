import {
  AUDIO_AUDIT_KEY,
  AUDIO_AUDIT_ARM_KEY,
  AUDIO_AUDIT_MAX_BYTES,
  AUDIO_AUDIT_DURATION_MS,
  audioAuditEventKinds,
  cleanAudioAudit,
  readAudioAudits,
} from "./audioAuditReport.mjs";
import { OWNER_TIMING_ARM_KEY } from "./timingReport.mjs";
type Host = {
  sessionStorage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  localStorage?: Pick<Storage, "getItem" | "setItem">;
  __cryptoidBootId?: string;
};
type Mode = "original" | "off";
type VoiceKind = "effects" | "weapons" | "card";
type Voice = { kind: VoiceKind; context: BaseAudioContext; endsAt: number; ended: boolean };
type AuditContext = {
  status: string;
  sector: number;
  phase: string;
  encounter: string;
  adminPreview: boolean;
  documentHidden: boolean;
};
let active: ReturnType<typeof makeRecorder> | null = null;
export const ownerAudioDisabled = () => active?.mode === "off";
export const audioAuditRecording = () => active?.recording === true;
export function noteAudioEvent(kind: string) {
  active?.event(kind);
}
const ignoreEvent = (_kind: string) => {};
// Async completions belong to the audit that requested them, never a later run.
export const captureAudioAuditEvents = () => active?.event ?? ignoreEvent;
export function noteAudioVoiceStart(source: object, context: BaseAudioContext, endsAt: number, kind: VoiceKind) {
  active?.voiceStart(source, context, endsAt, kind);
}
export function noteAudioVoiceEnd(source: object) {
  active?.voiceEnd(source);
}
export function noteAudioVoiceRelease(source: object) {
  active?.voiceRelease(source);
}
export function audioVoiceOverdue(voices: Iterable<{ source: object }>) {
  let overdue = 0,
    untracked = 0;
  for (const voice of voices) {
    const entry = active?.voices.get(voice.source);
    if (!entry) {
      untracked++;
      continue;
    }
    if (!entry.ended && Number.isFinite(entry.endsAt) && entry.context.currentTime > entry.endsAt + 1) overdue++;
  }
  return { overdue, untracked };
}
export const audioClockMs = (context: BaseAudioContext | null) =>
  context ? Math.round(context.currentTime * 1000) : 0;
export async function armOwnerAudioAudit(
  verify: () => Promise<{ canAdmin?: boolean }>,
  getHost: () => Host,
  mode: Mode | "cancel",
  activeView = () => true,
  now = Date.now()
) {
  const owner = await verify();
  if (owner.canAdmin !== true) throw Error("owner_access_required");
  if (!activeView()) return false;
  if (!["original", "off", "cancel"].includes(mode)) throw Error("invalid_audio_mode");
  const host = getHost();
  if (mode === "cancel") host.sessionStorage.removeItem(AUDIO_AUDIT_ARM_KEY);
  else {
    host.sessionStorage.setItem(AUDIO_AUDIT_ARM_KEY, JSON.stringify({ mode, at: now }));
    host.sessionStorage.removeItem(OWNER_TIMING_ARM_KEY);
  }
  return true;
}
function makeRecorder(mode: Mode, now: () => number) {
  const origin = now(),
    voices = new WeakMap<object, Voice>(),
    counts: Record<string, number> = {},
    events: { atMs: number; kind: string; gestureActive?: boolean; gestureSeen?: boolean }[] = [];
  let finished = false;
  const increment = (key: string) => {
    counts[key] = Math.min(1e12, (counts[key] ?? 0) + 1);
  };
  const prefix = (kind: VoiceKind) => kind;
  return {
    mode,
    voices,
    counts,
    events,
    get recording() {
      return !finished;
    },
    stop() {
      finished = true;
    },
    event(kind: string) {
      if (finished || !audioAuditEventKinds.includes(kind)) return;
      increment(kind);
      // Preserve startup events as well as the most recent events.
      if (events.length === 32) events.splice(8, 1);
      const gesture = typeof navigator === "undefined" ? undefined : navigator.userActivation;
      events.push({
        atMs: Math.round(now() - origin),
        kind,
        gestureActive: gesture?.isActive,
        gestureSeen: gesture?.hasBeenActive,
      });
    },
    voiceStart(source: object, context: BaseAudioContext, endsAt: number, kind: VoiceKind) {
      if (finished) return;
      voices.set(source, { kind, context, endsAt, ended: false });
      increment(prefix(kind) + "Started");
    },
    voiceEnd(source: object) {
      if (finished) return;
      const voice = voices.get(source);
      if (voice && !voice.ended) {
        voice.ended = true;
        increment(prefix(voice.kind) + "Ended");
      }
    },
    voiceRelease(source: object) {
      const voice = voices.get(source);
      if (voice) {
        if (!finished) increment(prefix(voice.kind) + "Released");
        voices.delete(source);
      }
    },
  };
}
export function createOwnerAudioAudit(
  verifiedTestnetOwner: boolean,
  getHost: () => Host,
  options: {
    now?: () => number;
    wallNow?: () => number;
    read: () => Record<string, unknown>;
    build: { sourceCommit: string; sourceTree: string; workingTreeDirty: boolean };
  }
) {
  if (!verifiedTestnetOwner || active) return null;
  const host = getHost(),
    now = options.now ?? (() => performance.now()),
    wallNow = options.wallNow ?? Date.now;
  let arm: { at: number; mode: Mode };
  try {
    // An armed comparison never changes an ordinary account round.
    if (host.sessionStorage.getItem("cryptoid_admin_preview") !== "1") return null;
    const raw = host.sessionStorage.getItem(AUDIO_AUDIT_ARM_KEY);
    if (!raw) return null;
    arm = JSON.parse(raw);
    if (
      !arm ||
      !["original", "off"].includes(arm.mode) ||
      !Number.isFinite(arm.at) ||
      arm.at <= 0 ||
      wallNow() < arm.at ||
      wallNow() - arm.at > 600_000
    )
      return null;
    host.sessionStorage.removeItem(AUDIO_AUDIT_ARM_KEY);
  } catch {
    return null;
  }
  const previous = readAudioAudits(host).filter(
    row => !(row.recordedAt === arm.at && row.mode === arm.mode && row.bootId === host.__cryptoidBootId)
  );
  const recorder = makeRecorder(arm.mode, now);
  active = recorder;
  const samples: Record<string, unknown>[] = [],
    recordedAt = arm.at;
  let startedAt: number | undefined,
    startedClock: number | undefined,
    lastSample = -Infinity,
    lastPersist = -Infinity,
    finished = false,
    frames = 0,
    frameMaxMs = 0;
  let latestContext: AuditContext = {
    status: "loading",
    sector: 0,
    phase: "SECTOR_INTRO",
    encounter: "normal",
    adminPreview: false,
    documentHidden: false,
  };
  let reason = "recording";
  const exportReport = () =>
    cleanAudioAudit({
      ...options.build,
      environment: "owner-admin",
      mode: arm.mode,
      recordedAt,
      bootId: host.__cryptoidBootId,
      startedAt,
      updatedAt: wallNow(),
      durationLimitMs: AUDIO_AUDIT_DURATION_MS,
      finished,
      reason,
      samples,
      events: recorder.events,
    });
  const persist = (force = false) => {
    if (!force && now() - lastPersist < 10_000) return;
    lastPersist = now();
    const report = exportReport();
    if (!report) return;
    const raw = JSON.stringify([...previous, report].slice(-2));
    if (raw.length > AUDIO_AUDIT_MAX_BYTES) return;
    for (const name of ["localStorage", "sessionStorage"] as const)
      try {
        host[name]?.setItem(AUDIO_AUDIT_KEY, raw);
      } catch {
        /* Never interrupt the game. */
      }
  };
  const sample = () => {
    let runtime: Record<string, unknown> = {};
    try {
      runtime = options.read();
    } catch {
      /* Optional audio host. */
    }
    const row: Record<string, unknown> = {
      ...runtime,
      ...latestContext,
      atMs: startedClock === undefined ? 0 : Math.round(now() - startedClock),
      frames,
      frameMaxMs,
      counts: { ...recorder.counts },
    };
    if (arm.mode === "off") {
      const total = (suffix: string) =>
        ["effects", "music", "card"].reduce((sum, kind) => sum + (recorder.counts[`${kind}-close-${suffix}`] ?? 0), 0);
      row.offCleanupFailed = total("failed") > 0;
      row.offCleanupComplete = startedClock !== undefined && total("request") === total("ok") && !row.offCleanupFailed;
    }
    const before = samples.at(-1);
    for (const key of ["effectsClock", "musicClock", "musicMedia", "cardClock"]) {
      const value = runtime[key + "Ms"],
        old = before?.[key + "Ms"];
      if (typeof value === "number" && typeof old === "number") row[key + "DeltaMs"] = Math.max(0, value - old);
    }
    samples.push(row);
    if (samples.length > 47) samples.splice(1, 1);
    lastSample = now();
    frames = frameMaxMs = 0;
  };
  const finish = (why: string) => {
    if (finished) return;
    reason = why;
    sample();
    finished = true;
    recorder.stop();
    persist(true);
  };
  sample();
  persist(true);
  return {
    mode: arm.mode,
    export: exportReport,
    tick(context: AuditContext, gapMs: number) {
      if (finished) return;
      latestContext = context;
      if (startedClock === undefined) {
        if (context.status !== "playing") return;
        startedClock = now();
        startedAt = wallNow();
        sample();
        persist(true);
      }
      frames++;
      if (Number.isFinite(gapMs)) frameMaxMs = Math.max(frameMaxMs, Math.max(0, gapMs));
      if (now() - startedClock >= AUDIO_AUDIT_DURATION_MS) {
        finish("limit");
        return;
      }
      if (now() - lastSample >= 2000) {
        sample();
        persist();
      }
    },
    dispose() {
      finish(startedClock === undefined ? "not-started" : "unmount");
      if (active === recorder) active = null;
      // StrictMode may clean up before any playing frame; keep the one-shot arm.
      if (startedClock === undefined)
        try {
          if (host.sessionStorage.getItem(AUDIO_AUDIT_ARM_KEY) === null && wallNow() - arm.at <= 600_000)
            host.sessionStorage.setItem(AUDIO_AUDIT_ARM_KEY, JSON.stringify(arm));
        } catch {
          /* Optional storage. */
        }
    },
  };
}
