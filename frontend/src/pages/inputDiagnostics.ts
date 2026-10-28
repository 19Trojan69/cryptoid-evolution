// Coarse owner-only evidence. Coordinates exist only in the live accumulator;
// they are never emitted, stored or sent. Existing input callbacks drive it.
export const INPUT_OPERATIONS = ['gesture-start', 'gesture-motion', 'gesture-end', 'navigation'] as const;
const reasons = ['released', 'cancelled', 'capture-lost', 'blur', 'pagehide', 'resize', 'fullscreen',
  'hidden', 'touch-ended', 'touch-cancelled', 'replaced', 'not-playing', 'geometry', 'fault', 'disposed', 'reset'] as const;
type Contact = { clientX: number; clientY: number; pointerType: string };
type Bounds = { left: number; top: number; width: number; height: number };
type Details = Record<string, unknown>;
export function cleanInputDiagnostic(input: unknown): Details | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const value = input as Details;
  if (!INPUT_OPERATIONS.includes(value.operation as typeof INPUT_OPERATIONS[number])) return null;
  const result: Details = { operation: value.operation };
  const enums = value.operation === 'navigation'
    ? { navigation: ['popstate', 'hashchange'] }
    : { inputSource: ['touch', 'mouse', 'pen', 'other'], startRegion: ['left', 'right', 'top', 'bottom', 'interior'],
      direction: ['left', 'right', 'up', 'down', 'still'], distanceBand: ['short', 'medium', 'long'],
      speedBand: ['slow', 'medium', 'fast'], endReason: reasons };
  for (const [key, allowed] of Object.entries(enums))
    if (allowed?.includes(String(value[key]))) result[key] = value[key];
  for (const key of ['durationBucketMs', 'motionEvents', 'suppressed']) {
    const n = value[key];
    if (Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= 60_000) result[key] = n;
  }
  return result;
}

export function createInputDiagnostics(active: () => boolean, emit: (details: Details) => void,
  now: () => number = () => performance.now()) {
  let contact: { x: number; y: number; at: number; lastX: number; lastY: number; lastAt: number;
    dx: number; dy: number; distance: number; speed: number; motions: number; source: string; region: string } | null = null;
  let windowAt = -Infinity, windowCount = 0, lastMotion = -Infinity, suppressed = 0;
  const enabled = () => { try { return active(); } catch { return false; } };
  const send = (data: Details, at: number) => {
    if (!Number.isFinite(at)) return;
    if (at < windowAt || at - windowAt >= 1000) { windowAt = at; windowCount = 0; }
    if (windowCount >= 8) { suppressed = Math.min(60_000, suppressed + 1); return; }
    windowCount++;
    try { emit({ ...data, suppressed }); suppressed = 0; } catch { /* Evidence must not affect steering. */ }
  };
  const details = (operation: string, at: number, reason?: string): Details => {
    const c = contact!;
    const direction = Math.max(Math.abs(c.dx), Math.abs(c.dy)) < 8 ? 'still'
      : Math.abs(c.dx) >= Math.abs(c.dy) ? c.dx < 0 ? 'left' : 'right' : c.dy < 0 ? 'up' : 'down';
    return { operation, inputSource: c.source, startRegion: c.region, direction,
      distanceBand: c.distance < 32 ? 'short' : c.distance < 160 ? 'medium' : 'long',
      speedBand: c.speed < 300 ? 'slow' : c.speed < 1000 ? 'medium' : 'fast',
      durationBucketMs: Math.min(60_000, Math.floor(Math.max(0, at - c.at) / 100) * 100),
      motionEvents: Math.min(60_000, c.motions), ...(reason ? { endReason: reason } : {}) };
  };
  return {
    start(event: Contact, bounds: Bounds) {
      contact = null;
      if (!enabled()) return;
      const at = now();
      if (![event.clientX, event.clientY, bounds.left, bounds.top, bounds.width, bounds.height, at].every(Number.isFinite)) return;
      contact = { x: event.clientX, y: event.clientY, at, lastX: event.clientX, lastY: event.clientY, lastAt: at,
        dx: 0, dy: 0, distance: 0, speed: 0, motions: 0,
        source: ['touch', 'mouse', 'pen'].includes(event.pointerType) ? event.pointerType : 'other',
        region: event.clientX - bounds.left <= 24 ? 'left' : bounds.left + bounds.width - event.clientX <= 24 ? 'right'
          : event.clientY - bounds.top <= 24 ? 'top' : bounds.top + bounds.height - event.clientY <= 24 ? 'bottom' : 'interior' };
      lastMotion = at;
      send(details('gesture-start', at), at);
    },
    move(event: Contact) {
      if (!enabled()) { contact = null; return; }
      const c = contact;
      if (!c || ![event.clientX, event.clientY].every(Number.isFinite)) return;
      const at = now();
      const travel = Math.hypot(event.clientX - c.lastX, event.clientY - c.lastY);
      c.dx = event.clientX - c.x; c.dy = event.clientY - c.y;
      c.distance += travel; c.speed = Math.max(c.speed, travel * 1000 / Math.max(1, at - c.lastAt));
      c.lastX = event.clientX; c.lastY = event.clientY; c.lastAt = at; c.motions++;
      if (at - lastMotion >= 250) { lastMotion = at; send(details('gesture-motion', at), at); }
    },
    end(reason: typeof reasons[number] = 'reset') {
      if (contact && enabled()) { const at = now(); send(details('gesture-end', at, reason), at); }
      contact = null;
    },
  };
}

// Registered only by a verified recorder; released on finish/revocation/failure.
export function observeInputNavigation(host: { addEventListener?: (type: string, listener: EventListener) => void;
  removeEventListener?: (type: string, listener: EventListener) => void }, emit: (details: Details) => void) {
  if (!host.addEventListener || !host.removeEventListener) return () => {};
  let last = -Infinity;
  const on = (event: Event) => {
    const at = performance.now();
    if (at - last < 250) return;
    last = at;
    emit({ operation: 'navigation', navigation: event.type });
  };
  const installed: string[] = [];
  const stop = () => { for (const type of installed) { try { host.removeEventListener!(type, on); } catch { /* Host unavailable. */ } } };
  try { for (const type of ['popstate', 'hashchange']) { host.addEventListener(type, on); installed.push(type); } }
  catch { stop(); }
  return stop;
}
