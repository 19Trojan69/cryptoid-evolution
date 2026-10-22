import { createPerformanceProbe, retainOwnerResourceTiming } from './performanceDiagnostics.ts';
import { cleanTimingCapture, OWNER_TIMING_ARM_KEY, OWNER_TIMING_ARM_TTL_MS, OWNER_TIMING_DURATION_MS,
  OWNER_TIMING_KEY, OWNER_TIMING_MAX_BYTES } from './timingReport.mjs';
import { AUDIO_AUDIT_ARM_KEY } from './audioAuditReport.mjs';

type Host = { sessionStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  localStorage?: Pick<Storage, 'setItem'>; __cryptoidBootId?: string };
// Fresh server verification precedes even obtaining the storage host.
export async function armOwnerTimingCapture(verify: () => Promise<{ canAdmin?: boolean }>, getHost: () => Host,
  active = () => true, now = Date.now()) {
  const owner = await verify();
  if (owner?.canAdmin !== true) throw new Error('owner_access_required');
  if (!active()) return false;
  getHost().sessionStorage.setItem(OWNER_TIMING_ARM_KEY, String(now));
  getHost().sessionStorage.removeItem(AUDIO_AUDIT_ARM_KEY);
  return true;
}
type ProbeOptions = Parameters<typeof createPerformanceProbe>[0];
export function createOwnerTimingCapture(verifiedOwner: boolean, getHost: () => Host,
  options: { now?: () => number; wallNow?: () => number; runtime?: NonNullable<ProbeOptions>['runtime'];
    build: { sourceCommit: string; sourceTree: string; workingTreeDirty: boolean }; onFinish?: () => void;
    fullContext?: () => Record<string, unknown> }) {
  if (!verifiedOwner) return null;
  const host = getHost(), wallNow = options.wallNow ?? Date.now, now = options.now ?? (() => performance.now());
  let armedAt: number;
  try {
    const raw = host.sessionStorage.getItem(OWNER_TIMING_ARM_KEY);
    armedAt = raw === null ? NaN : Number(raw);
    if (!Number.isFinite(armedAt) || armedAt <= 0 || wallNow() < armedAt || wallNow() - armedAt > OWNER_TIMING_ARM_TTL_MS) return null;
    host.sessionStorage.removeItem(OWNER_TIMING_ARM_KEY);
  } catch { return null; }
  // Only aggregate counters; no new listeners, timer, RAF, fetch or DOM overlay.
  let release = retainOwnerResourceTiming(now() + OWNER_TIMING_DURATION_MS);
  let baseline = {};
  try { baseline = options.runtime?.() ?? {}; } catch { /* Optional APIs. */ }
  return createPerformanceProbe({ now, runtime: options.runtime, environment: 'owner-admin', publishGlobal: false,
    maxDurationMs: OWNER_TIMING_DURATION_MS,
    onStart: () => { release(); release = retainOwnerResourceTiming(now() + OWNER_TIMING_DURATION_MS); },
    metadata: { ...options.build, bootId: host.__cryptoidBootId, recordedAt: wallNow(),
      durationLimitMs: OWNER_TIMING_DURATION_MS, runtimeBaseline: baseline },
    persist: raw => {
      const capture = cleanTimingCapture(JSON.parse(raw));
      if (!capture) return;
      const serialized = JSON.stringify(capture);
      if (serialized.length > OWNER_TIMING_MAX_BYTES) return;
      for (const name of ['localStorage','sessionStorage'] as const) {
        try { host[name]?.setItem(OWNER_TIMING_KEY, serialized); } catch { /* Never interrupt play. */ }
      }
    },
    onFinish: started => {
      release();
      options.onFinish?.();
      // React StrictMode's setup/cleanup/setup happens before any playing RAF.
      // Preserve the one-shot request if no playing frame was measured at all.
      if (!started) try {
        if (host.sessionStorage.getItem(OWNER_TIMING_ARM_KEY) === null && wallNow() - armedAt <= OWNER_TIMING_ARM_TTL_MS)
          host.sessionStorage.setItem(OWNER_TIMING_ARM_KEY, String(armedAt));
      } catch { /* Optional storage. */ }
    },
  });
}
