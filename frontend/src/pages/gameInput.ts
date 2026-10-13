import { placePlayer, placePlayerFromPointer, type PlayerPosition } from './playerCombat.ts';
import { controlAreaTop, type ControlZone } from './controlPreferences.ts';

type Ref<T> = { current: T };
export type TouchOrigin = { x: number; y: number; player: PlayerPosition };
type Bounds = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;
type SteeringEvent = Pick<PointerEvent, 'pointerId' | 'pointerType' | 'isPrimary' | 'buttons' | 'clientX' | 'clientY' | 'target' | 'cancelable' | 'preventDefault'>;
type Options = {
  pointer: Ref<number | null>;
  origin: Ref<TouchOrigin | null>;
  playing: () => boolean;
  aboveFinger: () => boolean;
  sensitivity: () => number;
  area: () => ControlZone;
  minimumY?: () => number;
  position: (position: PlayerPosition) => void;
  fault: (error: unknown) => void;
};
const controls = 'button, a, input, select, textarea, [role="button"], .game-hud, .game-overlay, .touch-controls';
const validBounds = (bounds: Bounds) => Number.isFinite(bounds.width) && Number.isFinite(bounds.height) && bounds.width > 0 && bounds.height > 0;
export const canStartSteering = (x: number, y: number, bounds: Bounds, area: ControlZone) => validBounds(bounds) &&
  Number.isFinite(x) && Number.isFinite(y) && x >= bounds.left && x <= bounds.left + bounds.width &&
  y >= bounds.top + bounds.height * controlAreaTop[area] && y <= bounds.top + bounds.height;

// One primary gesture owns steering. Ending anywhere, losing capture or losing
// focus releases it. A fresh primary gesture can replace a missed old release;
// a second finger on the weapons never steals the current gesture.
export function bindGameInput(field: HTMLElement, options: Options) {
  const doc = field.ownerDocument;
  const win = doc.defaultView!;
  const reset = () => {
    const id = options.pointer.current;
    options.pointer.current = null;
    options.origin.current = null;
    if (id !== null) {
      try { if (field.hasPointerCapture?.(id)) field.releasePointerCapture(id); } catch { /* The host already released this gesture. */ }
    }
  };
  const safely = (action: () => void) => {
    try { action(); } catch (error) { reset(); options.fault(error); }
  };
  const move = (event: SteeringEvent) => {
    if (options.pointer.current !== event.pointerId) return;
    if (!options.playing() || (event.pointerType === 'mouse' && event.buttons === 0)) { reset(); return; }
    const bounds = field.getBoundingClientRect();
    if (!validBounds(bounds) || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) { reset(); return; }
    if (event.cancelable) event.preventDefault();
    const origin = event.pointerType === 'touch' ? options.origin.current : null;
    options.position(origin
      ? placePlayer(origin.player.x * bounds.width + (event.clientX - origin.x) * options.sensitivity(), origin.player.y * bounds.height + (event.clientY - origin.y) * options.sensitivity(), bounds.width, bounds.height, options.minimumY?.())
      : placePlayerFromPointer(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height, false, options.minimumY?.()));
  };
  const start = (event: SteeringEvent) => {
    if (!options.playing() || (event.target as Element | null)?.closest?.(controls) ||
        event.isPrimary === false || (event.pointerType === 'mouse' && event.buttons !== 1)) return;
    const bounds = field.getBoundingClientRect();
    if (!canStartSteering(event.clientX, event.clientY, bounds, options.area())) return;
    reset();
    options.pointer.current = event.pointerId;
    options.origin.current = event.pointerType === 'touch' ? {
      x: event.clientX, y: event.clientY,
      player: placePlayerFromPointer(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height, options.aboveFinger(), options.minimumY?.()),
    } : null;
    try { field.setPointerCapture?.(event.pointerId); } catch { /* Global release handlers remain available in embedded browsers. */ }
    move(event);
  };
  const down = (event: PointerEvent) => safely(() => start(event));
  const motion = (event: PointerEvent) => safely(() => move(event));
  const end = (event: PointerEvent) => { if (options.pointer.current === event.pointerId) reset(); };
  const hidden = () => { if (doc.visibilityState === 'hidden') reset(); };
  const allTouchesEnded = (event: TouchEvent) => { if (event.touches.length === 0 && options.origin.current) reset(); };
  const listeners: Array<() => void> = [];
  const on = (target: EventTarget, type: string, listener: EventListener, config?: AddEventListenerOptions | boolean) => {
    target.addEventListener(type, listener, config);
    listeners.push(() => target.removeEventListener(type, listener, config));
  };
  on(field, 'pointerdown', down as EventListener, { passive: false });
  on(field, 'pointermove', motion as EventListener, { passive: false });
  on(win, 'pointerup', end as EventListener, true);
  on(win, 'pointercancel', end as EventListener, true);
  on(field, 'lostpointercapture', end as EventListener);
  on(win, 'blur', reset);
  on(win, 'pagehide', reset);
  on(win, 'resize', reset);
  on(doc, 'fullscreenchange', reset);
  on(doc, 'webkitfullscreenchange', reset);
  on(doc, 'visibilitychange', hidden);
  on(win, 'touchend', allTouchesEnded as EventListener, true);
  on(win, 'touchcancel', allTouchesEnded as EventListener, true);
  // Older embedded WebViews without Pointer Events use the same steering rules.
  if (!('PointerEvent' in win)) {
    const asPointer = (touch: Touch, event: TouchEvent): SteeringEvent => ({
      pointerId: touch.identifier, pointerType: 'touch', isPrimary: true, buttons: 1,
      clientX: touch.clientX, clientY: touch.clientY, target: event.target,
      cancelable: event.cancelable, preventDefault: () => event.preventDefault(),
    });
    on(field, 'touchstart', ((event: TouchEvent) => safely(() => {
      if (event.touches.length === 1 && event.changedTouches[0]) start(asPointer(event.changedTouches[0], event));
    })) as EventListener, { passive: false });
    on(field, 'touchmove', ((event: TouchEvent) => safely(() => {
      const touch = Array.from(event.touches).find(touch => touch.identifier === options.pointer.current);
      if (touch) move(asPointer(touch, event));
    })) as EventListener, { passive: false });
    const touchEnd = (event: TouchEvent) => {
      if (Array.from(event.changedTouches).some(touch => touch.identifier === options.pointer.current)) reset();
    };
    on(win, 'touchend', touchEnd as EventListener, true);
    on(win, 'touchcancel', touchEnd as EventListener, true);
  }
  return { reset, dispose: () => { reset(); listeners.forEach(remove => remove()); } };
}
