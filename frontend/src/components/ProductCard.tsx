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
  return (
    <article className="product-card">
      <div className="product-image-wrap">
          <img className="product-image" src={pictureURL} alt={name} />
          <span className="product-badge">POWER ITEM</span>
        </div>
      <div className="product-info">
        <div><h3>{name}</h3><p>{description}</p></div>
        <strong>{price} <small>Pi</small></strong>
      </div>
      <div className="payment-actions">
        <button className="payment-button payment-pi" onClick={onClickBuyWithPi} disabled={disabled}>Pay with Pi <span>↗</span></button>
        <button className="payment-button" onClick={onClickBuyWithIrra} disabled={disabled}>Pay with IRRA <span>↗</span></button>
      </div>
      <p className="payment-note">IRRA pricing is for demo purposes.</p>
    </article>
  );
};

export default ProductCard;
