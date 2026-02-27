import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Category from "./pages/Category.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Admin from "./pages/Admin.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import NewArrivals from "./pages/NewArrivals.jsx";
import { isAuthed, subscribeToAuth } from "./utils/auth.js";
import { CATEGORY_OPTIONS } from "./utils/catalog.js";
import logo from "./assets/logo1.png";

const API_URL = import.meta.env.VITE_API_URL;

const App = () => {
  const [authed, setAuthed] = useState(isAuthed());
  const [saleConfig, setSaleConfig] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => subscribeToAuth(setAuthed), []);

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

  const currentSale = saleConfig?.current || saleConfig || null;
  const isSaleActive = useMemo(() => {
    if (
      !currentSale?.enabled ||
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
  const bannerText =
    currentSale?.bannerText ||
    currentSale?.message ||
    (currentSale?.name ? `${currentSale.name} is live now` : "") ||
    "Ramdan sale is live now • 15% off on orders above 500";

  return (
    <div className="page">
      {bannerText && (
        <div className="top-banner" role="status" aria-live="polite">
          <div className="top-banner__track">
            {Array.from({ length: 4 }).map((_, index) => (
              <span key={`banner-${index}`} className="top-banner__item">
                {bannerText}
              </span>
            ))}
          </div>
        </div>
      )}
      <header className="site-header">
        <div className="container site-header__inner">
          <button
            type="button"
            className="menu-button"
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(true)}
          >
            ☰
          </button>
          <Link to="/" className="brand brand--title">
            <img src={logo} alt="Saiyara" className="brand__logo" />
          </Link>
        </div>
      </header>
      <div className={`menu-overlay ${isMenuOpen ? "is-open" : ""}`}>
        <button
          type="button"
          className="menu-overlay__backdrop"
          aria-label="Close menu"
          onClick={() => setIsMenuOpen(false)}
        />
        <aside className="menu-drawer" aria-label="Categories">
          <div className="menu-drawer__header">
            <h3 className="menu-drawer__title">Categories</h3>
            <button
              type="button"
              className="menu-drawer__close"
              aria-label="Close menu"
              onClick={() => setIsMenuOpen(false)}
            >
              ×
            </button>
          </div>
          <nav className="menu-drawer__list">
            {CATEGORY_OPTIONS.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="menu-drawer__link"
                onClick={() => setIsMenuOpen(false)}
              >
                {category.label}
              </Link>
            ))}
          </nav>
        </aside>
      </div>

      <main className="container section">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:categoryId" element={<Category />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={authed ? <Admin /> : <Navigate to="/admin/login" />}
          />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          Handcrafted elegance for every celebration.
        </div>
      </footer>
    </div>
  );
};

export default App;
