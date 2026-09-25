const Item = require("../models/Item");
const Alert = require("../models/Alert");
const { getExpiryStatus } = require("./expiryService");
const { getCurrentStock, isLowStock } = require("./stockService");
const { getRestockRecommendation } = require("./restockService");

const URGENT_TIERS = ["EXPIRED", "EXPIRES_TODAY", "EXPIRES_3_DAYS", "EXPIRING_SOON"];

/**
 * Scans every item and upserts alerts for:
 *   - EXPIRED / EXPIRES_TODAY / EXPIRES_3_DAYS / EXPIRING_SOON batches (remainingQuantity > 0)
 *   - LOW_STOCK items (currentStock < minimumStock)
 *   - RESTOCK recommendations (recommendedPurchase > 0)
 *
 * Idempotent: uses findOneAndUpdate with upsert so re-running the scan
 * (e.g. on a daily cron, or on-demand from the dashboard) doesn't create
 * duplicate alerts for the same item/batch/type — it just refreshes the
 * message/severity and createdAt.
 */
async function runAlertScan() {
  const items = await Item.find();
  const results = { created: 0, updated: 0 };

  for (const item of items) {
    // Expiry alerts, per batch
    for (const b of item.batches) {
      if (b.remainingQuantity <= 0) continue;
      const status = getExpiryStatus(b.expiryDate);
      if (!URGENT_TIERS.includes(status)) continue;

      const severity = status === "EXPIRING_SOON" ? "MEDIUM" : "HIGH";
      const messages = {
        EXPIRED: `${item.name} (batch ${b.batchNumber}) has expired.`,
        EXPIRES_TODAY: `${item.name} (batch ${b.batchNumber}) expires today.`,
        EXPIRES_3_DAYS: `${item.name} (batch ${b.batchNumber}) expires within 3 days.`,
        EXPIRING_SOON: `${item.name} (batch ${b.batchNumber}) expires within 7 days.`,
      };
      const message = messages[status];
      const alertType = status === "EXPIRED" || status === "EXPIRES_TODAY" ? "EXPIRED" : "EXPIRING_SOON";

      const res = await Alert.findOneAndUpdate(
        { itemId: item._id, batchNumber: b.batchNumber, type: alertType },
        { message, severity, isRead: false },
        { upsert: true, new: true, rawResult: true }
      );
      res.lastErrorObject?.updatedExisting ? results.updated++ : results.created++;
    }

    // Low stock alert
    if (isLowStock(item)) {
      const res = await Alert.findOneAndUpdate(
        { itemId: item._id, type: "LOW_STOCK" },
        {
          message: `${item.name} is below minimum stock (${getCurrentStock(item)} / ${item.minimumStock}).`,
          severity: "MEDIUM",
          isRead: false,
        },
        { upsert: true, new: true, rawResult: true }
      );
      res.lastErrorObject?.updatedExisting ? results.updated++ : results.created++;
    }

    // Restock recommendation alert
    const rec = await getRestockRecommendation(item);
    if (rec) {
      const res = await Alert.findOneAndUpdate(
        { itemId: item._id, type: "RESTOCK" },
        {
          message: `Consider restocking ${item.name}: ~${rec.recommendedPurchase} ${item.unit} recommended for the next 30 days.`,
          severity: "LOW",
          isRead: false,
        },
        { upsert: true, new: true, rawResult: true }
      );
      res.lastErrorObject?.updatedExisting ? results.updated++ : results.created++;
    }
  }

  return results;
}

module.exports = { runAlertScan };
