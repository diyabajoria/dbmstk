const Item = require("../models/Item");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const { getExpiryStatus, getExpiryBadgeInfo, getNearestExpiry } = require("../services/expiryService");
const { getCurrentStock, isLowStock } = require("../services/stockService");
const { getRestockRecommendation } = require("../services/restockService");

function monthsAgoRange(n) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - n, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - n + 1, 1);
  return { start, end };
}

/**
 * Single, dashboard-ready aggregated payload — everything the household
 * command center needs in one round trip.
 */
async function dashboardSummary(req, res, next) {
  try {
    const items = await Item.find().populate("categoryId locationId");
    const categories = await Category.find();

    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let expiringSoonCount = 0; // within 7 days
    let expiredCount = 0;

    const expiringItems = [];
    const lowStockItems = [];
    const needsAttention = [];
    const categoryValueMap = {}; // categoryId -> { value, count, name }

    for (const item of items) {
      const currentStock = getCurrentStock(item);
      const low = isLowStock(item);
      if (low) lowStockCount++;

      const catId = item.categoryId?._id?.toString() || "uncategorised";
      const catName = item.categoryId?.name || "Uncategorised";
      if (!categoryValueMap[catId]) categoryValueMap[catId] = { name: catName, value: 0, itemCount: 0 };
      categoryValueMap[catId].itemCount++;

      let itemValue = 0;
      for (const b of item.batches) {
        if (b.remainingQuantity <= 0) continue;
        itemValue += b.remainingQuantity * b.pricePerUnit;

        const badge = getExpiryBadgeInfo(b.expiryDate);
        if (badge.tier === "EXPIRED") {
          expiredCount++;
          needsAttention.push({
            type: "EXPIRED",
            severity: "HIGH",
            itemId: item._id,
            name: item.name,
            batchNumber: b.batchNumber,
            message: `${item.name} (batch ${b.batchNumber}) has expired — ${b.remainingQuantity} ${item.unit} to dispose.`,
          });
        } else if (["EXPIRES_TODAY", "EXPIRES_3_DAYS", "EXPIRING_SOON"].includes(badge.tier)) {
          expiringSoonCount++;
          expiringItems.push({
            itemId: item._id,
            name: item.name,
            brand: item.brand,
            batchNumber: b.batchNumber,
            expiryDate: b.expiryDate,
            daysLeft: badge.daysLeft,
            label: badge.label,
            remainingQuantity: b.remainingQuantity,
            unit: item.unit,
          });
          if (badge.tier === "EXPIRES_TODAY" || badge.tier === "EXPIRES_3_DAYS") {
            needsAttention.push({
              type: "EXPIRING_SOON",
              severity: "HIGH",
              itemId: item._id,
              name: item.name,
              batchNumber: b.batchNumber,
              message: `${item.name} (batch ${b.batchNumber}) ${badge.label.toLowerCase()}. ${b.remainingQuantity} ${item.unit} remaining.`,
            });
          }
        }
      }

      totalInventoryValue += itemValue;
      categoryValueMap[catId].value += itemValue;

      if (low) {
        const rec = await getRestockRecommendation(item);
        lowStockItems.push({
          itemId: item._id,
          name: item.name,
          brand: item.brand,
          currentStock,
          minimumStock: item.minimumStock,
          unit: item.unit,
          suggestedRestock: rec ? rec.recommendedPurchase : Math.max(item.minimumStock - currentStock, 0),
        });
        needsAttention.push({
          type: "LOW_STOCK",
          severity: currentStock === 0 ? "HIGH" : "MEDIUM",
          itemId: item._id,
          name: item.name,
          message: `${item.name} is running low: ${currentStock} / ${item.minimumStock} ${item.unit}.`,
        });
      }
    }

    // Sort & trim the "top 5" widgets
    expiringItems.sort((a, b) => a.daysLeft - b.daysLeft);
    const topExpiringItems = expiringItems.slice(0, 5);

    // needsAttention priority: HIGH before MEDIUM before LOW
    const severityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    needsAttention.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

    const categoryBreakdown = Object.values(categoryValueMap)
      .map((c) => ({ name: c.name, value: Math.round(c.value * 100) / 100, itemCount: c.itemCount }))
      .sort((a, b) => b.value - a.value);

    // Monthly spending (current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const spendingAgg = await Transaction.aggregate([
      { $match: { type: "PURCHASE", date: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const monthlySpending = spendingAgg[0]?.total || 0;

    // Spending trend — last 6 months (including current), oldest first
    const spendingTrend = [];
    for (let i = 5; i >= 0; i--) {
      const { start, end } = monthsAgoRange(i);
      const agg = await Transaction.aggregate([
        { $match: { type: "PURCHASE", date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]);
      spendingTrend.push({
        month: start.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        total: Math.round((agg[0]?.total || 0) * 100) / 100,
      });
    }

    // Consumption trend — last 30 days, grouped by day
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const consumptionAgg = await Transaction.aggregate([
      { $match: { type: "CONSUMPTION", date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalQuantity: { $sum: "$quantity" },
          events: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const consumptionTrend = consumptionAgg.map((d) => ({
      date: d._id,
      totalQuantity: d.totalQuantity,
      events: d.events,
    }));

    // Recent activity — merged purchase + consumption stream, human-readable
    const [recentPurchases, recentConsumption] = await Promise.all([
      Transaction.find({ type: "PURCHASE" }).populate("itemId supplierId").sort({ date: -1 }).limit(10),
      Transaction.find({ type: "CONSUMPTION" }).populate("itemId").sort({ date: -1 }).limit(10),
    ]);

    const recentActivity = [
      ...recentPurchases.map((p) => ({
        id: p._id,
        type: "PURCHASE",
        date: p.date,
        description: `Purchased ${p.quantity} ${p.itemId?.unit || ""} ${p.itemId?.name || "item"} for ₹${(p.totalAmount || 0).toFixed(0)}`.replace(/\s+/g, " "),
      })),
      ...recentConsumption.map((c) => ({
        id: c._id,
        type: "CONSUMPTION",
        date: c.date,
        description: `Consumed ${c.quantity} ${c.itemId?.unit || ""} ${c.itemId?.name || "item"}`.replace(/\s+/g, " "),
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({
      totalItems: items.length,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      lowStockCount,
      expiringSoonCount,
      expiredCount,
      monthlySpending: Math.round(monthlySpending * 100) / 100,
      categoryBreakdown,
      spendingTrend,
      consumptionTrend,
      expiringItems: topExpiringItems,
      lowStockItems,
      needsAttention: needsAttention.slice(0, 8),
      recentActivity,

      // Legacy field names kept for backward compatibility with older callers
      lowStock: lowStockCount,
      expiringSoon: expiringSoonCount,
      expired: expiredCount,
      restockRecommendations: lowStockItems.map((i) => ({
        itemId: i.itemId,
        name: i.name,
        currentStock: i.currentStock,
        recommendedPurchase: i.suggestedRestock,
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboardSummary };
