import { Link } from "react-router-dom";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const ProductCard = ({ product, sale }) => {
  const isSaleActive = Boolean(sale?.isActive && sale?.price);
  const originalBase = Number(product.price || product.offerPrice || 0);
  const discount = isSaleActive ? Number(sale.price) : 0;
  const effectivePrice = isSaleActive
    ? Math.max(0, originalBase - discount)
    : Number(product.offerPrice || 0);
  const showSaleStrike = isSaleActive && discount > 0 && originalBase > 0;

  return (
    <Link to={`/products/${product.id}`} className="card">
      <div className="card__media">
        <img
          src={product.images?.[0]}
          alt={product.name}
          loading="lazy"
        />
      </div>
      <div className="card__body">
        <div>
          <p className="eyebrow">{product.category}</p>
          <h3 className="card__title">{product.name}</h3>
          {product.material && (
            <p className="helper">{product.material}</p>
          )}
        </div>
        <div className="card__price">
          <span>{formatPrice(effectivePrice)}</span>
          {showSaleStrike ? (
            <span className="price--strike">
              {formatPrice(originalBase)}
            </span>
          ) : (
            product.price &&
            product.price !== product.offerPrice && (
              <span className="price--strike">
                {formatPrice(product.price)}
              </span>
            )
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
