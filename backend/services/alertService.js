const Item = require("../models/Item");
const Alert = require("../models/Alert");
const { getExpiryStatus } = require("./expiryService");
const { getCurrentStock, isLowStock } = require("./stockService");
const { getRestockRecommendation } = require("./restockService");

const URGENT_TIERS = [
  "EXPIRED",
  "EXPIRES_TODAY",
  "EXPIRES_3_DAYS",
  "EXPIRING_SOON",
];

/**
 * Scans items belonging to one household and upserts alerts for:
 *   - EXPIRED / EXPIRES_TODAY / EXPIRES_3_DAYS / EXPIRING_SOON batches
 *   - LOW_STOCK items
 *   - RESTOCK recommendations
 *
 * If householdId is provided, only that household is scanned.
 * If omitted, all households are scanned (used by the scheduled server scan).
 */
async function runAlertScan(householdId = null) {
  const itemQuery = householdId ? { householdId } : {};

  const items = await Item.find(itemQuery);

  const results = {
    created: 0,
    updated: 0,
  };

  for (const item of items) {
    // Expiry alerts, per batch
    for (const b of item.batches) {
      if (b.remainingQuantity <= 0) continue;

      const status = getExpiryStatus(b.expiryDate);

      if (!URGENT_TIERS.includes(status)) continue;

      const severity =
        status === "EXPIRING_SOON" ? "MEDIUM" : "HIGH";

      const messages = {
        EXPIRED: `${item.name} (batch ${b.batchNumber}) has expired.`,
        EXPIRES_TODAY: `${item.name} (batch ${b.batchNumber}) expires today.`,
        EXPIRES_3_DAYS: `${item.name} (batch ${b.batchNumber}) expires within 3 days.`,
        EXPIRING_SOON: `${item.name} (batch ${b.batchNumber}) expires within 7 days.`,
      };

      const message = messages[status];

      const alertType =
        status === "EXPIRED" || status === "EXPIRES_TODAY"
          ? "EXPIRED"
          : "EXPIRING_SOON";

      const result = await Alert.findOneAndUpdate(
        {
          householdId: item.householdId,
          itemId: item._id,
          batchNumber: b.batchNumber,
          type: alertType,
        },
        {
          householdId: item.householdId,
          message,
          severity,
          isRead: false,
        },
        {
          upsert: true,
          new: true,
          rawResult: true,
        }
      );

      result.lastErrorObject?.updatedExisting
        ? results.updated++
        : results.created++;
    }

    // Low stock alert
    if (isLowStock(item)) {
      const result = await Alert.findOneAndUpdate(
        {
          householdId: item.householdId,
          itemId: item._id,
          type: "LOW_STOCK",
        },
        {
          householdId: item.householdId,
          message: `${item.name} is below minimum stock (${getCurrentStock(
            item
          )} / ${item.minimumStock}).`,
          severity: "MEDIUM",
          isRead: false,
        },
        {
          upsert: true,
          new: true,
          rawResult: true,
        }
      );

      result.lastErrorObject?.updatedExisting
        ? results.updated++
        : results.created++;
    }

    // Restock recommendation alert
    const rec = await getRestockRecommendation(item);

    if (rec) {
      const result = await Alert.findOneAndUpdate(
        {
          householdId: item.householdId,
          itemId: item._id,
          type: "RESTOCK",
        },
        {
          householdId: item.householdId,
          message: `Consider restocking ${item.name}: ~${rec.recommendedPurchase} ${item.unit} recommended for the next 30 days.`,
          severity: "LOW",
          isRead: false,
        },
        {
          upsert: true,
          new: true,
          rawResult: true,
        }
      );

      result.lastErrorObject?.updatedExisting
        ? results.updated++
        : results.created++;
    }
  }

  return results;
}

module.exports = {
  runAlertScan,
};