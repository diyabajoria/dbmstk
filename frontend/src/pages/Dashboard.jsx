import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from "recharts";
import { getDashboardSummary } from "../services/dashboardService";
import { recordConsumption } from "../services/consumptionService";
import StatsCard from "../components/StatsCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import SampleDataHero from "../components/SampleDataHero";
import { formatCurrency, formatRelativeTime } from "../utils/formatters";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

const COLORS = ["#14532d", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#06b6d4", "#84cc16", "#ec4899", "#78716c"];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function ChartTooltip({ active, payload, label, money = true, suffix = "" }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="ct-label">{label ?? p.name}</div>
      <div className="ct-value">{money ? formatCurrency(p.value) : `${Number(p.value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}${suffix}`}</div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  function load() {
    setLoading((l) => l && !summary);
    getDashboardSummary()
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function quickConsume(itemId) {
    try {
      await recordConsumption({ itemId, quantity: 1 });
      toast?.success("Recorded 1 unit used.");
      load();
    } catch (err) {
      toast?.error(err.response?.data?.error || "Failed to record consumption");
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-banner">{error}</div>;
  if (!summary) return null;

  const firstName = user?.name?.split(" ")[0] || "there";
  const isEmpty = !summary.totalItems;
  const totalCat = (summary.categoryBreakdown || []).reduce((s, c) => s + c.value, 0);

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h2 className="page-title">
            {greeting()}, <span className="gradient-text">{firstName}</span> 👋
          </h2>
          <p className="page-subtitle">Here's what's happening in your household today.</p>
        </div>
      </div>

      {isEmpty && <SampleDataHero onLoaded={load} />}

      <div className="quick-actions stagger">
        <button className="quick-action primary" onClick={() => navigate("/app/purchases")}>
          <span className="qa-icon">🛒</span>
          <span>Record Purchase<small>Log a shopping run</small></span>
        </button>
        <button className="quick-action" onClick={() => navigate("/app/consumption")}>
          <span className="qa-icon">🥣</span>
          <span>Record Usage<small>FEFO picks the batch</small></span>
        </button>
        <button className="quick-action" onClick={() => navigate("/app/shopping-list")}>
          <span className="qa-icon" style={{ background: "var(--amber-bg)" }}>📋</span>
          <span>Shopping List<small>{summary.lowStockCount || 0} to restock</small></span>
        </button>
        <button className="quick-action" onClick={() => navigate("/app/inventory")}>
          <span className="qa-icon" style={{ background: "var(--info-bg)" }}>📦</span>
          <span>Inventory<small>{summary.totalItems} items</small></span>
        </button>
      </div>

      <div className="stats-grid stagger">
        <StatsCard icon="💰" label="Inventory Value" value={Number(summary.totalInventoryValue) || 0} format={formatCurrency} />
        <StatsCard icon="📦" label="Total Items" value={summary.totalItems || 0} tone="info" />
        <StatsCard icon="📉" label="Running Low" value={summary.lowStockCount || 0} tone="warning" />
        <StatsCard icon="⏳" label="Expiring Soon" value={summary.expiringSoonCount || 0} tone="warning" sub="within 7 days" />
        <StatsCard icon="🗑️" label="Expired" value={summary.expiredCount || 0} tone="danger" />
      </div>

      {summary.needsAttention?.length > 0 && (
        <div className="card attention-card">
          <div className="section-title" style={{ color: "var(--terracotta)" }}>⚠️ Needs attention</div>
          {summary.needsAttention.map((a, idx) => (
            <div key={idx} className="list-row">
              <span style={{ fontSize: "0.88rem", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span className={`badge badge-severity-${a.severity}`}>{a.severity}</span>
                {a.message}
              </span>
              {a.itemId && <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/app/inventory/${a.itemId}`)}>View</button>}
            </div>
          ))}
        </div>
      )}

      <div className="grid-2 mb-20">
        <div className="card">
          <div className="card-header">
            <div className="section-title">📈 Monthly spending</div>
            <button className="link-btn" onClick={() => navigate("/app/reports")}>Reports →</button>
          </div>
          {!summary.spendingTrend?.some((d) => d.total > 0) ? (
            <EmptyState message="No purchases yet — your spending trend will appear here." icon="📈" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={summary.spendingTrend} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3e9e3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5f6f66" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#5f6f66" }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#10b981", strokeDasharray: 4 }} />
                <Area type="monotone" dataKey="total" stroke="#14532d" strokeWidth={2.5} fill="url(#spendFill)" dot={{ r: 3, fill: "#14532d" }} activeDot={{ r: 6 }} animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="section-title">🥧 Inventory value by category</div>
          {!summary.categoryBreakdown?.length ? (
            <EmptyState message="Add items to see how your stock value splits by category." icon="🥧" />
          ) : (
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={summary.categoryBreakdown} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3} cornerRadius={6} animationDuration={1100}>
                    {summary.categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend-list">
                {summary.categoryBreakdown.slice(0, 7).map((c, i) => (
                  <div className="lg" key={c.name}>
                    <span className="sw" style={{ background: COLORS[i % COLORS.length] }} />
                    <span>{c.name}</span>
                    <span className="v">{totalCat ? Math.round((c.value / totalCat) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card mb-20">
        <div className="section-title">🥣 Consumption — last 30 days</div>
        {!summary.consumptionTrend?.length ? (
          <EmptyState message="No usage recorded in the last 30 days." icon="🥣" />
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={summary.consumptionTrend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#14532d" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e9e3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5f6f66" }} axisLine={false} tickLine={false} minTickGap={12} />
              <YAxis tick={{ fontSize: 11, fill: "#5f6f66" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip money={false} suffix=" units" />} cursor={{ fill: "rgba(16,185,129,0.08)" }} />
              <Bar dataKey="totalQuantity" fill="url(#barFill)" name="Quantity used" radius={[6, 6, 0, 0]} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid-2 mb-20">
        <div className="card">
          <div className="section-title">⏳ Expiring soon</div>
          {!summary.expiringItems?.length ? (
            <EmptyState message="Nothing expiring in the next 7 days." icon="✅" />
          ) : (
            summary.expiringItems.map((it, idx) => (
              <div key={idx} className="list-row">
                <div style={{ minWidth: 0 }}>
                  <div className="title">{it.name} {it.brand ? <span className="muted" style={{ fontWeight: 500 }}>({it.brand})</span> : ""}</div>
                  <div className="meta">Batch {it.batchNumber} · {it.remainingQuantity} {it.unit} left</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <StatusBadge status={it.daysLeft <= 0 ? "EXPIRES_TODAY" : it.daysLeft <= 3 ? "EXPIRES_3_DAYS" : "EXPIRING_SOON"} label={it.label} />
                  <button className="btn btn-secondary btn-sm" onClick={() => quickConsume(it.itemId)}>Use 1</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="section-title">📉 Low stock & restock</div>
          {!summary.lowStockItems?.length ? (
            <EmptyState message="Everything is well stocked." icon="🎉" />
          ) : (
            summary.lowStockItems.map((it, idx) => {
              const pct = it.minimumStock ? Math.min(100, (it.currentStock / it.minimumStock) * 100) : 0;
              return (
                <div key={idx} className="list-row">
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div className="title">{it.name} {it.brand ? <span className="muted" style={{ fontWeight: 500 }}>({it.brand})</span> : ""}</div>
                    <div className="meta">{it.currentStock} / {it.minimumStock} {it.unit} · suggest +{it.suggestedRestock} {it.unit}</div>
                    <div className={`progress ${pct < 30 ? "danger" : "warn"}`}><span style={{ width: `${Math.max(pct, 4)}%` }} /></div>
                  </div>
                  <button className="btn btn-amber btn-sm" onClick={() => navigate(`/app/purchases?itemId=${it.itemId}&qty=${it.suggestedRestock}`)}>
                    🛒 Restock
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-title">🕒 Recent household activity</div>
        {!summary.recentActivity?.length ? (
          <EmptyState message="No activity recorded yet." icon="🕒" />
        ) : (
          summary.recentActivity.map((a) => (
            <div key={a.id} className="activity-item">
              <span className={`activity-dot ${a.type === "PURCHASE" ? "" : "consume"}`}>{a.type === "PURCHASE" ? "🛒" : "🥣"}</span>
              <span>{a.description}</span>
              <span className="when">{formatRelativeTime(a.date)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
