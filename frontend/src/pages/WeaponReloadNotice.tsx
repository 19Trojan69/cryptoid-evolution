import { useLayoutEffect, useRef, type ReactNode } from 'react';

export default function WeaponReloadNotice({ children, error = false, layoutKey }: {
  children: ReactNode; error?: boolean; layoutKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const notice = ref.current, field = notice?.closest('.game-field');
    if (!notice || !field) return;
    const labels = Array.from(field.querySelectorAll('.game-hud, .game-label, .flight-indicator, .bonus-counter, .combat-variety-notice, .reinforcement-notice, .sector-banner'));
    const place = () => {
      const origin = field.getBoundingClientRect().top;
      let bottom = origin;
      for (const label of labels) {
        const bounds = label.getBoundingClientRect();
        if (bounds.width && bounds.height) bottom = Math.max(bottom, bounds.bottom);
      }
      notice.style.top = `${bottom - origin + 10}px`;
    };
    place();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(place);
    observer.observe(field); labels.forEach(label => observer.observe(label));
    return () => observer.disconnect();
  }, [layoutKey]);
  return <div ref={ref} className={error ? 'weapon-reload-error' : 'weapon-reloading'} role={error ? 'alert' : 'status'} aria-live={error ? 'assertive' : 'polite'}>{children}</div>;
}
