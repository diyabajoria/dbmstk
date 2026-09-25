import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSetupStatus, loadSampleData } from "../services/setupService";
import { useToast } from "../components/Toast";

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => getSetupStatus().then((r) => setStatus(r.data)).catch(() => {});
  useEffect(() => {
    refresh();
  }, []);

  async function handleLoad() {
    setBusy(true);
    try {
      const res = await loadSampleData();
      toast?.success(res.data.seededItems ? `Loaded ${res.data.items} sample items.` : "Default categories, rooms and stores are in place.");
      refresh();
    } catch (err) {
      toast?.error(err.response?.data?.error || "Failed");
    } finally {
      setBusy(false);
    }
  }

  const initials = (user?.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div>
      <h2 className="page-title">Settings</h2>
      <p className="page-subtitle">Your account and household data.</p>

      <div className="grid-2 stagger" style={{ maxWidth: 980 }}>
        <div className="card">
          <div className="section-title">👤 Account</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: "1.2rem" }}>{initials}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{user?.name}</div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>{user?.email}</div>
              <span className={`badge ${user?.role === "ADMIN" ? "badge-safe" : "badge-info"}`} style={{ marginTop: 6 }}>{user?.role}</span>
            </div>
          </div>
          <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
            {user?.role === "ADMIN"
              ? "Admins can add/delete items, categories, locations and suppliers."
              : "Members can log purchases, record usage and view reports. Ask an admin to manage categories and rooms."}
          </p>
        </div>

        <div className="card">
          <div className="section-title">🧺 Household data</div>
          {status && (
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))", marginBottom: 14 }}>
              <div className="stat-card"><div className="label">Items</div><div className="value">{status.items}</div></div>
              <div className="stat-card tone-info"><div className="label">Categories</div><div className="value">{status.categories}</div></div>
            </div>
          )}
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0 }}>
            Loading sample data only fills in what's missing — it never changes or deletes your existing items.
          </p>
          <button className="btn btn-gradient" onClick={handleLoad} disabled={busy}>
            {busy ? "Working…" : status?.empty ? "✨ Load sample household" : "🔧 Restore default categories & rooms"}
          </button>
        </div>
      </div>

      <p className="muted" style={{ fontSize: "0.82rem", marginTop: 18 }}>
        Manage <Link className="link-btn" to="/app/categories">Categories</Link>, <Link className="link-btn" to="/app/locations">Storage Locations</Link> and{" "}
        <Link className="link-btn" to="/app/suppliers">Suppliers</Link> from their own pages.
      </p>
    </div>
  );
}
