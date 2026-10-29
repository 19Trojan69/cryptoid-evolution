type Contact = Pick<PointerEvent, 'pointerId' | 'pointerType' | 'isPrimary' | 'buttons' | 'clientX' | 'clientY' | 'target'>;
type Click = Pick<MouseEvent, 'detail' | 'target'> & Partial<Pick<PointerEvent, 'pointerId' | 'pointerType' | 'isPrimary'>>;
const selector = 'button, a, input, select, textarea, [role="button"]';
const control = (target: EventTarget | null) => (target as Element | null)?.closest?.(selector) ?? null;

// A playing control needs its own fresh, primary tap after steering has ended.
// Crossing it during a drag or touching it with another finger cannot activate it.
// Paused menus keep their normal scrolling and keyboard/assistive activation.
export function createSingleFingerControls(playing: () => boolean, steering: () => boolean) {
  let tap: { id: number; target: Element; x: number; y: number; released: boolean } | null = null;
  const move = (event: Contact) => {
    if (tap?.id === event.pointerId && (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY) ||
      Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 12)) tap = null;
  };
  return {
    clear() { tap = null; },
    pointerId: () => tap?.id,
    down(event: Contact) {
      tap = null;
      if (!playing() || steering() || event.isPrimary === false ||
        event.pointerType === 'mouse' && event.buttons !== 1 ||
        !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
      const target = control(event.target);
      if (target) tap = { id: event.pointerId, target, x: event.clientX, y: event.clientY, released: false };
    },
    move,
    up(event: Contact) {
      move(event);
      if (tap?.id === event.pointerId) tap.released = true;
    },
    cancel(id: number, captureLost = false) {
      // Implicit capture normally ends between pointerup and click.
      if (tap?.id === id && !(captureLost && tap.released)) tap = null;
    },
    click(event: Click) {
      const target = control(event.target);
      if (!target || !playing()) return true;
      if (event.detail === 0 && !event.pointerType) return true;
      const current = tap;
      tap = null;
      return Boolean(current?.released && current.target === target && event.isPrimary !== false &&
        (event.pointerId === undefined || event.pointerType === undefined || event.pointerId === current.id));
    },
  };
}
