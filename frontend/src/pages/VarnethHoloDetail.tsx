import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "../i18n";
import { getVarnethHoloDetailCopy } from "../locales/varnethHoloDetail";
import "./varnethHoloDetail.css";

// Display the initial Testnet state until the pilot contract is deployed.
const pilotPreview = {
  issued: 0,
  limit: 1,
  plannedEditionSize: 3141,
  collectionName: "Boss Holo Edition",
  networkName: "Pi Testnet",
} as const;

export default function VarnethHoloDetail({ name, editionName, imageUrl, imageDescription, onClose }: {
  name: string;
  editionName: string;
  imageUrl: string;
  imageDescription: string;
  onClose: () => void;
}) {
  const { locale, t } = useLocale();
  const copy = getVarnethHoloDetailCopy(locale);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const progressId = useId();
  const format = new Intl.NumberFormat(locale).format;

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog?.showModal();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      dialog?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(<dialog ref={dialogRef} className="varneth-holo-detail" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="varneth-holo-panel">
      <header className="varneth-holo-header">
        <div>
          <p>{editionName}</p>
          <h2 id={titleId}>{name}</h2>
        </div>
        <button ref={closeRef} className="varneth-holo-close" type="button" aria-label={t("Close")} onClick={onClose}>×</button>
      </header>

      <img className="varneth-holo-art" src={imageUrl} width={540} height={720} alt={imageDescription} />

      <section className="varneth-holo-progress">
        <div>
          <span id={progressId}>{copy.issued}</span>
          <strong>{format(pilotPreview.issued)} / {format(pilotPreview.limit)}</strong>
        </div>
        <progress value={pilotPreview.issued} max={pilotPreview.limit} aria-labelledby={progressId} />
      </section>

      <p className="varneth-holo-status">{copy.unlocked}</p>

      <dl className="varneth-holo-facts">
        <div><dt>{copy.supply}</dt><dd>{format(pilotPreview.plannedEditionSize)}</dd></div>
        <div><dt>{copy.collection}</dt><dd>{pilotPreview.collectionName}</dd></div>
        <div><dt>{copy.requirement}</dt><dd>{t("Boss defeated")}</dd></div>
        <div><dt>{pilotPreview.networkName}</dt><dd>{copy.pending}</dd></div>
      </dl>
    </div>
  </dialog>, document.body);
}
