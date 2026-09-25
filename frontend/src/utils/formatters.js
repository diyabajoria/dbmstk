// Indian-locale formatting helpers used throughout the app.

export function formatCurrency(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatIndianNumber(num) {
  return new Intl.NumberFormat("en-IN").format(Number(num) || 0);
}

export function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

export function formatRelativeDate(date) {
  if (!date) return "—";
  const target = new Date(date);
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfDay(target) - startOfDay(now)) / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days <= 30) return `in ${days} days`;
  if (days < -1 && days >= -30) return `${Math.abs(days)} days ago`;
  return formatDate(date);
}

export function formatRelativeTime(date) {
  if (!date) return "—";
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(date);
}

const TIER_META = {
  EXPIRED: { color: "#DC2626", bg: "#FDECEC", label: "Expired" },
  EXPIRES_TODAY: { color: "#DC2626", bg: "#FDECEC", label: "Expires today" },
  EXPIRES_3_DAYS: { color: "#B45309", bg: "#FEF3E2", label: "Expiring very soon" },
  EXPIRING_SOON: { color: "#D97706", bg: "#FEF3E2", label: "Expiring soon" },
  EXPIRING_THIS_MONTH: { color: "#4A7C59", bg: "#E8F0EA", label: "Expiring this month" },
  SAFE: { color: "#1E3A2B", bg: "#E8F0EA", label: "Safe" },
};

/**
 * Given an expiry date, returns { tier, daysLeft, label, color, bg } —
 * mirrors the backend's expiryService tiers/labels for use before an API
 * round trip (e.g. optimistic UI) or for display-only computations.
 */
export function getExpiryBadgeInfo(expiryDate) {
  if (!expiryDate) return { tier: "SAFE", daysLeft: null, label: "—", color: "#6b7280", bg: "#f1f3f5" };

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(expiryDate);
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const days = Math.round((endDay - start) / (1000 * 60 * 60 * 24));

  let tier = "SAFE";
  if (days < 0) tier = "EXPIRED";
  else if (days === 0) tier = "EXPIRES_TODAY";
  else if (days <= 3) tier = "EXPIRES_3_DAYS";
  else if (days <= 7) tier = "EXPIRING_SOON";
  else if (days <= 30) tier = "EXPIRING_THIS_MONTH";

  let label;
  if (days === 0) label = "Expires today";
  else if (days === 1) label = "Expires tomorrow";
  else if (days === -1) label = "Expired yesterday";
  else if (days < 0) label = `Expired ${Math.abs(days)} days ago`;
  else if (days <= 7) label = `Expires in ${days} days`;
  else if (days <= 30) label = `Expires in ${Math.round(days / 7)} weeks`;
  else label = "Safe";

  return { tier, daysLeft: days, label, ...TIER_META[tier] };
}

export const INDIAN_UNITS = ["kg", "g", "L", "ml", "pcs", "packet", "box", "bottle", "dozen"];
