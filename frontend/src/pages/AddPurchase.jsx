import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getItems } from "../services/itemService";
import { getSuppliers, getCategories, getLocations } from "../services/refDataService";
import { addPurchase } from "../services/purchaseService";
import { loadSampleData } from "../services/setupService";
import { formatCurrency, INDIAN_UNITS } from "../utils/formatters";
import { useToast } from "../components/Toast";
import ItemPicker from "../components/ItemPicker";
import { ITEM_CATALOG, emojiFor } from "../data/itemCatalog";

const EXPIRY_PRESETS = [
  { label: "3 days", hint: "milk", days: 3 },
  { label: "1 week", hint: "bread", days: 7 },
  { label: "1 month", hint: "produce", days: 30 },
  { label: "6 months", hint: "spices", days: 182 },
  { label: "1 year", hint: "staples", days: 365 },
];

const EMPTY_NEW_ITEM = { name: "", brand: "", categoryId: "", unit: "", minimumStock: 0, locationId: "" };

function addDays(days, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
const today = () => new Date().toISOString().slice(0, 10);

export default function AddPurchase() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [useNewItem, setUseNewItem] = useState(searchParams.get("new") === "1");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [pickedCatalog, setPickedCatalog] = useState(null);
  const toast = useToast();

  const [form, setForm] = useState({
    itemId: searchParams.get("itemId") || "",
    quantity: searchParams.get("qty") || "",
    purchasePrice: "",
    purchaseDate: today(),
    expiryDate: "",
    supplierId: "",
    batchNumber: "",
    newItem: { ...EMPTY_NEW_ITEM },
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function loadAll() {
    return Promise.all([getItems(), getSuppliers(), getCategories(), getLocations()]).then(([i, s, c, l]) => {
      setItems(i.data);
      setSuppliers(s.data);
      setCategories(c.data);
      setLocations(l.data);
      return i.data;
    });
  }

  useEffect(() => {
    loadAll().then((list) => {
      if (list.length === 0) setUseNewItem(true);
    });
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function updateNewItem(field, value) {
    setForm((f) => ({ ...f, newItem: { ...f.newItem, [field]: value } }));
  }

  const selectedItem = items.find((i) => i._id === form.itemId);

  // When an existing item is picked, prefill price, supplier and a sensible
  // expiry based on that item's most recent batch.
  useEffect(() => {
    if (useNewItem || !selectedItem) return;
    const last = [...(selectedItem.batches || [])].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))[0];
    if (!last) return;
    const shelfDays = Math.max(1, Math.round((new Date(last.expiryDate) - new Date(last.purchaseDate)) / 86400000));
    setForm((f) => ({
      ...f,
      purchasePrice: f.purchasePrice || String(last.pricePerUnit ?? ""),
      supplierId: f.supplierId || last.supplierId?._id || last.supplierId || "",
      expiryDate: f.expiryDate || addDays(shelfDays, f.purchaseDate),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.itemId, useNewItem]);

  const catalogMatches = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return ITEM_CATALOG;
    return ITEM_CATALOG.filter((c) => [c.name, c.brand, c.category].some((s) => s.toLowerCase().includes(q)));
  }, [catalogQuery]);

  function pickFromCatalog(c) {
    const cat = categories.find((x) => x.name.toLowerCase() === c.category.toLowerCase());
    const loc = locations.find((x) => x.name.toLowerCase() === c.location.toLowerCase());
    setPickedCatalog(c.name + c.brand);
    setForm((f) => ({
      ...f,
      newItem: {
        name: c.name,
        brand: c.brand,
        categoryId: cat?._id || f.newItem.categoryId,
        locationId: loc?._id || f.newItem.locationId,
        unit: c.unit,
        minimumStock: c.minimumStock,
      },
      purchasePrice: String(c.price),
      expiryDate: addDays(c.shelfLifeDays, f.purchaseDate),
    }));
  }

  function switchToNew(name = "") {
    setUseNewItem(true);
    if (name) {
      setCatalogQuery(name);
      updateNewItem("name", name);
    }
  }

  async function handleLoadSample(close) {
    close?.();
    try {
      await loadSampleData();
      toast?.success("Sample household loaded.");
      await loadAll();
      setUseNewItem(false);
    } catch (err) {
      toast?.error(err.response?.data?.error || "Couldn't load sample data");
    }
  }

  const unitLabel = useNewItem ? form.newItem.unit || "unit" : selectedItem?.unit || "unit";
  const total = (Number(form.quantity) || 0) * (Number(form.purchasePrice) || 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!useNewItem && !form.itemId) return setError("Pick an item first — or switch to “New item”.");
    setSaving(true);
    try {
      const payload = {
        quantity: Number(form.quantity),
        purchasePrice: Number(form.purchasePrice),
        purchaseDate: form.purchaseDate,
        expiryDate: form.expiryDate,
        supplierId: form.supplierId || undefined,
        batchNumber: form.batchNumber || undefined,
      };
      if (useNewItem) payload.newItem = form.newItem;
      else payload.itemId = form.itemId;

      const res = await addPurchase(payload);
      toast?.success(`Purchase recorded — ${formatCurrency(total)}`);
      await loadAll();
      const savedId = res.data?.item?._id;
      setUseNewItem(false);
      setPickedCatalog(null);
      setCatalogQuery("");
      setForm((f) => ({
        ...f,
        itemId: savedId || f.itemId,
        quantity: "",
        purchasePrice: "",
        expiryDate: "",
        batchNumber: "",
        newItem: { ...EMPTY_NEW_ITEM },
      }));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record purchase");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Add Purchase</h2>
          <p className="page-subtitle">Log a shopping run — pick an item, enter quantity & price, done.</p>
        </div>
        <div className="segmented" role="tablist">
          <button type="button" className={!useNewItem ? "active" : ""} onClick={() => setUseNewItem(false)}>📦 Existing item</button>
          <button type="button" className={useNewItem ? "active" : ""} onClick={() => setUseNewItem(true)}>✨ New item</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid-main-side">
        <div className="card">
          {error && <div className="error-banner">{error}</div>}

          {!useNewItem ? (
            <>
              <div className="form-group">
                <label>Item</label>
                <ItemPicker
                  items={items}
                  value={form.itemId}
                  onChange={(id) => setForm((f) => ({ ...f, itemId: id, purchasePrice: "", expiryDate: "", supplierId: "" }))}
                  placeholder="Search your inventory…"
                  emptyActions={(q, close) => (
                    <div className="chip-row" style={{ justifyContent: "center", marginTop: 10 }}>
                      <button type="button" className="btn btn-sm" onClick={() => { close(); switchToNew(q); }}>
                        ＋ Add {q ? `“${q}”` : "a new item"}
                      </button>
                      {items.length === 0 && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleLoadSample(close)}>
                          ✨ Load sample items
                        </button>
                      )}
                    </div>
                  )}
                />
                <div className="form-hint">
                  Can't find it? <button type="button" className="link-btn" onClick={() => switchToNew()}>Add it as a new item →</button>
                </div>
              </div>

              {selectedItem && (
                <div className="item-summary">
                  <span className="big-emoji">{emojiFor(selectedItem)}</span>
                  <div>
                    <div style={{ fontWeight: 800 }}>{selectedItem.name}</div>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {[selectedItem.brand, selectedItem.categoryId?.name, selectedItem.locationId?.name].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="stock">
                    <span className="muted" style={{ fontSize: "0.72rem" }}>IN STOCK</span>
                    <strong>{selectedItem.currentStock} {selectedItem.unit}</strong>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Quick pick a common item</label>
                <input
                  type="text"
                  placeholder="Search milk, rice, soap…"
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  style={{ marginBottom: 10 }}
                />
                <div className="catalog-grid">
                  {catalogMatches.map((c) => (
                    <button
                      type="button"
                      key={c.name + c.brand}
                      className={`catalog-item ${pickedCatalog === c.name + c.brand ? "active" : ""}`}
                      onClick={() => pickFromCatalog(c)}
                    >
                      <span className="ci-emoji">{c.emoji}</span>
                      <span>
                        <div className="ci-name">{c.name}</div>
                        <div className="ci-brand">{c.brand}</div>
                      </span>
                    </button>
                  ))}
                  {catalogMatches.length === 0 && <div className="muted" style={{ fontSize: "0.85rem" }}>No match — just type the details below.</div>}
                </div>
                <div className="form-hint">Tapping a card fills in the details, typical price and expiry. You can edit anything.</div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Item name</label>
                  <input value={form.newItem.name} onChange={(e) => updateNewItem("name", e.target.value)} required placeholder="e.g. Basmati Rice" />
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input value={form.newItem.brand} onChange={(e) => updateNewItem("brand", e.target.value)} placeholder="optional" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.newItem.categoryId} onChange={(e) => updateNewItem("categoryId", e.target.value)} required>
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stored in</label>
                  <select value={form.newItem.locationId} onChange={(e) => updateNewItem("locationId", e.target.value)} required>
                    <option value="">Select location…</option>
                    {locations.map((l) => (
                      <option key={l._id} value={l._id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input list="unit-options" value={form.newItem.unit} onChange={(e) => updateNewItem("unit", e.target.value)} required placeholder="kg, L, pcs…" />
                  <datalist id="unit-options">
                    {INDIAN_UNITS.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Alert me below</label>
                  <input type="number" min="0" step="any" value={form.newItem.minimumStock} onChange={(e) => updateNewItem("minimumStock", Number(e.target.value))} />
                </div>
              </div>
              {(categories.length === 0 || locations.length === 0) && (
                <div className="error-banner">
                  No categories or locations exist yet. <button type="button" className="link-btn" onClick={() => handleLoadSample()}>Create the defaults</button>
                </div>
              )}
            </>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Quantity ({unitLabel})</label>
              <input type="number" min="0" step="any" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} required placeholder="0" />
            </div>
            <div className="form-group">
              <label>Price (₹ per {unitLabel})</label>
              <input type="number" min="0" step="any" value={form.purchasePrice} onChange={(e) => update("purchasePrice", e.target.value)} required placeholder="0" />
            </div>
          </div>

          {total > 0 && (
            <div className="total-banner" key={total}>
              <span>{form.quantity} {unitLabel} × {formatCurrency(form.purchasePrice)}</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          )}

          <button className="btn btn-gradient btn-block btn-lg" type="submit" disabled={saving}>
            {saving ? "Saving…" : "✓ Save Purchase"}
          </button>
        </div>

        <div className="card">
          <div className="section-title">📅 Dates & store</div>
          <div className="form-group">
            <label>Purchase date</label>
            <input type="date" value={form.purchaseDate} onChange={(e) => update("purchaseDate", e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Expiry date</label>
            <input type="date" value={form.expiryDate} onChange={(e) => update("expiryDate", e.target.value)} required />
            <div className="chip-row" style={{ marginTop: 10 }}>
              {EXPIRY_PRESETS.map((p) => {
                const v = addDays(p.days, form.purchaseDate);
                return (
                  <button type="button" key={p.label} className={`chip ${form.expiryDate === v ? "active" : ""}`} onClick={() => update("expiryDate", v)} title={p.hint}>
                    +{p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label>Store / supplier</label>
            <select value={form.supplierId} onChange={(e) => update("supplierId", e.target.value)}>
              <option value="">None</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Batch number</label>
            <input value={form.batchNumber} onChange={(e) => update("batchNumber", e.target.value)} placeholder="Auto-generated if blank" />
          </div>
        </div>
      </form>
    </div>
  );
}
