import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import {
  getCategoryLabel,
  getCategoryValue,
  normalizeCategory,
} from "../utils/catalog.js";

const API_URL = import.meta.env.VITE_API_URL;

const Category = () => {
  const { categoryId } = useParams();
  const categoryLabel = getCategoryLabel(categoryId);
  const categoryValue = getCategoryValue(categoryId);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [saleConfig, setSaleConfig] = useState(null);

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

  const getEffectivePrice = (product) => {
    const originalBase = Number(product.price || product.offerPrice || 0);
    if (!isSaleActive) return Number(product.offerPrice || 0);
    return Math.max(0, originalBase - Number(currentSale.price || 0));
  };

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filteredByCategory = products.filter(
      (product) => normalizeCategory(product.category) === categoryValue,
    );
    const filteredBySearch = !query
      ? filteredByCategory
      : filteredByCategory.filter((product) =>
          product.name?.toLowerCase().includes(query),
        );

    const compareNewest = (a, b) => Number(b.id || 0) - Number(a.id || 0);
    if (sortOption === "price-low") {
      return [...filteredBySearch].sort(
        (a, b) => getEffectivePrice(a) - getEffectivePrice(b),
      );
    }
    if (sortOption === "price-high") {
      return [...filteredBySearch].sort(
        (a, b) => getEffectivePrice(b) - getEffectivePrice(a),
      );
    }
    return [...filteredBySearch].sort(compareNewest);
  }, [
    categoryLabel,
    products,
    searchTerm,
    sortOption,
    isSaleActive,
    currentSale,
  ]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

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

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Collection</p>
          <h1 className="section-title">{categoryLabel}</h1>
          <p className="section-subtitle">
            Handpicked jewellery crafted for every moment.
          </p>
        </div>
        <Link to="/" className="button button--outline">
          Back to home
        </Link>
      </div>

      {isSaleActive && (
        <div className="sale-banner">
          <div>
            <p className="sale-banner__eyebrow">Limited time offer</p>
            <h2 className="sale-banner__title">
              {currentSale?.name || "Sale"} is live
            </h2>
            <p className="sale-banner__subtitle">
              Flat Rs. {Number(currentSale?.price || 0).toLocaleString("en-IN")}{" "}
              off on all products
            </p>
          </div>
          <div className="sale-banner__chip">
            Save Rs. {Number(currentSale?.price || 0).toLocaleString("en-IN")}
          </div>
        </div>
      )}

      <div className="filter-media">
        <select
          value={sortOption}
          onChange={(event) => setSortOption(event.target.value)}
          className="form__input"
          aria-label="Sort products"
        >
          <option value="newest">Recently added</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </select>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="form__input"
          placeholder="Search by name..."
          aria-label="Search products by name"
        />
      </div>

      {isLoading ? (
        <div className="loading">Loading products...</div>
      ) : filteredProducts.length ? (
        <div className="grid grid-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              sale={
                isSaleActive
                  ? {
                      name: currentSale?.name || "",
                      price: currentSale?.price,
                      isActive: true,
                    }
                  : { isActive: false }
              }
            />
          ))}
        </div>
      ) : (
        <p className="helper">No products match your search.</p>
      )}
    </section>
  );
};

export default Category;
