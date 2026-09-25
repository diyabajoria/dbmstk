import { useEffect, useState } from "react";
import { getAlerts, markAlertRead, scanAlerts } from "../services/alertService";
import AlertCard from "../components/AlertCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const toast = useToast();

  function load() {
    setLoading(true);
    getAlerts()
      .then((res) => setAlerts(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load alerts"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleMarkRead(id) {
    await markAlertRead(id);
    setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, isRead: true } : a)));
    toast?.success("Alert resolved.");
  }

  async function handleScan() {
    setScanning(true);
    try {
      const res = await scanAlerts();
      toast?.success(`Scan complete — ${res.data.created} new, ${res.data.updated} updated.`);
      load();
    } catch (err) {
      toast?.error(err.response?.data?.error || "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  let filtered = typeFilter ? alerts.filter((a) => a.type === typeFilter) : alerts;
  if (statusFilter === "active") filtered = filtered.filter((a) => !a.isRead);
  else if (statusFilter === "resolved") filtered = filtered.filter((a) => a.isRead);

  const activeCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Alerts</h2>
          <p className="page-subtitle">{activeCount} active alert{activeCount === 1 ? "" : "s"} need your attention.</p>
        </div>
        <button className="btn btn-secondary" onClick={handleScan} disabled={scanning}>
          {scanning ? "Scanning..." : "🔄 Scan Now"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="toolbar">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="">All types</option>
          <option value="EXPIRED">Expired</option>
          <option value="EXPIRING_SOON">Expiry</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="RESTOCK">Restock</option>
        </select>
        <div className="segmented">
          {[["active", "Active"], ["resolved", "Resolved"], ["all", "All"]].map(([v, l]) => (
            <button key={v} className={statusFilter === v ? "active" : ""} onClick={() => setStatusFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState message="All clear — no alerts match this filter." icon="🎉" /></div>
      ) : (
        <div className="stagger">{filtered.map((a) => <AlertCard key={a._id} alert={a} onMarkRead={handleMarkRead} />)}</div>
      )}
    </div>
  );
}
