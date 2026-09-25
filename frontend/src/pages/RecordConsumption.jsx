import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getItems } from "../services/itemService";
import { recordConsumption } from "../services/consumptionService";
import { loadSampleData } from "../services/setupService";
import { formatCurrency, formatDate, getExpiryBadgeInfo } from "../utils/formatters";
import { useToast } from "../components/Toast";
import ItemPicker from "../components/ItemPicker";
import StatusBadge from "../components/StatusBadge";
import { emojiFor } from "../data/itemCatalog";

function quickAmounts(unit = "") {
  const u = unit.toLowerCase();
  if (u === "g" || u === "ml") return [50, 100, 250, 500];
  if (u === "kg" || u === "l") return [0.25, 0.5, 1, 2];
  return [1, 2, 3, 5];
}

export default function RecordConsumption() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState(searchParams.get("itemId") || "");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const load = () => getItems().then((res) => setItems(res.data));
  useEffect(() => {
    load();
  }, []);

  // Only items with stock can be consumed
  const inStock = items.filter((i) => i.currentStock > 0);
  const selectedItem = items.find((i) => i._id === itemId);
  const activeBatches = (selectedItem?.batches || [])
    .filter((b) => b.remainingQuantity > 0)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  const earliestBatch = activeBatches[0];
  const badge = earliestBatch ? getExpiryBadgeInfo(earliestBatch.expiryDate) : null;
  const pct = selectedItem && selectedItem.currentStock > 0 ? Math.min(100, (Number(quantity || 0) / selectedItem.currentStock) * 100) : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!itemId) return setError("Pick an item first.");
    setSaving(true);
    try {
      await recordConsumption({ itemId, quantity: Number(quantity), date, note: note || undefined });
      toast?.success(`Used ${quantity} ${selectedItem?.unit || ""} of ${selectedItem?.name} — oldest batch first.`);
      setQuantity("");
      setNote("");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record consumption");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">Record Consumption</h2>
      <p className="page-subtitle">Pick what you used — the earliest-expiring batch is used first automatically (FEFO).</p>

      <div className="grid-main-side">
        <div className="card">
          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>What did you use?</label>
              <ItemPicker
                items={inStock}
                value={itemId}
                onChange={(id) => {
                  setItemId(id);
                  setQuantity("");
                }}
                placeholder="Search items in stock…"
                emptyActions={(q, close) =>
                  items.length === 0 ? (
                    <div className="chip-row" style={{ justifyContent: "center", marginTop: 10 }}>
                      <button type="button" className="btn btn-sm" onClick={async () => { close(); await loadSampleData(); await load(); toast?.success("Sample household loaded."); }}>
                        ✨ Load sample items
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate("/app/purchases?new=1")}>
                        ＋ Add a purchase
                      </button>
                    </div>
                  ) : null
                }
              />
            </div>

            {selectedItem && (
              <div className="item-summary">
                <span className="big-emoji">{emojiFor(selectedItem)}</span>
                <div>
                  <div style={{ fontWeight: 800 }}>{selectedItem.name}</div>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>{selectedItem.brand}</div>
                </div>
                <div className="stock">
                  <span className="muted" style={{ fontSize: "0.72rem" }}>AVAILABLE</span>
                  <strong>{selectedItem.currentStock} {selectedItem.unit}</strong>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Quantity used ({selectedItem?.unit || "unit"})</label>
              <input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="0" />
              {selectedItem && (
                <>
                  <div className="chip-row" style={{ marginTop: 10 }}>
                    {quickAmounts(selectedItem.unit).map((q) => (
                      <button type="button" key={q} className={`chip ${Number(quantity) === q ? "active" : ""}`} onClick={() => setQuantity(String(q))}>
                        {q} {selectedItem.unit}
                      </button>
                    ))}
                    <button type="button" className="chip" onClick={() => setQuantity(String(selectedItem.currentStock))}>All</button>
                  </div>
                  {Number(quantity) > 0 && (
                    <div className={`progress ${pct > 100 || Number(quantity) > selectedItem.currentStock ? "danger" : pct > 70 ? "warn" : ""}`}>
                      <span style={{ width: `${pct}%` }} key={pct} />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Note</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" />
              </div>
            </div>

            <button className="btn btn-gradient btn-block btn-lg" type="submit" disabled={saving}>
              {saving ? "Saving…" : "✓ Record Usage"}
            </button>
          </form>
        </div>

        <div className="card" style={{ background: "linear-gradient(160deg, #f0fdf4, #fff)", borderColor: "#c9ecd6" }}>
          <div className="section-title">🧠 FEFO recommendation</div>
          {!selectedItem ? (
            <p className="muted" style={{ fontSize: "0.9rem" }}>Select an item to see which batch will be used first.</p>
          ) : !earliestBatch ? (
            <p className="muted" style={{ fontSize: "0.9rem" }}>No stock available for this item.</p>
          ) : (
            <>
              <p style={{ fontSize: "0.9rem", marginTop: 0 }}>
                Drawing first from <strong>Batch {earliestBatch.batchNumber}</strong> — the one expiring soonest.
              </p>
              {activeBatches.slice(0, 4).map((b, idx) => {
                const info = getExpiryBadgeInfo(b.expiryDate);
                return (
                  <div className="list-row" key={b._id || b.batchNumber} style={idx === 0 ? { background: "#fff", boxShadow: "var(--shadow)" } : {}}>
                    <div>
                      <div className="title">{idx === 0 ? "▶ " : ""}Batch {b.batchNumber}</div>
                      <div className="meta">{b.remainingQuantity} {selectedItem.unit} · {formatDate(b.expiryDate)} · {formatCurrency(b.pricePerUnit)}/{selectedItem.unit}</div>
                    </div>
                    <StatusBadge status={info.tier} label={info.label} />
                  </div>
                );
              })}
              {quantity && Number(quantity) > earliestBatch.remainingQuantity && Number(quantity) <= selectedItem.currentStock && (
                <p style={{ fontSize: "0.82rem", color: "var(--amber)", marginTop: 10 }}>
                  This spans into the next batch too — FEFO handles the split automatically.
                </p>
              )}
              {quantity && Number(quantity) > selectedItem.currentStock && (
                <p style={{ fontSize: "0.82rem", color: "var(--terracotta)", marginTop: 10 }}>
                  That's more than you have ({selectedItem.currentStock} {selectedItem.unit}).
                </p>
              )}
              {badge && <div className="muted" style={{ fontSize: "0.78rem", marginTop: 10 }}>Oldest batch status: {badge.label}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
