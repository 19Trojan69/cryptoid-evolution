import { useLocale } from "../i18n";
import "./mainnetPreviewNotice.css";

export default function MainnetPreviewNotice({ expanded = false }: { expanded?: boolean }) {
  const { t } = useLocale();
  return <aside className="mainnet-preview-notice" role="note" aria-label={t("Mainnet preview")}>
    <strong className="mainnet-preview-title"><span aria-hidden="true" />{t("Mainnet preview")}</strong>
    <p>{t("Grey Scout is free. Nova Wing and Solar Lance can be bought with Shards.")}</p>
    <details open={expanded || undefined}>
      <summary>{t("Full release & saved progress")}</summary>
      <p>{t("The base game is playable. Additional ships, Pi purchases and NFT features are in preparation. They will open after technical completion, required Pi Network approvals and activation by the developer.")}</p>
      <p className="mainnet-preview-progress">{t("Mainnet progress is saved separately from Testnet and will be retained when the full version opens.")}</p>
    </details>
  </aside>;
}
