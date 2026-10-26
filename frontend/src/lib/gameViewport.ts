// Own the document only for the game route, including its authentication gate.
// Scrollable menus retain native scrolling; dragging their edges cannot pull the page.
export function lockGameViewport(root: HTMLElement) {
  const doc = root.ownerDocument, win = doc.defaultView!;
  const x = win.scrollX, y = win.scrollY;
  const owners = [doc.documentElement, doc.body].map(element => ({ element,
    present: element.classList.contains('game-viewport-locked') }));
  owners.forEach(({ element }) => element.classList.add('game-viewport-locked'));
  let lastY = 0;
  const start = (event: TouchEvent) => { lastY = event.touches[0]?.clientY ?? 0; };
  const move = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    const dy = event.touches[0].clientY - lastY;
    lastY = event.touches[0].clientY;
    const target = event.target instanceof win.Element ? event.target : null;
    if (target?.closest('input[type="range"]')) return;
    // Do no layout work in the steering area. Only menus can scroll.
    if (target?.closest('.game-modal, [data-game-scroll]')) {
      for (let element: Element | null = target; element && element !== root; element = element.parentElement) {
        const overflow = win.getComputedStyle(element).overflowY;
        if (!/^(auto|scroll)$/.test(overflow) || element.scrollHeight <= element.clientHeight) continue;
        if ((dy < 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1)
          || (dy > 0 && element.scrollTop > 0)) return;
      }
    }
    if (event.cancelable) event.preventDefault();
  };
  root.addEventListener('touchstart', start, { passive: true });
  root.addEventListener('touchmove', move, { passive: false });
  return () => {
    root.removeEventListener('touchstart', start);
    root.removeEventListener('touchmove', move);
    owners.forEach(({ element, present }) => { if (!present) element.classList.remove('game-viewport-locked'); });
    win.scrollTo(x, y);
  };
}
