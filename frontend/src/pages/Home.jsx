import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_OPTIONS } from "../utils/catalog.js";

const API_URL = import.meta.env.VITE_API_URL;

const Home = () => {
  const [saleConfig, setSaleConfig] = useState(null);
  const [products, setProducts] = useState([]);
  const reviewsTrackRef = useRef(null);
  const heroImages = [
    "https://rosywine.in/cdn/shop/files/4001A62B-927F-4D56-A932-FB6B027C4D54.jpg?v=1767092529&width=1800",
    "https://rosywine.in/cdn/shop/files/k3_9a14cc84-c933-4aa7-88dd-1ba95d793609.avif?v=1766234373&width=1800",
    "https://rosywine.in/cdn/shop/files/k5_21581f7f-9b0a-4d43-8a83-a22b76c90a64.avif?v=1758490252&width=1800",
  ];
  const [heroIndex, setHeroIndex] = useState(0);
  const bestSellers = useMemo(
    () => products.filter((product) => Boolean(product.isBestSeller)),
    [products],
  );
  const bestSellerBannerUrl =
    "//rosywine.in/cdn/shop/files/k1_70be3bca-f7b5-444f-b0ad-6537f54de3a7.jpg?v=1731745926&width=1094";

  const currentSale = saleConfig?.current || saleConfig || null;
  const isSaleActive = useMemo(() => {
    if (
      !currentSale?.enabled ||
      !currentSale?.price ||
      !currentSale?.startDate ||
      !currentSale?.endDate
    ) {
      return false;
    }
    const start = new Date(`${currentSale.startDate}T00:00:00`);
    const end = new Date(`${currentSale.endDate}T23:59:59`);
    const now = new Date();
    return now >= start && now <= end;
  }, [currentSale]);

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

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products", error);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [heroImages.length]);

  useEffect(() => {
    const track = reviewsTrackRef.current;
    if (!track) {
      return;
    }

    const autoScroll = () => {
      const firstCard = track.querySelector(".home-bestseller__card");
      if (!firstCard) {
        return;
      }
      const gap = 16;
      const cardWidth = firstCard.getBoundingClientRect().width;
      const scrollAmount = cardWidth + gap;
      const maxScrollLeft = track.scrollWidth - track.clientWidth;
      const nextScrollLeft =
        track.scrollLeft + scrollAmount >= maxScrollLeft - 4
          ? 0
          : track.scrollLeft + scrollAmount;
      track.scrollTo({ left: nextScrollLeft, behavior: "smooth" });
    };

    const intervalId = window.setInterval(autoScroll, 4500);
    return () => window.clearInterval(intervalId);
  }, [bestSellers.length]);

  return (
    <div className="home">
      <section className="home-hero home-hero--video">
        <div className="home-hero__carousel">
          <div className="home-hero__carousel-track">
            {heroImages.map((image, index) => (
              <img
                key={image}
                src={image}
                alt="Saiyara jewellery hero"
                className={`home-hero__carousel-image ${
                  index === heroIndex ? "is-active" : ""
                }`}
              />
            ))}
          </div>
          <div className="home-hero__carousel-dots" role="tablist">
            {heroImages.map((_, index) => (
              <button
                key={`hero-dot-${index}`}
                type="button"
                className={`home-hero__carousel-dot ${
                  index === heroIndex ? "home-hero__carousel-dot--active" : ""
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-selected={index === heroIndex}
                onClick={() => setHeroIndex(index)}
              />
            ))}
          </div>
        </div>
        <div className="home-hero__content">
          <h1 className="home-hero__title">Everyday luxury, perfected </h1>
          <p className="home-hero__subtitle">
            Discover handcrafted collections designed to celebrate tradition,
            love, and effortless elegance.
          </p>
          {/* <div className="home-hero__actions">
            <Link
              to={`/category/${CATEGORY_OPTIONS[0].id}`}
              className="button button--primary"
            >
              Explore collection
            </Link>
            <Link
              to={`/category/${CATEGORY_OPTIONS[3].id}`}
              className="button button--outline"
            >
              View new arrivals
            </Link>
          </div> */}
        </div>
      </section>
      {isSaleActive && (
        <section className="sale-banner sale-banner--highlight">
          <div>
            <p className="sale-banner__eyebrow">Limited time offer</p>
            <h2 className="sale-banner__title">
              {currentSale?.name || "Sale"} is live
            </h2>
            {currentSale?.description && (
              <p className="sale-banner__quote">{currentSale.description}</p>
            )}
            <p className="sale-banner__subtitle">
              Flat Rs. {Number(currentSale?.price || 0).toLocaleString("en-IN")}{" "}
              off on all products
            </p>
          </div>
          <div className="sale-banner__chip">
            Save Rs. {Number(currentSale?.price || 0).toLocaleString("en-IN")}
          </div>
        </section>
      )}
      <section className="home-collection-list">
        <div className="home-collection-list__header">
          <p className="home-collection-list__eyebrow">
            Anti-Tarnish Jewellery
          </p>
          <h2 className="home-collection-list__title">Product categories</h2>
        </div>
        <div className="home-collection-list__grid">
          {CATEGORY_OPTIONS.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className="home-collection-list__card"
            >
              <div className="home-collection-list__media">
                {category.image && (
                  <img
                    src={category.image}
                    alt={category.label}
                    loading="lazy"
                  />
                )}
                <div className="home-collection-list__label">
                  SHOP {category.label}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <div className="home-collection-list__header">
        <p className="home-collection-list__eyebrow"> Shop the look</p>
        {/* <h2 className="home-collection-list__title">BEST SELLERS</h2> */}
      </div>{" "}
      <section
        className="home-bestseller-banner"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.2)), url(${bestSellerBannerUrl})`,
        }}
      >
        <div className="home-bestseller-banner__content">
          <p className="home-bestseller-banner__title">New arrivals</p>
          <p className="home-bestseller-banner__description">
            Fresh drops curated for your everyday shine.
          </p>
          <Link to="/new-arrivals" className="button">
            View
          </Link>
        </div>
      </section>
      <section className="home-bestseller">
        <div className="home-section__header">
          <div>
            <p className="eyebrow">Best sellers</p>
            <h2 className="home-section__title">Most loved pieces</h2>
          </div>
        </div>
        <div className="home-bestseller__carousel">
          <button
            type="button"
            className="home-bestseller__nav home-bestseller__nav--prev"
            aria-label="Previous reviews"
            onClick={() => {
              const track = reviewsTrackRef.current;
              if (!track) {
                return;
              }
              const firstCard = track.querySelector(".home-bestseller__card");
              if (!firstCard) {
                return;
              }
              const gap = 16;
              const cardWidth = firstCard.getBoundingClientRect().width;
              track.scrollBy({ left: -(cardWidth + gap), behavior: "smooth" });
            }}
          >
            ←
          </button>
          <div className="home-bestseller__viewport">
            <div
              ref={reviewsTrackRef}
              className="home-bestseller__track"
              aria-label="Best sellers"
            >
              {bestSellers.map((product) => (
                <article key={product.id} className="home-bestseller__card">
                  <div className="home-bestseller__media">
                    <img
                      src={product.images?.[0]}
                      alt={product.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="home-bestseller__body">
                    <p className="home-bestseller__title">{product.name}</p>
                    <p className="home-bestseller__text">
                      {product.material || "Signature Saiyara finish"}
                    </p>
                    <Link
                      to={`/products/${product.id}`}
                      className="button home-bestseller__button"
                    >
                      View
                    </Link>
                  </div>
                </article>
              ))}
              {!bestSellers.length && (
                <p className="helper">No best sellers yet.</p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="home-bestseller__nav home-bestseller__nav--next"
            aria-label="Next reviews"
            onClick={() => {
              const track = reviewsTrackRef.current;
              if (!track) {
                return;
              }
              const firstCard = track.querySelector(".home-bestseller__card");
              if (!firstCard) {
                return;
              }
              const gap = 16;
              const cardWidth = firstCard.getBoundingClientRect().width;
              track.scrollBy({ left: cardWidth + gap, behavior: "smooth" });
            }}
          >
            →
          </button>
        </div>
      </section>
      <section className="home-assurance">
        <div className="home-assurance__grid">
          <div className="home-assurance__item">
            <div className="home-assurance__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M3 7h13l4 4v6H3V7zM7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="home-assurance__title">Free Shipping</p>
            <p className="home-assurance__text">
              Free shipping on orders worth 999 or above
            </p>
          </div>
          <div className="home-assurance__item">
            <div className="home-assurance__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 2a5 5 0 0 0-5 5v4H6a2 2 0 0 0-2 2v7h16v-7a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="home-assurance__title">Dedicated Support</p>
            <p className="home-assurance__text">We provide dedicated support</p>
          </div>
          <div className="home-assurance__item">
            <div className="home-assurance__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="home-assurance__title">Secure Payment</p>
            <p className="home-assurance__text">Safe &amp; trusted checkout</p>
          </div>
          <div className="home-assurance__item">
            <div className="home-assurance__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M4 6h11l5 5v7H4V6zm4 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm9 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="home-assurance__title">Fast Delivery</p>
            <p className="home-assurance__text">Speedy shipping across India</p>
          </div>
        </div>
      </section>
      <section className="home-about">
        <p className="home-about__eyebrow">About us</p>
        <h2 className="home-about__title">SAIYARA</h2>
        <p className="home-about__text">
          Welcome to Saiyara, your destination for exquisite and durable
          jewellery that adds a radiant touch to your everyday style. Our
          collections feature waterproof and tarnish-resistant gold-finished
          pieces, thoughtfully crafted to stand the test of time while ensuring
          you shine effortlessly in every moment.
        </p>
      </section>
    </div>
  );
};

export default Home;
