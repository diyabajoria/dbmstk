const STYLES = {
  SAFE: "badge-safe",
  EXPIRING_THIS_MONTH: "badge-info",
  EXPIRING_SOON: "badge-warning",
  EXPIRES_3_DAYS: "badge-warning",
  EXPIRES_TODAY: "badge-danger",
  EXPIRED: "badge-danger",
  LOW_STOCK: "badge-danger",
  OK: "badge-safe",
};

const LABELS = {
  SAFE: "Safe",
  EXPIRING_THIS_MONTH: "Expiring this month",
  EXPIRING_SOON: "Expiring soon",
  EXPIRES_3_DAYS: "Expiring very soon",
  EXPIRES_TODAY: "Expires today",
  EXPIRED: "Expired",
  LOW_STOCK: "Low stock",
  OK: "OK",
};

export default function StatusBadge({ status, label }) {
  if (!status) return <span className="badge badge-muted">—</span>;
  return <span className={`badge ${STYLES[status] || "badge-muted"}`}>{label || LABELS[status] || status}</span>;
}
