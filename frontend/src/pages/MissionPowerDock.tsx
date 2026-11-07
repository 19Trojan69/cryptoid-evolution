import { memo, useRef } from "react";
import { useLocale } from "../i18n";
import type { MissionPower, MissionPowerInventory } from "../../../backend/src/missionPower";
import { powerUpNames, powerUpSymbols } from "./powerUps";
import type { ControlHand } from "./controlPreferences";

const slots = ["shield", "overdrive", "rapid", "bomb", "emp"] as const;
type Props = {
  hand: ControlHand;
  inventory?: MissionPowerInventory;
  queued: MissionPower | null;
  attempt?: { power: MissionPower; waiting: boolean };
  enabled: boolean;
  weaponsUseful: boolean;
  bombUseful: boolean;
  shield: number;
  overdrive: number;
  rapid: number;
  emp: number;
  onUse: (power: MissionPower) => void;
};

function Shortcut({ power, count, seconds, busy, retry, disabled, onUse, t }: {
  power: MissionPower; count: number; seconds: number; busy: boolean; retry: boolean;
  disabled: boolean; onUse: Props["onUse"];
  t: ReturnType<typeof useLocale>["t"];
}) {
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const tap = useRef(false);
  const title = t(powerUpNames[power]);
  const action = seconds ? `${t("Remaining time")} ${seconds} s`
    : busy ? t("Loading…") : disabled ? t("Locked") : retry ? t("Retry") : t("Tap to activate");
  return <button type="button" className={`mission-power-shortcut edge-action-${power}`} data-power={power}
    data-active={seconds > 0} aria-disabled={disabled || undefined} aria-busy={busy || undefined}
    aria-label={`${title} · ${t("Charges")} ${count} · ${action}`} title={title}
    onPointerDown={event => {
      tap.current = false;
      pointer.current = event.isPrimary && event.button === 0 && !disabled
        ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
    }}
    onPointerMove={event => {
      const start = pointer.current;
      if (start?.id === event.pointerId && Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 12) {
        pointer.current = null;
      }
    }}
    onPointerCancel={() => { pointer.current = null; tap.current = false; }}
    onPointerUp={event => {
      const start = pointer.current;
      if (!start || start.id !== event.pointerId) return;
      pointer.current = null;
      const bounds = event.currentTarget.getBoundingClientRect();
      tap.current = Math.hypot(event.clientX - start.x, event.clientY - start.y) < 12
        && event.clientX >= bounds.left && event.clientX <= bounds.right
        && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    }}
    onClick={event => {
      const deliberate = event.detail === 0 || tap.current || !("PointerEvent" in window);
      tap.current = false;
      if (deliberate && !disabled) onUse(power);
    }}>
    <span className="mission-power-symbol" aria-hidden="true">{powerUpSymbols[power]}</span>
    {count > 0 && <small className="mission-power-count" aria-hidden="true">{count}</small>}
    {seconds > 0 ? <small aria-hidden="true">{seconds}s</small> : (busy || retry) && <small aria-hidden="true">{busy ? "…" : "↻"}</small>}
  </button>;
}

export default memo(function MissionPowerDock({ hand, inventory, queued, attempt, enabled, weaponsUseful, bombUseful, shield, overdrive, rapid, emp, onUse }: Props) {
  const { t } = useLocale();
  const remaining = { shield, overdrive, rapid, emp, bomb: 0 };
  const buttons = slots.map(power => {
    const reserved = inventory?.pending?.power === power;
    const legacy = queued === power;
    const count = (inventory?.stock[power] ?? 0) + Number(reserved) + Number(legacy);
    const seconds = remaining[power];
    const waiting = attempt?.power === power && attempt.waiting;
    const retry = attempt?.power === power && !attempt.waiting;
    if (count === 0 && seconds === 0 && !waiting && !retry) return null;
    const spent = (power === "bomb" || power === "emp") && inventory?.used.includes(power);
    const useful = power === "bomb" ? bombUseful : power === "emp" ? weaponsUseful : true;
    const disabled = !enabled || !useful || seconds > 0 || waiting || (count === 0 && !retry)
      || (!legacy && !reserved && (spent || !!inventory?.pending || !!attempt && attempt.power !== power));
    return <Shortcut key={power} power={power} count={count} seconds={seconds}
      busy={waiting} retry={retry} disabled={disabled} onUse={onUse} t={t} />;
  });
  if (!buttons.some(Boolean)) return null;
  return <div className={`mission-power-dock mission-power-dock-${hand}`} role="group" aria-label={t("Power-ups")}>{buttons}</div>;
});
