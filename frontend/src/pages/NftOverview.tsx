import { Link, Navigate } from "react-router-dom";
import { hangarCatalog } from "../../../backend/src/hangarCatalog";
import { shipNftEditions, shipNftMaxSupply } from "../../../backend/src/shipNftCatalog";
import { BOSS_STICKER_COUNT } from "../../../backend/src/rewardRules";
import { useLocale } from "../i18n";
import { nftGalleryCopy } from "../locales/bossNftGallery";
import { bossNftPreviewCopy } from "../locales/bossNftPreview";
import { bossNftEditions } from "./bossNftEditions";
import { playerSkins, shipSaveNetwork } from "./shipFleet";
import { shipNftMainnetVisible } from "./shipNftVisibility";
import "./bossNftGallery.css";
import "./bossNftPreview.css";
import "./nftOverview.css";

const upgrades = hangarCatalog.filter(offer => offer.kind === "ship_upgrade");
const editions = [
  { name: shipNftEditions[0], stage: 1 },
  { name: shipNftEditions[1], stage: 2 },
  { name: shipNftEditions[2], stage: 3 },
] as const;

function NftOverviewPage() {
  const { locale, t } = useLocale();
  const testnet = shipSaveNetwork === "testnet";
  const gallery = nftGalleryCopy(locale);
  const bossCopy = bossNftPreviewCopy(locale);
  const number = new Intl.NumberFormat(locale).format;
  const pi = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format;
  const designs = (count: number) => t("{count} card designs", { count: number(count) });

  return <main className="boss-nft-page nft-overview">
    <header className="boss-nft-header">
      <nav className="nft-page-links" aria-label={t("Game navigation")}>
        <Link className="boss-nft-home" to="/"><span aria-hidden="true">←</span> {t("Home")}</Link>
        <Link className="boss-nft-home" to="/" state={{ openShopView: "shop" }}>{t("Ship shop")}</Link>
        <Link className="boss-nft-home" to="/" state={{ openCollection: true }}>{t("Card collection")}</Link>
      </nav>
      <h1>{t("NFT overview")}</h1>
      <p className="nft-unlock-notice">{t("All NFT card slots are visible. Artwork appears once you unlock the card.")}</p>
      <p className="nft-overview-notice">{t("NFT issuance and sales are planned for the Mainnet app.")}</p>
    </header>
    <div className="nft-overview-groups">
      <section aria-labelledby="nft-overview-bosses-heading">
        <h2 id="nft-overview-bosses-heading">{gallery.title}</h2>
        <ul>
          {(["victory", "holo"] as const).map(edition => {
            const { name, supply } = bossNftEditions[edition];
            const terms = <>
              <strong>{name}</strong>
              <span>{designs(BOSS_STICKER_COUNT)}{" · "}{t("{count} per boss", { count: number(supply) })}</span>
              <p>{edition === "victory" ? bossCopy.victory : <b>{pi(bossNftEditions.holo.pricePi)} Pi</b>}</p>
            </>;
            return <li key={edition}>
              {testnet ? <Link className="nft-overview-edition" to={edition === "holo" ? "/nft-bosses?edition=holo" : "/nft-bosses"}>
                {terms}
              </Link> : <div className="nft-overview-edition">{terms}</div>}
            </li>;
          })}
        </ul>
        {testnet && <p className="nft-overview-terms">{t("Defeat a boss to reveal both of its NFT cards.")}</p>}
      </section>
      <section aria-labelledby="nft-overview-ships-heading">
        <h2 id="nft-overview-ships-heading">{t("Ship NFTs")}</h2>
        <ul>
          {editions.map(({ name, stage }) => {
            const price = upgrades.find(offer => offer.stage === stage)?.pricePi;
            const terms = stage === 1
              ? t("Grey Scout is free. Other Standard ships cost Shards. The NFT is included.")
              : stage === 2
                ? t("NFT included with the ship upgrade.")
                : t("NFT included with the ship upgrade. Requires Advanced.");
            return <li key={stage}>
              <Link className="nft-overview-edition" to={stage === 1 ? "/nft-ships" : `/nft-ships?stage=${stage}`}>
                <strong>{name}</strong>
                <span>{designs(playerSkins.length)}{" · "}{t("{count} per ship model", { count: number(shipNftMaxSupply[name]) })}</span>
                <p>{price !== undefined && <b>{pi(price)} Pi{" · "}</b>}{terms}</p>
              </Link>
            </li>;
          })}
        </ul>
      </section>
    </div>
  </main>;
}

export default function NftOverview() {
  return shipSaveNetwork === "testnet" || shipNftMainnetVisible ? <NftOverviewPage /> : <Navigate to="/" replace />;
}
