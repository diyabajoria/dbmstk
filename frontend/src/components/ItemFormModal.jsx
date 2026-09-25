import { useState } from "react";
import Modal from "./Modal";
import { createItem } from "../services/itemService";
import { ITEM_CATALOG } from "../data/itemCatalog";
import { INDIAN_UNITS } from "../utils/formatters";

export default function ItemFormModal({ categories, locations, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", brand: "", categoryId: "", unit: "", minimumStock: 0, locationId: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Typing (or choosing) a known item name fills in the rest
  function handleName(value) {
    const match = ITEM_CATALOG.find((c) => `${c.name} — ${c.brand}` === value || c.name.toLowerCase() === value.toLowerCase());
    if (!match) return update("name", value);
    setForm({
      name: match.name,
      brand: match.brand,
      unit: match.unit,
      minimumStock: match.minimumStock,
      categoryId: categories.find((c) => c.name === match.category)?._id || "",
      locationId: locations.find((l) => l.name === match.location)?._id || "",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createItem(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="✨ Add Item" onClose={onClose}>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input list="catalog-names" value={form.name} onChange={(e) => handleName(e.target.value)} required placeholder="Start typing — e.g. Milk, Rice, Soap" autoFocus />
          <datalist id="catalog-names">
            {ITEM_CATALOG.map((c) => (
              <option key={c.name + c.brand} value={`${c.name} — ${c.brand}`} />
            ))}
          </datalist>
          <div className="form-hint">Pick a suggestion to auto-fill brand, category, location and unit.</div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Brand</label>
            <input value={form.brand} onChange={(e) => update("brand", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <input list="unit-options-modal" value={form.unit} onChange={(e) => update("unit", e.target.value)} required placeholder="kg, L, pcs…" />
            <datalist id="unit-options-modal">
              {INDIAN_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} required>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Location</label>
            <select value={form.locationId} onChange={(e) => update("locationId", e.target.value)} required>
              <option value="">Select…</option>
              {locations.map((l) => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Alert me when stock falls below</label>
          <input type="number" min="0" step="any" value={form.minimumStock} onChange={(e) => update("minimumStock", Number(e.target.value))} required />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? "Saving…" : "Save item"}</button>
        </div>
      </form>
    </Modal>
  );
}
