import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";
import Modal from "./Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";

/**
 * Card-based CRUD dashboard for reference data (Categories, Locations,
 * Suppliers) — shows aggregate stats per card (item counts, ₹ values,
 * spend) and a modal form for add/edit.
 *
 * fields: [{ key, label, type }]
 * renderStats(row): JSX for the stat lines specific to this entity
 */
export default function RefDataCardManager({ title, subtitle, fields, listFn, addFn, updateFn, deleteFn, renderStats, icon = "📁" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((f) => [f.key, ""])));
  const { isAdmin } = useAuth();
  const toast = useToast();

  function load() {
    setLoading(true);
    listFn()
      .then((res) => setRows(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openAdd() {
    setEditing(null);
    setForm(Object.fromEntries(fields.map((f) => [f.key, ""])));
    setShowModal(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm(Object.fromEntries(fields.map((f) => [f.key, row[f.key] || ""])));
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await updateFn(editing._id, form);
        toast?.success("Saved.");
      } else {
        await addFn(form);
        toast?.success("Added.");
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Save failed");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this record?")) return;
    try {
      await deleteFn(id);
      toast?.success("Deleted.");
      load();
    } catch (err) {
      toast?.error(err.response?.data?.error || "Delete failed");
    }
  }

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h2 className="page-title">{title}</h2>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {isAdmin && <button className="btn" onClick={openAdd}>＋ Add {title.replace(/s$/, "")}</button>}
      </div>

      {error && !showModal && <div className="error-banner">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <div className="card"><EmptyState message={`No ${title.toLowerCase()} yet.`} icon={icon} /></div>
      ) : (
        <div className="cards-grid stagger">
          {rows.map((row) => (
            <div key={row._id} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span className="picker-emoji" style={{ width: 38, height: 38, fontSize: "1.15rem" }}>{typeof icon === "function" ? icon(row) : icon}</span>
                <div style={{ fontWeight: 800 }}>{row.name}</div>
              </div>
              {row.description && <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 8 }}>{row.description}</div>}
              {renderStats && renderStats(row)}
              {isAdmin && (
                <div className="actions-cell" style={{ marginTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(row)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row._id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? `Edit ${title.replace(/s$/, "")}` : `Add ${title.replace(/s$/, "")}`} onClose={() => setShowModal(false)}>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleSave}>
            {fields.map((f) => (
              <div className="form-group" key={f.key}>
                <label>{f.label}</label>
                <input
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  required={f.key === "name"}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
