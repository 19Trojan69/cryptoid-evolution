import { useLocale } from "../i18n";
interface ProductCardProps {
  name: string;
  description: string;
  price: number;
  pictureURL: string;
  onClickBuyWithPi: () => void;
  onClickBuyWithIrra: () => void;
  disabled?: boolean;
}

const ProductCard = ({
  name,
  description,
  price,
  pictureURL,
  onClickBuyWithPi,
  onClickBuyWithIrra,
  disabled,
}: ProductCardProps) => {
  const { t } = useLocale();
  return (
    <article className="product-card">
      <div className="product-image-wrap">
          <img className="product-image" src={pictureURL} alt={name} />
          <span className="product-badge">{t("POWER ITEM")}</span>
        </div>
      <div className="product-info">
        <div><h3>{t(name)}</h3><p>{t(description)}</p></div>
        <strong>{price} <small>Pi</small></strong>
      </div>
      <div className="payment-actions">
        <button className="payment-button payment-pi" onClick={onClickBuyWithPi} disabled={disabled}>{t("Pay with Pi")} <span>↗</span></button>
        <button className="payment-button" onClick={onClickBuyWithIrra} disabled={disabled}>{t("Pay with IRRA")} <span>↗</span></button>
      </div>
      <p className="payment-note">{t("IRRA pricing is for demo purposes.")}</p>
    </article>
  );
};

export default ProductCard;
