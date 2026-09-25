import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getItems, deleteItem } from "../services/itemService";
import { getCategories, getLocations, getSuppliers } from "../services/refDataService";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import ItemFormModal from "../components/ItemFormModal";
import { formatCurrency, formatDate } from "../utils/formatters";
import { useToast } from "../components/Toast";
import EmptyState from "../components/EmptyState";
import { emojiFor } from "../data/itemCatalog";

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [sort, setSort] = useState("");
  const [view, setView] = useState(() => (window.innerWidth < 700 ? "grid" : "table"));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  function loadItems() {
    setLoading(true);
    getItems({
      search: search || undefined,
      categoryId: categoryId || undefined,
      locationId: locationId || undefined,
      supplierId: supplierId || undefined,
      status: status || undefined,
      stockStatus: stockStatus || undefined,
      sort: sort || undefined,
    })
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load inventory"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    Promise.all([getCategories(), getLocations(), getSuppliers()]).then(([c, l, s]) => {
      setCategories(c.data);
      setLocations(l.data);
      setSuppliers(s.data);
    });
  }, []);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId, locationId, supplierId, status, stockStatus, sort]);

  async function handleDelete(id) {
    if (!confirm("Delete this item?")) return;
    try {
      await deleteItem(id);
      toast?.success("Item deleted.");
      loadItems();
    } catch (err) {
      toast?.error(err.response?.data?.error || "Delete failed");
    }
  }

  const columns = [
    { key: "name", header: "Item", render: (r) => (
      <a onClick={() => navigate(`/app/inventory/${r._id}`)} style={{ cursor: "pointer", color: "var(--primary)", fontWeight: 700, display: "inline-flex", gap: 8, alignItems: "center" }}>
        <span className="picker-emoji" style={{ width: 28, height: 28 }}>{emojiFor(r)}</span>{r.name}
      </a>
    ) },
    { key: "brand", header: "Brand" },
    { key: "category", header: "Category", render: (r) => r.categoryId?.name || "—" },
    { key: "currentStock", header: "Quantity", render: (r) => `${r.currentStock} ${r.unit}` },
    { key: "minimumStock", header: "Min Stock", render: (r) => `${r.minimumStock} ${r.unit}` },
    { key: "location", header: "Location", render: (r) => r.locationId?.name || "—" },
    { key: "supplier", header: "Supplier", render: (r) => r.batches?.[0]?.supplierId?.name || "—" },
    { key: "purchasePrice", header: "Price / Unit", render: (r) => (r.batches?.[0] ? formatCurrency(r.batches[0].pricePerUnit) : "—") },
    { key: "nearestExpiry", header: "Expiry", render: (r) => (r.nearestExpiry ? r.nearestExpiry.label || formatDate(r.nearestExpiry.expiryDate) : "—") },
    { key: "value", header: "Stock Value", render: (r) => formatCurrency(r.inventoryValue) },
    { key: "status", header: "Status", render: (r) => (r.lowStock ? <StatusBadge status="LOW_STOCK" /> : <StatusBadge status={r.nearestExpiry?.status || "SAFE"} />) },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="actions-cell">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/app/inventory/${r._id}`)}>View</button>
          {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>Delete</button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Inventory</h2>
          <p className="page-subtitle">{items.length} item{items.length === 1 ? "" : "s"} across your home.</p>
        </div>
        <div className="header-actions">
          <div className="segmented">
            <button className={view === "table" ? "active" : ""} onClick={() => setView("table")}>☰ Table</button>
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>▦ Grid</button>
          </div>
          {isAdmin && <button className="btn" onClick={() => setShowForm(true)}>＋ Add Item</button>}
          <button className="btn btn-secondary" onClick={() => navigate("/app/purchases")}>🛒 Purchase</button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className={`toolbar collapsible ${filtersOpen ? "expanded" : ""}`}>
        <input className="search-input" type="text" placeholder="🔎 Search by name, brand, category, room…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="button" className="btn btn-secondary btn-sm filters-toggle" onClick={() => setFiltersOpen((o) => !o)}>⚙️ Filters {filtersOpen ? "▲" : "▼"}</button>
        <select className="filter-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select className="filter-select" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
          <option value="">All Locations</option>
          {locations.map((l) => (
            <option key={l._id} value={l._id}>{l.name}</option>
          ))}
        </select>
        <select className="filter-select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
        <select className="filter-select" value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}>
          <option value="">All Stock Status</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="HEALTHY">Healthy</option>
        </select>
        <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Expiry Status</option>
          <option value="SAFE">Safe</option>
          <option value="EXPIRING_THIS_MONTH">Expiring this month</option>
          <option value="EXPIRING_SOON">Expiring soon</option>
          <option value="EXPIRES_3_DAYS">Expiring very soon</option>
          <option value="EXPIRES_TODAY">Expires today</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort by...</option>
          <option value="name">Name</option>
          <option value="expiry">Nearest Expiry</option>
          <option value="quantity">Quantity</option>
          <option value="value">Inventory Value</option>
          <option value="dateAdded">Date Added</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : view === "table" ? (
        <div className="card table-card"><div className="table-wrap"><DataTable columns={columns} rows={items} emptyMessage="No items match your filters." emptyIcon="🔍" /></div></div>
      ) : (
        <ItemGrid items={items} onView={(id) => navigate(`/app/inventory/${id}`)} onDelete={isAdmin ? handleDelete : null} />
      )}

      {showForm && (
        <ItemFormModal
          categories={categories}
          locations={locations}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            toast?.success("Item added.");
            loadItems();
          }}
        />
      )}
    </div>
  );
}

function ItemGrid({ items, onView, onDelete }) {
  if (items.length === 0) return <EmptyState message="No items match your filters." icon="🔍" />;
  return (
    <div className="cards-grid stagger">
      {items.map((r) => {
        const pct = r.minimumStock ? Math.min(100, (r.currentStock / (r.minimumStock * 2)) * 100) : 100;
        return (
          <div key={r._id} className="card" style={{ cursor: "pointer" }} onClick={() => onView(r._id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                <span className="picker-emoji" style={{ width: 40, height: 40, fontSize: "1.25rem" }}>{emojiFor(r)}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{r.name}</div>
                  <div className="muted" style={{ fontSize: "0.76rem" }}>{[r.brand, r.categoryId?.name].filter(Boolean).join(" · ")}</div>
                </div>
              </div>
              {r.lowStock ? <StatusBadge status="LOW_STOCK" /> : <StatusBadge status={r.nearestExpiry?.status || "SAFE"} />}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span><strong>{r.currentStock} {r.unit}</strong> <span className="muted">/ min {r.minimumStock}</span></span>
              <span className="value-strong">{formatCurrency(r.inventoryValue)}</span>
            </div>
            <div className={`progress ${r.lowStock ? "danger" : ""}`}><span style={{ width: `${Math.max(pct, 4)}%` }} /></div>
            <div className="muted" style={{ fontSize: "0.78rem", margin: "10px 0 12px" }}>📍 {r.locationId?.name || "—"}{r.nearestExpiry ? ` · ⏳ ${r.nearestExpiry.label || formatDate(r.nearestExpiry.expiryDate)}` : ""}</div>
            <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
              <button className="btn btn-secondary btn-sm" onClick={() => onView(r._id)}>View</button>
              {onDelete && <button className="btn btn-danger btn-sm" onClick={() => onDelete(r._id)}>Delete</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
