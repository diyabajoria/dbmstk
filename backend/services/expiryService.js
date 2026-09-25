const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Classify a batch's expiry status from its expiryDate, computed dynamically
 * (never stored) so it's always accurate relative to "now".
 *
 * Six granular tiers, most urgent first:
 *   days < 0    -> EXPIRED
 *   days === 0  -> EXPIRES_TODAY
 *   days <= 3   -> EXPIRES_3_DAYS
 *   days <= 7   -> EXPIRING_SOON   (aka EXPIRES_7_DAYS)
 *   days <= 30  -> EXPIRING_THIS_MONTH (aka EXPIRES_30_DAYS)
 *   otherwise   -> SAFE
 */
function daysToExpiry(expiryDate, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(expiryDate);
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endDay - start) / MS_PER_DAY);
}

function getExpiryStatus(expiryDate, now = new Date()) {
  const days = daysToExpiry(expiryDate, now);
  if (days < 0) return "EXPIRED";
  if (days === 0) return "EXPIRES_TODAY";
  if (days <= 3) return "EXPIRES_3_DAYS";
  if (days <= 7) return "EXPIRING_SOON";
  if (days <= 30) return "EXPIRING_THIS_MONTH";
  return "SAFE";
}

/**
 * Human-friendly label for a given days-to-expiry count, e.g.
 * "Expired 2 days ago", "Expires today", "Expires tomorrow",
 * "Expires in 3 days", "Expires in 3 weeks", "Safe".
 */
function getHumanExpiryLabel(days) {
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  if (days === -1) return "Expired yesterday";
  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days <= 7) return `Expires in ${days} days`;
  if (days <= 30) {
    const weeks = Math.round(days / 7);
    return `Expires in ${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  if (days <= 365) {
    const months = Math.round(days / 30);
    return `Safe — expires in ${months} month${months === 1 ? "" : "s"}`;
  }
  return "Safe";
}

const TIER_COLORS = {
  EXPIRED: "#DC2626",
  EXPIRES_TODAY: "#DC2626",
  EXPIRES_3_DAYS: "#D97706",
  EXPIRING_SOON: "#D97706",
  EXPIRING_THIS_MONTH: "#4A7C59",
  SAFE: "#1E3A2B",
};

/**
 * Full badge info for a batch's expiry date: tier, days left, human label,
 * and a suggested color (used by the frontend as a fallback / for exports).
 */
function getExpiryBadgeInfo(expiryDate, now = new Date()) {
  const days = daysToExpiry(expiryDate, now);
  const tier = getExpiryStatus(expiryDate, now);
  return {
    tier,
    daysLeft: days,
    label: getHumanExpiryLabel(days),
    color: TIER_COLORS[tier],
  };
}

/**
 * Given an item document, return the nearest (soonest) expiry date among
 * batches that still have remainingQuantity > 0, plus its status/label.
 */
function getNearestExpiry(item, now = new Date()) {
  const activeBatches = item.batches.filter((b) => b.remainingQuantity > 0);
  if (activeBatches.length === 0) return null;

  const nearest = activeBatches.reduce((a, b) => (a.expiryDate < b.expiryDate ? a : b));
  const badge = getExpiryBadgeInfo(nearest.expiryDate, now);
  return {
    batchNumber: nearest.batchNumber,
    expiryDate: nearest.expiryDate,
    status: badge.tier,
    daysLeft: badge.daysLeft,
    label: badge.label,
  };
}

module.exports = {
  getExpiryStatus,
  daysToExpiry,
  getHumanExpiryLabel,
  getExpiryBadgeInfo,
  getNearestExpiry,
};
