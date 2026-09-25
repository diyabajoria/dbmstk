import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  getSpendingReport,
  getConsumptionReport,
  getCategoryReport,
  getWasteReport,
  getExpiryReport,
} from "../services/reportService";
import DataTable from "../components/DataTable";
import StatsCard from "../components/StatsCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { formatCurrency, formatDate } from "../utils/formatters";
import { ChartTooltip } from "./Dashboard";

const TABS = ["Spending", "Consumption", "Category", "Waste", "Expiry"];
const TAB_ICONS = { Spending: "💰", Consumption: "🥣", Category: "🗂️", Waste: "🗑️", Expiry: "⏳" };
const GRAD = (
  <defs>
    <linearGradient id="repFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#34d399" />
      <stop offset="100%" stopColor="#14532d" />
    </linearGradient>
  </defs>
);

function presetRange(preset) {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  let from;
  if (preset === "7d") from = new Date(now - 7 * 86400000);
  else if (preset === "30d") from = new Date(now - 30 * 86400000);
  else if (preset === "month") from = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (preset === "lastMonth") from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  else return { from: undefined, to: undefined };
  return { from: from.toISOString().slice(0, 10), to };
}

export default function Reports() {
  const [tab, setTab] = useState("Spending");
  const [preset, setPreset] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState(null);
  const [expiryWindow, setExpiryWindow] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const range = preset === "custom" ? { from: customFrom || undefined, to: customTo || undefined } : presetRange(preset);
    setLoading(true);
    setError("");

    const fetchers = {
      Spending: () => getSpendingReport(range),
      Consumption: () => getConsumptionReport(range),
      Category: () => getCategoryReport(range),
      Waste: () => getWasteReport(range),
      Expiry: () => getExpiryReport({ ...range, days: expiryWindow }),
    };

    fetchers[tab]()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load report"))
      .finally(() => setLoading(false));
  }, [tab, preset, customFrom, customTo, expiryWindow]);

  return (
    <div>
      <h2 className="page-title">Reports & Spending</h2>
      <p className="page-subtitle">Spending analytics, category distribution, consumption patterns and waste prevention.</p>

      <div className="toolbar" style={{ overflowX: "auto", flexWrap: "nowrap", paddingBottom: 2 }}>
        <div className="segmented">
          {TABS.map((t) => (
            <button key={t} className={t === tab ? "active" : ""} onClick={() => setTab(t)}>
              {TAB_ICONS[t]} {t}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <select value={preset} onChange={(e) => setPreset(e.target.value)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="month">This month</option>
          <option value="lastMonth">Last month</option>
          <option value="all">All time</option>
          <option value="custom">Custom range</option>
        </select>
        {preset === "custom" && (
          <>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </>
        )}
        {tab === "Expiry" && (
          <select value={expiryWindow} onChange={(e) => setExpiryWindow(Number(e.target.value))}>
            <option value={7}>Next 7 days</option>
            <option value={30}>Next 30 days</option>
          </select>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? <LoadingSpinner variant="inline" /> : <div key={tab} className="page-transition"><ReportBody tab={tab} data={data} /></div>}
    </div>
  );
}

function ReportBody({ tab, data }) {
  if (!data) return null;

  if (tab === "Spending") {
    if (data.length === 0) return <EmptyState message="No purchase data in this range." />;
    const chartData = data.map((d) => ({ label: `${d._id.month}/${d._id.year}`, totalSpent: d.totalSpent }));
    const totalSpent = data.reduce((s, d) => s + d.totalSpent, 0);
    const totalTrips = data.reduce((s, d) => s + d.purchaseCount, 0);
    const avgPerTrip = totalTrips ? totalSpent / totalTrips : 0;
    return (
      <div>
        <div className="stats-grid stagger">
          <StatsCard icon="💰" label="Total Spend" value={totalSpent} format={formatCurrency} />
          <StatsCard icon="🛒" label="Shopping Trips" value={totalTrips} tone="info" />
          <StatsCard icon="🧾" label="Avg Spend / Trip" value={avgPerTrip} format={formatCurrency} tone="warning" />
        </div>
        <div className="card">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
              {GRAD}
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e9e3" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5f6f66" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5f6f66" }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(16,185,129,0.08)" }} />
              <Bar dataKey="totalSpent" fill="url(#repFill)" radius={[8, 8, 0, 0]} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (tab === "Consumption") {
    return (
      <div className="card">
        <div className="table-wrap">
          <DataTable
            columns={[
              { key: "itemName", header: "Item" },
              { key: "totalConsumed", header: "Total Consumed" },
              { key: "events", header: "# Transactions" },
            ]}
            rows={data}
            emptyMessage="No consumption in this range."
          />
        </div>
      </div>
    );
  }

  if (tab === "Category") {
    if (data.length === 0) return <EmptyState message="No purchase data in this range." />;
    return (
      <div className="card">
        <ResponsiveContainer width="100%" height={Math.max(260, data.length * 38)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 10, bottom: 0 }}>
            {GRAD}
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e9e3" horizontal={false} />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#5f6f66" }} />
            <YAxis type="category" dataKey="_id" width={130} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#0f1a14" }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(16,185,129,0.08)" }} />
            <Bar dataKey="totalSpent" fill="url(#repFill)" radius={[0, 8, 8, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (tab === "Waste") {
    return (
      <div className="stats-grid stagger">
        <StatsCard icon="🗑️" label="Expired Batches" value={data.expiredBatchCount || 0} tone="danger" />
        <StatsCard icon="⚖️" label="Total Waste Qty" value={data.totalWasteQty?.toFixed(1)} tone="warning" />
        <StatsCard icon="💸" label="Value Lost to Waste" value={Number(data.totalWasteValue) || 0} format={formatCurrency} tone="danger" />
      </div>
    );
  }

  if (tab === "Expiry") {
    return (
      <div className="card">
        <div className="table-wrap">
          <DataTable
            columns={[
              { key: "name", header: "Item" },
              { key: "batchNumber", header: "Batch #" },
              { key: "expiryDate", header: "Expiry Date", render: (r) => formatDate(r.expiryDate) },
              { key: "remainingQuantity", header: "Remaining Qty" },
            ]}
            rows={data}
            emptyMessage="Nothing expiring in this window."
          />
        </div>
      </div>
    );
  }

  return null;
}
