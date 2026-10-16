// Shared allow-list: technical counters only, never arbitrary strings/objects.
export const BACKUP_MAX_BYTES = 48 * 1024;
const phases = ["SECTOR_INTRO", "ENTRY", "FORMATION", "ATTACK_CYCLE", "REFORM", "SECTOR_CLEAR"];
const encounters = ["normal", "boss-intro", "boss-fight", "boss-clear", "bonus"];
const statuses = ["loading", "playing", "paused", "destroying", "game-over", "victory"];
const kinds = [
  "phase-start",
  "phase-complete",
  "status-change",
  "damage-boss-hull",
  "damage-enemy-hull",
  "damage-projectile",
  "pagehide",
  "pageshow",
  "error",
  "rejection",
  "unmount",
  "home-intent",
  "saved-exit-intent",
  "start-back-intent",
  "frame-error",
  "loop-stall",
  "input-error",
  "javascript-error",
  "unhandled-rejection",
  "render-error",
  "boss-defeat-start",
  "boss-defeat-complete",
  "boss-victory-start",
  "boss-final-blast",
  "boss-model-start", "boss-model-ready", "boss-texture-start", "boss-texture-ready", "boss-texture-error", "boss-canvas-first-draw", "boss-canvas-release",
];
const metrics =
  "sector flight enemies attackers returning playerShots enemyShots effects rocks rockEffects pickups clearMs hearts bossHealth liveTurrets atMs fps frameP50Ms frameP95Ms frameMaxMs simulationP95Ms simulationMaxMs frames volleys volleyGapP95Ms capBlocked longTasks longTaskMaxMs sampleDurationMs sceneRequests sceneCommits sceneCommitWaitP95Ms sceneRenderToCommitP95Ms runtimeAgeMs runtimeSampleMs heapBytes animations particles domNodes painted estimatedBytes sources pending jobsStarted jobsFinished queueWaitMaxMs materialTotalMs materialMaxMs encodeTotalMs decodeTotalMs sourceWorkTotalMs sourceWorkMaxMs audioVoices audioBufferBytes knownTimers knownListeners rockPaints rockPaintTotalMs rockPaintMaxMs blockchainRenders durationMs line column bossId bossTextureWidth bossTextureHeight bossCanvasWidth bossCanvasHeight".split(
    " "
  );
const sections = [
  "setup-and-boosts",
  "transitions",
  "spawn-and-attack-selection",
  "enemy-motion-and-fire",
  "boss-motion-and-weapons",
  "hostile-shots-and-damage",
  "powerups-and-rocks",
  "player-shots-and-collisions",
  "phase-save-and-paint",
];
const record = (x: unknown): Record<string, unknown> =>
  x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
function entry(input: unknown, event = false) {
  const x = record(input),
    out: Record<string, unknown> = {};
  for (const k of metrics)
    if (typeof x[k] === "number" && Number.isFinite(x[k]) && Math.abs(x[k] as number) <= 1e15) out[k] = x[k];
  for (const [key, allowed] of [
    ["phase", phases],
    ["encounter", encounters],
    ["status", statuses],
  ] as const)
    if (allowed.includes(x[key] as never)) out[key] = x[key];
  for (const key of ["bossHeartCollected", "longTasksSupported"]) if (typeof x[key] === "boolean") out[key] = x[key];
  if (event) {
    if (!kinds.includes(x.kind as string)) return null;
    out.kind = x.kind;
    if (typeof x.file === "string" && /^[\w.-]{1,120}\.m?js$/.test(x.file)) out.file = x.file;
  } else {
    const work = record(x.work),
      kept: Record<string, unknown> = {};
    for (const key of sections) {
      const item = record(work[key]),
        result: Record<string, number> = {};
      for (const k of ["count", "totalMs", "maxMs"])
        if (typeof item[k] === "number" && Number.isFinite(item[k]) && (item[k] as number) >= 0)
          result[k] = item[k] as number;
      if (Object.keys(result).length) kept[key] = result;
    }
    out.work = kept;
  }
  return out;
}
export function backupTrace(input: unknown) {
  const x = record(input);
  if (x.environment !== "developer-only" || ![1, 2].includes(x.version as number)) return null;
  const samples = (Array.isArray(x.samples) ? x.samples : []).slice(-16).map(e => entry(e)!),
    events = (Array.isArray(x.events) ? x.events : [])
      .slice(-64)
      .map(e => entry(e, true))
      .filter(Boolean);
  if (!samples.length && !events.length) return null;
  const out = {
    version: x.version as number,
    environment: "developer-only",
    persistence: ["localStorage", "sessionStorage", "memory-only", "custom", "not-yet-written"].includes(
      x.persistence as string
    )
      ? x.persistence
      : "memory-only",
    samples,
    events,
  };
  while (new TextEncoder().encode(JSON.stringify(out)).length > BACKUP_MAX_BYTES && out.samples.length)
    out.samples.shift();
  return new TextEncoder().encode(JSON.stringify(out)).length <= BACKUP_MAX_BYTES ? out : null;
}
