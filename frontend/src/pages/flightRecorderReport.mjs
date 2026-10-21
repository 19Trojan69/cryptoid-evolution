import { cleanTimingCapture } from './timingReport.mjs';

export const FLIGHT_RECORDER_KEY = 'cryptoid_owner_flight_v1';
export const PREVIOUS_FLIGHT_RECORDER_KEY = 'cryptoid_owner_previous_flight_v1';
export const FLIGHT_RECORDER_MAX_CHARS = 64 * 1024;
export function cleanFlightRecorder(input) {
  if (input?.mode !== 'rolling-owner' || !Number.isFinite(input.savedAt) || input.savedAt < 0) return null;
  const capture = cleanTimingCapture(input);
  if (!capture) return null;
  return { ...capture, mode: 'rolling-owner', savedAt: input.savedAt,
    samples: capture.samples.slice(-30),
    limits: 'Rolling verified-owner recording: last 30 aggregate windows (normally about 60 seconds of active play), saved about every 2 seconds; heavy runtime counters at most every 10 seconds. Pauses/background are excluded from frame gaps. Previous run retained separately. Storage may fail or be cleared; last unsaved interval can be lost. RAF/React timing is not displayed FPS. Resource timing counters are cumulative; compare successive samples. diagnosticWork excludes the current write. No brightness, temperature, native/GPU/process memory or OS termination-cause measurement. No automatic transmission.' };
}
export function readFlightRecorders(host) {
  const captures = new Map();
  for (const key of [FLIGHT_RECORDER_KEY, PREVIOUS_FLIGHT_RECORDER_KEY]) {
    for (const name of ['localStorage', 'sessionStorage']) {
      try {
        const raw = host[name]?.getItem(key);
        if (typeof raw !== 'string' || raw.length > FLIGHT_RECORDER_MAX_CHARS) continue;
        const capture = cleanFlightRecorder(JSON.parse(raw));
        if (!capture) continue;
        const id = `${capture.metadata.bootId ?? ''}:${capture.metadata.recordedAt}`;
        if (!captures.has(id) || captures.get(id).savedAt < capture.savedAt) captures.set(id, capture);
      } catch { /* Optional local evidence only. */ }
    }
  }
  return [...captures.values()].sort((a, b) => b.savedAt - a.savedAt).slice(0, 2);
}
