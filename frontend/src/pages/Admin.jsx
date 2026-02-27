import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthToken, getAuthHeader } from "../utils/auth.js";
import { CATEGORY_OPTIONS } from "../utils/catalog.js";

const API_URL = import.meta.env.VITE_API_URL;
const emptyForm = {
  id: null,
  name: "",
  material: "",
  price: "",
  offerPrice: "",
  category: "Bangles",
  images: [],
  isBestSeller: false,
  isNewArrival: false,
};

const extractDriveId = (url) => {
  if (!url) return null;
  const match =
    url.match(/\/file\/d\/([^/]+)/) ||
    url.match(/\/thumbnail\/([^/]+)/) ||
    url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
};

const normalizeImageUrl = (url) => {
  const trimmed = url?.trim();
  if (!trimmed) return "";
  const driveId = extractDriveId(trimmed);
  return driveId
    ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`
    : trimmed;
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const Admin = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sale, setSale] = useState({
    name: "",
    description: "",
    price: "",
    startDate: "",
    endDate: "",
    enabled: false,
  });
  const [saleHistory, setSaleHistory] = useState([]);
  const [isSavingSale, setIsSavingSale] = useState(false);

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = !query
      ? products
      : products.filter((product) => {
          const name = product.name?.toLowerCase() || "";
          const material = product.material?.toLowerCase() || "";
          return name.includes(query) || material.includes(query);
        });

    return [...filtered].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }, [products, searchTerm]);

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

  const loadSale = async () => {
    try {
      const response = await fetch(`${API_URL}/sale`);
      const data = await response.json();
      const current = data?.current || data || null;
      if (current) {
        setSale({
          name: current.name || "",
          description: current.description || "",
          price: current.price ?? "",
          startDate: current.startDate || "",
          endDate: current.endDate || "",
          enabled: Boolean(current.enabled),
        });
      }
      setSaleHistory(Array.isArray(data?.history) ? data.history : []);
    } catch (error) {
      console.error("Failed to load sale config", error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadSale();
  }, []);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      event.target.value = "";
      return;
    }

    const validFiles = files.filter((file) => file.size <= MAX_IMAGE_BYTES);
    if (validFiles.length < files.length) {
      window.alert("Each image must be 2MB or smaller.");
    }

    const uploadImageToGithub = async (file) => {
      const dataUrl = await fileToDataUrl(file);
      const safeName = form.name?.trim() ? form.name.trim() : "product";
      const filename = `${safeName}-${Date.now()}-${file.name}`;

      const response = await fetch(`${API_URL}/uploads/github`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ dataUrl, filename }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload image to GitHub.");
      }

      const payload = await response.json();
      if (!payload?.url) {
        throw new Error("Missing uploaded image URL.");
      }

      return payload.url;
    };

    try {
      setIsUploading(true);
      const uploads = [];
      for (const file of validFiles.slice(0, remaining)) {
        const url = await uploadImageToGithub(file);
        uploads.push(url);
      }
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploads].slice(0, MAX_IMAGES),
      }));
    } catch (error) {
      console.error("Failed to upload image files", error);
      window.alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const removeImageField = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const handleEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name,
      material: product.material || "",
      price: product.price,
      offerPrice: product.offerPrice,
      category: product.category || "Bangles",
      images: product.images?.length ? product.images : [],
      isBestSeller: Boolean(product.isBestSeller),
      isNewArrival: Boolean(product.isNewArrival),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    try {
      await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeader(),
        },
      });
      await loadProducts();
    } catch (error) {
      console.error("Failed to delete product", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const payload = {
      name: form.name.trim(),
      material: form.material.trim(),
      price: Number(form.price),
      offerPrice: Number(form.offerPrice),
      category: form.category,
      images: form.images.map((img) => normalizeImageUrl(img)).filter(Boolean),
      isBestSeller: Boolean(form.isBestSeller),
      isNewArrival: Boolean(form.isNewArrival),
    };

    try {
      if (isEditing) {
        await fetch(`${API_URL}/products/${form.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${API_URL}/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify(payload),
        });
      }

      await loadProducts();
      resetForm();
    } catch (error) {
      console.error("Failed to save product", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaleUpdate = async (event) => {
    event.preventDefault();
    setIsSavingSale(true);
    try {
      const payload = {
        current: {
          name: sale.name.trim(),
          description: sale.description.trim(),
          price: sale.price === "" ? "" : Number(sale.price),
          startDate: sale.startDate,
          endDate: sale.endDate,
          enabled: Boolean(sale.enabled),
        },
      };
      const response = await fetch(`${API_URL}/sale`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      const updated = await response.json().catch(() => null);
      if (updated?.current) {
        setSale({
          name: updated.current.name || "",
          description: updated.current.description || "",
          price: updated.current.price ?? "",
          startDate: updated.current.startDate || "",
          endDate: updated.current.endDate || "",
          enabled: Boolean(updated.current.enabled),
        });
      }
      if (Array.isArray(updated?.history)) {
        setSaleHistory(updated.history);
      }
    } catch (error) {
      console.error("Failed to update sale config", error);
    } finally {
      setIsSavingSale(false);
    }
  };

  const deactivateSale = async () => {
    setIsSavingSale(true);
    try {
      const payload = {
        current: {
          ...sale,
          enabled: false,
        },
      };
      const response = await fetch(`${API_URL}/sale`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      const updated = await response.json().catch(() => null);
      if (updated?.current) {
        setSale({
          name: updated.current.name || "",
          description: updated.current.description || "",
          price: updated.current.price ?? "",
          startDate: updated.current.startDate || "",
          endDate: updated.current.endDate || "",
          enabled: Boolean(updated.current.enabled),
        });
      }
      if (Array.isArray(updated?.history)) {
        setSaleHistory(updated.history);
      }
    } catch (error) {
      console.error("Failed to deactivate sale", error);
    } finally {
      setIsSavingSale(false);
    }
  };

  return (
    <section className="section">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="section-title">Jewellery management</h1>
      </div>

      <div className="layout-split">
        <form onSubmit={handleSubmit} className="form">
          <div className="form__title">
            <h2>{isEditing ? "Edit product" : "Add new product"}</h2>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="button button--outline"
              >
                Cancel edit
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              clearAuthToken();
              navigate("/admin/login", { replace: true });
            }}
            className="button button--outline"
            style={{ justifySelf: "flex-start" }}
          >
            Logout
          </button>

          <div className="form__label">
            <span>Category</span>
            <select
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
              className="form__input form__input--full form__select"
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.id} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <label className="form__label">
            Name
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="form__input form__input--full"
              placeholder="Product name"
              required
            />
          </label>

          <label className="form__label">
            Material
            <input
              type="text"
              value={form.material}
              onChange={(event) => updateField("material", event.target.value)}
              className="form__input form__input--full"
              placeholder="22K Gold, 925 Silver"
              required
            />
          </label>

          <div className="form__row">
            <label className="form__label">
              Actual price
              <input
                type="number"
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                className="form__input form__input--full"
                placeholder="12999"
              />
            </label>
            <label className="form__label">
              Offer price
              <input
                type="number"
                value={form.offerPrice}
                onChange={(event) =>
                  updateField("offerPrice", event.target.value)
                }
                className="form__input form__input--full"
                placeholder="9999"
                required
              />
            </label>
          </div>

          <label className="form__label">
            <span>New arrival</span>
            <span
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <input
                type="checkbox"
                checked={form.isNewArrival}
                onChange={(event) =>
                  updateField("isNewArrival", event.target.checked)
                }
              />
              Show this product in new arrivals
            </span>
          </label>

          <label className="form__label">
            <span>Best seller</span>
            <span
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <input
                type="checkbox"
                checked={form.isBestSeller}
                onChange={(event) =>
                  updateField("isBestSeller", event.target.checked)
                }
              />
              Show this product in best sellers
            </span>
          </label>

          <div className="image-list">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p className="eyebrow">Images</p>
              <span className="helper">
                {form.images.length}/{MAX_IMAGES}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageFiles}
              className="form__input form__input--full"
              required={form.images.length === 0}
              disabled={form.images.length >= MAX_IMAGES || isUploading}
            />
            {form.images.length > 0 && (
              <div className="image-grid">
                {form.images.map((image, index) => (
                  <div key={`image-${index}`} className="image-item">
                    <img src={image} alt={`Upload ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="button button--outline"
                      aria-label="Remove image"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving || isUploading || form.images.length === 0}
            className="button button--primary"
          >
            {isUploading
              ? "Uploading..."
              : isSaving
                ? "Saving..."
                : isEditing
                  ? "Update product"
                  : "Add product"}
          </button>
        </form>

        <form onSubmit={handleSaleUpdate} className="form">
          <div className="form__title">
            <h2>Sale offer</h2>
          </div>
          <label className="form__label">
            Sale name
            <input
              type="text"
              value={sale.name}
              onChange={(event) =>
                setSale((prev) => ({ ...prev, name: event.target.value }))
              }
              className="form__input form__input--full"
              placeholder="Festive offer"
            />
          </label>
          <label className="form__label">
            Sale description
            <input
              type="text"
              value={sale.description}
              onChange={(event) =>
                setSale((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              className="form__input form__input--full"
              placeholder="Celebrate with sparkle."
            />
          </label>
          <label className="form__label">
            Discount amount
            <input
              type="number"
              value={sale.price}
              onChange={(event) =>
                setSale((prev) => ({ ...prev, price: event.target.value }))
              }
              className="form__input form__input--full"
              placeholder="1000"
            />
          </label>
          <div className="form__row">
            <label className="form__label">
              Start date
              <input
                type="date"
                value={sale.startDate}
                onChange={(event) =>
                  setSale((prev) => ({
                    ...prev,
                    startDate: event.target.value,
                  }))
                }
                className="form__input form__input--full"
              />
            </label>
            <label className="form__label">
              End date
              <input
                type="date"
                value={sale.endDate}
                onChange={(event) =>
                  setSale((prev) => ({ ...prev, endDate: event.target.value }))
                }
                className="form__input form__input--full"
              />
            </label>
          </div>
          <label className="form__label best-seller-toggle">
            <span>Sale active</span>
            <span
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <input
                type="checkbox"
                checked={sale.enabled}
                onChange={(event) =>
                  setSale((prev) => ({
                    ...prev,
                    enabled: event.target.checked,
                  }))
                }
              />
              Apply discount to all products
            </span>
          </label>
          <button
            type="submit"
            disabled={isSavingSale}
            className="button button--primary"
          >
            {isSavingSale ? "Saving..." : "Save sale"}
          </button>
          {sale.enabled && (
            <button
              type="button"
              className="button button--outline button--danger"
              onClick={deactivateSale}
              disabled={isSavingSale}
            >
              Deactivate sale
            </button>
          )}
        </form>
      </div>

      <div className="list">
        <div className="list__header">
          <h2>Current products</h2>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="form__input"
            placeholder="Search products..."
            aria-label="Search products"
          />
        </div>
        {isLoading ? (
          <div className="loading">Loading products...</div>
        ) : filteredProducts.length ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="list-item">
              <img
                src={normalizeImageUrl(product.images?.[0] || "")}
                alt={product.name}
              />
              <div className="list-item__meta">
                <p style={{ fontWeight: 600 }}>{product.name}</p>
                <p className="helper">
                  {product.category} · Offer {product.offerPrice}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleEdit(product)}
                  className="button button--outline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  className="button button--outline button--danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="helper">No products match your search.</p>
        )}
      </div>
    </section>
  );
};

export default Admin;
