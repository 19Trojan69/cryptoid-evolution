import { useEffect, useRef, useState } from "react";
import ShipPortrait from "./ShipPortrait";
import { shipEvolutionAsset, type ShipStage } from "./shipEvolution";
import type { PlayerColorId } from "./shipFleet";
import { useLocale } from "../i18n";

export default function ShipPreview({ sprite, color, stage }: { sprite: number; color: PlayerColorId; stage: ShipStage }) {
  const { t } = useLocale();
  const root = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");
  const asset = shipEvolutionAsset(sprite, stage);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "240px" });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return <span ref={root} className="ship-preview">
    {visible ? <ShipPortrait src={asset} color={color} name={t("Your ship")} loadingLabel={t("Loading ship…")} errorLabel={t("Preview unavailable")} /> : <span className="ship-preview-status">{t("Loading ship…")}</span>}
  </span>;
}
