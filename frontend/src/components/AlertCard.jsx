import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { formatRelativeTime } from "../utils/formatters";

const TYPE_STATUS = {
  EXPIRED: "EXPIRED",
  EXPIRING_SOON: "EXPIRING_SOON",
  LOW_STOCK: "LOW_STOCK",
  RESTOCK: "OK",
};

const SEVERITY_LABEL = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };

export default function AlertCard({ alert, onMarkRead }) {
  const navigate = useNavigate();
  const itemId = alert.itemId?._id || alert.itemId;

  return (
    <div
      className="card"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
        borderLeft: `4px solid ${alert.severity === "HIGH" ? "var(--terracotta)" : alert.severity === "MEDIUM" ? "var(--amber)" : "var(--accent)"}`,
        opacity: alert.isRead ? 0.55 : 1,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <span className={`badge badge-severity-${alert.severity}`}>{SEVERITY_LABEL[alert.severity] || alert.severity}</span>
          <StatusBadge status={TYPE_STATUS[alert.type]} />
        </div>
        <div style={{ fontSize: "0.9rem" }}>{alert.message}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>{formatRelativeTime(alert.createdAt)}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {itemId && (alert.type === "LOW_STOCK" || alert.type === "RESTOCK") && (
          <button className="btn btn-amber btn-sm" onClick={() => navigate(`/app/purchases?itemId=${itemId}`)}>🛒 Restock</button>
        )}
        {itemId && (alert.type === "EXPIRED" || alert.type === "EXPIRING_SOON") && (
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/app/consumption?itemId=${itemId}`)}>🥣 Consume Now</button>
        )}
        {itemId && (
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/app/inventory/${itemId}`)}>👁️ View</button>
        )}
        {!alert.isRead && (
          <button className="btn btn-sm" onClick={() => onMarkRead(alert._id)}>✕ Resolve</button>
        )}
      </div>
    </div>
  );
}
