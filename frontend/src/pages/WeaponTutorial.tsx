import { useState } from "react";
import { useLocale } from "../i18n";
import "./weaponTutorial.css";

export default function WeaponTutorial({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(initiallyOpen);
  return <details className="weapon-tutorial" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>{t("Illustrated guide")} · {t("Weapons")}</summary>
    {open && <div className="weapon-tutorial-content">
      <p>{t("Select owned Test-Pi weapons during the mission with the side button. Their outer ring shows the remaining time without a seconds counter; when it empties, the weapon disappears. Hold the button to see all owned weapons.")}</p>
      <div className="weapon-tutorial-steps">
        {(["tap", "hold"] as const).map((gesture, index) => <figure key={gesture} className={`weapon-demo weapon-demo-${gesture}`}>
          <div className="weapon-demo-stage" aria-hidden="true">
            <div className="weapon-demo-knob"><span className="weapon-demo-single">Ⅰ</span>{gesture === "tap" && <span className="weapon-demo-twin">Ⅱ</span>}<small>{t(gesture === "tap" ? "Weapons" : "Standard")}</small></div>
            <svg className="weapon-demo-finger" viewBox="0 0 40 50" fill="none"><path d="M14 26V7a4 4 0 0 1 8 0v16l4-3 10 8v10L24 48H14L3 31a4 4 0 0 1 6-5l5 5" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="#112337" /></svg>
            {gesture === "hold" && <div className="weapon-demo-menu"><span>Ⅰ</span><span>Ⅱ</span><span>Ⅲ</span></div>}
          </div>
          <figcaption><b>{index + 1}.</b> {t(gesture === "tap" ? "Tap to switch weapon" : "Hold to open weapon selection")}</figcaption>
        </figure>)}
      </div>
    </div>}
  </details>;
}
