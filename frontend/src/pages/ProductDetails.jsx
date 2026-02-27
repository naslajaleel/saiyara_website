import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ImageCarousel from "../components/ImageCarousel.jsx";

const API_URL = import.meta.env.VITE_API_URL;
const WHATSAPP_BASE = "https://wa.me/917907607583";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saleConfig, setSaleConfig] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Failed to load product", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  useEffect(() => {
    const loadSale = async () => {
      try {
        const response = await fetch(`${API_URL}/sale`);
        const data = await response.json();
        setSaleConfig(data);
      } catch (error) {
        console.error("Failed to load sale config", error);
      }
    };

    loadSale();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading product...</div>;
  }

  if (!product?.id) {
    return (
      <div className="section">
        <p className="helper">Product not found.</p>
        <Link to="/" className="button button--outline">
          Back to home
        </Link>
      </div>
    );
  }

  const whatsappLink = `${WHATSAPP_BASE}?text=${encodeURIComponent(
    `Hi! I'm interested in this product: ${window.location.href}`,
  )}`;

  const currentSale = saleConfig?.current || saleConfig || null;
  const isSaleActive =
    Boolean(
      currentSale?.enabled &&
        currentSale?.price &&
        currentSale?.startDate &&
        currentSale?.endDate,
    ) &&
    new Date() >= new Date(`${currentSale.startDate}T00:00:00`) &&
    new Date() <= new Date(`${currentSale.endDate}T23:59:59`);

  const originalBase = Number(product.price || product.offerPrice || 0);
  const discount = isSaleActive ? Number(currentSale.price || 0) : 0;
  const effectivePrice = isSaleActive
    ? Math.max(0, originalBase - discount)
    : Number(product.offerPrice || 0);
  const showSaleStrike = isSaleActive && discount > 0 && originalBase > 0;

  return (
    <section className="layout-split">
      <ImageCarousel images={product.images} />

      <div style={{ display: "grid", gap: "24px" }}>
        <div>
          <p className="eyebrow">Saiyara Jewellery</p>
          <h1 className="section-title">{product.name}</h1>
          {isSaleActive && (
            <p className="helper helper--error">
              {currentSale?.name || "Sale"} is live
            </p>
          )}
          <p className="section-subtitle">{product.category}</p>
        </div>

        <div className="badge-box">
          <p className="eyebrow">Offer price</p>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span className="section-title" style={{ fontSize: "28px" }}>
              {formatPrice(effectivePrice)}
            </span>
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

        {product.material && (
          <div>
            <p className="eyebrow">Material</p>
            <p className="section-subtitle">{product.material}</p>
          </div>
        )}

        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="button button--primary whatsapp"
        >
          Chat on WhatsApp
        </a>
      </div>
    </section>
  );
};

export default ProductDetails;
