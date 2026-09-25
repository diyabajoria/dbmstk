const Transaction = require("../models/Transaction");
const { getCurrentStock } = require("./stockService");

/**
 * Rule-based (no ML) restock recommendation:
 *   avgDailyConsumption = totalConsumedInPeriod / days
 *   thirtyDayRequirement = avgDailyConsumption * 30
 *   recommendedPurchase  = thirtyDayRequirement - currentStock
 * Only returned if recommendedPurchase > 0.
 */
async function getRestockRecommendation(item, periodDays = 30) {
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const consumedAgg = await Transaction.aggregate([
    { $match: { itemId: item._id, type: "CONSUMPTION", date: { $gte: since } } },
    { $group: { _id: "$itemId", totalConsumed: { $sum: "$quantity" } } },
  ]);

  const totalConsumed = consumedAgg[0]?.totalConsumed || 0;
  const avgDailyConsumption = totalConsumed / periodDays;
  const thirtyDayRequirement = avgDailyConsumption * 30;
  const currentStock = getCurrentStock(item);
  const recommendedPurchase = thirtyDayRequirement - currentStock;

  if (recommendedPurchase <= 0) return null;

  return {
    itemId: item._id,
    name: item.name,
    currentStock,
    avgDailyConsumption: Number(avgDailyConsumption.toFixed(2)),
    thirtyDayRequirement: Number(thirtyDayRequirement.toFixed(2)),
    recommendedPurchase: Number(recommendedPurchase.toFixed(2)),
  };
}

module.exports = { getRestockRecommendation };
