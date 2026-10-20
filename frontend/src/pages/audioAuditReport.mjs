export const AUDIO_AUDIT_KEY = "cryptoid_owner_audio_v1";
export const AUDIO_AUDIT_ARM_KEY = "cryptoid_owner_audio_arm_v1";
export const AUDIO_AUDIT_MAX_BYTES = 128 * 1024;
export const AUDIO_AUDIT_DURATION_MS = 90_000;
const finite = value => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1e15;
const object = value => value && typeof value === "object" && !Array.isArray(value);
const numbers = (value, keys) =>
  Object.fromEntries(keys.filter(key => finite(value?.[key])).map(key => [key, value[key]]));
export const audioAuditEventKinds = [
  "effects-start-request",
  "effects-resume-request",
  "effects-resume-ok",
  "effects-resume-failed",
  "effects-decode-failed",
  "effects-close-request",
  "effects-close-ok",
  "effects-close-failed",
  "effects-blocked",
  "music-play-request",
  "music-play-ok",
  "music-play-failed",
  "music-unlock-request",
  "music-unlock-ok",
  "music-unlock-failed",
  "music-source-switch",
  "music-close-request",
  "music-close-ok",
  "music-close-failed",
  "music-blocked",
  "card-resume-request",
  "card-resume-ok",
  "card-resume-failed",
  "card-close-request",
  "card-close-ok",
  "card-close-failed",
  "card-blocked",
];
const voiceKeys = [
  "effectsStarted",
  "effectsEnded",
  "effectsReleased",
  "weaponsStarted",
  "weaponsEnded",
  "weaponsReleased",
  "cardStarted",
  "cardEnded",
  "cardReleased",
];
const snapshotKeys = [
  "atMs",
  "sector",
  "frames",
  "frameMaxMs",
  "width",
  "height",
  "shipStage",
  "playerShots",
  "enemyShots",
  "enemies",
  "effectsClockMs",
  "effectsVolume",
  "effectsGain",
  "effectsRegistered",
  "weaponsRegistered",
  "effectsOverdue",
  "weaponsOverdue",
  "untrackedVoices",
  "effectsBuffers",
  "effectsBufferBytes",
  "musicClockMs",
  "musicMediaMs",
  "musicVolume",
  "musicGain",
  "cardClockMs",
  "effectsClockDeltaMs",
  "musicClockDeltaMs",
  "musicMediaDeltaMs",
  "cardClockDeltaMs",
];
const states = ["none", "suspended", "running", "closed", "interrupted", "unknown"];
export function cleanAudioAudit(value) {
  if (
    !object(value) ||
    value.environment !== "owner-admin" ||
    !["original", "off"].includes(value.mode) ||
    !finite(value.recordedAt)
  )
    return null;
  const result = {
    version: 1,
    environment: "owner-admin",
    mode: value.mode,
    ...numbers(value, ["recordedAt", "startedAt", "updatedAt", "durationLimitMs"]),
    finished: value.finished === true,
    reason: ["limit", "unmount", "not-started"].includes(value.reason) ? value.reason : "recording",
  };
  for (const key of ["sourceCommit", "sourceTree"]) if (/^[a-f0-9]{40}$/.test(value[key])) result[key] = value[key];
  if (typeof value.workingTreeDirty === "boolean") result.workingTreeDirty = value.workingTreeDirty;
  if (typeof value.bootId === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(value.bootId)) result.bootId = value.bootId;
  result.samples = (Array.isArray(value.samples) ? value.samples : [])
    .slice(-47)
    .filter(object)
    .map(sample => {
      const clean = numbers(sample, snapshotKeys);
      for (const key of ["effectsState", "musicState", "cardState"])
        if (states.includes(sample[key])) clean[key] = sample[key];
      for (const key of [
        "musicPaused",
        "musicEnded",
        "musicMuted",
        "documentHidden",
        "adminPreview",
        "gestureActive",
        "gestureSeen",
        "offCleanupComplete",
        "offCleanupFailed",
      ])
        if (typeof sample[key] === "boolean") clean[key] = sample[key];
      if (["normal", "boss", "victory", "other", "none"].includes(sample.musicTrack))
        clean.musicTrack = sample.musicTrack;
      if (["loading", "playing", "paused", "destroying", "game-over", "victory"].includes(sample.status))
        clean.status = sample.status;
      if (["SECTOR_INTRO", "ENTRY", "FORMATION", "ATTACK_CYCLE", "REFORM", "SECTOR_CLEAR"].includes(sample.phase))
        clean.phase = sample.phase;
      if (["normal", "boss-intro", "boss-fight", "boss-clear", "bonus"].includes(sample.encounter))
        clean.encounter = sample.encounter;
      clean.counts = numbers(sample.counts, [...voiceKeys, ...audioAuditEventKinds]);
      return clean;
    });
  result.events = (Array.isArray(value.events) ? value.events : [])
    .slice(-32)
    .filter(event => object(event) && audioAuditEventKinds.includes(event.kind) && finite(event.atMs))
    .map(event => {
      const clean = { atMs: event.atMs, kind: event.kind };
      for (const key of ["gestureActive", "gestureSeen"]) if (typeof event[key] === "boolean") clean[key] = event[key];
      return clean;
    });
  result.limits =
    "Owner-only 90-second audio observation. Off lasts until leaving the selected admin round. No microphone, audible-output proof, native/GPU memory or crash-cause proof. Context/media clocks are not presented FPS. Music/card clocks can be absent when their engine is absent.";
  return result;
}
export function readAudioAudits(host) {
  const records = [];
  for (const name of ["localStorage", "sessionStorage"])
    try {
      const raw = host[name]?.getItem(AUDIO_AUDIT_KEY);
      if (typeof raw !== "string" || raw.length > AUDIO_AUDIT_MAX_BYTES) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        for (const row of parsed.slice(-2)) {
          const clean = cleanAudioAudit(row);
          if (clean) records.push(clean);
        }
    } catch {
      /* Optional local evidence only. */
    }
  const map = new Map();
  for (const row of records) {
    const key = `${row.bootId ?? ""}:${row.recordedAt}:${row.mode}`;
    const previous = map.get(key);
    if (!previous || (row.updatedAt ?? 0) >= (previous.updatedAt ?? 0)) map.set(key, row);
  }
  return [...map.values()].sort((a, b) => a.recordedAt - b.recordedAt).slice(-2);
}
