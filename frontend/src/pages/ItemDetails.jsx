import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getItem } from "../services/itemService";
import { getPurchases } from "../services/purchaseService";
import { getConsumption } from "../services/consumptionService";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import StatsCard from "../components/StatsCard";
import { formatCurrency, formatDate, getExpiryBadgeInfo } from "../utils/formatters";

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getItem(id), getPurchases(), getConsumption()])
      .then(([itemRes, purchRes, consRes]) => {
        setItem(itemRes.data);
        const purchases = purchRes.data.filter((t) => t.itemId?._id === id).map((t) => ({ ...t, kind: "Purchase" }));
        const consumption = consRes.data.filter((t) => t.itemId?._id === id).map((t) => ({ ...t, kind: "Consumption" }));
        setTransactions([...purchases, ...consumption].sort((a, b) => new Date(b.date) - new Date(a.date)));
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load item"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-banner">{error}</div>;
  if (!item) return null;

  const activeBatches = item.batches.filter((b) => b.remainingQuantity > 0);

  const batchColumns = [
    { key: "batchNumber", header: "Batch #" },
    { key: "purchaseDate", header: "Purchase Date", render: (b) => formatDate(b.purchaseDate) },
    { key: "expiryDate", header: "Expiry Date", render: (b) => formatDate(b.expiryDate) },
    { key: "purchasedQuantity", header: "Purchased", render: (b) => `${b.purchasedQuantity} ${item.unit}` },
    { key: "remainingQuantity", header: "Remaining", render: (b) => `${b.remainingQuantity} ${item.unit}` },
    { key: "pricePerUnit", header: "Unit Price", render: (b) => formatCurrency(b.pricePerUnit) },
    { key: "supplier", header: "Supplier", render: (b) => b.supplierId?.name || "—" },
    { key: "daysLeft", header: "Days Left", render: (b) => getExpiryBadgeInfo(b.expiryDate).daysLeft },
    { key: "status", header: "Status", render: (b) => { const info = getExpiryBadgeInfo(b.expiryDate); return <StatusBadge status={info.tier} label={info.label} />; } },
  ];

  const txnColumns = [
    { key: "kind", header: "Type" },
    { key: "date", header: "Date", render: (t) => formatDate(t.date) },
    { key: "batchNumber", header: "Batch #" },
    { key: "quantity", header: "Quantity", render: (t) => `${t.quantity} ${item.unit}` },
    { key: "amount", header: "Amount", render: (t) => (t.totalAmount ? formatCurrency(t.totalAmount) : "—") },
    { key: "user", header: "User", render: (t) => t.userId?.name || "—" },
  ];

  return (
    <div>
      <Link to="/app/inventory" style={{ color: "var(--primary)", fontSize: "0.88rem", fontWeight: 600 }}>&larr; Back to Inventory</Link>
      <div className="page-header-row" style={{ marginTop: 10 }}>
        <div>
          <h2 className="page-title">{item.name} {item.brand ? <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({item.brand})</span> : ""}</h2>
          <p className="page-subtitle">{item.categoryId?.name} · {item.locationId?.name}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => navigate(`/app/purchases?itemId=${item._id}`)}>🛒 Record Purchase</button>
          <button className="btn btn-secondary" onClick={() => navigate(`/app/consumption?itemId=${item._id}`)}>🥣 Consume</button>
        </div>
      </div>

      <div className="stats-grid stagger">
        <StatsCard icon="📦" label="Current Stock" value={`${item.currentStock} ${item.unit}`} tone={item.lowStock ? "warning" : ""} />
        <StatsCard icon="📉" label="Minimum Stock" value={`${item.minimumStock} ${item.unit}`} />
        <StatsCard icon="💰" label="Stock Value" value={Number(item.inventoryValue) || 0} format={formatCurrency} />
        <StatsCard icon="🧾" label="Active Batches" value={activeBatches.length} tone="info" />
      </div>

      <div className="card mb-20">
        <div className="section-title">📦 Batch breakdown</div>
        <div className="table-wrap"><DataTable columns={batchColumns} rows={item.batches} emptyMessage="No batches for this item." /></div>
      </div>

      <div className="card">
        <div className="section-title">🕒 Purchase & usage history</div>
        <div className="table-wrap"><DataTable columns={txnColumns} rows={transactions} emptyMessage="No transactions yet." /></div>
      </div>
    </div>
  );
}
