import { placePlayer, placePlayerFromPointer, type PlayerPosition } from './playerCombat.ts';
import { controlAreaTop, type ControlZone } from './controlPreferences.ts';
import { createInputDiagnostics } from './inputDiagnostics.ts';
import { sessionDiagnostic, sessionDiagnosticsActive } from '../lib/sessionDiagnosticEvents.ts';
import { createSingleFingerControls } from './singleFingerControls.ts';
import { observeContactDiagnostics } from './contactDiagnostics.ts';

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
// controls require a separate single-finger tap after steering has ended.
export function bindGameInput(field: HTMLElement, options: Options) {
  const doc = field.ownerDocument;
  const win = doc.defaultView!;
  const stopContacts = observeContactDiagnostics(field, { active: sessionDiagnosticsActive,
    playing: options.playing, steering: () => options.pointer.current !== null,
    emit: data => sessionDiagnostic('input', data) });
  const evidence = createInputDiagnostics(sessionDiagnosticsActive, data => sessionDiagnostic('input', data));
  const controlTap = createSingleFingerControls(options.playing, () => options.pointer.current !== null);
  const reset = (reason: Parameters<typeof evidence.end>[0] = 'reset') => {
    const id = options.pointer.current;
    options.pointer.current = null;
    options.origin.current = null;
    controlTap.clear();
    evidence.end(reason);
    if (id !== null) {
      try { if (field.hasPointerCapture?.(id)) field.releasePointerCapture(id); } catch { /* The host already released this gesture. */ }
    }
  };
  const safely = (action: () => void) => {
    try { action(); } catch (error) { reset('fault'); options.fault(error); }
  };
  const move = (event: SteeringEvent) => {
    if (options.pointer.current !== event.pointerId) return;
    if (!options.playing() || (event.pointerType === 'mouse' && event.buttons === 0)) { reset('not-playing'); return; }
    const bounds = field.getBoundingClientRect();
    if (!validBounds(bounds) || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) { reset('geometry'); return; }
    if (event.cancelable) event.preventDefault();
    evidence.move(event);
    const origin = event.pointerType === 'touch' ? options.origin.current : null;
    options.position(origin
      ? placePlayer(origin.player.x * bounds.width + (event.clientX - origin.x) * options.sensitivity(), origin.player.y * bounds.height + (event.clientY - origin.y) * options.sensitivity(), bounds.width, bounds.height)
      : placePlayerFromPointer(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height, false));
  };
  const start = (event: SteeringEvent) => {
    if (!options.playing() || (event.target as Element | null)?.closest?.(controls) ||
        event.isPrimary === false || (event.pointerType === 'mouse' && event.buttons !== 1)) return;
    const bounds = field.getBoundingClientRect();
    if (!canStartSteering(event.clientX, event.clientY, bounds, options.area())) return;
    reset('replaced');
    options.pointer.current = event.pointerId;
    options.origin.current = event.pointerType === 'touch' ? {
      x: event.clientX, y: event.clientY,
      player: placePlayerFromPointer(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height, options.aboveFinger()),
    } : null;
    evidence.start(event, bounds);
    try { field.setPointerCapture?.(event.pointerId); } catch { /* Global release handlers remain available in embedded browsers. */ }
    move(event);
  };
  const down = (event: PointerEvent) => safely(() => { controlTap.down(event); start(event); });
  const motion = (event: PointerEvent) => safely(() => { controlTap.move(event); move(event); });
  const end = (event: PointerEvent) => {
    if (event.type === 'pointerup') controlTap.up(event);
    else controlTap.cancel(event.pointerId, event.type === 'lostpointercapture');
    if (options.pointer.current === event.pointerId)
      reset(event.type === 'pointercancel' ? 'cancelled' : event.type === 'lostpointercapture' ? 'capture-lost' : 'released');
  };
  const click = (event: MouseEvent) => {
    if (!controlTap.click(event)) { event.preventDefault(); event.stopImmediatePropagation(); }
  };
  const hidden = () => { if (doc.visibilityState === 'hidden') reset('hidden'); };
  const allTouchesEnded = (event: TouchEvent) => {
    if (event.type === 'touchcancel') controlTap.clear();
    if (event.touches.length === 0 && options.origin.current)
      reset(event.type === 'touchcancel' ? 'touch-cancelled' : 'touch-ended');
  };
  const listeners: Array<() => void> = [];
  const on = (target: EventTarget, type: string, listener: EventListener, config?: AddEventListenerOptions | boolean) => {
    target.addEventListener(type, listener, config);
    listeners.push(() => target.removeEventListener(type, listener, config));
  };
  on(field, 'pointerdown', down as EventListener, { passive: false, capture: true });
  on(field, 'pointermove', motion as EventListener, { passive: false, capture: true });
  on(field, 'click', click as EventListener, true);
  on(win, 'pointerup', end as EventListener, true);
  on(win, 'pointercancel', end as EventListener, true);
  on(field, 'lostpointercapture', end as EventListener);
  on(win, 'blur', () => reset('blur'));
  on(win, 'pagehide', () => reset('pagehide'));
  on(win, 'resize', () => reset('resize'));
  on(doc, 'fullscreenchange', () => reset('fullscreen'));
  on(doc, 'webkitfullscreenchange', () => reset('fullscreen'));
  on(doc, 'visibilitychange', hidden);
  on(win, 'touchend', allTouchesEnded as EventListener, true);
  on(win, 'touchcancel', allTouchesEnded as EventListener, true);
  // Older embedded WebViews without Pointer Events use the same steering rules.
  if (!('PointerEvent' in win)) {
    let lastTouch = -Infinity;
    const asPointer = (touch: Touch, event: TouchEvent): SteeringEvent => ({
      pointerId: touch.identifier, pointerType: 'touch', isPrimary: true, buttons: 1,
      clientX: touch.clientX, clientY: touch.clientY, target: event.target,
      cancelable: event.cancelable, preventDefault: () => event.preventDefault(),
    });
    on(field, 'touchstart', ((event: TouchEvent) => safely(() => {
      lastTouch = performance.now();
      controlTap.clear();
      if (event.touches.length === 1 && event.changedTouches[0]) {
        const pointer = asPointer(event.changedTouches[0], event);
        controlTap.down(pointer); start(pointer);
      }
    })) as EventListener, { passive: false });
    on(field, 'touchmove', ((event: TouchEvent) => safely(() => {
      lastTouch = performance.now();
      if (event.touches.length > 1) controlTap.clear();
      const buttonTouch = Array.from(event.touches).find(touch => touch.identifier === controlTap.pointerId());
      if (buttonTouch) controlTap.move(asPointer(buttonTouch, event));
      const touch = Array.from(event.touches).find(touch => touch.identifier === options.pointer.current);
      if (touch) move(asPointer(touch, event));
    })) as EventListener, { passive: false });
    const touchEnd = (event: TouchEvent) => {
      lastTouch = performance.now();
      for (const touch of Array.from(event.changedTouches)) {
        if (event.type === 'touchcancel') controlTap.cancel(touch.identifier);
        else controlTap.up(asPointer(touch, event));
      }
      if (Array.from(event.changedTouches).some(touch => touch.identifier === options.pointer.current))
        reset(event.type === 'touchcancel' ? 'touch-cancelled' : 'touch-ended');
    };
    on(win, 'touchend', touchEnd as EventListener, true);
    on(win, 'touchcancel', touchEnd as EventListener, true);
    const mouse = (event: MouseEvent) => ({ pointerId: -1, pointerType: 'mouse', isPrimary: true,
      buttons: event.buttons, clientX: event.clientX, clientY: event.clientY, target: event.target });
    // Ignore compatibility mouse events following touch without adding a timer.
    on(field, 'mousedown', ((event: MouseEvent) => {
      if (performance.now() - lastTouch > 1500) controlTap.down(mouse(event));
    }) as EventListener, true);
    on(field, 'mousemove', ((event: MouseEvent) => {
      if (performance.now() - lastTouch > 1500) controlTap.move(mouse(event));
    }) as EventListener, true);
    on(win, 'mouseup', ((event: MouseEvent) => {
      if (performance.now() - lastTouch > 1500) controlTap.up(mouse(event));
    }) as EventListener, true);
  }
  return { reset: () => reset(), dispose: () => { stopContacts(); reset('disposed'); listeners.forEach(remove => remove()); } };
}
