import { useEffect, useRef, useState } from "react";
import PaintedShip from "./PaintedShip";
import { shipEvolutionAsset, type ShipStage } from "./shipEvolution";
import type { PlayerColorId } from "./shipFleet";
import { useLocale } from "../i18n";

export default function ShipPreview({ sprite, color, stage }: { sprite: number; color: PlayerColorId; stage: ShipStage }) {
  const { t } = useLocale();
  const root = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");
  const [readyAsset, setReadyAsset] = useState("");
  const [failedAsset, setFailedAsset] = useState("");
  const asset = shipEvolutionAsset(sprite, stage);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "240px" });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return <span ref={root} className="ship-preview" data-ready={readyAsset === asset}>
    {visible && <img key={asset} src={asset} width={240} height={240} alt="" decoding="async" onLoad={() => setReadyAsset(asset)} onError={() => setFailedAsset(asset)} />}
    {readyAsset === asset ? <PaintedShip sprite={sprite} color={color} stage={stage} /> : <span className="ship-preview-status">{t(failedAsset === asset ? "Preview unavailable" : "Loading ship…")}</span>}
  </span>;
}
