import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardSummary } from "../services/dashboardService";
import { getItems } from "../services/itemService";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import StatsCard from "../components/StatsCard";
import { formatCurrency } from "../utils/formatters";
import { useToast } from "../components/Toast";

export default function ShoppingList() {
  const [rows, setRows] = useState([]);
  const [checked, setChecked] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    Promise.all([getDashboardSummary(), getItems()])
      .then(([summaryRes, itemsRes]) => {
        const itemsById = Object.fromEntries(itemsRes.data.map((i) => [i._id, i]));
        const merged = summaryRes.data.lowStockItems.map((li) => {
          const full = itemsById[li.itemId];
          const lastBatch = full?.batches?.[0];
          return {
            ...li,
            preferredSupplier: lastBatch?.supplierId?.name || "—",
            estimatedPrice: lastBatch?.pricePerUnit || 0,
            estimatedCost: (lastBatch?.pricePerUnit || 0) * li.suggestedRestock,
          };
        });
        setRows(merged);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load shopping list"))
      .finally(() => setLoading(false));
  }, []);

  function toggle(itemId) {
    setChecked((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const totalEstimated = rows.reduce((sum, r) => sum + r.estimatedCost, 0);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Shopping List</h2>
          <p className="page-subtitle">Auto-built from items below minimum stock and your 30-day usage.</p>
        </div>
        {rows.length > 0 && (
          <button className="btn btn-secondary" onClick={() => { navigator.clipboard?.writeText(rows.map((r) => `☐ ${r.name}${r.brand ? ` (${r.brand})` : ""} — ${r.suggestedRestock} ${r.unit}`).join("\n")); toast?.success("List copied — paste it into WhatsApp or Notes."); }}>
            📋 Copy list
          </button>
        )}
      </div>

      {rows.length > 0 && (
        <div className="stats-grid stagger">
          <StatsCard icon="🧺" label="Items to Restock" value={rows.length} tone="warning" />
          <StatsCard icon="✅" label="Checked Off" value={`${checkedCount} / ${rows.length}`} sub={<div className="progress"><span style={{ width: `${(checkedCount / rows.length) * 100}%` }} key={checkedCount} /></div>} />
          <StatsCard icon="💰" label="Estimated Cost" value={totalEstimated} format={formatCurrency} tone="info" />
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card"><EmptyState message="Nothing needs restocking right now — well stocked!" icon="🎉" /></div>
      ) : (
        <div className="card stagger">
          {rows.map((r, idx) => (
            <div
              key={r.itemId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 8px",
                margin: "0 -8px",
                borderRadius: 12,
                borderBottom: idx < rows.length - 1 ? "1px solid var(--border)" : "none",
                opacity: checked[r.itemId] ? 0.5 : 1,
                transition: "opacity 0.3s",
                cursor: "pointer",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }} onClick={() => toggle(r.itemId)}>
                <input type="checkbox" checked={!!checked[r.itemId]} onChange={() => toggle(r.itemId)} onClick={(e) => e.stopPropagation()} style={{ marginTop: 3 }} />
                <div>
                  <div style={{ fontWeight: 700, textDecoration: checked[r.itemId] ? "line-through" : "none" }}>{r.name} {r.brand ? `(${r.brand})` : ""}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Have {r.currentStock} / {r.minimumStock} {r.unit} · buy ~{r.suggestedRestock} {r.unit} · {r.preferredSupplier}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 700 }}>{formatCurrency(r.estimatedCost)}</span>
                <button
                  className="btn btn-amber btn-sm"
                  onClick={() => navigate(`/app/purchases?itemId=${r.itemId}&qty=${r.suggestedRestock}`)}
                >
                  🛒 Record Purchase
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
