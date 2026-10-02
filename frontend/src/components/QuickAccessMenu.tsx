import { useEffect, useRef } from "react";
import { useLocale } from "../i18n";

export type QuickAction = "play" | "hangar" | "shop" | "upgrades" | "colors" | "weapons" | "armor" | "powers" | "progress" | "rewards" | "leaders" | "ranks" | "bosses" | "medals" | "chains" | "language" | "controls" | "audio" | "display" | "vibration" | "overview" | "visuals" | "guide-controls" | "route" | "combat" | "boosts" | "earnings" | "collection" | "signin" | "signout" | "admin" | "exit-admin" | "privacy" | "terms";
type Entry = readonly [QuickAction, string];
const groups: readonly { id: string; title: string; glyph: string; items: readonly Entry[] }[] = [
  { id: "mission", title: "Game & mission", glyph: "▷", items: [["play", "Play"], ["overview", "Game description"], ["guide-controls", "Move and fire"], ["route", "Level path"], ["combat", "Combat & hearts"]] },
  { id: "fleet", title: "Shop & hangar", glyph: "◇", items: [["hangar", "Your fleet"], ["shop", "Ship shop"], ["upgrades", "Ship evolution"], ["colors", "Metallic colors"], ["weapons", "Weapons"], ["armor", "Permanent armor"], ["powers", "Power-ups"]] },
  { id: "career", title: "Career & rewards", glyph: "✧", items: [["progress", "Progress"], ["leaders", "Top 100"], ["rewards", "Rewards"], ["ranks", "Service ranks"], ["bosses", "Boss stickers"], ["medals", "Bonus medals"], ["chains", "Chain milestones"]] },
  { id: "settings", title: "Settings", glyph: "⚙", items: [["language", "Language"], ["controls", "Controls"], ["audio", "Music & sound"], ["display", "Display & effects"], ["vibration", "Vibration"]] },
  { id: "info", title: "Game information", glyph: "?", items: [["visuals", "Illustrated guide"], ["boosts", "Weapons & boosts"], ["earnings", "Shards & combos"], ["collection", "Collection & ranks"]] },
  { id: "account", title: "Account & legal", glyph: "◎", items: [["signin", "Connect Pi"], ["signout", "Sign out"], ["admin", "Admin center"], ["exit-admin", "End test mode"], ["privacy", "Privacy policy"], ["terms", "Terms of service"]] },
];

type Props = { onClose: () => void; onAction: (action: QuickAction) => void; signedIn: boolean; canAdmin: boolean; adminMode?: boolean; username?: string; initialGroup?: string; busy?: boolean };
export default function QuickAccessMenu({ onClose, onAction, signedIn, canAdmin, adminMode, username, initialGroup = "mission", busy }: Props) {
  const { t } = useLocale();
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLButtonElement>(".close-button")?.focus();
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const elements = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), summary, a[href]') ?? []).filter(element => element.getClientRects().length > 0 && (element.tagName === "SUMMARY" || !element.closest("details:not([open])")));
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keyDown);
    return () => { document.body.style.overflow = originalOverflow; document.removeEventListener("keydown", keyDown); previous?.focus(); };
  }, [onClose]);
  return <div className="quick-access-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panelRef} id="quick-access-menu" className="quick-access-panel" role="dialog" aria-modal="true" aria-labelledby="quick-access-title">
      <header className="quick-access-heading"><div><p className="eyebrow">CRYPTOID EVOLUTION</p><h2 id="quick-access-title">{t("Quick access")}</h2></div><button className="close-button" type="button" aria-label={t("Close menu")} onClick={onClose}>×</button></header>
      {username && <p className="quick-access-account">@{username}</p>}
      <nav aria-label={t("Game navigation")}>
        {groups.map(group => <details key={group.id} className="quick-access-category" open={group.id === initialGroup}>
          <summary><span aria-hidden="true">{group.glyph}</span><strong>{t(group.title)}</strong><i aria-hidden="true">⌄</i></summary>
          <div className="quick-access-items">{group.items.filter(([action]) => action === "signin" ? !signedIn : action === "signout" ? signedIn : action === "admin" ? canAdmin : action === "exit-admin" ? canAdmin && adminMode : true).map(([action, label]) => <button key={action} type="button" disabled={busy && (action === "signin" || action === "signout" || action === "exit-admin")} onClick={() => onAction(action)}><span>{t(label)}</span><i aria-hidden="true">›</i></button>)}</div>
        </details>)}
      </nav>
    </section>
  </div>;
}
