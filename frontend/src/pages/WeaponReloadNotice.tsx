import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { weaponNoticeWidth, weaponNoticeTop } from './weaponNoticeLayout';
import './weaponNotices.css';

export default function WeaponReloadNotice({ children, error = false, layoutKey, onVisibleChange }: {
  children: ReactNode; error?: boolean; layoutKey: string; onVisibleChange?: (visible: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const notice = ref.current, field = notice?.closest('.game-field');
    if (!notice || !field) return;
    const labels = Array.from(field.querySelectorAll('.game-hud, .game-label, .flight-indicator, .bonus-counter, .combat-variety-notice, .reinforcement-notice, .sector-banner, .combo-notice, .pickup-notice'));
    const controls = Array.from(field.querySelectorAll('.weapon-control-wrap, .shield-control-wrap, .power-timer, .edge-action-purchased'));
    const place = () => {
      const bounds = field.getBoundingClientRect();
      const width = weaponNoticeWidth(bounds, controls.map(control => control.getBoundingClientRect()));
      const maxWidth = `${width}px`;
      if (notice.style.maxWidth !== maxWidth) notice.style.maxWidth = maxWidth;
      const size = notice.getBoundingClientRect();
      const hudBottom = field.querySelector('.game-hud')?.getBoundingClientRect().bottom ?? bounds.top;
      const top = weaponNoticeTop(bounds, size.width, size.height, hudBottom, labels.map(label => label.getBoundingClientRect()));
      notice.style.visibility = top === null ? 'hidden' : 'visible';
      if (top !== null) notice.style.top = `${top}px`;
      onVisibleChange?.(top !== null);
    };
    place();
    if (typeof ResizeObserver === 'undefined') return () => onVisibleChange?.(false);
    const observer = new ResizeObserver(place);
    observer.observe(field); observer.observe(notice);
    [...labels, ...controls].forEach(label => observer.observe(label));
    return () => { observer.disconnect(); onVisibleChange?.(false); };
  }, [layoutKey, onVisibleChange]);
  return <div ref={ref} className={error ? 'weapon-reload-error' : 'weapon-reloading'} role={error ? 'alert' : 'status'} aria-live={error ? 'assertive' : 'polite'}>{children}</div>;
}
