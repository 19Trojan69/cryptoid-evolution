import { useEffect, useRef, useState } from "react";
import { useLocale } from "../i18n";
import BlockchainIcon from "./BlockchainIcon";

export type QuickAction = "galaxy" | "profile" | "feedback" | "play" | "hangar" | "shop" | "upgrades" | "colors" | "weapons" | "armor" | "powers" | "progress" | "rewards" | "leaders" | "ranks" | "bosses" | "medals" | "chains" | "language" | "controls" | "audio" | "display" | "vibration" | "overview" | "visuals" | "guide-controls" | "route" | "combat" | "boosts" | "earnings" | "collection" | "signin" | "signout" | "admin" | "exit-admin" | "privacy" | "terms";
type Entry = readonly [QuickAction, string];
const groups: readonly { id: string; title: string; glyph: string; items: readonly Entry[] }[] = [
  { id: "mission", title: "Game & mission", glyph: "▷", items: [["play", "Play"], ["galaxy", "Galaxy map"], ["overview", "Illustrated guide"], ["feedback", "Community & Feedback"]] },
  { id: "fleet", title: "Shop & hangar", glyph: "◇", items: [["hangar", "Your fleet"], ["shop", "Ship shop"], ["weapons", "Weapons"], ["powers", "Power-ups"]] },
  { id: "career", title: "Career & rewards", glyph: "✧", items: [["profile", "My pilot profile"], ["progress", "Progress"], ["leaders", "Top 100"], ["rewards", "Rewards"]] },
  { id: "settings", title: "Settings", glyph: "⚙", items: [["language", "Language"], ["controls", "Controls"], ["audio", "Music & sound"], ["display", "Display & effects"]] },
  { id: "account", title: "Account & legal", glyph: "◎", items: [["signin", "Connect Pi"], ["signout", "Sign out"], ["admin", "Admin center"], ["exit-admin", "End test mode"], ["privacy", "Privacy policy"], ["terms", "Terms of service"]] },
];

type Props = { onClose: () => void; onAction: (action: QuickAction) => void; signedIn: boolean; canAdmin: boolean; adminMode?: boolean; username?: string; busy?: boolean };
export default function QuickAccessMenu({ onClose, onAction, signedIn, canAdmin, adminMode, username, busy }: Props) {
  const { t } = useLocale();
  const [openCategory, setOpenCategory] = useState<string | null>(() => {
    try { const saved = sessionStorage.getItem("cryptoid_quick_category"); return groups.some(group => group.id === saved) ? saved : null; }
    catch { return null; }
  });
  const toggleCategory = (id: string) => setOpenCategory(current => {
    const next = current === id ? null : id;
    try { if (next) sessionStorage.setItem("cryptoid_quick_category", next); else sessionStorage.removeItem("cryptoid_quick_category"); } catch { /* Navigation remains available without storage. */ }
    return next;
  });
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLButtonElement>(".close-button")?.focus({ preventScroll: true });
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const elements = Array.from(panel?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') ?? []).filter(element => element.getClientRects().length > 0 && !element.closest("[hidden]"));
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", keyDown);
      const active = document.activeElement;
      if (active === document.body || panel?.contains(active)) {
        const target = previous?.isConnected && previous !== document.body ? previous : document.querySelector<HTMLButtonElement>(".quick-access-trigger");
        target?.focus({ preventScroll: true });
      }
    };
  }, [onClose]);
  return <div className="quick-access-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panelRef} id="quick-access-menu" className="quick-access-panel" role="dialog" aria-modal="true" aria-labelledby="quick-access-title">
      <header className="quick-access-heading"><div><p className="eyebrow">CRYPTOID EVOLUTION</p><h2 id="quick-access-title">{t("Quick access")}</h2></div><button className="close-button" type="button" aria-label={t("Close menu")} onClick={onClose}>×</button></header>
      {username && <p className="quick-access-account">{t("Signed in as")} @{username}</p>}
      <nav aria-label={t("Game navigation")}>
        <div className="quick-access-direct">
          {([["hangar", "Your fleet"], ["shop", "Ship shop"]] as const).map(([action, label]) => <button type="button" key={action} onClick={() => onAction(action)}><BlockchainIcon kind={action}/><strong>{t(label)}</strong><i aria-hidden="true">›</i></button>)}
        </div>
        {groups.map(group => <div key={group.id} className="quick-access-category" data-category={group.id} data-open={openCategory === group.id}>
          <button className="quick-access-category-trigger" type="button" aria-expanded={openCategory === group.id} aria-controls={`quick-access-${group.id}`} onClick={() => toggleCategory(group.id)}><span className="category-icon"><BlockchainIcon kind={group.id} /></span><strong>{t(group.title)}</strong><i aria-hidden="true">⌄</i></button>
          <div id={`quick-access-${group.id}`} className="quick-access-items" hidden={openCategory !== group.id}>{group.items.filter(([action]) => action === "signin" ? !signedIn && !busy : action === "signout" ? signedIn : action === "admin" ? canAdmin : action === "exit-admin" ? canAdmin && adminMode : true).map(([action, label]) => <button key={action} type="button" disabled={busy && (action === "play" || action === "signin" || action === "signout" || action === "exit-admin")} onClick={() => onAction(action)}><BlockchainIcon kind={action}/><span className={action === "galaxy" ? "quick-galaxy-copy" : undefined}>{t(label)}{action === "galaxy" && <><small>{t("500 levels · 50 bosses · 100 mini-games")}</small><em>{t("Preview · In development")}</em></>}</span><i aria-hidden="true">›</i></button>)}</div>
        </div>)}
      </nav>
    </section>
  </div>;
}
