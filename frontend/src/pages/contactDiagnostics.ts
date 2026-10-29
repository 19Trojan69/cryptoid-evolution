// Preview evidence only. Window capture runs before React's root capture/audio
// callback. Observation never cancels an event or changes the input controller.
export const CONTACT_EVENTS = ['pointerdown', 'pointerup', 'pointercancel', 'lostpointercapture',
  'touchstart', 'touchend', 'touchcancel', 'gesturestart', 'gestureend', 'contextmenu', 'click',
  'blur', 'pagehide', 'hidden'] as const;
export const CONTACT_TARGETS = ['field', 'weapons', 'pause', 'home', 'menu', 'other-control', 'outside'] as const;
export const CONTACT_LIMITS = { pointers: 10, ordinaryPerSecond: 16, criticalPerSecond: 8 } as const;
const critical = new Set(['pointercancel', 'touchcancel', 'gesturestart', 'gestureend', 'blur', 'pagehide', 'hidden']);
type Details = Record<string, unknown>;
type Options = { active: () => boolean; playing: () => boolean; steering: () => boolean;
  emit: (details: Details) => void; now?: () => number };

export function observeContactDiagnostics(field: HTMLElement, options: Options) {
  const doc = field.ownerDocument, win = doc?.defaultView;
  if (!win?.addEventListener || !win.removeEventListener) return () => {};
  // IDs only deduplicate live pointers; at most ten are retained and none leave
  // this closure. No coordinates, contact geometry, pressure or text are read.
  const pointers = new Set<number>();
  let touchesLive = false, truncated = false, windowAt = -Infinity;
  let ordinaryCount = 0, criticalCount = 0, suppressed = 0, stopped = false;
  const clear = () => { pointers.clear(); touchesLive = false; truncated = false; };
  const targetOf = (target: EventTarget | null) => {
    if (!target || !field.contains(target as Node)) return 'outside';
    const element = target as Element;
    if (element.closest?.('.mission-shop-access')) return 'weapons';
    if (element.closest?.('.pause-control')) return 'pause';
    if (element.closest?.('.home-control')) return 'home';
    if (element.closest?.('.game-overlay, .game-modal')) return 'menu';
    return element.closest?.('button, a, input, select, textarea, [role="button"]') ? 'other-control' : 'field';
  };
  const on: EventListener = event => {
    try {
      if (stopped) return;
      if (!options.active()) { clear(); windowAt = -Infinity; ordinaryCount = criticalCount = suppressed = 0; return; }
      let type = event.type;
      if (type === 'visibilitychange') {
        if (doc.visibilityState !== 'hidden') return;
        type = 'hidden';
      }
      const lifecycle = type === 'blur' || type === 'pagehide' || type === 'hidden';
      const target = lifecycle ? 'outside' : targetOf(event.target);
      const pointer = event as PointerEvent;
      const id = type.startsWith('pointer') || type === 'lostpointercapture' ? pointer.pointerId : undefined;
      if (!lifecycle && target === 'outside' && !pointers.size && !touchesLive && !truncated) return;
      if (type === 'click' && (target === 'field' || target === 'outside')) return;
      if (type === 'pointerdown' && Number.isSafeInteger(id)) {
        if (pointers.size < CONTACT_LIMITS.pointers) pointers.add(id!);
        else if (!pointers.has(id!)) truncated = true;
      } else if (type === 'pointerup' || type === 'pointercancel') pointers.delete(id!);
      // Losing capture does not itself prove that physical contact ended.
      let reportedTouches: number | undefined;
      if (type.startsWith('touch')) {
        const count = (event as TouchEvent).touches.length;
        if (Number.isSafeInteger(count) && count >= 0) {
          reportedTouches = Math.min(CONTACT_LIMITS.pointers, count);
          touchesLive = count > 0;
          if (count > CONTACT_LIMITS.pointers) truncated = true;
          if (!count) pointers.clear();
        }
      }
      const data: Details = { operation: 'contact-state', event: type, target,
        trackedPointers: pointers.size, truncated, playing: options.playing(),
        steeringActive: options.steering(), cancelable: event.cancelable };
      if (reportedTouches !== undefined) data.reportedTouches = reportedTouches;
      if (type.startsWith('touch') || type.startsWith('gesture')) data.inputSource = 'touch';
      else if (['pointerdown', 'pointerup', 'pointercancel', 'lostpointercapture', 'click', 'contextmenu'].includes(type)) {
        data.inputSource = ['touch', 'mouse', 'pen'].includes(pointer.pointerType) ? pointer.pointerType : 'other';
        if (typeof pointer.isPrimary === 'boolean') data.primaryFlag = pointer.isPrimary;
      }
      if (lifecycle || reportedTouches === 0) clear();
      const at = options.now ? options.now() : performance.now();
      if (!Number.isFinite(at)) return;
      if (at < windowAt || at - windowAt >= 1000) { windowAt = at; ordinaryCount = criticalCount = 0; }
      const important = critical.has(type);
      if (important ? criticalCount >= CONTACT_LIMITS.criticalPerSecond : ordinaryCount >= CONTACT_LIMITS.ordinaryPerSecond) {
        suppressed = Math.min(60_000, suppressed + 1); return;
      }
      if (important) criticalCount++; else ordinaryCount++;
      try { options.emit({ ...data, suppressed }); suppressed = 0; } catch { /* Evidence may fail independently. */ }
    } catch { clear(); /* Missing host/event/state evidence must never interrupt input. */ }
  };
  const installed: Array<() => void> = [];
  const stop = () => {
    stopped = true; clear();
    for (const remove of installed.splice(0)) { try { remove(); } catch { /* Host retired. */ } }
  };
  const add = (host: EventTarget, type: string) => {
    const config = { capture: true, passive: true };
    host.addEventListener(type, on, config);
    installed.push(() => host.removeEventListener(type, on, config));
  };
  try {
    for (const type of CONTACT_EVENTS) if (type !== 'hidden') add(win, type);
    add(doc, 'visibilitychange');
  } catch { stop(); }
  return stop;
}
