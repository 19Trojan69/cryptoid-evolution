import type { BattleInput } from '../core/battle.ts';
import type { Field } from '../core/enemies.ts';

/** One active pointer, one listener scope. No RAF, timers or window-wide drag. */
export function createBattleInput(surface: HTMLElement, field: Field) {
  const lifetime = new AbortController(), keys = new Set<string>();
  let pointerId: number | null = null, pointer: BattleInput['pointer'], closed = false;
  const options = { signal: lifetime.signal };
  const place = (event: PointerEvent) => {
    const bounds = surface.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;
    pointer = { x: (event.clientX - bounds.left) / bounds.width * field.width,
      y: (event.clientY - bounds.top) / bounds.height * field.height, touch: event.pointerType !== 'mouse' };
  };
  surface.addEventListener('pointerdown', event => {
    if (pointerId !== null || event.button !== 0) return;
    pointerId = event.pointerId; surface.setPointerCapture(pointerId); place(event); surface.focus({ preventScroll: true });
  }, options);
  surface.addEventListener('pointermove', event => { if (event.pointerId === pointerId) place(event); }, options);
  const release = (event: PointerEvent) => { if (event.pointerId === pointerId) { pointerId = null; pointer = undefined; } };
  surface.addEventListener('pointerup', release, options); surface.addEventListener('pointercancel', release, options);
  surface.addEventListener('lostpointercapture', release, options);
  const movementKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's'];
  surface.addEventListener('keydown', event => { if (movementKeys.includes(event.key)) { event.preventDefault(); keys.add(event.key); } }, options);
  surface.addEventListener('keyup', event => { keys.delete(event.key); }, options);
  const clear = () => {
    keys.clear(); pointer = undefined;
    if (pointerId !== null && surface.hasPointerCapture(pointerId)) surface.releasePointerCapture(pointerId);
    pointerId = null;
  };
  surface.addEventListener('blur', clear, options);
  return { read: (): BattleInput => ({ horizontal: Number(keys.has('ArrowRight') || keys.has('d')) - Number(keys.has('ArrowLeft') || keys.has('a')),
    vertical: Number(keys.has('ArrowDown') || keys.has('s')) - Number(keys.has('ArrowUp') || keys.has('w')), pointer: pointer ? { ...pointer } : undefined }),
    clear, dispose: () => { if (closed) return; closed = true; clear(); lifetime.abort(); } };
}
